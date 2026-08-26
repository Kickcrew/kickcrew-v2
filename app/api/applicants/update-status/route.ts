import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { id, status } = await request.json();

    console.log("Updating applicant:", { id, status });

    // 1. Get the applicant
    const { data: applicant, error: applicantError } = await supabase
      .from("applicants")
      .select("*")
      .eq("id", id)
      .single();

    if (applicantError || !applicant) {
      console.error("Applicant error:", applicantError);

      return NextResponse.json(
        {
          success: false,
          message: "Applicant not found.",
        },
        { status: 404 }
      );
    }

    // 2. Update applicant status
    const { error: updateError } = await supabase
      .from("applicants")
      .update({ status })
      .eq("id", id);

    if (updateError) {
      console.error("Status update error:", updateError);

      return NextResponse.json(
        {
          success: false,
          message: updateError.message,
        },
        { status: 500 }
      );
    }

    // 3. Only create a player when applicant is approved
    if (status === "Approved") {

      // Check if this applicant already has a player
      const { data: existingPlayer, error: existingPlayerError } =
        await supabase
          .from("players")
          .select("id")
          .eq("applicant_id", id)
          .maybeSingle();

      if (existingPlayerError) {
        console.error(
          "Existing player check error:",
          existingPlayerError
        );

        return NextResponse.json(
          {
            success: false,
            message: existingPlayerError.message,
          },
          { status: 500 }
        );
      }

      // 4. Create player only if one doesn't already exist
      if (!existingPlayer) {

        const { data: player, error: playerError } = await supabase
          .from("players")
          .insert({
            applicant_id: applicant.id,

            profile_photo: "",

            full_name: applicant.full_name,
            gamer_tag: applicant.ign,

            email: applicant.email,
            phone: applicant.phone,

            team_id: null,

            game: applicant.game,

            role: "",

            rank: applicant.rank || "",

            country: applicant.country,

            status: "Active",

            bio: applicant.about || "",
          })
          .select()
          .single();

        if (playerError) {
          console.error("Player creation error:", playerError);

          return NextResponse.json(
            {
              success: false,
              message: playerError.message,
            },
            { status: 500 }
          );
        }

        console.log("Player created:", player);
      }
    }

    return NextResponse.json({
      success: true,
      message:
        status === "Approved"
          ? "Applicant approved and player created successfully."
          : "Applicant status updated successfully.",
    });

  } catch (error) {
    console.error("Server error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Server error",
      },
      { status: 500 }
    );
  }
}