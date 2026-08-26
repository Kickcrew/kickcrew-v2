import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

interface StageInput {
  stage_name: string;
  stage_type: string;
  stage_order: number;
  status?: string;
  teams_advancing?: number | null;
}

// GET — Load tournament stages
export async function GET(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("tournament_stages")
      .select("*")
      .eq("tournament_id", id)
      .order("stage_order", { ascending: true });

    if (error) {
      console.error("Failed to load tournament stages:", error);

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
      stages: data ?? [],
    });
  } catch (error) {
    console.error("Stages GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error.",
      },
      { status: 500 }
    );
  }
}

// POST — Create a tournament stage
export async function POST(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;

    const body: StageInput = await request.json();

    if (!body.stage_name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Stage name is required.",
        },
        { status: 400 }
      );
    }

    if (!body.stage_type?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Stage type is required.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(body.stage_order) ||
      body.stage_order < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Stage order must be a positive integer.",
        },
        { status: 400 }
      );
    }

    // Confirm tournament exists
    const { data: tournament, error: tournamentError } =
      await supabase
        .from("tournaments")
        .select("id")
        .eq("id", id)
        .single();

    if (tournamentError || !tournament) {
      return NextResponse.json(
        {
          success: false,
          message: "Tournament not found.",
        },
        { status: 404 }
      );
    }

    // Prevent duplicate stage order
    const { data: existingStage, error: existingError } =
      await supabase
        .from("tournament_stages")
        .select("id")
        .eq("tournament_id", id)
        .eq("stage_order", body.stage_order)
        .maybeSingle();

    if (existingError) {
      console.error(
        "Failed to check existing stage:",
        existingError
      );

      return NextResponse.json(
        {
          success: false,
          message: existingError.message,
        },
        { status: 500 }
      );
    }

    if (existingStage) {
      return NextResponse.json(
        {
          success: false,
          message: `Stage order ${body.stage_order} already exists for this tournament.`,
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("tournament_stages")
      .insert({
        tournament_id: Number(id),
        stage_name: body.stage_name.trim(),
        stage_type: body.stage_type.trim(),
        stage_order: body.stage_order,
        status: body.status ?? "Pending",
        teams_advancing:
          body.teams_advancing ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create tournament stage:", error);

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
        message: "Tournament stage created successfully.",
        stage: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Stages POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error.",
      },
      { status: 500 }
    );
  }
}