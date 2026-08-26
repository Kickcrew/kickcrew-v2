"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Tournament {
  id: number;
  tournament_name: string;
  tournament_type: string;
  tournament_level: string;
  prize_pool: string;
  max_teams: number;
  status: string;
  banner_image: string;

  games: {
    game_name: string;
  };
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadTournaments() {
    try {
      const response = await fetch("/api/tournaments");
      const result = await response.json();

      if (result.success) {
        setTournaments(result.tournaments);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteTournament(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this tournament?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/tournaments/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.message);
        return;
      }

      setTournaments((previous) =>
        previous.filter(
          (tournament) => tournament.id !== id
        )
      );

      alert("Tournament deleted successfully.");
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }
  }

  useEffect(() => {
    loadTournaments();
  }, []);

  return (
    <div className="space-y-10">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-4xl font-bold">
            Tournaments
          </h1>

          <p className="text-gray-400 mt-2">
            Manage all KICKCREW tournaments.
          </p>

        </div>

        <Link
          href="/admin/tournaments/new"
          className="bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition"
        >
          + New Tournament
        </Link>

      </div>

      <div className="bg-[#111111] rounded-2xl border border-[#D4AF37]/20 overflow-hidden">

        <table className="w-full">

          <thead className="bg-black">

            <tr>

              <th className="text-left p-5">
                Banner
              </th>

              <th className="text-left">
                Tournament
              </th>

              <th className="text-left">
                Game
              </th>

              <th className="text-left">
                Type
              </th>

              <th className="text-left">
                Level
              </th>

              <th className="text-left">
                Prize Pool
              </th>

              <th className="text-left">
                Teams
              </th>

              <th className="text-left">
                Status
              </th>

              <th className="text-left">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {loading && (

              <tr>

                <td
                  colSpan={9}
                  className="text-center p-8 text-gray-400"
                >
                  Loading tournaments...
                </td>

              </tr>

            )}

            {!loading &&
              tournaments.length === 0 && (

              <tr>

                <td
                  colSpan={9}
                  className="text-center p-8 text-gray-400"
                >
                  No tournaments found.
                </td>

              </tr>

            )}

            {tournaments.map((tournament) => (

              <tr
                key={tournament.id}
                className="border-t border-[#222]"
              >

                <td className="p-5">

                  <img
                    src={
                      tournament.banner_image ||
                      "https://placehold.co/120x60?text=Banner"
                    }
                    alt={tournament.tournament_name}
                    className="w-24 h-14 rounded-lg object-cover"
                  />

                </td>

                <td className="font-semibold">
                  {tournament.tournament_name}
                </td>

                <td>
                  {tournament.games?.game_name || "-"}
                </td>

                <td>
                  {tournament.tournament_type}
                </td>

                <td>
                  {tournament.tournament_level}
                </td>

                <td>
                  {tournament.prize_pool}
                </td>

                <td>
                  {tournament.max_teams}
                </td>

                <td>

                  <span className="bg-yellow-600 px-3 py-1 rounded-full text-sm">
                    {tournament.status}
                  </span>

                </td>

                <td className="p-5">
  <div className="flex items-center gap-2">

  {/* VIEW */}

  <Link
    href={`/admin/tournaments/${tournament.id}`}
    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
  >
    View
  </Link>

  {/* EDIT */}

  <Link
    href={`/admin/tournaments/${tournament.id}/edit`}
    className="bg-[#D4AF37] hover:bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-semibold transition"
  >
    Edit
  </Link>

  {/* DELETE */}

  <button
    type="button"
    onClick={() =>
  deleteTournament(tournament.id)
}
    className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
  >
    Delete
  </button>

</div>
</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}