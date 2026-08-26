import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

/*
 * --------------------------------------------------
 * SUPPORTED TOURNAMENT TYPES
 * --------------------------------------------------
 *
 * These are the canonical tournament formats used
 * throughout KICKCREW.
 * --------------------------------------------------
 */

const SUPPORTED_TOURNAMENT_TYPES = [
  "Round Robin",
  "Single Elimination",
  "Double Elimination",
  "Round Robin + Single Elimination",
  "Round Robin + Double Elimination",
  "Group Stage + Knockout",
  "Swiss System",
];

/*
 * --------------------------------------------------
 * SUPPORTED FIXTURE FORMATS
 * --------------------------------------------------
 */

const SUPPORTED_FIXTURE_FORMATS = [
  "single_leg",
  "double_leg",
];

/*
 * --------------------------------------------------
 * NORMALIZE TOURNAMENT TYPE
 * --------------------------------------------------
 *
 * Allows small naming differences without changing
 * the canonical value stored in the database.
 * --------------------------------------------------
 */

function normalizeTournamentType(
  value: unknown
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  const aliases: Record<string, string> = {
    "round robin": "Round Robin",

    "single elimination":
      "Single Elimination",

    "double elimination":
      "Double Elimination",

    "round robin + single elimination":
      "Round Robin + Single Elimination",

    "round robin - single elimination":
      "Round Robin + Single Elimination",

    "round robin + double elimination":
      "Round Robin + Double Elimination",

    "round robin - double elimination":
      "Round Robin + Double Elimination",

    "group stage + knockout":
      "Group Stage + Knockout",

    "group stage + knockout stage":
      "Group Stage + Knockout",

    "swiss system":
      "Swiss System",

    /*
     * Historical / legacy value.
     *
     * We deliberately do NOT convert League to
     * Round Robin automatically here.
     *
     * Existing League tournaments should be migrated
     * deliberately rather than silently changing data.
     */
    league: "League",
  };

  return aliases[normalized] ?? value.trim();
}

/*
 * --------------------------------------------------
 * DETERMINE WHETHER FORMAT SUPPORTS FIXTURE FORMAT
 * --------------------------------------------------
 *
 * Single/Double Leg is meaningful for match-based
 * stages such as Round Robin and league-like stages.
 *
 * Knockout stages are handled by the advancement
 * system and should not rely on fixture_format for
 * bracket construction.
 * --------------------------------------------------
 */

function supportsFixtureFormat(
  tournamentType: string
): boolean {
  return (
    tournamentType === "Round Robin" ||
    tournamentType ===
      "Round Robin + Single Elimination" ||
    tournamentType ===
      "Round Robin + Double Elimination" ||
    tournamentType === "Group Stage + Knockout" ||
    tournamentType === "Swiss System"
  );
}

/*
 * --------------------------------------------------
 * GET SINGLE TOURNAMENT
 * --------------------------------------------------
 */

export async function GET(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(
        "GET tournament error:",
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

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          message: "Tournament not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tournament: data,
    });
  } catch (error) {
    console.error(
      "GET tournament error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load tournament.",
      },
      { status: 500 }
    );
  }
}

/*
 * --------------------------------------------------
 * UPDATE TOURNAMENT
 * --------------------------------------------------
 */

async function updateTournament(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;

    const body = await request.json();

    console.log(
      "TOURNAMENT UPDATE REQUEST:",
      {
        id,
        body,
      }
    );

    /*
     * ------------------------------------------------
     * TOURNAMENT TYPE
     * ------------------------------------------------
     */

    const tournamentType =
      normalizeTournamentType(
        body.tournament_type
      );

    if (!tournamentType) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tournament type is required.",
        },
        { status: 400 }
      );
    }

    /*
     * ------------------------------------------------
     * VALIDATE TOURNAMENT TYPE
     * ------------------------------------------------
     *
     * League is intentionally not included in the
     * new canonical list.
     *
     * Existing League records can still be read,
     * but new edits should use Round Robin.
     * ------------------------------------------------
     */

    if (
      !SUPPORTED_TOURNAMENT_TYPES.includes(
        tournamentType
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Unsupported tournament type "${tournamentType}". Please use one of the supported KICKCREW tournament formats.`,
          supportedTypes:
            SUPPORTED_TOURNAMENT_TYPES,
        },
        { status: 400 }
      );
    }

    /*
     * ------------------------------------------------
     * FIXTURE FORMAT
     * ------------------------------------------------
     */

    let fixtureFormat:
      | "single_leg"
      | "double_leg"
      | null = null;

    if (
      body.fixture_format !== undefined &&
      body.fixture_format !== null &&
      body.fixture_format !== ""
    ) {
      if (
        !SUPPORTED_FIXTURE_FORMATS.includes(
          body.fixture_format
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid fixture format.",
            allowedFormats:
              SUPPORTED_FIXTURE_FORMATS,
          },
          { status: 400 }
        );
      }

      fixtureFormat =
        body.fixture_format;
    }

    /*
     * ------------------------------------------------
     * BUILD UPDATE OBJECT
     * ------------------------------------------------
     */

    const updates: Record<
      string,
      unknown
    > = {
      tournament_name:
        body.tournament_name,

      game_id:
        body.game_id,

      tournament_type:
        tournamentType,

      tournament_level:
        body.tournament_level,

      prize_pool:
        body.prize_pool,

      registration_fee:
        body.registration_fee,

      max_teams:
        body.max_teams,

      /*
       * Registration period
       */

      registration_start:
        body.registration_start,

      registration_end:
        body.registration_end,

      /*
       * Tournament schedule
       */

      start_date:
        body.start_date,

      end_date:
        body.end_date,

      location:
        body.location,

      banner_image:
        body.banner_image,

      description:
        body.description,

      rules:
        body.rules,

      status:
        body.status,
    };

    /*
     * Only update fixture_format when it was
     * explicitly supplied.
     *
     * This prevents the edit page from accidentally
     * clearing an existing locked format.
     */

    if (
      body.fixture_format !==
      undefined
    ) {
      updates.fixture_format =
        fixtureFormat;
    }

    console.log(
      "TOURNAMENT UPDATE DATA:",
      updates
    );

    /*
     * ------------------------------------------------
     * UPDATE DATABASE
     * ------------------------------------------------
     */

    const {
      data,
      error,
    } = await supabase
      .from("tournaments")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error(
        "UPDATE TOURNAMENT SUPABASE ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,

          message:
            error.message ||
            "Failed to update tournament.",

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

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tournament was not found after the update.",
        },
        { status: 404 }
      );
    }

    console.log(
      "TOURNAMENT UPDATED SUCCESSFULLY:",
      data
    );

    return NextResponse.json({
      success: true,

      message:
        "Tournament updated successfully.",

      tournament: data,
    });
  } catch (error) {
    console.error(
      "Update tournament error:",
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
 * --------------------------------------------------
 * PATCH UPDATE TOURNAMENT
 * --------------------------------------------------
 */

export async function PATCH(
  request: Request,
  { params }: Params
) {
  return updateTournament(
    request,
    { params }
  );
}

/*
 * --------------------------------------------------
 * PUT UPDATE TOURNAMENT
 * --------------------------------------------------
 */

export async function PUT(
  request: Request,
  { params }: Params
) {
  return updateTournament(
    request,
    { params }
  );
}

/*
 * --------------------------------------------------
 * DELETE TOURNAMENT
 * --------------------------------------------------
 */

export async function DELETE(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from("tournaments")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(
        "DELETE TOURNAMENT SUPABASE ERROR:",
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
      message:
        "Tournament deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete tournament error:",
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