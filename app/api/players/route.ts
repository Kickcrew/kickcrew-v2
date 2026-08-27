import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";


// CREATE PLAYER
export async function POST(req: Request) {

  try {

    const body = await req.json();


    const playerData = {
      applicant_id: body.applicant_id || null,

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
      .insert([playerData])
      .select()
      .single();



    if (error) {

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
        message:"Player created successfully.",
        player:data,
      },
      {
        status:200,
      }
    );



  } catch(error) {


    console.error(error);


    return NextResponse.json(
      {
        success:false,
        message:"Internal server error.",
      },
      {
        status:500,
      }
    );

  }

}




// GET ALL PLAYERS
export async function GET() {


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
    .order("id", {
      ascending:false,
    });



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
      players:data,
    }
  );

}