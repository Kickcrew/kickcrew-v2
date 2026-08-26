"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

interface Tournament {
  id: number;
  tournament_name: string;
  tournament_type: string | null;
  status: string | null;
}

interface Match {
  id: number;
  tournament_id: number;

  game_id: number | null;

  team_a_id: number | null;
  team_b_id: number | null;

  player_a_id: number | null;
  player_b_id: number | null;

  round: string | null;
  match_number: number | null;

  status: string | null;

  winner_team_id: number | null;
  winner_player_id: number | null;

  score_team_a: number | null;
  score_team_b: number | null;

  penalty_score_a?: number | null;
  penalty_score_b?: number | null;
}

interface Team {
  id: number;
  team_name: string;
}

interface Player {
  id: number;
  full_name: string | null;
  gamer_tag: string | null;
}

const ROUND_ORDER = [
  "Round of 32",
  "Round of 16",
  "Quarterfinals",
  "Semifinals",
  "3rd Place",
  "Final",
];

export default function KnockoutPage() {
  const params = useParams();

  const tournamentId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [tournament, setTournament] =
    useState<Tournament | null>(null);

  const [matches, setMatches] =
    useState<Match[]>([]);

  const [teams, setTeams] =
    useState<Team[]>([]);

  const [players, setPlayers] =
    useState<Player[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * --------------------------------------------------
   * LOAD DATA
   * --------------------------------------------------
   */

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      /*
       * TOURNAMENT
       */

      const tournamentResponse = await fetch(
        `/api/tournaments/${tournamentId}`
      );

      const tournamentResult =
        await tournamentResponse.json();

      if (
        !tournamentResponse.ok ||
        !tournamentResult.success
      ) {
        throw new Error(
          tournamentResult.message ||
            "Failed to load tournament."
        );
      }

      setTournament(
        tournamentResult.tournament
      );

      /*
       * MATCHES
       */

      const matchesResponse = await fetch(
        `/api/matches?tournament_id=${tournamentId}`
      );

      const matchesResult =
        await matchesResponse.json();

      if (
        !matchesResponse.ok ||
        !matchesResult.success
      ) {
        throw new Error(
          matchesResult.message ||
            "Failed to load tournament matches."
        );
      }

      setMatches(
        matchesResult.matches ?? []
      );

      /*
       * TEAMS
       */

      const teamsResponse =
        await fetch("/api/teams");

      if (teamsResponse.ok) {
        const teamsResult =
          await teamsResponse.json();

        if (teamsResult.success) {
          setTeams(
            teamsResult.teams ?? []
          );
        }
      }

      /*
       * PLAYERS
       */

      const playersResponse =
        await fetch("/api/players");

      if (playersResponse.ok) {
        const playersResult =
          await playersResponse.json();
          
        
          if (playersResult.success) {
          setPlayers(
            playersResult.players ?? []
          );
        }
      }
    } catch (error) {
      console.error(
        "Knockout page loading error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load knockout bracket."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!tournamentId) return;

    loadData();
  }, [tournamentId]);

  /*
   * --------------------------------------------------
   * IDENTIFY KNOCKOUT MATCHES
   * --------------------------------------------------
   */

  const knockoutMatches = useMemo(() => {
    return matches.filter((match) => {
      const round =
        match.round
          ?.toLowerCase()
          .trim() || "";

     return (
  /^round\s+of\s+\d+$/.test(round) ||
  round === "quarterfinal" ||
  round === "quarterfinals" ||
  round === "semifinal" ||
  round === "semifinals" ||
  round === "3rd place" ||
  round === "third place" ||
  round === "third-place" ||
  round === "final" ||
  round.includes("knockout")
);
    });
  }, [matches]);

  /*
   * --------------------------------------------------
   * GET MATCHES FOR ROUND
   * --------------------------------------------------
   */

  function getRoundMatches(
    round: string
  ) {
    return knockoutMatches
      .filter(
        (match) =>
          match.round?.toLowerCase() ===
          round.toLowerCase()
      )
      .sort(
        (a, b) =>
          (a.match_number ?? 0) -
          (b.match_number ?? 0)
      );
  }

  /*
   * --------------------------------------------------
   * PARTICIPANT NAME
   * --------------------------------------------------
   */

  function getParticipantName(
  match: Match,
  side: "A" | "B"
) {
  const teamId =
    side === "A"
      ? match.team_a_id
      : match.team_b_id;

  const playerId =
    side === "A"
      ? match.player_a_id
      : match.player_b_id;

  /*
   * TEAM
   */
  if (teamId !== null) {
    const team = teams.find(
      (item) =>
        Number(item.id) === Number(teamId)
    );

    return (
      team?.team_name ||
      `Team #${teamId}`
    );
  }

  /*
   * PLAYER
   */
  if (playerId !== null) {
    const player = players.find(
      (item) =>
        Number(item.id) === Number(playerId)
    );

    return (
  player?.gamer_tag ||
  player?.full_name ||
  `Player #${playerId}`
);
  }

  return "TBD";
}
  /*
   * --------------------------------------------------
   * GET WINNER
   * --------------------------------------------------
   */

  function getWinner(match: Match) {
    if (
      match.winner_team_id !== null
    ) {
      const team = teams.find(
        (item) =>
          Number(item.id) ===
          Number(match.winner_team_id)
      );

      return (
        team?.team_name ||
        `Team #${match.winner_team_id}`
      );
    }

    if (
      match.winner_player_id !== null
    ) {
      const player = players.find(
        (item) =>
          Number(item.id) ===
          Number(match.winner_player_id)
      );

      return (
        player?.gamer_tag ||
player?.full_name ||
        `Player #${match.winner_player_id}`
      );
    }

    return null;
  }

  /*
   * --------------------------------------------------
   * STATUS
   * --------------------------------------------------
   */

  function getStatusClass(
    status: string | null
  ) {
    const value =
      status?.toLowerCase() || "";

    if (value === "completed") {
      return "text-green-400";
    }

    if (value === "scheduled") {
      return "text-blue-400";
    }

    if (value === "pending") {
      return "text-yellow-500";
    }

    return "text-gray-500";
  }

  /*
   * --------------------------------------------------
   * SCORE
   * --------------------------------------------------
   */

  function getScore(
    match: Match,
    side: "A" | "B"
  ) {
    const score =
      side === "A"
        ? match.score_team_a
        : match.score_team_b;

    return score === null
      ? "-"
      : score;
  }

  /*
   * --------------------------------------------------
   * PENALTIES
   * --------------------------------------------------
   */

  function hasPenaltyData(match: Match) {
    return (
      match.penalty_score_a !==
        undefined ||
      match.penalty_score_b !==
        undefined
    );
  }

  /*
   * --------------------------------------------------
   * CHAMPION
   * --------------------------------------------------
   */

  const finalMatches =
    getRoundMatches("Final");

  const finalMatch =
    finalMatches[0] ?? null;

  const champion =
    finalMatch
      ? getWinner(finalMatch)
      : null;

  /*
   * --------------------------------------------------
   * TOTAL PROGRESS
   * --------------------------------------------------
   */

  const completedKnockoutMatches =
    knockoutMatches.filter(
      (match) =>
        match.status?.toLowerCase() ===
        "completed"
    ).length;

  const knockoutProgress =
    knockoutMatches.length > 0
      ? Math.round(
          (completedKnockoutMatches /
            knockoutMatches.length) *
            100
        )
      : 0;

  /*
   * --------------------------------------------------
   * LOADING
   * --------------------------------------------------
   */

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">
            🏆
          </div>

          <p className="text-gray-400">
            Loading knockout bracket...
          </p>
        </div>
      </div>
    );
  }

  /*
   * --------------------------------------------------
   * ERROR
   * --------------------------------------------------
   */

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-5xl mx-auto">

          <h1 className="text-2xl font-bold text-red-400">
            Knockout bracket could not be loaded
          </h1>

          <p className="text-gray-400 mt-2">
            {error ||
              "Tournament not found."}
          </p>

          <Link
            href={`/admin/tournaments/${tournamentId}`}
            className="inline-block mt-6 bg-black border border-gray-700 hover:border-[#D4AF37] px-5 py-3 rounded-xl font-semibold transition"
          >
            ← Back to Tournament
          </Link>

        </div>
      </div>
    );
  }

  /*
   * --------------------------------------------------
   * PAGE
   * --------------------------------------------------
   */

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-8">

      <div className="max-w-[1500px] mx-auto space-y-8">

        {/* HEADER */}

        <div>

          <Link
            href={`/admin/tournaments/${tournamentId}`}
            className="text-gray-400 hover:text-white transition"
          >
            ← Back to Tournament
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mt-5">

            <div>

              <p className="text-[#D4AF37] uppercase tracking-[0.25em] text-xs font-bold">
                Knockout Stage
              </p>

              <h1 className="text-4xl md:text-5xl font-black mt-2">
                {tournament.tournament_name}
              </h1>

              <p className="text-gray-400 mt-2">
                Elimination bracket and live knockout progression.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <Link
                href={`/admin/tournaments/${tournamentId}/matches`}
                className="bg-black border border-gray-700 hover:border-[#D4AF37] px-5 py-3 rounded-xl font-semibold transition"
              >
                Manage Matches
              </Link>

              <Link
                href={`/admin/tournaments/${tournamentId}/standings`}
                className="bg-black border border-gray-700 hover:border-[#D4AF37] px-5 py-3 rounded-xl font-semibold transition"
              >
                Round Robin Standings
              </Link>

            </div>

          </div>

        </div>

        {/* CHAMPION */}

        {champion && (
          <div className="relative overflow-hidden bg-[#111111] border border-[#D4AF37]/50 rounded-2xl p-8">

            <div className="absolute inset-0 bg-[#D4AF37]/5" />

            <div className="relative text-center">

              <div className="text-6xl">
                🏆
              </div>

              <p className="text-[#D4AF37] uppercase tracking-[0.35em] text-xs font-bold mt-4">
                Tournament Champion
              </p>

              <h2 className="text-3xl md:text-5xl font-black mt-2">
                {champion}
              </h2>

              <p className="text-gray-400 mt-2">
                The Final has been completed.
              </p>

            </div>

          </div>
        )}

        {/* SUMMARY */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6">

            <p className="text-gray-500 text-sm">
              Knockout Matches
            </p>

            <p className="text-3xl font-black mt-2">
              {knockoutMatches.length}
            </p>

          </div>

          <div className="bg-[#111111] border border-green-500/20 rounded-2xl p-6">

            <p className="text-gray-500 text-sm">
              Completed
            </p>

            <p className="text-3xl font-black text-green-400 mt-2">
              {completedKnockoutMatches}
            </p>

          </div>

          <div className="bg-[#111111] border border-purple-500/20 rounded-2xl p-6">

            <p className="text-gray-500 text-sm">
              Knockout Progress
            </p>

            <p className="text-3xl font-black text-purple-400 mt-2">
              {knockoutProgress}%
            </p>

          </div>

        </div>

        {/* PROGRESS BAR */}

        {knockoutMatches.length > 0 && (
          <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6">

            <div className="flex justify-between items-center">

              <div>

                <h2 className="text-xl font-bold">
                  Knockout Progress
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  {completedKnockoutMatches} of{" "}
                  {knockoutMatches.length} matches completed
                </p>

              </div>

              <span className="text-[#D4AF37] font-bold">
                {knockoutProgress}%
              </span>

            </div>

            <div className="h-3 bg-black rounded-full overflow-hidden mt-5">

              <div
                className="h-full bg-[#D4AF37] transition-all duration-500"
                style={{
                  width: `${knockoutProgress}%`,
                }}
              />

            </div>

          </div>
        )}

        {/* NO KNOCKOUT MATCHES */}

        {knockoutMatches.length === 0 && (
          <div className="bg-[#111111] border border-gray-800 rounded-2xl p-10 text-center">

            <div className="text-5xl">
              ⚔️
            </div>

            <h2 className="text-2xl font-bold mt-5">
              Knockout Stage Not Generated
            </h2>

            <p className="text-gray-400 max-w-xl mx-auto mt-3">
              There are currently no knockout matches for this tournament.
              Once the knockout stage is generated, the bracket will appear here.
            </p>

            <Link
              href={`/admin/tournaments/${tournamentId}/fixtures`}
              className="inline-block mt-6 bg-[#D4AF37] text-black hover:bg-yellow-400 px-5 py-3 rounded-xl font-bold transition"
            >
              Open Fixtures
            </Link>

          </div>
        )}

        {/* BRACKET */}

        {knockoutMatches.length > 0 && (
          <div className="bg-[#080808] border border-[#D4AF37]/20 rounded-2xl p-5 md:p-8 overflow-x-auto">

            <div className="min-w-[1450px]">

              <div className="grid grid-cols-6 gap-6">

                {ROUND_ORDER.map(
                  (round) => {

                    const roundMatches =
                      getRoundMatches(
                        round
                      );

                    return (
                      <div
                        key={round}
                        className="min-w-0"
                      >

                        {/* ROUND TITLE */}

                        <div className="pb-4 mb-5 border-b border-[#D4AF37]/30">

                          <h2 className="font-black text-lg">
                            {round}
                          </h2>

                          <p className="text-gray-600 text-xs mt-1">
                            {roundMatches.length}{" "}
                            {roundMatches.length ===
                            1
                              ? "match"
                              : "matches"}
                          </p>

                        </div>

                        {/* ROUND MATCHES */}

                        <div className="space-y-6">

                          {roundMatches.length ===
                          0 ? (
                            <div className="border border-dashed border-gray-800 rounded-xl p-5 text-center">

                              <p className="text-gray-600 text-sm">
                                Awaiting matches
                              </p>

                            </div>
                          ) : (
                            roundMatches.map(
                              (match) => {

                                const participantA =
                                  getParticipantName(
                                    match,
                                    "A"
                                  );

                                const participantB =
                                  getParticipantName(
                                    match,
                                    "B"
                                  );

                                const winner =
                                  getWinner(
                                    match
                                  );

                                const completed =
                                  match.status?.toLowerCase() ===
                                  "completed";

                                const aWon =
                                  winner !==
                                    null &&
                                  winner ===
                                    participantA;

                                const bWon =
                                  winner !==
                                    null &&
                                  winner ===
                                    participantB;

                                return (
                                  <div
                                    key={
                                      match.id
                                    }
                                    className={`relative bg-[#111111] rounded-xl overflow-hidden border ${
                                      completed
                                        ? "border-green-500/20"
                                        : "border-gray-800"
                                    }`}
                                  >

                                    {/* MATCH HEADER */}

                                    <div className="flex justify-between items-center px-3 py-2 bg-black border-b border-gray-800">

                                      <span className="text-[10px] uppercase tracking-wider text-gray-600">
                                        Match{" "}
                                        {match.match_number ??
                                          match.id}
                                      </span>

                                      <span
                                        className={`text-[10px] uppercase font-bold ${getStatusClass(
                                          match.status
                                        )}`}
                                      >
                                        {match.status ||
                                          "Pending"}
                                      </span>

                                    </div>

                                    {/* PLAYER / TEAM A */}

                                    <div
                                      className={`px-3 py-3 flex items-center justify-between ${
                                        aWon
                                          ? "bg-[#D4AF37]/10"
                                          : ""
                                      }`}
                                    >

                                      <div className="flex items-center gap-2 min-w-0">

                                        {aWon && (
                                          <span className="text-sm">
                                            🏆
                                          </span>
                                        )}

                                        <span
                                          className={`text-sm truncate ${
                                            aWon
                                              ? "text-[#D4AF37] font-bold"
                                              : participantA ===
                                                "TBD"
                                              ? "text-gray-600"
                                              : "text-white"
                                          }`}
                                        >
                                          {
                                            participantA
                                          }
                                        </span>

                                      </div>

                                      <span className="font-black text-lg ml-3">
                                        {getScore(
                                          match,
                                          "A"
                                        )}
                                      </span>

                                    </div>

                                    {/* PLAYER / TEAM B */}

                                    <div
                                      className={`px-3 py-3 flex items-center justify-between border-t border-gray-800 ${
                                        bWon
                                          ? "bg-[#D4AF37]/10"
                                          : ""
                                      }`}
                                    >

                                      <div className="flex items-center gap-2 min-w-0">

                                        {bWon && (
                                          <span className="text-sm">
                                            🏆
                                          </span>
                                        )}

                                        <span
                                          className={`text-sm truncate ${
                                            bWon
                                              ? "text-[#D4AF37] font-bold"
                                              : participantB ===
                                                "TBD"
                                              ? "text-gray-600"
                                              : "text-white"
                                          }`}
                                        >
                                          {
                                            participantB
                                          }
                                        </span>

                                      </div>

                                      <span className="font-black text-lg ml-3">
                                        {getScore(
                                          match,
                                          "B"
                                        )}
                                      </span>

                                    </div>

                                    {/* PENALTIES */}

                                    {hasPenaltyData(
                                      match
                                    ) && (
                                      <div className="px-3 py-2 border-t border-gray-800 bg-black/40">

                                        <div className="flex justify-between items-center">

                                          <span className="text-[10px] uppercase tracking-wider text-gray-600">
                                            Penalties
                                          </span>

                                          <span className="text-xs font-bold text-white">
                                            {match.penalty_score_a ??
                                              "-"}{" "}
                                            -{" "}
                                            {match.penalty_score_b ??
                                              "-"}
                                          </span>

                                        </div>

                                      </div>
                                    )}

                                    {/* WINNER */}

                                    {winner && (
                                      <div className="px-3 py-2 border-t border-gray-800">

                                        <p className="text-[9px] uppercase tracking-wider text-gray-600">
                                          Winner
                                        </p>

                                        <p className="text-xs font-bold text-[#D4AF37] truncate mt-1">
                                          {winner}
                                        </p>

                                      </div>
                                    )}

                                  </div>
                                );
                              }
                            )
                          )}

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            </div>

          </div>
        )}

        {/* STAGE STATUS */}

        {knockoutMatches.length > 0 && (
          <div>

            <h2 className="text-2xl font-black">
              Stage Status
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-5">

              {ROUND_ORDER.map(
                (round) => {

                  const roundMatches =
                    getRoundMatches(
                      round
                    );

                  const completed =
                    roundMatches.filter(
                      (match) =>
                        match.status?.toLowerCase() ===
                        "completed"
                    ).length;

                  const scheduled =
                    roundMatches.filter(
                      (match) =>
                        match.status?.toLowerCase() ===
                        "scheduled"
                    ).length;

                  return (
                    <div
                      key={round}
                      className="bg-[#111111] border border-gray-800 rounded-xl p-5"
                    >

                      <p className="text-gray-500 text-xs uppercase tracking-wider">
                        {round}
                      </p>

                      <p className="text-2xl font-black mt-2">
                        {completed}/
                        {roundMatches.length}
                      </p>

                      <p className="text-gray-500 text-xs mt-1">
                        completed
                      </p>

                      {scheduled > 0 && (
                        <p className="text-blue-400 text-xs mt-3">
                          {scheduled} scheduled
                        </p>
                      )}

                    </div>
                  );
                }
              )}

            </div>

          </div>
        )}

        {/* INFORMATION */}

        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5">

          <h2 className="font-bold text-blue-400">
            How knockout progression works
          </h2>

          <p className="text-gray-400 text-sm leading-6 mt-2">
            When a knockout match is completed, the winner is automatically
            advanced to the appropriate next-round match. The next match
            remains pending until both participants are available.
          </p>

        </div>

      </div>
    </div>
  );
}