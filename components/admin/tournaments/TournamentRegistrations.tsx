"use client";

import { useEffect, useState } from "react";

import RegistrationTable from "@/components/admin/TournamentRegistrations/RegistrationTable";

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

interface TournamentRegistrationsProps {
  tournamentId: string;
}

export default function TournamentRegistrations({
  tournamentId,
}: TournamentRegistrationsProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadRegistrations() {
    try {
      const response = await fetch(
        `/api/tournament-registrations?tournament_id=${tournamentId}`
      );

      const result = await response.json();

      if (result.success) {
        setRegistrations(result.registrations ?? []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRegistrations();
  }, [tournamentId]);

  function handleDeleted(id: number) {
    setRegistrations((prev) =>
      prev.filter((registration) => registration.id !== id)
    );
  }

  return (
    <div className="mt-10 space-y-6">

      <div>
        <h2 className="text-2xl font-bold">
          Tournament Registrations
        </h2>

        <p className="text-gray-400">
          Manage tournament registrations.
        </p>
      </div>

      {loading ? (
        <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-8 text-center">
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