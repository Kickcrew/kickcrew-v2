import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ============================================================
// CREATE TOURNAMENT REGISTRATION
// ============================================================

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      tournament_id,
      team_id,
      player_id,
    } = body;

    // --------------------------------------------------------
    // 1. BASIC VALIDATION
    // --------------------------------------------------------

    // Tournament is required
    if (!tournament_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Tournament is required.",
        },
        { status: 400 }
      );
    }

    // Must register either a team OR a player
    if (!team_id && !player_id) {
      return NextResponse.json(
        {
          success: false,
          message: "A team or player is required.",
        },
        { status: 400 }
      );
    }

    // Cannot register both
    if (team_id && player_id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A registration cannot contain both a team and a player.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // 2. LOAD TOURNAMENT
    // --------------------------------------------------------

    const {
      data: tournament,
      error: tournamentError,
    } = await supabase
      .from("tournaments")
      .select(
        "id, max_teams, status, registration_deadline"
      )
      .eq("id", tournament_id)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json(
        {
          success: false,
          message: "Tournament not found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------------
    // 3. TOURNAMENT STATUS PROTECTION
    // --------------------------------------------------------

    if (
      tournament.status !==
      "Registration Open"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This tournament is not currently open for registration.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // 4. REGISTRATION DEADLINE PROTECTION
    // --------------------------------------------------------
    //
    // registration_deadline is stored as a DATE.
    //
    // The entire deadline day is allowed.
    //
    // Example:
    //
    // registration_deadline = 2026-08-11
    //
    // 2026-08-10 -> allowed
    // 2026-08-11 -> allowed
    // 2026-08-12 -> rejected
    //
    // We use Africa/Nairobi because KICKCREW operates
    // using Kenya time.
    // --------------------------------------------------------

    if (
      tournament.registration_deadline
    ) {
      const todayInKenya =
        new Intl.DateTimeFormat(
          "en-CA",
          {
            timeZone: "Africa/Nairobi",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }
        ).format(new Date());

      if (
        todayInKenya >
        tournament.registration_deadline
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The registration deadline for this tournament has passed. New registrations are no longer accepted.",
          },
          { status: 400 }
        );
      }
    }

    // --------------------------------------------------------
    // 5. CHECK DUPLICATE REGISTRATION
    // --------------------------------------------------------

    let duplicateQuery = supabase
      .from("tournament_registrations")
      .select("id")
      .eq(
        "tournament_id",
        tournament_id
      );

    if (team_id) {
      duplicateQuery =
        duplicateQuery.eq(
          "team_id",
          team_id
        );
    }

    if (player_id) {
      duplicateQuery =
        duplicateQuery.eq(
          "player_id",
          player_id
        );
    }

    const {
      data: existingRegistration,
      error: duplicateError,
    } = await duplicateQuery.maybeSingle();

    if (duplicateError) {
      console.error(
        "Duplicate registration check error:",
        duplicateError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to verify whether this competitor is already registered.",
        },
        { status: 500 }
      );
    }

    if (existingRegistration) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This team or player is already registered for this tournament.",
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------------
    // 6. CHECK MAXIMUM TEAM LIMIT
    // --------------------------------------------------------

    if (
      team_id &&
      tournament.max_teams
    ) {
      const {
        count,
        error: countError,
      } = await supabase
        .from("tournament_registrations")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq(
          "tournament_id",
          tournament_id
        )
        .not(
          "team_id",
          "is",
          null
        );

      if (countError) {
        console.error(
          "Team count error:",
          countError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Unable to check tournament team capacity.",
          },
          { status: 500 }
        );
      }

      if (
        (count ?? 0) >=
        tournament.max_teams
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This tournament has reached its maximum number of teams.",
          },
          { status: 400 }
        );
      }
    }

    // --------------------------------------------------------
    // 7. CREATE REGISTRATION
    // --------------------------------------------------------

    const {
      data: registration,
      error: registrationError,
    } = await supabase
      .from(
        "tournament_registrations"
      )
      .insert({
        tournament_id,
        team_id:
          team_id || null,
        player_id:
          player_id || null,
        status: "Pending",
      })
      .select()
      .single();

    // --------------------------------------------------------
    // 8. DATABASE DUPLICATE PROTECTION
    // --------------------------------------------------------
    //
    // The unique indexes we created in Supabase are the
    // final protection against duplicate registrations.
    //
    // PostgreSQL error code 23505 = unique violation.
    // --------------------------------------------------------

    if (registrationError) {
      console.error(
        "Registration insert error:",
        registrationError
      );

      if (
        registrationError.code ===
        "23505"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This team or player is already registered for this tournament.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message:
            registrationError.message ||
            "Failed to create tournament registration.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------------
    // 9. SUCCESS
    // --------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message:
          "Tournament registration submitted successfully.",
        registration,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Tournament registration error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Internal server error.",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// GET TOURNAMENT REGISTRATIONS
//
// IMPORTANT:
// We deliberately fetch players/teams separately instead of
// depending on Supabase nested relationship output.
//
// This guarantees that Stage Advancement can resolve:
//
// player_id -> gamer_tag / full_name
//
// team_id -> team_name
// ============================================================

export async function GET(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const tournamentId =
      searchParams.get(
        "tournament_id"
      );

    // --------------------------------------------------------
    // 1. GET REGISTRATIONS
    // --------------------------------------------------------

    let registrationsQuery =
      supabase
        .from(
          "tournament_registrations"
        )
        .select("*")
        .order(
          "registered_at",
          {
            ascending: false,
          }
        );

    if (tournamentId) {
      registrationsQuery =
        registrationsQuery.eq(
          "tournament_id",
          tournamentId
        );
    }

    const {
      data: registrations,
      error: registrationsError,
    } =
      await registrationsQuery;

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

    const registrationRows =
      registrations ?? [];

    // --------------------------------------------------------
    // 2. COLLECT PLAYER IDS
    // --------------------------------------------------------

    const playerIds =
      Array.from(
        new Set(
          registrationRows
            .map(
              (registration) =>
                registration.player_id
            )
            .filter(
              (
                id
              ): id is number =>
                id !== null &&
                id !== undefined
            )
        )
      );

    // --------------------------------------------------------
    // 3. COLLECT TEAM IDS
    // --------------------------------------------------------

    const teamIds =
      Array.from(
        new Set(
          registrationRows
            .map(
              (registration) =>
                registration.team_id
            )
            .filter(
              (
                id
              ): id is number =>
                id !== null &&
                id !== undefined
            )
        )
      );

    // --------------------------------------------------------
    // 4. FETCH PLAYERS
    // --------------------------------------------------------

    let players: {
      id: number;
      full_name: string | null;
      gamer_tag: string | null;
    }[] = [];

    if (playerIds.length > 0) {
      const {
        data: playerData,
        error: playersError,
      } = await supabase
        .from("players")
        .select(
          "id, full_name, gamer_tag"
        )
        .in(
          "id",
          playerIds
        );

      if (playersError) {
        return NextResponse.json(
          {
            success: false,
            message:
              playersError.message,
          },
          { status: 500 }
        );
      }

      players =
        playerData ?? [];
    }

    // --------------------------------------------------------
    // 5. FETCH TEAMS
    // --------------------------------------------------------

    let teams: {
      id: number;
      team_name: string | null;
    }[] = [];

    if (teamIds.length > 0) {
      const {
        data: teamData,
        error: teamsError,
      } = await supabase
        .from("teams")
        .select(
          "id, team_name"
        )
        .in(
          "id",
          teamIds
        );

      if (teamsError) {
        return NextResponse.json(
          {
            success: false,
            message:
              teamsError.message,
          },
          { status: 500 }
        );
      }

      teams =
        teamData ?? [];
    }

    // --------------------------------------------------------
    // 6. FETCH TOURNAMENTS
    // --------------------------------------------------------

    const tournamentIds =
      Array.from(
        new Set(
          registrationRows
            .map(
              (registration) =>
                registration.tournament_id
            )
            .filter(
              (
                id
              ): id is number =>
                id !== null &&
                id !== undefined
            )
        )
      );

    let tournaments: {
      id: number;
      tournament_name: string | null;
    }[] = [];

    if (
      tournamentIds.length > 0
    ) {
      const {
        data: tournamentData,
        error: tournamentsError,
      } = await supabase
        .from("tournaments")
        .select(
          "id, tournament_name"
        )
        .in(
          "id",
          tournamentIds
        );

      if (tournamentsError) {
        return NextResponse.json(
          {
            success: false,
            message:
              tournamentsError.message,
          },
          { status: 500 }
        );
      }

      tournaments =
        tournamentData ?? [];
    }

    // --------------------------------------------------------
    // 7. BUILD LOOKUP MAPS
    // --------------------------------------------------------

    const playerMap =
      new Map(
        players.map(
          (player) => [
            player.id,
            player,
          ]
        )
      );

    const teamMap =
      new Map(
        teams.map(
          (team) => [
            team.id,
            team,
          ]
        )
      );

    const tournamentMap =
      new Map(
        tournaments.map(
          (tournament) => [
            tournament.id,
            tournament,
          ]
        )
      );

    // --------------------------------------------------------
    // 8. ATTACH PLAYER / TEAM / TOURNAMENT DATA
    // --------------------------------------------------------

    const enrichedRegistrations =
      registrationRows.map(
        (registration) => {
          const player =
            registration.player_id
              ? playerMap.get(
                  registration.player_id
                )
              : null;

          const team =
            registration.team_id
              ? teamMap.get(
                  registration.team_id
                )
              : null;

          const tournament =
            registration.tournament_id
              ? tournamentMap.get(
                  registration.tournament_id
                )
              : null;

          return {
            ...registration,

            tournaments:
              tournament
                ? [tournament]
                : [],

            players:
              player
                ? [player]
                : [],

            teams:
              team
                ? [team]
                : [],
          };
        }
      );

    // --------------------------------------------------------
    // 9. RETURN RESPONSE
    // --------------------------------------------------------

    return NextResponse.json({
      success: true,
      registrations:
        enrichedRegistrations,
    });
  } catch (error) {
    console.error(
      "Registration fetch error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Internal server error.",
      },
      { status: 500 }
    );
  }
}