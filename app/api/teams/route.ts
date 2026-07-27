import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET all teams
export async function GET() {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
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

    const { error } = await supabase
      .from("teams")
      .insert([
        {
          team_name: body.team_name,
          division: body.division,
          captain: body.captain,
          coach: body.coach,
          description: body.description,
        },
      ]);

    if (error) {
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

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error.",
      },
      { status: 500 }
    );
  }
}