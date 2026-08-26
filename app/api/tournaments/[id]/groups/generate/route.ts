import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

interface Registration {
  id: number;
  tournament_id: number;
  team_id: number | null;
  player_id: number | null;
  status: string;
}

interface Participant {
  registrationId: number;
  teamId: number | null;
  playerId: number | null;
  name: string;
}

interface GroupRow {
  id: number;
  tournament_id: number;
  group_name: string;
  group_order: number;
}

interface ExistingMatch {
  id: number;
  round: string | null;
  match_number: number | null;
  team_a_id: number | null;
  team_b_id: number | null;
  player_a_id: number | null;
  player_b_id: number | null;
}

type FixtureFormat = "single_leg" | "double_leg";

function normalize(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function participantKey(participant: Participant): string {
  if (participant.teamId !== null) {
    return `team:${participant.teamId}`;
  }

  if (participant.playerId !== null) {
    return `player:${participant.playerId}`;
  }

  return `registration:${participant.registrationId}`;
}

function pairKey(
  a: Participant,
  b: Participant
): string {
  return [participantKey(a), participantKey(b)]
    .sort()
    .join("__");
}

function existingPairKey(
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

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [
      result[j],
      result[i],
    ];
  }

  return result;
}

function buildMatch(
  tournamentId: number,
  gameId: number | null,
  groupName: string,
  matchNumber: number,
  a: Participant,
  b: Participant
): Record<string, unknown> {
  const match: Record<string, unknown> = {
    tournament_id: tournamentId,
    game_id: gameId,

    round: groupName,

    match_number: matchNumber,

    best_of: "BO1",

    scheduled_date: null,
    scheduled_time: null,

    winner_id: null,

    score_team_a: null,
    score_team_b: null,

    status: "Scheduled",

    stream_link: null,

    notes: `${groupName} fixture`,

    team_a_id: null,
    team_b_id: null,

    player_a_id: null,
    player_b_id: null,
  };

  if (
    a.teamId !== null &&
    b.teamId !== null
  ) {
    match.team_a_id = a.teamId;
    match.team_b_id = b.teamId;
  } else {
    match.player_a_id = a.playerId;
    match.player_b_id = b.playerId;
  }

  return match;
}

