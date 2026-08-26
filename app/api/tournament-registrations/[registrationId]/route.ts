import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface RouteContext {
  params: Promise<{
    registrationId: string;
  }>;
}

// ============================================================
// GET ONE REGISTRATION
// ============================================================

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { registrationId } =
      await context.params;

    const id = Number(registrationId);

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid registration ID.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("tournament_registrations")
      .select(`
        *,
        tournaments (
          id,
          tournament_name,
          status
        ),
        teams (
          id,
          team_name
        ),
        players (
          id,
          full_name,
          gamer_tag
        )
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          success: false,
          message:
            error?.message ||
            "Registration not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      registration: data,
    });
  } catch (error) {
    console.error(
      "Registration GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Internal server error.",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// UPDATE REGISTRATION STATUS
// ============================================================

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const { registrationId } =
      await context.params;

    const id = Number(registrationId);

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid registration ID.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const status = body.status;

    // --------------------------------------------------------
    // Allowed registration statuses
    // --------------------------------------------------------

    const allowedStatuses = [
      "Pending",
      "Approved",
      "Rejected",
    ];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid registration status.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // 1. Load registration
    // --------------------------------------------------------

    const {
      data: registration,
      error: registrationError,
    } = await supabase
      .from("tournament_registrations")
      .select(`
        id,
        tournament_id,
        team_id,
        player_id,
        status
      `)
      .eq("id", id)
      .single();

    if (registrationError || !registration) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Registration not found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------------
    // 2. Load associated tournament
    // --------------------------------------------------------

    const {
      data: tournament,
      error: tournamentError,
    } = await supabase
      .from("tournaments")
      .select(`
        id,
        tournament_name,
        status
      `)
      .eq(
        "id",
        registration.tournament_id
      )
      .single();

    if (tournamentError || !tournament) {
      console.error(
        "Tournament lookup failed:",
        tournamentError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "The tournament associated with this registration could not be found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------------
    // 3. LOCK REGISTRATION AFTER REGISTRATION CLOSES
    // --------------------------------------------------------
    //
    // Registration changes are allowed ONLY while the
    // tournament is in Registration Open.
    //
    // Once the tournament moves to:
    //
    // Upcoming
    // Live
    // Completed
    // Canceled
    //
    // registration status can no longer be changed.
    //
    // This prevents an administrator/organizer from approving
    // or rejecting competitors after fixtures may already have
    // been generated.
    // --------------------------------------------------------

    if (
      tournament.status !==
      "Registration Open"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Registration changes are locked because this tournament is no longer open for registration.",
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------------
    // 4. Update registration status
    // --------------------------------------------------------

    const {
      data: updatedRegistration,
      error: updateError,
    } = await supabase
      .from("tournament_registrations")
      .update({
        status,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error(
        "Registration status update error:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            updateError.message ||
            "Failed to update registration.",
        },
        { status: 500 }
      );
    }

    if (!updatedRegistration) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Registration could not be updated.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        status === "Approved"
          ? "Registration approved successfully."
          : status === "Rejected"
          ? "Registration rejected successfully."
          : "Registration returned to pending.",
      registration:
        updatedRegistration,
    });
  } catch (error) {
    console.error(
      "Registration PUT error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Internal server error.",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE REGISTRATION
// ============================================================

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { registrationId } =
      await context.params;

    const id = Number(registrationId);

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid registration ID.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // 1. Load registration
    // --------------------------------------------------------

    const {
      data: registration,
      error: registrationError,
    } = await supabase
      .from("tournament_registrations")
      .select(`
        id,
        tournament_id,
        team_id,
        player_id,
        status
      `)
      .eq("id", id)
      .single();

    if (registrationError || !registration) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Registration not found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------------
    // 2. Load tournament
    // --------------------------------------------------------

    const {
      data: tournament,
      error: tournamentError,
    } = await supabase
      .from("tournaments")
      .select(`
        id,
        tournament_name,
        status
      `)
      .eq(
        "id",
        registration.tournament_id
      )
      .single();

    if (tournamentError || !tournament) {
      console.error(
        "Tournament lookup failed:",
        tournamentError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "The tournament associated with this registration could not be found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------------
    // 3. LOCK DELETION AFTER REGISTRATION CLOSES
    // --------------------------------------------------------
    //
    // An approved registration cannot simply disappear after
    // fixtures have potentially been generated.
    //
    // Only Registration Open allows deletion.
    // --------------------------------------------------------

    if (
      tournament.status !==
      "Registration Open"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Registration deletion is locked because this tournament is no longer open for registration.",
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------------
    // 4. Delete registration
    // --------------------------------------------------------

    const { error: deleteError } =
      await supabase
        .from("tournament_registrations")
        .delete()
        .eq("id", id);

    if (deleteError) {
      console.error(
        "Registration DELETE error:",
        deleteError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            deleteError.message ||
            "Failed to delete registration.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Registration deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Registration DELETE error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Internal server error.",
      },
      { status: 500 }
    );
  }
}