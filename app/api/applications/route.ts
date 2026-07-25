import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { error } = await supabase
      .from("applicants")
      .insert([
        {
          full_name: body.fullName,
          email: body.email,
          phone: body.phone,
          country: body.country,
          division: body.division,
          ign: body.ign,
          rank: body.rank,
          platform: body.platform,
          about: body.about,
          motivation: body.motivation,
        },
      ]);

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          success: false,
          message: "Failed to save application.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully.",
    });

  } catch (err) {

    console.error(err);

    return NextResponse.json(
      {
        success: false,
        message: "Server error.",
      },
      { status: 500 }
    );
  }
}