"use client";

import { useEffect, useMemo, useState } from "react";

interface TournamentStageAdvanceProps {
  tournamentId: number;
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

interface Registration {
  id: number;
  tournament_id?: number;
  team_id: number | null;
  player_id: number | null;
  status: string;
  teams?: Team | Team[] | null;
  players?: Player | Player[] | null;
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

  best_of?: string | null;

  scheduled_date?: string | null;
  scheduled_time?: string | null;

  winner_id: number | null;
  winner_team_id?: number | null;
  winner_player_id?: number | null;

  score_team_a: number | null;
  score_team_b: number | null;

  status: string | null;

  stream_link?: string | null;
  notes?: string | null;
}

interface Standing {
  id: number;
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

type TournamentFormat =
  | "round_robin"
  | "round_robin_knockout"
  | "group_knockout"
  | "knockout";

interface QualifiedParticipant {
  id: number;
  name: string;
  type: "Team" | "Player";

  groupId?: number;
  groupName?: string;
  position?: number;

  points?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  scoreFor?: number;
  scoreAgainst?: number;
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

function firstRelation<T>(
  relation: T | T[] | null | undefined
): T | null {
  if (!relation) {
    return null;
  }

  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function getParticipantName(
  registration: Registration
): string {
  if (registration.team_id !== null) {
    const team = firstRelation(registration.teams);

    return (
      team?.team_name?.trim() ||
      `Team #${registration.team_id}`
    );
  }

  if (registration.player_id !== null) {
    const player = firstRelation(registration.players);

    if (player?.gamer_tag?.trim()) {
      return player.gamer_tag.trim();
    }

    if (player?.full_name?.trim()) {
      return player.full_name.trim();
    }

    return `Player #${registration.player_id}`;
  }

  return "Unknown Participant";
}

function normalizeTournamentFormat(
  value: unknown
): TournamentFormat {
  const format = normalize(value);

  /*
   * GROUP STAGE + KNOCKOUT
   */
  if (
    format.includes("group") &&
    (
      format.includes("knockout") ||
      format.includes("elimination")
    )
  ) {
    return "group_knockout";
  }

  /*
   * ROUND ROBIN + KNOCKOUT
   */
  if (
    format.includes("round robin") &&
    (
      format.includes("knockout") ||
      format.includes("elimination")
    )
  ) {
    return "round_robin_knockout";
  }

  /*
   * KNOCKOUT ONLY
   */
  if (
    format.includes("knockout") ||
    format.includes("single elimination") ||
    format.includes("elimination")
  ) {
    return "knockout";
  }

  return "round_robin";
}

/* =========================================================
   ROUND ROBIN DETECTION
========================================================= */

function isRoundRobinMatch(
  match: Match
): boolean {
  const round = normalize(match.round);

  if (!round) {
    return false;
  }

  if (round.includes("round robin")) {
    return true;
  }

  const legRoundPattern =
    /^leg\s*\d+\s*[-–—]\s*round\s*\d+$/i;

  if (legRoundPattern.test(round)) {
    return true;
  }

  const singleRoundPattern =
    /^round\s*\d+$/i;

  return singleRoundPattern.test(round);
}

/* =========================================================
   KNOCKOUT DETECTION
========================================================= */

function isKnockoutMatch(
  match: Match
): boolean {
  const round = normalize(match.round);

  if (!round) {
    return false;
  }

  if (isRoundRobinMatch(match)) {
    return false;
  }

  const knockoutRounds = [
    "round of 32",
    "round of 16",
    "round of 8",
    "quarterfinal",
    "quarterfinals",
    "quarter-final",
    "quarter-finals",
    "semifinal",
    "semifinals",
    "semi-final",
    "semi-finals",
    "third place",
    "3rd place",
    "final",
    "grand final",
    "knockout",
  ];

  return knockoutRounds.some(
    (name) => round.includes(name)
  );
}

function isCompletedMatch(
  match: Match
): boolean {
  return normalize(match.status) === "completed";
}

/* =========================================================
   REGISTRATION → PARTICIPANT
========================================================= */

function registrationToParticipant(
  registration: Registration
): QualifiedParticipant | null {
  if (registration.team_id !== null) {
    return {
      id: registration.team_id,
      name: getParticipantName(registration),
      type: "Team",
    };
  }

  if (registration.player_id !== null) {
    return {
      id: registration.player_id,
      name: getParticipantName(registration),
      type: "Player",
    };
  }

  return null;
}

/* =========================================================
   STANDINGS
========================================================= */

function calculateStandings(
  registrations: Registration[],
  matches: Match[]
): Standing[] {
  const approved =
    registrations.filter(
      (registration) =>
        normalize(registration.status) ===
        "approved"
    );

  const hasTeams =
    approved.some(
      (registration) =>
        registration.team_id !== null
    );

  const standingMap =
    new Map<number, Standing>();

  /*
   * CREATE PARTICIPANTS
   */
  approved.forEach(
    (registration) => {
      if (hasTeams) {
        if (
          registration.team_id === null
        ) {
          return;
        }

        const id =
          registration.team_id;

        standingMap.set(id, {
          id,
          name:
            getParticipantName(
              registration
            ),
          type: "Team",

          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,

          scoreFor: 0,
          scoreAgainst: 0,

          points: 0,
        });

        return;
      }

      if (
        registration.player_id ===
        null
      ) {
        return;
      }

      const id =
        registration.player_id;

      standingMap.set(id, {
        id,
        name:
          getParticipantName(
            registration
          ),
        type: "Player",

        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,

        scoreFor: 0,
        scoreAgainst: 0,

        points: 0,
      });
    }
  );

  /*
   * ONLY COMPLETED ROUND ROBIN MATCHES
   */
  const completedMatches =
    matches.filter(
      (match) =>
        isRoundRobinMatch(match) &&
        isCompletedMatch(match)
    );

  /*
   * PROCESS RESULTS
   */
  completedMatches.forEach(
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

      const participantA =
        hasTeams
          ? match.team_a_id
          : match.player_a_id;

      const participantB =
        hasTeams
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

      if (scoreA === scoreB) {
        standingA.draws += 1;
        standingB.draws += 1;

        standingA.points += 1;
        standingB.points += 1;

        return;
      }

      if (scoreA > scoreB) {
        standingA.wins += 1;
        standingB.losses += 1;

        standingA.points += 3;

        return;
      }

      standingB.wins += 1;
      standingA.losses += 1;

      standingB.points += 3;
    }
  );

  /*
   * SORT
   */
  return Array.from(
    standingMap.values()
  ).sort((a, b) => {
    if (
      b.points !== a.points
    ) {
      return (
        b.points -
        a.points
      );
    }

    const differenceA =
      a.scoreFor -
      a.scoreAgainst;

    const differenceB =
      b.scoreFor -
      b.scoreAgainst;

    if (
      differenceB !==
      differenceA
    ) {
      return (
        differenceB -
        differenceA
      );
    }

    if (
      b.scoreFor !==
      a.scoreFor
    ) {
      return (
        b.scoreFor -
        a.scoreFor
      );
    }

    if (
      b.wins !== a.wins
    ) {
      return (
        b.wins -
        a.wins
      );
    }

    return a.name.localeCompare(
      b.name
    );
  });
}

/* =========================================================
   COMPONENT
========================================================= */

export default function TournamentStageAdvance({
  tournamentId,
}: TournamentStageAdvanceProps) {
  const [
    registrations,
    setRegistrations,
  ] = useState<Registration[]>([]);

  const [
    matches,
    setMatches,
  ] = useState<Match[]>([]);

  const [
    tournamentFormat,
    setTournamentFormat,
  ] = useState<TournamentFormat>(
    "round_robin"
  );

  /*
   * GROUP TOURNAMENTS
   *
   * This value belongs ONLY to group
   * qualification.
   *
   * Default = 2.
   */
  const [
    advancingPerGroup,
    setAdvancingPerGroup,
  ] = useState(2);

  /*
   * Existing Round Robin + Knockout
   * qualification count.
   */
  const [
    selectedCount,
    setSelectedCount,
  ] = useState(4);

  const [
    includeThirdPlace,
    setIncludeThirdPlace,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    advancing,
    setAdvancing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [
    success,
    setSuccess,
  ] = useState<string | null>(null);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  async function loadData(
    showRefreshState = false
  ) {
    if (!tournamentId) {
      setError(
        "A valid tournament ID is required."
      );

      setLoading(false);

      return;
    }

    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      /*
       * IMPORTANT:
       *
       * Only load the three APIs that this
       * component actually needs.
       *
       * Group membership is resolved by the
       * advancement route.
       *
       * This prevents the component from
       * querying columns that do not exist.
       */
      const [
        tournamentResponse,
        registrationsResponse,
        matchesResponse,
      ] = await Promise.all([
        fetch(
          `/api/tournaments/${tournamentId}`,
          {
            cache: "no-store",
          }
        ),

        fetch(
          `/api/tournament-registrations?tournament_id=${tournamentId}`,
          {
            cache: "no-store",
          }
        ),

        fetch(
          `/api/matches?tournament_id=${tournamentId}`,
          {
            cache: "no-store",
          }
        ),
      ]);

      const tournamentResult =
        await tournamentResponse.json();

      const registrationsResult =
        await registrationsResponse.json();

      const matchesResult =
        await matchesResponse.json();

      if (
        !tournamentResponse.ok ||
        !tournamentResult.success
      ) {
        throw new Error(
          tournamentResult.message ||
            "Failed to load tournament."
        );
      }

      if (
        !registrationsResponse.ok ||
        !registrationsResult.success
      ) {
        throw new Error(
          registrationsResult.message ||
            "Failed to load tournament participants."
        );
      }

      if (
        !matchesResponse.ok ||
        !matchesResult.success
      ) {
        throw new Error(
          matchesResult.message ||
            "Failed to load tournament matches."
        );
      }

      const tournament =
        tournamentResult.tournament;

      setTournamentFormat(
        normalizeTournamentFormat(
          tournament?.tournament_type
        )
      );

      setRegistrations(
        registrationsResult.registrations ??
          []
      );

      setMatches(
        matchesResult.matches ??
          []
      );
    } catch (loadError) {
      console.error(
        "Stage advancement load error:",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load stage advancement."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [tournamentId]);

  /* =======================================================
     APPROVED PARTICIPANTS
  ======================================================= */

  const approvedParticipants =
    useMemo(() => {
      return registrations
        .filter(
          (registration) =>
            normalize(
              registration.status
            ) === "approved"
        )
        .map(
          registrationToParticipant
        )
        .filter(
          (
            participant
          ): participant is QualifiedParticipant =>
            participant !== null
        );
    }, [registrations]);

  /* =======================================================
     UNIQUE PARTICIPANTS
  ======================================================= */

  const uniqueApprovedParticipants =
    useMemo(() => {
      const map =
        new Map<
          string,
          QualifiedParticipant
        >();

      approvedParticipants.forEach(
        (participant) => {
          map.set(
            `${participant.type}-${participant.id}`,
            participant
          );
        }
      );

      return Array.from(
        map.values()
      );
    }, [approvedParticipants]);

  /* =======================================================
     ROUND ROBIN
  ======================================================= */

  const roundRobinMatches =
    useMemo(() => {
      return matches.filter(
        isRoundRobinMatch
      );
    }, [matches]);

  const completedRoundRobinMatches =
    useMemo(() => {
      return roundRobinMatches.filter(
        isCompletedMatch
      );
    }, [roundRobinMatches]);

  const incompleteRoundRobinMatches =
    useMemo(() => {
      return roundRobinMatches.filter(
        (match) =>
          !isCompletedMatch(match)
      );
    }, [roundRobinMatches]);

  const roundRobinComplete =
    roundRobinMatches.length > 0 &&
    incompleteRoundRobinMatches.length ===
      0;

  /* =======================================================
     KNOCKOUT
  ======================================================= */

  const knockoutMatches =
    useMemo(() => {
      return matches.filter(
        isKnockoutMatch
      );
    }, [matches]);

  const knockoutGenerated =
    knockoutMatches.length > 0;

  /* =======================================================
     STANDINGS
  ======================================================= */

  const standings =
    useMemo(() => {
      if (
        tournamentFormat ===
        "knockout"
      ) {
        return [];
      }

      /*
       * Group tournaments are NOT calculated
       * using the global standings.
       *
       * The backend determines the standings
       * independently for each group.
       */
      if (
        tournamentFormat ===
        "group_knockout"
      ) {
        return [];
      }

      return calculateStandings(
        registrations,
        matches
      );
    }, [
      registrations,
      matches,
      tournamentFormat,
    ]);

  /* =======================================================
     ROUND ROBIN QUALIFICATION OPTIONS
  ======================================================= */

  const qualificationOptions =
    useMemo(() => {
      const allowedCounts = [
        4,
        8,
        16,
        32,
      ];

      const participantCount =
        standings.length;

      return allowedCounts.filter(
        (count) =>
          count <= participantCount
      );
    }, [standings.length]);

  /* =======================================================
     ROUND ROBIN QUALIFIERS
  ======================================================= */

  const standingsQualifiers =
    useMemo(() => {
      if (
        tournamentFormat !==
        "round_robin_knockout"
      ) {
        return [];
      }

      return standings.slice(
        0,
        selectedCount
      );
    }, [
      standings,
      selectedCount,
      tournamentFormat,
    ]);

  /* =======================================================
     KNOCKOUT-ONLY PARTICIPANTS
  ======================================================= */

  const knockoutOnlyParticipants =
    useMemo(() => {
      if (
        tournamentFormat !==
        "knockout"
      ) {
        return [];
      }

      return uniqueApprovedParticipants;
    }, [
      uniqueApprovedParticipants,
      tournamentFormat,
    ]);

  const knockoutParticipantCount =
    knockoutOnlyParticipants.length;

  /* =======================================================
     GROUP PARTICIPANT COUNT
     
     IMPORTANT:
     
     We intentionally do not attempt to
     read tournament_group_members here.
     
     The API is authoritative for group
     membership and qualification.
  ======================================================= */

  const groupTournamentReady =
    tournamentFormat ===
      "group_knockout" &&
    approvedParticipants.length > 0;

  /* =======================================================
     KEEP ROUND ROBIN COUNT VALID
  ======================================================= */

  useEffect(() => {
    if (
      tournamentFormat !==
      "round_robin_knockout"
    ) {
      return;
    }

    if (
      qualificationOptions.length ===
      0
    ) {
      return;
    }

    if (
      !qualificationOptions.includes(
        selectedCount
      )
    ) {
      setSelectedCount(
        qualificationOptions[
          qualificationOptions.length - 1
        ]
      );
    }
  }, [
    qualificationOptions,
    selectedCount,
    tournamentFormat,
  ]);

  /* =======================================================
     ADVANCE TO KNOCKOUT
  ======================================================= */

  async function advanceToKnockout() {
    if (!tournamentId) {
      setError(
        "A valid tournament ID is required."
      );

      return;
    }

    setError(null);
    setSuccess(null);

    /* =====================================================
       GROUP STAGE + KNOCKOUT
    ===================================================== */

    if (
      tournamentFormat ===
      "group_knockout"
    ) {
      if (
        advancingPerGroup <
          1 ||
        !Number.isInteger(
          advancingPerGroup
        )
      ) {
        setError(
          "Select a valid number of participants per group."
        );

        return;
      }

      if (
        approvedParticipants.length ===
        0
      ) {
        setError(
          "No approved participants are available."
        );

        return;
      }

      try {
        setAdvancing(true);

        /*
         * IMPORTANT:
         *
         * Group tournaments send ONLY the
         * per-group qualification number.
         *
         * The backend determines:
         *
         * Group A → top 2
         * Group B → top 2
         * Group C → top 2
         * etc.
         *
         * We deliberately do NOT send:
         *
         * teams_advancing: 4
         *
         * because 2 per group is not the
         * same thing as 4 total.
         */
        const response =
          await fetch(
            `/api/tournaments/${tournamentId}/stages/advance`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                advancing_per_group:
                  advancingPerGroup,

                include_third_place:
                  includeThirdPlace,

                tournament_format:
                  "group_knockout",
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
              "Failed to create Knockout stage from groups."
          );
        }

        setSuccess(
          result.message ||
            "Knockout stage generated successfully from group qualification."
        );

        await loadData();
      } catch (advanceError) {
        console.error(
          "Group knockout advancement error:",
          advanceError
        );

        setError(
          advanceError instanceof Error
            ? advanceError.message
            : "Failed to create Knockout stage from groups."
        );
      } finally {
        setAdvancing(false);
      }

      return;
    }

    /* =====================================================
       ROUND ROBIN + KNOCKOUT
    ===================================================== */

    if (
      tournamentFormat ===
      "round_robin_knockout"
    ) {
      if (!roundRobinComplete) {
        setError(
          "Complete all Round Robin matches before advancing."
        );

        return;
      }

      if (
        !qualificationOptions.includes(
          selectedCount
        )
      ) {
        setError(
          "Please select a valid qualification count."
        );

        return;
      }

      try {
        setAdvancing(true);

        const participantIds =
          standingsQualifiers.map(
            (standing) =>
              standing.id
          );

        const response =
          await fetch(
            `/api/tournaments/${tournamentId}/stages/advance`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                teams_advancing:
                  selectedCount,

                participant_ids:
                  participantIds,

                include_third_place:
                  includeThirdPlace,

                tournament_format:
                  "round_robin_knockout",
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
              "Failed to create Knockout stage."
          );
        }

        setSuccess(
          result.message ||
            `${selectedCount} participants advanced to the Knockout stage.`
        );

        await loadData();
      } catch (advanceError) {
        console.error(
          "Round Robin knockout advancement error:",
          advanceError
        );

        setError(
          advanceError instanceof Error
            ? advanceError.message
            : "Failed to create Knockout stage."
        );
      } finally {
        setAdvancing(false);
      }

      return;
    }

    /* =====================================================
       KNOCKOUT ONLY
    ===================================================== */

    if (
      tournamentFormat ===
      "knockout"
    ) {
      if (
        knockoutParticipantCount ===
        0
      ) {
        setError(
          "No approved participants are available for the Knockout stage."
        );

        return;
      }

      try {
        setAdvancing(true);

        const participantIds =
          knockoutOnlyParticipants.map(
            (participant) =>
              participant.id
          );

        const response =
          await fetch(
            `/api/tournaments/${tournamentId}/stages/advance`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                teams_advancing:
                  participantIds.length,

                participant_ids:
                  participantIds,

                include_third_place:
                  includeThirdPlace,

                tournament_format:
                  "knockout",
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
              "Failed to create Knockout stage."
          );
        }

        setSuccess(
          result.message ||
            `${participantIds.length} participants entered the Knockout stage.`
        );

        await loadData();
      } catch (advanceError) {
        console.error(
          "Knockout advancement error:",
          advanceError
        );

        setError(
          advanceError instanceof Error
            ? advanceError.message
            : "Failed to create Knockout stage."
        );
      } finally {
        setAdvancing(false);
      }

      return;
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <section className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl">
        <div className="p-6">
          <h2 className="text-xl font-bold uppercase text-white">
            Stage Advancement
          </h2>

          <p className="text-gray-500 text-sm mt-2">
            Loading tournament stage
            information...
          </p>
        </div>
      </section>
    );
  }

  /* =======================================================
     FORMAT LABEL
  ======================================================= */

  const formatLabel =
    tournamentFormat ===
    "round_robin"
      ? "Round Robin"
      : tournamentFormat ===
          "round_robin_knockout"
        ? "Round Robin + Knockout"
        : tournamentFormat ===
            "group_knockout"
          ? "Group Stage + Knockout"
          : "Knockout";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl overflow-hidden">

      {/* HEADER */}

      <div className="p-6 border-b border-[#222] flex items-start justify-between gap-4">

        <div>
          <div className="flex items-center gap-3 flex-wrap">

            <h2 className="text-xl font-bold uppercase text-white">
              Stage Advancement
            </h2>

            <span className="inline-flex px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold uppercase">
              {formatLabel}
            </span>

          </div>

          <p className="text-sm text-gray-400 mt-1">
            Manage the transition into the
            Knockout stage.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadData(true)
          }
          disabled={
            refreshing ||
            advancing
          }
          className="border border-gray-700 hover:border-[#D4AF37] text-gray-200 px-4 py-2 rounded-lg transition text-sm font-semibold disabled:opacity-50"
        >
          {refreshing
            ? "Refreshing..."
            : "↻ Refresh"}
        </button>

