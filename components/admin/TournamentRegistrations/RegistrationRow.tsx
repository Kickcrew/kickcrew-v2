"use client";

import { useState } from "react";
import RegistrationStatus from "./RegistrationStatus";
import RegistrationActions from "./RegistrationActions";
import DeleteRegistrationButton from "./DeleteRegistrationButton";

interface Registration {
  id: number;
  tournament_id: number;
  team_id: number | null;
  player_id: number | null;
  status: string;
  registered_at: string;

  teams?: {
  id: number;
  team_name: string | null;
}[];

  players?: {
  id: number;
  full_name: string | null;
  gamer_tag: string | null;
}[];
}

interface RegistrationRowProps {
  registration: Registration;
  onDeleted: (id: number) => void;
}

export default function RegistrationRow({
  registration,
  onDeleted,
}: RegistrationRowProps) {
  const [status, setStatus] = useState(registration.status);
  const [updating, setUpdating] = useState(false);

  const isTeam = registration.team_id !== null;
  const isPlayer = registration.player_id !== null;

  const participantName = isTeam
  ? registration.teams?.[0]?.team_name || "Unknown Team"
  : isPlayer
  ? registration.players?.[0]?.gamer_tag ||
    registration.players?.[0]?.full_name ||
    "Unknown Player"
  : "Unknown";

  const participantType = isTeam
    ? "Team"
    : isPlayer
    ? "Player"
    : "-";

  async function updateStatus(
    newStatus: "Approved" | "Rejected"
  ) {
    const action =
      newStatus === "Approved"
        ? "approve"
        : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this registration?`
    );

    if (!confirmed) return;

    try {
      setUpdating(true);

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
            `Failed to ${action} registration.`
        );
      }

      setStatus(newStatus);

      alert(
        newStatus === "Approved"
          ? "Registration approved successfully."
          : "Registration rejected successfully."
      );
    } catch (error) {
      console.error(
        "Registration status update error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to update registration."
      );
    } finally {
      setUpdating(false);
    }
  }

  return (
    <tr className="border-t border-[#222] hover:bg-[#161616] transition">

      {/* Participant */}
      <td className="p-5">
        <div className="font-semibold text-white">
          {participantName}
        </div>

        <div className="text-sm text-gray-500">
          {participantType}
        </div>
      </td>

      {/* Full Name */}
      <td>
        {isPlayer
          ?registration.players?.[0]?.full_name || "-"
          : "-"}
      </td>

      {/* Gamer Tag */}
      <td>
        {isPlayer
          ? registration.players?.[0]?.gamer_tag || "-"
          : "-"}
      </td>

      {/* Status */}
      <td>
        <RegistrationStatus status={status} />
      </td>

      {/* Registered */}
      <td>
        {registration.registered_at
          ? new Date(
              registration.registered_at
            ).toLocaleDateString()
          : "-"}
      </td>

      {/* Actions */}
      <td className="pr-5">
        <div className="flex flex-wrap items-center gap-2">

          {/* VIEW */}
          <RegistrationActions
            registrationId={registration.id}
            tournamentId={registration.tournament_id}
          />

          {/* PENDING */}
          {status === "Pending" && (
            <>
              <button
                type="button"
                onClick={() =>
                  updateStatus("Approved")
                }
                disabled={updating}
                className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                {updating
                  ? "Updating..."
                  : "Approve"}
              </button>

              <button
                type="button"
                onClick={() =>
                  updateStatus("Rejected")
                }
                disabled={updating}
                className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                {updating
                  ? "Updating..."
                  : "Reject"}
              </button>
            </>
          )}

          {/* APPROVED */}
          {status === "Approved" && (
            <button
              type="button"
              onClick={() =>
                updateStatus("Rejected")
              }
              disabled={updating}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              {updating
                ? "Updating..."
                : "Reject"}
            </button>
          )}

          {/* REJECTED */}
          {status === "Rejected" && (
            <button
              type="button"
              onClick={() =>
                updateStatus("Approved")
              }
              disabled={updating}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              {updating
                ? "Updating..."
                : "Approve"}
            </button>
          )}

          {/* DELETE */}
          <DeleteRegistrationButton
            registrationId={registration.id}
            onDeleted={onDeleted}
          />

        </div>
      </td>

    </tr>
  );
}