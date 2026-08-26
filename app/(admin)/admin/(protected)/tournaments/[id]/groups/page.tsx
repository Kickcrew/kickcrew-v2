"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

interface Team {
  id: number;
  team_name: string;
}

interface Player {
  id: number;
  full_name: string | null;
  gamer_tag: string | null;
}

interface Registration {
  id: number;
  tournament_id: number;
  team_id: number | null;
  player_id: number | null;
  status: string;
  teams?: Team | Team[] | null;
  players?: Player | Player[] | null;
}

interface TournamentGroup {
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

  registration?: Registration | null;

  team_id?: number | null;
  player_id?: number | null;

  team_name?: string | null;
  gamer_tag?: string | null;
  full_name?: string | null;

  type?: "Team" | "Player";
  name?: string | null;
}

interface GroupsResponse {
  success?: boolean;
  message?: string;
  groups?: TournamentGroup[];
  members?: GroupMember[];
  participants?: GroupMember[];
}

interface RegistrationsResponse {
  success?: boolean;
  message?: string;
  registrations?: Registration[];
}

interface GenerateResponse {
  success?: boolean;
  message?: string;
  groups?: TournamentGroup[];
  members?: GroupMember[];
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getRelatedTeam(
  registration: Registration
): Team | null {
  const teams = registration.teams;

  if (Array.isArray(teams)) {
    return teams[0] ?? null;
  }

  return teams ?? null;
}

function getRelatedPlayer(
  registration: Registration
): Player | null {
  const players = registration.players;

  if (Array.isArray(players)) {
    return players[0] ?? null;
  }

  return players ?? null;
}

function getParticipantName(
  registration: Registration
): string {
  if (registration.team_id !== null) {
    const team = getRelatedTeam(registration);

    return (
      team?.team_name ??
      `Team #${registration.team_id}`
    );
  }

  if (registration.player_id !== null) {
    const player = getRelatedPlayer(registration);

    return (
      player?.gamer_tag ??
      player?.full_name ??
      `Player #${registration.player_id}`
    );
  }

  return `Registration #${registration.id}`;
}

function getParticipantType(
  registration: Registration
): "Team" | "Player" {
  return registration.team_id !== null
    ? "Team"
    : "Player";
}

function getMemberName(
  member: GroupMember,
  registrations: Registration[]
): string {
  /*
   * First use the information returned directly
   * by the group API.
   */

  if (
    member.name &&
    !/^player\s*#/i.test(member.name) &&
    !/^team\s*#/i.test(member.name)
  ) {
    return member.name;
  }

  if (member.team_name) {
    return member.team_name;
  }

  if (member.gamer_tag) {
    return member.gamer_tag;
  }

  if (member.full_name) {
    return member.full_name;
  }

  /*
   * Then find the original registration.
   */

  const registration =
    member.registration ??
    registrations.find(
      (item) =>
        item.id === member.registration_id
    );

  if (registration) {
    return getParticipantName(registration);
  }

  /*
   * Final fallback.
   */

  if (
    member.player_id !== null &&
    member.player_id !== undefined
  ) {
    return `Player #${member.player_id}`;
  }

  if (
    member.team_id !== null &&
    member.team_id !== undefined
  ) {
    return `Team #${member.team_id}`;
  }

  return `Registration #${member.registration_id}`;
}

function getMemberType(
  member: GroupMember,
  registrations: Registration[]
): "Team" | "Player" {
  if (member.type === "Team") {
    return "Team";
  }

  if (member.type === "Player") {
    return "Player";
  }

  if (
    member.team_id !== null &&
    member.team_id !== undefined
  ) {
    return "Team";
  }

  if (
    member.player_id !== null &&
    member.player_id !== undefined
  ) {
    return "Player";
  }

  const registration =
    member.registration ??
    registrations.find(
      (item) =>
        item.id === member.registration_id
    );

  if (registration) {
    return getParticipantType(registration);
  }

  return "Player";
}

function getGroupCode(
  group: TournamentGroup
): string {
  if (group.group_code) {
    return group.group_code;
  }

  const order =
    Number(group.group_order);

  if (
    Number.isInteger(order) &&
    order > 0
  ) {
    return String.fromCharCode(
      64 + order
    );
  }

  return group.group_name
    .replace(/group/gi, "")
    .trim()
    .toUpperCase();
}

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function TournamentGroupsPage() {
  const params = useParams();
  const router = useRouter();

  const tournamentId = Array.isArray(params.id)
    ? params.id[0]
    : String(params.id ?? "");

  /*
   * State
   */

  const [groups, setGroups] =
    useState<TournamentGroup[]>([]);

  const [members, setMembers] =
    useState<GroupMember[]>([]);

  const [registrations, setRegistrations] =
    useState<Registration[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [generating, setGenerating] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | LOAD GROUP DATA
  |--------------------------------------------------------------------------
  */

  async function loadGroups(
    showRefreshing = false
  ) {
    if (!tournamentId) {
      setError(
        "A valid tournament ID is required."
      );

      setLoading(false);

      return;
    }

    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      /*
       * Load groups and registrations
       * together.
       */

      const [
        groupsResponse,
        registrationsResponse,
      ] = await Promise.all([
        fetch(
          `/api/tournaments/${tournamentId}/groups`,
          {
            method: "GET",
            cache: "no-store",
          }
        ),

        fetch(
          `/api/tournament-registrations?tournament_id=${encodeURIComponent(
            tournamentId
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        ),
      ]);

      const groupsResult =
        (await groupsResponse.json()) as GroupsResponse;

      const registrationsResult =
        (await registrationsResponse.json()) as RegistrationsResponse;

      /*
       * GROUPS
       */

      if (
        !groupsResponse.ok ||
        groupsResult.success === false
      ) {
        throw new Error(
          groupsResult.message ??
            "Failed to load tournament groups."
        );
      }

      /*
       * REGISTRATIONS
       *
       * This is allowed to fail independently
       * because the group API may already return
       * participant information.
       */

      if (
        registrationsResponse.ok &&
        registrationsResult.success !== false
      ) {
        setRegistrations(
          Array.isArray(
            registrationsResult.registrations
          )
            ? registrationsResult.registrations
            : []
        );
      } else {
        setRegistrations([]);
      }

      setGroups(
        Array.isArray(groupsResult.groups)
          ? groupsResult.groups
          : []
      );

      /*
       * Some versions of the API return
       * members while others may return
       * participants.
       */

      const returnedMembers =
        Array.isArray(groupsResult.members)
          ? groupsResult.members
          : Array.isArray(
                groupsResult.participants
              )
            ? groupsResult.participants
            : [];

      setMembers(returnedMembers);
    } catch (loadError) {
      console.error(
        "Failed to load tournament groups:",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load tournament groups."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadGroups();
  }, [tournamentId]);

  /*
  |--------------------------------------------------------------------------
  | GROUP MEMBERS
  |--------------------------------------------------------------------------
  */

  const membersByGroup =
    useMemo(() => {
      const map =
        new Map<number, GroupMember[]>();

      groups.forEach((group) => {
        map.set(group.id, []);
      });

      members.forEach((member) => {
        const existing =
          map.get(
            member.tournament_group_id
          );

        if (existing) {
          existing.push(member);
        } else {
          map.set(
            member.tournament_group_id,
            [member]
          );
        }
      });

      /*
       * Sort every group by seed.
       */

      map.forEach((groupMembers) => {
        groupMembers.sort(
          (a, b) =>
            (a.seed_number ?? 999) -
            (b.seed_number ?? 999)
        );
      });

      return map;
    }, [groups, members]);

  /*
  |--------------------------------------------------------------------------
  | APPROVED REGISTRATIONS
  |--------------------------------------------------------------------------
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

  /*
  |--------------------------------------------------------------------------
  | PARTICIPANT COUNT
  |--------------------------------------------------------------------------
  */

  const assignedParticipantIds =
    useMemo(() => {
      return new Set(
        members.map(
          (member) =>
            member.registration_id
        )
      );
    }, [members]);

  /*
  |--------------------------------------------------------------------------
  | GENERATE GROUPS
  |--------------------------------------------------------------------------
  */

  async function handleGenerateGroups() {
    if (!tournamentId) {
      setError(
        "A valid tournament ID is required."
      );

      return;
    }

    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/groups/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      const result =
        (await response.json()) as GenerateResponse;

      if (
        !response.ok ||
        result.success === false
      ) {
        throw new Error(
          result.message ??
            "Failed to generate tournament groups."
        );
      }

      setSuccess(
        result.message ??
          "Groups generated successfully."
      );

      /*
       * Reload the actual database state.
       */

      await loadGroups(true);

      router.refresh();
    } catch (generateError) {
      console.error(
        "Group generation error:",
        generateError
      );

      setError(
        generateError instanceof Error
          ? generateError.message
          : "Failed to generate tournament groups."
      );
    } finally {
      setGenerating(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080808] text-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-4 w-40 rounded bg-white/10" />

            <div className="h-10 w-72 rounded bg-white/10" />

            <div className="h-5 w-[520px] max-w-full rounded bg-white/10" />

            <div className="h-32 rounded-2xl bg-white/5" />

            <div className="grid gap-6 md:grid-cols-2">
              <div className="h-56 rounded-2xl bg-white/5" />
              <div className="h-56 rounded-2xl bg-white/5" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-8">

        {/* =================================================
            TOP NAVIGATION
        ================================================= */}

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
              className="rounded-lg border border-gray-800 bg-[#111111] px-4 py-2 text-xs font-semibold text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-white"
            >
              Fixtures
            </Link>

            <Link
              href={`/admin/tournaments/${tournamentId}/matches`}
              className="rounded-lg border border-gray-800 bg-[#111111] px-4 py-2 text-xs font-semibold text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-white"
            >
              Matches
            </Link>

            <Link
              href={`/admin/tournaments/${tournamentId}/groups/standings`}
              className="rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-black"
            >
              Standings & Results
            </Link>

          </div>
        </div>

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
              Tournament Management
            </p>

            <h1 className="mt-2 text-4xl font-black uppercase tracking-tight text-white">
              Tournament Groups
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
              Configure the group stage, review
              participant assignments, and continue
              to tournament standings and results.
            </p>

          </div>

          <div className="rounded-xl border border-[#D4AF37]/30 bg-[#111111] px-5 py-4">

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              Tournament ID
            </p>

            <p className="mt-1 text-sm font-black text-[#D4AF37]">
              #{tournamentId}
            </p>

          </div>

        </div>

        {/* =================================================
            QUICK NAVIGATION
        ================================================= */}

        <div className="mt-6 grid gap-3 md:grid-cols-4">

          <Link
            href={`/admin/tournaments/${tournamentId}`}
            className="rounded-xl border border-gray-800 bg-[#111111] p-4 transition hover:border-[#D4AF37]/40"
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
              Tournament
            </p>

            <p className="mt-1 text-sm font-bold">
              Dashboard →
            </p>
          </Link>

          <Link
            href={`/admin/tournaments/${tournamentId}/participants`}
            className="rounded-xl border border-gray-800 bg-[#111111] p-4 transition hover:border-[#D4AF37]/40"
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
              Stage
            </p>

            <p className="mt-1 text-sm font-bold">
              Participants →
            </p>
          </Link>

          <Link
            href={`/admin/tournaments/${tournamentId}/fixtures`}
            className="rounded-xl border border-gray-800 bg-[#111111] p-4 transition hover:border-[#D4AF37]/40"
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
              Stage
            </p>

            <p className="mt-1 text-sm font-bold">
              Fixtures →
            </p>
          </Link>

          <Link
            href={`/admin/tournaments/${tournamentId}/groups/standings`}
            className="rounded-xl border border-[#D4AF37]/40 bg-[#111111] p-4 transition hover:bg-[#151515]"
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]">
              Results
            </p>

            <p className="mt-1 text-sm font-bold">
              Group Standings →
            </p>
          </Link>

        </div>

        {/* =================================================
            GROUP SETUP PANEL
        ================================================= */}

        <section className="mt-6 rounded-2xl border border-[#D4AF37]/30 bg-[#111111] p-5 md:p-6">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <h2 className="text-xl font-black uppercase">
                Group Stage Setup
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Create groups and distribute the
                approved tournament participants.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                onClick={() =>
                  loadGroups(true)
                }
                disabled={
                  refreshing ||
                  generating
                }
                className="rounded-lg border border-gray-800 bg-black px-5 py-3 text-sm font-semibold text-gray-300 transition hover:border-[#D4AF37]/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {refreshing
                  ? "Refreshing..."
                  : "↻ Refresh"}
              </button>

              {groups.length === 0 && (
                <button
                  type="button"
                  onClick={
                    handleGenerateGroups
                  }
                  disabled={
                    generating ||
                    approvedRegistrations.length <
                      2
                  }
                  className="rounded-lg bg-[#D4AF37] px-5 py-3 text-sm font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {generating
                    ? "Generating..."
                    : "Generate Groups →"}
                </button>
              )}

            </div>

          </div>

          {/* SUCCESS */}

          {success && (
            <div className="mt-5 rounded-xl border border-green-500/30 bg-green-500/10 p-4">

              <p className="text-sm font-semibold text-green-400">
                {success}
              </p>

            </div>
          )}

          {/* ERROR */}

          {error && (
            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4">

              <p className="text-sm font-semibold text-red-400">
                {error}
              </p>

            </div>
          )}

          {/* PARTICIPANT INFO */}

          {groups.length === 0 && (
            <div className="mt-5 rounded-xl border border-gray-800 bg-black/30 p-4">

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                    Approved Participants
                  </p>

                  <p className="mt-1 text-sm text-gray-300">
                    {approvedRegistrations.length} approved
                    participant
                    {approvedRegistrations.length ===
                    1
                      ? ""
                      : "s"}{" "}
                    available for grouping.
                  </p>

                </div>

                <Link
                  href={`/admin/tournaments/${tournamentId}/participants`}
                  className="text-sm font-semibold text-[#D4AF37] hover:underline"
                >
                  Review Participants →
                </Link>

              </div>

            </div>
          )}

        </section>

        {/* =================================================
            NO GROUPS
        ================================================= */}

        {groups.length === 0 && (
          <section className="mt-6 rounded-2xl border border-gray-800 bg-[#111111] p-10 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-2xl">
              🏆
            </div>

            <h2 className="mt-5 text-xl font-black uppercase">
              No Groups Created Yet
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-400">
              Generate the group stage once the
              approved participants are ready.
            </p>

            {approvedRegistrations.length <
              2 && (
              <p className="mt-4 text-sm font-semibold text-yellow-400">
                At least 2 approved participants
                are required.
              </p>
            )}

            <button
              type="button"
              onClick={
                handleGenerateGroups
              }
              disabled={
                generating ||
                approvedRegistrations.length <
                  2
              }
              className="mt-6 inline-flex rounded-lg bg-[#D4AF37] px-6 py-3 text-sm font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating
                ? "Generating..."
                : "Generate Groups →"}
            </button>

          </section>
        )}

        {/* =================================================
            GROUPS
        ================================================= */}

        {groups.length > 0 && (
          <section className="mt-6">

            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                  Group Stage
                </p>

                <h2 className="mt-1 text-2xl font-black uppercase">
                  Participant Assignments
                </h2>

              </div>

              <p className="text-xs text-gray-500">
                {groups.length} group
                {groups.length === 1
                  ? ""
                  : "s"} ·{" "}
                {members.length} assigned
                participant
                {members.length === 1
                  ? ""
                  : "s"}
              </p>

            </div>

            <div className="grid gap-6 md:grid-cols-2">

              {groups
                .slice()
                .sort(
                  (a, b) =>
                    (a.group_order ?? 999) -
                    (b.group_order ?? 999)
                )
                .map((group) => {

                  const groupMembers =
                    membersByGroup.get(
                      group.id
                    ) ?? [];

                  return (
                    <article
                      key={group.id}
                      className="overflow-hidden rounded-2xl border border-gray-800 bg-[#111111]"
                    >

                      {/* GROUP HEADER */}

                      <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">

                        <div>

                          <h3 className="text-lg font-black uppercase">
                            {group.group_name}
                          </h3>

                          <p className="mt-0.5 text-[10px] uppercase tracking-[0.15em] text-gray-500">
                            {groupMembers.length}{" "}
                            participant
                            {groupMembers.length ===
                            1
                              ? ""
                              : "s"}
                          </p>

                        </div>

                        <span className="rounded-lg border border-[#D4AF37]/30 px-3 py-1 text-xs font-bold text-[#D4AF37]">
                          {getGroupCode(
                            group
                          )}
                        </span>

                      </div>

                      {/* MEMBERS */}

                      {groupMembers.length ===
                      0 ? (
                        <div className="px-5 py-6 text-sm text-gray-500">
                          No participants assigned.
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-800">

                          {groupMembers.map(
                            (
                              member,
                              index
                            ) => {

                              const name =
                                getMemberName(
                                  member,
                                  registrations
                                );

                              const type =
                                getMemberType(
                                  member,
                                  registrations
                                );

                              return (
                                <div
                                  key={
                                    member.id
                                  }
                                  className="flex items-center gap-4 px-5 py-4 transition hover:bg-white/[0.02]"
                                >

                                  {/* POSITION */}

                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold text-gray-500">

                                    {index ===
                                    0 ? (
                                      <span className="text-[#D4AF37]">
                                        1
                                      </span>
                                    ) : (
                                      index + 1
                                    )}

                                  </div>

                                  {/* PARTICIPANT */}

                                  <div className="min-w-0 flex-1">

                                    <p className="truncate text-sm font-bold text-white">
                                      {name}
                                    </p>

                                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-gray-500">
                                      {type}
                                    </p>

                                  </div>

                                  {/* SEED */}

                                  {member.seed_number !==
                                    null &&
                                    member.seed_number !==
                                      undefined && (
                                      <span className="text-[10px] text-gray-600">
                                        Seed{" "}
                                        {
                                          member.seed_number
                                        }
                                      </span>
                                    )}

                                </div>
                              );
                            }
                          )}

                        </div>
                      )}

                    </article>
                  );
                })}

            </div>

          </section>
        )}

        {/* =================================================
            STATUS / WORKFLOW
        ================================================= */}

        {groups.length > 0 && (
          <section className="mt-8 rounded-2xl border border-gray-800 bg-[#111111] p-6">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                  Next Step
                </p>

                <h2 className="mt-1 text-xl font-black uppercase">
                  Group Fixtures
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
                  The groups have been created and
                  participants assigned. Continue to
                  fixture generation when the group
                  stage is ready.
                </p>

              </div>

              <div className="flex flex-wrap gap-3">

                <Link
                  href={`/admin/tournaments/${tournamentId}/groups/standings`}
                  className="rounded-lg border border-gray-800 bg-black px-5 py-3 text-sm font-semibold text-gray-300 transition hover:border-[#D4AF37]/50 hover:text-white"
                >
                  View Standings →
                </Link>

                <Link
                  href={`/admin/tournaments/${tournamentId}/fixtures`}
                  className="rounded-lg bg-[#D4AF37] px-5 py-3 text-sm font-bold text-black transition hover:opacity-90"
                >
                  Group Fixtures →
                </Link>

              </div>

            </div>

          </section>
        )}

        {/* =================================================
            FOOTER ACTIONS
        ================================================= */}

        <div className="mt-8 border-t border-gray-800 pt-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <Link
              href={`/admin/tournaments/${tournamentId}`}
              className="text-sm font-medium text-gray-400 transition hover:text-[#D4AF37]"
            >
              ← Return to Tournament Dashboard
            </Link>

            <div className="flex flex-wrap gap-3">

              <Link
                href={`/admin/tournaments/${tournamentId}/knockout`}
                className="rounded-lg border border-gray-800 bg-[#111111] px-5 py-3 text-sm font-semibold text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-white"
              >
                Knockout Bracket
              </Link>

              <Link
                href={`/admin/tournaments/${tournamentId}/groups/standings`}
                className="rounded-lg bg-[#D4AF37] px-5 py-3 text-sm font-bold text-black transition hover:opacity-90"
              >
                View Standings →
              </Link>

            </div>

          </div>

        </div>

      </div>
    </main>
  );
}