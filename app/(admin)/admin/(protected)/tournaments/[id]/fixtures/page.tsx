"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

interface Registration {
  id: number;
  tournament_id: number;
  team_id: number | null;
  player_id: number | null;
  status: string;

  teams?: {
    id: number;
    team_name: string;
  }[] | null;

  players?: {
    id: number;
    full_name: string;
    gamer_tag: string;
  }[] | null;
}

interface Match {
  id: number;
  tournament_id: number;

  team_a_id: number | null;
  team_b_id: number | null;

  player_a_id: number | null;
  player_b_id: number | null;

  round: string | null;
  match_number: number | null;

  score_team_a: number | null;
  score_team_b: number | null;

  status: string | null;

  scheduled_date?: string | null;
  scheduled_time?: string | null;

  best_of?: string | null;
}

interface RegistrationsResponse {
  success?: boolean;
  message?: string;
  registrations?: Registration[];
}

interface MatchesResponse {
  success?: boolean;
  message?: string;
  matches?: Match[];
  matchCount?: number;
  existingMatchCount?: number;
  fixtureFormat?: string;
  generatedByGroup?: Record<string, number>;
  skippedByGroup?: Record<string, number>;
  groupCount?: number;
}

type FixtureFormat = "single_leg" | "double_leg";

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getParticipantName(
  registration: Registration
): string {
  if (registration.team_id !== null) {
    return (
      registration.teams?.[0]?.team_name ??
      `Team #${registration.team_id}`
    );
  }

  if (registration.player_id !== null) {
    return (
      registration.players?.[0]?.gamer_tag ??
      registration.players?.[0]?.full_name ??
      `Player #${registration.player_id}`
    );
  }

  return "Unknown Participant";
}

function getParticipantFromMatch(
  match: Match,
  registrations: Registration[],
  side: "a" | "b"
): string {
  const playerId =
    side === "a"
      ? match.player_a_id
      : match.player_b_id;

  const teamId =
    side === "a"
      ? match.team_a_id
      : match.team_b_id;

  const registration =
    registrations.find((item) => {
      if (
        playerId !== null &&
        item.player_id === playerId
      ) {
        return true;
      }

      if (
        teamId !== null &&
        item.team_id === teamId
      ) {
        return true;
      }

      return false;
    });

  if (registration) {
    return getParticipantName(registration);
  }

  if (playerId !== null) {
    return `Player #${playerId}`;
  }

  if (teamId !== null) {
    return `Team #${teamId}`;
  }

  return "TBD";
}

async function parseJsonResponse<T>(
  response: Response
): Promise<{
  data: T | null;
  rawText: string;
}> {
  const rawText = await response.text();

  if (!rawText.trim()) {
    return {
      data: null,
      rawText: "",
    };
  }

  try {
    return {
      data: JSON.parse(rawText) as T,
      rawText,
    };
  } catch {
    return {
      data: null,
      rawText,
    };
  }
}

