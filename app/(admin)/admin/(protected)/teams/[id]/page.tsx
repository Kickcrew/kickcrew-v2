"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

interface Game {
  id: number;
  game_name: string;
}

interface Division {
  id: number;
  division_name: string;
}

export default function EditTeamPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id;

  const [games, setGames] = useState<Game[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);

  const [teamName, setTeamName] = useState("");
  const [gameId, setGameId] = useState("");
  const [divisionId, setDivisionId] = useState("");
  const [captain, setCaptain] = useState("");
  const [coach, setCoach] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [teamResponse, gamesResponse, divisionsResponse] =
          await Promise.all([
            fetch(`/api/teams/${id}`),
            fetch("/api/games"),
            fetch("/api/divisions"),
          ]);

        const teamResult = await teamResponse.json();
        const gamesResult = await gamesResponse.json();
        const divisionsResult = await divisionsResponse.json();

        if (gamesResult.success) {
          setGames(gamesResult.games);
        }

        if (divisionsResult.success) {
          setDivisions(divisionsResult.divisions);
        }

        if (teamResult.success) {
          const team = teamResult.team;

          setTeamName(team.team_name || "");
          setGameId(team.game_id ? String(team.game_id) : "");
          setDivisionId(
            team.division_id ? String(team.division_id) : ""
          );
          setCaptain(team.captain || "");
          setCoach(team.coach || "");
          setDescription(team.description || "");
        }
      } catch (error) {
        console.error(error);
        alert("Failed to load team information.");
      }

      setLoading(false);
    }

    loadData();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);

    try {
      const response = await fetch(`/api/teams/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          team_name: teamName,
          game_id: gameId ? Number(gameId) : null,
          division_id: divisionId ? Number(divisionId) : null,
          captain,
          coach,
          description,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.message);
        setSaving(false);
        return;
      }

      alert("Team updated successfully!");

      router.push("/admin/teams");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Something went wrong while updating the team.");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="text-xl text-white">
        Loading team...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">

      <div className="mb-10">
        <h1 className="text-4xl font-bold">
          Edit Team
        </h1>

        <p className="text-gray-400 mt-2">
          Update the KICKCREW team information.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-8 space-y-6"
      >

        {/* Team Name */}

        <div>
          <label className="block mb-2 font-semibold">
            Team Name
          </label>

          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
            className="w-full bg-black border border-gray-700 rounded-xl p-4 focus:border-[#D4AF37] outline-none"
          />
        </div>

        {/* Game + Division */}

        <div className="grid md:grid-cols-2 gap-6">

          {/* Game */}

          <div>
            <label className="block mb-2 font-semibold">
              Game
            </label>

            <select
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              required
              className="w-full bg-black border border-gray-700 rounded-xl p-4"
            >
              <option value="">
                Select Game
              </option>

              {games.map((game) => (
                <option
                  key={game.id}
                  value={game.id}
                >
                  {game.game_name}
                </option>
              ))}
            </select>
          </div>

          {/* Division */}

          <div>
            <label className="block mb-2 font-semibold">
              Division
            </label>

            <select
              value={divisionId}
              onChange={(e) => setDivisionId(e.target.value)}
              required
              className="w-full bg-black border border-gray-700 rounded-xl p-4"
            >
              <option value="">
                Select Division
              </option>

              {divisions.map((division) => (
                <option
                  key={division.id}
                  value={division.id}
                >
                  {division.division_name}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Captain + Coach */}

        <div className="grid md:grid-cols-2 gap-6">

          <div>
            <label className="block mb-2 font-semibold">
              Captain
            </label>

            <input
              type="text"
              value={captain}
              onChange={(e) => setCaptain(e.target.value)}
              placeholder="Captain Name"
              className="w-full bg-black border border-gray-700 rounded-xl p-4 focus:border-[#D4AF37] outline-none"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">
              Coach
            </label>

            <input
              type="text"
              value={coach}
              onChange={(e) => setCoach(e.target.value)}
              placeholder="Coach Name"
              className="w-full bg-black border border-gray-700 rounded-xl p-4 focus:border-[#D4AF37] outline-none"
            />
          </div>

        </div>

        {/* Description */}

        <div>
          <label className="block mb-2 font-semibold">
            Team Description
          </label>

          <textarea
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the team..."
            className="w-full bg-black border border-gray-700 rounded-xl p-4 focus:border-[#D4AF37] outline-none"
          />
        </div>

        {/* Buttons */}

        <div className="flex gap-4 pt-4">

          <button
            type="submit"
            disabled={saving}
            className="bg-[#D4AF37] text-black px-8 py-4 rounded-xl font-bold hover:bg-yellow-400 transition disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/admin/teams")}
            className="bg-gray-700 hover:bg-gray-600 px-8 py-4 rounded-xl transition"
          >
            Cancel
          </button>

        </div>

      </form>

    </div>
  );
}