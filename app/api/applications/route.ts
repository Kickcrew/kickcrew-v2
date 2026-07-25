import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  console.log("New Application:", body);

  return NextResponse.json({
    success: true,
    message: "Application received successfully.",
  });
}