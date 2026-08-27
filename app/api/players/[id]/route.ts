import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";


// GET SINGLE PLAYER
export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {

  const { id } = await params;


  const { data, error } = await supabase
    .from("players")
    .select(
      `
      *,
      teams (
        id,
        team_name
      ),
      applicants (
        id,
        status
      )
      `
    )
    .eq("id", id)
    .single();



  if (error) {

    return NextResponse.json(
      {
        success:false,
        message:error.message,
      },
      {
        status:404,
      }
    );

  }



  return NextResponse.json({
    success:true,
    player:data,
  });

}




// UPDATE PLAYER
export async function PUT(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {

  const { id } = await params;

  const body = await request.json();



  const updateData = {

    full_name: body.full_name,

    gamer_tag: body.gamer_tag,

    email: body.email,

    phone: body.phone,


    team_id: body.team_id
      ? Number(body.team_id)
      : null,


    game: body.game || null,

    role: body.role || null,

    rank: body.rank || null,

    country: body.country || null,

    status: body.status || "Active",

    bio: body.bio || null,

    profile_photo:
      body.profile_photo || null,

  };



  const { data, error } = await supabase
    .from("players")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();



  if(error){

    return NextResponse.json(
      {
        success:false,
        message:error.message,
      },
      {
        status:500,
      }
    );

  }



  return NextResponse.json(
    {
      success:true,
      message:"Player updated successfully.",
      player:data,
    }
  );

}




// DELETE PLAYER
export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {

  const { id } = await params;



  const { error } = await supabase
    .from("players")
    .delete()
    .eq("id", id);



  if(error){

    return NextResponse.json(
      {
        success:false,
        message:error.message,
      },
      {
        status:500,
      }
    );

  }



  return NextResponse.json(
    {
      success:true,
      message:"Player deleted successfully.",
    }
  );

}