function generateGroupFixtures(
  participants: Participant[],
  tournamentId: number,
  gameId: number | null,
  groupName: string,
  fixtureFormat: FixtureFormat,
  existingMatches: ExistingMatch[],
  startingMatchNumber: number
): Record<string, unknown>[] {
  const fixtures: Record<string, unknown>[] = [];

  const existingPairs = new Set<string>();

  for (const match of existingMatches) {
    const key = existingPairKey(match);

    if (key) {
      existingPairs.add(key);
    }
  }

  const ordered = [...participants];

  const pool: (Participant | null)[] = [
    ...ordered,
  ];

  if (pool.length % 2 !== 0) {
    pool.push(null);
  }

  const total = pool.length;

  if (total < 2) {
    return fixtures;
  }

  const rounds = total - 1;

  let matchNumber = startingMatchNumber;

  const generateLeg = (
    legNumber: number
  ) => {
    const workingPool = [...pool];

    for (
      let roundIndex = 0;
      roundIndex < rounds;
      roundIndex++
    ) {
      for (
        let i = 0;
        i < total / 2;
        i++
      ) {
        const first =
          workingPool[i];

        const second =
          workingPool[
            total - 1 - i
          ];

        if (!first || !second) {
          continue;
        }

        const a =
          legNumber === 2
            ? second
            : first;

        const b =
          legNumber === 2
            ? first
            : second;

        const key = pairKey(a, b);

        /*
         * For single leg, each pair is allowed once.
         *
         * For double leg, direction matters.
         */
        const directedKey =
          `${participantKey(a)}__${participantKey(b)}`;

        if (
          fixtureFormat === "single_leg"
        ) {
          if (existingPairs.has(key)) {
            continue;
          }

          const match = buildMatch(
            tournamentId,
            gameId,
            groupName,
            matchNumber,
            a,
            b
          );

          fixtures.push(match);

          existingPairs.add(key);

          matchNumber++;

          continue;
        }

        /*
         * Double-leg:
         * We store the two directions separately.
         */
        const doubleKey =
          existingPairs.has(directedKey);

        if (doubleKey) {
          continue;
        }

        const match = buildMatch(
          tournamentId,
          gameId,
          `${groupName} - Leg ${legNumber}`,
          matchNumber,
          a,
          b
        );

        fixtures.push(match);

        existingPairs.add(directedKey);

        matchNumber++;
      }

      const fixed = workingPool[0];

      const rotating =
        workingPool.slice(1);

      const last = rotating.pop();

      if (last !== undefined) {
        rotating.unshift(last);
      }

      workingPool.splice(
        0,
        workingPool.length,
        fixed,
        ...rotating
      );
    }
  };

  generateLeg(1);

  if (fixtureFormat === "double_leg") {
    generateLeg(2);
  }

  return fixtures;
}

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const supabase =
      await createClient();

    const { id } = await context.params;

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

    /*
     * --------------------------------------------------------
     * GROUP SETTINGS
     * --------------------------------------------------------
     */

    const requestedGroupCount = Number(
      body.groupCount
    );

    const requestedAdvancingPerGroup = Number(
      body.advancingPerGroup
    );

    const requestedFixtureFormat =
      body.fixtureFormat === "double_leg"
        ? "double_leg"
        : "single_leg";

    if (
      !Number.isInteger(requestedGroupCount) ||
      requestedGroupCount < 1 ||
      requestedGroupCount > 16
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "groupCount must be between 1 and 16.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(
        requestedAdvancingPerGroup
      ) ||
      requestedAdvancingPerGroup < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "advancingPerGroup must be at least 1.",
        },
        { status: 400 }
      );
    }

    /*
     * --------------------------------------------------------
     * TOURNAMENT
     * --------------------------------------------------------
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
          game_id,
          fixture_format
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
          message:
            "Tournament not found.",
        },
        { status: 404 }
      );
    }

    const tournamentType =
      normalize(
        tournament.tournament_type
      );

    if (
      tournamentType !==
      "group stage + knockout"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Group creation is only available for Group Stage + Knockout tournaments.",
        },
        { status: 400 }
      );
    }

    /*
     * --------------------------------------------------------
     * APPROVED REGISTRATIONS
     * --------------------------------------------------------
     */

    const {
      data: registrations,
      error: registrationsError,
    } = await supabase
      .from(
        "tournament_registrations"
      )
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

    if (
      !registrations ||
      registrations.length < 2
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "At least two approved participants are required.",
        },
        { status: 400 }
      );
    }

    const typedRegistrations =
      registrations as Registration[];

    const hasTeams =
      typedRegistrations.some(
        (r) => r.team_id !== null
      );

    const hasPlayers =
      typedRegistrations.some(
        (r) => r.player_id !== null
      );

    if (
      hasTeams &&
      hasPlayers
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A tournament cannot mix team and player registrations.",
        },
        { status: 400 }
      );
    }

    const participants: Participant[] =
      typedRegistrations.map(
        (registration) => ({
          registrationId:
            registration.id,

          teamId:
            registration.team_id,

          playerId:
            registration.player_id,

          name:
            registration.team_id !== null
              ? `Team #${registration.team_id}`
              : `Player #${registration.player_id}`,
        })
      );

    if (
      requestedGroupCount >
      participants.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You cannot create more groups than participants.",
        },
        { status: 400 }
      );
    }

    /*
     * --------------------------------------------------------
     * LOAD EXISTING GROUPS
     * --------------------------------------------------------
     */

    const {
      data: existingGroups,
      error: groupsError,
    } = await supabase
      .from("tournament_groups")
      .select("*")
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
          message:
            `Unable to load tournament groups: ${groupsError.message}`,
        },
        { status: 500 }
      );
    }

    if (
      existingGroups &&
      existingGroups.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Groups have already been created for this tournament.",
        },
        { status: 409 }
      );
    }

    /*
     * --------------------------------------------------------
     * LOAD EXISTING MATCHES
     * --------------------------------------------------------
     */

    const {
      data: existingMatches,
      error: existingMatchesError,
    } = await supabase
      .from("matches")
      .select(
        `
          id,
          round,
          match_number,
          team_a_id,
          team_b_id,
          player_a_id,
          player_b_id
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
      (existingMatches ??
        []) as ExistingMatch[];

    /*
     * --------------------------------------------------------
     * DETERMINE MATCH NUMBER
     * --------------------------------------------------------
     */

    const highestMatchNumber =
      typedExistingMatches.reduce(
        (highest, match) => {
          const number =
            Number(
              match.match_number
            );

          return Number.isFinite(number)
            ? Math.max(
                highest,
                number
              )
            : highest;
        },
        0
      );

    let nextMatchNumber =
      highestMatchNumber + 1;

    /*
     * --------------------------------------------------------
     * SHUFFLE PARTICIPANTS
     * --------------------------------------------------------
     */

    const shuffledParticipants =
      shuffle(participants);

    /*
     * --------------------------------------------------------
     * CREATE GROUP RECORDS
     * --------------------------------------------------------
     */

    const groupRows = Array.from(
      {
        length: requestedGroupCount,
      },
      (_, index) => ({
        tournament_id:
          tournamentId,

        group_name:
          `Group ${String.fromCharCode(
            65 + index
          )}`,

        group_order:
          index + 1,
      })
    );

    const {
      data: createdGroups,
      error: createGroupsError,
    } = await supabase
      .from("tournament_groups")
      .insert(groupRows)
      .select("*");

    if (createGroupsError) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Failed to create groups: ${createGroupsError.message}`,
        },
        { status: 500 }
      );
    }

    if (
      !createdGroups ||
      createdGroups.length !==
        requestedGroupCount
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Groups were not created correctly.",
        },
        { status: 500 }
      );
    }

    const typedGroups =
      createdGroups as GroupRow[];

    /*
     * --------------------------------------------------------
     * DISTRIBUTE PARTICIPANTS
     *
     * Round-robin distribution keeps group sizes balanced.
     *
     * Example:
     *
     * 12 participants / 3 groups
     *
     * Group A = 4
     * Group B = 4
     * Group C = 4
     * --------------------------------------------------------
     */

    const membersToInsert: Record<
      string,
      unknown
    >[] = [];

    const participantsByGroup =
      new Map<
        number,
        Participant[]
      >();

    typedGroups.forEach((group) => {
      participantsByGroup.set(
        group.id,
        []
      );
    });

    shuffledParticipants.forEach(
      (participant, index) => {
        const group =
          typedGroups[
            index %
              typedGroups.length
          ];

        if (!group) {
          return;
        }

        participantsByGroup
          .get(group.id)
          ?.push(participant);

        membersToInsert.push({
          tournament_id:
            tournamentId,

          group_id:
            group.id,

          registration_id:
            participant.registrationId,

          team_id:
            participant.teamId,

          player_id:
            participant.playerId,
        });
      }
    );

    /*
     * --------------------------------------------------------
     * INSERT MEMBERS
     * --------------------------------------------------------
     */

    const {
      data: createdMembers,
      error: membersError,
    } = await supabase
      .from(
        "tournament_group_members"
      )
      .insert(membersToInsert)
      .select("*");

    if (membersError) {
      /*
       * Roll back groups if member insertion fails.
       */
      await supabase
        .from("tournament_groups")
        .delete()
        .eq(
          "tournament_id",
          tournamentId
        );

      return NextResponse.json(
        {
          success: false,
          message:
            `Failed to assign participants to groups: ${membersError.message}`,
        },
        { status: 500 }
      );
    }

    /*
     * --------------------------------------------------------
     * GENERATE GROUP FIXTURES
     * --------------------------------------------------------
     */

    const fixturesToInsert: Record<
      string,
      unknown
    >[] = [];

    for (const group of typedGroups) {
      const groupParticipants =
        participantsByGroup.get(
          group.id
        ) ?? [];

      const groupFixtures =
        generateGroupFixtures(
          groupParticipants,
          tournamentId,
          tournament.game_id,
          group.group_name,
          requestedFixtureFormat,
          typedExistingMatches,
          nextMatchNumber
        );

      fixturesToInsert.push(
        ...groupFixtures
      );

      nextMatchNumber +=
        groupFixtures.length;
    }

    /*
     * --------------------------------------------------------
     * INSERT FIXTURES
     * --------------------------------------------------------
     */

    let createdMatches: unknown[] =
      [];

    if (
      fixturesToInsert.length > 0
    ) {
      const {
        data,
        error,
      } = await supabase
        .from("matches")
        .insert(
          fixturesToInsert
        )
        .select("*");

      if (error) {
        /*
         * Roll back group members and groups.
         */
        await supabase
          .from(
            "tournament_group_members"
          )
          .delete()
          .eq(
            "tournament_id",
            tournamentId
          );

        await supabase
          .from(
            "tournament_groups"
          )
          .delete()
          .eq(
            "tournament_id",
            tournamentId
          );

        return NextResponse.json(
          {
            success: false,
            message:
              `Groups were created but fixtures failed: ${error.message}`,
          },
          { status: 500 }
        );
      }

      createdMatches =
        data ?? [];
    }

    /*
     * --------------------------------------------------------
     * SAVE FIXTURE FORMAT
     * --------------------------------------------------------
     */

    if (
      !tournament.fixture_format
    ) {
      await supabase
        .from("tournaments")
        .update({
          fixture_format:
            requestedFixtureFormat,
        })
        .eq(
          "id",
          tournamentId
        );
    }

    /*
     * --------------------------------------------------------
     * RESPONSE
     * --------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      message:
        "Groups and group-stage fixtures generated successfully.",

      tournament: {
        id:
          tournament.id,

        tournament_name:
          tournament.tournament_name,

        tournament_type:
          tournament.tournament_type,
      },

      groupCount:
        typedGroups.length,

      advancingPerGroup:
        requestedAdvancingPerGroup,

      fixtureFormat:
        requestedFixtureFormat,

      groups:
        typedGroups.map(
          (group) => ({
            id:
              group.id,

            name:
              group.group_name,

            order:
              group.group_order,

            participants:
              (
                participantsByGroup.get(
                  group.id
                ) ?? []
              ).map(
                (participant) => ({
                  registrationId:
                    participant.registrationId,

                  teamId:
                    participant.teamId,

                  playerId:
                    participant.playerId,

                  name:
                    participant.name,
                })
              ),
          })
        ),

      membersCreated:
        createdMembers?.length ??
        0,

      fixturesCreated:
        createdMatches.length,

      matches:
        createdMatches,
    });
  } catch (error) {
    console.error(
      "Group generation error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate groups.",
      },
      { status: 500 }
    );
  }
}