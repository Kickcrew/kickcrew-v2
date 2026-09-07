import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { advanceByeMatch } from "@/lib/tournament/advance-knockout-match";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

interface Registration {
  id: number;
  team_id: number | null;
  player_id: number | null;
  status: string;

  teams?: {
    id: number;
    team_name: string;
  }[] | null;

  players?: {
    id: number;
    full_name: string;
    gamer_tag: string;
  }[] | null;
}

interface Match {
  id: number;
  tournament_id: number;
  game_id: number | null;

  team_a_id: number | null;
  team_b_id: number | null;

  player_a_id: number | null;
  player_b_id: number | null;

  round: string | null;
  match_number: number | null;

  best_of: string | null;

  scheduled_date: string | null;
  scheduled_time: string | null;

  winner_id: number | null;
  winner_team_id: number | null;
  winner_player_id: number | null;

  score_team_a: number | null;
  score_team_b: number | null;

  status: string | null;

  stream_link: string | null;
  notes: string | null;

  next_match_id?: number | null;
  next_match_slot?: "A" | "B" | null;

  loser_next_match_id?: number | null;
  loser_next_match_slot?: "A" | "B" | null;
}

interface TournamentStage {
  id: number;
  tournament_id: number;
  stage_name: string;
  stage_type: string | null;
  stage_order: number | null;
  status: string | null;
  teams_advancing: number | null;
}

interface TournamentGroup {
  id: number;
  tournament_id: number;
  group_name: string;
  group_order: number;
}

interface GroupMember {
  id: number;
  tournament_id: number;
  group_id: number;
  registration_id: number | null;
  team_id: number | null;
  player_id: number | null;
}

interface Standing {
  id: number;
  registrationId: number;
  type: "Team" | "Player";
  name: string;

  played: number;
  wins: number;
  draws: number;
  losses: number;

  scoreFor: number;
  scoreAgainst: number;
  points: number;
}

interface QualifiedParticipant extends Standing {
  groupId: number;
  groupName: string;
  groupOrder: number;
  position: number;
}

const MIN_ADVANCING = 2;
const MAX_ADVANCING = 32;

/* =========================================================
   HELPERS
========================================================= */

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getParticipantName(
  registration: Registration,
  hasTeams: boolean
): string {
  if (hasTeams) {
    return (
      registration.teams?.[0]?.team_name?.trim() ??
      `Team #${registration.team_id}`
    );
  }

  return (
    registration.players?.[0]?.gamer_tag?.trim() ??
    registration.players?.[0]?.full_name?.trim() ??
    `Player #${registration.player_id}`
  );
}

function getParticipantId(
  registration: Registration,
  hasTeams: boolean
): number | null {
  return hasTeams
    ? registration.team_id
    : registration.player_id;
}

function isGroupTournament(
  tournamentType: unknown
): boolean {
  const value = normalize(tournamentType).replace(
    /[_-]+/g,
    " "
  );

  return (
    value.includes("group stage") ||
    value.includes("group knockout") ||
    value.includes("groups knockout") ||
    value === "groups"
  );
}

function isSingleElimination(
  tournamentType: unknown
): boolean {
  const value = normalize(tournamentType).replace(
    /[_-]+/g,
    " "
  );

  return (
    value === "single elimination" ||
    value.includes("single elimination") ||
    value === "knockout" ||
    value.includes("knockout only")
  );
}

function isKnockoutRound(
  round: string | null
): boolean {
  const value = normalize(round);

  const knockoutRounds = [
    "round of 32",
    "round of 16",
    "quarterfinal",
    "quarterfinals",
    "quarter-final",
    "quarter-finals",
    "semifinal",
    "semifinals",
    "semi-final",
    "semi-finals",
    "3rd place",
    "third place",
    "final",
    "grand final",
  ];

  return knockoutRounds.some(
    (item) => value === normalize(item)
  );
}

function getBracketSize(
  participants: number
): number {
  if (
    !Number.isInteger(participants) ||
    participants < 2
  ) {
    return 0;
  }

  let size = 2;

  while (
    size < participants &&
    size < MAX_ADVANCING
  ) {
    size *= 2;
  }

  return size;
}

function getStageType(
  bracketSize: number
): string {
  switch (bracketSize) {
    case 2:
      return "final";

    case 4:
      return "semifinals";

    case 8:
      return "quarterfinals";

    case 16:
      return "round_of_16";

    case 32:
      return "round_of_32";

    default:
      return "knockout";
  }
}

function getKnockoutRounds(
  bracketSize: number
): string[] {
  switch (bracketSize) {
    case 2:
      return ["Final"];

    case 4:
      return [
        "Semifinals",
        "Final",
      ];

    case 8:
      return [
        "Quarterfinals",
        "Semifinals",
        "Final",
      ];

    case 16:
      return [
        "Round of 16",
        "Quarterfinals",
        "Semifinals",
        "Final",
      ];

    case 32:
      return [
        "Round of 32",
        "Round of 16",
        "Quarterfinals",
        "Semifinals",
        "Final",
      ];

    default:
      return [];
  }
}

/* =========================================================
   SORT STANDINGS
========================================================= */

function sortStandings(
  standings: Standing[]
): Standing[] {
  return [...standings].sort(
    (a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }

      const differenceA =
        a.scoreFor - a.scoreAgainst;

      const differenceB =
        b.scoreFor - b.scoreAgainst;

      if (
        differenceB !== differenceA
      ) {
        return (
          differenceB -
          differenceA
        );
      }

      if (
        b.scoreFor !==
        a.scoreFor
      ) {
        return (
          b.scoreFor -
          a.scoreFor
        );
      }

      if (
        b.wins !== a.wins
      ) {
        return (
          b.wins -
          a.wins
        );
      }

      return a.name.localeCompare(
        b.name
      );
    }
  );
}

/* =========================================================
   CREATE EMPTY STANDING
========================================================= */

function createStanding(
  registration: Registration,
  hasTeams: boolean
): Standing | null {
  const participantId =
    getParticipantId(
      registration,
      hasTeams
    );

  if (
    participantId === null
  ) {
    return null;
  }

  return {
    id: participantId,

    registrationId:
      registration.id,

    type: hasTeams
      ? "Team"
      : "Player",

    name:
      getParticipantName(
        registration,
        hasTeams
      ),

    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,

    scoreFor: 0,
    scoreAgainst: 0,

    points: 0,
  };
}

/* =========================================================
   NORMAL ROUND ROBIN STANDINGS
========================================================= */

function calculateStandings(
  registrations: Registration[],
  matches: Match[]
): Standing[] {
  const approved =
    registrations.filter(
      (registration) =>
        normalize(
          registration.status
        ) === "approved"
    );

  const hasTeams =
    approved.some(
      (registration) =>
        registration.team_id !== null
    );

  const standingMap =
    new Map<number, Standing>();

  for (
    const registration of approved
  ) {
    const standing =
      createStanding(
        registration,
        hasTeams
      );

    if (!standing) {
      continue;
    }

    standingMap.set(
      standing.id,
      standing
    );
  }

  const qualificationMatches =
    matches.filter(
      (match) =>
        normalize(
          match.status
        ) === "completed" &&
        normalize(
          match.round
        ).length > 0 &&
        !isKnockoutRound(
          match.round
        )
    );

  for (
    const match of qualificationMatches
  ) {
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

    const standingA =
      standingMap.get(
        participantA
      );

    const standingB =
      standingMap.get(
        participantB
      );

    if (
      !standingA ||
      !standingB
    ) {
      continue;
    }

    standingA.played += 1;
    standingB.played += 1;

    standingA.scoreFor +=
      scoreA;

    standingA.scoreAgainst +=
      scoreB;

    standingB.scoreFor +=
      scoreB;

    standingB.scoreAgainst +=
      scoreA;

    if (
      scoreA === scoreB
    ) {
      standingA.draws += 1;
      standingB.draws += 1;

      standingA.points += 1;
      standingB.points += 1;
    } else if (
      scoreA > scoreB
    ) {
      standingA.wins += 1;
      standingB.losses += 1;

      standingA.points += 3;
    } else {
      standingB.wins += 1;
      standingA.losses += 1;

      standingB.points += 3;
    }
  }

  return sortStandings(
    Array.from(
      standingMap.values()
    )
  );
}

