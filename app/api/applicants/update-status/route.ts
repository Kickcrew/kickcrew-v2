import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { id, status } = await request.json();

    console.log("Updating applicant:", { id, status });

    const { data, error } = await supabase
      .from("applicants")
      .update({ status })
      .eq("id", id)
      .select();

    console.log("Supabase response:", data);

    if (error) {
      console.error("Supabase error:", error);

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
      data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Server error",
      },
      { status: 500 }
    );
  }
}