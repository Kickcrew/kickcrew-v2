import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET all divisions
export async function GET() {
  const { data, error } = await supabase
    .from("divisions")
    .select("*")
    .order("created_at", { ascending: true });

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
    divisions: data,
  });
}