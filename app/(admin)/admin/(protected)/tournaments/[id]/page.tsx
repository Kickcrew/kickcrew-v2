"use client";
import TournamentResults from "@/components/admin/TournamentResults";
import TournamentStageAdvance from "@/components/admin/TournamentStageAdvance";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Tournament {
  id: number;
  tournament_name: string;
  tournament_type: string | null;
  status: string | null;

  registration_start: string | null;
  registration_end: string | null;

  start_date: string | null;
  end_date: string | null;

  game_id: number | null;

  games?: {
    id?: number;
    game_name?: string | null;
  } | null;
}

interface Registration {
  id: number;
  status: string;
}

interface Match {
  id: number;
  tournament_id?: number;
  game_id?: number | null;

  team_a_id?: number | null;
  team_b_id?: number | null;

  player_a_id?: number | null;
  player_b_id?: number | null;

  round: string | null;
  match_number?: number | null;

  best_of?: string | null;

  scheduled_date?: string | null;
  scheduled_time?: string | null;

  winner_id?: number | null;

  score_team_a?: number | null;
  score_team_b?: number | null;

  status: string | null;

  stream_link?: string | null;
  notes?: string | null;
}

interface Game {
  id: number;
  game_name: string;
}

/* =========================================================
   HELPERS
========================================================= */

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/*
 * A match is considered a Knockout match when its round
 * clearly identifies a knockout stage.
 *
 * Examples:
 * Quarterfinal
 * Quarterfinals
 * Semifinal
 * Semifinals
 * Final
 * Grand Final
 * Knockout
 * Upper Bracket
 * Lower Bracket
 * Elimination
 */
function isKnockoutRound(round: string | null): boolean {
  const value = normalize(round);

  if (!value) {
    return false;
  }

  return (
    value.includes("quarterfinal") ||
    value.includes("quarter-final") ||
    value.includes("semifinal") ||
value.includes("semi-final") ||
value === "final" ||
value.includes("3rd place") ||
value.includes("third place") ||
    value.includes("grand final") ||
    value.includes("knockout") ||
    value.includes("elimination") ||
    value.includes("upper bracket") ||
    value.includes("lower bracket") ||
    value.includes("losers bracket") ||
    value.includes("winners bracket")
  );
}

/*
 * Round Robin fixture names currently used by KICKCREW.
 *
 * Examples:
 * Round Robin
 * Round Robin - Round 1
 * Leg 1 - Round 1
 * Leg 2 - Round 1
 * Round 1
 * Round 2
 */
function isRoundRobinRound(
  round: string | null
): boolean {
  const value = normalize(round);

  if (!value) {
    return false;
  }

  if (value.includes("round robin")) {
    return true;
  }

  if (
    /^leg\s*\d+\s*[-–—]\s*round\s*\d+$/i.test(
      value
    )
  ) {
    return true;
  }

  if (/^round\s*\d+$/i.test(value)) {
    return true;
  }

  return false;
}

/* =========================================================
   PAGE
========================================================= */

