"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Team {
  id: number;
  team_name: string;
  division: string;
  captain: string;
  coach: string;
  status: string;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all teams
  useEffect(() => {
    async function loadTeams() {
      try {
        const response = await fetch("/api/teams");
        const result = await response.json();

        if (result.success) {
          setTeams(result.teams);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadTeams();
  }, []);

  // Delete a team
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

      <div className="bg-[#111111] rounded-2xl border border-[#D4AF37]/20 overflow-hidden">

        <table className="w-full">

          <thead className="bg-black">
            <tr>
              <th className="text-left p-5">Team</th>
              <th className="text-left">Division</th>
              <th className="text-left">Captain</th>
              <th className="text-left">Coach</th>
              <th className="text-left">Status</th>
              <th className="text-left">Action</th>
            </tr>
          </thead>

          <tbody>

            {loading && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-400">
                  Loading teams...
                </td>
              </tr>
            )}

            {!loading && teams.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-400">
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
                  <td className="p-5 font-semibold">
                    {team.team_name}
                  </td>

                  <td>{team.division}</td>

                  <td>{team.captain || "-"}</td>

                  <td>{team.coach || "-"}</td>

                  <td>
                    <span className="bg-green-600 px-3 py-1 rounded-full text-sm">
                      {team.status || "Active"}
                    </span>
                  </td>

                  <td className="space-x-2">

                    <Link
                      href={`/admin/teams/${team.id}`}
                      className="inline-block bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500 transition"
                    >
                      Edit
                    </Link>

                    <button
                      onClick={() => deleteTeam(team.id)}
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