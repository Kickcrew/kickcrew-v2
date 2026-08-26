import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

interface Participant {
  registrationId: number;
  teamId: number | null;
  playerId: number | null;
  name: string;
}

interface RegistrationRow {
  id: number;
  tournament_id: number;
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
        full_name: string | null;
        gamer_tag: string | null;
      }[]
    | null;
}

interface MatchRow {
  id: number;
  tournament_id: number;
  team_a_id: number | null;
  team_b_id: number | null;
  player_a_id: number | null;
  player_b_id: number | null;
  round: string | null;
  match_number: number;
  score_team_a: number | null;
  score_team_b: number | null;
  winner_id: number | null;
  status: string | null;
  scheduled_at?: string | null;
  created_at?: string | null;
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function getParticipant(
  registration: RegistrationRow
): Participant | null {
  /*
   * TEAM REGISTRATION
   */

  if (registration.team_id !== null) {
    const team = registration.teams?.[0] ?? null;

    return {
      registrationId: registration.id,
      teamId: registration.team_id,
      playerId: null,
      name:
        team?.team_name ??
        `Team #${registration.team_id}`,
    };
  }

  /*
   * PLAYER REGISTRATION
   */

  if (registration.player_id !== null) {
    const player = registration.players?.[0] ?? null;

    return {
      registrationId: registration.id,
      teamId: null,
      playerId: registration.player_id,
      name:
        player?.gamer_tag ||
        player?.full_name ||
        `Player #${registration.player_id}`,
    };
  }

  /*
   * Invalid registration
   */

  return null;
}

function getParticipants(
  registrations: RegistrationRow[]
): Participant[] {
  const participants: Participant[] = [];

  for (const registration of registrations) {
    const participant =
      getParticipant(registration);

    if (participant) {
      participants.push(participant);
    }
  }

  return participants;
}

/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
|
| Loads tournament matches.
|
| IMPORTANT:
| This route does NOT generate group-stage fixtures.
|
|--------------------------------------------------------------------------
*/

export async function GET(
  request: NextRequest
) {
  try {
    const tournamentIdParam =
      request.nextUrl.searchParams.get(
        "tournament_id"
      );

    if (!tournamentIdParam) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A tournament ID is required.",
        },
        { status: 400 }
      );
    }

    const tournamentId =
      Number(tournamentIdParam);

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

    const supabase =
      await createClient();

    /*
     * ------------------------------------------------------
     * LOAD MATCHES
     * ------------------------------------------------------
     */

    const {
      data: matches,
      error: matchesError,
    } = await supabase
      .from("matches")
      .select("*")
      .eq(
        "tournament_id",
        tournamentId
      )
      .order("match_number", {
        ascending: true,
      });

    if (matchesError) {
      console.error(
        "Load matches error:",
        matchesError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            matchesError.message,
        },
        { status: 500 }
      );
    }

    /*
     * ------------------------------------------------------
     * LOAD REGISTRATIONS
     * ------------------------------------------------------
     *
     * Used only to resolve participant names.
     *
     * No fixtures are created here.
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
      );

    if (registrationsError) {
      console.error(
        "Load registrations error:",
        registrationsError
      );

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
      (registrations ??
        []) as RegistrationRow[];

    /*
     * ------------------------------------------------------
     * PARTICIPANTS
     * ------------------------------------------------------
     */

    const participants =
      getParticipants(
        registrationRows
      );

    /*
     * ------------------------------------------------------
     * RETURN MATCHES
     * ------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      matches:
        (matches ?? []) as MatchRow[],

      participants,

      matchCount:
        matches?.length ?? 0,

      participantCount:
        participants.length,
    });
  } catch (error) {
    console.error(
      "GET /api/matches error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load matches.",
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
| Creates ONE match.
|
| IMPORTANT:
| This endpoint does not generate:
|
| - round robin fixtures
| - group fixtures
| - group-stage schedules
| - automatic match lists
|
| A match must be explicitly supplied by
| the caller.
|
|--------------------------------------------------------------------------
*/

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const tournamentId =
      Number(body.tournament_id);

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
     * ------------------------------------------------------
     * BASIC MATCH VALUES
     * ------------------------------------------------------
     */

    const teamAId =
      body.team_a_id !== null &&
      body.team_a_id !== undefined &&
      body.team_a_id !== ""
        ? Number(body.team_a_id)
        : null;

    const teamBId =
      body.team_b_id !== null &&
      body.team_b_id !== undefined &&
      body.team_b_id !== ""
        ? Number(body.team_b_id)
        : null;

    const playerAId =
      body.player_a_id !== null &&
      body.player_a_id !== undefined &&
      body.player_a_id !== ""
        ? Number(body.player_a_id)
        : null;

    const playerBId =
      body.player_b_id !== null &&
      body.player_b_id !== undefined &&
      body.player_b_id !== ""
        ? Number(body.player_b_id)
        : null;

    const matchNumber =
      Number(body.match_number);

    if (
      !Number.isInteger(matchNumber) ||
      matchNumber <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A valid match number is required.",
        },
        { status: 400 }
      );
    }

    /*
     * ------------------------------------------------------
     * VALIDATE PARTICIPANTS
     * ------------------------------------------------------
     *
     * A match can be:
     *
     * Team vs Team
     *
     * OR
     *
     * Player vs Player
     *
     * but not a mixture.
     */

    const isTeamMatch =
      teamAId !== null ||
      teamBId !== null;

    const isPlayerMatch =
      playerAId !== null ||
      playerBId !== null;

    if (
      isTeamMatch &&
      isPlayerMatch
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A match cannot mix team and player participants.",
        },
        { status: 400 }
      );
    }

    if (isTeamMatch) {
      if (
        teamAId === null ||
        teamBId === null
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Both teams are required for a team match.",
          },
          { status: 400 }
        );
      }

      if (teamAId === teamBId) {
        return NextResponse.json(
          {
            success: false,
            message:
              "A participant cannot play against themselves.",
          },
          { status: 400 }
        );
      }
    }

    if (isPlayerMatch) {
      if (
        playerAId === null ||
        playerBId === null
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Both players are required for a player match.",
          },
          { status: 400 }
        );
      }

      if (playerAId === playerBId) {
        return NextResponse.json(
          {
            success: false,
            message:
              "A participant cannot play against themselves.",
          },
          { status: 400 }
        );
      }
    }

    if (
      !isTeamMatch &&
      !isPlayerMatch
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Two valid participants are required.",
        },
        { status: 400 }
      );
    }

    /*
     * ------------------------------------------------------
     * OPTIONAL VALUES
     * ------------------------------------------------------
     */

    const round =
      body.round !== undefined &&
      body.round !== null &&
      body.round !== ""
        ? String(body.round)
        : null;

    const scoreTeamA =
      body.score_team_a !== null &&
      body.score_team_a !== undefined &&
      body.score_team_a !== ""
        ? Number(body.score_team_a)
        : null;

    const scoreTeamB =
      body.score_team_b !== null &&
      body.score_team_b !== undefined &&
      body.score_team_b !== ""
        ? Number(body.score_team_b)
        : null;

    const winnerId =
      body.winner_id !== null &&
      body.winner_id !== undefined &&
      body.winner_id !== ""
        ? Number(body.winner_id)
        : null;

    const status =
      body.status !== undefined &&
      body.status !== null &&
      body.status !== ""
        ? String(body.status)
        : "Scheduled";

    const scheduledAt =
      body.scheduled_at !== undefined &&
      body.scheduled_at !== null &&
      body.scheduled_at !== ""
        ? String(body.scheduled_at)
        : null;

    /*
     * ------------------------------------------------------
     * VALIDATE SCORES
     * ------------------------------------------------------
     */

    if (
      scoreTeamA !== null &&
      (!Number.isFinite(
        scoreTeamA
      ) ||
        scoreTeamA < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid score for participant A.",
        },
        { status: 400 }
      );
    }

    if (
      scoreTeamB !== null &&
      (!Number.isFinite(
        scoreTeamB
      ) ||
        scoreTeamB < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid score for participant B.",
        },
        { status: 400 }
      );
    }

    /*
     * ------------------------------------------------------
     * CREATE MATCH
     * ------------------------------------------------------
     */

    const matchPayload: Record<
      string,
      unknown
    > = {
      tournament_id:
        tournamentId,

      team_a_id:
        teamAId,

      team_b_id:
        teamBId,

      player_a_id:
        playerAId,

      player_b_id:
        playerBId,

      round,

      match_number:
        matchNumber,

      score_team_a:
        scoreTeamA,

      score_team_b:
        scoreTeamB,

      winner_id:
        winnerId,

      status,

      scheduled_at:
        scheduledAt,
    };

    /*
     * Remove scheduled_at when it is null.
     *
     * This avoids issues if the current
     * database schema does not contain
     * the optional column.
     */

    if (
      scheduledAt === null
    ) {
      delete matchPayload.scheduled_at;
    }

    const supabase =
      await createClient();

    const {
      data: createdMatch,
      error: createMatchError,
    } = await supabase
      .from("matches")
      .insert(matchPayload)
      .select("*")
      .single();

    if (createMatchError) {
      console.error(
        "Create match error:",
        createMatchError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            createMatchError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,

        message:
          "Match created successfully.",

        match:
          createdMatch,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/matches error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create match.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PATCH
|--------------------------------------------------------------------------
|
| Updates ONE existing match.
|
|--------------------------------------------------------------------------
*/

export async function PATCH(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const matchId =
      Number(body.id);

    if (
      !Number.isInteger(matchId) ||
      matchId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A valid match ID is required.",
        },
        { status: 400 }
      );
    }

    const updates: Record<
      string,
      unknown
    > = {};

    /*
     * ------------------------------------------------------
     * PARTICIPANTS
     * ------------------------------------------------------
     */

    if (
      body.team_a_id !== undefined
    ) {
      updates.team_a_id =
        body.team_a_id === null ||
        body.team_a_id === ""
          ? null
          : Number(body.team_a_id);
    }

    if (
      body.team_b_id !== undefined
    ) {
      updates.team_b_id =
        body.team_b_id === null ||
        body.team_b_id === ""
          ? null
          : Number(body.team_b_id);
    }

    if (
      body.player_a_id !== undefined
    ) {
      updates.player_a_id =
        body.player_a_id === null ||
        body.player_a_id === ""
          ? null
          : Number(body.player_a_id);
    }

    if (
      body.player_b_id !== undefined
    ) {
      updates.player_b_id =
        body.player_b_id === null ||
        body.player_b_id === ""
          ? null
          : Number(body.player_b_id);
    }

    /*
     * ------------------------------------------------------
     * MATCH DETAILS
     * ------------------------------------------------------
     */

    if (
      body.round !== undefined
    ) {
      updates.round =
        body.round === null ||
        body.round === ""
          ? null
          : String(body.round);
    }

    if (
      body.match_number !== undefined
    ) {
      const matchNumber =
        Number(
          body.match_number
        );

      if (
        !Number.isInteger(
          matchNumber
        ) ||
        matchNumber <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid match number.",
          },
          { status: 400 }
        );
      }

      updates.match_number =
        matchNumber;
    }

    if (
      body.score_team_a !== undefined
    ) {
      updates.score_team_a =
        body.score_team_a ===
          null ||
        body.score_team_a === ""
          ? null
          : Number(
              body.score_team_a
            );
    }

    if (
      body.score_team_b !== undefined
    ) {
      updates.score_team_b =
        body.score_team_b ===
          null ||
        body.score_team_b === ""
          ? null
          : Number(
              body.score_team_b
            );
    }

    if (
      body.winner_id !== undefined
    ) {
      updates.winner_id =
        body.winner_id === null ||
        body.winner_id === ""
          ? null
          : Number(
              body.winner_id
            );
    }

    if (
      body.status !== undefined
    ) {
      updates.status =
        body.status === null ||
        body.status === ""
          ? null
          : String(body.status);
    }

    if (
      body.scheduled_at !== undefined
    ) {
      updates.scheduled_at =
        body.scheduled_at === null ||
        body.scheduled_at === ""
          ? null
          : String(
              body.scheduled_at
            );
    }

    if (
      Object.keys(updates).length ===
      0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No match changes were supplied.",
        },
        { status: 400 }
      );
    }

    const supabase =
      await createClient();

    const {
      data: updatedMatch,
      error: updateError,
    } = await supabase
      .from("matches")
      .update(updates)
      .eq("id", matchId)
      .select("*")
      .single();

    if (updateError) {
      console.error(
        "Update match error:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,

      message:
        "Match updated successfully.",

      match:
        updatedMatch,
    });
  } catch (error) {
    console.error(
      "PATCH /api/matches error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update match.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
|
| Deletes ONE match.
|
|--------------------------------------------------------------------------
*/

export async function DELETE(
  request: NextRequest
) {
  try {
    const matchIdParam =
      request.nextUrl.searchParams.get(
        "id"
      );

    const matchId =
      Number(matchIdParam);

    if (
      !Number.isInteger(matchId) ||
      matchId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A valid match ID is required.",
        },
        { status: 400 }
      );
    }

    const supabase =
      await createClient();

    const {
      error: deleteError,
    } = await supabase
      .from("matches")
      .delete()
      .eq("id", matchId);

    if (deleteError) {
      console.error(
        "Delete match error:",
        deleteError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            deleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,

      message:
        "Match deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE /api/matches error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete match.",
      },
      { status: 500 }
    );
  }
}