"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

interface Group {
  id: number;
  tournament_id: number;
  group_name: string;
  group_code: string | null;
  group_order: number;
  status: string | null;
}

interface GroupMember {
  id: number;
  tournament_group_id: number;
  registration_id: number;
  seed_number: number | null;
}

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
}

interface GroupsResponse {
  success?: boolean;
  message?: string;
  groups?: Group[];
  members?: GroupMember[];
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
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getParticipantName(registration: Registration): string {
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

function getTournamentIdFromParams(
  paramsId: string | string[] | undefined
): number | null {
  if (Array.isArray(paramsId)) {
    const value = Number(paramsId[0]);

    if (Number.isInteger(value) && value > 0) {
      return value;
    }
  }

  if (typeof paramsId === "string") {
    const value = Number(paramsId);

    if (Number.isInteger(value) && value > 0) {
      return value;
    }
  }

  return null;
}

function getTournamentIdFromBrowserUrl(): number | null {
  if (typeof window === "undefined") {
    return null;
  }

  const pathname = window.location.pathname;

  /*
   * Supports URLs such as:
   *
   * /admin/tournaments/20/fixtures
   * /admin/tournaments/20/groups/fixtures
   *
   * We specifically look for the number immediately
   * after /tournaments/.
   */

  const match = pathname.match(
    /\/tournaments\/(\d+)(?:\/|$)/
  );

  if (!match) {
    return null;
  }

  const value = Number(match[1]);

  if (Number.isInteger(value) && value > 0) {
    return value;
  }

  return null;
}

export default function GroupFixturesPage() {
  const params = useParams();

  const paramsId = Array.isArray(params.id)
    ? params.id
    : typeof params.id === "string"
      ? params.id
      : undefined;

  const [browserTournamentId, setBrowserTournamentId] =
    useState<number | null>(null);

  const [groups, setGroups] = useState<Group[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  const [fixtureFormat, setFixtureFormat] = useState<
    "single_leg" | "double_leg"
  >("single_leg");

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /*
   * Resolve the tournament ID from BOTH sources.
   *
   * Params is preferred.
   * Browser URL is the fallback.
   */

  const tournamentId = useMemo(() => {
    return (
      getTournamentIdFromParams(paramsId) ??
      browserTournamentId
    );
  }, [paramsId, browserTournamentId]);

  /*
   * Read the browser URL after the component mounts.
   */

  useEffect(() => {
    const idFromUrl =
      getTournamentIdFromBrowserUrl();

    if (idFromUrl !== null) {
      setBrowserTournamentId(idFromUrl);
    }
  }, []);

  /*
   * Helpful debugging information.
   *
   * This can be removed later.
   */

  useEffect(() => {
    console.log(
      "GROUP FIXTURES TOURNAMENT ID:",
      tournamentId
    );

    console.log(
      "GROUP FIXTURES PARAM ID:",
      paramsId
    );

    if (typeof window !== "undefined") {
      console.log(
        "GROUP FIXTURES URL:",
        window.location.pathname
      );
    }
  }, [tournamentId, paramsId]);

  /*
   * ============================================================
   * LOAD DATA
   * ============================================================
   */

  const loadData = useCallback(async () => {
    /*
     * Always resolve the ID again immediately before
     * making the requests.
     */

    const resolvedTournamentId =
      tournamentId ??
      getTournamentIdFromParams(paramsId) ??
      getTournamentIdFromBrowserUrl();

    if (resolvedTournamentId === null) {
      setError(
        "A valid tournament ID could not be determined from the page URL."
      );

      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [
        groupsResponse,
        registrationsResponse,
        matchesResponse,
      ] = await Promise.all([
        fetch(
          `/api/tournaments/${resolvedTournamentId}/groups`,
          {
            cache: "no-store",
          }
        ),

        fetch(
          `/api/tournament-registrations?tournament_id=${resolvedTournamentId}`,
          {
            cache: "no-store",
          }
        ),

        fetch(
          `/api/matches?tournament_id=${resolvedTournamentId}`,
          {
            cache: "no-store",
          }
        ),
      ]);

      const groupsResult =
        (await groupsResponse.json()) as GroupsResponse;

      const registrationsResult =
        (await registrationsResponse.json()) as RegistrationsResponse;

      const matchesResult =
        (await matchesResponse.json()) as MatchesResponse;

      if (
        !groupsResponse.ok ||
        !groupsResult.success
      ) {
        throw new Error(
          groupsResult.message ??
            "Failed to load groups."
        );
      }

      if (
        !registrationsResponse.ok ||
        !registrationsResult.success
      ) {
        throw new Error(
          registrationsResult.message ??
            "Failed to load registrations."
        );
      }

      if (
        !matchesResponse.ok ||
        !matchesResult.success
      ) {
        throw new Error(
          matchesResult.message ??
            "Failed to load matches."
        );
      }

      setGroups(
        Array.isArray(groupsResult.groups)
          ? groupsResult.groups
          : []
      );

      setGroupMembers(
        Array.isArray(groupsResult.members)
          ? groupsResult.members
          : []
      );

      setRegistrations(
        Array.isArray(
          registrationsResult.registrations
        )
          ? registrationsResult.registrations
          : []
      );

      setMatches(
        Array.isArray(matchesResult.matches)
          ? matchesResult.matches
          : []
      );
    } catch (loadError) {
      console.error(
        "Group fixtures loading error:",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load group fixtures."
      );
    } finally {
      setLoading(false);
    }
  }, [tournamentId, paramsId]);

  /*
   * Load when the ID becomes available.
   */

  useEffect(() => {
    if (tournamentId !== null) {
      loadData();
    }
  }, [tournamentId, loadData]);

  /*
   * ============================================================
   * GENERATE FIXTURES
   * ============================================================
   */

  async function generateFixtures() {
    /*
     * IMPORTANT:
     * Resolve the ID again at the exact moment the button
     * is clicked.
     */

    const resolvedTournamentId =
      tournamentId ??
      getTournamentIdFromParams(paramsId) ??
      getTournamentIdFromBrowserUrl();

    console.log(
      "GENERATE GROUP FIXTURES ID:",
      resolvedTournamentId
    );

    if (resolvedTournamentId === null) {
      setError(
        "A valid tournament ID could not be determined. Please check that the page URL contains /tournaments/[id]/."
      );

      return;
    }

    try {
      setGenerating(true);
      setError(null);
      setSuccess(null);

      /*
       * This MUST match the API route:
       *
       * app/api/tournaments/[id]/groups/fixtures/route.ts
       */

      const endpoint =
        `/api/tournaments/${resolvedTournamentId}/groups/fixtures`;

      console.log(
        "GENERATING GROUP FIXTURES:",
        endpoint
      );

      const response = await fetch(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            fixtureFormat,
          }),
        }
      );

      const result =
        await response.json();

      console.log(
        "GROUP FIXTURE GENERATION RESULT:",
        result
      );

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ??
            "Failed to generate group fixtures."
        );
      }

