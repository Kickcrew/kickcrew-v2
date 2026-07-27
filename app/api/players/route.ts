import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET all players
export async function GET() {
  const { data, error } = await supabase
    .from("players")
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
    players: data,
  });
}

// CREATE player
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { error } = await supabase.from("players").insert([
      {
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

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error.",
      },
      { status: 500 }
    );
  }
}