import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

interface Registration {
  id: number;
  tournament_id: number;
  team_id: number | null;
  player_id: number | null;
  status: string | null;
}

interface Team {
  id: number;
  team_name: string | null;
}

interface Player {
  id: number;
  full_name: string | null;
  gamer_tag: string | null;
}

interface TournamentGroup {
  id: number;
  tournament_id: number;
  group_name: string;
  group_code: string | null;
  group_order: number;
  status: string | null;
  created_at?: string | null;
}

interface GroupMember {
  id: number;
  tournament_group_id: number;
  registration_id: number;
  seed_number: number | null;
  created_at?: string | null;
}

interface GroupParticipant {
  id: number;
  registration_id: number;

  type: "Team" | "Player";

  name: string;

  team_id: number | null;
  player_id: number | null;

  team_name: string | null;
  gamer_tag: string | null;
  full_name: string | null;

  seed_number: number | null;
}

interface GroupWithParticipants extends TournamentGroup {
  participants: GroupParticipant[];
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getPlayerName(player: Player | undefined): string {
  if (!player) {
    return "Unknown Player";
  }

  return (
    player.gamer_tag?.trim() ||
    player.full_name?.trim() ||
    `Player #${player.id}`
  );
}

function getTeamName(team: Team | undefined): string {
  if (!team) {
    return "Unknown Team";
  }

  return (
    team.team_name?.trim() ||
    `Team #${team.id}`
  );
}

/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
|
| Returns:
|
| {
|   success: true,
|   groups: [...],
|   members: [...]
| }
|
| The groups additionally contain:
|
| participants: [...]
|
| Each participant works for BOTH:
| - player tournaments
| - team tournaments
|
|--------------------------------------------------------------------------
*/

export async function GET(
  _request: Request,
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

    /*
    |--------------------------------------------------------------------------
    | LOAD GROUPS
    |--------------------------------------------------------------------------
    */

    const {
      data: groupsData,
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
          status,
          created_at
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
      console.error(
        "Tournament groups GET error:",
        groupsError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            groupsError.message ||
            "Failed to load tournament groups.",
        },
        { status: 500 }
      );
    }

    const groups =
      (groupsData ??
        []) as TournamentGroup[];

    /*
    |--------------------------------------------------------------------------
    | NO GROUPS
    |--------------------------------------------------------------------------
    */

    if (groups.length === 0) {
      return NextResponse.json({
        success: true,
        groups: [],
        members: [],
      });
    }

    /*
    |--------------------------------------------------------------------------
    | LOAD GROUP MEMBERS
    |--------------------------------------------------------------------------
    */

    const groupIds =
      groups.map(
        (group) => group.id
      );

    const {
      data: membersData,
      error: membersError,
    } = await supabase
      .from("tournament_group_members")
      .select(
        `
          id,
          tournament_group_id,
          registration_id,
          seed_number,
          created_at
        `
      )
      .in(
        "tournament_group_id",
        groupIds
      )
      .order(
        "seed_number",
        {
          ascending: true,
          nullsFirst: false,
        }
      );

