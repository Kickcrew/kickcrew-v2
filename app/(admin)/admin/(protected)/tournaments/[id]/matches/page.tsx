"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

/*
 * ==========================================================
 * TYPES
 * ==========================================================
 */

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

  best_of: string | null;

  scheduled_date: string | null;
  scheduled_time: string | null;

  winner_id: number | null;

  winner_team_id?: number | null;
  winner_player_id?: number | null;

  score_team_a: number | null;
  score_team_b: number | null;

  status: string | null;

  stream_link: string | null;
  notes: string | null;
}

interface Registration {
  id: number;
  tournament_id: number;

  team_id: number | null;
  player_id: number | null;

  status: string | null;

  teams?:
    | {
        id: number;
        team_name: string | null;
      }[]
    | {
        id: number;
        team_name: string | null;
      }
    | null;

  players?:
    | {
        id: number;
        full_name: string | null;
        gamer_tag: string | null;
      }[]
    | {
        id: number;
        full_name: string | null;
        gamer_tag: string | null;
      }
    | null;
}

interface MatchesResponse {
  success?: boolean;
  message?: string;
  matches?: Match[];
}

interface RegistrationsResponse {
  success?: boolean;
  message?: string;
  registrations?: Registration[];
}

/*
 * ==========================================================
 * HELPERS
 * ==========================================================
 */

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getTeamRecord(
  registration: Registration
) {
  if (!registration.teams) {
    return null;
  }

  if (Array.isArray(registration.teams)) {
    return registration.teams[0] ?? null;
  }

  return registration.teams;
}

function getPlayerRecord(
  registration: Registration
) {
  if (!registration.players) {
    return null;
  }

  if (Array.isArray(registration.players)) {
    return registration.players[0] ?? null;
  }

  return registration.players;
}

/*
 * ==========================================================
 * PAGE
 * ==========================================================
 */