      </div>

      {/* GLOBAL ERROR */}

      {error && (
        <div className="mx-6 mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-5">

          <h3 className="font-bold text-red-400">
            Something went wrong
          </h3>

          <p className="text-sm text-gray-400 mt-1">
            {error}
          </p>

        </div>
      )}

      {/* GLOBAL SUCCESS */}

      {success && (
        <div className="mx-6 mt-6 bg-green-500/10 border border-green-500/30 rounded-xl p-5">

          <h3 className="font-bold text-green-400">
            Stage Updated
          </h3>

          <p className="text-sm text-gray-300 mt-1">
            {success}
          </p>

        </div>
      )}

      {/* BODY */}

      <div className="p-6">

        {/* =================================================
            ROUND ROBIN ONLY
        ================================================= */}

        {tournamentFormat ===
          "round_robin" && (
          <>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <div className="rounded-xl p-5 border border-[#D4AF37]/30 bg-[#D4AF37]/5">

                <p className="text-xs text-gray-400">
                  Round Robin Matches
                </p>

                <p className="text-2xl font-bold text-[#D4AF37] mt-2">
                  {
                    completedRoundRobinMatches.length
                  }{" "}
                  /{" "}
                  {
                    roundRobinMatches.length
                  }
                </p>

                <p className="text-xs text-gray-500 mt-2">
                  Completed matches
                </p>

              </div>

              <div className="rounded-xl p-5 border border-purple-500/30 bg-purple-500/5">

                <p className="text-xs text-gray-400">
                  Participants
                </p>

                <p className="text-2xl font-bold text-purple-400 mt-2">
                  {
                    uniqueApprovedParticipants.length
                  }
                </p>

                <p className="text-xs text-gray-500 mt-2">
                  Approved participants
                </p>

              </div>

              <div className="rounded-xl p-5 border border-blue-500/30 bg-blue-500/5">

                <p className="text-xs text-gray-400">
                  Knockout
                </p>

                <p className="text-lg font-bold text-blue-400 mt-2">
                  Not Used
                </p>

                <p className="text-xs text-gray-500 mt-2">
                  This tournament has no
                  Knockout stage.
                </p>

              </div>

            </div>

            <div className="mt-6 bg-[#0b0b0b] border border-[#222] rounded-xl p-6">

              <h3 className="text-lg font-bold uppercase text-white">
                Round Robin Tournament
              </h3>

              <p className="text-sm text-gray-400 mt-2">
                This tournament uses Round
                Robin only. Completed matches
                are recorded in the standings.
                No Knockout advancement is
                required.
              </p>

            </div>

          </>
        )}

