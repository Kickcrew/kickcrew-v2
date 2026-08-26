import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ==================================================
// CREATE TOURNAMENT
// ==================================================

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      tournament_name,
      game_id,
      tournament_type,
      tournament_level,
      prize_pool,
      registration_fee,
      max_teams,

      registration_start,
      registration_end,

      start_date,
      end_date,

      location,
      banner_image,
      description,
      rules,
      status,
    } = body;

    // ----------------------------------------------
    // BASIC VALIDATION
    // ----------------------------------------------

    if (!tournament_name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Tournament name is required.",
        },
        { status: 400 }
      );
    }

    if (!game_id) {
      return NextResponse.json(
        {
          success: false,
          message: "A game must be selected.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------------
    // PREPARE DATES
    // ----------------------------------------------

    const registrationStartDate =
      registration_start
        ? new Date(registration_start)
        : null;

    const registrationEndDate =
      registration_end
        ? new Date(registration_end)
        : null;

    const tournamentStartDate =
      start_date
        ? new Date(start_date)
        : null;

    const tournamentEndDate =
      end_date
        ? new Date(end_date)
        : null;

    // ----------------------------------------------
    // DATE FORMAT VALIDATION
    // ----------------------------------------------

    if (
      registrationStartDate &&
      Number.isNaN(
        registrationStartDate.getTime()
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Registration opening date is invalid.",
        },
        { status: 400 }
      );
    }

    if (
      registrationEndDate &&
      Number.isNaN(
        registrationEndDate.getTime()
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Registration closing date is invalid.",
        },
        { status: 400 }
      );
    }

    if (
      tournamentStartDate &&
      Number.isNaN(
        tournamentStartDate.getTime()
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tournament start date is invalid.",
        },
        { status: 400 }
      );
    }

    if (
      tournamentEndDate &&
      Number.isNaN(
        tournamentEndDate.getTime()
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tournament end date is invalid.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------------
    // REGISTRATION PERIOD VALIDATION
    // ----------------------------------------------

    if (
      registrationStartDate &&
      registrationEndDate
    ) {
      if (
        registrationEndDate <=
        registrationStartDate
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Registration closing date must be after registration opening date.",
          },
          { status: 400 }
        );
      }
    }

    // ----------------------------------------------
    // TOURNAMENT PERIOD VALIDATION
    // ----------------------------------------------

    if (
      tournamentStartDate &&
      tournamentEndDate
    ) {
      if (
        tournamentEndDate <=
        tournamentStartDate
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Tournament end date must be after tournament start date.",
          },
          { status: 400 }
        );
      }
    }

    // ----------------------------------------------
    // REGISTRATION VS TOURNAMENT VALIDATION
    // ----------------------------------------------

    if (
      registrationEndDate &&
      tournamentStartDate
    ) {
      if (
        registrationEndDate >
        tournamentStartDate
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Registration closing date cannot be after the tournament start date.",
          },
          { status: 400 }
        );
      }
    }

    if (
      registrationStartDate &&
      tournamentStartDate
    ) {
      if (
        registrationStartDate >
        tournamentStartDate
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Registration opening date cannot be after the tournament start date.",
          },
          { status: 400 }
        );
      }
    }

    // ----------------------------------------------
    // CREATE TOURNAMENT
    // ----------------------------------------------

    const { data, error } = await supabase
      .from("tournaments")
      .insert([
        {
          tournament_name:
            tournament_name.trim(),

          game_id,

          tournament_type,

          tournament_level,

          prize_pool,

          registration_fee,

          max_teams,

          registration_start,

          registration_end,

          start_date,

          end_date,

          location,

          banner_image,

          description,

          rules,

          status,
        },
      ])
      .select(`
        *,
        games (
          id,
          game_name
        )
      `)
      .single();

    // ----------------------------------------------
    // DATABASE ERROR
    // ----------------------------------------------

    if (error) {
      console.error(
        "Tournament creation error:",
        error
      );

      return NextResponse.json(
        {
          success: false,

          message:
            error.message ||
            "Failed to create tournament.",

          error:
            error.message,

          details:
            error.details,

          hint:
            error.hint,

          code:
            error.code,
        },
        { status: 500 }
      );
    }

    // ----------------------------------------------
    // SUCCESS
    // ----------------------------------------------

    return NextResponse.json(
      {
        success: true,

        message:
          "Tournament created successfully.",

        tournament: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE tournament API error:",
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


// ==================================================
// GET ALL TOURNAMENTS
// ==================================================

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("tournaments")
      .select(`
        *,
        games (
          id,
          game_name
        )
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Tournament loading error:",
        error
      );

      return NextResponse.json(
        {
          success: false,

          message:
            error.message,

          error:
            error.message,

          details:
            error.details,

          hint:
            error.hint,

          code:
            error.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,

      tournaments:
        data ?? [],
    });
  } catch (error) {
    console.error(
      "GET tournaments API error:",
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