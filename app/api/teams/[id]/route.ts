import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET a single team
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    team: data,
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
      division: body.division,
      captain: body.captain,
      coach: body.coach,
      description: body.description,
    })
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