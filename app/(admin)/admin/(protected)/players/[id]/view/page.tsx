"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Player {
  id: number;
  full_name: string;
  gamer_tag: string;
  email: string;
  phone: string | null;

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
  } | null;
}

function getStatusBadge(status: string | null) {
  if (status === "Active") {
    return "bg-green-600/20 text-green-400 border-green-500";
  }

  if (status === "Inactive") {
    return "bg-gray-600/20 text-gray-300 border-gray-500";
  }

  return "bg-yellow-600/20 text-yellow-400 border-yellow-500";
}

function getStatusText(status: string | null) {
  if (status === "Active") return "🟢 Active";
  if (status === "Inactive") return "⚪ Inactive";

  return "🟠 Suspended";
}

function getGameStyle(game: string | null) {
  switch (game) {
    case "Valorant":
      return "bg-red-600 text-white";

    case "Counter-Strike 2":
      return "bg-orange-600 text-white";

    case "Call of Duty Mobile":
      return "bg-green-600 text-white";

    case "PUBG Mobile":
      return "bg-yellow-500 text-black";

    case "Mobile Legends":
      return "bg-blue-600 text-white";

    case "League of Legends":
      return "bg-cyan-600 text-white";

    case "Dota 2":
      return "bg-rose-700 text-white";

    case "EA SPORTS FC 26":
      return "bg-emerald-600 text-white";

    case "eFootball":
      return "bg-indigo-600 text-white";

    default:
      return "bg-gray-700 text-white";
  }
}

export default function ViewPlayerPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadPlayer() {
    try {
      const response = await fetch(`/api/players/${id}`, {
        cache: "no-store",
      });

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

  useEffect(() => {
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

      router.push("/admin/players");

    } catch (error) {
      console.error(error);

      alert("Failed to delete player.");
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white text-xl">
        Loading player...
      </div>
    );
  }


  if (!player) {
    return (
      <div className="flex items-center justify-center h-screen text-red-400 text-xl">
        Player not found.
      </div>
    );
  }


  return (
    <div className="space-y-8">

      {/* Header */}

      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-4xl font-black text-white">
            {player.gamer_tag}
          </h1>

          <p className="text-gray-400 mt-2">
            {player.full_name}
          </p>
        </div>


        <div className="flex gap-3">

          <Link
            href="/admin/players"
            className="px-5 py-3 rounded-xl bg-gray-800 hover:bg-gray-700"
          >
            ← Back
          </Link>


          <Link
            href={`/admin/players/${player.id}`}
            className="px-5 py-3 rounded-xl bg-[#D4AF37] text-black font-bold"
          >
            Edit
          </Link>

        </div>

      </div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">


        {/* Profile */}

        <div className="bg-[#111] border border-[#D4AF37]/20 rounded-2xl p-8">

          <img
            src={
              player.profile_photo ||
              "https://placehold.co/300x300?text=Player"
            }
            alt={player.gamer_tag}
            className="w-56 h-56 mx-auto rounded-2xl object-cover border-2 border-[#D4AF37]"
          />


          <h2 className="text-3xl text-center font-black mt-6">
            {player.gamer_tag}
          </h2>


          <p className="text-center text-gray-400 mt-2">
            {player.full_name}
          </p>


          <div className="flex justify-center mt-5">

            <span
              className={`px-4 py-2 rounded-full border ${getStatusBadge(
                player.status
              )}`}
            >
              {getStatusText(player.status)}
            </span>

          </div>


          <button
            onClick={deletePlayer}
            className="w-full mt-8 bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold"
          >
            🗑 Delete Player
          </button>


        </div>




        {/* Details */}

        <div className="lg:col-span-2 space-y-6">


          <div className="grid md:grid-cols-2 gap-5">


            <InfoCard
              title="🎮 Game"
              value={player.game || "-"}
              badge
              badgeClass={getGameStyle(player.game)}
            />


            <InfoCard
              title="🛡 Team"
              value={
                player.teams?.team_name ||
                "Solo Player"
              }
            />


            <InfoCard
              title="🌍 Country"
              value={player.country || "-"}
            />


            <InfoCard
              title="🏆 Rank"
              value={player.rank || "Unranked"}
            />


            <InfoCard
              title="🎯 Role"
              value={player.role || "-"}
            />


            <InfoCard
              title="📱 Phone"
              value={player.phone || "-"}
            />

          </div>




          <div className="bg-[#111] border border-[#D4AF37]/20 rounded-2xl p-6">

            <h2 className="text-xl font-bold mb-4">
              Email
            </h2>

            <p className="text-[#D4AF37] break-all">
              {player.email}
            </p>

          </div>




          <div className="bg-[#111] border border-[#D4AF37]/20 rounded-2xl p-6">

            <h2 className="text-xl font-bold mb-4">
              About Player
            </h2>

            <p className="text-gray-300 whitespace-pre-wrap">
              {player.bio || "No biography available."}
            </p>

          </div>


        </div>


      </div>


    </div>
  );
}



function InfoCard({
  title,
  value,
  badge,
  badgeClass,
}: {
  title: string;
  value: string;
  badge?: boolean;
  badgeClass?: string;
}) {

  return (
    <div className="bg-[#111] border border-[#D4AF37]/20 rounded-2xl p-5">

      <p className="text-gray-500 text-sm mb-3">
        {title}
      </p>


      {badge ? (

        <span
          className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${
            badgeClass || ""
          }`}
        >
          {value}
        </span>

      ) : (

        <p className="font-semibold">
          {value}
        </p>

      )}

    </div>
  );
}