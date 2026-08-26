
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);

  return Number.isInteger(numberValue) ? numberValue : null;
}

function normalizeStatus(value: unknown): string {
  const status = String(value ?? "").trim();

  return status || "Scheduled";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const tournamentId = toNullableNumber(
      searchParams.get("tournament_id")
    );

    if (tournamentId === null || tournamentId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid tournament ID is required.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("match_number", {
        ascending: true,
        nullsFirst: false,
      })
      .order("id", {
        ascending: true,
      });

    if (error) {
      console.error("GET /api/matches error:", error);

      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      matches: data ?? [],
    });
  } catch (error) {
    console.error("GET /api/matches unexpected error:", error);

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const tournamentId = toNullableNumber(body.tournament_id);

    if (tournamentId === null || tournamentId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid tournament ID is required.",
        },
        { status: 400 }
      );
    }

    const teamAId = toNullableNumber(body.team_a_id);
    const teamBId = toNullableNumber(body.team_b_id);

    const playerAId = toNullableNumber(body.player_a_id);
    const playerBId = toNullableNumber(body.player_b_id);

    /*
     * A match must contain either:
     *
     * TEAM vs TEAM
     *
     * or
     *
     * PLAYER vs PLAYER
     *
     * Mixed participant types are not allowed.
     */

    const hasCompleteTeamPair =
      teamAId !== null && teamBId !== null;

    const hasCompletePlayerPair =
      playerAId !== null && playerBId !== null;

    const hasAnyTeamParticipant =
      teamAId !== null || teamBId !== null;

    const hasAnyPlayerParticipant =
      playerAId !== null || playerBId !== null;

    if (
      !hasCompleteTeamPair &&
      !hasCompletePlayerPair
    ) {
      let message =
        "Match participants are required. Provide either team_a_id/team_b_id or player_a_id/player_b_id.";

      if (hasAnyTeamParticipant) {
        message =
          "Both team_a_id and team_b_id are required for a team match.";
      }

      if (hasAnyPlayerParticipant) {
        message =
          "Both player_a_id and player_b_id are required for a player match.";
      }

      return NextResponse.json(
        {
          success: false,
          message,
        },
        { status: 400 }
      );
    }

    if (
      hasCompleteTeamPair &&
      hasCompletePlayerPair
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A match cannot contain both team participants and player participants.",
        },
        { status: 400 }
      );
    }

    if (
      teamAId !== null &&
      teamBId !== null &&
      teamAId === teamBId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A participant cannot play against itself.",
        },
        { status: 400 }
      );
    }

    if (
      playerAId !== null &&
      playerBId !== null &&
      playerAId === playerBId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A participant cannot play against itself.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    /*
     * Verify the tournament exists.
     */

    const { data: tournament, error: tournamentError } =
      await supabase
        .from("tournaments")
        .select("id")
        .eq("id", tournamentId)
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

    /*
     * Build the match.
     */

    const matchData: Record<string, unknown> = {
      tournament_id: tournamentId,

      game_id: toNullableNumber(body.game_id),

      round:
        body.round !== undefined &&
        body.round !== null
          ? String(body.round)
          : null,

      match_number: toNullableNumber(
        body.match_number
      ),

      best_of:
        body.best_of !== undefined &&
        body.best_of !== null
          ? String(body.best_of)
          : "BO1",

      scheduled_date:
        body.scheduled_date ?? null,

      scheduled_time:
        body.scheduled_time ?? null,

      winner_id: toNullableNumber(
        body.winner_id
      ),

      winner_team_id: toNullableNumber(
        body.winner_team_id
      ),

      winner_player_id: toNullableNumber(
        body.winner_player_id
      ),

      score_team_a: toNullableNumber(
        body.score_team_a
      ),

      score_team_b: toNullableNumber(
        body.score_team_b
      ),

      status: normalizeStatus(body.status),

      stream_link:
        body.stream_link !== undefined
          ? body.stream_link
          : null,

      notes:
        body.notes !== undefined
          ? body.notes
          : null,

      team_a_id: hasCompleteTeamPair
        ? teamAId
        : null,

      team_b_id: hasCompleteTeamPair
        ? teamBId
        : null,

      player_a_id: hasCompletePlayerPair
        ? playerAId
        : null,

      player_b_id: hasCompletePlayerPair
        ? playerBId
        : null,
    };

    /*
     * Insert match.
     */

    const { data: match, error: insertError } =
      await supabase
        .from("matches")
        .insert(matchData)
        .select("*")
        .single();

    if (insertError) {
      console.error(
        "POST /api/matches insert error:",
        insertError
      );

      return NextResponse.json(
        {
          success: false,
          message: insertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Match created successfully.",
        match,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/matches unexpected error:",
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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const matchId = toNullableNumber(body.id);

    if (matchId === null || matchId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid match ID is required.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const updates: Record<string, unknown> = {};

    const numericFields = [
      "game_id",
      "match_number",
      "winner_id",
      "winner_team_id",
      "winner_player_id",
      "score_team_a",
      "score_team_b",
      "team_a_id",
      "team_b_id",
      "player_a_id",
      "player_b_id",
    ];

    for (const field of numericFields) {
      if (field in body) {
        updates[field] = toNullableNumber(body[field]);
      }
    }

    const nullableFields = [
      "round",
      "best_of",
      "scheduled_date",
      "scheduled_time",
      "stream_link",
      "notes",
    ];

    for (const field of nullableFields) {
      if (field in body) {
        updates[field] =
          body[field] === ""
            ? null
            : body[field];
      }
    }

    if ("status" in body) {
      updates.status = normalizeStatus(
        body.status
      );
    }

    /*
     * Validate participants if participant
     * fields are being changed.
     */

    if (
      "team_a_id" in body ||
      "team_b_id" in body ||
      "player_a_id" in body ||
      "player_b_id" in body
    ) {
      const teamAId =
        "team_a_id" in updates
          ? (updates.team_a_id as number | null)
          : null;

      const teamBId =
        "team_b_id" in updates
          ? (updates.team_b_id as number | null)
          : null;

      const playerAId =
        "player_a_id" in updates
          ? (updates.player_a_id as number | null)
          : null;

      const playerBId =
        "player_b_id" in updates
          ? (updates.player_b_id as number | null)
          : null;

      const teamPair =
        teamAId !== null &&
        teamBId !== null;

      const playerPair =
        playerAId !== null &&
        playerBId !== null;

      if (!teamPair && !playerPair) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Both participants are required.",
          },
          { status: 400 }
        );
      }

      if (teamPair && playerPair) {
        return NextResponse.json(
          {
            success: false,
            message:
              "A match cannot contain both teams and players.",
          },
          { status: 400 }
        );
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No match changes were provided.",
        },
        { status: 400 }
      );
    }

    const { data: match, error } = await supabase
      .from("matches")
      .update(updates)
      .eq("id", matchId)
      .select("*")
      .single();

    if (error) {
      console.error(
        "PATCH /api/matches error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Match updated successfully.",
      match,
    });
  } catch (error) {
    console.error(
      "PATCH /api/matches unexpected error:",
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const matchId = toNullableNumber(
      searchParams.get("id")
    );

    if (matchId === null || matchId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid match ID is required.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("matches")
      .delete()
      .eq("id", matchId);

    if (error) {
      console.error(
        "DELETE /api/matches error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Match deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE /api/matches unexpected error:",
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
