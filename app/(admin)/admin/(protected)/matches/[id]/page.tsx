"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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
}

interface Player {
  id: number;
  full_name: string;
  gamer_tag: string;
}

interface Team {
  id: number;
  team_name: string;
}

export default function MatchDetailsPage() {
  const params = useParams();

  const tournamentId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const matchId = Array.isArray(params.id)
    ? params.id[1]
    : params.id;

  const [match, setMatch] =
    useState<Match | null>(null);

  const [playerA, setPlayerA] =
    useState<Player | null>(null);

  const [playerB, setPlayerB] =
    useState<Player | null>(null);

  const [teamA, setTeamA] =
    useState<Team | null>(null);

  const [teamB, setTeamB] =
    useState<Team | null>(null);

  const [scoreA, setScoreA] =
    useState("");

  const [scoreB, setScoreB] =
    useState("");

  const [status, setStatus] =
    useState("Scheduled");

  const [winnerId, setWinnerId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  /*
   * LOAD MATCH
   */

  async function loadMatch() {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/matches/${matchId}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to load match."
        );
      }

      const loadedMatch =
        result.match;

      setMatch(loadedMatch);

      setScoreA(
        loadedMatch.score_team_a !== null
          ? String(loadedMatch.score_team_a)
          : ""
      );

      setScoreB(
        loadedMatch.score_team_b !== null
          ? String(loadedMatch.score_team_b)
          : ""
      );

      setStatus(
        loadedMatch.status ||
          "Scheduled"
      );

      setWinnerId(
        loadedMatch.winner_id !== null
          ? String(loadedMatch.winner_id)
          : ""
      );

      /*
       * Load participant information.
       */

      if (loadedMatch.player_a_id) {
        const playerResponse =
          await fetch(
            `/api/players/${loadedMatch.player_a_id}`,
            {
              cache: "no-store",
            }
          );

        if (playerResponse.ok) {
          const playerResult =
            await playerResponse.json();

          setPlayerA(
            playerResult.player ??
              null
          );
        }
      }

      if (loadedMatch.player_b_id) {
        const playerResponse =
          await fetch(
            `/api/players/${loadedMatch.player_b_id}`,
            {
              cache: "no-store",
            }
          );

        if (playerResponse.ok) {
          const playerResult =
            await playerResponse.json();

          setPlayerB(
            playerResult.player ??
              null
          );
        }
      }

      if (loadedMatch.team_a_id) {
        const teamResponse =
          await fetch(
            `/api/teams/${loadedMatch.team_a_id}`,
            {
              cache: "no-store",
            }
          );

        if (teamResponse.ok) {
          const teamResult =
            await teamResponse.json();

          setTeamA(
            teamResult.team ?? null
          );
        }
      }

      if (loadedMatch.team_b_id) {
        const teamResponse =
          await fetch(
            `/api/teams/${loadedMatch.team_b_id}`,
            {
              cache: "no-store",
            }
          );

        if (teamResponse.ok) {
          const teamResult =
            await teamResponse.json();

          setTeamB(
            teamResult.team ?? null
          );
        }
      }
    } catch (error) {
      console.error(
        "Failed to load match:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to load match."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!matchId) return;

    loadMatch();
  }, [matchId]);

  /*
   * PARTICIPANT NAMES
   */

  const participantA =
    playerA?.gamer_tag ||
    playerA?.full_name ||
    (teamA?.team_name
      ? teamA.team_name
      : match?.player_a_id
      ? `Player #${match.player_a_id}`
      : match?.team_a_id
      ? `Team #${match.team_a_id}`
      : "Participant A");

  const participantB =
    playerB?.gamer_tag ||
    playerB?.full_name ||
    (teamB?.team_name
      ? teamB.team_name
      : match?.player_b_id
      ? `Player #${match.player_b_id}`
      : match?.team_b_id
      ? `Team #${match.team_b_id}`
      : "Participant B");

  /*
   * SAVE RESULT
   */

  async function saveResult() {
    if (!match) return;

    if (
      scoreA === "" ||
      scoreB === ""
    ) {
      alert(
        "Please enter both scores."
      );

      return;
    }

    const numericScoreA =
      Number(scoreA);

    const numericScoreB =
      Number(scoreB);

    if (
      Number.isNaN(numericScoreA) ||
      Number.isNaN(numericScoreB)
    ) {
      alert(
        "Scores must be valid numbers."
      );

      return;
    }

    if (
      numericScoreA < 0 ||
      numericScoreB < 0
    ) {
      alert(
        "Scores cannot be negative."
      );

      return;
    }

    if (
      numericScoreA ===
      numericScoreB
    ) {
      alert(
        "A completed match cannot have a tied score."
      );

      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/matches/${match.id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            score_team_a:
              numericScoreA,

            score_team_b:
              numericScoreB,

            winner_id:
              winnerId
                ? Number(winnerId)
                : null,

            status,
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Failed to save match result."
        );
      }

      setMatch(result.match);

      alert(
        "Match result saved successfully."
      );
    } catch (error) {
      console.error(
        "Save result error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save match result."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * LOADING
   */

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-gray-400">
        Loading match...
      </div>
    );
  }

  /*
   * NOT FOUND
   */

  if (!match) {
    return (
      <div className="max-w-5xl mx-auto py-12 space-y-6">

        <h1 className="text-3xl font-bold">
          Match Not Found
        </h1>

        <Link
          href={`/admin/tournaments/${tournamentId}/matches`}
          className="inline-block bg-gray-700 hover:bg-gray-600 px-5 py-3 rounded-xl font-semibold"
        >
          ← Back to Matches
        </Link>

      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">

      {/* HEADER */}

      <div>

        <Link
          href={`/admin/tournaments/${tournamentId}/matches`}
          className="text-gray-400 hover:text-white transition"
        >
          ← Back to Matches
        </Link>

        <div className="mt-5">

          <h1 className="text-4xl font-bold">
            Match #{match.match_number}
          </h1>

          <p className="text-gray-400 mt-2">
            Manage match details and record
            the final result.
          </p>

        </div>

      </div>

      {/* MATCH CARD */}

      <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl overflow-hidden">

        <div className="p-6 border-b border-[#222]">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>

              <p className="text-gray-500 text-sm uppercase tracking-wide">
                {match.round}
              </p>

              <p className="text-gray-400 mt-1">
                {match.best_of ||
                  "BO1"}
              </p>

            </div>

            <span className="inline-flex w-fit px-4 py-2 rounded-full text-sm font-semibold bg-yellow-600/20 text-yellow-400 border border-yellow-500/40">
              {match.status}
            </span>

          </div>

        </div>

        {/* VERSUS */}

        <div className="p-8">

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-8">

            {/* PLAYER A */}

            <div className="bg-black border border-[#D4AF37]/20 rounded-2xl p-7 text-center">

              <p className="text-gray-500 text-sm uppercase tracking-wide">
                Participant A
              </p>

              <h2 className="text-2xl font-bold mt-3">
                {participantA}
              </h2>

              {match.player_a_id && (
                <p className="text-gray-500 text-sm mt-2">
                  Player #{match.player_a_id}
                </p>
              )}

              {match.team_a_id && (
                <p className="text-gray-500 text-sm mt-2">
                  Team #{match.team_a_id}
                </p>
              )}

            </div>

            {/* VS */}

            <div className="text-2xl font-bold text-[#D4AF37]">
              VS
            </div>

            {/* PLAYER B */}

            <div className="bg-black border border-[#D4AF37]/20 rounded-2xl p-7 text-center">

              <p className="text-gray-500 text-sm uppercase tracking-wide">
                Participant B
              </p>

              <h2 className="text-2xl font-bold mt-3">
                {participantB}
              </h2>

              {match.player_b_id && (
                <p className="text-gray-500 text-sm mt-2">
                  Player #{match.player_b_id}
                </p>
              )}

              {match.team_b_id && (
                <p className="text-gray-500 text-sm mt-2">
                  Team #{match.team_b_id}
                </p>
              )}

            </div>

          </div>

        </div>

      </div>

      {/* RESULT FORM */}

      <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-8 space-y-8">

        <div>

          <h2 className="text-2xl font-bold">
            Record Match Result
          </h2>

          <p className="text-gray-400 mt-2">
            Enter the final scores and select
            the winner.
          </p>

        </div>

        {/* SCORES */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>

            <label className="block text-sm text-gray-400 mb-2">
              {participantA} Score
            </label>

            <input
              type="number"
              min="0"
              value={scoreA}
              onChange={(event) =>
                setScoreA(
                  event.target.value
                )
              }
              className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
              placeholder="0"
            />

          </div>

          <div>

            <label className="block text-sm text-gray-400 mb-2">
              {participantB} Score
            </label>

            <input
              type="number"
              min="0"
              value={scoreB}
              onChange={(event) =>
                setScoreB(
                  event.target.value
                )
              }
              className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
              placeholder="0"
            />

          </div>

        </div>

        {/* WINNER */}

        <div>

          <label className="block text-sm text-gray-400 mb-2">
            Winner
          </label>

          <select
            value={winnerId}
            onChange={(event) =>
              setWinnerId(
                event.target.value
              )
            }
            className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
          >

            <option value="">
              Select winner
            </option>

            {match.player_a_id && (
              <option
                value={match.player_a_id}
              >
                {participantA}
              </option>
            )}

            {match.player_b_id && (
              <option
                value={match.player_b_id}
              >
                {participantB}
              </option>
            )}

            {match.team_a_id && (
              <option
                value={match.team_a_id}
              >
                {participantA}
              </option>
            )}

            {match.team_b_id && (
              <option
                value={match.team_b_id}
              >
                {participantB}
              </option>
            )}

          </select>

        </div>

        {/* STATUS */}

        <div>

          <label className="block text-sm text-gray-400 mb-2">
            Match Status
          </label>

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value
              )
            }
            className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
          >

            <option value="Scheduled">
              Scheduled
            </option>

            <option value="Live">
              Live
            </option>

            <option value="Completed">
              Completed
            </option>

            <option value="Cancelled">
              Cancelled
            </option>

          </select>

        </div>

        {/* SAVE */}

        <div className="flex flex-wrap gap-3 pt-4">

          <button
            type="button"
            onClick={saveResult}
            disabled={saving}
            className="bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving
              ? "Saving..."
              : "Save Result"}
          </button>

          <Link
            href={`/admin/tournaments/${tournamentId}/matches`}
            className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-xl font-semibold transition"
          >
            Cancel
          </Link>

        </div>

      </div>

    </div>
  );
}