export default function TournamentOverviewPage() {
  const params = useParams();

  const tournamentId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [tournament, setTournament] =
    useState<Tournament | null>(null);

  const [registrations, setRegistrations] =
    useState<Registration[]>([]);

  const [matches, setMatches] =
    useState<Match[]>([]);

  const [game, setGame] =
    useState<Game | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [completing, setCompleting] =
    useState(false);

  const [completionMessage, setCompletionMessage] =
    useState<string | null>(null);

  /* =======================================================
     LOAD TOURNAMENT
  ======================================================= */

  async function loadTournament() {
    try {
      setLoading(true);
      setError(null);

      /*
       * TOURNAMENT
       */

      const tournamentResponse =
        await fetch(
          `/api/tournaments/${tournamentId}`,
          {
            cache: "no-store",
          }
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

      const tournamentData =
        tournamentResult.tournament;

      setTournament(tournamentData);

      /*
       * REGISTRATIONS
       */

      const registrationsResponse =
        await fetch(
          `/api/tournament-registrations?tournament_id=${tournamentId}`,
          {
            cache: "no-store",
          }
        );

      const registrationsResult =
        await registrationsResponse.json();

      if (
        registrationsResponse.ok &&
        registrationsResult.success
      ) {
        setRegistrations(
          registrationsResult.registrations ?? []
        );
      } else {
        setRegistrations([]);
      }

      /*
       * MATCHES
       */

      const matchesResponse =
        await fetch(
          `/api/matches?tournament_id=${tournamentId}`,
          {
            cache: "no-store",
          }
        );

      const matchesResult =
        await matchesResponse.json();

      if (
        matchesResponse.ok &&
        matchesResult.success
      ) {
        setMatches(
          matchesResult.matches ?? []
        );
      } else {
        setMatches([]);
      }

      /*
       * GAME
       */

      if (tournamentData.game_id) {
        const gamesResponse =
          await fetch("/api/games", {
            cache: "no-store",
          });

        const gamesResult =
          await gamesResponse.json();

        if (
          gamesResponse.ok &&
          gamesResult.success
        ) {
          const selectedGame =
            (gamesResult.games ?? []).find(
              (item: Game) =>
                Number(item.id) ===
                Number(tournamentData.game_id)
            );

          setGame(
            selectedGame ?? null
          );
        }
      } else {
        setGame(null);
      }
    } catch (err) {
      console.error(
        "Failed to load tournament:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load tournament."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!tournamentId) {
      return;
    }

    loadTournament();
  }, [tournamentId]);

  /* =======================================================
     BASIC CALCULATIONS
  ======================================================= */

  const approvedRegistrations =
    registrations.filter(
      (registration) =>
        normalize(registration.status) ===
        "approved"
    );

  const completedMatches =
    matches.filter(
      (match) =>
        normalize(match.status) ===
        "completed"
    );

  const totalMatches =
    matches.length;

  const completedMatchCount =
    completedMatches.length;

  const remainingMatches =
    Math.max(
      totalMatches -
        completedMatchCount,
      0
    );

  /* =======================================================
     TOURNAMENT FORMAT
  ======================================================= */

  const tournamentFormat =
    normalize(
      tournament?.tournament_type
    );

  const requiresRoundRobin =
    tournamentFormat.includes(
      "round robin"
    ) ||
    tournamentFormat.includes(
      "round-robin"
    ) ||
    tournamentFormat.includes(
      "league"
    );

  const requiresKnockout =
    tournamentFormat.includes(
      "knockout"
    ) ||
    tournamentFormat.includes(
      "elimination"
    ) ||
    tournamentFormat.includes(
      "single elimination"
    ) ||
    tournamentFormat.includes(
      "double elimination"
    );

  /* =======================================================
     STAGE MATCH CLASSIFICATION
  ======================================================= */

  /*
   * IMPORTANT:
   *
   * For a hybrid Round Robin + Knockout tournament,
   * we explicitly detect the Knockout rounds.
   *
   * If no Knockout fixture exists yet,
   * knockoutMatches will be EMPTY.
   *
   * That is intentional.
   */

  const knockoutMatches =
    requiresKnockout
      ? matches.filter((match) =>
          isKnockoutRound(
            match.round
          )
        )
      : [];

  const knockoutGenerated =
    knockoutMatches.length > 0;

  const completedKnockoutMatches =
    knockoutMatches.filter(
      (match) =>
        normalize(match.status) ===
        "completed"
    );

  const incompleteKnockoutMatches =
    knockoutMatches.filter(
      (match) =>
        normalize(match.status) !==
        "completed"
    );

  const knockoutCompleted =
    knockoutGenerated &&
    incompleteKnockoutMatches.length ===
      0;

  /*
   * Round Robin matches.
   *
   * If the tournament requires Round Robin,
   * classify the generic Round 1 / Round 2 /
   * Leg 1 - Round 1 fixtures as Round Robin.
   */

  const roundRobinMatches =
    requiresRoundRobin
      ? matches.filter((match) => {
          /*
           * Never classify an explicit knockout
           * round as Round Robin.
           */

          if (
            isKnockoutRound(
              match.round
            )
          ) {
            return false;
          }

          return isRoundRobinRound(
            match.round
          );
        })
      : [];

  const completedRoundRobinMatches =
    roundRobinMatches.filter(
      (match) =>
        normalize(match.status) ===
        "completed"
    );

  const incompleteRoundRobinMatches =
    roundRobinMatches.filter(
      (match) =>
        normalize(match.status) !==
        "completed"
    );

  const roundRobinGenerated =
    roundRobinMatches.length > 0;

  const roundRobinCompleted =
    !requiresRoundRobin ||
    (
      roundRobinGenerated &&
      incompleteRoundRobinMatches.length ===
        0
    );

  /* =======================================================
     COMPLETION RULE
  ======================================================= */

  /*
   * RULE 1
   *
   * There must be at least one fixture.
   */

  const hasMatches =
    totalMatches > 0;

  /*
   * RULE 2
   *
   * Every generated match must be completed.
   */

  const allGeneratedMatchesCompleted =
    hasMatches &&
    remainingMatches === 0;

  /*
   * RULE 3
   *
   * If the tournament requires Knockout,
   * the Knockout stage MUST exist.
   */

  const knockoutStageExists =
    !requiresKnockout ||
    knockoutGenerated;

  /*
   * RULE 4
   *
   * If Knockout is required, every Knockout
   * match must be completed.
   */

  const knockoutStageFinished =
    !requiresKnockout ||
    knockoutCompleted;

  /*
   * FINAL RULE
   *
   * This is the ONLY variable used by the
   * completion UI.
   */

  const tournamentReadyToComplete =
    hasMatches &&
    allGeneratedMatchesCompleted &&
    roundRobinCompleted &&
    knockoutStageExists &&
    knockoutStageFinished;

  /* =======================================================
     COMPLETION BLOCKING REASON
  ======================================================= */

  let completionBlockReason =
    "Tournament is not ready.";

  if (!hasMatches) {
    completionBlockReason =
      "No tournament matches have been generated yet.";
  } else if (
    remainingMatches > 0
  ) {
    completionBlockReason =
      `${remainingMatches} match${
        remainingMatches === 1
          ? ""
          : "es"
      } still need${
        remainingMatches === 1
          ? "s"
          : ""
      } to be completed.`;
  } else if (
    requiresKnockout &&
    !knockoutGenerated
  ) {
    completionBlockReason =
      "The Round Robin matches are complete, but the required Knockout stage has not been generated yet.";
  } else if (
    requiresKnockout &&
    !knockoutCompleted
  ) {
    completionBlockReason =
      `${incompleteKnockoutMatches.length} Knockout match${
        incompleteKnockoutMatches.length ===
        1
          ? ""
          : "es"
      } still need${
        incompleteKnockoutMatches.length ===
        1
          ? "s"
          : ""
      } to be completed.`;
  } else if (
    requiresRoundRobin &&
    !roundRobinCompleted
  ) {
    completionBlockReason =
      `${incompleteRoundRobinMatches.length} Round Robin match${
        incompleteRoundRobinMatches.length ===
        1
          ? ""
          : "es"
      } still need${
        incompleteRoundRobinMatches.length ===
        1
          ? "s"
          : ""
      } to be completed.`;
  }

  /* =======================================================
     COMPLETE TOURNAMENT
  ======================================================= */

  async function completeTournament() {
    if (!tournamentId) {
      setError(
        "A valid tournament ID is required."
      );

      return;
    }

    if (!tournament) {
      setError(
        "Tournament information is not available."
      );

      return;
    }

    if (
      normalize(tournament.status) ===
      "completed"
    ) {
      setCompletionMessage(
        "This tournament has already been completed."
      );

      return;
    }

    /*
     * Re-check the same rules before sending
     * the request.
     */

    if (
      !tournamentReadyToComplete
    ) {
      setError(
        completionBlockReason
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to complete this tournament? This action should only be performed after every required stage and match has been completed."
      );

    if (!confirmed) {
      return;
    }

    try {
      setCompleting(true);
      setError(null);
      setCompletionMessage(null);

      const response =
        await fetch(
          `/api/tournaments/${tournamentId}/complete`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
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
            "Failed to complete tournament."
        );
      }

      setCompletionMessage(
        result.message ||
          "Tournament completed successfully."
      );

      await loadTournament();
    } catch (err) {
      console.error(
        "Tournament completion error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to complete tournament."
      );
    } finally {
      setCompleting(false);
    }
  }

  /* =======================================================
     TOURNAMENT STATE
  ======================================================= */

  function getTournamentState() {
    if (!tournament) {
      return {
        label: "Loading",
        description:
          "Loading tournament information.",
        className:
          "bg-gray-600/20 text-gray-400 border-gray-500/40",
      };
    }

    const databaseStatus =
      normalize(
        tournament.status
      );

    if (
      databaseStatus ===
        "completed" ||
      databaseStatus ===
        "complete"
    ) {
      return {
        label: "Completed",
        description:
          "This tournament has been completed.",
        className:
          "bg-green-600/20 text-green-400 border-green-500/40",
      };
    }

    if (
      tournamentReadyToComplete
    ) {
      return {
        label: "Ready to Complete",
        description:
          "All required tournament stages and matches have been completed.",
        className:
          "bg-green-600/20 text-green-400 border-green-500/40",
      };
    }

    if (
      requiresKnockout &&
      roundRobinCompleted &&
      !knockoutGenerated
    ) {
      return {
        label: "Round Robin Complete",
        description:
          "Round Robin is complete. Generate the required Knockout stage before completing the tournament.",
        className:
          "bg-blue-600/20 text-blue-400 border-blue-500/40",
      };
    }

    if (
      completedMatchCount > 0
    ) {
      return {
        label: "In Progress",
        description:
          "Tournament matches are currently being played.",
        className:
          "bg-yellow-600/20 text-yellow-400 border-yellow-500/40",
      };
    }

    if (
      approvedRegistrations.length > 0
    ) {
      return {
        label: "Ready",
        description:
          "Participants are approved and the tournament is ready for fixtures.",
        className:
          "bg-purple-600/20 text-purple-400 border-purple-500/40",
      };
    }

    return {
      label: "Registration",
      description:
        "The tournament is currently collecting participants.",
      className:
        "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40",
    };
  }

  const tournamentState =
    getTournamentState();

  /* =======================================================
     DATE FORMAT
  ======================================================= */

  function formatDateTime(
    value: string | null
  ) {
    if (!value) {
      return "Not set";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleString(
      "en-GB",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-12 text-center">
          <p className="text-gray-400">
            Loading tournament...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !tournament) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-600/10 border border-red-500/30 rounded-2xl p-8">
          <h1 className="text-xl font-bold text-red-400">
            Tournament could not be loaded
          </h1>

          <p className="text-gray-400 mt-2">
            {error ||
              "Tournament not found."}
          </p>

          <Link
            href="/admin/tournaments"
            className="inline-block mt-5 bg-black border border-gray-700 hover:border-[#D4AF37] px-5 py-3 rounded-xl font-semibold transition"
          >
            ← Back to Tournaments
          </Link>
        </div>
      </div>
    );
  }

  const gameName =
    game?.game_name ||
    tournament.games?.game_name ||
    "Game not specified";

  const progress =
    totalMatches > 0
      ? Math.round(
          (completedMatchCount /
            totalMatches) *
            100
        )
      : 0;

  const tournamentIsCompleted =
    normalize(
      tournament.status
    ) === "completed";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="max-w-7xl mx-auto space-y-10">

      {/* =================================================
          HEADER
      ================================================= */}

      <div>
        <Link
          href="/admin/tournaments"
          className="text-gray-400 hover:text-white transition"
        >
          ← Back to Tournaments
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mt-5">

          <div>
            <div className="flex flex-wrap items-center gap-3">

              <h1 className="text-4xl font-bold">
                {tournament.tournament_name}
              </h1>

              <span
                className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${tournamentState.className}`}
              >
                {tournamentState.label}
              </span>

            </div>

            <p className="text-gray-400 mt-2">
              {tournamentState.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            <Link
              href={`/admin/tournaments/${tournamentId}/registrations`}
              className="bg-black border border-gray-700 hover:border-[#D4AF37] px-5 py-3 rounded-xl font-semibold transition"
            >
              Registrations
            </Link>

            <Link
              href={`/admin/tournaments/${tournamentId}/standings`}
              className="bg-[#D4AF37] text-black hover:bg-yellow-400 px-5 py-3 rounded-xl font-bold transition"
            >
              Standings
            </Link>

          </div>

        </div>
      </div>

      {/* =================================================
          TOURNAMENT INFORMATION
      ================================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6">

          <h2 className="text-xl font-bold">
            Tournament Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">

            <div>
              <p className="text-gray-500 text-sm">
                Game
              </p>

              <p className="font-semibold mt-1">
                {gameName}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">
                Format
              </p>

              <p className="font-semibold mt-1">
                {tournament.tournament_type ||
                  "Not specified"}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">
                Registration Opens
              </p>

              <p className="font-semibold mt-1">
                {formatDateTime(
                  tournament.registration_start
                )}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">
                Registration Closes
              </p>

              <p className="font-semibold mt-1">
                {formatDateTime(
                  tournament.registration_end
                )}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">
                Tournament Start
              </p>

              <p className="font-semibold mt-1">
                {formatDateTime(
                  tournament.start_date
                )}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">
                Tournament End
              </p>

              <p className="font-semibold mt-1">
                {formatDateTime(
                  tournament.end_date
                )}
              </p>
            </div>

          </div>

        </div>

        <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6">

          <h2 className="text-xl font-bold">
            Stage Status
          </h2>

          <div className="mt-6 space-y-4">

            <div className="bg-black rounded-xl p-4">
              <p className="text-gray-500 text-sm">
                Round Robin
              </p>

              <p className="font-bold mt-1">
                {!requiresRoundRobin
                  ? "Not Required"
                  : roundRobinCompleted
                  ? "Complete"
                  : "In Progress"}
              </p>
            </div>

            <div className="bg-black rounded-xl p-4">
              <p className="text-gray-500 text-sm">
                Knockout
              </p>

              <p
                className={`font-bold mt-1 ${
                  knockoutGenerated
                    ? knockoutCompleted
                      ? "text-green-400"
                      : "text-yellow-400"
                    : requiresKnockout
                    ? "text-red-400"
                    : "text-gray-400"
                }`}
              >
                {!requiresKnockout
                  ? "Not Required"
                  : !knockoutGenerated
                  ? "Not Generated"
                  : knockoutCompleted
                  ? "Complete"
                  : "In Progress"}
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

        <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6">
          <p className="text-gray-500 text-sm">
            Approved Participants
          </p>

          <p className="text-3xl font-bold text-[#D4AF37] mt-2">
            {approvedRegistrations.length}
          </p>
        </div>

        <div className="bg-[#111111] border border-blue-500/20 rounded-2xl p-6">
          <p className="text-gray-500 text-sm">
            Total Matches
          </p>

          <p className="text-3xl font-bold text-blue-400 mt-2">
            {totalMatches}
          </p>
        </div>

        <div className="bg-[#111111] border border-green-500/20 rounded-2xl p-6">
          <p className="text-gray-500 text-sm">
            Completed Matches
          </p>

          <p className="text-3xl font-bold text-green-400 mt-2">
            {completedMatchCount}
          </p>
        </div>

        <div className="bg-[#111111] border border-purple-500/20 rounded-2xl p-6">
          <p className="text-gray-500 text-sm">
            Progress
          </p>

          <p className="text-3xl font-bold text-purple-400 mt-2">
            {progress}%
          </p>
        </div>

      </div>

      {/* =================================================
          TOURNAMENT PROGRESS
      ================================================= */}

      <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6">

        <div className="flex justify-between items-center">

          <div>
            <h2 className="text-xl font-bold">
              Tournament Progress
            </h2>

            <p className="text-gray-400 text-sm mt-1">
              {completedMatchCount} of{" "}
              {totalMatches} matches completed
            </p>
          </div>

          <span className="text-[#D4AF37] font-bold">
            {progress}%
          </span>

        </div>

        <div className="mt-5 h-3 bg-black rounded-full overflow-hidden">

          <div
            className="h-full bg-[#D4AF37] transition-all duration-500"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </div>

      {/* =================================================
          STAGE ADVANCEMENT
      ================================================= */}

      <TournamentStageAdvance
        tournamentId={Number(tournamentId)}
      />

      {/* =================================================
          TOURNAMENT COMPLETION
      ================================================= */}

      <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl overflow-hidden">

        <div className="p-6 border-b border-[#222]">

          <h2 className="text-xl font-bold uppercase">
            Tournament Completion
          </h2>

          <p className="text-sm text-gray-400 mt-1">
            A tournament can only be completed after
            every required stage has been finished.
          </p>

        </div>

        <div className="p-6">
          {/* TOURNAMENT RESULTS */}

<TournamentResults
  matches={matches}
  registrations={registrations}
/>

          {/* COMPLETED */}

          {tournamentIsCompleted ? (

            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xl">
                  ✓
                </div>

                <div>

                  <h3 className="font-bold text-green-400">
                    Tournament Completed
                  </h3>

                  <p className="text-sm text-gray-400 mt-1">
                    This tournament has been officially
                    completed.
                  </p>

                </div>

              </div>

            </div>

          ) : (

            <>

              {/* COMPLETION STATS */}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div className="bg-black rounded-xl p-5">
                  <p className="text-gray-500 text-sm">
                    Total Matches
                  </p>

                  <p className="text-2xl font-bold mt-1">
                    {totalMatches}
                  </p>
                </div>

                <div className="bg-black rounded-xl p-5">
                  <p className="text-gray-500 text-sm">
                    Completed
                  </p>

                  <p className="text-2xl font-bold text-green-400 mt-1">
                    {completedMatchCount}
                  </p>
                </div>

                <div className="bg-black rounded-xl p-5">
                  <p className="text-gray-500 text-sm">
                    Remaining
                  </p>

                  <p className="text-2xl font-bold text-yellow-400 mt-1">
                    {remainingMatches}
                  </p>
                </div>

              </div>

              {/* READY */}

              {tournamentReadyToComplete ? (

                <div className="mt-5 bg-green-500/10 border border-green-500/30 rounded-xl p-5">

                  <h3 className="font-bold text-green-400">
                    Tournament Ready to Complete
                  </h3>

                  <p className="text-sm text-gray-300 mt-2">
                    All required tournament stages and
                    matches have been completed.
                  </p>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">

                    <div className="bg-black rounded-lg p-4">
                      <p className="text-xs text-gray-500">
                        Round Robin
                      </p>

                      <p className="font-bold text-green-400 mt-1">
                        {requiresRoundRobin
                          ? "Complete"
                          : "Not Required"}
                      </p>
                    </div>

                    <div className="bg-black rounded-lg p-4">
                      <p className="text-xs text-gray-500">
                        Knockout
                      </p>

                      <p className="font-bold text-green-400 mt-1">
                        {requiresKnockout
                          ? "Complete"
                          : "Not Required"}
                      </p>
                    </div>

                    <div className="bg-black rounded-lg p-4">
                      <p className="text-xs text-gray-500">
                        Matches
                      </p>

                      <p className="font-bold text-green-400 mt-1">
                        {completedMatchCount}/
                        {totalMatches}
                      </p>
                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={
                      completeTournament
                    }
                    disabled={
                      completing
                    }
                    className="mt-5 bg-[#D4AF37] hover:bg-yellow-400 disabled:bg-gray-700 disabled:text-gray-400 text-black px-6 py-3 rounded-xl font-bold transition"
                  >
                    {completing
                      ? "Completing Tournament..."
                      : "🏆 Complete Tournament"}
                  </button>

                </div>

              ) : (

                <div className="mt-5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5">

                  <h3 className="font-bold text-yellow-400">
                    Tournament Not Ready
                  </h3>

                  <p className="text-sm text-gray-300 mt-2">
                    {completionBlockReason}
                  </p>

                  {/* ROUND ROBIN */}

                  {requiresRoundRobin &&
                    !roundRobinCompleted && (
                      <div className="mt-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">

                        <p className="font-semibold text-yellow-400">
                          Round Robin Stage
                        </p>

                        <p className="text-sm text-gray-400 mt-1">
                          {
                            incompleteRoundRobinMatches.length
                          }{" "}
                          Round Robin match
                          {
                            incompleteRoundRobinMatches.length ===
                            1
                              ? ""
                              : "es"
                          }{" "}
                          still need
                          {
                            incompleteRoundRobinMatches.length ===
                            1
                              ? "s"
                              : ""
                          }{" "}
                          to be completed.
                        </p>

                      </div>
                    )}

                  {/* KNOCKOUT NOT GENERATED */}

                  {requiresKnockout &&
                    roundRobinCompleted &&
                    !knockoutGenerated && (

                      <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">

                        <p className="font-semibold text-blue-400">
                          Knockout Stage Not Generated
                        </p>

                        <p className="text-sm text-gray-400 mt-1">
                          The Round Robin stage is
                          complete, but this tournament
                          format requires a Knockout stage.
                          Generate the Knockout fixtures
                          before completing the tournament.
                        </p>

                        <Link
                          href={`/admin/tournaments/${tournamentId}/knockout`}
                          className="inline-block mt-4 bg-blue-500 hover:bg-blue-400 text-black px-4 py-2 rounded-lg font-bold transition"
                        >
                          Open Knockout Bracket →
                        </Link>

                      </div>

                    )}

                  {/* KNOCKOUT INCOMPLETE */}

                  {requiresKnockout &&
                    knockoutGenerated &&
                    !knockoutCompleted && (

                      <div className="mt-4 bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">

                        <p className="font-semibold text-purple-400">
                          Knockout Stage Not Complete
                        </p>

                        <p className="text-sm text-gray-400 mt-1">
                          {
                            incompleteKnockoutMatches.length
                          }{" "}
                          Knockout match
                          {
                            incompleteKnockoutMatches.length ===
                            1
                              ? ""
                              : "es"
                          }{" "}
                          still need
                          {
                            incompleteKnockoutMatches.length ===
                            1
                              ? "s"
                              : ""
                          }{" "}
                          to be completed.
                        </p>

                        <Link
                          href={`/admin/tournaments/${tournamentId}/knockout`}
                          className="inline-block mt-4 bg-purple-500 hover:bg-purple-400 text-black px-4 py-2 rounded-lg font-bold transition"
                        >
                          Open Knockout Bracket →
                        </Link>

                      </div>

                    )}

                </div>

              )}

              {/* SUCCESS */}

              {completionMessage && (

                <div className="mt-5 bg-green-500/10 border border-green-500/30 rounded-xl p-5">

                  <h3 className="font-bold text-green-400">
                    Success
                  </h3>

                  <p className="text-sm text-gray-300 mt-1">
                    {completionMessage}
                  </p>

                </div>

              )}

            </>

          )}

        </div>

      </div>

           {/* =================================================
          TOURNAMENT MANAGEMENT
      ================================================= */}

      <div>

        <h2 className="text-2xl font-bold">
          Tournament Management
        </h2>

        <p className="text-gray-400 mt-1">
          Manage each stage of the tournament from
          registration through final standings.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">

          {/* REGISTRATIONS */}

          <Link
            href={`/admin/tournaments/${tournamentId}/registrations`}
            className="group bg-[#111111] border border-[#222] hover:border-[#D4AF37]/50 rounded-2xl p-6 transition"
          >
            <div className="text-3xl">
              📝
            </div>

            <h3 className="text-xl font-bold mt-4">
              Registrations
            </h3>

            <p className="text-gray-400 mt-2">
              Review applicants and approve or
              reject tournament registrations.
            </p>

            <p className="text-[#D4AF37] mt-4 font-semibold">
              Open Registrations →
            </p>
          </Link>


          {/* PARTICIPANTS */}

          <Link
            href={`/admin/tournaments/${tournamentId}/participants`}
            className="group bg-[#111111] border border-[#222] hover:border-[#D4AF37]/50 rounded-2xl p-6 transition"
          >
            <div className="text-3xl">
              👥
            </div>

            <h3 className="text-xl font-bold mt-4">
              Participants
            </h3>

            <p className="text-gray-400 mt-2">
              View all approved teams and players.
            </p>

            <p className="text-[#D4AF37] mt-4 font-semibold">
              Open Participants →
            </p>
          </Link>


          {/* GROUPS */}

          <Link
            href={`/admin/tournaments/${tournamentId}/groups`}
            className="group bg-[#111111] border border-[#222] hover:border-[#D4AF37]/50 rounded-2xl p-6 transition"
          >
            <div className="text-3xl">
              🏟️
            </div>

            <h3 className="text-xl font-bold mt-4">
              Groups
            </h3>

            <p className="text-gray-400 mt-2">
              Create and manage tournament groups,
              assign participants, and prepare the
              group stage.
            </p>

            <p className="text-[#D4AF37] mt-4 font-semibold">
              Open Groups →
            </p>
          </Link>


          {/* FIXTURES */}

          <Link
            href={`/admin/tournaments/${tournamentId}/fixtures`}
            className="group bg-[#111111] border border-[#222] hover:border-[#D4AF37]/50 rounded-2xl p-6 transition"
          >
            <div className="text-3xl">
              ⚔️
            </div>

            <h3 className="text-xl font-bold mt-4">
              Fixtures
            </h3>

            <p className="text-gray-400 mt-2">
              Generate and prepare tournament
              match fixtures.
            </p>

            <p className="text-[#D4AF37] mt-4 font-semibold">
              Open Fixtures →
            </p>
          </Link>


          {/* MATCHES */}

          <Link
            href={`/admin/tournaments/${tournamentId}/matches`}
            className="group bg-[#111111] border border-[#222] hover:border-[#D4AF37]/50 rounded-2xl p-6 transition"
          >
            <div className="text-3xl">
              🎮
            </div>

            <h3 className="text-xl font-bold mt-4">
              Matches
            </h3>

            <p className="text-gray-400 mt-2">
              Manage scheduled matches and record
              results.
            </p>

            <p className="text-[#D4AF37] mt-4 font-semibold">
              Open Matches →
            </p>
          </Link>


          {/* KNOCKOUT */}

          <Link
            href={`/admin/tournaments/${tournamentId}/knockout`}
            className="group bg-[#111111] border border-[#222] hover:border-[#D4AF37]/50 rounded-2xl p-6 transition"
          >
            <div className="text-3xl">
              🏆
            </div>

            <h3 className="text-xl font-bold mt-4">
              Knockout Bracket
            </h3>

            <p className="text-gray-400 mt-2">
              View the knockout bracket and manage
              elimination matches.
            </p>

            <p className="text-[#D4AF37] mt-4 font-semibold">
              Open Knockout Bracket →
            </p>
          </Link>


          {/* STANDINGS */}

          <Link
            href={`/admin/tournaments/${tournamentId}/standings`}
            className="group bg-[#111111] border border-[#222] hover:border-[#D4AF37]/50 rounded-2xl p-6 transition"
          >
            <div className="text-3xl">
              📊
            </div>

            <h3 className="text-xl font-bold mt-4">
              Standings & Results
            </h3>

            <p className="text-gray-400 mt-2">
              Review tournament rankings and final
              results.
            </p>

            <p className="text-[#D4AF37] mt-4 font-semibold">
              View Standings →
            </p>
          </Link>

        </div>

      </div>

    </div>
  );
}