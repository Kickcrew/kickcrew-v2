import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET ALL GAMES
export async function GET() {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .order("game_name", { ascending: true });

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
    games: data,
  });
}

// CREATE GAME
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { error } = await supabase
      .from("games")
      .insert([
        {
          game_name: body.game_name,
          category: body.category,
          active: body.active,
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
      message: "Game created successfully.",
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