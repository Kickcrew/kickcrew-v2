"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

interface PlayerRelation {
  id: number;
  full_name: string | null;
  gamer_tag: string | null;
}

interface TeamRelation {
  id: number;
  team_name: string | null;
}

interface Registration {
  id: number;
  tournament_id: number;
  team_id: number | null;
  player_id: number | null;
  status: string;

  /*
   * Supabase nested relations are returned as arrays.
   */
  teams?: TeamRelation[] | null;
  players?: PlayerRelation[] | null;
}

interface Match {
  id: number;
  tournament_id: number;

  team_a_id: number | null;
  team_b_id: number | null;

  player_a_id: number | null;
  player_b_id: number | null;

  round: string | null;
  match_number: number;

  score_team_a: number | null;
  score_team_b: number | null;

  winner_id: number | null;

  status: string | null;
}

interface TournamentGroup {
  id: number;
  tournament_id: number;
  group_name: string;
  group_code?: string | null;
  group_order: number;
  status: string | null;
}

interface GroupMember {
  id: number;
  tournament_group_id: number;
  registration_id: number;
  seed_number: number | null;
}

interface GroupsResponse {
  success?: boolean;
  message?: string;
  groups?: TournamentGroup[];
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

interface Standing {
  id: number;
  registrationId: number;
  name: string;
  type: "Team" | "Player";

  played: number;
  wins: number;
  draws: number;
  losses: number;

  scoreFor: number;
  scoreAgainst: number;

