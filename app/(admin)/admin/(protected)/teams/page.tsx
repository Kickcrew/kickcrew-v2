"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Team {
  id: number;
  team_name: string;
  game_id: number | null;
  division_id: number | null;
  captain: string;
  coach: string;
  status: string;
}

interface Game {
  id: number;
  game_name: string;
}

interface Division {
  id: number;
  division_name: string;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [teamsResponse, gamesResponse, divisionsResponse] =
          await Promise.all([
            fetch("/api/teams"),
            fetch("/api/games"),
            fetch("/api/divisions"),
          ]);

        const teamsResult = await teamsResponse.json();
        const gamesResult = await gamesResponse.json();
        const divisionsResult = await divisionsResponse.json();

        if (teamsResult.success) {
          setTeams(teamsResult.teams);
        }

        if (gamesResult.success) {
          setGames(gamesResult.games);
        }

        if (divisionsResult.success) {
          setDivisions(divisionsResult.divisions);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function getGameName(gameId: number | null) {
    if (!gameId) return "-";

    const game = games.find((game) => game.id === gameId);

    return game?.game_name || "-";
  }

  function getDivisionName(divisionId: number | null) {
    if (!divisionId) return "-";

    const division = divisions.find(
      (division) => division.id === divisionId
    );

    return division?.division_name || "-";
  }

  async function deleteTeam(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this team?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/teams/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.message);
        return;
      }

      setTeams((previous) =>
        previous.filter((team) => team.id !== id)
      );

      alert("Team deleted successfully!");
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }
  }

  return (
    <div className="space-y-10">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-4xl font-bold">
            Teams
          </h1>

          <p className="text-gray-400 mt-2">
            Manage KICKCREW competitive esports teams.
          </p>
        </div>

        <Link
          href="/admin/teams/new"
          className="bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition"
        >
          + New Team
        </Link>

      </div>

      {/* Teams Table */}

      <div className="bg-[#111111] rounded-2xl border border-[#D4AF37]/20 overflow-hidden">

        <table className="w-full">

          <thead className="bg-black">

            <tr>

              <th className="text-left p-5">
                Team
              </th>

              <th className="text-left">
                Game
              </th>

              <th className="text-left">
                Division
              </th>

              <th className="text-left">
                Captain
              </th>

              <th className="text-left">
                Coach
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
                  colSpan={7}
                  className="p-6 text-center text-gray-400"
                >
                  Loading teams...
                </td>
              </tr>
            )}

            {!loading && teams.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="p-6 text-center text-gray-400"
                >
                  No teams found.
                </td>
              </tr>
            )}

            {!loading &&
              teams.map((team) => (
                <tr
                  key={team.id}
                  className="border-t border-[#222]"
                >

                  {/* Team */}

                  <td className="p-5 font-semibold">
                    {team.team_name}
                  </td>

                  {/* Game */}

                  <td>
                    {getGameName(team.game_id)}
                  </td>

                  {/* Division */}

                  <td>
                    {getDivisionName(team.division_id)}
                  </td>

                  {/* Captain */}

                  <td>
                    {team.captain || "-"}
                  </td>

                  {/* Coach */}

                  <td>
                    {team.coach || "-"}
                  </td>

                  {/* Status */}

                  <td>

                    <span className="bg-green-600 px-3 py-1 rounded-full text-sm">
                      {team.status || "Active"}
                    </span>

                  </td>

                  {/* Actions */}

                  <td className="pr-5">

                    <div className="flex gap-2">

                      <Link
                        href={`/admin/teams/${team.id}/view`}
                        className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-sm font-semibold transition"
                      >
                        View
                      </Link>

                      <Link
                        href={`/admin/teams/${team.id}`}
                        className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-semibold transition"
                      >
                        Edit
                      </Link>

                      <button
                        onClick={() => deleteTeam(team.id)}
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