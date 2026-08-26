"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Team {
  id: number;
  team_name: string;
}

interface Game {
  id: number;
  game_name: string;
  is_team_game: boolean;
  active: boolean;
}

interface Division {
  id: number;
  division_name: string;
  description: string | null;
}

export default function NewTeamPage() {
  const router = useRouter();

  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [form, setForm] = useState({
    team_name: "",
    game_id: "",
    division_id: "",
    captain: "",
    coach: "",
    description: "",
  });

  useEffect(() => {
    async function loadOptions() {
      try {
        const [gamesResponse, divisionsResponse] = await Promise.all([
          fetch("/api/games"),
          fetch("/api/divisions"),
        ]);

        const gamesResult = await gamesResponse.json();
        const divisionsResult = await divisionsResponse.json();

        if (gamesResult.success) {
          setGames(
            gamesResult.games.filter(
              (game: Game) =>
                game.active && game.is_team_game
            )
          );
        }

        if (divisionsResult.success) {
          setDivisions(divisionsResult.divisions);
        }
      } catch (error) {
        console.error(error);
        alert("Failed to load games and divisions.");
      } finally {
        setLoadingOptions(false);
      }
    }

    loadOptions();
  }, []);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLSelectElement |
      HTMLTextAreaElement
    >
  ) {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.message);
        setLoading(false);
        return;
      }

      alert("Team created successfully!");

      router.push("/admin/teams");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }

    setLoading(false);
  }

  return (
    <div className="max-w-5xl mx-auto">

      <div className="mb-10">
        <h1 className="text-4xl font-bold">
          Create New Team
        </h1>

        <p className="text-gray-400 mt-2">
          Add a new competitive esports team.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-8 space-y-8"
      >

        {/* Team Name */}

        <div>
          <label className="block mb-2 font-semibold">
            Team Name
          </label>

          <input
            type="text"
            name="team_name"
            value={form.team_name}
            onChange={handleChange}
            placeholder="Example: KICKCREW Valorant"
            className="w-full bg-black border border-gray-700 rounded-xl p-4"
            required
          />
        </div>

        {/* Game + Division */}

        <div className="grid md:grid-cols-2 gap-6">

          <div>
            <label className="block mb-2 font-semibold">
              Game
            </label>

            <select
              name="game_id"
              value={form.game_id}
              onChange={handleChange}
              className="w-full bg-black border border-gray-700 rounded-xl p-4"
              required
              disabled={loadingOptions}
            >
              <option value="">
                {loadingOptions
                  ? "Loading games..."
                  : "Select Game"}
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

          <div>
            <label className="block mb-2 font-semibold">
              Division
            </label>

            <select
              name="division_id"
              value={form.division_id}
              onChange={handleChange}
              className="w-full bg-black border border-gray-700 rounded-xl p-4"
              required
              disabled={loadingOptions}
            >
              <option value="">
                {loadingOptions
                  ? "Loading divisions..."
                  : "Select Division"}
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
              name="captain"
              value={form.captain}
              onChange={handleChange}
              placeholder="Captain Name"
              className="w-full bg-black border border-gray-700 rounded-xl p-4"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">
              Coach
            </label>

            <input
              type="text"
              name="coach"
              value={form.coach}
              onChange={handleChange}
              placeholder="Coach Name"
              className="w-full bg-black border border-gray-700 rounded-xl p-4"
            />
          </div>

        </div>

        {/* Description */}

        <div>
          <label className="block mb-2 font-semibold">
            Team Description
          </label>

          <textarea
            name="description"
            rows={6}
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the team..."
            className="w-full bg-black border border-gray-700 rounded-xl p-4"
          />
        </div>

        {/* Buttons */}

        <div className="flex gap-4 pt-4">

          <button
            type="submit"
            disabled={loading || loadingOptions}
            className="bg-[#D4AF37] text-black px-8 py-4 rounded-xl font-bold hover:bg-yellow-400 transition disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Team"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/admin/teams")}
            className="border border-gray-700 px-8 py-4 rounded-xl hover:border-white transition"
          >
            Cancel
          </button>

        </div>

      </form>

    </div>
  );
}