export default function TournamentFixturesPage() {
  const params = useParams();

  const rawId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const tournamentId = Number(rawId);

  const [registrations, setRegistrations] =
    useState<Registration[]>([]);

  const [matches, setMatches] =
    useState<Match[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [generating, setGenerating] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const [fixtureFormat, setFixtureFormat] =
    useState<FixtureFormat>("single_leg");

  /*
   * ==========================================================
   * LOAD REGISTRATIONS
   * ==========================================================
   */

  const loadRegistrations =
    useCallback(async () => {
      const response = await fetch(
        `/api/tournament-registrations?tournament_id=${encodeURIComponent(
          String(tournamentId)
        )}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const {
        data,
        rawText,
      } =
        await parseJsonResponse<RegistrationsResponse>(
          response
        );

      if (!rawText.trim()) {
        throw new Error(
          `Registrations API returned an empty response. HTTP ${response.status}.`
        );
      }

      if (!data) {
        throw new Error(
          `Registrations API returned invalid JSON. HTTP ${response.status}.`
        );
      }

      if (
        !response.ok ||
        data.success === false
      ) {
        throw new Error(
          data.message ??
            `Failed to load registrations. HTTP ${response.status}.`
        );
      }

      setRegistrations(
        Array.isArray(data.registrations)
          ? data.registrations
          : []
      );
    }, [tournamentId]);

  /*
   * ==========================================================
   * LOAD MATCHES
   * ==========================================================
   */

  const loadMatches =
    useCallback(async () => {
      const response = await fetch(
        `/api/matches?tournament_id=${encodeURIComponent(
          String(tournamentId)
        )}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const {
        data,
        rawText,
      } =
        await parseJsonResponse<MatchesResponse>(
          response
        );

      if (!rawText.trim()) {
        throw new Error(
          `Matches API returned an empty response. HTTP ${response.status}.`
        );
      }

      if (!data) {
        throw new Error(
          `Matches API returned invalid JSON. HTTP ${response.status}.`
        );
      }

      if (
        !response.ok ||
        data.success === false
      ) {
        throw new Error(
          data.message ??
            `Failed to load matches. HTTP ${response.status}.`
        );
      }

      setMatches(
        Array.isArray(data.matches)
          ? data.matches
          : []
      );
    }, [tournamentId]);

  /*
   * ==========================================================
   * LOAD PAGE DATA
   * ==========================================================
   */

  const loadData =
    useCallback(async () => {
      if (
        !Number.isInteger(tournamentId) ||
        tournamentId <= 0
      ) {
        setError(
          `Invalid tournament ID: ${rawId}`
        );

        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        await Promise.all([
          loadRegistrations(),
          loadMatches(),
        ]);
      } catch (loadError) {
        console.error(
          "Tournament fixtures loading error:",
          loadError
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load tournament fixtures."
        );
      } finally {
        setLoading(false);
      }
    }, [
      tournamentId,
      rawId,
      loadRegistrations,
      loadMatches,
    ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /*
   * ==========================================================
   * GENERATE GROUP FIXTURES
   *
   * IMPORTANT:
   *
   * This does NOT call /api/matches.
   *
   * It calls the dedicated group fixture route:
   *
   * /api/tournaments/[id]/groups/fixtures
   * ==========================================================
   */

  async function generateFixtures() {
    if (
      !Number.isInteger(tournamentId) ||
      tournamentId <= 0
    ) {
      setError(
        `Invalid tournament ID: ${rawId}`
      );

      return;
    }

    try {
      setGenerating(true);
      setError(null);
      setSuccess(null);

      const endpoint =
        `/api/tournaments/${encodeURIComponent(
          String(tournamentId)
        )}/groups/fixtures`;

      const requestBody = {
        fixtureFormat,
      };

      console.log(
        "Generating GROUP fixtures"
      );

      console.log(
        "Tournament ID:",
        tournamentId
      );

      console.log(
        "Group fixture endpoint:",
        endpoint
      );

      console.log(
        "Group fixture body:",
        requestBody
      );

      const response =
        await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body: JSON.stringify(
            requestBody
          ),
        });

      const {
        data: result,
        rawText,
      } =
        await parseJsonResponse<MatchesResponse>(
          response
        );

      console.log(
        "Group fixture HTTP status:",
        response.status
      );

      console.log(
        "Group fixture response:",
        result
      );

      if (!rawText.trim()) {
        throw new Error(
          `Group fixture API returned an empty response. HTTP ${response.status}.`
        );
      }

      if (!result) {
        throw new Error(
          `Group fixture API returned invalid JSON. HTTP ${response.status}. Response: ${rawText.slice(
            0,
            500
          )}`
        );
      }

      if (
        !response.ok ||
        result.success === false
      ) {
        throw new Error(
          result.message ??
            `Failed to generate group fixtures. HTTP ${response.status}.`
        );
      }

      const createdCount =
        Number(result.matchCount ?? 0);

      if (createdCount > 0) {
        setSuccess(
          `Successfully created ${createdCount} group fixture${
            createdCount === 1
              ? ""
              : "s"
          } using ${
            fixtureFormat ===
            "double_leg"
              ? "double-leg"
              : "single-leg"
          } format.`
        );
      } else {
        setSuccess(
          result.message ??
            "No new fixtures were required."
        );
      }

      await loadMatches();
    } catch (generationError) {
      console.error(
        "Group fixture generation error:",
        generationError
      );

      setError(
        generationError instanceof Error
          ? generationError.message
          : "Failed to generate group fixtures."
      );
    } finally {
      setGenerating(false);
    }
  }

  /*
   * ==========================================================
   * DERIVED DATA
   * ==========================================================
   */

  const approvedRegistrations =
    useMemo(() => {
      return registrations.filter(
        (registration) =>
          normalize(
            registration.status
          ) === "approved"
      );
    }, [registrations]);

  const playersCount =
    useMemo(() => {
      return approvedRegistrations.filter(
        (registration) =>
          registration.player_id !== null
      ).length;
    }, [approvedRegistrations]);

  const teamsCount =
    useMemo(() => {
      return approvedRegistrations.filter(
        (registration) =>
          registration.team_id !== null
      ).length;
    }, [approvedRegistrations]);

  const completedMatches =
    useMemo(() => {
      return matches.filter(
        (match) =>
          normalize(
            match.status
          ) === "completed"
      ).length;
    }, [matches]);

  /*
   * ==========================================================
   * LOADING
   * ==========================================================
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080808] text-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="animate-pulse">
            <div className="h-4 w-40 rounded bg-white/10" />

            <div className="mt-5 h-10 w-80 rounded bg-white/10" />

            <div className="mt-3 h-4 w-[32rem] max-w-full rounded bg-white/10" />

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <div className="h-28 rounded-xl bg-white/5" />
              <div className="h-28 rounded-xl bg-white/5" />
              <div className="h-28 rounded-xl bg-white/5" />
              <div className="h-28 rounded-xl bg-white/5" />
            </div>

            <div className="mt-8 h-72 rounded-2xl bg-white/5" />
          </div>
        </div>
      </main>
    );
  }

  /*
   * ==========================================================
   * PAGE
   * ==========================================================
   */

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-8">

        {/* TOP NAV */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Link
            href={`/admin/tournaments/${tournamentId}`}
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-gray-400 transition hover:text-[#D4AF37]"
          >
            ← Back to Tournament
          </Link>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/tournaments/${tournamentId}/participants`}
              className="rounded-lg border border-gray-800 bg-[#111111] px-4 py-2 text-xs font-semibold text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-white"
            >
              Participants
            </Link>

            <Link
              href={`/admin/tournaments/${tournamentId}/fixtures`}
              className="rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-black"
            >
              Fixtures
            </Link>

            <Link
              href={`/admin/tournaments/${tournamentId}/matches`}
              className="rounded-lg border border-gray-800 bg-[#111111] px-4 py-2 text-xs font-semibold text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-white"
            >
              Matches
            </Link>
          </div>
        </div>

        {/* HEADER */}

        <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
              Tournament Management
            </p>

            <h1 className="mt-2 text-4xl font-black uppercase tracking-tight">
              Tournament Fixtures
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
              Generate group-stage fixtures automatically
              from approved participants.
            </p>
          </div>

          <button
            type="button"
            onClick={generateFixtures}
            disabled={
              generating ||
              approvedRegistrations.length < 2
            }
            className="rounded-lg bg-[#D4AF37] px-6 py-3 text-sm font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating
              ? "Generating..."
              : "Generate Fixtures"}
          </button>
        </div>

        {/* TOURNAMENT ID */}

        <div className="mt-4 rounded-lg border border-gray-800 bg-[#0d0d0d] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
            Tournament ID
          </p>

          <p className="mt-1 text-sm font-bold text-[#D4AF37]">
            #{tournamentId}
          </p>
        </div>

        {/* FORMAT */}

        <section className="mt-6 rounded-2xl border border-gray-800 bg-[#111111] p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Fixture Format
            </p>

            <h2 className="mt-2 text-xl font-black uppercase">
              Choose Match Format
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Select whether each participant should
              face every opponent once or twice.
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">

            <button
              type="button"
              onClick={() =>
                setFixtureFormat(
                  "single_leg"
                )
              }
              className={`rounded-xl border p-5 text-left transition ${
                fixtureFormat ===
                "single_leg"
                  ? "border-[#D4AF37] bg-[#D4AF37]/10"
                  : "border-gray-800 bg-black hover:border-gray-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-black uppercase">
                  Single Leg
                </p>

                {fixtureFormat ===
                  "single_leg" && (
                  <span className="text-[#D4AF37]">
                    ✓
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm text-gray-500">
                Each participant plays every
                opponent once.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                setFixtureFormat(
                  "double_leg"
                )
              }
              className={`rounded-xl border p-5 text-left transition ${
                fixtureFormat ===
                "double_leg"
                  ? "border-[#D4AF37] bg-[#D4AF37]/10"
                  : "border-gray-800 bg-black hover:border-gray-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-black uppercase">
                  Double Leg
                </p>

                {fixtureFormat ===
                  "double_leg" && (
                  <span className="text-[#D4AF37]">
                    ✓
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm text-gray-500">
                Each participant plays every
                opponent twice.
              </p>
            </button>

          </div>
        </section>

        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
              Error
            </p>

            <p className="mt-2 text-sm font-semibold text-red-300">
              {error}
            </p>
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mt-6 rounded-xl border border-green-500/30 bg-green-500/10 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-400">
              Success
            </p>

            <p className="mt-2 text-sm font-semibold text-green-300">
              {success}
            </p>
          </div>
        )}

        {/* STATISTICS */}

        <section className="mt-8 grid gap-4 md:grid-cols-4">

          <div className="rounded-xl border border-[#D4AF37]/20 bg-[#111111] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              Approved Participants
            </p>

            <p className="mt-2 text-3xl font-black text-white">
              {approvedRegistrations.length}
            </p>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-[#111111] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              Teams
            </p>

            <p className="mt-2 text-3xl font-black text-blue-400">
              {teamsCount}
            </p>
          </div>

          <div className="rounded-xl border border-purple-500/20 bg-[#111111] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              Players
            </p>

            <p className="mt-2 text-3xl font-black text-purple-400">
              {playersCount}
            </p>
          </div>

          <div className="rounded-xl border border-green-500/20 bg-[#111111] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              Matches
            </p>

            <p className="mt-2 text-3xl font-black text-green-400">
              {matches.length}
            </p>
          </div>

        </section>

        {/* INFORMATION */}

        <section className="mt-8 rounded-2xl border border-gray-800 bg-[#111111] p-6">

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Automatic Fixture Generation
          </p>

          <h2 className="mt-2 text-xl font-black uppercase">
            Approved Participants
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
            The group fixture engine uses the
            participants already assigned to
            tournament groups. It creates the
            required matchups automatically and
            prevents duplicate fixtures.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">

            <div className="rounded-xl border border-gray-800 bg-black p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
                Participant Pool
              </p>

              <p className="mt-2 text-sm font-bold text-white">
                Approved registrations
              </p>
            </div>

            <div className="rounded-xl border border-gray-800 bg-black p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
                Match Assignment
              </p>

              <p className="mt-2 text-sm font-bold text-white">
                Group fixture engine
              </p>
            </div>

            <div className="rounded-xl border border-gray-800 bg-black p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
                Opponent Selection
              </p>

              <p className="mt-2 text-sm font-bold text-white">
                Automatic
              </p>
            </div>

          </div>

        </section>

        {/* GENERATED FIXTURES */}

        <section className="mt-8 overflow-hidden rounded-2xl border border-gray-800 bg-[#111111]">

          <div className="border-b border-gray-800 px-6 py-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Generated Fixtures
            </p>

            <p className="mt-2 text-sm text-gray-400">
              Tournament matches generated from
              the group-stage participant pool.
            </p>
          </div>

          {matches.length === 0 ? (
            <div className="px-6 py-20 text-center">

              <div className="text-4xl">
                ⚔️
              </div>

              <h3 className="mt-4 text-lg font-black uppercase">
                No Fixtures Generated
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-500">
                Assign approved participants to
                groups, choose a fixture format,
                then generate fixtures.
              </p>

            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">

                <p className="text-xs font-semibold text-gray-400">
                  {matches.length} total fixture
                  {matches.length === 1
                    ? ""
                    : "s"}
                </p>

                <p className="text-xs text-gray-500">
                  {completedMatches} completed
                </p>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full min-w-[900px]">

                  <thead>
                    <tr className="border-b border-gray-800 bg-black/40 text-left text-[10px] uppercase tracking-wider text-gray-500">

                      <th className="px-6 py-4">
                        Match
                      </th>

                      <th className="px-6 py-4">
                        Round
                      </th>

                      <th className="px-6 py-4">
                        Participant A
                      </th>

                      <th className="px-6 py-4">
                        Participant B
                      </th>

                      <th className="px-6 py-4">
                        Score
                      </th>

                      <th className="px-6 py-4">
                        Status
                      </th>

                      <th className="px-6 py-4 text-right">
                        Action
                      </th>

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-800">

                    {matches.map(
                      (match, index) => {
                        const participantA =
                          getParticipantFromMatch(
                            match,
                            registrations,
                            "a"
                          );

                        const participantB =
                          getParticipantFromMatch(
                            match,
                            registrations,
                            "b"
                          );

                        const status =
                          normalize(
                            match.status
                          );

                        const isCompleted =
                          status ===
                          "completed";

                        return (
                          <tr
                            key={
                              match.id
                            }
                            className="transition hover:bg-white/[0.02]"
                          >

                            <td className="px-6 py-5">
                              <p className="font-bold text-white">
                                #
                                {match.match_number ??
                                  index + 1}
                              </p>
                            </td>

                            <td className="px-6 py-5 text-sm text-gray-400">
                              {match.round ??
                                "Round 1"}
                            </td>

                            <td className="px-6 py-5">
                              <p className="font-bold text-white">
                                {participantA}
                              </p>
                            </td>

                            <td className="px-6 py-5">
                              <p className="font-bold text-white">
                                {participantB}
                              </p>
                            </td>

                            <td className="px-6 py-5">
                              <p className="font-bold text-white">
                                {match.score_team_a ??
                                  0}{" "}
                                -{" "}
                                {match.score_team_b ??
                                  0}
                              </p>
                            </td>

                            <td className="px-6 py-5">

                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${
                                  isCompleted
                                    ? "border-green-500/30 bg-green-500/10 text-green-400"
                                    : "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]"
                                }`}
                              >
                                {match.status ??
                                  "Scheduled"}
                              </span>

                            </td>

                            <td className="px-6 py-5 text-right">

                              <Link
                                href={`/admin/tournaments/${tournamentId}/matches/${match.id}`}
                                className="inline-flex rounded-lg border border-gray-800 bg-black px-4 py-2 text-xs font-semibold text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-white"
                              >
                                Manage
                              </Link>

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>
            </>
          )}

        </section>

        {/* FOOTER */}

        <div className="mt-8 flex flex-col gap-3 border-t border-gray-800 pt-6 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex flex-wrap gap-3">

            <Link
              href={`/admin/tournaments/${tournamentId}/participants`}
              className="rounded-lg border border-gray-800 bg-[#111111] px-5 py-3 text-sm font-semibold text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-white"
            >
              ← View Participants
            </Link>

            <Link
              href={`/admin/tournaments/${tournamentId}/registrations`}
              className="rounded-lg border border-gray-800 bg-[#111111] px-5 py-3 text-sm font-semibold text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-white"
            >
              View Registrations
            </Link>

          </div>

          <Link
            href={`/admin/tournaments/${tournamentId}/matches`}
            className="rounded-lg bg-[#D4AF37] px-5 py-3 text-sm font-bold text-black transition hover:opacity-90"
          >
            Manage Matches →
          </Link>

        </div>

      </div>
    </main>
  );
}