  points: number;
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function isKnockoutRound(round: string | null) {
  const value = normalize(round);

  return (
    value === "final" ||
    value === "3rd place" ||
    value.includes("quarterfinal") ||
    value.includes("quarter-final") ||
    value.includes("semifinal") ||
    value.includes("semi-final") ||
    value.includes("round of 16") ||
    value.includes("round of 32") ||
    value.includes("knockout")
  );
}

/*
|--------------------------------------------------------------------------
| GET PLAYER / TEAM NAME
|--------------------------------------------------------------------------
|
| Supabase nested relations are arrays:
|
| players: [{ id, full_name, gamer_tag }]
| teams:   [{ id, team_name }]
|
|--------------------------------------------------------------------------
*/

function getPlayerName(
  registration: Registration
) {
  const player = registration.players?.[0];

  if (!player) {
    return `Player #${registration.player_id}`;
  }

  return (
    player.gamer_tag?.trim() ||
    player.full_name?.trim() ||
    `Player #${registration.player_id}`
  );
}

function getTeamName(
  registration: Registration
) {
  const team = registration.teams?.[0];

  if (!team) {
    return `Team #${registration.team_id}`;
  }

  return (
    team.team_name?.trim() ||
    `Team #${registration.team_id}`
  );
}

/*
|--------------------------------------------------------------------------
| PARTICIPANT RESOLUTION
|--------------------------------------------------------------------------
*/

function getParticipantFromRegistration(
  registration: Registration,
  hasTeams: boolean
) {
  /*
   * TEAM TOURNAMENT
   */
  if (hasTeams) {
    if (registration.team_id === null) {
      return null;
    }

    return {
      id: registration.team_id,
      registrationId: registration.id,
      name: getTeamName(registration),
      type: "Team" as const,
    };
  }

  /*
   * PLAYER TOURNAMENT
   */
  if (registration.player_id === null) {
    return null;
  }

  return {
    id: registration.player_id,
    registrationId: registration.id,
    name: getPlayerName(registration),
    type: "Player" as const,
  };
}

/*
|--------------------------------------------------------------------------
| SORT STANDINGS
|--------------------------------------------------------------------------
*/

function sortStandings(rows: Standing[]) {
  return [...rows].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    const goalDifferenceA =
      a.scoreFor - a.scoreAgainst;

    const goalDifferenceB =
      b.scoreFor - b.scoreAgainst;

    if (goalDifferenceB !== goalDifferenceA) {
      return (
        goalDifferenceB -
        goalDifferenceA
      );
    }

    if (b.scoreFor !== a.scoreFor) {
      return b.scoreFor - a.scoreFor;
    }

    return a.name.localeCompare(b.name);
  });
}

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function TournamentStandingsPage() {
  const params = useParams();

  const tournamentId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const tournamentIdNumber = Number(tournamentId);

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [registrations, setRegistrations] =
    useState<Registration[]>([]);

  const [matches, setMatches] =
    useState<Match[]>([]);

  const [groups, setGroups] =
    useState<TournamentGroup[]>([]);

  const [groupMembers, setGroupMembers] =
    useState<GroupMember[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | LOAD DATA
  |--------------------------------------------------------------------------
  */

  async function loadData(
    showRefreshing = false
  ) {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const [
        registrationsResponse,
        matchesResponse,
        groupsResponse,
      ] = await Promise.all([
        fetch(
          `/api/tournament-registrations?tournament_id=${tournamentIdNumber}`,
          {
            cache: "no-store",
          }
        ),

        fetch(
          `/api/matches?tournament_id=${tournamentIdNumber}`,
          {
            cache: "no-store",
          }
        ),

        fetch(
          `/api/tournaments/${tournamentIdNumber}/groups`,
          {
            cache: "no-store",
          }
        ),
      ]);

      const registrationsResult =
        (await registrationsResponse.json()) as RegistrationsResponse;

      const matchesResult =
        (await matchesResponse.json()) as MatchesResponse;

      const groupsResult =
        (await groupsResponse.json()) as GroupsResponse;

      /*
      |--------------------------------------------------------------------------
      | REGISTRATIONS
      |--------------------------------------------------------------------------
      */

      if (
        !registrationsResponse.ok ||
        !registrationsResult.success
      ) {
        throw new Error(
          registrationsResult.message ??
            "Failed to load tournament participants."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | MATCHES
      |--------------------------------------------------------------------------
      */

      if (
        !matchesResponse.ok ||
        !matchesResult.success
      ) {
        throw new Error(
          matchesResult.message ??
            "Failed to load tournament matches."
        );
      }

      setRegistrations(
        registrationsResult.registrations ?? []
      );

      setMatches(
        matchesResult.matches ?? []
      );

      /*
      |--------------------------------------------------------------------------
      | GROUPS
      |--------------------------------------------------------------------------
      */

      if (
        groupsResponse.ok &&
        groupsResult.success
      ) {
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
      } else {
        setGroups([]);
        setGroupMembers([]);
      }
    } catch (loadError) {
      console.error(
        "Failed to load tournament standings:",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load tournament standings."
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
    if (
      !tournamentId ||
      !Number.isInteger(tournamentIdNumber)
    ) {
      setError(
        "A valid tournament ID is required."
      );

      setLoading(false);

      return;
    }

    loadData();
  }, [tournamentId]);

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
  | TEAM / PLAYER MODE
  |--------------------------------------------------------------------------
  */

  const hasTeams =
    useMemo(() => {
      return approvedRegistrations.some(
        (registration) =>
          registration.team_id !== null
      );
    }, [approvedRegistrations]);

  /*
  |--------------------------------------------------------------------------
  | COMPLETED GROUP-STAGE MATCHES
  |--------------------------------------------------------------------------
  */

  const qualificationMatches =
    useMemo(() => {
      return matches.filter(
        (match) =>
          normalize(
            match.status
          ) === "completed" &&
          !isKnockoutRound(
            match.round
          )
      );
    }, [matches]);

  /*
  |--------------------------------------------------------------------------
  | OVERALL STANDINGS
  |--------------------------------------------------------------------------
  */

  const overallStandings =
    useMemo(() => {
      const standingMap =
        new Map<number, Standing>();

      /*
      |--------------------------------------------------------------------------
      | ADD ALL APPROVED PARTICIPANTS
      |--------------------------------------------------------------------------
      */

      approvedRegistrations.forEach(
        (registration) => {
          const participant =
            getParticipantFromRegistration(
              registration,
              hasTeams
            );

          if (!participant) {
            return;
          }

          standingMap.set(
            participant.id,
            {
              id: participant.id,
              registrationId:
                participant.registrationId,

              name: participant.name,
              type: participant.type,

              played: 0,
              wins: 0,
              draws: 0,
              losses: 0,

              scoreFor: 0,
              scoreAgainst: 0,

              points: 0,
            }
          );
        }
      );

      /*
      |--------------------------------------------------------------------------
      | PROCESS COMPLETED MATCHES
      |--------------------------------------------------------------------------
      */

      qualificationMatches.forEach(
        (match) => {
          const scoreA =
            match.score_team_a;

          const scoreB =
            match.score_team_b;

          if (
            scoreA === null ||
            scoreB === null
          ) {
            return;
          }

          const participantA = hasTeams
            ? match.team_a_id
            : match.player_a_id;

          const participantB = hasTeams
            ? match.team_b_id
            : match.player_b_id;

          if (
            participantA === null ||
            participantB === null
          ) {
            return;
          }

          const standingA =
            standingMap.get(
              participantA
            );

          const standingB =
            standingMap.get(
              participantB
            );

          if (
            !standingA ||
            !standingB
          ) {
            return;
          }

          standingA.played += 1;
          standingB.played += 1;

          standingA.scoreFor += scoreA;
          standingA.scoreAgainst += scoreB;

          standingB.scoreFor += scoreB;
          standingB.scoreAgainst += scoreA;

          /*
          |--------------------------------------------------------------------------
          | DRAW
          |--------------------------------------------------------------------------
          */

          if (scoreA === scoreB) {
            standingA.draws += 1;
            standingB.draws += 1;

            standingA.points += 1;
            standingB.points += 1;

            return;
          }

          /*
          |--------------------------------------------------------------------------
          | A WINS
          |--------------------------------------------------------------------------
          */

          if (scoreA > scoreB) {
            standingA.wins += 1;
            standingB.losses += 1;

            standingA.points += 3;

            return;
          }

          /*
          |--------------------------------------------------------------------------
          | B WINS
          |--------------------------------------------------------------------------
          */

          standingB.wins += 1;
          standingA.losses += 1;

          standingB.points += 3;
        }
      );

      return sortStandings(
        Array.from(
          standingMap.values()
        )
      );
    }, [
      approvedRegistrations,
      hasTeams,
      qualificationMatches,
    ]);

  /*
  |--------------------------------------------------------------------------
  | GROUP STANDINGS
  |--------------------------------------------------------------------------
  */

  const groupStandings =
    useMemo(() => {
      return groups.map(
        (group) => {
          const members =
            groupMembers
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

          const participantIds =
            new Set<number>();

          /*
          |--------------------------------------------------------------------------
          | BUILD PARTICIPANT IDS
          |--------------------------------------------------------------------------
          */

          members.forEach(
            (member) => {
              const registration =
                approvedRegistrations.find(
                  (item) =>
                    item.id ===
                    member.registration_id
                );

              if (!registration) {
                return;
              }

              if (hasTeams) {
                if (
                  registration.team_id !== null
                ) {
                  participantIds.add(
                    registration.team_id
                  );
                }
              } else {
                if (
                  registration.player_id !== null
                ) {
                  participantIds.add(
                    registration.player_id
                  );
                }
              }
            }
          );

          /*
          |--------------------------------------------------------------------------
          | INITIAL STANDINGS
          |--------------------------------------------------------------------------
          */

          const standingMap =
            new Map<number, Standing>();

          members.forEach(
            (member) => {
              const registration =
                approvedRegistrations.find(
                  (item) =>
                    item.id ===
                    member.registration_id
                );

              if (!registration) {
                return;
              }

              const participant =
                getParticipantFromRegistration(
                  registration,
                  hasTeams
                );

              if (!participant) {
                return;
              }

              standingMap.set(
                participant.id,
                {
                  id: participant.id,

                  registrationId:
                    participant.registrationId,

                  /*
                   * IMPORTANT:
                   * This now uses the real
                   * player gamer tag/name.
                   */
                  name: participant.name,

                  type: participant.type,

                  played: 0,
                  wins: 0,
                  draws: 0,
                  losses: 0,

                  scoreFor: 0,
                  scoreAgainst: 0,

                  points: 0,
                }
              );
            }
          );

          /*
          |--------------------------------------------------------------------------
          | PROCESS GROUP MATCHES
          |--------------------------------------------------------------------------
          */

          qualificationMatches.forEach(
            (match) => {
              const scoreA =
                match.score_team_a;

              const scoreB =
                match.score_team_b;

              if (
                scoreA === null ||
                scoreB === null
              ) {
                return;
              }

              const participantA = hasTeams
                ? match.team_a_id
                : match.player_a_id;

              const participantB = hasTeams
                ? match.team_b_id
                : match.player_b_id;

              if (
                participantA === null ||
                participantB === null
              ) {
                return;
              }

              /*
              |--------------------------------------------------------------------------
              | BOTH PLAYERS MUST BELONG TO THIS GROUP
              |--------------------------------------------------------------------------
              */

              if (
                !participantIds.has(
                  participantA
                ) ||
                !participantIds.has(
                  participantB
                )
              ) {
                return;
              }

              const standingA =
                standingMap.get(
                  participantA
                );

              const standingB =
                standingMap.get(
                  participantB
                );

              if (
                !standingA ||
                !standingB
              ) {
                return;
              }

              standingA.played += 1;
              standingB.played += 1;

              standingA.scoreFor += scoreA;
              standingA.scoreAgainst += scoreB;

              standingB.scoreFor += scoreB;
              standingB.scoreAgainst += scoreA;

              /*
              |--------------------------------------------------------------------------
              | DRAW
              |--------------------------------------------------------------------------
              */

              if (scoreA === scoreB) {
                standingA.draws += 1;
                standingB.draws += 1;

                standingA.points += 1;
                standingB.points += 1;

                return;
              }

              /*
              |--------------------------------------------------------------------------
              | A WINS
              |--------------------------------------------------------------------------
              */

              if (scoreA > scoreB) {
                standingA.wins += 1;
                standingB.losses += 1;

                standingA.points += 3;

                return;
              }

              /*
              |--------------------------------------------------------------------------
              | B WINS
              |--------------------------------------------------------------------------
              */

              standingB.wins += 1;
              standingA.losses += 1;

              standingB.points += 3;
            }
          );

          return {
            group,
            standings: sortStandings(
              Array.from(
                standingMap.values()
              )
            ),
          };
        }
      );
    }, [
      groups,
      groupMembers,
      approvedRegistrations,
      hasTeams,
      qualificationMatches,
    ]);

  /*
  |--------------------------------------------------------------------------
  | SUMMARY
  |--------------------------------------------------------------------------
  */

  const completedMatchCount =
    qualificationMatches.length;

  const totalParticipants =
    overallStandings.length;

  const groupsCreated =
    groups.length;

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080808] text-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="animate-pulse">
            <div className="h-4 w-40 rounded bg-white/10" />

            <div className="mt-5 h-10 w-72 rounded bg-white/10" />

            <div className="mt-3 h-4 w-96 max-w-full rounded bg-white/10" />

            <div className="mt-8 h-32 rounded-2xl bg-white/5" />

            <div className="mt-6 h-64 rounded-2xl bg-white/5" />
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

        {/* TOP NAVIGATION */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <Link
            href={`/admin/tournaments/${tournamentIdNumber}/groups`}
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-gray-400 transition hover:text-[#D4AF37]"
          >
            ← Back to Tournament Groups
          </Link>

          <div className="flex flex-wrap gap-2">

            <Link
              href={`/admin/tournaments/${tournamentIdNumber}/participants`}
              className="rounded-lg border border-gray-800 bg-[#111111] px-4 py-2 text-xs font-semibold text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-white"
            >
              Participants
            </Link>

            <Link
              href={`/admin/tournaments/${tournamentIdNumber}/fixtures`}
              className="rounded-lg border border-gray-800 bg-[#111111] px-4 py-2 text-xs font-semibold text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-white"
            >
              Fixtures
            </Link>

            <Link
              href={`/admin/tournaments/${tournamentIdNumber}/matches`}
              className="rounded-lg border border-gray-800 bg-[#111111] px-4 py-2 text-xs font-semibold text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-white"
            >
              Matches
            </Link>

            <span className="rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-black">
              Standings & Results
            </span>

          </div>
        </div>

        {/* HEADER */}

        <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
              Tournament Management
            </p>

            <h1 className="mt-2 text-4xl font-black uppercase tracking-tight text-white">
              Group Standings
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
              Track group performance, match results,
              points, wins, losses, and qualification
              positions.
            </p>

          </div>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="w-fit rounded-lg border border-gray-800 bg-[#111111] px-5 py-3 text-sm font-semibold text-gray-300 transition hover:border-[#D4AF37]/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh Standings"}
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

        {/* SUMMARY */}

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">

          <div className="rounded-xl border border-gray-800 bg-[#111111] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              Participants
            </p>

            <p className="mt-2 text-3xl font-black text-white">
              {totalParticipants}
            </p>
          </div>

          <div className="rounded-xl border border-gray-800 bg-[#111111] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              Groups
            </p>

            <p className="mt-2 text-3xl font-black text-white">
              {groupsCreated}
            </p>
          </div>

          <div className="rounded-xl border border-gray-800 bg-[#111111] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              Completed Matches
            </p>

            <p className="mt-2 text-3xl font-black text-white">
              {completedMatchCount}
            </p>
          </div>

          <div className="rounded-xl border border-[#D4AF37]/30 bg-[#111111] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
              Scoring
            </p>

            <p className="mt-2 text-sm font-bold text-white">
              Win 3 · Draw 1
            </p>
          </div>

        </div>

        {/* NO GROUPS */}

        {groups.length === 0 && (
          <div className="mt-8 rounded-2xl border border-[#D4AF37]/20 bg-[#111111] p-8 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-2xl">
              🏆
            </div>

            <h2 className="mt-5 text-xl font-black uppercase">
              No Groups Created Yet
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-400">
              Create the tournament groups first.
              Once participants have been assigned,
              their group standings will appear here.
            </p>

            <Link
              href={`/admin/tournaments/${tournamentIdNumber}/groups`}
              className="mt-6 inline-flex rounded-lg bg-[#D4AF37] px-6 py-3 text-sm font-bold text-black transition hover:opacity-90"
            >
              Configure Groups →
            </Link>

          </div>
        )}

        {/* GROUP STANDINGS */}

        {groupStandings.length > 0 && (
          <div className="mt-8 space-y-8">

            {groupStandings.map(
              ({
                group,
                standings,
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

                      <h2 className="mt-1 text-2xl font-black uppercase text-white">
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
                                group.group_order - 1
                              )
                          )}`}
                      </span>

                      <span className="text-xs text-gray-500">
                        {standings.length} participants
                      </span>

                    </div>

                  </div>

                  {/* TABLE */}

                  <div className="overflow-x-auto">

                    <table className="w-full min-w-[760px]">

                      <thead>

                        <tr className="border-b border-gray-800 bg-black/30 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">

                          <th className="w-16 px-6 py-4">
                            #
                          </th>

                          <th className="px-4 py-4">
                            Participant
                          </th>

                          <th className="px-3 py-4 text-center">
                            P
                          </th>

                          <th className="px-3 py-4 text-center">
                            W
                          </th>

                          <th className="px-3 py-4 text-center">
                            D
                          </th>

                          <th className="px-3 py-4 text-center">
                            L
                          </th>

                          <th className="px-3 py-4 text-center">
                            GF
                          </th>

                          <th className="px-3 py-4 text-center">
                            GA
                          </th>

                          <th className="px-3 py-4 text-center">
                            GD
                          </th>

                          <th className="px-6 py-4 text-center text-[#D4AF37]">
                            PTS
                          </th>

                        </tr>

                      </thead>

                      <tbody className="divide-y divide-gray-800">

                        {standings.map(
                          (
                            standing,
                            index
                          ) => {

                            const goalDifference =
                              standing.scoreFor -
                              standing.scoreAgainst;

                            const isQualified =
                              index < 2;

                            return (
                              <tr
                                key={`${group.id}-${standing.id}`}
                                className="transition hover:bg-white/[0.02]"
                              >

                                {/* POSITION */}

                                <td className="px-6 py-5">

                                  <div
                                    className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-black ${
                                      index === 0
                                        ? "bg-[#D4AF37] text-black"
                                        : index === 1
                                          ? "border border-gray-600 text-gray-300"
                                          : "text-gray-500"
                                    }`}
                                  >
                                    {index + 1}
                                  </div>

                                </td>

                                {/* PARTICIPANT */}

                                <td className="px-4 py-5">

                                  <div className="flex items-center gap-3">

                                    <div className="min-w-0">

                                      <p className="truncate font-bold text-white">
                                        {standing.name}
                                      </p>

                                      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-gray-500">
                                        {standing.type}
                                      </p>

                                    </div>

                                    {isQualified && (
                                      <span className="hidden rounded border border-green-500/20 bg-green-500/10 px-2 py-1 text-[9px] font-bold uppercase text-green-400 sm:inline-flex">
                                        Top 2
                                      </span>
                                    )}

                                  </div>

                                </td>

                                {/* PLAYED */}

                                <td className="px-3 py-5 text-center text-sm text-gray-300">
                                  {standing.played}
                                </td>

                                {/* WINS */}

                                <td className="px-3 py-5 text-center text-sm font-semibold text-green-400">
                                  {standing.wins}
                                </td>

                                {/* DRAWS */}

                                <td className="px-3 py-5 text-center text-sm text-gray-300">
                                  {standing.draws}
                                </td>

                                {/* LOSSES */}

                                <td className="px-3 py-5 text-center text-sm text-red-400">
                                  {standing.losses}
                                </td>

                                {/* GF */}

                                <td className="px-3 py-5 text-center text-sm text-gray-300">
                                  {standing.scoreFor}
                                </td>

                                {/* GA */}

                                <td className="px-3 py-5 text-center text-sm text-gray-300">
                                  {standing.scoreAgainst}
                                </td>

                                {/* GD */}

                                <td
                                  className={`px-3 py-5 text-center text-sm font-semibold ${
                                    goalDifference > 0
                                      ? "text-green-400"
                                      : goalDifference < 0
                                        ? "text-red-400"
                                        : "text-gray-400"
                                  }`}
                                >
                                  {goalDifference > 0
                                    ? `+${goalDifference}`
                                    : goalDifference}
                                </td>

                                {/* POINTS */}

                                <td className="px-6 py-5 text-center">

                                  <span className="text-lg font-black text-[#D4AF37]">
                                    {standing.points}
                                  </span>

                                </td>

                              </tr>
                            );
                          }
                        )}

                      </tbody>

                    </table>

                  </div>

                  {/* FOOTER */}

                  <div className="border-t border-gray-800 bg-black/20 px-6 py-4">

                    <div className="flex flex-col gap-2 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">

                      <span>
                        P = Played · W = Wins · D = Draws · L = Losses
                      </span>

                      <span>
                        GF = For · GA = Against · GD = Difference · PTS = Points
                      </span>

                    </div>

                  </div>

                </section>
              )
            )}

          </div>
        )}

        {/* OVERALL STANDINGS */}

        {overallStandings.length > 0 && (
          <section className="mt-8 overflow-hidden rounded-2xl border border-gray-800 bg-[#111111]">

            <div className="border-b border-gray-800 px-6 py-5">

              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                Tournament Overview
              </p>

              <h2 className="mt-1 text-2xl font-black uppercase">
                Overall Qualification Standings
              </h2>

              <p className="mt-2 text-sm text-gray-400">
                Combined standings from completed
                qualification-stage matches.
              </p>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full min-w-[760px]">

                <thead>

                  <tr className="border-b border-gray-800 bg-black/30 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">

                    <th className="w-16 px-6 py-4">
                      #
                    </th>

                    <th className="px-4 py-4">
                      Participant
                    </th>

                    <th className="px-3 py-4 text-center">
                      P
                    </th>

                    <th className="px-3 py-4 text-center">
                      W
                    </th>

                    <th className="px-3 py-4 text-center">
                      D
                    </th>

                    <th className="px-3 py-4 text-center">
                      L
                    </th>

                    <th className="px-3 py-4 text-center">
                      GD
                    </th>

                    <th className="px-6 py-4 text-center text-[#D4AF37]">
                      PTS
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-800">

                  {overallStandings.map(
                    (
                      standing,
                      index
                    ) => {

                      const goalDifference =
                        standing.scoreFor -
                        standing.scoreAgainst;

                      return (
                        <tr
                          key={`overall-${standing.id}`}
                          className="transition hover:bg-white/[0.02]"
                        >

                          <td className="px-6 py-5">
                            <span className="text-sm font-bold text-gray-500">
                              {index + 1}
                            </span>
                          </td>

                          <td className="px-4 py-5">

                            <p className="font-bold text-white">
                              {standing.name}
                            </p>

                            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-gray-500">
                              {standing.type}
                            </p>

                          </td>

                          <td className="px-3 py-5 text-center text-sm text-gray-300">
                            {standing.played}
                          </td>

                          <td className="px-3 py-5 text-center text-sm text-green-400">
                            {standing.wins}
                          </td>

                          <td className="px-3 py-5 text-center text-sm text-gray-300">
                            {standing.draws}
                          </td>

                          <td className="px-3 py-5 text-center text-sm text-red-400">
                            {standing.losses}
                          </td>

                          <td
                            className={`px-3 py-5 text-center text-sm font-semibold ${
                              goalDifference > 0
                                ? "text-green-400"
                                : goalDifference < 0
                                  ? "text-red-400"
                                  : "text-gray-400"
                            }`}
                          >
                            {goalDifference > 0
                              ? `+${goalDifference}`
                              : goalDifference}
                          </td>

                          <td className="px-6 py-5 text-center">

                            <span className="text-lg font-black text-[#D4AF37]">
                              {standing.points}
                            </span>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          </section>
        )}

        {/* ACTIONS */}

        <div className="mt-8 border-t border-gray-800 pt-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <Link
              href={`/admin/tournaments/${tournamentIdNumber}/groups`}
              className="text-sm font-medium text-gray-400 transition hover:text-[#D4AF37]"
            >
              ← Return to Tournament Groups
            </Link>

            <div className="flex flex-wrap gap-3">

              <Link
                href={`/admin/tournaments/${tournamentIdNumber}/matches`}
                className="rounded-lg border border-gray-800 bg-[#111111] px-5 py-3 text-sm font-semibold text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-white"
              >
                Manage Matches
              </Link>

              <Link
                href={`/admin/tournaments/${tournamentIdNumber}/knockout`}
                className="rounded-lg bg-[#D4AF37] px-5 py-3 text-sm font-bold text-black transition hover:opacity-90"
              >
                Knockout Bracket →
              </Link>

            </div>

          </div>

        </div>

      </div>
    </main>
  );
}