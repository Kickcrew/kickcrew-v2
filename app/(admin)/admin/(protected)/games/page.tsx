"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Game {
  id: number;
  game_name: string;
  category: string;
  active: boolean;
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadGames() {
    try {
      const response = await fetch("/api/games");
      const result = await response.json();

      if (result.success) {
        setGames(result.games);
      }
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  }

  async function deleteGame(id: number) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this game?"
  );

  if (!confirmed) return;

  const response = await fetch(`/api/games/${id}`, {
    method: "DELETE",
  });

  const result = await response.json();

  if (!result.success) {
    alert(result.message);
    return;
  }

  setGames((previous) =>
    previous.filter((game) => game.id !== id)
  );

  alert("Game deleted successfully.");
}
  useEffect(() => {
    loadGames();
  }, []);

  return (
    <div className="space-y-10">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-4xl font-bold">
            Games
          </h1>

          <p className="text-gray-400 mt-2">
            Manage supported esports titles.
          </p>

        </div>

        <Link
          href="/admin/games/new"
          className="bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition"
        >
          + New Game
        </Link>

      </div>

      <div className="bg-[#111111] rounded-2xl border border-[#D4AF37]/20 overflow-hidden">

        <table className="w-full">

          <thead className="bg-black">

            <tr>

              <th className="text-left p-5">
                Game
              </th>

              <th className="text-left">
                Category
              </th>

              <th className="text-left">
                Status
              </th>

              <th className="text-left">
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            {loading && (

              <tr>

                <td
                  colSpan={4}
                  className="p-6 text-center text-gray-400"
                >
                  Loading games...
                </td>

              </tr>

            )}

            {!loading &&
              games.map((game) => (

                <tr
                  key={game.id}
                  className="border-t border-[#222]"
                >

                  <td className="p-5 font-semibold">
                    {game.game_name}
                  </td>

                  <td>
                    {game.category}
                  </td>

                  <td>

                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        game.active
                          ? "bg-green-600"
                          : "bg-red-600"
                      }`}
                    >
                      {game.active ? "Active" : "Inactive"}
                    </span>

                  </td>

                  <td className="pr-5">

  <div className="flex gap-2">

    <Link
      href={`/admin/games/${game.id}/view`}
      className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-sm font-semibold transition"
    >
      View
    </Link>

    <Link
      href={`/admin/games/${game.id}`}
      className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-semibold transition"
    >
      Edit
    </Link>

    <button
      onClick={() => deleteGame(game.id)}
      className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg text-sm font-semibold transition"
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