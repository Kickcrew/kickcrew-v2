"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Game {
  id: number;
  game_name: string;
  category: string;
  active: boolean;
}

interface Team {
  team_name: string;
}

interface Player {
  id: number;
  full_name: string;
  gamer_tag: string;
  game: string | null;
  rank: string | null;
  country: string | null;
  status: string | null;

  teams?: Team | Team[] | null;
}

export default function GameDetailsPage() {
  const params = useParams();

  const gameId = params.id as string;

  const [game, setGame] = useState<Game | null>(null);
  const [gamePlayers, setGamePlayers] = useState<Player[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get team name safely
  function getTeamName(player: Player): string | null {
    if (!player.teams) {
      return null;
    }

    if (Array.isArray(player.teams)) {
      return player.teams[0]?.team_name ?? null;
    }

    return player.teams.team_name ?? null;
  }

  useEffect(() => {
    async function loadGameDetails() {
      try {
        setLoading(true);
        setError("");

        // Load game and players at the same time
        const [gameResponse, playersResponse] = await Promise.all([
          fetch(`/api/games/${gameId}`),
          fetch("/api/players"),
        ]);

        if (!gameResponse.ok) {
          throw new Error("Failed to load game.");
        }

        if (!playersResponse.ok) {
          throw new Error("Failed to load players.");
        }

        const gameResult = await gameResponse.json();
        const playersResult = await playersResponse.json();

        if (!gameResult.success) {
          throw new Error(
            gameResult.message || "Failed to load game."
          );
        }

        if (!playersResult.success) {
          throw new Error(
            playersResult.message || "Failed to load players."
          );
        }

        const selectedGame: Game = gameResult.game;

        setGame(selectedGame);

        /*
         * IMPORTANT:
         *
         * players.game contains the game name,
         * for example:
         *
         * "Call of Duty Mobile"
         *
         * So we compare it with game.game_name,
         * NOT the numeric game ID.
         */
        const matchingPlayers = (playersResult.players || []).filter(
          (player: Player) =>
            player.game?.trim().toLowerCase() ===
            selectedGame.game_name.trim().toLowerCase()
        );

        setGamePlayers(matchingPlayers);
      } catch (err) {
        console.error("Game details error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    if (gameId) {
      loadGameDetails();
    }
  }, [gameId]);

  // Loading
  if (loading) {
    return (
      <div className="p-10 text-gray-400">
        Loading game...
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="p-10">
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
          <p className="text-red-400">
            {error}
          </p>

          <Link
            href="/admin/games"
            className="inline-block mt-4 bg-[#D4AF37] text-black px-5 py-2 rounded-lg font-semibold"
          >
            ← Back to Games
          </Link>
        </div>
      </div>
    );
  }

  // Game not found
  if (!game) {
    return (
      <div className="p-10">
        <p className="text-gray-400">
          Game not found.
        </p>

        <Link
          href="/admin/games"
          className="inline-block mt-4 bg-[#D4AF37] text-black px-5 py-2 rounded-lg font-semibold"
        >
          ← Back to Games
        </Link>
      </div>
    );
  }

  // =========================
  // STATISTICS
  // =========================

  const registeredPlayers = gamePlayers.length;

  const activePlayers = gamePlayers.filter(
    (player) => player.status === "Active"
  ).length;

  const teams = new Set(
    gamePlayers
      .map((player) => getTeamName(player))
      .filter(
        (teamName): teamName is string =>
          Boolean(teamName)
      )
  );

  const teamsRepresented = teams.size;

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* =========================
          HEADER
      ========================= */}

      <div className="flex items-start justify-between gap-6">

        <div>

          <p className="text-[#D4AF37] text-sm font-bold tracking-[0.3em] uppercase">
            Game Details
          </p>

          <h1 className="text-4xl md:text-5xl font-bold mt-2">
            {game.game_name}
          </h1>

          <p className="text-gray-400 mt-2">
            View players and teams registered under this game.
          </p>

        </div>

        <Link
          href="/admin/games"
          className="bg-[#D4AF37] text-black px-5 py-3 rounded-xl font-bold hover:bg-yellow-400 transition"
        >
          ← Back
        </Link>

      </div>

      {/* =========================
          GAME INFORMATION
      ========================= */}

      <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl overflow-hidden">

        <div className="p-6 border-b border-[#222]">

          <h2 className="text-xl font-bold">
            Game Information
          </h2>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">

          <div>

            <p className="text-gray-500 text-sm">
              Game
            </p>

            <p className="font-semibold mt-1">
              {game.game_name}
            </p>

          </div>

          <div>

            <p className="text-gray-500 text-sm">
              Category
            </p>

            <p className="font-semibold mt-1">
              {game.category || "-"}
            </p>

          </div>

          <div>

            <p className="text-gray-500 text-sm">
              Status
            </p>

            <span
              className={`inline-flex mt-2 px-3 py-1 rounded-full text-sm font-semibold ${
                game.active
                  ? "bg-green-600/20 text-green-400 border border-green-500/40"
                  : "bg-red-600/20 text-red-400 border border-red-500/40"
              }`}
            >
              {game.active ? "Active" : "Inactive"}
            </span>

          </div>

        </div>

      </div>

      {/* =========================
          STATISTICS
      ========================= */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6">

          <p className="text-gray-400 text-sm">
            Registered Players
          </p>

          <h2 className="text-4xl font-bold mt-2 text-[#D4AF37]">
            {registeredPlayers}
          </h2>

        </div>

        <div className="bg-[#111111] border border-green-500/20 rounded-2xl p-6">

          <p className="text-gray-400 text-sm">
            Active Players
          </p>

          <h2 className="text-4xl font-bold mt-2 text-green-400">
            {activePlayers}
          </h2>

        </div>

        <div className="bg-[#111111] border border-blue-500/20 rounded-2xl p-6">

          <p className="text-gray-400 text-sm">
            Teams Represented
          </p>

          <h2 className="text-4xl font-bold mt-2 text-blue-400">
            {teamsRepresented}
          </h2>

        </div>

      </div>

      {/* =========================
          REGISTERED PLAYERS
      ========================= */}

      <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl overflow-hidden">

        <div className="p-6 border-b border-[#222]">

          <h2 className="text-xl font-bold">
            Registered Players
          </h2>

          <p className="text-gray-400 text-sm mt-1">
            Players currently associated with{" "}
            {game.game_name}.
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-black">

              <tr className="text-left">

                <th className="p-5">
                  Gamer Tag
                </th>

                <th>
                  Full Name
                </th>

                <th>
                  Team
                </th>

                <th>
                  Rank
                </th>

                <th>
                  Country
                </th>

                <th>
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {gamePlayers.length === 0 && (

                <tr>

                  <td
                    colSpan={6}
                    className="p-10 text-center text-gray-400"
                  >
                    No players are currently registered
                    under this game.
                  </td>

                </tr>

              )}

              {gamePlayers.map((player) => {

                const team = getTeamName(player);

                return (

                  <tr
                    key={player.id}
                    className="border-t border-[#222] hover:bg-[#181818] transition"
                  >

                    {/* Gamer Tag */}

                    <td className="p-5">

                      <span className="font-semibold text-[#D4AF37]">
                        {player.gamer_tag}
                      </span>

                    </td>

                    {/* Full Name */}

                    <td>
                      {player.full_name}
                    </td>

                    {/* Team */}

                    <td>

                      {team ? (

                        <span className="text-white">
                          {team}
                        </span>

                      ) : (

                        <span className="text-blue-400 font-medium">
                          Solo Player
                        </span>

                      )}

                    </td>

                    {/* Rank */}

                    <td>

                      {player.rank &&
                      player.rank !== "null"
                        ? player.rank
                        : "-"}

                    </td>

                    {/* Country */}

                    <td>

                      {player.country &&
                      player.country !== "null"
                        ? player.country
                        : "-"}

                    </td>

                    {/* Status */}

                    <td>

                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                          player.status === "Active"
                            ? "bg-green-600/20 text-green-400 border border-green-500/40"
                            : player.status === "Inactive"
                            ? "bg-gray-700/20 text-gray-300 border border-gray-500/40"
                            : "bg-yellow-600/20 text-yellow-400 border border-yellow-500/40"
                        }`}
                      >

                        {player.status === "Active"
                          ? "🟢 Active"
                          : player.status === "Inactive"
                          ? "⚪ Inactive"
                          : "🟠 Suspended"}

                      </span>

                    </td>

                  </tr>

                );

              })}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}