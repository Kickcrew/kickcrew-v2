
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

interface Group {
  id: number;
  tournament_id: number;
  group_name: string;
  group_code: string | null;
  group_order: number;
  status: string | null;
}

interface GroupMember {
  id: number;
  tournament_group_id: number;
  registration_id: number;
  seed_number: number | null;
}

interface Registration {
  id: number;
  tournament_id: number;
  team_id: number | null;
  player_id: number | null;
  status: string;
}

interface ExistingMatch {
  id: number;
  tournament_id: number;
  team_a_id: number | null;
  team_b_id: number | null;
  player_a_id: number | null;
  player_b_id: number | null;
  round: string | null;
  match_number: number | null;
  status: string | null;
}

interface Participant {
  registrationId: number;
  teamId: number | null;
  playerId: number | null;
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function participantKey(
  participant: Participant
): string {
  if (participant.teamId !== null) {
    return `team:${participant.teamId}`;
  }

  if (participant.playerId !== null) {
    return `player:${participant.playerId}`;
  }

  return `registration:${participant.registrationId}`;
}

function unorderedPairKey(
  a: Participant,
  b: Participant
): string {
  return [
    participantKey(a),
    participantKey(b),
  ]
    .sort()
    .join("__");
}

function directedPairKey(
  a: Participant,
  b: Participant
): string {
  return `${participantKey(a)}__${participantKey(b)}`;
}

function existingUnorderedPairKey(
  match: ExistingMatch
): string | null {
  if (
    match.team_a_id !== null &&
    match.team_b_id !== null
  ) {
    return [
      `team:${match.team_a_id}`,
      `team:${match.team_b_id}`,
    ]
      .sort()
      .join("__");
  }

  if (
    match.player_a_id !== null &&
    match.player_b_id !== null
  ) {
    return [
      `player:${match.player_a_id}`,
      `player:${match.player_b_id}`,
    ]
      .sort()
      .join("__");
  }

  return null;
}

function existingDirectedPairKey(
  match: ExistingMatch
): string | null {
  if (
    match.team_a_id !== null &&
    match.team_b_id !== null
  ) {
    return `team:${match.team_a_id}__team:${match.team_b_id}`;
  }

  if (
    match.player_a_id !== null &&
    match.player_b_id !== null
  ) {
    return `player:${match.player_a_id}__player:${match.player_b_id}`;
  }

  return null;
}

function buildMatch(
  tournamentId: number,
  gameId: number | null,
  round: string,
  matchNumber: number,
  participantA: Participant,
  participantB: Participant
): Record<string, unknown> | null {
  /*
   * TEAM VS TEAM
   */

  if (
    participantA.teamId !== null &&
    participantB.teamId !== null
  ) {
    return {
      tournament_id: tournamentId,
      game_id: gameId,

      round,
      match_number: matchNumber,

      best_of: "BO1",

      scheduled_date: null,
      scheduled_time: null,

      winner_id: null,
      winner_team_id: null,
      winner_player_id: null,

      score_team_a: null,
      score_team_b: null,

      status: "Scheduled",

      stream_link: null,
      notes: null,

      team_a_id: participantA.teamId,
      team_b_id: participantB.teamId,

      player_a_id: null,
      player_b_id: null,
    };
  }

  /*
   * PLAYER VS PLAYER
   */

  if (
    participantA.playerId !== null &&
    participantB.playerId !== null
  ) {
    return {
      tournament_id: tournamentId,
      game_id: gameId,

      round,
      match_number: matchNumber,

      best_of: "BO1",

      scheduled_date: null,
      scheduled_time: null,

      winner_id: null,
      winner_team_id: null,
      winner_player_id: null,

      score_team_a: null,
      score_team_b: null,

      status: "Scheduled",

      stream_link: null,
      notes: null,

      team_a_id: null,
      team_b_id: null,

      player_a_id: participantA.playerId,
      player_b_id: participantB.playerId,
    };
  }

  /*
   * Never create a mixed or incomplete match.
   */

  return null;
}

export async function POST(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;

    const tournamentId = Number(id);

    if (
      !Number.isInteger(tournamentId) ||
      tournamentId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A valid tournament ID is required.",
        },
        { status: 400 }
      );
    }

    let body: Record<string, unknown> = {};

    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const fixtureFormat =
      body.fixtureFormat === "double_leg"
        ? "double_leg"
        : "single_leg";

    const supabase = await createClient();

    /*
     * ==========================================================
     * 1. TOURNAMENT
     * ==========================================================
     */

    const {
      data: tournament,
      error: tournamentError,
    } = await supabase
      .from("tournaments")
      .select(
        `
          id,
          tournament_name,
          tournament_type,
          game_id
        `
      )
      .eq("id", tournamentId)
      .single();

    if (
      tournamentError ||
      !tournament
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Tournament not found.",
        },
        { status: 404 }
      );
    }

    /*
     * ==========================================================
     * 2. GROUPS
     * ==========================================================
     */

    const {
      data: groups,
      error: groupsError,
    } = await supabase
      .from("tournament_groups")
      .select(
        `
          id,
          tournament_id,
          group_name,
          group_code,
          group_order,
          status
        `
      )
      .eq(
        "tournament_id",
        tournamentId
      )
      .order("group_order", {
        ascending: true,
      });

    if (groupsError) {
      return NextResponse.json(
        {
          success: false,
          message: groupsError.message,
        },
        { status: 500 }
      );
    }

    const typedGroups =
      (groups ?? []) as Group[];

    if (typedGroups.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No groups have been created yet.",
        },
        { status: 400 }
      );
    }

    /*
     * ==========================================================
     * 3. GROUP MEMBERS
     * ==========================================================
     */

    const groupIds =
      typedGroups.map(
        (group) => group.id
      );

    const {
      data: members,
      error: membersError,
    } = await supabase
      .from("tournament_group_members")
      .select(
        `
          id,
          tournament_group_id,
          registration_id,
          seed_number
        `
      )
      .in(
        "tournament_group_id",
        groupIds
      )
      .order("seed_number", {
        ascending: true,
        nullsFirst: false,
      });

    if (membersError) {
      return NextResponse.json(
        {
          success: false,
          message: membersError.message,
        },
        { status: 500 }
      );
    }

    const typedMembers =
      (members ?? []) as GroupMember[];

    if (typedMembers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No participants have been assigned to the groups yet.",
        },
        { status: 400 }
      );
    }

    /*
     * ==========================================================
     * 4. APPROVED REGISTRATIONS
     * ==========================================================
     */

    const {
      data: registrations,
      error: registrationsError,
    } = await supabase
      .from("tournament_registrations")
      .select(
        `
          id,
          tournament_id,
          team_id,
          player_id,
          status
        `
      )
      .eq(
        "tournament_id",
        tournamentId
      )
      .eq(
        "status",
        "Approved"
      );

    if (registrationsError) {
      return NextResponse.json(
        {
          success: false,
          message:
            registrationsError.message,
        },
        { status: 500 }
      );
    }

    const approvedRegistrations =
      (registrations ?? []) as Registration[];

    /*
     * ==========================================================
     * 5. VALIDATE PARTICIPANT TYPE
     * ==========================================================
     */

    const hasTeams =
      approvedRegistrations.some(
        (registration) =>
          registration.team_id !== null
      );

    const hasPlayers =
      approvedRegistrations.some(
        (registration) =>
          registration.player_id !== null
      );

    if (
      hasTeams &&
      hasPlayers
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This tournament contains both teams and players. Group fixtures require one participant type.",
        },
        { status: 400 }
      );
    }

    if (
      !hasTeams &&
      !hasPlayers
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No valid team or player registrations were found.",
        },
        { status: 400 }
      );
    }

    /*
     * ==========================================================
     * 6. EXISTING MATCHES
     * ==========================================================
     *
     * We load existing matches so clicking Generate again
     * does NOT create duplicates.
     */

    const {
      data: existingMatches,
      error: existingMatchesError,
    } = await supabase
      .from("matches")
      .select(
        `
          id,
          tournament_id,
          team_a_id,
          team_b_id,
          player_a_id,
          player_b_id,
          round,
          match_number,
          status
        `
      )
      .eq(
        "tournament_id",
        tournamentId
      );

    if (existingMatchesError) {
      return NextResponse.json(
        {
          success: false,
          message:
            existingMatchesError.message,
        },
        { status: 500 }
      );
    }

    const typedExistingMatches =
      (existingMatches ?? []) as ExistingMatch[];

    /*
     * ==========================================================
     * 7. DUPLICATE TRACKING
     * ==========================================================
     */

    const existingSingleLegPairs =
      new Set<string>();

    const existingDoubleLegPairs =
      new Set<string>();

    for (
      const match of typedExistingMatches
    ) {
      const unordered =
        existingUnorderedPairKey(match);

      const directed =
        existingDirectedPairKey(match);

      if (unordered) {
        existingSingleLegPairs.add(
          unordered
        );
      }

      if (directed) {
        existingDoubleLegPairs.add(
          directed
        );
      }
    }

    /*
     * ==========================================================
     * 8. MATCH NUMBER
     * ==========================================================
     */

    let nextMatchNumber =
      typedExistingMatches.reduce(
        (highest, match) => {
          const number =
            Number(
              match.match_number
            );

          if (
            Number.isInteger(number) &&
            number > highest
          ) {
            return number;
          }

          return highest;
        },
        0
      ) + 1;

    /*
     * ==========================================================
     * 9. GENERATE
     * ==========================================================
     */

    const matchesToInsert:
      Record<string, unknown>[] = [];

    const generatedByGroup:
      Record<string, number> = {};

    const skippedByGroup:
      Record<string, number> = {};

    const invalidByGroup:
      Record<string, number> = {};

    for (
      const group of typedGroups
    ) {
      /*
       * Get only participants belonging to
       * THIS group.
       */

      const groupMembers =
        typedMembers
          .filter(
            (member) =>
              member.tournament_group_id ===
              group.id
          )
          .sort(
            (a, b) =>
              (a.seed_number ?? 999) -
              (b.seed_number ?? 999)
          );

      /*
       * Resolve registrations into actual
       * match participants.
       */

      const participants:
        Participant[] = [];

      for (
        const member of groupMembers
      ) {
        const registration =
          approvedRegistrations.find(
            (item) =>
              item.id ===
              member.registration_id
          );

        if (!registration) {
          continue;
        }

        if (
          hasTeams &&
          registration.team_id !== null
        ) {
          participants.push({
            registrationId:
              registration.id,
            teamId:
              registration.team_id,
            playerId: null,
          });

          continue;
        }

        if (
          hasPlayers &&
          registration.player_id !== null
        ) {
          participants.push({
            registrationId:
              registration.id,
            teamId: null,
            playerId:
              registration.player_id,
          });
        }
      }

      generatedByGroup[
        group.group_name
      ] = 0;

      skippedByGroup[
        group.group_name
      ] = 0;

      invalidByGroup[
        group.group_name
      ] = 0;

      /*
       * A group needs at least two participants.
       */

      if (
        participants.length < 2
      ) {
        continue;
      }

      /*
       * ========================================================
       * SINGLE LEG
       * ========================================================
       *
       * Example:
       *
       * A
       * B
       * C
       * D
       *
       * Generates:
       *
       * A vs B
       * A vs C
       * A vs D
       * B vs C
       * B vs D
       * C vs D
       *
       * Exactly once per pair.
       */

      if (
        fixtureFormat ===
        "single_leg"
      ) {
        let groupRound = 1;

        for (
          let i = 0;
          i < participants.length;
          i++
        ) {
          for (
            let j = i + 1;
            j < participants.length;
            j++
          ) {
            const participantA =
              participants[i];

            const participantB =
              participants[j];

            const pairKey =
              unorderedPairKey(
                participantA,
                participantB
              );

            /*
             * Already exists.
             */

            if (
              existingSingleLegPairs.has(
                pairKey
              )
            ) {
              skippedByGroup[
                group.group_name
              ]++;

              continue;
            }

            /*
             * Build actual database row.
             */

            const match =
              buildMatch(
                tournamentId,
                tournament.game_id ?? null,
                `${group.group_name} - Round ${groupRound}`,
                nextMatchNumber,
                participantA,
                participantB
              );

            /*
             * This should never happen if
             * group participants are valid.
             */

            if (!match) {
              invalidByGroup[
                group.group_name
              ]++;

              continue;
            }

            matchesToInsert.push(
              match
            );

            existingSingleLegPairs.add(
              pairKey
            );

            generatedByGroup[
              group.group_name
            ]++;

            nextMatchNumber++;
            groupRound++;
          }
        }
      }

      /*
       * ========================================================
       * DOUBLE LEG
       * ========================================================
       *
       * A vs B
       * B vs A
       *
       * A vs C
       * C vs A
       *
       * etc.
       */

      else {
        let groupRound = 1;

        for (
          let i = 0;
          i < participants.length;
          i++
        ) {
          for (
            let j = i + 1;
            j < participants.length;
            j++
          ) {
            const participantA =
              participants[i];

            const participantB =
              participants[j];

            /*
             * LEG 1
             */

            const legOneKey =
              directedPairKey(
                participantA,
                participantB
              );

            if (
              existingDoubleLegPairs.has(
                legOneKey
              )
            ) {
              skippedByGroup[
                group.group_name
              ]++;
            } else {
              const match =
                buildMatch(
                  tournamentId,
                  tournament.game_id ?? null,
                  `${group.group_name} - Round ${groupRound} - Leg 1`,
                  nextMatchNumber,
                  participantA,
                  participantB
                );

              if (match) {
                matchesToInsert.push(
                  match
                );

                existingDoubleLegPairs.add(
                  legOneKey
                );

                generatedByGroup[
                  group.group_name
                ]++;

                nextMatchNumber++;
              } else {
                invalidByGroup[
                  group.group_name
                ]++;
              }
            }

            /*
             * LEG 2
             */

            const legTwoKey =
              directedPairKey(
                participantB,
                participantA
              );

            if (
              existingDoubleLegPairs.has(
                legTwoKey
              )
            ) {
              skippedByGroup[
                group.group_name
              ]++;
            } else {
              const match =
                buildMatch(
                  tournamentId,
                  tournament.game_id ?? null,
                  `${group.group_name} - Round ${groupRound} - Leg 2`,
                  nextMatchNumber,
                  participantB,
                  participantA
                );

              if (match) {
                matchesToInsert.push(
                  match
                );

                existingDoubleLegPairs.add(
                  legTwoKey
                );

                generatedByGroup[
                  group.group_name
                ]++;

                nextMatchNumber++;
              } else {
                invalidByGroup[
                  group.group_name
                ]++;
              }
            }

            groupRound++;
          }
        }
      }
    }

    /*
     * ==========================================================
     * 10. NOTHING TO CREATE
     * ==========================================================
     */

    if (
      matchesToInsert.length === 0
    ) {
      const invalidTotal =
        Object.values(
          invalidByGroup
        ).reduce(
          (sum, value) =>
            sum + value,
          0
        );

      if (invalidTotal > 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Some group participants could not be converted into valid matches. Check that each approved registration has either a team_id or player_id.",
            fixtureFormat,
            generatedByGroup,
            skippedByGroup,
            invalidByGroup,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message:
          "No new group fixtures were required. Existing fixtures are already up to date.",
        fixtureFormat,
        matches: [],
        matchCount: 0,
        existingMatchCount:
          typedExistingMatches.length,
        generatedByGroup,
        skippedByGroup,
        invalidByGroup,
        groupCount:
          typedGroups.length,
      });
    }

    /*
     * ==========================================================
     * 11. INSERT DIRECTLY INTO MATCHES
     * ==========================================================
     *
     * IMPORTANT:
     *
     * We do NOT call /api/matches here.
     *
     * This route inserts the actual team/player IDs directly.
     */

    const {
      data: createdMatches,
      error: insertError,
    } = await supabase
      .from("matches")
      .insert(
        matchesToInsert
      )
      .select("*");

    if (insertError) {
      console.error(
        "Group fixture insertion error:",
        insertError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            insertError.message ||
            "Failed to create group fixtures.",
        },
        { status: 500 }
      );
    }

    /*
     * ==========================================================
     * 12. SUCCESS
     * ==========================================================
     */

    return NextResponse.json({
      success: true,

      message:
        `Created ${createdMatches?.length ?? 0} group fixtures successfully.`,

      fixtureFormat,

      matches:
        createdMatches ?? [],

      matchCount:
        createdMatches?.length ?? 0,

      generatedByGroup,

      skippedByGroup,

      invalidByGroup,

      groupCount:
        typedGroups.length,
    });
  } catch (error) {
    console.error(
      "Group fixture generation error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate group fixtures.",
      },
      { status: 500 }
    );
  }
}