      setSuccess(
        result.message ??
          "Group fixtures generated successfully."
      );

      await loadData();
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
   * ============================================================
   * APPROVED REGISTRATIONS
   * ============================================================
   */

  const approvedRegistrations = useMemo(() => {
    return registrations.filter(
      (registration) =>
        normalize(registration.status) ===
        "approved"
    );
  }, [registrations]);

  /*
   * ============================================================
   * GROUP DATA
   * ============================================================
   */

  const groupData = useMemo(() => {
    return groups.map((group) => {
      const members = groupMembers
        .filter(
          (member) =>
            member.tournament_group_id ===
            group.id
        )
        .sort(
          (a, b) =>
            (a.seed_number ?? 999) -
            (b.seed_number ?? 999)
        );

      const groupMatches = matches
        .filter((match) => {
          const round =
            normalize(match.round);

          const groupName =
            normalize(group.group_name);

          const groupCode =
            normalize(group.group_code);

          return (
            round.startsWith(groupName) ||
            (groupCode !== "" &&
              round.includes(groupCode))
          );
        })
        .sort(
          (a, b) =>
            (a.match_number ?? 999999) -
            (b.match_number ?? 999999)
        );

      return {
        group,
        members,
        groupMatches,
      };
    });
  }, [
    groups,
    groupMembers,
    matches,
  ]);