    if (membersError) {
      console.error(
        "Tournament group members GET error:",
        membersError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            membersError.message ||
            "Failed to load tournament group participants.",
        },
        { status: 500 }
      );
    }

    const members =
      (membersData ??
        []) as GroupMember[];

    /*
    |--------------------------------------------------------------------------
    | LOAD REGISTRATIONS
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | We deliberately DO NOT do:
    |
    | registrations.select(`
    |   ...,
    |   teams (...),
    |   players (...)
    | `)
    |
    | because Supabase returns those relationships as arrays and that
    | conflicts with object-based TypeScript interfaces.
    |
    |--------------------------------------------------------------------------
    */

    const registrationIds = Array.from(
      new Set(
        members.map(
          (member) =>
            member.registration_id
        )
      )
    );

    let registrations: Registration[] =
      [];

    if (registrationIds.length > 0) {
      const {
        data: registrationsData,
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
        .in(
          "id",
          registrationIds
        );

      if (registrationsError) {
        console.error(
          "Tournament registrations GET error:",
          registrationsError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              registrationsError.message ||
              "Failed to load tournament registrations.",
          },
          { status: 500 }
        );
      }

      registrations =
        (registrationsData ??
          []) as Registration[];
    }

    /*
    |--------------------------------------------------------------------------
    | LOAD TEAMS
    |--------------------------------------------------------------------------
    */

    const teamIds = Array.from(
      new Set(
        registrations
          .map(
            (registration) =>
              registration.team_id
          )
          .filter(
            (
              value
            ): value is number =>
              value !== null
          )
      )
    );

    let teams: Team[] = [];

    if (teamIds.length > 0) {
      const {
        data: teamsData,
        error: teamsError,
      } = await supabase
        .from("teams")
        .select(
          `
            id,
            team_name
          `
        )
        .in(
          "id",
          teamIds
        );

      if (teamsError) {
        console.error(
          "Tournament group teams GET error:",
          teamsError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              teamsError.message ||
              "Failed to load team information.",
          },
          { status: 500 }
        );
      }

      teams =
        (teamsData ?? []) as Team[];
    }

    /*
    |--------------------------------------------------------------------------
    | LOAD PLAYERS
    |--------------------------------------------------------------------------
    */

    const playerIds = Array.from(
      new Set(
        registrations
          .map(
            (registration) =>
              registration.player_id
          )
          .filter(
            (
              value
            ): value is number =>
              value !== null
          )
      )
    );

    let players: Player[] = [];

    if (playerIds.length > 0) {
      const {
        data: playersData,
        error: playersError,
      } = await supabase
        .from("players")
        .select(
          `
            id,
            full_name,
            gamer_tag
          `
        )
        .in(
          "id",
          playerIds
        );

      if (playersError) {
        console.error(
          "Tournament group players GET error:",
          playersError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              playersError.message ||
              "Failed to load player information.",
          },
          { status: 500 }
        );
      }

      players =
        (playersData ?? []) as Player[];
    }

    /*
    |--------------------------------------------------------------------------
    | LOOKUP MAPS
    |--------------------------------------------------------------------------
    */

    const registrationMap =
      new Map<
        number,
        Registration
      >();

    registrations.forEach(
      (registration) => {
        registrationMap.set(
          registration.id,
          registration
        );
      }
    );

    const teamMap =
      new Map<number, Team>();

    teams.forEach((team) => {
      teamMap.set(
        team.id,
        team
      );
    });

    const playerMap =
      new Map<number, Player>();

    players.forEach((player) => {
      playerMap.set(
        player.id,
        player
      );
    });

    /*
    |--------------------------------------------------------------------------
    | BUILD PARTICIPANTS
    |--------------------------------------------------------------------------
    */

    const participantsByGroup =
      new Map<
        number,
        GroupParticipant[]
      >();

    groups.forEach(
      (group) => {
        participantsByGroup.set(
          group.id,
          []
        );
      }
    );

    for (const member of members) {
      const registration =
        registrationMap.get(
          member.registration_id
        );

      if (!registration) {
        continue;
      }

      /*
      |--------------------------------------------------------------------------
      | TEAM
      |--------------------------------------------------------------------------
      */

      if (
        registration.team_id !==
        null
      ) {
        const team =
          teamMap.get(
            registration.team_id
          );

        const participant: GroupParticipant =
          {
            id:
              registration.team_id,

            registration_id:
              registration.id,

            type: "Team",

            name:
              getTeamName(team),

            team_id:
              registration.team_id,

            player_id:
              registration.player_id,

            team_name:
              team?.team_name ??
              null,

            gamer_tag:
              null,

            full_name:
              null,

            seed_number:
              member.seed_number,
          };

        const groupParticipants =
          participantsByGroup.get(
            member.tournament_group_id
          );

        if (groupParticipants) {
          groupParticipants.push(
            participant
          );
        }

        continue;
      }

      /*
      |--------------------------------------------------------------------------
      | PLAYER
      |--------------------------------------------------------------------------
      */

      if (
        registration.player_id !==
        null
      ) {
        const player =
          playerMap.get(
            registration.player_id
          );

        const participant: GroupParticipant =
          {
            id:
              registration.player_id,

            registration_id:
              registration.id,

            type: "Player",

            name:
              getPlayerName(player),

            team_id:
              null,

            player_id:
              registration.player_id,

            team_name:
              null,

            gamer_tag:
              player?.gamer_tag ??
              null,

            full_name:
              player?.full_name ??
              null,

            seed_number:
              member.seed_number,
          };

        const groupParticipants =
          participantsByGroup.get(
            member.tournament_group_id
          );

        if (groupParticipants) {
          groupParticipants.push(
            participant
          );
        }
      }
    }

    /*
    |--------------------------------------------------------------------------
    | SORT PARTICIPANTS
    |--------------------------------------------------------------------------
    */

    participantsByGroup.forEach(
      (groupParticipants) => {
        groupParticipants.sort(
          (a, b) => {
            const seedA =
              a.seed_number ??
              999999;

            const seedB =
              b.seed_number ??
              999999;

            if (
              seedA !==
              seedB
            ) {
              return (
                seedA -
                seedB
              );
            }

            return a.name.localeCompare(
              b.name
            );
          }
        );
      }
    );

    /*
    |--------------------------------------------------------------------------
    | BUILD FINAL GROUP RESPONSE
    |--------------------------------------------------------------------------
    */

    const groupsWithParticipants:
      GroupWithParticipants[] =
      groups.map(
        (group) => ({
          ...group,

          participants:
            participantsByGroup.get(
              group.id
            ) ?? [],
        })
      );

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json({
      success: true,

      groups:
        groupsWithParticipants,

      members,
    });
  } catch (error) {
    console.error(
      "Tournament groups GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Internal server error.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST
|--------------------------------------------------------------------------
|
| Creates groups and distributes approved registrations.
|
| Accepted body formats:
|
| {
|   group_count: 2
| }
|
| OR:
|
| {
|   number_of_groups: 2
| }
|
| OR:
|
| {
|   groups: 2
| }
|
|--------------------------------------------------------------------------
*/

export async function POST(
  request: Request,
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

    /*
    |--------------------------------------------------------------------------
    | READ REQUEST
    |--------------------------------------------------------------------------
    */

    let body: Record<
      string,
      unknown
    >;

    try {
      body =
        (await request.json()) as Record<
          string,
          unknown
        >;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid JSON request body.",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | GROUP COUNT
    |--------------------------------------------------------------------------
    */

    const requestedGroupCount =
      Number(
        body.group_count ??
          body.number_of_groups ??
          body.groups
      );

    if (
      !Number.isInteger(
        requestedGroupCount
      ) ||
      requestedGroupCount < 2 ||
      requestedGroupCount > 32
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Group count must be an integer between 2 and 32.",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | LOAD TOURNAMENT
    |--------------------------------------------------------------------------
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
          status
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
        { status: 404 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | LOAD APPROVED REGISTRATIONS
    |--------------------------------------------------------------------------
    */

    const {
      data: registrationsData,
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
      )
      .order(
        "id",
        {
          ascending: true,
        }
      );

    if (registrationsError) {
      console.error(
        "Approved registration lookup error:",
        registrationsError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            registrationsError.message ||
            "Failed to load approved participants.",
        },
        { status: 500 }
      );
    }

    const registrations =
      (registrationsData ??
        []) as Registration[];

    /*
    |--------------------------------------------------------------------------
    | VALIDATE PARTICIPANTS
    |--------------------------------------------------------------------------
    */

    if (
      registrations.length <
      requestedGroupCount
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `There are only ${registrations.length} approved participants, so ${requestedGroupCount} groups cannot be created.`,
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | DETERMINE PARTICIPANT TYPE
    |--------------------------------------------------------------------------
    */

    const hasTeams =
      registrations.some(
        (registration) =>
          registration.team_id !==
          null
      );

    const hasPlayers =
      registrations.some(
        (registration) =>
          registration.player_id !==
          null
      );

    if (
      hasTeams &&
      hasPlayers
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This tournament contains both team and player registrations. A group stage must use one participant type.",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK FOR INVALID REGISTRATIONS
    |--------------------------------------------------------------------------
    */

    const invalidRegistrations =
      registrations.filter(
        (registration) =>
          registration.team_id ===
            null &&
          registration.player_id ===
            null
      );

    if (
      invalidRegistrations.length >
      0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "One or more approved registrations do not have a team or player assigned.",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK EXISTING GROUPS
    |--------------------------------------------------------------------------
    */

    const {
      data: existingGroupsData,
      error: existingGroupsError,
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
      .order(
        "group_order",
        {
          ascending: true,
        }
      );

    if (existingGroupsError) {
      return NextResponse.json(
        {
          success: false,
          message:
            existingGroupsError.message ||
            "Failed to check existing groups.",
        },
        { status: 500 }
      );
    }

    const existingGroups =
      (existingGroupsData ??
        []) as TournamentGroup[];

    /*
    |--------------------------------------------------------------------------
    | IF GROUPS ALREADY EXIST
    |--------------------------------------------------------------------------
    |
    | Do not create duplicate groups.
    |
    |--------------------------------------------------------------------------
    */

    if (
      existingGroups.length >
      0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Groups have already been created for this tournament.",
          groups:
            existingGroups,
        },
        { status: 409 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE GROUP ROWS
    |--------------------------------------------------------------------------
    */

    const groupRows =
      Array.from(
        {
          length:
            requestedGroupCount,
        },
        (_, index) => {
          const letter =
            String.fromCharCode(
              65 + index
            );

          return {
            tournament_id:
              tournamentId,

            group_name:
              `Group ${letter}`,

            group_code:
              letter,

            group_order:
              index + 1,

            status:
              "Active",
          };
        }
      );

    /*
    |--------------------------------------------------------------------------
    | INSERT GROUPS
    |--------------------------------------------------------------------------
    */

    const {
      data: createdGroupsData,
      error: createGroupsError,
    } = await supabase
      .from("tournament_groups")
      .insert(
        groupRows
      )
      .select(
        `
          id,
          tournament_id,
          group_name,
          group_code,
          group_order,
          status,
          created_at
        `
      );

    if (
      createGroupsError
    ) {
      console.error(
        "Create tournament groups error:",
        createGroupsError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            createGroupsError.message ||
            "Failed to create tournament groups.",
        },
        { status: 500 }
      );
    }

    const createdGroups =
      (createdGroupsData ??
        []) as TournamentGroup[];

    if (
      createdGroups.length !==
      requestedGroupCount
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The tournament groups were not created correctly.",
        },
        { status: 500 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | DISTRIBUTE PARTICIPANTS
    |--------------------------------------------------------------------------
    |
    | Deterministic distribution:
    |
    | 6 players / 2 groups:
    |
    | Group A:
    | Player 1
    | Player 2
    | Player 3
    |
    | Group B:
    | Player 4
    | Player 5
    | Player 6
    |
    | If the number isn't divisible evenly, the first groups
    | receive one extra participant.
    |
    |--------------------------------------------------------------------------
    */

    const totalParticipants =
      registrations.length;

    const basePerGroup =
      Math.floor(
        totalParticipants /
          requestedGroupCount
      );

    const remainder =
      totalParticipants %
      requestedGroupCount;

    const groupMembersToInsert:
      Record<
        string,
        unknown
      >[] = [];

    let registrationIndex = 0;

    for (
      let groupIndex = 0;
      groupIndex <
      createdGroups.length;
      groupIndex++
    ) {
      const group =
        createdGroups[
          groupIndex
        ];

      const participantsInThisGroup =
        basePerGroup +
        (groupIndex <
        remainder
          ? 1
          : 0);

      for (
        let seed = 1;
        seed <=
        participantsInThisGroup;
        seed++
      ) {
        const registration =
          registrations[
            registrationIndex
          ];

        if (!registration) {
          continue;
        }

        groupMembersToInsert.push(
          {
            tournament_group_id:
              group.id,

            registration_id:
              registration.id,

            seed_number:
              seed,
          }
        );

        registrationIndex++;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | INSERT GROUP MEMBERS
    |--------------------------------------------------------------------------
    */

    if (
      groupMembersToInsert.length ===
      0
    ) {
      /*
       * Safety rollback.
       */

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
            "No group participants could be assigned.",
        },
        { status: 500 }
      );
    }

    const {
      data: createdMembersData,
      error: createMembersError,
    } = await supabase
      .from(
        "tournament_group_members"
      )
      .insert(
        groupMembersToInsert
      )
      .select(
        `
          id,
          tournament_group_id,
          registration_id,
          seed_number,
          created_at
        `
      );

    if (
      createMembersError
    ) {
      console.error(
        "Create tournament group members error:",
        createMembersError
      );

      /*
      |--------------------------------------------------------------------------
      | ROLLBACK GROUPS
      |--------------------------------------------------------------------------
      */

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
            createMembersError.message ||
            "Failed to assign participants to tournament groups.",
        },
        { status: 500 }
      );
    }

    const createdMembers =
      (createdMembersData ??
        []) as GroupMember[];

    /*
    |--------------------------------------------------------------------------
    | VERIFY ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    if (
      createdMembers.length !==
      registrations.length
    ) {
      console.error(
        "Group assignment count mismatch:",
        {
          expected:
            registrations.length,

          created:
            createdMembers.length,
        }
      );

      /*
       * Attempt rollback.
       */

      await supabase
        .from(
          "tournament_group_members"
        )
        .delete()
        .in(
          "tournament_group_id",
          createdGroups.map(
            (group) =>
              group.id
          )
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
            "Participant assignment was incomplete. The group creation was rolled back.",
        },
        { status: 500 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | RETURN SUCCESS
    |--------------------------------------------------------------------------
    */

    return NextResponse.json({
      success: true,

      message:
        "Group stage created successfully.",

      tournament: {
        id:
          tournament.id,

        tournament_name:
          tournament.tournament_name,

        tournament_type:
          tournament.tournament_type,
      },

      group_count:
        createdGroups.length,

      participant_count:
        registrations.length,

      groups:
        createdGroups,

      members:
        createdMembers,
    });
  } catch (error) {
    console.error(
      "Tournament groups POST error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Internal server error.",
      },
      { status: 500 }
    );
  }
}