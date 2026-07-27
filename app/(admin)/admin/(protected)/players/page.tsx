"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Player {
  id: number;
  full_name: string;
  gamer_tag: string;
  game: string;
  role: string;
  rank: string;
  status: string;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPlayers() {
    try {
      const response = await fetch("/api/players");
      const result = await response.json();

      if (result.success) {
        setPlayers(result.players);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function deletePlayer(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this player?"
    );

    if (!confirmed) return;

    const response = await fetch(`/api/players/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!result.success) {
      alert(result.message);
      return;
    }

    setPlayers((previous) =>
      previous.filter((player) => player.id !== id)
    );

    alert("Player deleted successfully.");
  }

  useEffect(() => {
    loadPlayers();
  }, []);

  return (
    <div className="space-y-10">

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-4xl font-bold">
            Players
          </h1>

          <p className="text-gray-400 mt-2">
            Manage KICKCREW esports players.
          </p>
        </div>

        <Link
          href="/admin/players/new"
          className="bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition"
        >
          + New Player
        </Link>

      </div>

      <div className="bg-[#111111] rounded-2xl border border-[#D4AF37]/20 overflow-hidden">

        <table className="w-full">

          <thead className="bg-black">

            <tr>
              <th className="text-left p-5">Gamer Tag</th>
              <th className="text-left">Full Name</th>
              <th className="text-left">Game</th>
              <th className="text-left">Role</th>
              <th className="text-left">Rank</th>
              <th className="text-left">Status</th>
              <th className="text-left">Action</th>
            </tr>

          </thead>

          <tbody>

            {loading && (
              <tr>
                <td colSpan={7} className="p-6 text-center">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && players.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center">
                  No players found.
                </td>
              </tr>
            )}

            {players.map((player) => (

              <tr
                key={player.id}
                className="border-t border-[#222]"
              >

                <td className="p-5 font-semibold">
                  {player.gamer_tag}
                </td>

                <td>{player.full_name}</td>

                <td>{player.game}</td>

                <td>{player.role}</td>

                <td>{player.rank}</td>

                <td>
                  <span className="bg-green-600 px-3 py-1 rounded-full text-sm">
                    {player.status}
                  </span>
                </td>

                <td className="space-x-2">

                  <Link
                    href={`/admin/players/${player.id}`}
                    className="inline-block bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500 transition"
                  >
                    Edit
                  </Link>

                  <button
                    onClick={() => deletePlayer(player.id)}
                    className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-500 transition"
                  >
                    Delete
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}