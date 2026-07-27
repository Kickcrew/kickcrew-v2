import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { id, status } = await request.json();

    const { error } = await supabase
      .from("applicants")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          success: false,
          message: "Failed to update applicant.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Applicant updated successfully.",
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Server error.",
      },
      { status: 500 }
    );
  }
}