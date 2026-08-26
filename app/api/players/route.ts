import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// CREATE PLAYER
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { error } = await supabase
      .from("players")
     .insert([
  {
    applicant_id: body.applicant_id || null,

    full_name: body.full_name,
    gamer_tag: body.gamer_tag,
    email: body.email,
    phone: body.phone,

    team_id: body.team_id || null,

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

    return NextResponse.json(
      {
        success: true,
        message: "Player created successfully.",
      },
      { status: 200 }
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

export async function GET() {
  const { data, error } = await supabase
    .from("players")
    .select(`
      *,
      applicants (
        id,
        status
      )
    `)
    .order("id", { ascending: false });

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