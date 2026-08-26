import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET all teams
export async function GET() {
  const { data, error } = await supabase
    .from("teams")
    .select(`
      *,
      games (
        id,
        game_name,
        category,
        is_team_game
      ),
      divisions (
        id,
        division_name,
        description
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
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
    teams: data,
  });
}

// CREATE a new team
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Get the selected division name
    const { data: divisionData, error: divisionError } = await supabase
      .from("divisions")
      .select("division_name")
      .eq("id", body.division_id)
      .single();

    if (divisionError || !divisionData) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected division could not be found.",
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("teams")
      .insert([
        {
          team_name: body.team_name,

          // New relationship fields
          game_id: Number(body.game_id),
          division_id: Number(body.division_id),

          // Temporary compatibility with old database column
          division: divisionData.division_name,

          captain: body.captain || null,
          coach: body.coach || null,
          description: body.description || null,
        },
      ]);

    if (error) {
      console.error("Supabase error:", error);

      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Team created successfully.",
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Server error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error.",
      },
      { status: 500 }
    );
  }
}