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
  group_order: number;
  status: string | null;
}

interface Member {
  id: number;
  tournament_group_id: number;
  registration_id: number;
  seed_number: number | null;
}

interface Registration {
  id: number;
  team_id: number | null;
  player_id: number | null;
  status: string;
  teams:
    | {
        id: number;
        team_name: string;
      }[]
    | null;
  players:
    | {
        id: number;
        full_name: string;
        gamer_tag: string;
      }[]
    | null;
}

interface Match {
  id: number;
  team_a_id: number | null;
  team_b_id: number | null;
  player_a_id: number | null;
  player_b_id: number | null;
  score_team_a: number | null;
  score_team_b: number | null;
  status: string | null;
  round: string | null;
}

interface Standing {
  registration_id: number;
  participant_id: number;
  participant_type:
    | "Team"
    | "Player";
  name: string;

  played: number;
  wins: number;
  draws: number;
  losses: number;

  score_for: number;
  score_against: number;
  difference: number;

  points: number;

  seed_number: number | null;
}

function normalize(
  value: unknown
): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export async function GET(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;

    const tournamentId = Number(id);

    if (!Number.isInteger(tournamentId)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A valid tournament ID is required.",
        },
        { status: 400 }
      );
    }

    const supabase =
      await createClient();

    /*
     * --------------------------------------------------------
     * LOAD GROUPS
     * --------------------------------------------------------
     */

    const {
      data: groups,
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
            groupsError.message,
        },
        { status: 500 }
      );
    }

    if (
      !groups ||
      groups.length === 0
    ) {
      return NextResponse.json({
        success: true,
        groups: [],
        standings: {},
      });
    }

    /*
     * --------------------------------------------------------
     * LOAD GROUP MEMBERS
     * --------------------------------------------------------
     */

    const groupIds =
      groups.map(
        (group) => group.id
      );

    const {
      data: members,
      error: membersError,
    } = await supabase
      .from(
        "tournament_group_members"
      )
      .select("*")
      .in(
        "tournament_group_id",
        groupIds
      );

    if (membersError) {
      return NextResponse.json(
        {
          success: false,
          message:
            membersError.message,
        },
        { status: 500 }
      );
    }

    /*
     * --------------------------------------------------------
     * LOAD REGISTRATIONS
     * --------------------------------------------------------
     */

    const registrationIds =
      (members ?? []).map(
        (member) =>
          member.registration_id
      );

    if (
      registrationIds.length === 0
    ) {
      return NextResponse.json({
        success: true,
        groups,
        standings: {},
      });
    }

    const {
      data: registrations,
      error:
        registrationsError,
    } = await supabase
      .from(
        "tournament_registrations"
      )
      .select(
        `
          id,
          team_id,
          player_id,
          status,
          teams (
            id,
            team_name
          ),
          players (
            id,
            full_name,
            gamer_tag
          )
        `
      )
      .in(
        "id",
        registrationIds
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

    /*
     * --------------------------------------------------------
     * LOAD MATCHES
     * --------------------------------------------------------
     *
     * We only use completed matches.
     *
     * Group matches will later be identified by their
     * group-specific round/stage information.
     * --------------------------------------------------------
     */

    const {
      data: matches,
      error: matchesError,
    } = await supabase
      .from("matches")
      .select(
        `
          id,
          team_a_id,
          team_b_id,
          player_a_id,
          player_b_id,
          score_team_a,
          score_team_b,
          status,
          round
        `
      )
      .eq(
        "tournament_id",
        tournamentId
      );

    if (matchesError) {
      return NextResponse.json(
        {
          success: false,
          message:
            matchesError.message,
        },
        { status: 500 }
      );
    }

    const typedGroups =
      groups as Group[];

    const typedMembers =
      (members ?? []) as Member[];

    const typedRegistrations =
      (registrations ??
        []) as Registration[];

    const typedMatches =
      (matches ??
        []) as Match[];

    const registrationMap =
      new Map<
        number,
        Registration
      >();

    typedRegistrations.forEach(
      (registration) => {
        registrationMap.set(
          registration.id,
          registration
        );
      }
    );

    /*
     * --------------------------------------------------------
     * DETERMINE PARTICIPANT TYPE
     * --------------------------------------------------------
     */

    const hasTeams =
      typedRegistrations.some(
        (registration) =>
          registration.team_id !== null
      );

    /*
     * --------------------------------------------------------
     * BUILD STANDINGS
     * --------------------------------------------------------
     */

    const standings: Record<
      string,
      Standing[]
    > = {};

    for (const group of typedGroups) {
      const groupMembers =
        typedMembers.filter(
          (member) =>
            member.tournament_group_id ===
            group.id
        );

      const table =
        new Map<
          number,
          Standing
        >();

      for (const member of groupMembers) {
        const registration =
          registrationMap.get(
            member.registration_id
          );

        if (!registration) {
          continue;
        }

        const participantId =
          hasTeams
            ? registration.team_id
            : registration.player_id;

        if (
          participantId === null
        ) {
          continue;
        }

        const name =
          hasTeams
            ? registration.teams?.[0]
                ?.team_name ??
              `Team #${participantId}`
            : registration.players?.[0]
                ?.gamer_tag ??
              registration.players?.[0]
                ?.full_name ??
              `Player #${participantId}`;

        table.set(
          registration.id,
          {
            registration_id:
              registration.id,

            participant_id:
              participantId,

            participant_type:
              hasTeams
                ? "Team"
                : "Player",

            name,

            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,

            score_for: 0,
            score_against: 0,
            difference: 0,

            points: 0,

            seed_number:
              member.seed_number,
          }
        );
      }

      /*
       * ------------------------------------------------------
       * PROCESS COMPLETED MATCHES
       * ------------------------------------------------------
       */

      const groupParticipantIds =
        new Set<number>();

      table.forEach(
        (standing) => {
          groupParticipantIds.add(
            standing.participant_id
          );
        }
      );

      for (const match of typedMatches) {
        if (
          normalize(match.status) !==
          "completed"
        ) {
          continue;
        }

        const scoreA =
          match.score_team_a;

        const scoreB =
          match.score_team_b;

        if (
          scoreA === null ||
          scoreB === null
        ) {
          continue;
        }

        const participantA =
          hasTeams
            ? match.team_a_id
            : match.player_a_id;

        const participantB =
          hasTeams
            ? match.team_b_id
            : match.player_b_id;

        if (
          participantA === null ||
          participantB === null
        ) {
          continue;
        }

        /*
         * Only count matches where BOTH
         * participants belong to this group.
         */

        if (
          !groupParticipantIds.has(
            participantA
          ) ||
          !groupParticipantIds.has(
            participantB
          )
        ) {
          continue;
        }

        const standingA =
          Array.from(
            table.values()
          ).find(
            (standing) =>
              standing.participant_id ===
              participantA
          );

        const standingB =
          Array.from(
            table.values()
          ).find(
            (standing) =>
              standing.participant_id ===
              participantB
          );

        if (
          !standingA ||
          !standingB
        ) {
          continue;
        }

        standingA.played++;
        standingB.played++;

        standingA.score_for +=
          scoreA;

        standingA.score_against +=
          scoreB;

        standingB.score_for +=
          scoreB;

        standingB.score_against +=
          scoreA;

        if (scoreA > scoreB) {
          standingA.wins++;
          standingB.losses++;

          standingA.points += 3;
        } else if (
          scoreB > scoreA
        ) {
          standingB.wins++;
          standingA.losses++;

          standingB.points += 3;
        } else {
          standingA.draws++;
          standingB.draws++;

          standingA.points++;
          standingB.points++;
        }
      }

      /*
       * ------------------------------------------------------
       * CALCULATE DIFFERENCE
       * ------------------------------------------------------
       */

      const sorted =
        Array.from(
          table.values()
        ).map(
          (standing) => ({
            ...standing,

            difference:
              standing.score_for -
              standing.score_against,
          })
        );

      /*
       * ------------------------------------------------------
       * SORT TABLE
       * ------------------------------------------------------
       *
       * 1. Points
       * 2. Score difference
       * 3. Score for
       * 4. Seed
       * ------------------------------------------------------
       */

      sorted.sort(
        (a, b) => {
          if (
            b.points !==
            a.points
          ) {
            return (
              b.points -
              a.points
            );
          }

          if (
            b.difference !==
            a.difference
          ) {
            return (
              b.difference -
              a.difference
            );
          }

          if (
            b.score_for !==
            a.score_for
          ) {
            return (
              b.score_for -
              a.score_for
            );
          }

          return (
            (a.seed_number ?? 999) -
            (b.seed_number ?? 999)
          );
        }
      );

      standings[
        group.group_name
      ] = sorted;
    }

    /*
     * --------------------------------------------------------
     * RESPONSE
     * --------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      tournament_id:
        tournamentId,

      groups:
        typedGroups,

      standings,
    });
  } catch (error) {
    console.error(
      "Group standings error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to calculate group standings.",
      },
      { status: 500 }
    );
  }
}