export default function TournamentMatchesPage() {
  const params = useParams();

  const tournamentId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [matches, setMatches] =
    useState<Match[]>([]);

  const [registrations, setRegistrations] =
    useState<Registration[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * ========================================================
   * LOAD MATCHES + PARTICIPANTS
   * ========================================================
   */

  const loadMatches = useCallback(
    async () => {
      if (!tournamentId) {
        setError(
          "A valid tournament ID is required."
        );

        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        /*
         * Load both datasets together.
         */

        const [
          matchesResponse,
          registrationsResponse,
        ] = await Promise.all([
          fetch(
            `/api/matches?tournament_id=${encodeURIComponent(
              String(tournamentId)
            )}`,
            {
              cache: "no-store",
            }
          ),

          fetch(
            `/api/tournament-registrations?tournament_id=${encodeURIComponent(
              String(tournamentId)
            )}`,
            {
              cache: "no-store",
            }
          ),
        ]);

        /*
         * --------------------------------------------------
         * MATCHES RESPONSE
         * --------------------------------------------------
         */

        const matchesText =
          await matchesResponse.text();

        let matchesResult:
          | MatchesResponse
          | null = null;

        if (matchesText.trim()) {
          try {
            matchesResult =
              JSON.parse(
                matchesText
              ) as MatchesResponse;
          } catch {
            throw new Error(
              `The matches API returned invalid JSON. HTTP ${matchesResponse.status}.`
            );
          }
        }

        if (
          !matchesResponse.ok ||
          !matchesResult?.success
        ) {
          throw new Error(
            matchesResult?.message ||
              `Failed to load tournament matches. HTTP ${matchesResponse.status}.`
          );
        }

        /*
         * --------------------------------------------------
         * REGISTRATIONS RESPONSE
         * --------------------------------------------------
         */

        const registrationsText =
          await registrationsResponse.text();

        let registrationsResult:
          | RegistrationsResponse
          | null = null;

        if (
          registrationsText.trim()
        ) {
          try {
            registrationsResult =
              JSON.parse(
                registrationsText
              ) as RegistrationsResponse;
          } catch {
            throw new Error(
              `The tournament registrations API returned invalid JSON. HTTP ${registrationsResponse.status}.`
            );
          }
        }

        if (
          !registrationsResponse.ok ||
          !registrationsResult?.success
        ) {
          throw new Error(
            registrationsResult?.message ||
              `Failed to load tournament participants. HTTP ${registrationsResponse.status}.`
          );
        }

        /*
         * --------------------------------------------------
         * STORE DATA
         * --------------------------------------------------
         */

        setMatches(
          Array.isArray(
            matchesResult.matches
          )
            ? matchesResult.matches
            : []
        );

        setRegistrations(
          Array.isArray(
            registrationsResult.registrations
          )
            ? registrationsResult.registrations
            : []
        );
      } catch (loadError) {
        console.error(
          "Failed to load tournament matches:",
          loadError
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load tournament matches."
        );
      } finally {
        setLoading(false);
      }
    },
    [tournamentId]
  );

  /*
   * ========================================================
   * INITIAL LOAD
   * ========================================================
   */

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  /*
   * ========================================================
   * PARTICIPANT LOOKUPS
   * ========================================================
   *
   * These maps translate:
   *
   * player ID → gamer tag / name
   * team ID   → team name
   *
   * The match table stores IDs only.
   */

  const playerNames = useMemo(() => {
    const map =
      new Map<number, string>();

    for (const registration of registrations) {
      if (
        registration.player_id ===
        null
      ) {
        continue;
      }

      const player =
        getPlayerRecord(
          registration
        );

      if (!player) {
        continue;
      }

      const name =
        player.gamer_tag?.trim() ||
        player.full_name?.trim();

      if (name) {
        map.set(
          Number(
            registration.player_id
          ),
          name
        );
      }
    }

    return map;
  }, [registrations]);

  const teamNames = useMemo(() => {
    const map =
      new Map<number, string>();

    for (const registration of registrations) {
      if (
        registration.team_id ===
        null
      ) {
        continue;
      }

      const team =
        getTeamRecord(
          registration
        );

      if (
        team?.team_name?.trim()
      ) {
        map.set(
          Number(
            registration.team_id
          ),
          team.team_name.trim()
        );
      }
    }

    return map;
  }, [registrations]);

  /*
   * ========================================================
   * PARTICIPANT NAME
   * ========================================================
   */

  function getParticipantName(
    match: Match,
    side: "A" | "B"
  ): string {
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
      return (
        teamNames.get(
          Number(teamId)
        ) ??
        `Team #${teamId}`
      );
    }

    /*
     * PLAYER
     */

    if (playerId !== null) {
      return (
        playerNames.get(
          Number(playerId)
        ) ??
        `Player #${playerId}`
      );
    }

    /*
     * FUTURE KNOCKOUT MATCH
     */

    if (
      match.notes &&
      /winner of match/i.test(
        match.notes
      )
    ) {
      return match.notes;
    }

    return "TBD";
  }

  /*
   * ========================================================
   * STATUS STYLE
   * ========================================================
   */

  function getStatusClasses(
    status: string | null
  ) {
    switch (
      normalize(status)
    ) {
      case "completed":
        return "bg-green-600/20 text-green-400 border-green-500/40";

      case "live":
      case "in progress":
        return "bg-red-600/20 text-red-400 border-red-500/40";

      case "cancelled":
        return "bg-gray-600/20 text-gray-400 border-gray-500/40";

      case "postponed":
        return "bg-purple-600/20 text-purple-400 border-purple-500/40";

      default:
        return "bg-yellow-600/20 text-yellow-400 border-yellow-500/40";
    }
  }

  /*
   * ========================================================
   * DATE
   * ========================================================
   */

  function formatDate(
    date: string | null
  ) {
    if (!date) {
      return "-";
    }

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return date;
    }

    return parsed.toLocaleDateString(
      "en-GB",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  /*
   * ========================================================
   * STATISTICS
   * ========================================================
   */

  const completedMatches =
    useMemo(
      () =>
        matches.filter(
          (match) =>
            normalize(
              match.status
            ) === "completed"
        ).length,
      [matches]
    );

  const scheduledMatches =
    useMemo(
      () =>
        matches.filter(
          (match) =>
            normalize(
              match.status
            ) === "scheduled"
        ).length,
      [matches]
    );

  const liveMatches =
    useMemo(
      () =>
        matches.filter(
          (match) =>
            normalize(
              match.status
            ) === "live" ||
            normalize(
              match.status
            ) === "in progress"
        ).length,
      [matches]
    );

  /*
   * ========================================================
   * LOADING
   * ========================================================
   */

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-12 text-center">
          <p className="text-gray-400">
            Loading tournament matches...
          </p>
        </div>
      </div>
    );
  }

  /*
   * ========================================================
   * PAGE
   * ========================================================
   */

  return (
    <div className="max-w-7xl mx-auto space-y-10">

      {/* HEADER */}

      <div>
        <Link
          href={`/admin/tournaments/${tournamentId}`}
          className="text-gray-400 hover:text-white transition"
        >
          ← Back to Tournament Management
        </Link>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mt-5">

          <div>
            <h1 className="text-4xl font-bold">
              Tournament Matches
            </h1>

            <p className="text-gray-400 mt-2">
              Manage all matches generated
              for this tournament.
            </p>
          </div>

          <div className="flex gap-3">

            <Link
              href={`/admin/tournaments/${tournamentId}/fixtures`}
              className="bg-black border border-gray-700 hover:border-[#D4AF37] px-5 py-3 rounded-xl font-semibold transition"
            >
              Fixtures
            </Link>

            <Link
              href={`/admin/tournaments/${tournamentId}/standings`}
              className="bg-[#D4AF37] text-black px-5 py-3 rounded-xl font-semibold hover:bg-yellow-400 transition"
            >
              Standings
            </Link>

          </div>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="bg-red-600/10 border border-red-500/30 rounded-2xl p-6">

          <h2 className="font-bold text-red-400">
            Unable to load matches
          </h2>

          <p className="text-gray-400 mt-2">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              loadMatches()
            }
            className="mt-4 bg-red-600 hover:bg-red-500 px-5 py-2 rounded-lg font-semibold transition"
          >
            Try Again
          </button>

        </div>
      )}

      {/* STATISTICS */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

        <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6">
          <p className="text-gray-400">
            Total Matches
          </p>

          <p className="text-3xl font-bold mt-2">
            {matches.length}
          </p>
        </div>

        <div className="bg-[#111111] border border-yellow-500/20 rounded-2xl p-6">
          <p className="text-gray-400">
            Scheduled
          </p>

          <p className="text-3xl font-bold text-yellow-400 mt-2">
            {scheduledMatches}
          </p>
        </div>

        <div className="bg-[#111111] border border-red-500/20 rounded-2xl p-6">
          <p className="text-gray-400">
            Live
          </p>

          <p className="text-3xl font-bold text-red-400 mt-2">
            {liveMatches}
          </p>
        </div>

        <div className="bg-[#111111] border border-green-500/20 rounded-2xl p-6">
          <p className="text-gray-400">
            Completed
          </p>

          <p className="text-3xl font-bold text-green-400 mt-2">
            {completedMatches}
          </p>
        </div>

      </div>

      {/* MATCH LIST */}

      <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl overflow-hidden">

        <div className="p-6 border-b border-[#222]">

          <h2 className="text-2xl font-bold">
            Match List
          </h2>

          <p className="text-gray-400 mt-1">
            Select a match to view details,
            update scheduling, or record the
            result.
          </p>

        </div>

        {matches.length === 0 ? (

          <div className="p-12 text-center">

            <div className="text-4xl mb-4">
              ⚔️
            </div>

            <h3 className="text-xl font-bold">
              No matches found
            </h3>

            <p className="text-gray-400 mt-2 max-w-xl mx-auto">
              No matches have been generated
              for this tournament yet.
            </p>

            <Link
              href={`/admin/tournaments/${tournamentId}/fixtures`}
              className="inline-block mt-5 bg-[#D4AF37] text-black px-5 py-3 rounded-xl font-bold hover:bg-yellow-400 transition"
            >
              Go to Fixtures
            </Link>

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
                    Date
                  </th>

                  <th>
                    Status
                  </th>

                  <th className="pr-5">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {matches.map(
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

                    const scoreA =
                      match.score_team_a;

                    const scoreB =
                      match.score_team_b;

                    const hasScore =
                      scoreA !== null &&
                      scoreB !== null;

                    return (
                      <tr
                        key={
                          match.id
                        }
                        className="border-t border-[#222] hover:bg-[#181818] transition"
                      >

                        {/* MATCH */}

                        <td className="p-5">

                          <p className="font-bold text-white">
                            Match #
                            {match.match_number ??
                              match.id}
                          </p>

                          <p className="text-xs text-gray-500 mt-1">
                            ID #{match.id}
                          </p>

                        </td>

                        {/* ROUND */}

                        <td className="text-gray-300">

                          {match.round ||
                            "Tournament Match"}

                        </td>

                        {/* PARTICIPANT A */}

                        <td>

                          <div>
                            <p className="font-semibold text-white">
                              {participantA}
                            </p>

                            {match.player_a_id !==
                              null && (
                              <p className="text-xs text-gray-500 mt-1">
                                Player #
                                {
                                  match.player_a_id
                                }
                              </p>
                            )}

                            {match.team_a_id !==
                              null && (
                              <p className="text-xs text-gray-500 mt-1">
                                Team #
                                {
                                  match.team_a_id
                                }
                              </p>
                            )}
                          </div>

                        </td>

                        {/* PARTICIPANT B */}

                        <td>

                          <div>
                            <p className="font-semibold text-white">
                              {participantB}
                            </p>

                            {match.player_b_id !==
                              null && (
                              <p className="text-xs text-gray-500 mt-1">
                                Player #
                                {
                                  match.player_b_id
                                }
                              </p>
                            )}

                            {match.team_b_id !==
                              null && (
                              <p className="text-xs text-gray-500 mt-1">
                                Team #
                                {
                                  match.team_b_id
                                }
                              </p>
                            )}
                          </div>

                        </td>

                        {/* SCORE */}

                        <td>

                          {hasScore ? (
                            <span className="font-bold text-white">
                              {scoreA} -{" "}
                              {scoreB}
                            </span>
                          ) : (
                            <span className="font-bold text-gray-500">
                              ---
                            </span>
                          )}

                        </td>

                        {/* DATE */}

                        <td className="text-gray-400">

                          {formatDate(
                            match.scheduled_date
                          )}

                          {match.scheduled_time && (
                            <div className="text-xs text-gray-500 mt-1">
                              {
                                match.scheduled_time
                              }
                            </div>
                          )}

                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getStatusClasses(
                              match.status
                            )}`}
                          >
                            {match.status ||
                              "Scheduled"}
                          </span>

                        </td>

                        {/* ACTION */}

                        <td className="pr-5">

                          <Link
                            href={`/admin/tournaments/${tournamentId}/matches/${match.id}`}
                            className="inline-block bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-semibold transition"
                          >
                            View
                          </Link>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* FOOTER LINKS */}

      <div className="flex flex-wrap gap-3">

        <Link
          href={`/admin/tournaments/${tournamentId}`}
          className="bg-black border border-gray-700 hover:border-[#D4AF37] px-5 py-3 rounded-xl font-semibold transition"
        >
          ← Tournament Overview
        </Link>

        <Link
          href={`/admin/tournaments/${tournamentId}/participants`}
          className="bg-black border border-gray-700 hover:border-[#D4AF37] px-5 py-3 rounded-xl font-semibold transition"
        >
          Participants
        </Link>

        <Link
          href={`/admin/tournaments/${tournamentId}/fixtures`}
          className="bg-black border border-gray-700 hover:border-[#D4AF37] px-5 py-3 rounded-xl font-semibold transition"
        >
          Fixtures
        </Link>

        <Link
          href={`/admin/tournaments/${tournamentId}/standings`}
          className="bg-black border border-gray-700 hover:border-[#D4AF37] px-5 py-3 rounded-xl font-semibold transition"
        >
          Standings
        </Link>

      </div>

    </div>
  );
}