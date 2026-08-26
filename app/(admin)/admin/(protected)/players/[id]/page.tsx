"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ImageUpload from "@/components/admin/ImageUpload";

interface Team {
  id: number;
  team_name: string;
}
interface Game {
  id: number;
  game_name: string;
}

interface PlayerForm {
  profile_photo: string;
  full_name: string;
  gamer_tag: string;
  email: string;
  phone: string;
  team_id: string;
  game: string;
  role: string;
  rank: string;
  country: string;
  status: string;
  bio: string;
}

export default function EditPlayerPage() {
  const TEAM_GAMES = [
  "Valorant",
  "Counter-Strike 2",
  "Call of Duty Mobile",
  "PUBG Mobile",
  "Mobile Legends",
  "League of Legends",
  "Dota 2",
];
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);

  const [form, setForm] = useState<PlayerForm>({
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
    async function loadData() {
      try {
        const teamResponse = await fetch("/api/teams");
        const teamResult = await teamResponse.json();

        if (teamResult.success) {
          setTeams(teamResult.teams);
        }
        // Load Games
const gameResponse = await fetch("/api/games");
const gameResult = await gameResponse.json();

if (gameResult.success) {
  setGames(gameResult.games);
}

        const playerResponse = await fetch(`/api/players/${id}`);
        const playerResult = await playerResponse.json();

        if (playerResult.success) {
          setForm({
            profile_photo: playerResult.player.profile_photo || "",
            full_name: playerResult.player.full_name || "",
            gamer_tag: playerResult.player.gamer_tag || "",
            email: playerResult.player.email || "",
            phone: playerResult.player.phone || "",
           team_id: String(playerResult.player.team_id || ""),
            game: playerResult.player.game || "",
            role: playerResult.player.role || "",
            rank: playerResult.player.rank || "",
            country: playerResult.player.country || "",
            status: playerResult.player.status || "Active",
            bio: playerResult.player.bio || "",
          });
        }
      } catch (error) {
        console.error(error);
      }

      setLoading(false);
    }

    loadData();
  }, [id]);

  function handleChange(
  e: React.ChangeEvent<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >
) {
  const { name, value } = e.target;

  setForm((previous) => {
    const updated = {
      ...previous,
      [name]: value,
    };

    // If a solo game is selected, remove the team
    if (name === "game" && !TEAM_GAMES.includes(value)) {
      updated.team_id = "";
    }

    return updated;
  });
}

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);

    try {
      const response = await fetch(`/api/players/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.message);
        setSaving(false);
        return;
      }

      alert("Player updated successfully!");

      router.push("/admin/players");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="text-white text-xl">
        Loading player...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">

      <div className="mb-10">
        <h1 className="text-4xl font-bold">
          Edit Player
        </h1>

        <p className="text-gray-400 mt-2">
          Update KICKCREW player information.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-8"
      >

        <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-8">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Player Photo */}
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

            {/* Gamer Tag */}
            <div>
              <label className="block mb-2 font-semibold">
                Gamer Tag
              </label>

              <input
                type="text"
                name="gamer_tag"
                value={form.gamer_tag}
                onChange={handleChange}
                className="w-full bg-black border border-gray-700 rounded-xl p-3 focus:border-[#D4AF37] outline-none"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block mb-2 font-semibold">
                Full Name
              </label>

              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                className="w-full bg-black border border-gray-700 rounded-xl p-3 focus:border-[#D4AF37] outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block mb-2 font-semibold">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full bg-black border border-gray-700 rounded-xl p-3 focus:border-[#D4AF37] outline-none"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block mb-2 font-semibold">
                Phone
              </label>

              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full bg-black border border-gray-700 rounded-xl p-3 focus:border-[#D4AF37] outline-none"
              />
            </div>

            {/* Team */}
{TEAM_GAMES.includes(form.game) && (
  <div>
    <label className="block mb-2 font-semibold">
      Team
    </label>

    <select
      name="team_id"
      value={form.team_id}
      onChange={handleChange}
      className="w-full bg-black border border-gray-700 rounded-xl p-3 focus:border-[#D4AF37] outline-none"
    >
      <option value="">Select Team</option>

      {teams.map((team) => (
        <option
          key={team.id}
          value={String(team.id)}
        >
          {team.team_name}
        </option>
      ))}
    </select>
  </div>
)}

            {/* Game */}
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

                       {/* Role */}
            <div>
              <label className="block mb-2 font-semibold">
                Role
              </label>

              <input
                type="text"
                name="role"
                value={form.role || ""}
                onChange={handleChange}
                placeholder="e.g. Captain, Support, Sniper"
                className="w-full bg-black border border-gray-700 rounded-xl p-3 focus:border-[#D4AF37] outline-none"
              />
            </div>

            {/* Rank */}
            <div>
              <label className="block mb-2 font-semibold">
                Rank
              </label>

              <input
                type="text"
                name="rank"
                value={form.rank || ""}
                onChange={handleChange}
                placeholder="e.g. Division 1"
                className="w-full bg-black border border-gray-700 rounded-xl p-3 focus:border-[#D4AF37] outline-none"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block mb-2 font-semibold">
                Country
              </label>

              <input
                type="text"
                name="country"
                value={form.country || ""}
                onChange={handleChange}
                placeholder="e.g. Kenya"
                className="w-full bg-black border border-gray-700 rounded-xl p-3 focus:border-[#D4AF37] outline-none"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block mb-2 font-semibold">
                Status
              </label>

              <select
                name="status"
                value={form.status || "Active"}
                onChange={handleChange}
                className="w-full bg-black border border-gray-700 rounded-xl p-3 focus:border-[#D4AF37] outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Bio */}

          <div className="mt-8">
            <label className="block mb-2 font-semibold">
              Player Bio
            </label>

            <textarea
              name="bio"
              rows={5}
              value={form.bio}
              onChange={handleChange}
              className="w-full bg-black border border-gray-700 rounded-xl p-3 focus:border-[#D4AF37] outline-none"
            />
          </div>

          {/* Buttons */}

          <div className="mt-8 flex gap-4">

            <button
              type="submit"
              disabled={saving}
              className="bg-[#D4AF37] text-black px-8 py-3 rounded-xl font-bold hover:bg-yellow-400 transition disabled:opacity-60"
            >
              {saving ? "Updating Player..." : "Update Player"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/players")}
              className="bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-xl transition"
            >
              Cancel
            </button>

          </div>

        </div>

      </form>

    </div>
  );
}