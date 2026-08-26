"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Match {
  id: number;
  tournament_id: number;
  game_id: number | null;
  team_a_id: number | null;
  team_b_id: number | null;
  player_a_id: number | null;
  player_b_id: number | null;
  round: string;
  match_number: number;
  best_of: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  winner_id: number | null;
  score_team_a: number | null;
  score_team_b: number | null;
  status: string;
  stream_link: string | null;
  notes: string | null;

  tournaments?: {
    id: number;
    tournament_name: string;
  } | null;

  games?: {
    id: number;
    game_name: string;
  } | null;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadMatches() {
    try {
      setLoading(true);

      const response = await fetch("/api/matches");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load matches."
        );
      }

      setMatches(result.matches ?? []);
    } catch (error) {
      console.error("Failed to load matches:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to load matches."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMatches();
  }, []);

  function getParticipantA(match: Match) {
    if (match.team_a_id !== null) {
      return `Team #${match.team_a_id}`;
    }

    if (match.player_a_id !== null) {
      return `Player #${match.player_a_id}`;
    }

    return "-";
  }

  function getParticipantB(match: Match) {
    if (match.team_b_id !== null) {
      return `Team #${match.team_b_id}`;
    }

    if (match.player_b_id !== null) {
      return `Player #${match.player_b_id}`;
    }

    return "-";
  }

  function getStatusClass(status: string) {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-600/20 text-green-400 border-green-500/40";

      case "live":
        return "bg-red-600/20 text-red-400 border-red-500/40";

      case "cancelled":
        return "bg-gray-600/20 text-gray-400 border-gray-500/40";

      default:
        return "bg-yellow-600/20 text-yellow-400 border-yellow-500/40";
    }
  }

  return (
    <div className="space-y-10">

      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">

        <div>

          <h1 className="text-4xl font-bold">
            Matches
          </h1>

          <p className="text-gray-400 mt-2">
            Manage matches across all KICKCREW tournaments.
          </p>

        </div>

        <Link
          href="/admin/matches/new"
          className="bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition"
        >
          + New Match
        </Link>

      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

        <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6">

          <p className="text-gray-400">
            Total Matches
          </p>

          <p className="text-3xl font-bold mt-2">
            {loading ? "..." : matches.length}
          </p>

        </div>

        <div className="bg-[#111111] border border-green-500/20 rounded-2xl p-6">

          <p className="text-gray-400">
            Completed
          </p>

          <p className="text-3xl font-bold text-green-400 mt-2">
            {loading
              ? "..."
              : matches.filter(
                  (match) =>
                    match.status?.toLowerCase() ===
                    "completed"
                ).length}
          </p>

        </div>

        <div className="bg-[#111111] border border-red-500/20 rounded-2xl p-6">

          <p className="text-gray-400">
            Live
          </p>

          <p className="text-3xl font-bold text-red-400 mt-2">
            {loading
              ? "..."
              : matches.filter(
                  (match) =>
                    match.status?.toLowerCase() ===
                    "live"
                ).length}
          </p>

        </div>

        <div className="bg-[#111111] border border-yellow-500/20 rounded-2xl p-6">

          <p className="text-gray-400">
            Scheduled
          </p>

          <p className="text-3xl font-bold text-yellow-400 mt-2">
            {loading
              ? "..."
              : matches.filter(
                  (match) =>
                    match.status?.toLowerCase() ===
                    "scheduled"
                ).length}
          </p>

        </div>

      </div>

      {/* MATCH TABLE */}

      <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl overflow-hidden">

        {loading ? (

          <div className="p-12 text-center text-gray-400">
            Loading matches...
          </div>

        ) : matches.length === 0 ? (

          <div className="p-12 text-center">

            <div className="text-4xl mb-4">
              ⚔️
            </div>

            <h2 className="text-xl font-bold">
              No matches found
            </h2>

            <p className="text-gray-400 mt-2">
              Tournament matches will appear here once
              they are generated.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1100px]">

              <thead className="bg-black">

                <tr className="text-left">

                  <th className="p-5">
                    Match
                  </th>

                  <th>
                    Tournament
                  </th>

                  <th>
                    Game
                  </th>

                  <th>
                    Round
                  </th>

                  <th>
                    Participant A
                  </th>

                  <th>
                    Participant B
                  </th>

                  <th>
                    Score
                  </th>

                  <th>
                    Status
                  </th>

                  <th className="pr-5">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {matches.map((match) => (

                  <tr
                    key={match.id}
                    className="border-t border-[#222] hover:bg-[#181818] transition"
                  >

                    <td className="p-5 font-semibold">
                      #{match.match_number}
                    </td>

                    <td className="font-semibold">
                      {match.tournaments?.tournament_name ||
                        `Tournament #${match.tournament_id}`}
                    </td>

                    <td className="text-gray-300">
                      {match.games?.game_name ||
                        `Game #${match.game_id ?? "-"}`}
                    </td>

                    <td className="text-gray-300">
                      {match.round || "-"}
                    </td>

                    <td>
                      {getParticipantA(match)}
                    </td>

                    <td>
                      {getParticipantB(match)}
                    </td>

                    <td>

                      {match.score_team_a ??
                        "-"}{" "}
                      -{" "}
                      {match.score_team_b ??
                        "-"}

                    </td>

                    <td>

                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getStatusClass(
                          match.status
                        )}`}
                      >
                        {match.status ||
                          "Scheduled"}
                      </span>

                    </td>

                    <td className="pr-5">

                      <Link
                        href={`/admin/tournaments/${match.tournament_id}/matches/${match.id}`}
                        className="inline-block bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-semibold transition"
                      >
                        View
                      </Link>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}