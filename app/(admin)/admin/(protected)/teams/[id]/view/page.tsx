"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface TeamPlayer {
  id: number;
  full_name: string;
  gamer_tag: string;
  game: string | null;
  role: string | null;
  rank: string | null;
  status: string | null;
  profile_photo: string | null;
}

interface Team {
  id: number;
  team_name: string;
  game_id: number | null;
  division_id: number | null;
  captain: string | null;
  coach: string | null;
  description: string | null;
  status: string | null;
}

interface Game {
  id: number;
  game_name: string;
}

interface Division {
  id: number;
  division_name: string;
}

export default function ViewTeamPage() {
  const params = useParams();
  const id = params.id as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<TeamPlayer[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeam() {
      try {
        const [
          teamResponse,
          gamesResponse,
          divisionsResponse,
        ] = await Promise.all([
          fetch(`/api/teams/${id}`),
          fetch("/api/games"),
          fetch("/api/divisions"),
        ]);

        const teamResult = await teamResponse.json();
        const gamesResult = await gamesResponse.json();
        const divisionsResult = await divisionsResponse.json();

        if (teamResult.success) {
          setTeam(teamResult.team);
          setPlayers(teamResult.players || []);
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

    loadTeam();
  }, [id]);

  function getGameName(gameId: number | null) {
    if (!gameId) return "No Game";

    const game = games.find(
      (game) => game.id === gameId
    );

    return game?.game_name || "Unknown Game";
  }

  function getDivisionName(divisionId: number | null) {
    if (!divisionId) return "No Division";

    const division = divisions.find(
      (division) => division.id === divisionId
    );

    return division?.division_name || "Unknown Division";
  }

  async function deleteTeam() {
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

      alert("Team deleted successfully.");

      window.location.href = "/admin/teams";
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-xl text-white">
        Loading team...
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-xl text-red-500">
        Team not found.
      </div>
    );
  }

  const gameName = getGameName(team.game_id);
  const divisionName = getDivisionName(team.division_id);

  return (
    <div className="max-w-7xl mx-auto p-8">

      {/* Hero Banner */}

      <div className="relative h-64 rounded-3xl overflow-hidden mb-10">

        <img
          src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600"
          alt="KICKCREW Esports"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-black/75"></div>

        <div className="absolute inset-0 flex items-end p-8">

          <div>

            <p className="text-[#D4AF37] uppercase tracking-[6px] text-sm">
              KICKCREW Esports
            </p>

            <h1 className="text-5xl font-black mt-2">
              {team.team_name}
            </h1>

            <p className="text-gray-300 mt-2 text-lg">
              {gameName} • {divisionName}
            </p>

          </div>

        </div>

      </div>

      {/* Header */}

      <div className="flex items-center justify-between mb-10">

        <div>

          <h2 className="text-4xl font-bold text-white">
            Team Profile
          </h2>

          <p className="text-gray-400 mt-2">
            Complete team information and roster.
          </p>

        </div>

        <div className="flex gap-3">

          <Link
            href="/admin/teams"
            className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-xl font-semibold transition"
          >
            ← Back
          </Link>

          <Link
            href={`/admin/teams/${team.id}`}
            className="bg-[#D4AF37] hover:bg-yellow-400 text-black px-6 py-3 rounded-xl font-bold transition"
          >
            ✏ Edit
          </Link>

        </div>

      </div>

      {/* Main Layout */}

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">

        {/* LEFT COLUMN */}

        <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-8 shadow-xl">

          <div className="flex flex-col items-center">

            <div className="w-48 h-48 rounded-3xl bg-black border-2 border-[#D4AF37] flex items-center justify-center">

              <span className="text-7xl">
                🛡️
              </span>

            </div>

            <h2 className="text-4xl font-black mt-6 text-center">
              {team.team_name}
            </h2>

            <p className="text-gray-400 mt-2 text-lg text-center">
              {gameName}
            </p>

            <p className="text-[#D4AF37] mt-1 text-center font-semibold">
              {divisionName}
            </p>

            {/* Status */}

            <div className="mt-6">

              <span
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold ${
                  team.status === "Inactive"
                    ? "bg-gray-600/20 text-gray-300 border border-gray-500"
                    : "bg-green-600/20 text-green-400 border border-green-500"
                }`}
              >
                {team.status === "Inactive"
                  ? "⚪ Inactive"
                  : "🟢 Active"}
              </span>

            </div>

          </div>

          <div className="w-full border-t border-gray-800 my-8"></div>

          {/* Quick Information */}

          <div className="w-full space-y-5">

            <div className="flex justify-between gap-4">

              <span className="text-gray-500">
                🆔 Team ID
              </span>

              <span className="font-semibold">
                #{team.id}
              </span>

            </div>

            <div className="flex justify-between gap-4">

              <span className="text-gray-500">
                🎮 Game
              </span>

              <span className="font-semibold text-[#D4AF37]">
                {gameName}
              </span>

            </div>

            <div className="flex justify-between gap-4">

              <span className="text-gray-500">
                🏆 Division
              </span>

              <span className="font-semibold text-[#D4AF37]">
                {divisionName}
              </span>

            </div>

            <div className="flex justify-between gap-4">

              <span className="text-gray-500">
                👑 Captain
              </span>

              <span>
                {team.captain || "-"}
              </span>

            </div>

            <div className="flex justify-between gap-4">

              <span className="text-gray-500">
                🎯 Coach
              </span>

              <span>
                {team.coach || "-"}
              </span>

            </div>

            <div className="flex justify-between gap-4">

              <span className="text-gray-500">
                👥 Players
              </span>

              <span className="font-semibold">
                {players.length}
              </span>

            </div>

          </div>

          <button
            onClick={deleteTeam}
            className="w-full mt-10 bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold transition"
          >
            🗑 Delete Team
          </button>

        </div>

        {/* RIGHT COLUMN */}

        <div className="space-y-8">

          {/* Information Cards */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Game */}

            <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-5">

              <p className="text-gray-500 text-sm mb-3">
                🎮 Game
              </p>

              <span className="inline-flex px-4 py-2 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500 font-semibold">
                🎮 {gameName}
              </span>

            </div>

            {/* Division */}

            <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-5">

              <p className="text-gray-500 text-sm mb-3">
                🏆 Division
              </p>

              <span className="inline-flex px-4 py-2 rounded-full bg-yellow-600/20 text-yellow-400 border border-yellow-500 font-semibold">
                🏆 {divisionName}
              </span>

            </div>

            {/* Status */}

            <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-5">

              <p className="text-gray-500 text-sm mb-3">
                📊 Status
              </p>

              <span className="inline-flex px-4 py-2 rounded-full bg-green-600/20 text-green-400 border border-green-500 font-semibold">
                🟢 {team.status || "Active"}
              </span>

            </div>

            {/* Captain */}

            <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-5">

              <p className="text-gray-500 text-sm mb-3">
                👑 Captain
              </p>

              <p className="text-lg font-semibold">
                {team.captain || "No Captain Assigned"}
              </p>

            </div>

            {/* Coach */}

            <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-5">

              <p className="text-gray-500 text-sm mb-3">
                🎯 Coach
              </p>

              <p className="text-lg font-semibold">
                {team.coach || "No Coach Assigned"}
              </p>

            </div>

          </div>

          {/* Description */}

          <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6">

            <h2 className="text-2xl font-bold mb-4">
              About Team
            </h2>

            <p className="text-gray-300 leading-8 whitespace-pre-wrap">
              {team.description || "No team description available."}
            </p>

          </div>

          {/* Team Members */}

          <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6">

            <div className="flex items-center justify-between mb-6">

              <div>

                <h2 className="text-2xl font-bold">
                  Team Members
                </h2>

                <p className="text-gray-500 mt-1">
                  Players currently assigned to this team.
                </p>

              </div>

              <span className="px-4 py-2 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 font-bold">
                {players.length}{" "}
                {players.length === 1 ? "Player" : "Players"}
              </span>

            </div>

            {players.length === 0 ? (

              <div className="border border-dashed border-gray-700 rounded-xl p-8 text-center">

                <p className="text-gray-400">
                  No players are currently assigned to this team.
                </p>

                <p className="text-gray-600 text-sm mt-2">
                  Players without a team are displayed as Solo Players.
                </p>

              </div>

            ) : (

              <div className="space-y-4">

                {players.map((player) => (

                  <div
                    key={player.id}
                    className="flex items-center justify-between gap-4 bg-black border border-gray-800 rounded-xl p-4"
                  >

                    <div className="flex items-center gap-4">

                      <img
                        src={
                          player.profile_photo ||
                          "https://placehold.co/80x80?text=Player"
                        }
                        alt={player.gamer_tag}
                        className="w-14 h-14 rounded-xl object-cover border border-[#D4AF37]/40"
                      />

                      <div>

                        <p className="font-bold text-lg">
                          {player.gamer_tag}
                        </p>

                        <p className="text-gray-500 text-sm">
                          {player.full_name}
                        </p>

                      </div>

                    </div>

                    <div className="hidden sm:flex items-center gap-2">

                      <span className="px-3 py-1 rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/40 text-xs font-semibold">
                        {player.role || "Player"}
                      </span>

                      <span className="px-3 py-1 rounded-full bg-gray-700/50 text-gray-300 border border-gray-600 text-xs font-semibold">
                        {player.status || "Unknown"}
                      </span>

                    </div>

                    <Link
                      href={`/admin/players/${player.id}/view`}
                      className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      View
                    </Link>

                  </div>

                ))}

              </div>

            )}

          </div>

        </div>

      </div>

    </div>
  );
}