  /*
   * ============================================================
   * TOTALS
   * ============================================================
   */

  const totalFixtures = useMemo(() => {
    return matches.filter((match) =>
      normalize(match.round).includes(
        "group"
      )
    ).length;
  }, [matches]);

  const completedFixtures = useMemo(() => {
    return matches.filter(
      (match) =>
        normalize(match.round).includes(
          "group"
        ) &&
        normalize(match.status) ===
          "completed"
    ).length;
  }, [matches]);

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080808] text-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="animate-pulse">
            <div className="h-5 w-40 rounded bg-white/10" />

            <div className="mt-5 h-10 w-80 rounded bg-white/10" />

            <div className="mt-3 h-4 w-[28rem] max-w-full rounded bg-white/10" />

            <div className="mt-8 h-40 rounded-2xl bg-white/5" />
          </div>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-8">

        {/* TOP NAV */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <Link
            href={
              tournamentId
                ? `/admin/tournaments/${tournamentId}/groups`
                : "/admin/tournaments"
            }
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-gray-400 transition hover:text-[#D4AF37]"
          >
            ← Back to Groups
          </Link>

          <div className="flex flex-wrap gap-2">

            <Link
              href={
                tournamentId
                  ? `/admin/tournaments/${tournamentId}/groups`
                  : "/admin/tournaments"
              }
              className="rounded-lg border border-gray-800 bg-[#111111] px-4 py-2 text-xs font-semibold text-gray-300 hover:border-[#D4AF37]/40 hover:text-white"
            >
              Groups
            </Link>

            <span className="rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-black">
              Group Fixtures
            </span>

            <Link
              href={
                tournamentId
                  ? `/admin/tournaments/${tournamentId}/standings`
                  : "/admin/tournaments"
              }
              className="rounded-lg border border-gray-800 bg-[#111111] px-4 py-2 text-xs font-semibold text-gray-300 hover:border-[#D4AF37]/40 hover:text-white"
            >
              Standings
            </Link>

            <Link
              href={
                tournamentId
                  ? `/admin/tournaments/${tournamentId}/knockout`
                  : "/admin/tournaments"
              }
              className="rounded-lg border border-gray-800 bg-[#111111] px-4 py-2 text-xs font-semibold text-gray-300 hover:border-[#D4AF37]/40 hover:text-white"
            >
              Knockout
            </Link>

          </div>
        </div>

        {/* HEADER */}

        <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
              Group Stage
            </p>

            <h1 className="mt-2 text-4xl font-black uppercase tracking-tight">
              Group Fixtures
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
              Generate round-robin fixtures
              for the participants already
              assigned to each group.
            </p>

            {tournamentId && (
              <p className="mt-3 text-xs text-gray-600">
                Tournament ID:{" "}
                <span className="font-bold text-gray-400">
                  {tournamentId}
                </span>
              </p>
            )}

          </div>

          <button
            type="button"
            onClick={generateFixtures}
            disabled={
              generating ||
              groups.length === 0 ||
              tournamentId === null
            }
            className="rounded-lg bg-[#D4AF37] px-6 py-3 text-sm font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating
              ? "Generating..."
              : "Generate Group Fixtures"}
          </button>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm font-semibold text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mt-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
            <p className="text-sm font-semibold text-green-400">
              {success}
            </p>
          </div>
        )}

        {/* SETTINGS */}

        <section className="mt-8 rounded-2xl border border-gray-800 bg-[#111111] p-6">

          <div className="grid gap-6 md:grid-cols-3">

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                Groups
              </p>

              <p className="mt-2 text-3xl font-black">
                {groups.length}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                Group Fixtures
              </p>

              <p className="mt-2 text-3xl font-black">
                {totalFixtures}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                Completed
              </p>

              <p className="mt-2 text-3xl font-black text-green-400">
                {completedFixtures}
              </p>
            </div>

          </div>

          <div className="mt-6 border-t border-gray-800 pt-6">

            <label
              htmlFor="fixture-format"
              className="block text-sm font-semibold text-gray-300"
            >
              Fixture Format
            </label>

            <select
              id="fixture-format"
              value={fixtureFormat}
              onChange={(event) =>
                setFixtureFormat(
                  event.target.value ===
                    "double_leg"
                    ? "double_leg"
                    : "single_leg"
                )
              }
              disabled={generating}
              className="mt-2 w-full max-w-md rounded-lg border border-gray-700 bg-black px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
            >
              <option value="single_leg">
                Single Leg — each participant plays each opponent once
              </option>

              <option value="double_leg">
                Double Leg — each participant plays each opponent twice
              </option>
            </select>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              Single Leg means every participant
              plays every other participant in
              the same group exactly once.
            </p>

          </div>

        </section>

        {/* NO GROUPS */}

        {groups.length === 0 && (
          <section className="mt-8 rounded-2xl border border-[#D4AF37]/20 bg-[#111111] p-10 text-center">

            <div className="text-4xl">
              🏆
            </div>

            <h2 className="mt-4 text-xl font-black uppercase">
              No Groups Found
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm text-gray-400">
              Create and populate your
              tournament groups before
              generating fixtures.
            </p>

            <Link
              href={
                tournamentId
                  ? `/admin/tournaments/${tournamentId}/groups`
                  : "/admin/tournaments"
              }
              className="mt-6 inline-flex rounded-lg bg-[#D4AF37] px-6 py-3 text-sm font-bold text-black"
            >
              Configure Groups →
            </Link>

          </section>
        )}

        {/* GROUPS */}

        {groupData.length > 0 && (
          <div className="mt-8 space-y-6">

            {groupData.map(
              ({
                group,
                members,
                groupMatches,
              }) => (
                <section
                  key={group.id}
                  className="overflow-hidden rounded-2xl border border-gray-800 bg-[#111111]"
                >

                  {/* GROUP HEADER */}

                  <div className="flex flex-col gap-4 border-b border-gray-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                        Group Stage
                      </p>

                      <h2 className="mt-1 text-2xl font-black uppercase">
                        {group.group_name}
                      </h2>

                    </div>

                    <div className="flex items-center gap-3">

                      <span className="rounded-lg border border-[#D4AF37]/30 px-3 py-1 text-xs font-bold text-[#D4AF37]">
                        {group.group_code ??
                          `GROUP ${String.fromCharCode(
                            65 +
                              Math.max(
                                0,
                                group.group_order -
                                  1
                              )
                          )}`}
                      </span>

                      <span className="text-xs text-gray-500">
                        {members.length}{" "}
                        participants
                      </span>

                    </div>

                  </div>

                  {/* PARTICIPANTS */}

                  <div className="border-b border-gray-800 px-6 py-5">

                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Participants
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">

                      {members.map(
                        (member) => {
                          const registration =
                            approvedRegistrations.find(
                              (item) =>
                                item.id ===
                                member.registration_id
                            );

                          if (!registration) {
                            return null;
                          }

                          return (
                            <span
                              key={member.id}
                              className="rounded-lg border border-gray-800 bg-black px-3 py-2 text-xs font-semibold text-gray-300"
                            >
                              {getParticipantName(
                                registration
                              )}
                            </span>
                          );
                        }
                      )}

                    </div>

                  </div>

                  {/* FIXTURES */}

                  <div className="p-6">

                    <div className="flex items-center justify-between">

                      <div>

                        <h3 className="text-lg font-black uppercase">
                          Fixtures
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          {groupMatches.length}{" "}
                          fixture
                          {groupMatches.length ===
                          1
                            ? ""
                            : "s"}
                        </p>

                      </div>

                    </div>

                    {groupMatches.length ===
                    0 ? (
                      <div className="mt-5 rounded-xl border border-dashed border-gray-800 bg-black/20 p-8 text-center">

                        <p className="text-sm font-semibold text-gray-400">
                          No fixtures generated
                          yet.
                        </p>

                        <p className="mt-1 text-xs text-gray-600">
                          Use the Generate Group
                          Fixtures button above.
                        </p>

                      </div>
                    ) : (
                      <div className="mt-5 overflow-x-auto">

                        <table className="w-full min-w-[700px]">

                          <thead>

                            <tr className="border-b border-gray-800 text-left text-[10px] uppercase tracking-wider text-gray-500">

                              <th className="px-4 py-3">
                                Match
                              </th>

                              <th className="px-4 py-3">
                                Round
                              </th>

                              <th className="px-4 py-3">
                                Status
                              </th>

                              <th className="px-4 py-3 text-center">
                                Action
                              </th>

                            </tr>

                          </thead>

                          <tbody className="divide-y divide-gray-800">

                            {groupMatches.map(
                              (match) => {

                                const registrationA =
                                  approvedRegistrations.find(
                                    (
                                      registration
                                    ) =>
                                      match.player_a_id ===
                                        registration.player_id ||
                                      match.team_a_id ===
                                        registration.team_id
                                  );

                                const registrationB =
                                  approvedRegistrations.find(
                                    (
                                      registration
                                    ) =>
                                      match.player_b_id ===
                                        registration.player_id ||
                                      match.team_b_id ===
                                        registration.team_id
                                  );

                                const participantA =
                                  registrationA
                                    ? getParticipantName(
                                        registrationA
                                      )
                                    : "TBD";

                                const participantB =
                                  registrationB
                                    ? getParticipantName(
                                        registrationB
                                      )
                                    : "TBD";

                                return (
                                  <tr
                                    key={
                                      match.id
                                    }
                                    className="transition hover:bg-white/[0.02]"
                                  >

                                    <td className="px-4 py-4">

                                      <div className="flex flex-col">

                                        <span className="font-bold text-white">
                                          #{match.match_number ??
                                            match.id}
                                        </span>

                                        <span className="mt-1 text-sm font-semibold text-gray-300">
                                          {participantA}
                                        </span>

                                        <span className="my-1 text-[10px] font-bold uppercase text-[#D4AF37]">
                                          vs
                                        </span>

                                        <span className="text-sm font-semibold text-gray-300">
                                          {participantB}
                                        </span>

                                      </div>

                                    </td>

                                    <td className="px-4 py-4 text-xs text-gray-400">
                                      {match.round ??
                                        "Group Stage"}
                                    </td>

                                    <td className="px-4 py-4">

                                      <span
                                        className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase ${
                                          normalize(
                                            match.status
                                          ) ===
                                          "completed"
                                            ? "bg-green-500/10 text-green-400"
                                            : "bg-yellow-500/10 text-yellow-400"
                                        }`}
                                      >
                                        {match.status ??
                                          "Scheduled"}
                                      </span>

                                    </td>

                                    <td className="px-4 py-4 text-center">

                                      {tournamentId ? (
                                        <Link
                                          href={`/admin/tournaments/${tournamentId}/matches/${match.id}`}
                                          className="inline-flex rounded-lg border border-gray-800 bg-black px-3 py-2 text-xs font-semibold text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-white"
                                        >
                                          Manage
                                        </Link>
                                      ) : (
                                        <span className="text-xs text-gray-600">
                                          Unavailable
                                        </span>
                                      )}

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

                </section>
              )
            )}

          </div>
        )}

        {/* FOOTER */}

        <div className="mt-8 flex flex-col gap-3 border-t border-gray-800 pt-6 sm:flex-row sm:items-center sm:justify-between">

          <Link
            href={
              tournamentId
                ? `/admin/tournaments/${tournamentId}/groups`
                : "/admin/tournaments"
            }
            className="text-sm font-medium text-gray-400 hover:text-[#D4AF37]"
          >
            ← Return to Groups
          </Link>

          <div className="flex flex-wrap gap-3">

            <Link
              href={
                tournamentId
                  ? `/admin/tournaments/${tournamentId}/standings`
                  : "/admin/tournaments"
              }
              className="rounded-lg border border-gray-800 bg-[#111111] px-5 py-3 text-sm font-semibold text-gray-300 hover:border-[#D4AF37]/40 hover:text-white"
            >
              View Standings
            </Link>

            <Link
              href={
                tournamentId
                  ? `/admin/tournaments/${tournamentId}/knockout`
                  : "/admin/tournaments"
              }
              className="rounded-lg bg-[#D4AF37] px-5 py-3 text-sm font-bold text-black hover:opacity-90"
            >
              Knockout Bracket →
            </Link>

          </div>

        </div>

      </div>
    </main>
  );
}