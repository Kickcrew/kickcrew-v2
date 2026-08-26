"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Player {
  id: number;
  full_name: string;
  gamer_tag: string;
  email: string;
  phone: string;
  team_id: number | null;
  game: string | null;
  role: string | null;
  rank: string | null;
  country: string | null;
  status: string | null;
  bio: string | null;
  profile_photo: string | null;

  teams?: {
    team_name: string;
  };
}

export default function ViewPlayerPage() {
  const params = useParams();
  const id = params.id as string;

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlayer() {
      try {
        const response = await fetch(`/api/players/${id}`);
        const result = await response.json();

        if (result.success) {
          setPlayer(result.player);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadPlayer();
  }, [id]);

  async function deletePlayer() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this player?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/players/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.message);
        return;
      }

      alert("Player deleted successfully.");

      window.location.href = "/admin/players";
    } catch (error) {
      console.error(error);
      alert("Something went wrong while deleting the player.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-xl text-white">
        Loading player...
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex items-center justify-center h-screen text-xl text-red-500">
        Player not found.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">

      {/* HERO BANNER */}

      <div className="relative h-64 rounded-3xl overflow-hidden mb-10">

        <img
          src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600"
          alt="Gaming Banner"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-black/70"></div>

        <div className="absolute inset-0 flex items-end justify-between p-8">

          <div>

            <p className="text-[#D4AF37] uppercase tracking-[6px] text-sm font-semibold">
              KICKCREW ESPORTS
            </p>

            <h1 className="text-5xl font-black mt-2 text-white">
              {player.gamer_tag}
            </h1>

            <p className="text-gray-300 mt-2 text-lg">
              {player.full_name}
            </p>

          </div>

          <div className="flex gap-3">

            <Link
              href="/admin/players"
              className="bg-black/60 hover:bg-black text-white px-6 py-3 rounded-xl border border-white/10 transition"
            >
              ← Back
            </Link>

            <Link
              href={`/admin/players/${player.id}`}
              className="bg-[#D4AF37] hover:bg-yellow-400 text-black px-6 py-3 rounded-xl font-bold transition"
            >
              ✏ Edit Player
            </Link>

          </div>

        </div>

      </div>


      {/* MAIN LAYOUT */}

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">


        {/* LEFT COLUMN */}

        <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-8 shadow-xl">

          <div className="flex flex-col items-center">

            <img
              src={
                player.profile_photo ||
                "https://placehold.co/300x300?text=Player"
              }
              alt={player.gamer_tag}
              className="w-60 h-60 rounded-2xl object-cover border-2 border-[#D4AF37]"
            />

            <h2 className="text-4xl font-black mt-6 text-center text-white">
              {player.gamer_tag}
            </h2>

            <p className="text-gray-400 mt-2 text-lg text-center">
              {player.full_name}
            </p>


            {/* STATUS */}

            <div className="mt-6">

              <span
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold ${
                  player.status === "Active"
                    ? "bg-green-600/20 text-green-400 border border-green-500"
                    : player.status === "Inactive"
                    ? "bg-gray-600/20 text-gray-300 border border-gray-500"
                    : "bg-yellow-600/20 text-yellow-400 border border-yellow-500"
                }`}
              >

                {player.status === "Active"
                  ? "🟢 Active"
                  : player.status === "Inactive"
                  ? "⚪ Inactive"
                  : "🟠 Suspended"}

              </span>

            </div>

          </div>


          {/* DIVIDER */}

          <div className="border-t border-gray-800 my-8"></div>


          {/* QUICK INFORMATION */}

          <div className="space-y-5">

            <div className="flex justify-between gap-4">

              <span className="text-gray-500">
                🆔 Player ID
              </span>

              <span className="font-semibold">
                #{player.id}
              </span>

            </div>


            <div className="flex justify-between gap-4">

              <span className="text-gray-500">
                🛡 Team
              </span>

              <span className="font-semibold text-[#D4AF37] text-right">
                {player.teams?.team_name || "Solo Player"}
              </span>

            </div>


            <div className="flex justify-between gap-4">

              <span className="text-gray-500">
                🌍 Country
              </span>

              <span>
                {player.country || "-"}
              </span>

            </div>


            <div className="flex justify-between gap-4">

              <span className="text-gray-500">
                🎮 Game
              </span>

              <span>
                {player.game || "-"}
              </span>

            </div>


            <div className="flex justify-between gap-4">

              <span className="text-gray-500">
                🏆 Rank
              </span>

              <span>
                {player.rank || "-"}
              </span>

            </div>


            <div className="flex justify-between gap-4">

              <span className="text-gray-500">
                🎯 Role
              </span>

              <span>
                {player.role || "-"}
              </span>

            </div>

          </div>


          {/* DELETE */}

          <button
            onClick={deletePlayer}
            className="w-full mt-10 bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold transition"
          >
            🗑 Delete Player
          </button>

        </div>


        {/* RIGHT COLUMN */}

        <div className="space-y-8">


          {/* INFORMATION CARDS */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">


            {/* COUNTRY */}

            <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-5">

              <p className="text-gray-500 text-sm mb-3">
                🌍 Country
              </p>

              <span className="inline-flex items-center px-4 py-2 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500 font-semibold">
                🌍 {player.country || "Unknown"}
              </span>

            </div>


            {/* GAME */}

            <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-5">

              <p className="text-gray-500 text-sm mb-3">
                🎮 Game
              </p>

              <span
                className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${
                  player.game === "Valorant"
                    ? "bg-red-600 text-white"
                    : player.game === "Counter-Strike 2"
                    ? "bg-orange-600 text-white"
                    : player.game === "Call of Duty Mobile"
                    ? "bg-green-600 text-white"
                    : player.game === "PUBG Mobile"
                    ? "bg-yellow-500 text-black"
                    : player.game === "Mobile Legends"
                    ? "bg-blue-600 text-white"
                    : player.game === "League of Legends"
                    ? "bg-cyan-600 text-white"
                    : player.game === "Dota 2"
                    ? "bg-rose-700 text-white"
                    : player.game === "EA SPORTS FC 26"
                    ? "bg-emerald-600 text-white"
                    : player.game === "eFootball"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-700 text-white"
                }`}
              >
                {player.game || "No Game Assigned"}
              </span>

            </div>


            {/* TEAM */}

            <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-5">

              <p className="text-gray-500 text-sm mb-3">
                🛡 Team
              </p>

              {player.teams?.team_name ? (

                <span className="inline-flex px-4 py-2 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 font-semibold">
                  🛡 {player.teams.team_name}
                </span>

              ) : (

                <span className="inline-flex px-4 py-2 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500 font-semibold">
                  👤 Solo Player
                </span>

              )}

            </div>


            {/* RANK */}

            <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-5">

              <p className="text-gray-500 text-sm mb-3">
                🏆 Rank
              </p>

              <span className="inline-flex px-4 py-2 rounded-full bg-yellow-600/20 text-yellow-400 border border-yellow-500 font-semibold">
                🏆 {player.rank || "Unranked"}
              </span>

            </div>


            {/* ROLE */}

            <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-5">

              <p className="text-gray-500 text-sm mb-3">
                🎯 Role
              </p>

              <span className="inline-flex px-4 py-2 rounded-full bg-purple-600/20 text-purple-400 border border-purple-500 font-semibold">
                🎯 {player.role || "No Role"}
              </span>

            </div>


            {/* PHONE */}

            <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-5">

              <p className="text-gray-500 text-sm">
                📱 Phone
              </p>

              <p className="mt-3 text-lg font-semibold">
                {player.phone || "-"}
              </p>

            </div>

          </div>


          {/* EMAIL */}

          <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6">

            <p className="text-gray-500 text-sm">
              ✉ Email
            </p>

            <p className="mt-3 text-lg font-medium text-[#D4AF37] lowercase break-all">
              {player.email}
            </p>

          </div>


          {/* ABOUT PLAYER */}

          <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6">

            <h2 className="text-2xl font-bold mb-4">
              About Player
            </h2>

            <p className="text-gray-300 leading-8 whitespace-pre-wrap">
              {player.bio || "No biography available."}
            </p>

          </div>


        </div>

      </div>

    </div>
  );
}