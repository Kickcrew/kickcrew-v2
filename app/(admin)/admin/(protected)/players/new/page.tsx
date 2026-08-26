"use client";

import ImageUpload from "@/components/admin/ImageUpload";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Team {
  id: number;
  team_name: string;
}
interface Game {
  id: number;
  game_name: string;
}

export default function NewPlayerPage() {
  const router = useRouter();

  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    profile_photo: "",
    full_name: "",
    gamer_tag: "",
    email: "",
    phone: "",
    team_id: "",
    game: "",
    role: "",
    rank: "",
    country: "",
    status: "Active",
    bio: "",
  });

  useEffect(() => {
    async function loadTeams() {
      try {
        const response = await fetch("/api/teams");
        const result = await response.json();

        if (result.success) {
          setTeams(result.teams);
        }
        const gameResponse = await fetch("/api/games");
const gameResult = await gameResponse.json();

if (gameResult.success) {
  setGames(gameResult.games);
}
      } catch (error) {
        console.error(error);
      }
    }

    loadTeams();
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
      const response = await fetch("/api/players", {
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

      alert("Player created successfully!");

      router.push("/admin/players");
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
          New Player
        </h1>

        <p className="text-gray-400 mt-2">
          Register a new KICKCREW esports player.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-8 space-y-6"
      >

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>

            <label className="block mb-2 font-semibold">
              Player Photo
            </label>

            <ImageUpload
              value={form.profile_photo}
              onChange={(url) =>
                setForm((previous) => ({
                  ...previous,
                  profile_photo: url,
                }))
              }
            />

          </div>

          <div>

            <label className="block mb-2 font-semibold">
              Full Name
            </label>

            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              className="w-full bg-black border border-gray-700 rounded-xl p-3"
            />

          </div>          <div>

            <label className="block mb-2 font-semibold">
              Gamer Tag
            </label>

            <input
              type="text"
              name="gamer_tag"
              value={form.gamer_tag}
              onChange={handleChange}
              className="w-full bg-black border border-gray-700 rounded-xl p-3"
            />

          </div>

          <div>

            <label className="block mb-2 font-semibold">
              Email
            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full bg-black border border-gray-700 rounded-xl p-3"
            />

          </div>

          <div>

            <label className="block mb-2 font-semibold">
              Phone
            </label>

            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full bg-black border border-gray-700 rounded-xl p-3"
            />

          </div>

          <div>

            <label className="block mb-2 font-semibold">
              Team
            </label>

            <select
              name="team_id"
              value={form.team_id}
              onChange={handleChange}
              className="w-full bg-black border border-gray-700 rounded-xl p-3"
            >

              <option value="">
                Select Team
              </option>

              {teams.map((team) => (
                <option
                  key={team.id}
                  value={team.id}
                >
                  {team.team_name}
                </option>
              ))}

            </select>

          </div>

          <div>

            <label className="block mb-2 font-semibold">
              Game
            </label>

            <select
  name="game"
  value={form.game}
  onChange={handleChange}
  className="w-full bg-black border border-gray-700 rounded-xl p-3"
>

  <option value="">
    Select Game
  </option>

  {games.map((game) => (
    <option
      key={game.id}
      value={game.game_name}
    >
      {game.game_name}
    </option>
  ))}

</select>

          </div>

          <div>

            <label className="block mb-2 font-semibold">
              Role
            </label>

            <input
              type="text"
              name="role"
              value={form.role}
              onChange={handleChange}
              placeholder="Example: Duelist"
              className="w-full bg-black border border-gray-700 rounded-xl p-3"
            />

          </div>

          <div>

            <label className="block mb-2 font-semibold">
              Rank
            </label>

            <input
              type="text"
              name="rank"
              value={form.rank}
              onChange={handleChange}
              placeholder="Example: Immortal"
              className="w-full bg-black border border-gray-700 rounded-xl p-3"
            />

          </div>

          <div>

            <label className="block mb-2 font-semibold">
              Country
            </label>

            <input
              type="text"
              name="country"
              value={form.country}
              onChange={handleChange}
              placeholder="Kenya"
              className="w-full bg-black border border-gray-700 rounded-xl p-3"
            />

          </div>

          <div>

            <label className="block mb-2 font-semibold">
              Status
            </label>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full bg-black border border-gray-700 rounded-xl p-3"
            >

              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>

            </select>

          </div>

        </div>

        <div>

          <label className="block mb-2 font-semibold">
            Player Bio
          </label>

          <textarea
            name="bio"
            rows={5}
            value={form.bio}
            onChange={handleChange}
            className="w-full bg-black border border-gray-700 rounded-xl p-3"
          />

        </div>

        <div className="flex gap-4 pt-4">

          <button
            type="submit"
            disabled={loading}
            className="bg-[#D4AF37] text-black px-8 py-3 rounded-xl font-bold hover:bg-yellow-400 transition disabled:opacity-60"
          >
            {loading ? "Saving Player..." : "Save Player"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/admin/players")}
            className="bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-xl transition"
          >
            Cancel
          </button>

        </div>

      </form>

    </div>
  );
}