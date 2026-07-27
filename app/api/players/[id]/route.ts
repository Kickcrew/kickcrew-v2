import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET one player
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("players")
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
    player: data,
  });
}

// UPDATE player
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const { error } = await supabase
    .from("players")
    .update({
      full_name: body.full_name,
      gamer_tag: body.gamer_tag,
      email: body.email,
      phone: body.phone,
      team_id: body.team_id,
      game: body.game,
      role: body.role,
      rank: body.rank,
      country: body.country,
      status: body.status,
      bio: body.bio,
      profile_photo: body.profile_photo,
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
  });
}

// DELETE player
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabase
    .from("players")
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
  });
}