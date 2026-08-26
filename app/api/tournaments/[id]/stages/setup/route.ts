import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

interface StageDefinition {
  stage_name: string;
  stage_type: string;
  stage_order: number;
  status: "Pending" | "Active";
  teams_advancing: number | null;
}

function getStageDefinitions(
  tournamentType: string
): StageDefinition[] {
  const normalizedType = tournamentType
    .trim()
    .toLowerCase();

  switch (normalizedType) {
    case "single elimination":
      return [
        {
          stage_name: "Single Elimination",
          stage_type: "single_elimination",
          stage_order: 1,
          status: "Active",
          teams_advancing: null,
        },
      ];

    case "double elimination":
      return [
        {
          stage_name: "Double Elimination",
          stage_type: "double_elimination",
          stage_order: 1,
          status: "Active",
          teams_advancing: null,
        },
      ];

    case "round robin":
      return [
        {
          stage_name: "Round Robin",
          stage_type: "round_robin",
          stage_order: 1,
          status: "Active",
          teams_advancing: null,
        },
      ];

    case "round robin + single elimination":
      return [
        {
          stage_name: "Round Robin",
          stage_type: "round_robin",
          stage_order: 1,
          status: "Active",
          teams_advancing: null,
        },
        {
          stage_name: "Single Elimination",
          stage_type: "single_elimination",
          stage_order: 2,
          status: "Pending",
          teams_advancing: null,
        },
      ];

    case "round robin + double elimination":
      return [
        {
          stage_name: "Round Robin",
          stage_type: "round_robin",
          stage_order: 1,
          status: "Active",
          teams_advancing: null,
        },
        {
          stage_name: "Double Elimination",
          stage_type: "double_elimination",
          stage_order: 2,
          status: "Pending",
          teams_advancing: null,
        },
      ];

    case "swiss system":
      return [
        {
          stage_name: "Swiss System",
          stage_type: "swiss_system",
          stage_order: 1,
          status: "Active",
          teams_advancing: null,
        },
      ];

    case "league":
      return [
        {
          stage_name: "League",
          stage_type: "league",
          stage_order: 1,
          status: "Active",
          teams_advancing: null,
        },
      ];

    case "group stage + knockout":
      return [
        {
          stage_name: "Group Stage",
          stage_type: "group_stage",
          stage_order: 1,
          status: "Active",
          teams_advancing: null,
        },
        {
          stage_name: "Knockout",
          stage_type: "knockout",
          stage_order: 2,
          status: "Pending",
          teams_advancing: null,
        },
      ];

    case "showmatch":
      return [
        {
          stage_name: "Showmatch",
          stage_type: "showmatch",
          stage_order: 1,
          status: "Active",
          teams_advancing: null,
        },
      ];

    case "community tournament":
      return [
        {
          stage_name: "Community Tournament",
          stage_type: "community_tournament",
          stage_order: 1,
          status: "Active",
          teams_advancing: null,
        },
      ];

    case "invitational":
      return [
        {
          stage_name: "Invitational",
          stage_type: "invitational",
          stage_order: 1,
          status: "Active",
          teams_advancing: null,
        },
      ];

    case "qualifier":
      return [
        {
          stage_name: "Qualifier",
          stage_type: "qualifier",
          stage_order: 1,
          status: "Active",
          teams_advancing: null,
        },
      ];

    case "championship":
      return [
        {
          stage_name: "Championship",
          stage_type: "championship",
          stage_order: 1,
          status: "Active",
          teams_advancing: null,
        },
      ];

    default:
      return [
        {
          stage_name: tournamentType.trim(),
          stage_type: normalizedType
            .replace(/\s+/g, "_"),
          stage_order: 1,
          status: "Active",
          teams_advancing: null,
        },
      ];
  }
}

export async function POST(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;

    // Confirm tournament exists
    const {
      data: tournament,
      error: tournamentError,
    } = await supabase
      .from("tournaments")
      .select(
        "id, tournament_name, tournament_type"
      )
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

    if (!tournament.tournament_type) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tournament type has not been configured.",
        },
        { status: 400 }
      );
    }

    const stageDefinitions =
      getStageDefinitions(
        tournament.tournament_type
      );

    // Check whether stages already exist
    const {
      data: existingStages,
      error: existingStagesError,
    } = await supabase
      .from("tournament_stages")
      .select("*")
      .eq("tournament_id", id)
      .order("stage_order", {
        ascending: true,
      });

    if (existingStagesError) {
      console.error(
        "Failed to load existing stages:",
        existingStagesError
      );

      return NextResponse.json(
        {
          success: false,
          message: existingStagesError.message,
        },
        { status: 500 }
      );
    }

    // If stages already exist, do not duplicate them
    if (
      existingStages &&
      existingStages.length > 0
    ) {
      return NextResponse.json({
        success: true,
        message:
          "Tournament stages already exist.",
        stages: existingStages,
        created: false,
      });
    }

    // Create stages
    const rows = stageDefinitions.map(
      (stage) => ({
        tournament_id: Number(id),
        stage_name: stage.stage_name,
        stage_type: stage.stage_type,
        stage_order: stage.stage_order,
        status: stage.status,
        teams_advancing:
          stage.teams_advancing,
      })
    );

    const {
      data: createdStages,
      error: createError,
    } = await supabase
      .from("tournament_stages")
      .insert(rows)
      .select()
      .order("stage_order", {
        ascending: true,
      });

    if (createError) {
      console.error(
        "Failed to create tournament stages:",
        createError
      );

      return NextResponse.json(
        {
          success: false,
          message: createError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Tournament stages created successfully.",
      created: true,
      tournament: {
        id: tournament.id,
        tournament_name:
          tournament.tournament_name,
        tournament_type:
          tournament.tournament_type,
      },
      stages: createdStages ?? [],
    });
  } catch (error) {
    console.error(
      "Tournament stage setup error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error.",
      },
      { status: 500 }
    );
  }
}