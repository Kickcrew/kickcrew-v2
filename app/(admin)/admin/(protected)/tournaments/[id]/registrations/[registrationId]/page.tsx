"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Registration {
  id: number;
  tournament_id: number;
  team_id: number | null;
  player_id: number | null;
  status: string;
  registered_at: string;

  tournaments?: {
    id: number;
    tournament_name: string;
  } | null;

  teams?: {
    id: number;
    team_name: string;
  } | null;

  players?: {
    id: number;
    full_name: string;
    gamer_tag: string;
  } | null;
}

export default function RegistrationDetailsPage() {
  const params = useParams();

  const tournamentId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const registrationId = Array.isArray(params.registrationId)
    ? params.registrationId[0]
    : params.registrationId;

  const [registration, setRegistration] =
    useState<Registration | null>(null);

  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  /*
   * LOAD REGISTRATION
   */
  useEffect(() => {
    if (!registrationId) return;

    async function loadRegistration() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/tournament-registrations/${registrationId}`
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Failed to load registration."
          );
        }

        setRegistration(result.registration);
      } catch (error) {
        console.error("Registration loading error:", error);
        alert("Failed to load registration.");
      } finally {
        setLoading(false);
      }
    }

    loadRegistration();
  }, [registrationId]);

  /*
   * APPROVE / REJECT REGISTRATION
   */
  async function updateStatus(
    newStatus: "Approved" | "Rejected"
  ) {
    if (!registration) return;

    const actionText =
      newStatus === "Approved"
        ? "approve"
        : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} this registration?`
    );

    if (!confirmed) return;

    try {
      setUpdatingStatus(true);

      const response = await fetch(
        `/api/tournament-registrations/${registration.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            `Failed to ${actionText} registration.`
        );
      }

      /*
       * Update the page immediately without
       * needing to refresh the browser.
       */
      setRegistration((previous) =>
        previous
          ? {
              ...previous,
              status: newStatus,
            }
          : previous
      );

      alert(
        newStatus === "Approved"
          ? "Registration approved successfully."
          : "Registration rejected successfully."
      );
    } catch (error) {
      console.error("Registration status update error:", error);

      alert(
        error instanceof Error
          ? error.message
          : `Failed to ${actionText} registration.`
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  /*
   * LOADING STATE
   */
  if (loading) {
    return (
      <div className="text-white text-xl">
        Loading registration...
      </div>
    );
  }

  /*
   * NOT FOUND
   */
  if (!registration) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">
          Registration Not Found
        </h1>

        <Link
          href={`/admin/tournaments/${tournamentId}/registrations`}
          className="inline-block bg-gray-700 hover:bg-gray-600 px-5 py-3 rounded-lg"
        >
          ← Back to Registrations
        </Link>
      </div>
    );
  }

  /*
   * PARTICIPANT INFORMATION
   */
  const isTeam = registration.team_id !== null;

  const participantName = isTeam
    ? registration.teams?.team_name ||
      "Unknown Team"
    : registration.players?.gamer_tag ||
      registration.players?.full_name ||
      "Unknown Player";

  const participantType = isTeam
    ? "Team"
    : "Player";

  /*
   * STATUS STYLE
   */
  const statusClass =
    registration.status === "Approved"
      ? "bg-green-600 text-white"
      : registration.status === "Rejected"
      ? "bg-red-600 text-white"
      : "bg-yellow-500 text-black";

  /*
   * PAGE
   */
  return (
    <div className="max-w-5xl mx-auto space-y-10">

      {/* HEADER */}

      <div>

        <Link
          href={`/admin/tournaments/${tournamentId}/registrations`}
          className="text-gray-400 hover:text-white transition"
        >
          ← Back to Registrations
        </Link>

        <h1 className="text-4xl font-bold mt-5">
          Registration Details
        </h1>

        <p className="text-gray-400 mt-2">
          Review and manage this tournament registration.
        </p>

      </div>

      {/* MAIN CARD */}

      <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-8 space-y-8">

        {/* PARTICIPANT HEADER */}

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">

          <div>

            <p className="text-sm text-gray-500 uppercase tracking-wide">
              Participant
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {participantName}
            </h2>

            <p className="text-gray-400 mt-2">
              {participantType}
            </p>

          </div>

          <span
            className={`inline-flex self-start px-4 py-2 rounded-full font-semibold ${statusClass}`}
          >
            {registration.status}
          </span>

        </div>

        {/* INFORMATION GRID */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <InfoCard
            title="Registration ID"
            value={`#${registration.id}`}
          />

          <InfoCard
            title="Tournament"
            value={
              registration.tournaments?.tournament_name ??
              "-"
            }
          />

          <InfoCard
            title="Participant Type"
            value={participantType}
          />

          <InfoCard
            title="Team"
            value={
              registration.teams?.team_name ??
              "-"
            }
          />

          <InfoCard
            title="Player Name"
            value={
              registration.players?.full_name ??
              "-"
            }
          />

          <InfoCard
            title="Gamer Tag"
            value={
              registration.players?.gamer_tag ??
              "-"
            }
          />

          <InfoCard
            title="Team ID"
            value={
              registration.team_id !== null
                ? registration.team_id.toString()
                : "-"
            }
          />

          <InfoCard
            title="Player ID"
            value={
              registration.player_id !== null
                ? registration.player_id.toString()
                : "-"
            }
          />

        </div>

        {/* REGISTERED DATE */}

        <div className="border-t border-[#222] pt-6">

          <p className="text-gray-500 text-sm">
            Registered At
          </p>

          <p className="font-semibold mt-2">
            {registration.registered_at
              ? new Date(
                  registration.registered_at
                ).toLocaleString()
              : "-"}
          </p>

        </div>

        {/* APPROVAL SECTION */}

        <div className="border-t border-[#222] pt-6">

          <div className="mb-4">

            <h3 className="text-xl font-bold">
              Registration Decision
            </h3>

            <p className="text-gray-400 text-sm mt-1">
              Approve this participant to allow them
              to become an eligible tournament participant,
              or reject the registration.
            </p>

          </div>

          <div className="flex flex-wrap gap-3">

            {/* APPROVE */}

            <button
              type="button"
              onClick={() =>
                updateStatus("Approved")
              }
              disabled={
                updatingStatus ||
                registration.status === "Approved"
              }
              className="bg-green-600 hover:bg-green-500 disabled:bg-green-600/30 disabled:text-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition"
            >
              {updatingStatus &&
              registration.status !== "Approved"
                ? "Updating..."
                : registration.status === "Approved"
                ? "✓ Approved"
                : "Approve Registration"}
            </button>

            {/* REJECT */}

            <button
              type="button"
              onClick={() =>
                updateStatus("Rejected")
              }
              disabled={
                updatingStatus ||
                registration.status === "Rejected"
              }
              className="bg-red-600 hover:bg-red-500 disabled:bg-red-600/30 disabled:text-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition"
            >
              {updatingStatus &&
              registration.status !== "Rejected"
                ? "Updating..."
                : registration.status === "Rejected"
                ? "✕ Rejected"
                : "Reject Registration"}
            </button>

          </div>

        </div>

        {/* FOOTER */}

        <div className="flex gap-4 pt-4 border-t border-[#222]">

          <Link
            href={`/admin/tournaments/${tournamentId}/registrations`}
            className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-xl font-semibold transition"
          >
            ← Back
          </Link>

        </div>

      </div>

    </div>
  );
}

/*
 * INFORMATION CARD
 */

interface InfoCardProps {
  title: string;
  value: string;
}

function InfoCard({
  title,
  value,
}: InfoCardProps) {
  return (
    <div className="bg-black rounded-xl p-5">

      <p className="text-gray-500 text-sm">
        {title}
      </p>

      <p className="font-semibold mt-2">
        {value}
      </p>

    </div>
  );
}