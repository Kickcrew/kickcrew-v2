import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function isKnockoutRound(
  round: string | null
): boolean {
  const value = normalize(round);

  if (!value) {
    return false;
  }

  return (
    value.includes("quarterfinal") ||
    value.includes("quarter-final") ||
    value.includes("semifinal") ||
    value.includes("semi-final") ||
    value === "final" ||
    value.includes("grand final") ||
    value.includes("3rd place") ||
    value.includes("third place") ||
    value.includes("third-place") ||
    value.includes("knockout") ||
    value.includes("elimination") ||
    value.includes("upper bracket") ||
    value.includes("lower bracket") ||
    value.includes("losers bracket") ||
    value.includes("winners bracket")
  );
}
export async function POST(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;

    /*
     * =====================================================
     * 1. LOAD TOURNAMENT
     * =====================================================
     */

    const {
      data: tournament,
      error: tournamentError,
    } = await supabase
      .from("tournaments")
      .select(
        "id, tournament_name, tournament_type, status"
      )
      .eq("id", id)
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
     * Already completed
     */

    if (
      normalize(tournament.status) ===
      "completed"
    ) {
      return NextResponse.json({
        success: true,
        message:
          "Tournament is already completed.",
        tournament,
      });
    }

    /*
     * =====================================================
     * 2. DETERMINE FORMAT
     * =====================================================
     */

    const tournamentFormat =
      normalize(
        tournament.tournament_type
      );

    const requiresKnockout =
      tournamentFormat.includes(
        "knockout"
      ) ||
      tournamentFormat.includes(
        "elimination"
      ) ||
      tournamentFormat.includes(
        "single elimination"
      ) ||
      tournamentFormat.includes(
        "double elimination"
      );

    /*
     * =====================================================
     * 3. LOAD ALL MATCHES
     * =====================================================
     */

    const {
      data: matches,
      error: matchesError,
    } = await supabase
      .from("matches")
      .select(
        "id, status, round"
      )
      .eq("tournament_id", id);

    if (matchesError) {
      console.error(
        "Failed to load tournament matches:",
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
     * =====================================================
     * 4. NO MATCHES
     * =====================================================
     */

    if (
      !matches ||
      matches.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This tournament cannot be completed because no matches have been generated.",
        },
        { status: 400 }
      );
    }

    /*
     * =====================================================
     * 5. ALL GENERATED MATCHES
     * =====================================================
     */

    const unfinishedMatches =
      matches.filter(
        (match) =>
          normalize(match.status) !==
          "completed"
      );

    if (
      unfinishedMatches.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `The tournament cannot be completed yet. ${
            unfinishedMatches.length
          } match${
            unfinishedMatches.length ===
            1
              ? ""
              : "es"
          } still need${
            unfinishedMatches.length ===
            1
              ? "s"
              : ""
          } to be completed.`,
          unfinished_matches:
            unfinishedMatches.map(
              (match) => match.id
            ),
        },
        { status: 400 }
      );
    }

    /*
     * =====================================================
     * 6. KNOCKOUT REQUIREMENT
     * =====================================================
     *
     * This is the critical protection.
     *
     * For:
     *
     * Round Robin
     *
     * there is no requirement for Knockout.
     *
     * But for:
     *
     * Round Robin + Knockout
     * Knockout
     * Single Elimination
     * Double Elimination
     *
     * the Knockout stage MUST exist.
     */

    if (requiresKnockout) {
      const knockoutMatches =
        matches.filter(
          (match) =>
            isKnockoutRound(
              match.round
            )
        );

      /*
       * Knockout hasn't been generated.
       */

      if (
        knockoutMatches.length === 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This tournament requires a Knockout stage. The Knockout fixtures have not been generated yet.",
          },
          { status: 400 }
        );
      }

      /*
       * =================================================
       * 7. KNOCKOUT MATCHES MUST BE COMPLETE
       * =================================================
       */

      const unfinishedKnockoutMatches =
        knockoutMatches.filter(
          (match) =>
            normalize(
              match.status
            ) !== "completed"
        );

      if (
        unfinishedKnockoutMatches.length >
        0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `The Knockout stage is not complete. ${
              unfinishedKnockoutMatches.length
            } Knockout match${
              unfinishedKnockoutMatches.length ===
              1
                ? ""
                : "es"
            } still need${
              unfinishedKnockoutMatches.length ===
              1
                ? "s"
                : ""
            } to be completed.`,
            unfinished_knockout_matches:
              unfinishedKnockoutMatches.map(
                (match) =>
                  match.id
              ),
          },
          { status: 400 }
        );
      }
    }

    /*
     * =====================================================
     * 8. COMPLETE TOURNAMENT
     * =====================================================
     */

    const {
      data: updatedTournament,
      error: updateError,
    } = await supabase
      .from("tournaments")
      .update({
        status: "Completed",
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error(
        "Failed to complete tournament:",
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

    /*
     * =====================================================
     * 9. SUCCESS
     * =====================================================
     */

    return NextResponse.json({
      success: true,
      message:
        "Tournament completed successfully.",
      tournament:
        updatedTournament,
    });
  } catch (error) {
    console.error(
      "Tournament completion error:",
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