/* =========================================================
   GROUP STANDINGS
========================================================= */

function calculateGroupStandings(
  registrations: Registration[],
  members: GroupMember[],
  group: TournamentGroup,
  matches: Match[],
  hasTeams: boolean
): Standing[] {
  const approved =
    registrations.filter(
      (registration) =>
        normalize(
          registration.status
        ) === "approved"
    );

  const groupMembers =
    members.filter(
      (member) =>
        Number(
          member.group_id
        ) === Number(group.id)
    );

  const registrationIds =
    new Set(
      groupMembers
        .map(
          (member) =>
            member.registration_id
        )
        .filter(
          (
            id
          ): id is number =>
            id !== null &&
            id !== undefined
        )
    );

  const standingMap =
    new Map<number, Standing>();

  for (
    const registration of approved
  ) {
    if (
      !registrationIds.has(
        registration.id
      )
    ) {
      continue;
    }

    const standing =
      createStanding(
        registration,
        hasTeams
      );

    if (!standing) {
      continue;
    }

    standingMap.set(
      standing.id,
      standing
    );
  }

  for (
    const match of matches
  ) {
    if (
      normalize(
        match.status
      ) !== "completed"
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

    const standingA =
      standingMap.get(
        participantA
      );

    const standingB =
      standingMap.get(
        participantB
      );

    if (
      !standingA ||
      !standingB
    ) {
      continue;
    }

    standingA.played += 1;
    standingB.played += 1;

    standingA.scoreFor +=
      scoreA;

    standingA.scoreAgainst +=
      scoreB;

    standingB.scoreFor +=
      scoreB;

    standingB.scoreAgainst +=
      scoreA;

    if (
      scoreA === scoreB
    ) {
      standingA.draws += 1;
      standingB.draws += 1;

      standingA.points += 1;
      standingB.points += 1;
    } else if (
      scoreA > scoreB
    ) {
      standingA.wins += 1;
      standingB.losses += 1;

      standingA.points += 3;
    } else {
      standingB.wins += 1;
      standingA.losses += 1;

      standingB.points += 3;
    }
  }

  return sortStandings(
    Array.from(
      standingMap.values()
    )
  );
}

/* =========================================================
   GROUP PAIRING
========================================================= */

function buildGroupQualifiedPairings(
  qualifiedByGroup: Map<
    number,
    QualifiedParticipant[]
  >,
  groups: TournamentGroup[],
  advancingPerGroup: number
): Array<
  [
    QualifiedParticipant,
    QualifiedParticipant | null
  ]
> {
  const pairings: Array<
    [
      QualifiedParticipant,
      QualifiedParticipant | null
    ]
  > = [];

  /*
   * Group A vs Group B
   * Group C vs Group D
   * etc.
   *
   * With two advancing per group:
   *
   * A1 vs B2
   * B1 vs A2
   *
   * This keeps same-group participants
   * apart in the first knockout round.
   */
  for (
    let groupIndex = 0;
    groupIndex < groups.length;
    groupIndex += 2
  ) {
    const groupA =
      groups[groupIndex];

    const groupB =
      groups[groupIndex + 1];

    if (!groupA) {
      continue;
    }

    const qualifiedA =
      qualifiedByGroup.get(
        groupA.id
      ) ?? [];

    if (!groupB) {
      for (
        let i = 0;
        i < qualifiedA.length;
        i++
      ) {
        pairings.push([
          qualifiedA[i],
          null,
        ]);
      }

      continue;
    }

    const qualifiedB =
      qualifiedByGroup.get(
        groupB.id
      ) ?? [];

    for (
      let position = 0;
      position < advancingPerGroup;
      position++
    ) {
      const participantA =
        qualifiedA[position];

      const reversePosition =
        position % 2 === 0
          ? position + 1
          : position - 1;

      const participantB =
        qualifiedB[
          reversePosition
        ];

      if (
        participantA &&
        participantB
      ) {
        pairings.push([
          participantA,
          participantB,
        ]);
      } else if (
        participantA
      ) {
        pairings.push([
          participantA,
          null,
        ]);
      } else if (
        participantB
      ) {
        pairings.push([
          participantB,
          null,
        ]);
      }
    }
  }

  return pairings;
}

/* =========================================================
   POST
========================================================= */

export async function POST(
  request: Request,
  { params }: Params
) {
  try {
    /*
     * IMPORTANT:
     *
     * The route folder is:
     *
     * [id]
     *
     * Next.js provides the dynamic
     * parameter as "id". We alias it
     * locally to tournamentId because
     * the rest of this logic uses that name.
     */
    const {
      id: tournamentIdParam,
    } = await params;

    const tournamentId =
      Number(tournamentIdParam);

    if (
      !Number.isInteger(
        tournamentId
      ) ||
      tournamentId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A valid tournament ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    let body: Record<
      string,
      unknown
    >;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid JSON request body.",
        },
        {
          status: 400,
        }
      );
    }

    const requestedFormat =
      normalize(
        body.tournament_format
      );

    /*
     * =======================================================
     * LOAD TOURNAMENT
     * =======================================================
     */

    const {
      data: tournament,
      error:
        tournamentError,
    } = await supabase
      .from("tournaments")
      .select(
        `
          id,
          tournament_name,
          tournament_type,
          status,
          game_id
        `
      )
      .eq(
        "id",
        tournamentId
      )
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
        {
          status: 404,
        }
      );
    }

    /*
     * =======================================================
     * LOAD STAGES
     * =======================================================
     */

    const {
      data: stageRows,
      error:
        stagesError,
    } = await supabase
      .from(
        "tournament_stages"
      )
      .select("*")
      .eq(
        "tournament_id",
        tournamentId
      )
      .order(
        "stage_order",
        {
          ascending: true,
        }
      );

    if (stagesError) {
      return NextResponse.json(
        {
          success: false,
          message:
            stagesError.message,
        },
        {
          status: 500,
        }
      );
    }

    const stages =
      (stageRows ??
        []) as TournamentStage[];

    /*
     * =======================================================
     * LOAD MATCHES
     * =======================================================
     */

    const {
      data: matchRows,
      error:
        matchesError,
    } = await supabase
      .from("matches")
      .select("*")
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
        {
          status: 500,
        }
      );
    }

    const allMatches =
      (matchRows ??
        []) as Match[];

    /*
     * =======================================================
     * LOAD APPROVED REGISTRATIONS
     * =======================================================
     */

    const {
      data:
        registrationRows,
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
      .eq(
        "tournament_id",
        tournamentId
      )
      .eq(
        "status",
        "Approved"
      );

    if (
      registrationsError
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            registrationsError.message,
        },
        {
          status: 500,
        }
      );
    }

    const approvedRegistrations =
      (registrationRows ??
        []) as Registration[];

    if (
      approvedRegistrations.length ===
      0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No approved participants were found.",
        },
        {
          status: 400,
        }
      );
    }

    const hasTeams =
      approvedRegistrations.some(
        (registration) =>
          registration.team_id !== null
      );

    /*
     * =======================================================
     * GROUP STAGE + KNOCKOUT
     *
     * THIS BRANCH IS COMPLETELY SEPARATE FROM THE
     * NORMAL ROUND ROBIN + KNOCKOUT LOGIC.
     * =======================================================
     */

    const groupTournament =
      isGroupTournament(
        tournament.tournament_type
      ) ||
      requestedFormat ===
        "group_knockout";

    if (groupTournament) {
      /*
       * -----------------------------------------------------
       * READ PER-GROUP VALUE
       *
       * NEVER use teams_advancing here.
       *
       * 2 per group means:
       *
       * Group A → 2
       * Group B → 2
       * Group C → 2
       *
       * NOT:
       *
       * total = 2
       * -----------------------------------------------------
       */

      const requestedPerGroup =
        Number(
          body.advancing_per_group
        );

      if (
        !Number.isInteger(
          requestedPerGroup
        ) ||
        requestedPerGroup < 1 ||
        requestedPerGroup > 16
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "advancing_per_group must be a valid integer between 1 and 16.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * -----------------------------------------------------
       * LOAD GROUPS
       * -----------------------------------------------------
       */

      const {
        data:
          groupRows,
        error:
          groupsError,
      } = await supabase
        .from(
          "tournament_groups"
        )
        .select(
          `
            id,
            tournament_id,
            group_name,
            group_order
          `
        )
        .eq(
          "tournament_id",
          tournamentId
        )
        .order(
          "group_order",
          {
            ascending: true,
          }
        );

      if (groupsError) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Unable to load tournament groups: ${groupsError.message}`,
          },
          {
            status: 500,
          }
        );
      }

      const groups =
        (groupRows ??
          []) as TournamentGroup[];

      if (
        groups.length === 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "No tournament groups were found.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * -----------------------------------------------------
       * LOAD GROUP MEMBERS
       *
       * IMPORTANT:
       *
       * The group-generation code in this project creates
       * these columns:
       *
       * tournament_id
       * group_id
       * registration_id
       * team_id
       * player_id
       *
       * So we use exactly those columns.
       * -----------------------------------------------------
       */

      const {
        data:
          groupMemberRows,
        error:
          groupMembersError,
      } = await supabase
        .from(
          "tournament_group_members"
        )
        .select(
          `
            id,
            tournament_id,
            group_id,
            registration_id,
            team_id,
            player_id
          `
        )
        .eq(
          "tournament_id",
          tournamentId
        );

      if (
        groupMembersError
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Unable to load group members: ${groupMembersError.message}`,
          },
          {
            status: 500,
          }
        );
      }

      const groupMembers =
        (groupMemberRows ??
          []) as GroupMember[];

      if (
        groupMembers.length ===
        0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "No group members were found for this tournament.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * -----------------------------------------------------
       * BUILD GROUP MEMBER MAP
       * -----------------------------------------------------
       */

      const groupMemberMap =
        new Map<
          number,
          GroupMember[]
        >();

      for (
        const group of groups
      ) {
        groupMemberMap.set(
          group.id,
          groupMembers.filter(
            (member) =>
              Number(
                member.group_id
              ) ===
              Number(group.id)
          )
        );
      }

      /*
       * -----------------------------------------------------
       * VALIDATE GROUP MEMBERS
       * -----------------------------------------------------
       */

      for (
        const group of groups
      ) {
        const members =
          groupMemberMap.get(
            group.id
          ) ?? [];

        if (
          members.length <
          requestedPerGroup
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                `${group.group_name} has only ${members.length} detected participants, but ${requestedPerGroup} are configured to advance.`,
              group_id:
                group.id,
              detected:
                members.length,
              advancing_per_group:
                requestedPerGroup,
            },
            {
              status: 400,
            }
          );
        }
      }

      /*
       * -----------------------------------------------------
       * FIND GROUP STAGE MATCHES
       *
       * We deliberately exclude actual knockout rounds.
       * -----------------------------------------------------
       */

      const groupMatches =
        allMatches.filter(
          (match) => {
            const round =
              normalize(
                match.round
              );

            if (!round) {
              return false;
            }

            return !isKnockoutRound(
              match.round
            );
          }
        );

      if (
        groupMatches.length ===
        0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "No Group Stage matches were found.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * -----------------------------------------------------
       * GROUP MATCH COMPLETION
       * -----------------------------------------------------
       */

      const incompleteGroupMatches =
        groupMatches.filter(
          (match) =>
            normalize(
              match.status
            ) !== "completed"
        );

      if (
        incompleteGroupMatches.length >
        0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Complete all Group Stage matches before advancing to Knockout.",
            incomplete_matches:
              incompleteGroupMatches.length,
            total_group_matches:
              groupMatches.length,
          },
          {
            status: 400,
          }
        );
      }

      /*
       * -----------------------------------------------------
       * CALCULATE EACH GROUP INDEPENDENTLY
       * -----------------------------------------------------
       */

      const qualifiedByGroup =
        new Map<
          number,
          QualifiedParticipant[]
        >();

      const groupStandingsResponse:
        Array<{
          group_id: number;
          group_name: string;
          standings: Array<
            Standing & {
              qualified: boolean;
              position: number;
            }
          >;
        }> = [];

      for (
        const group of groups
      ) {
        const members =
          groupMemberMap.get(
            group.id
          ) ?? [];

        /*
         * Only matches where BOTH participants
         * belong to this group.
         *
         * This prevents results from Group B
         * leaking into Group A.
         */
        const memberParticipantIds =
          new Set<number>();

        for (
          const member of members
        ) {
          const participantId =
            hasTeams
              ? member.team_id
              : member.player_id;

          if (
            participantId !== null
          ) {
            memberParticipantIds.add(
              participantId
            );
          }
        }

        const matchesForGroup =
          groupMatches.filter(
            (match) => {
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
                return false;
              }

              return (
                memberParticipantIds.has(
                  participantA
                ) &&
                memberParticipantIds.has(
                  participantB
                )
              );
            }
          );

        const standings =
          calculateGroupStandings(
            approvedRegistrations,
            members,
            group,
            matchesForGroup,
            hasTeams
          );

        if (
          standings.length <
          requestedPerGroup
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                `${group.group_name} has only ${standings.length} calculated participants, but ${requestedPerGroup} are configured to advance.`,
              group_id:
                group.id,
              calculated:
                standings.length,
              advancing_per_group:
                requestedPerGroup,
            },
            {
              status: 400,
            }
          );
        }

        const qualified =
          standings
            .slice(
              0,
              requestedPerGroup
            )
            .map(
              (
                standing,
                index
              ) => ({
                ...standing,

                groupId:
                  group.id,

                groupName:
                  group.group_name,

                groupOrder:
                  group.group_order,

                position:
                  index + 1,
              })
            );

        qualifiedByGroup.set(
          group.id,
          qualified
        );

        groupStandingsResponse.push(
          {
            group_id:
              group.id,

            group_name:
              group.group_name,

            standings:
              standings.map(
                (
                  standing,
                  index
                ) => ({
                  ...standing,

                  position:
                    index + 1,

                  qualified:
                    index <
                    requestedPerGroup,
                })
              ),
          }
        );
      }

      /*
       * -----------------------------------------------------
       * TOTAL QUALIFIED
       *
       * THIS IS THE IMPORTANT FIX.
       *
       * 4 groups × 2 = 8.
       * 2 groups × 2 = 4.
       * 4 groups × 1 = 4.
       * -----------------------------------------------------
       */

      const totalQualified =
        groups.length *
        requestedPerGroup;

      const qualifiedParticipants =
        groups.flatMap(
          (group) =>
            qualifiedByGroup.get(
              group.id
            ) ?? []
        );

      if (
        qualifiedParticipants.length !==
        totalQualified
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Group qualification mismatch. Expected ${totalQualified} participants (${requestedPerGroup} per group × ${groups.length} groups), but calculated ${qualifiedParticipants.length}.`,
          },
          {
            status: 400,
          }
        );
      }

      if (
        totalQualified <
        MIN_ADVANCING
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "At least two qualified participants are required to create a knockout bracket.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        totalQualified >
        MAX_ADVANCING
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `The knockout system supports a maximum of ${MAX_ADVANCING} qualified participants.`,
          },
          {
            status: 400,
          }
        );
      }

      /*
       * -----------------------------------------------------
       * DETERMINE BRACKET
       * -----------------------------------------------------
       */

      const bracketSize =
        getBracketSize(
          totalQualified
        );

      const knockoutRounds =
        getKnockoutRounds(
          bracketSize
        );

      if (
        knockoutRounds.length ===
        0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Unable to determine knockout bracket.",
          },
          {
            status: 400,
          }
        );
      }

      const firstRound =
        knockoutRounds[0];

      const knockoutType =
        getStageType(
          bracketSize
        );

      /*
       * -----------------------------------------------------
       * PREVENT DUPLICATE KNOCKOUT
       * -----------------------------------------------------
       */

      const existingKnockout =
        allMatches.filter(
          (match) =>
            knockoutRounds.some(
              (round) =>
                normalize(
                  round
                ) ===
                normalize(
                  match.round
                )
            )
        );

      if (
        existingKnockout.length >
        0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Knockout fixtures have already been generated for this tournament.",
          },
          {
            status: 409,
          }
        );
      }

      /*
       * -----------------------------------------------------
       * FIND GROUP STAGE
       * -----------------------------------------------------
       */

      const qualificationStage =
        stages.find(
          (stage) => {
            const name =
              normalize(
                stage.stage_name
              );

            return (
              name.includes(
                "group"
              ) &&
              !isKnockoutRound(
                stage.stage_name
              )
            );
          }
        ) ??
        stages.find(
          (stage) =>
            normalize(
              stage.status
            ) === "active"
        ) ??
        null;

      /*
       * -----------------------------------------------------
       * CREATE KNOCKOUT STAGES
       * -----------------------------------------------------
       */

      const baseStageOrder =
        qualificationStage
          ? (
              Number(
                qualificationStage.stage_order
              ) || 0
            ) + 1
          : stages.length > 0
            ? Math.max(
                ...stages.map(
                  (stage) =>
                    Number(
                      stage.stage_order
                    ) || 0
                )
              ) + 1
            : 1;

      const stageRowsToCreate:
        Record<
          string,
          unknown
        >[] = [];

      for (
        let i = 0;
        i <
        knockoutRounds.length;
        i++
      ) {
        const roundName =
          knockoutRounds[i];

        const exists =
          stages.some(
            (stage) =>
              normalize(
                stage.stage_name
              ) ===
              normalize(
                roundName
              )
          );

        if (exists) {
          continue;
        }

        const roundBracketSize =
          Math.max(
            2,
            bracketSize /
              Math.pow(
                2,
                i
              )
          );

        stageRowsToCreate.push(
          {
            tournament_id:
              tournamentId,

            stage_name:
              roundName,

            stage_type:
              getStageType(
                roundBracketSize
              ),

            stage_order:
              baseStageOrder +
              i,

            status:
              i === 0
                ? "Active"
                : "Pending",

            teams_advancing:
              i === 0
                ? totalQualified
                : null,
          }
        );
      }

      let workingStages =
        [
          ...stages,
        ];

      if (
        stageRowsToCreate.length >
        0
      ) {
        const {
          data:
            createdStages,
          error:
            createStagesError,
        } = await supabase
          .from(
            "tournament_stages"
          )
          .insert(
            stageRowsToCreate
          )
          .select("*");

        if (
          createStagesError
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                `Failed creating knockout stages: ${createStagesError.message}`,
            },
            {
              status: 500,
            }
          );
        }

        workingStages =
          [
            ...workingStages,
            ...(
              createdStages ??
              []
            ),
          ] as TournamentStage[];
      }

      /*
       * -----------------------------------------------------
       * FIND FIRST ROUND STAGE
       * -----------------------------------------------------
       */

      let firstStage =
        workingStages.find(
          (stage) =>
            normalize(
              stage.stage_name
            ) ===
            normalize(
              firstRound
            )
        ) ??
        null;

      if (!firstStage) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Unable to create or locate ${firstRound} stage.`,
          },
          {
            status: 500,
          }
        );
      }

      /*
       * -----------------------------------------------------
       * ACTIVATE FIRST ROUND
       * -----------------------------------------------------
       */

      const {
        data:
          activatedStage,
        error:
          activateStageError,
      } = await supabase
        .from(
          "tournament_stages"
        )
        .update(
          {
            status:
              "Active",

            teams_advancing:
              totalQualified,

            stage_type:
              knockoutType,

            stage_name:
              firstRound,
          }
        )
        .eq(
          "id",
          firstStage.id
        )
        .select("*")
        .single();

      if (
        activateStageError
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              activateStageError.message,
          },
          {
            status: 500,
          }
        );
      }

      firstStage =
        (activatedStage ??
          firstStage) as TournamentStage;

      /*
       * -----------------------------------------------------
       * COMPLETE GROUP STAGE
       * -----------------------------------------------------
       */

      if (
        qualificationStage
      ) {
        const {
          error:
            completeStageError,
        } = await supabase
          .from(
            "tournament_stages"
          )
          .update(
            {
              status:
                "Completed",
            }
          )
          .eq(
            "id",
            qualificationStage.id
          );

        if (
          completeStageError
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                completeStageError.message,
            },
            {
              status: 500,
            }
          );
        }
      }

      /*
       * -----------------------------------------------------
       * MATCH NUMBER
       * -----------------------------------------------------
       */

      let nextMatchNumber =
        allMatches.reduce(
          (
            highest,
            match
          ) => {
            const number =
              Number(
                match.match_number
              );

            return Number.isFinite(
              number
            )
              ? Math.max(
                  highest,
                  number
                )
              : highest;
          },
          0
        ) + 1;

      /*
       * -----------------------------------------------------
       * GROUP-SPECIFIC FIRST ROUND
       * -----------------------------------------------------
       */

      const pairings =
        buildGroupQualifiedPairings(
          qualifiedByGroup,
          groups,
          requestedPerGroup
        );

      const firstRoundCount =
        bracketSize / 2;

      const firstRoundMatches:
        Record<
          string,
          unknown
        >[] = [];

      for (
        let i = 0;
        i <
        firstRoundCount;
        i++
      ) {
        const pairing =
          pairings[i];

        const participantA =
          pairing?.[0] ??
          null;

        const participantB =
          pairing?.[1] ??
          null;

        const hasA =
          participantA !==
          null;

        const hasB =
          participantB !==
          null;

        const isBye =
          (hasA && !hasB) ||
          (!hasA && hasB);

        const match:
          Record<
            string,
            unknown
          > = {
          tournament_id:
            tournamentId,

          game_id:
            tournament.game_id ??
            null,

          round:
            firstRound,

          match_number:
            nextMatchNumber,

          best_of:
            "BO1",

          team_a_id:
            null,

          team_b_id:
            null,

          player_a_id:
            null,

          player_b_id:
            null,

          winner_id:
            null,

          winner_team_id:
            null,

          winner_player_id:
            null,

          score_team_a:
            null,

          score_team_b:
            null,

          scheduled_date:
            null,

          scheduled_time:
            null,

          status:
            isBye
              ? "Completed"
              : "Scheduled",

          stream_link:
            null,

          notes:
            isBye
              ? "Automatic Bye"
              : participantA &&
                  participantB
                ? `${participantA.groupName} #${participantA.position} vs ${participantB.groupName} #${participantB.position}`
                : "Knockout fixture",
        };

        if (
          hasTeams
        ) {
          match.team_a_id =
            participantA?.id ??
            null;

          match.team_b_id =
            participantB?.id ??
            null;
        } else {
          match.player_a_id =
            participantA?.id ??
            null;

          match.player_b_id =
            participantB?.id ??
            null;
        }

        if (
          isBye
        ) {
          const byeParticipant =
            participantA ??
            participantB;

          match.winner_id =
            byeParticipant?.id ??
            null;

          if (
            hasTeams
          ) {
            match.winner_team_id =
              byeParticipant?.id ??
              null;
          } else {
            match.winner_player_id =
              byeParticipant?.id ??
              null;
          }
        }

        firstRoundMatches.push(
          match
        );

        nextMatchNumber++;
      }

      /*
       * -----------------------------------------------------
       * INSERT FIRST ROUND
       * -----------------------------------------------------
       */

      const {
        data:
          insertedFirstRound,
        error:
          firstRoundError,
      } = await supabase
        .from("matches")
        .insert(
          firstRoundMatches
        )
        .select("*");

      if (
        firstRoundError
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Failed creating ${firstRound}: ${firstRoundError.message}`,
          },
          {
            status: 500,
          }
        );
      }

      if (
        !insertedFirstRound ||
        insertedFirstRound.length ===
          0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `No ${firstRound} matches were created.`,
          },
          {
            status: 500,
          }
        );
      }

      const createdRounds:
        Record<
          string,
          Match[]
        > = {};

      createdRounds[
        firstRound
      ] =
        insertedFirstRound as Match[];

      let previousRoundMatches =
        insertedFirstRound as Match[];

      /*
       * -----------------------------------------------------
       * FUTURE KNOCKOUT ROUNDS
       * -----------------------------------------------------
       */

      for (
        let roundIndex = 1;
        roundIndex <
        knockoutRounds.length;
        roundIndex++
      ) {
        const roundName =
          knockoutRounds[
            roundIndex
          ];

        const currentRoundMatches:
          Record<
            string,
            unknown
          >[] = [];

        const numberOfMatches =
          previousRoundMatches.length /
          2;

        for (
          let i = 0;
          i <
          numberOfMatches;
          i++
        ) {
          const sourceA =
            previousRoundMatches[
              i * 2
            ];

          const sourceB =
            previousRoundMatches[
              i * 2 + 1
            ];

          if (
            !sourceA ||
            !sourceB
          ) {
            continue;
          }

          currentRoundMatches.push(
            {
              tournament_id:
                tournamentId,

              game_id:
                tournament.game_id ??
                null,

              round:
                roundName,

              match_number:
                nextMatchNumber,

              best_of:
                "BO1",

              team_a_id:
                null,

              team_b_id:
                null,

              player_a_id:
                null,

              player_b_id:
                null,

              winner_id:
                null,

              winner_team_id:
                null,

              winner_player_id:
                null,

              score_team_a:
                null,

              score_team_b:
                null,

              scheduled_date:
                null,

              scheduled_time:
                null,

              status:
                "Pending",

              stream_link:
                null,

              notes:
                `Winner of Match ${sourceA.match_number} vs Winner of Match ${sourceB.match_number}`,
            }
          );

          nextMatchNumber++;
        }

        if (
          currentRoundMatches.length ===
          0
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                `Unable to generate ${roundName}.`,
            },
            {
              status: 500,
            }
          );
        }

        const {
          data:
            insertedRound,
          error:
            roundError,
        } = await supabase
          .from("matches")
          .insert(
            currentRoundMatches
          )
          .select("*");

        if (
          roundError
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                `Failed creating ${roundName}: ${roundError.message}`,
            },
            {
              status: 500,
            }
          );
        }

        const typedInsertedRound =
          (insertedRound ??
            []) as Match[];

        if (
          typedInsertedRound.length ===
          0
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                `No ${roundName} matches were created.`,
            },
            {
              status: 500,
            }
          );
        }

        createdRounds[
          roundName
        ] =
          typedInsertedRound;

        /*
         * Link previous round matches
         * to the next round.
         */
        for (
          let i = 0;
          i <
          typedInsertedRound.length;
          i++
        ) {
          const nextMatch =
            typedInsertedRound[i];

          const previousA =
            previousRoundMatches[
              i * 2
            ];

          const previousB =
            previousRoundMatches[
              i * 2 + 1
            ];

          if (
            !previousA ||
            !previousB
          ) {
            continue;
          }

          const {
            error:
              previousAError,
          } = await supabase
            .from("matches")
            .update(
              {
                next_match_id:
                  nextMatch.id,

                next_match_slot:
                  "A",
              }
            )
            .eq(
              "id",
              previousA.id
            );

          if (
            previousAError
          ) {
            return NextResponse.json(
              {
                success: false,
                message:
                  `Failed linking Match ${previousA.match_number}: ${previousAError.message}`,
              },
              {
                status: 500,
              }
            );
          }

          const {
            error:
              previousBError,
          } = await supabase
            .from("matches")
            .update(
              {
                next_match_id:
                  nextMatch.id,

                next_match_slot:
                  "B",
              }
            )
            .eq(
              "id",
              previousB.id
            );

          if (
            previousBError
          ) {
            return NextResponse.json(
              {
                success: false,
                message:
                  `Failed linking Match ${previousB.match_number}: ${previousBError.message}`,
              },
              {
                status: 500,
              }
            );
          }
        }

        previousRoundMatches =
          typedInsertedRound;
      }

      /*
       * -----------------------------------------------------
       * THIRD PLACE
       * -----------------------------------------------------
       */

      if (
        bracketSize >= 4 &&
        createdRounds[
          "Semifinals"
        ]?.length === 2 &&
        body.include_third_place ===
          true
      ) {
        const semifinalMatches =
          createdRounds[
            "Semifinals"
          ];

        const {
          data:
            thirdPlace,
          error:
            thirdPlaceError,
        } = await supabase
          .from("matches")
          .insert(
            {
              tournament_id:
                tournamentId,

              game_id:
                tournament.game_id ??
                null,

              round:
                "3rd Place",

              match_number:
                nextMatchNumber,

              best_of:
                "BO1",

              team_a_id:
                null,

              team_b_id:
                null,

              player_a_id:
                null,

              player_b_id:
                null,

              winner_id:
                null,

              winner_team_id:
                null,

              winner_player_id:
                null,

              score_team_a:
                null,

              score_team_b:
                null,

              scheduled_date:
                null,

              scheduled_time:
                null,

              status:
                "Pending",

              stream_link:
                null,

              notes:
                `Loser of Match ${semifinalMatches[0].match_number} vs Loser of Match ${semifinalMatches[1].match_number}`,
            }
          )
          .select("*")
          .single();

        if (
          thirdPlaceError
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                `Failed generating 3rd Place match: ${thirdPlaceError.message}`,
            },
            {
              status: 500,
            }
          );
        }

        if (
          thirdPlace
        ) {
          createdRounds[
            "3rd Place"
          ] = [
            thirdPlace as Match,
          ];

          nextMatchNumber++;

          for (
            let i = 0;
            i < 2;
            i++
          ) {
            const semifinal =
              semifinalMatches[i];

            const {
              error:
                loserLinkError,
            } = await supabase
              .from("matches")
              .update(
                {
                  loser_next_match_id:
                    thirdPlace.id,

                  loser_next_match_slot:
                    i === 0
                      ? "A"
                      : "B",
                }
              )
              .eq(
                "id",
                semifinal.id
              );

            if (
              loserLinkError
            ) {
              return NextResponse.json(
                {
                  success: false,
                  message:
                    `Failed linking semifinal loser: ${loserLinkError.message}`,
                },
                {
                  status: 500,
                }
              );
            }
          }
        }
      }

      /*
       * -----------------------------------------------------
       * PROCESS BYES
       * -----------------------------------------------------
       */

      for (
        const firstRoundMatch of
          insertedFirstRound as Match[]
      ) {
        const teamBye =
          (
            firstRoundMatch.team_a_id !==
              null &&
            firstRoundMatch.team_b_id ===
              null
          ) ||
          (
            firstRoundMatch.team_a_id ===
              null &&
            firstRoundMatch.team_b_id !==
              null
          );

        const playerBye =
          (
            firstRoundMatch.player_a_id !==
              null &&
            firstRoundMatch.player_b_id ===
              null
          ) ||
          (
            firstRoundMatch.player_a_id ===
              null &&
            firstRoundMatch.player_b_id !==
              null
          );

        if (
          !teamBye &&
          !playerBye
        ) {
          continue;
        }

        try {
          await advanceByeMatch(
            firstRoundMatch
          );
        } catch (
          byeError
        ) {
          console.error(
            "Group knockout BYE error:",
            byeError
          );

          return NextResponse.json(
            {
              success: false,
              message:
                "The knockout bracket was generated, but an automatic BYE could not be advanced.",
              bye_match_id:
                firstRoundMatch.id,
              error:
                byeError instanceof
                Error
                  ? byeError.message
                  : "Unknown BYE error.",
            },
            {
              status: 500,
            }
          );
        }
      }

      /*
       * -----------------------------------------------------
       * RESPONSE
       * -----------------------------------------------------
       */

      const totalGenerated =
        Object.values(
          createdRounds
        ).reduce(
          (
            total,
            roundMatches
          ) =>
            total +
            roundMatches.length,
          0
        );

      return NextResponse.json(
        {
          success: true,

          message:
            `${firstRound} generated successfully from group qualification.`,

          tournament: {
            id:
              tournament.id,

            tournament_name:
              tournament.tournament_name,

            tournament_type:
              tournament.tournament_type,
          },

          qualification: {
            groups:
              groups.length,

            advancing_per_group:
              requestedPerGroup,

            total_qualified:
              totalQualified,

            group_matches:
              groupMatches.length,

            completed:
              groupMatches.length -
              incompleteGroupMatches.length,
          },

          knockout: {
            first_round:
              firstRound,

            bracket_size:
              bracketSize,

            qualified:
              totalQualified,

            byes:
              bracketSize -
              totalQualified,

            rounds:
              knockoutRounds,

            total_matches:
              totalGenerated,
          },

          qualified_participants:
            qualifiedParticipants.map(
              (
                participant,
                index
              ) => ({
                seed:
                  index + 1,

                group:
                  participant.groupName,

                position:
                  participant.position,

                id:
                  participant.id,

                name:
                  participant.name,

                type:
                  participant.type,

                points:
                  participant.points,

                wins:
                  participant.wins,

                draws:
                  participant.draws,

                losses:
                  participant.losses,

                scoreFor:
                  participant.scoreFor,

                scoreAgainst:
                  participant.scoreAgainst,
              })
            ),

          group_standings:
            groupStandingsResponse,
        },
        {
          status: 200,
        }
      );
    }

    /*
     * =======================================================
     * NORMAL KNOCKOUT / ROUND ROBIN + KNOCKOUT
     *
     * THIS SECTION PRESERVES THE EXISTING BEHAVIOUR.
     * =======================================================
     */

    const requestedAdvancing =
      Number(
        body.teams_advancing
      );

    if (
      !Number.isInteger(
        requestedAdvancing
      ) ||
      requestedAdvancing <
        MIN_ADVANCING ||
      requestedAdvancing >
        MAX_ADVANCING
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Participants advancing must be between ${MIN_ADVANCING} and ${MAX_ADVANCING}.`,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * DETERMINE QUALIFICATION STAGE
     * -------------------------------------------------------
     */

    const singleElimination =
      isSingleElimination(
        tournament.tournament_type
      );

    const roundRobinStage =
      stages.find(
        (stage) =>
          normalize(
            stage.stage_name
          ).includes(
            "round robin"
          )
      ) ??
      null;

    const activeStage =
      stages.find(
        (stage) =>
          normalize(
            stage.status
          ) === "active"
      ) ??
      null;

    const qualificationStage =
      !singleElimination &&
      activeStage &&
      !isKnockoutRound(
        activeStage.stage_name
      )
        ? activeStage
        : !singleElimination
          ? roundRobinStage
          : null;

    let qualificationMatches:
      Match[] = [];

    if (
      !singleElimination &&
      qualificationStage
    ) {
      const stageName =
        normalize(
          qualificationStage.stage_name
        );

      qualificationMatches =
        allMatches.filter(
          (match) => {
            const round =
              normalize(
                match.round
              );

            return (
              round ===
                stageName ||
              round.includes(
                stageName
              ) ||
              stageName.includes(
                round
              )
            );
          }
        );
    }

    if (
      !singleElimination &&
      qualificationMatches.length ===
        0
    ) {
      qualificationMatches =
        allMatches.filter(
          (match) =>
            normalize(
              match.round
            ).length >
              0 &&
            !isKnockoutRound(
              match.round
            )
        );
    }

    if (
      !singleElimination &&
      qualificationMatches.length ===
        0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No qualification-stage matches were found.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !singleElimination
    ) {
      const incomplete =
        qualificationMatches.filter(
          (match) =>
            normalize(
              match.status
            ) !== "completed"
        );

      if (
        incomplete.length >
        0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The current qualification stage cannot advance because not all qualification matches are completed.",
            incomplete_matches:
              incomplete.length,
            total_qualification_matches:
              qualificationMatches.length,
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * -------------------------------------------------------
     * QUALIFIED PARTICIPANTS
     * -------------------------------------------------------
     */

    let qualified: Standing[];

    if (
      singleElimination
    ) {
      const directParticipants:
        Standing[] = [];

      for (
        const registration of
          approvedRegistrations
      ) {
        const standing =
          createStanding(
            registration,
            hasTeams
          );

        if (
          standing
        ) {
          directParticipants.push(
            standing
          );
        }
      }

      if (
        directParticipants.length <
        requestedAdvancing
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Cannot advance ${requestedAdvancing} participants because only ${directParticipants.length} approved participants are available.`,
          },
          {
            status: 400,
          }
        );
      }

      qualified =
        directParticipants.slice(
          0,
          requestedAdvancing
        );
    } else {
      const standings =
        calculateStandings(
          approvedRegistrations,
          allMatches
        );

      if (
        standings.length <
        requestedAdvancing
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Cannot advance ${requestedAdvancing} participants because only ${standings.length} participants are available.`,
          },
          {
            status: 400,
          }
        );
      }

      qualified =
        standings.slice(
          0,
          requestedAdvancing
        );
    }

    if (
      qualified.length <
      MIN_ADVANCING
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "At least two participants are required to create a knockout bracket.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * BRACKET
     * -------------------------------------------------------
     */

    const bracketSize =
      getBracketSize(
        qualified.length
      );

    const knockoutRounds =
      getKnockoutRounds(
        bracketSize
      );

    if (
      knockoutRounds.length ===
      0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to determine knockout bracket.",
        },
        {
          status: 400,
        }
      );
    }

    const firstRound =
      knockoutRounds[0];

    const knockoutType =
      getStageType(
        bracketSize
      );

    const existingKnockout =
      allMatches.filter(
        (match) =>
          knockoutRounds.some(
            (round) =>
              normalize(
                round
              ) ===
              normalize(
                match.round
              )
          )
      );

    if (
      existingKnockout.length >
      0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Knockout fixtures have already been generated for this tournament.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * STAGE ORDER
     * -------------------------------------------------------
     */

    const baseStageOrder =
      qualificationStage
        ? (
            Number(
              qualificationStage.stage_order
            ) || 0
          ) + 1
        : stages.length > 0
          ? Math.max(
              ...stages.map(
                (stage) =>
                  Number(
                    stage.stage_order
                  ) || 0
              )
            ) + 1
          : 1;

    /*
     * -------------------------------------------------------
     * CREATE KNOCKOUT STAGES
     * -------------------------------------------------------
     */

    const stageRowsToCreate:
      Record<
        string,
        unknown
      >[] = [];

    for (
      let i = 0;
      i <
      knockoutRounds.length;
      i++
    ) {
      const roundName =
        knockoutRounds[i];

      const exists =
        stages.some(
          (stage) =>
            normalize(
              stage.stage_name
            ) ===
            normalize(
              roundName
            )
        );

      if (
        exists
      ) {
        continue;
      }

      const roundBracketSize =
        Math.max(
          2,
          bracketSize /
            Math.pow(
              2,
              i
            )
        );

      stageRowsToCreate.push(
        {
          tournament_id:
            tournamentId,

          stage_name:
            roundName,

          stage_type:
            getStageType(
              roundBracketSize
            ),

          stage_order:
            baseStageOrder +
            i,

          status:
            i === 0
              ? "Active"
              : "Pending",

          teams_advancing:
            i === 0
              ? qualified.length
              : null,
        }
      );
    }

    let workingStages =
      [
        ...stages,
      ];

    if (
      stageRowsToCreate.length >
      0
    ) {
      const {
        data:
          createdStages,
        error:
          createStagesError,
      } = await supabase
        .from(
          "tournament_stages"
        )
        .insert(
          stageRowsToCreate
        )
        .select("*");

      if (
        createStagesError
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Failed creating knockout stages: ${createStagesError.message}`,
          },
          {
            status: 500,
          }
        );
      }

      workingStages =
        [
          ...workingStages,
          ...(
            createdStages ??
            []
          ),
        ] as TournamentStage[];
    }

    /*
     * -------------------------------------------------------
     * FIRST STAGE
     * -------------------------------------------------------
     */

    let pendingStage =
      workingStages.find(
        (stage) =>
          normalize(
            stage.stage_name
          ) ===
          normalize(
            firstRound
          )
      ) ??
      null;

    if (
      !pendingStage
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Unable to create or locate the ${firstRound} stage.`,
        },
        {
          status: 500,
        }
      );
    }

    const {
      data:
        activatedStage,
      error:
        activateError,
    } = await supabase
      .from(
        "tournament_stages"
      )
      .update(
        {
          status:
            "Active",

          teams_advancing:
            qualified.length,

          stage_type:
            knockoutType,

          stage_name:
            firstRound,
        }
      )
      .eq(
        "id",
        pendingStage.id
      )
      .select("*")
      .single();

    if (
      activateError
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            activateError.message,
        },
        {
          status: 500,
        }
      );
    }

    pendingStage =
      (activatedStage ??
        pendingStage) as TournamentStage;

    /*
     * -------------------------------------------------------
     * COMPLETE PREVIOUS QUALIFICATION STAGE
     * -------------------------------------------------------
     */

    if (
      qualificationStage
    ) {
      const {
        error:
          completeStageError,
      } = await supabase
        .from(
          "tournament_stages"
        )
        .update(
          {
            status:
              "Completed",
          }
        )
        .eq(
          "id",
          qualificationStage.id
        );

      if (
        completeStageError
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              completeStageError.message,
          },
          {
            status: 500,
          }
        );
      }
    }

    /*
     * -------------------------------------------------------
     * MATCH NUMBER
     * -------------------------------------------------------
     */

    let nextMatchNumber =
      allMatches.reduce(
        (
          highest,
          match
        ) => {
          const number =
            Number(
              match.match_number
            );

          return Number.isFinite(
            number
          )
            ? Math.max(
                highest,
                number
              )
            : highest;
        },
        0
      ) + 1;

    /*
     * -------------------------------------------------------
     * FIRST ROUND
     * -------------------------------------------------------
     */

    const firstRoundMatches:
      Record<
        string,
        unknown
      >[] = [];

    const firstRoundCount =
      bracketSize / 2;

    for (
      let i = 0;
      i <
      firstRoundCount;
      i++
    ) {
      const participantA =
        qualified[i] ??
        null;

      const participantB =
        qualified[
          bracketSize -
            1 -
            i
        ] ??
        null;

      const hasA =
        participantA !==
        null;

      const hasB =
        participantB !==
        null;

      const isBye =
        (hasA && !hasB) ||
        (!hasA && hasB);

      const match:
        Record<
          string,
          unknown
        > = {
        tournament_id:
          tournamentId,

        game_id:
          tournament.game_id ??
          null,

        round:
          firstRound,

        match_number:
          nextMatchNumber,

        best_of:
          "BO1",

        team_a_id:
          null,

        team_b_id:
          null,

        player_a_id:
          null,

        player_b_id:
          null,

        winner_id:
          null,

        winner_team_id:
          null,

        winner_player_id:
          null,

        score_team_a:
          null,

        score_team_b:
          null,

        scheduled_date:
          null,

        scheduled_time:
          null,

        status:
          isBye
            ? "Completed"
            : "Scheduled",

        stream_link:
          null,

        notes:
          isBye
            ? "Automatic Bye"
            : `Seed ${i + 1} vs Seed ${bracketSize - i}`,
      };

      if (
        hasTeams
      ) {
        match.team_a_id =
          participantA?.id ??
          null;

        match.team_b_id =
          participantB?.id ??
          null;
      } else {
        match.player_a_id =
          participantA?.id ??
          null;

        match.player_b_id =
          participantB?.id ??
          null;
      }

      if (
        isBye
      ) {
        const byeParticipant =
          participantA ??
          participantB;

        match.winner_id =
          byeParticipant?.id ??
          null;

        if (
          hasTeams
        ) {
          match.winner_team_id =
            byeParticipant?.id ??
            null;
        } else {
          match.winner_player_id =
            byeParticipant?.id ??
            null;
        }
      }

      firstRoundMatches.push(
        match
      );

      nextMatchNumber++;
    }

    const {
      data:
        insertedFirstRound,
      error:
        firstRoundError,
    } = await supabase
      .from("matches")
      .insert(
        firstRoundMatches
      )
      .select("*");

    if (
      firstRoundError
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            firstRoundError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (
      !insertedFirstRound?.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `No ${firstRound} matches were created.`,
        },
        {
          status: 500,
        }
      );
    }

    const createdRounds:
      Record<
        string,
        Match[]
      > = {};

    createdRounds[
      firstRound
    ] =
      insertedFirstRound as Match[];

    let previousRoundMatches =
      insertedFirstRound as Match[];

    /*
     * -------------------------------------------------------
     * FUTURE ROUNDS
     * -------------------------------------------------------
     */

    for (
      let roundIndex = 1;
      roundIndex <
      knockoutRounds.length;
      roundIndex++
    ) {
      const roundName =
        knockoutRounds[
          roundIndex
        ];

      const currentRoundMatches:
        Record<
          string,
          unknown
        >[] = [];

      const numberOfMatches =
        previousRoundMatches.length /
        2;

      for (
        let i = 0;
        i <
        numberOfMatches;
        i++
      ) {
        const sourceA =
          previousRoundMatches[
            i * 2
          ];

        const sourceB =
          previousRoundMatches[
            i * 2 + 1
          ];

        if (
          !sourceA ||
          !sourceB
        ) {
          continue;
        }

        currentRoundMatches.push(
          {
            tournament_id:
              tournamentId,

            game_id:
              tournament.game_id ??
              null,

            round:
              roundName,

            match_number:
              nextMatchNumber,

            best_of:
              "BO1",

            team_a_id:
              null,

            team_b_id:
              null,

            player_a_id:
              null,

            player_b_id:
              null,

            winner_id:
              null,

            winner_team_id:
              null,

            winner_player_id:
              null,

            score_team_a:
              null,

            score_team_b:
              null,

            scheduled_date:
              null,

            scheduled_time:
              null,

            status:
              "Pending",

            stream_link:
              null,

            notes:
              `Winner of Match ${sourceA.match_number} vs Winner of Match ${sourceB.match_number}`,
          }
        );

        nextMatchNumber++;
      }

      if (
        currentRoundMatches.length ===
        0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Unable to generate ${roundName}.`,
          },
          {
            status: 500,
          }
        );
      }

      const {
        data:
          insertedRound,
        error:
          roundError,
      } = await supabase
        .from("matches")
        .insert(
          currentRoundMatches
        )
        .select("*");

      if (
        roundError
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Failed generating ${roundName}: ${roundError.message}`,
          },
          {
            status: 500,
          }
        );
      }

      const typedInsertedRound =
        (insertedRound ??
          []) as Match[];

      createdRounds[
        roundName
      ] =
        typedInsertedRound;

      for (
        let i = 0;
        i <
        typedInsertedRound.length;
        i++
      ) {
        const nextMatch =
          typedInsertedRound[i];

        const previousA =
          previousRoundMatches[
            i * 2
          ];

        const previousB =
          previousRoundMatches[
            i * 2 + 1
          ];

        if (
          !previousA ||
          !previousB
        ) {
          continue;
        }

        await supabase
          .from("matches")
          .update(
            {
              next_match_id:
                nextMatch.id,

              next_match_slot:
                "A",
            }
          )
          .eq(
            "id",
            previousA.id
          );

        await supabase
          .from("matches")
          .update(
            {
              next_match_id:
                nextMatch.id,

              next_match_slot:
                "B",
            }
          )
          .eq(
            "id",
            previousB.id
          );
      }

      previousRoundMatches =
        typedInsertedRound;
    }

    /*
     * -------------------------------------------------------
     * THIRD PLACE
     * -------------------------------------------------------
     */

    if (
      bracketSize >= 4 &&
      createdRounds[
        "Semifinals"
      ]?.length === 2 &&
      body.include_third_place ===
        true
    ) {
      const semifinalMatches =
        createdRounds[
          "Semifinals"
        ];

      const {
        data:
          thirdPlace,
        error:
          thirdPlaceError,
      } = await supabase
        .from("matches")
        .insert(
          {
            tournament_id:
              tournamentId,

            game_id:
              tournament.game_id ??
              null,

            round:
              "3rd Place",

            match_number:
              nextMatchNumber,

            best_of:
              "BO1",

            team_a_id:
              null,

            team_b_id:
              null,

            player_a_id:
              null,

            player_b_id:
              null,

            winner_id:
              null,

            winner_team_id:
              null,

            winner_player_id:
              null,

            score_team_a:
              null,

            score_team_b:
              null,

            scheduled_date:
              null,

            scheduled_time:
              null,

            status:
              "Pending",

            stream_link:
              null,

            notes:
              `Loser of Match ${semifinalMatches[0].match_number} vs Loser of Match ${semifinalMatches[1].match_number}`,
          }
        )
        .select("*")
        .single();

      if (
        thirdPlaceError
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              thirdPlaceError.message,
          },
          {
            status: 500,
          }
        );
      }

      if (
        thirdPlace
      ) {
        await supabase
          .from("matches")
          .update(
            {
              loser_next_match_id:
                thirdPlace.id,

              loser_next_match_slot:
                "A",
            }
          )
          .eq(
            "id",
            semifinalMatches[0].id
          );

        await supabase
          .from("matches")
          .update(
            {
              loser_next_match_id:
                thirdPlace.id,

              loser_next_match_slot:
                "B",
            }
          )
          .eq(
            "id",
            semifinalMatches[1].id
          );
      }
    }

    /*
     * -------------------------------------------------------
     * PROCESS BYES
     * -------------------------------------------------------
     */

    for (
      const firstRoundMatch of
        insertedFirstRound as Match[]
    ) {
      const teamBye =
        (
          firstRoundMatch.team_a_id !==
            null &&
          firstRoundMatch.team_b_id ===
            null
        ) ||
        (
          firstRoundMatch.team_a_id ===
            null &&
          firstRoundMatch.team_b_id !==
            null
        );

      const playerBye =
        (
          firstRoundMatch.player_a_id !==
            null &&
          firstRoundMatch.player_b_id ===
            null
        ) ||
        (
          firstRoundMatch.player_a_id ===
            null &&
          firstRoundMatch.player_b_id !==
            null
        );

      if (
        !teamBye &&
        !playerBye
      ) {
        continue;
      }

      try {
        await advanceByeMatch(
          firstRoundMatch
        );
      } catch (
        byeError
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The knockout bracket was generated, but an automatic BYE could not be advanced.",
            error:
              byeError instanceof
              Error
                ? byeError.message
                : "Unknown BYE error.",
          },
          {
            status: 500,
          }
        );
      }
    }

    /*
     * -------------------------------------------------------
     * NORMAL RESPONSE
     * -------------------------------------------------------
     */

    const totalGenerated =
      Object.values(
        createdRounds
      ).reduce(
        (
          total,
          roundMatches
        ) =>
          total +
          roundMatches.length,
        0
      );

    return NextResponse.json(
      {
        success: true,

        message:
          `${firstRound} generated successfully.`,

        tournament: {
          id:
            tournament.id,

          tournament_name:
            tournament.tournament_name,

          tournament_type:
            tournament.tournament_type,
        },

        knockout: {
          first_round:
            firstRound,

          bracket_size:
            bracketSize,

          qualified:
            qualified.length,

          byes:
            bracketSize -
            qualified.length,

          rounds:
            knockoutRounds,

          total_matches:
            totalGenerated,
        },

        qualified_participants:
          qualified.map(
            (
              participant,
              index
            ) => ({
              seed:
                index + 1,

              id:
                participant.id,

              name:
                participant.name,

              type:
                participant.type,

              points:
                participant.points,

              wins:
                participant.wins,

              draws:
                participant.draws,

              losses:
                participant.losses,

              scoreFor:
                participant.scoreFor,

              scoreAgainst:
                participant.scoreAgainst,
            })
          ),
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Tournament stage advancement error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof
          Error
            ? error.message
            : "Unexpected server error while advancing tournament.",
      },
      {
        status: 500,
      }
    );
  }
}