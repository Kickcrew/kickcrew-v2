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

export default function TournamentParticipantsPage() {
  const params = useParams();

  const tournamentId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadParticipants() {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/tournament-registrations?tournament_id=${tournamentId}`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load participants."
        );
      }

      /*
       * Only approved registrations become
       * tournament participants.
       */
      const approvedRegistrations =
        (result.registrations ?? []).filter(
          (registration: Registration) =>
            registration.status === "Approved"
        );

      setRegistrations(approvedRegistrations);
    } catch (error) {
      console.error(
        "Failed to load tournament participants:",
        error
      );

      alert("Failed to load tournament participants.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!tournamentId) return;

    loadParticipants();
  }, [tournamentId]);

  const totalParticipants = registrations.length;

  const teamParticipants = registrations.filter(
    (registration) => registration.team_id !== null
  ).length;

  const playerParticipants = registrations.filter(
    (registration) =>
      registration.player_id !== null
  ).length;

  return (
    <div className="max-w-7xl mx-auto space-y-10">

      {/* HEADER */}

      <div>

        <Link
          href={`/admin/tournaments/${tournamentId}`}
          className="text-gray-400 hover:text-white transition"
        >
          ← Back to Tournament Management
        </Link>

        <h1 className="text-4xl font-bold mt-5">
          Tournament Participants
        </h1>

        <p className="text-gray-400 mt-2">
          Manage approved teams and players participating
          in this tournament.
        </p>

      </div>

      {/* STATISTICS */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6">

          <p className="text-gray-400">
            Total Participants
          </p>

          <p className="text-3xl font-bold mt-2">
            {totalParticipants}
          </p>

        </div>

        <div className="bg-[#111111] border border-blue-500/20 rounded-2xl p-6">

          <p className="text-gray-400">
            Teams
          </p>

          <p className="text-3xl font-bold text-blue-400 mt-2">
            {teamParticipants}
          </p>

        </div>

        <div className="bg-[#111111] border border-purple-500/20 rounded-2xl p-6">

          <p className="text-gray-400">
            Players
          </p>

          <p className="text-3xl font-bold text-purple-400 mt-2">
            {playerParticipants}
          </p>

        </div>

      </div>

      {/* PARTICIPANTS TABLE */}

      <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl overflow-hidden">

        {loading ? (

          <div className="p-12 text-center text-gray-400">
            Loading participants...
          </div>

        ) : registrations.length === 0 ? (

          <div className="p-12 text-center">

            <h2 className="text-xl font-bold">
              No approved participants
            </h2>

            <p className="text-gray-400 mt-2">
              Approved tournament registrations will
              appear here.
            </p>

            <Link
              href={`/admin/tournaments/${tournamentId}/registrations`}
              className="inline-block mt-5 bg-[#D4AF37] text-black px-5 py-3 rounded-xl font-semibold hover:bg-yellow-400 transition"
            >
              View Registrations
            </Link>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px]">

              <thead className="bg-black">

                <tr className="text-left">

                  <th className="p-5">
                    #
                  </th>

                  <th>
                    Participant
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Full Name
                  </th>

                  <th>
                    Gamer Tag
                  </th>

                  <th>
                    Registration
                  </th>

                  <th className="pr-5">
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {registrations.map(
                  (registration, index) => {

                    const isTeam =
                      registration.team_id !== null;

                   const participantName = isTeam
  ? registration.teams?.[0]?.team_name ||
    "Unknown Team"
  : registration.players?.[0]?.gamer_tag ||
    registration.players?.[0]?.full_name ||
    "Unknown Player";

const fullName =
  registration.players?.[0]?.full_name ||
  "-";

const gamerTag =
  registration.players?.[0]?.gamer_tag ||
  "-";

                    return (
                      <tr
                        key={registration.id}
                        className="border-t border-[#222] hover:bg-[#181818] transition"
                      >

                        {/* Number */}

                        <td className="p-5 text-gray-500">
                          {index + 1}
                        </td>

                        {/* Participant */}

                        <td>

                          <div className="font-semibold text-white">
                            {participantName}
                          </div>

                        </td>

                        {/* Type */}

                        <td>

                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                              isTeam
                                ? "bg-blue-600/20 text-blue-400 border border-blue-500/40"
                                : "bg-purple-600/20 text-purple-400 border border-purple-500/40"
                            }`}
                          >
                            {isTeam
                              ? "Team"
                              : "Player"}
                          </span>

                        </td>

                        {/* Full Name */}

                        <td className="text-gray-300">
                          {fullName}
                        </td>

                        {/* Gamer Tag */}

                        <td className="text-gray-300">
                          {gamerTag}
                        </td>

                        {/* Registration */}

                        <td className="text-gray-400">
                          #{registration.id}
                        </td>

                        {/* Status */}

                        <td className="pr-5">

                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-600/20 text-green-400 border border-green-500/40">
                            Approved
                          </span>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* FUTURE FIXTURES NOTICE */}

      <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6">

        <h2 className="text-xl font-bold">
          Fixture Preparation
        </h2>

        <p className="text-gray-400 mt-2">
          These approved participants will become the
          pool used by the automatic fixture generation
          system.
        </p>

        <div className="mt-5">

          <Link
            href={`/admin/tournaments/${tournamentId}/fixtures`}
            className="inline-block bg-black border border-gray-700 hover:border-[#D4AF37] px-5 py-3 rounded-xl font-semibold transition"
          >
            Go to Fixtures →
          </Link>

        </div>

      </div>

    </div>
  );
}