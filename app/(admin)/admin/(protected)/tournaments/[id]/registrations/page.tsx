"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import RegistrationTable from "@/components/admin/TournamentRegistrations/RegistrationTable";

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
  team_name: string | null;
}[];

players?: {
  id: number;
  full_name: string | null;
  gamer_tag: string | null;
}[];
}

export default function TournamentRegistrationsPage() {
  const params = useParams();

  const tournamentId = Array.isArray(params.id)
  ? params.id[0]
  : params.id;

console.log("params =", params);
console.log("tournamentId =", tournamentId);

  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  async function loadRegistrations() {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/tournament-registrations?tournament_id=${tournamentId}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load registrations.");
      }

      setRegistrations(result.registrations ?? []);
    } catch (error) {
      console.error(error);
      alert("Failed to load tournament registrations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  console.log("Loading registrations for:", tournamentId);

  if (!tournamentId) return;

  loadRegistrations();
}, [tournamentId]);

  function handleDeleted(id: number) {
    setRegistrations((previous) =>
      previous.filter((registration) => registration.id !== id)
    );
  }

  const tournamentName =
    registrations[0]?.tournaments?.tournament_name ?? "Tournament";

  const total = registrations.length;
  const approved = registrations.filter(
    (registration) => registration.status === "Approved"
  ).length;

  const pending = registrations.filter(
    (registration) => registration.status === "Pending"
  ).length;

  const rejected = registrations.filter(
    (registration) => registration.status === "Rejected"
  ).length;

  return (
    <div className="space-y-10">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <Link
            href="/admin/tournaments"
            className="text-gray-400 hover:text-white"
          >
            ← Back to Tournaments
          </Link>

          <h1 className="text-4xl font-bold mt-4">
            Tournament Registrations
          </h1>

          <p className="text-gray-400 mt-2">
            {tournamentName}
          </p>

        </div>

      </div>

      {/* Statistics */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

        <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6">
          <p className="text-gray-400">Total</p>
          <p className="text-3xl font-bold mt-2">
            {total}
          </p>
        </div>

        <div className="bg-[#111111] border border-yellow-500/20 rounded-2xl p-6">
          <p className="text-gray-400">Pending</p>
          <p className="text-3xl font-bold text-yellow-400 mt-2">
            {pending}
          </p>
        </div>

        <div className="bg-[#111111] border border-green-500/20 rounded-2xl p-6">
          <p className="text-gray-400">Approved</p>
          <p className="text-3xl font-bold text-green-400 mt-2">
            {approved}
          </p>
        </div>

        <div className="bg-[#111111] border border-red-500/20 rounded-2xl p-6">
          <p className="text-gray-400">Rejected</p>
          <p className="text-3xl font-bold text-red-400 mt-2">
            {rejected}
          </p>
        </div>

      </div>

      {/* Table */}

      {loading ? (

        <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-12 text-center text-gray-400">
          Loading registrations...
        </div>

      ) : (

        <RegistrationTable
          registrations={registrations}
          onDeleted={handleDeleted}
        />

      )}

    </div>
  );
}