        {/* =================================================
            ROUND ROBIN + KNOCKOUT
        ================================================= */}

        {tournamentFormat ===
          "round_robin_knockout" && (
          <>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

              <div
                className={`rounded-xl p-5 border ${
                  roundRobinComplete
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-red-500/30 bg-red-500/5"
                }`}
              >

                <p className="text-xs text-gray-400">
                  Round Robin
                </p>

                <p
                  className={`text-2xl font-bold mt-2 ${
                    roundRobinComplete
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {
                    completedRoundRobinMatches.length
                  }{" "}
                  /{" "}
                  {
                    roundRobinMatches.length
                  }
                </p>

                <p className="text-xs text-gray-500 mt-2">
                  {roundRobinComplete
                    ? "All matches completed"
                    : "Matches remaining"}
                </p>

              </div>

              <div className="rounded-xl p-5 border border-purple-500/30 bg-purple-500/5">

                <p className="text-xs text-gray-400">
                  Participants
                </p>

                <p className="text-2xl font-bold text-purple-400 mt-2">
                  {
                    uniqueApprovedParticipants.length
                  }
                </p>

                <p className="text-xs text-gray-500 mt-2">
                  Approved participants
                </p>

              </div>

              <div className="rounded-xl p-5 border border-[#D4AF37]/30 bg-[#D4AF37]/5">

                <p className="text-xs text-gray-400">
                  Qualified
                </p>

                <p className="text-2xl font-bold text-[#D4AF37] mt-2">
                  {
                    standingsQualifiers.length
                  }
                </p>

                <p className="text-xs text-gray-500 mt-2">
                  Based on standings
                </p>

              </div>

              <div className="rounded-xl p-5 border border-blue-500/30 bg-blue-500/5">

                <p className="text-xs text-gray-400">
                  Knockout
                </p>

                <p className="text-lg font-bold text-blue-400 mt-2">
                  {knockoutGenerated
                    ? "Generated"
                    : "Waiting"}
                </p>

                <p className="text-xs text-gray-500 mt-2">
                  {knockoutGenerated
                    ? `${knockoutMatches.length} matches`
                    : "Not created yet"}
                </p>

              </div>

            </div>

            {roundRobinComplete &&
              !knockoutGenerated && (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 border border-[#222] rounded-xl overflow-hidden">

                  <div className="p-6 border-b lg:border-b-0 lg:border-r border-[#222]">

                    <h3 className="text-lg font-bold uppercase text-white">
                      Select Qualification Count
                    </h3>

                    <p className="text-sm text-gray-400 mt-2">
                      Select how many participants
                      should proceed from the
                      final Round Robin standings.
                    </p>

                    <div className="mt-6">

                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Participants to advance
                      </label>

                      <select
                        value={
                          selectedCount
                        }
                        onChange={(event) =>
                          setSelectedCount(
                            Number(
                              event.target.value
                            )
                          )
                        }
                        disabled={
                          advancing
                        }
                        className="w-full bg-black border border-gray-700 focus:border-[#D4AF37] rounded-xl px-4 py-4 text-white outline-none"
                      >
                        {qualificationOptions.map(
                          (count) => (
                            <option
                              key={count}
                              value={count}
                            >
                              {count} Participants
                            </option>
                          )
                        )}
                      </select>

                    </div>

                    <div className="mt-6 p-4 rounded-xl border border-[#222] bg-black">

                      <label className="flex items-start gap-3 cursor-pointer">

                        <input
                          type="checkbox"
                          checked={
                            includeThirdPlace
                          }
                          onChange={(event) =>
                            setIncludeThirdPlace(
                              event.target.checked
                            )
                          }
                          disabled={
                            advancing
                          }
                          className="mt-1 w-4 h-4 accent-[#D4AF37]"
                        />

                        <span>

                          <span className="block text-sm font-semibold text-white">
                            Include 3rd Place Match
                          </span>

                          <span className="block text-xs text-gray-500 mt-1">
                            Creates a separate
                            Third Place match
                            between the losing
                            semifinalists.
                          </span>

                        </span>

                      </label>

                    </div>

                    <button
                      type="button"
                      onClick={
                        advanceToKnockout
                      }
                      disabled={
                        advancing ||
                        qualificationOptions.length ===
                          0
                      }
                      className="w-full mt-6 bg-[#D4AF37] hover:bg-[#e2bf4d] disabled:bg-gray-700 disabled:text-gray-400 text-black px-5 py-4 rounded-xl font-bold transition"
                    >
                      {advancing
                        ? "Generating Knockout..."
                        : `🏆 Advance ${selectedCount} Participants`}
                    </button>

                  </div>

                  <div className="p-6">

                    <h3 className="text-lg font-bold uppercase text-[#D4AF37]">
                      Qualification Preview
                    </h3>

                    <p className="text-sm text-gray-400 mt-2">
                      The highest-ranked
                      participants will enter
                      the Knockout bracket.
                    </p>

                    <div className="mt-5 overflow-x-auto">

                      <table className="w-full">

                        <thead>

                          <tr className="border-b border-[#222] text-left text-xs text-gray-500">

                            <th className="py-3">
                              Rank
                            </th>

                            <th className="py-3">
                              Participant
                            </th>

                            <th className="py-3">
                              Type
                            </th>

                            <th className="py-3 text-right">
                              Points
                            </th>

                          </tr>

                        </thead>

                        <tbody>

                          {standingsQualifiers.map(
                            (
                              standing,
                              index
                            ) => (
                              <tr
                                key={`${standing.type}-${standing.id}`}
                                className="border-b border-[#222]"
                              >

                                <td className="py-3">

                                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-800 text-gray-300 text-xs font-bold">
                                    {
                                      index +
                                      1
                                    }
                                  </span>

                                </td>

                                <td className="py-3">

                                  <div className="font-semibold text-white">
                                    {
                                      standing.name
                                    }
                                  </div>

                                  <div className="text-[11px] text-gray-600">
                                    {
                                      standing.type
                                    }{" "}
                                    ID:{" "}
                                    {
                                      standing.id
                                    }
                                  </div>

                                </td>

                                <td className="py-3">

                                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400">
                                    {
                                      standing.type
                                    }
                                  </span>

                                </td>

                                <td className="py-3 text-right font-bold text-[#D4AF37]">
                                  {
                                    standing.points
                                  }
                                </td>

                              </tr>
                            )
                          )}

                        </tbody>

                      </table>

                    </div>

                  </div>

                </div>
              )}

          </>
        )}

        {/* =================================================
            GROUP STAGE + KNOCKOUT
        ================================================= */}

        {tournamentFormat ===
          "group_knockout" && (
          <>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

              <div className="rounded-xl p-5 border border-purple-500/30 bg-purple-500/5">

                <p className="text-xs text-gray-400">
                  Approved Participants
                </p>

                <p className="text-2xl font-bold text-purple-400 mt-2">
                  {
                    uniqueApprovedParticipants.length
                  }
                </p>

                <p className="text-xs text-gray-500 mt-2">
                  Participants available
                </p>

              </div>

              <div className="rounded-xl p-5 border border-[#D4AF37]/30 bg-[#D4AF37]/5">

                <p className="text-xs text-gray-400">
                  Qualification Rule
                </p>

                <p className="text-2xl font-bold text-[#D4AF37] mt-2">
                  {
                    advancingPerGroup
                  }
                </p>

                <p className="text-xs text-gray-500 mt-2">
                  Participants per group
                </p>

              </div>

              <div className="rounded-xl p-5 border border-green-500/30 bg-green-500/5">

                <p className="text-xs text-gray-400">
                  Qualification
                </p>

                <p className="text-lg font-bold text-green-400 mt-2">
                  Group Based
                </p>

                <p className="text-xs text-gray-500 mt-2">
                  Top participants from each
                  group advance
                </p>

              </div>

              <div className="rounded-xl p-5 border border-blue-500/30 bg-blue-500/5">

                <p className="text-xs text-gray-400">
                  Knockout
                </p>

                <p className="text-lg font-bold text-blue-400 mt-2">
                  {knockoutGenerated
                    ? "Generated"
                    : "Waiting"}
                </p>

                <p className="text-xs text-gray-500 mt-2">
                  {knockoutGenerated
                    ? `${knockoutMatches.length} matches`
                    : "Not created yet"}
                </p>

              </div>

            </div>

            <div className="mt-6 border border-[#222] rounded-xl overflow-hidden">

              <div className="p-6 border-b border-[#222]">

                <h3 className="text-lg font-bold uppercase text-white">
                  Group Stage Qualification
                </h3>

                <p className="text-sm text-gray-400 mt-2 max-w-3xl">
                  This tournament qualifies
                  participants independently from
                  each group. The selected number
                  below applies to <strong className="text-white">
                    every group
                  </strong>, not to the tournament as
                  a whole.
                </p>

              </div>

              <div className="p-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  <div>

                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Participants advancing per group
                    </label>

                    <select
                      value={
                        advancingPerGroup
                      }
                      onChange={(event) =>
                        setAdvancingPerGroup(
                          Number(
                            event.target.value
                          )
                        )
                      }
                      disabled={
                        advancing
                      }
                      className="w-full bg-black border border-gray-700 focus:border-[#D4AF37] rounded-xl px-4 py-4 text-white outline-none"
                    >

                      {Array.from(
                        {
                          length: 8,
                        },
                        (_, index) =>
                          index + 1
                      ).map(
                        (count) => (
                          <option
                            key={count}
                            value={count}
                          >
                            {count}{" "}
                            {count === 1
                              ? "Participant"
                              : "Participants"}{" "}
                            per Group
                          </option>
                        )
                      )}

                    </select>

                    <p className="text-xs text-gray-500 mt-2">
                      Current selection:{" "}
                      <span className="text-[#D4AF37] font-semibold">
                        {advancingPerGroup}
                      </span>{" "}
                      per group.
                    </p>

                  </div>

                  <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-5">

                    <p className="text-xs text-gray-400 uppercase">
                      How qualification works
                    </p>

                    <p className="text-sm text-gray-300 mt-2 leading-6">
                      If there are 4 groups and
                      you select 2 per group,
                      the system advances the
                      top 2 from Group A, top 2
                      from Group B, top 2 from
                      Group C and top 2 from
                      Group D.
                    </p>

                    <p className="text-xs text-[#D4AF37] mt-3 font-semibold">
                      The backend determines the
                      actual group membership and
                      standings.
                    </p>

                  </div>

                </div>

                <div className="mt-6 p-4 rounded-xl border border-[#222] bg-black">

                  <label className="flex items-start gap-3 cursor-pointer">

                    <input
                      type="checkbox"
                      checked={
                        includeThirdPlace
                      }
                      onChange={(event) =>
                        setIncludeThirdPlace(
                          event.target.checked
                        )
                      }
                      disabled={
                        advancing
                      }
                      className="mt-1 w-4 h-4 accent-[#D4AF37]"
                    />

                    <span>

                      <span className="block text-sm font-semibold text-white">
                        Include 3rd Place Match
                      </span>

                      <span className="block text-xs text-gray-500 mt-1">
                        Creates a separate
                        Third Place match between
                        the losing semifinalists.
                      </span>

                    </span>

                  </label>

                </div>

                <button
                  type="button"
                  onClick={
                    advanceToKnockout
                  }
                  disabled={
                    advancing ||
                    !groupTournamentReady
                  }
                  className="w-full mt-6 bg-[#D4AF37] hover:bg-[#e2bf4d] disabled:bg-gray-700 disabled:text-gray-400 text-black px-5 py-4 rounded-xl font-bold transition"
                >
                  {advancing
                    ? "Generating Knockout..."
                    : `🏆 Advance ${advancingPerGroup} Per Group`}
                </button>

                <p className="text-xs text-gray-500 mt-3 text-center">
                  Group membership and group
                  standings are resolved by the
                  advancement API.
                </p>

              </div>

            </div>

            {knockoutGenerated && (
              <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">

                <h3 className="text-lg font-bold text-blue-400">
                  Knockout Stage Generated
                </h3>

                <p className="text-sm text-gray-400 mt-2">
                  The qualified participants from
                  each group have entered the
                  Knockout stage.
                </p>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">

                  <div className="bg-black rounded-lg p-4">

                    <p className="text-gray-500 text-sm">
                      Knockout Matches
                    </p>

                    <p className="text-2xl font-bold mt-1 text-white">
                      {
                        knockoutMatches.length
                      }
                    </p>

                  </div>

                  <div className="bg-black rounded-lg p-4">

                    <p className="text-gray-500 text-sm">
                      Per Group
                    </p>

                    <p className="text-2xl font-bold mt-1 text-[#D4AF37]">
                      {
                        advancingPerGroup
                      }
                    </p>

                  </div>

                  <div className="bg-black rounded-lg p-4">

                    <p className="text-gray-500 text-sm">
                      3rd Place
                    </p>

                    <p className="text-lg font-bold mt-1 text-green-400">
                      {includeThirdPlace
                        ? "Enabled"
                        : "Disabled"}
                    </p>

                  </div>

                </div>

              </div>
            )}

          </>
        )}

        {/* =================================================
            KNOCKOUT ONLY
        ================================================= */}

        {tournamentFormat ===
          "knockout" && (
          <>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <div className="rounded-xl p-5 border border-purple-500/30 bg-purple-500/5">

                <p className="text-xs text-gray-400">
                  Approved Participants
                </p>

                <p className="text-2xl font-bold text-purple-400 mt-2">
                  {
                    knockoutParticipantCount
                  }
                </p>

                <p className="text-xs text-gray-500 mt-2">
                  Automatically detected
                </p>

              </div>

              <div className="rounded-xl p-5 border border-[#D4AF37]/30 bg-[#D4AF37]/5">

                <p className="text-xs text-gray-400">
                  Participants Entering Knockout
                </p>

                <p className="text-2xl font-bold text-[#D4AF37] mt-2">
                  {
                    knockoutParticipantCount
                  }
                </p>

                <p className="text-xs text-gray-500 mt-2">
                  All approved participants
                </p>

              </div>

              <div className="rounded-xl p-5 border border-blue-500/30 bg-blue-500/5">

                <p className="text-xs text-gray-400">
                  Knockout
                </p>

                <p className="text-lg font-bold text-blue-400 mt-2">
                  {knockoutGenerated
                    ? "Generated"
                    : "Not Generated"}
                </p>

                <p className="text-xs text-gray-500 mt-2">
                  {knockoutGenerated
                    ? `${knockoutMatches.length} matches`
                    : "Ready to generate"}
                </p>

              </div>

            </div>

            {!knockoutGenerated && (
              <div className="mt-6 border border-[#222] rounded-xl overflow-hidden">

                <div className="p-6 border-b border-[#222]">

                  <h3 className="text-lg font-bold uppercase text-white">
                    Create Knockout Stage
                  </h3>

                  <p className="text-sm text-gray-400 mt-2">
                    All approved participants
                    automatically enter this
                    Knockout tournament.
                  </p>

                </div>

                <div className="p-6">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div className="bg-black border border-[#222] rounded-xl p-5">

                      <p className="text-xs text-gray-500 uppercase">
                        Detected Participants
                      </p>

                      <p className="text-3xl font-bold text-[#D4AF37] mt-2">
                        {
                          knockoutParticipantCount
                        }
                      </p>

                    </div>

                    <div className="bg-black border border-[#222] rounded-xl p-5">

                      <p className="text-xs text-gray-500 uppercase">
                        Bracket Participants
                      </p>

                      <p className="text-3xl font-bold text-green-400 mt-2">
                        {
                          knockoutParticipantCount
                        }
                      </p>

                    </div>

                  </div>

                  <div className="mt-6 p-4 rounded-xl border border-[#222] bg-black">

                    <label className="flex items-start gap-3 cursor-pointer">

                      <input
                        type="checkbox"
                        checked={
                          includeThirdPlace
                        }
                        onChange={(event) =>
                          setIncludeThirdPlace(
                            event.target.checked
                          )
                        }
                        disabled={
                          advancing
                        }
                        className="mt-1 w-4 h-4 accent-[#D4AF37]"
                      />

                      <span>

                        <span className="block text-sm font-semibold text-white">
                          Include 3rd Place Match
                        </span>

                        <span className="block text-xs text-gray-500 mt-1">
                          The losing semifinalists
                          will play a separate
                          third-place match.
                        </span>

                      </span>

                    </label>

                  </div>

                  <button
                    type="button"
                    onClick={
                      advanceToKnockout
                    }
                    disabled={
                      advancing ||
                      knockoutParticipantCount ===
                        0
                    }
                    className="w-full mt-6 bg-[#D4AF37] hover:bg-[#e2bf4d] disabled:bg-gray-700 disabled:text-gray-400 text-black px-5 py-4 rounded-xl font-bold transition"
                  >
                    {advancing
                      ? "Generating Knockout Bracket..."
                      : `🏆 Generate Knockout Bracket (${knockoutParticipantCount} Participants)`}
                  </button>

                  <p className="text-xs text-gray-500 mt-3 text-center">
                    No Round Robin or Group Stage
                    qualification is required.
                  </p>

                </div>

              </div>
            )}

            {knockoutGenerated && (
              <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">

                <h3 className="text-lg font-bold text-blue-400">
                  Knockout Stage Generated
                </h3>

                <p className="text-sm text-gray-400 mt-2">
                  All approved participants have
                  been placed into the Knockout
                  stage.
                </p>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">

                  <div className="bg-black rounded-lg p-4">

                    <p className="text-gray-500 text-sm">
                      Knockout Matches
                    </p>

                    <p className="text-2xl font-bold mt-1 text-white">
                      {
                        knockoutMatches.length
                      }
                    </p>

                  </div>

                  <div className="bg-black rounded-lg p-4">

                    <p className="text-gray-500 text-sm">
                      Participants
                    </p>

                    <p className="text-2xl font-bold mt-1 text-[#D4AF37]">
                      {
                        knockoutParticipantCount
                      }
                    </p>

                  </div>

                  <div className="bg-black rounded-lg p-4">

                    <p className="text-gray-500 text-sm">
                      3rd Place
                    </p>

                    <p className="text-lg font-bold mt-1 text-green-400">
                      {includeThirdPlace
                        ? "Enabled"
                        : "Disabled"}
                    </p>

                  </div>

                </div>

              </div>
            )}

          </>
        )}

      </div>
    </section>
  );
}