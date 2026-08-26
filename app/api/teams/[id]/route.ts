import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET a single team with its players
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Get the team
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", id)
    .single();

  if (teamError) {
    return NextResponse.json(
      {
        success: false,
        message: teamError.message,
      },
      { status: 404 }
    );
  }

  // Get players belonging to this team
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select(`
      id,
      full_name,
      gamer_tag,
      game,
      role,
      rank,
      status,
      profile_photo
    `)
    .eq("team_id", id)
    .order("gamer_tag", { ascending: true });

  if (playersError) {
    return NextResponse.json(
      {
        success: false,
        message: playersError.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    team,
    players: players || [],
  });
}

// UPDATE a team
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const { error } = await supabase
    .from("teams")
    .update({
      team_name: body.team_name,
      game_id: body.game_id,
      division_id: body.division_id,
      captain: body.captain,
      coach: body.coach,
      description: body.description,
    })
    .eq("id", id);

  if (error) {
    console.error("Update team error:", error);

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
    message: "Team updated successfully.",
  });
}
// DELETE a team
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabase
    .from("teams")
    .delete()
    .eq("id", id);

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
    message: "Team deleted successfully.",
  });
}