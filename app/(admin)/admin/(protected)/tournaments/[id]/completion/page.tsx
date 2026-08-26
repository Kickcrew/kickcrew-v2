"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Registration {
  id: number;
  tournament_id: number;
  team_id: number | null;
  player_id: number | null;
  status: string;

  teams?: {
    id: number;
    team_name: string;
  } | null;

  players?: {
    id: number;
    full_name: string;
    gamer_tag: string;
  } | null;
}

interface Match {
  id: number;
  tournament_id: number;
  team_a_id: number | null;
  team_b_id: number | null;
  player_a_id: number | null;
  player_b_id: number | null;
  round: string;
  match_number: number;
  score_team_a: number | null;
  score_team_b: number | null;
  winner_id: number | null;
  status: string;
}

interface Standing {
  key: string;
  name: string;
  type: "Team" | "Player";
  played: number;
  wins: number;
  draws: number;
  losses: number;
  scoreFor: number;
  scoreAgainst: number;
  difference: number;
  points: number;
}

interface Tournament {
  id: number;
  tournament_name: string;
  tournament_type: string | null;
  status: string | null;
}
interface Tournament {
  id: number;
  tournament_name: string;
  tournament_type: string | null;
  status: string | null;

  // keep your existing fields below
}

export default function TournamentCompletionPage() {
  const params = useParams();
  const router = useRouter();

  const tournamentId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [tournament, setTournament] =
    useState<Tournament | null>(null);

  const [participants, setParticipants] =
    useState<Registration[]>([]);

  const [matches, setMatches] =
    useState<Match[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [completing, setCompleting] =
    useState(false);

  useEffect(() => {
    if (!tournamentId) return;

    async function loadData() {
      try {
        setLoading(true);

        const [
          tournamentResponse,
          registrationsResponse,
          matchesResponse,
        ] = await Promise.all([
          fetch(
            `/api/tournaments/${tournamentId}`
          ),
          fetch(
            `/api/tournament-registrations?tournament_id=${tournamentId}`
          ),
          fetch(
            `/api/matches?tournament_id=${tournamentId}`
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
              "Failed to load participants."
          );
        }

        if (
          !matchesResponse.ok ||
          !matchesResult.success
        ) {
          throw new Error(
            matchesResult.message ||
              "Failed to load matches."
          );
        }

        setTournament(
          tournamentResult.tournament
        );

        setParticipants(
          (registrationsResult.registrations ?? []).filter(
            (registration: Registration) =>
              registration.status === "Approved"
          )
        );

        setMatches(
          matchesResult.matches ?? []
        );
      } catch (error) {
        console.error(
          "Failed to load completion data:",
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : "Failed to load tournament completion data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [tournamentId]);

  function getParticipantName(
    key: string
  ): string {
    const [type, idString] =
      key.split("-");

    const id = Number(idString);

    const participant =
      participants.find((item) => {
        if (type === "team") {
          return item.team_id === id;
        }

        return item.player_id === id;
      });

    if (!participant) {
      return `${type === "team" ? "Team" : "Player"} #${id}`;
    }

    if (type === "team") {
      return (
        participant.teams?.team_name ??
        `Team #${id}`
      );
    }

    return (
      participant.players?.gamer_tag ||
      participant.players?.full_name ||
      `Player #${id}`
    );
  }

  function calculateStandings(): Standing[] {
    const approvedParticipants =
      participants;

    const standingsMap =
      new Map<string, Standing>();

    for (const participant of approvedParticipants) {
      if (participant.team_id !== null) {
        const key =
          `team-${participant.team_id}`;

        standingsMap.set(key, {
          key,
          name: getParticipantName(key),
          type: "Team",
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          scoreFor: 0,
          scoreAgainst: 0,
          difference: 0,
          points: 0,
        });
      }

      if (participant.player_id !== null) {
        const key =
          `player-${participant.player_id}`;

        standingsMap.set(key, {
          key,
          name: getParticipantName(key),
          type: "Player",
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          scoreFor: 0,
          scoreAgainst: 0,
          difference: 0,
          points: 0,
        });
      }
    }

    const completedMatches =
      matches.filter(
        (match) =>
          match.status === "Completed"
      );

    for (const match of completedMatches) {
      const scoreA =
        match.score_team_a ?? 0;

      const scoreB =
        match.score_team_b ?? 0;

      let keyA: string | null = null;
      let keyB: string | null = null;

      if (
        match.team_a_id !== null &&
        match.team_b_id !== null
      ) {
        keyA =
          `team-${match.team_a_id}`;

        keyB =
          `team-${match.team_b_id}`;
      } else if (
        match.player_a_id !== null &&
        match.player_b_id !== null
      ) {
        keyA =
          `player-${match.player_a_id}`;

        keyB =
          `player-${match.player_b_id}`;
      }

      if (!keyA || !keyB) {
        continue;
      }

      const standingA =
        standingsMap.get(keyA);

      const standingB =
        standingsMap.get(keyB);

      if (!standingA || !standingB) {
        continue;
      }

      standingA.played += 1;
      standingB.played += 1;

      standingA.scoreFor += scoreA;
      standingA.scoreAgainst += scoreB;

      standingB.scoreFor += scoreB;
      standingB.scoreAgainst += scoreA;

      if (scoreA > scoreB) {
        standingA.wins += 1;
        standingA.points += 3;

        standingB.losses += 1;
      } else if (scoreB > scoreA) {
        standingB.wins += 1;
        standingB.points += 3;

        standingA.losses += 1;
      } else {
        standingA.draws += 1;
        standingB.draws += 1;

        standingA.points += 1;
        standingB.points += 1;
      }
    }

    const standings =
      Array.from(
        standingsMap.values()
      );

    for (const standing of standings) {
      standing.difference =
        standing.scoreFor -
        standing.scoreAgainst;
    }

    standings.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }

      if (
        b.difference !==
        a.difference
      ) {
        return (
          b.difference -
          a.difference
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

      return a.name.localeCompare(
        b.name
      );
    });

    return standings;
  }

 async function completeTournament() {
  if (!tournament) {
    return;
  }

  /*
   * --------------------------------------------------
   * 1. TOURNAMENT MUST HAVE FIXTURES
   * --------------------------------------------------
   */

  if (matches.length === 0) {
    alert(
      "The tournament cannot be completed because no fixtures have been generated."
    );

    return;
  }

  /*
   * --------------------------------------------------
   * 2. CHECK ALL GENERATED MATCHES
   * --------------------------------------------------
   */

  const incompleteMatches = matches.filter(
    (match) =>
      String(match.status ?? "").toLowerCase() !==
      "completed"
  );

  if (incompleteMatches.length > 0) {
    alert(
      `The tournament cannot be completed yet. ${
        incompleteMatches.length
      } match${
        incompleteMatches.length === 1
          ? ""
          : "es"
      } still need to be completed.`
    );

    return;
  }

  /*
   * --------------------------------------------------
   * 3. CALCULATE FINAL STANDINGS
   * --------------------------------------------------
   */

  const standings = calculateStandings();

  if (standings.length === 0) {
    alert(
      "No standings could be calculated."
    );

    return;
  }

  /*
   * --------------------------------------------------
   * 4. DETERMINE WHETHER KNOCKOUT IS REQUIRED
   * --------------------------------------------------
   *
   * A tournament with only Round Robin fixtures
   * must not automatically be considered finished
   * if its format requires advancement to Knockout.
   *
   * We will inspect the tournament type here.
   */

  const tournamentType =
    String(
      tournament.tournament_type ?? ""
    )
      .trim()
      .toLowerCase();

  const requiresKnockout =
    tournamentType.includes("knockout") ||
    tournamentType.includes("round robin") ||
    tournamentType.includes("league");

  /*
   * --------------------------------------------------
   * 5. DETECT KNOCKOUT FIXTURES
   * --------------------------------------------------
   */

  const knockoutMatches =
    matches.filter((match) => {
      const round = String(
        match.round ?? ""
      )
        .trim()
        .toLowerCase();

      return (
        round.includes("quarterfinal") ||
        round.includes("quarter-final") ||
        round.includes("semifinal") ||
        round.includes("semi-final") ||
        round.includes("final") ||
        round.includes("third place") ||
        round.includes("knockout")
      );
    });

  /*
   * --------------------------------------------------
   * 6. BLOCK COMPLETION IF KNOCKOUT IS REQUIRED
   * --------------------------------------------------
   */

  if (
    requiresKnockout &&
    knockoutMatches.length === 0
  ) {
    alert(
      "The tournament cannot be completed yet. The Knockout stage has not been generated or played."
    );

    return;
  }

  /*
   * --------------------------------------------------
   * 7. ALL CHECKS PASSED
   * --------------------------------------------------
   *
   * Continue with your existing completion code
   * below this point.
   */

    const champion =
      standings[0];

    const confirmed =
      window.confirm(
        `Complete this tournament?\n\nChampion: ${champion.name}\n\nThis will mark the tournament as Completed.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setCompleting(true);

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

      alert(
        `Tournament completed successfully.\n\nChampion: ${champion.name}`
      );

      router.push(
        `/admin/tournaments/${tournamentId}`
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Tournament completion error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to complete tournament."
      );
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-10">
        <p className="text-gray-400">
          Loading tournament completion data...
        </p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-5xl mx-auto py-10">
        <h1 className="text-2xl font-bold">
          Tournament not found
        </h1>

        <Link
          href="/admin/tournaments"
          className="inline-block mt-5 text-[#D4AF37] hover:underline"
        >
          ← Back to Tournaments
        </Link>
      </div>
    );
  }

  const standings =
    calculateStandings();

  const completedMatches =
    matches.filter(
      (match) =>
        match.status === "Completed"
    );

  const incompleteMatches =
    matches.filter(
      (match) =>
        match.status !== "Completed"
    );

  const canComplete =
    matches.length > 0 &&
    incompleteMatches.length === 0 &&
    standings.length > 0;

  const champion =
    standings.length > 0
      ? standings[0]
      : null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* HEADER */}

      <div>
        <Link
          href={`/admin/tournaments/${tournamentId}`}
          className="text-gray-400 hover:text-white transition"
        >
          ← Back to Tournament Management
        </Link>

        <h1 className="text-4xl font-bold mt-5">
          Tournament Completion
        </h1>

        <p className="text-gray-400 mt-2">
          Review the final tournament results
          and officially complete the tournament.
        </p>
      </div>

      {/* STATUS */}

      <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

          <div>
            <p className="text-gray-400 text-sm">
              Tournament
            </p>

            <h2 className="text-2xl font-bold mt-1">
              {tournament.tournament_name}
            </h2>
          </div>

          <div>
            <span className="inline-flex px-4 py-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37] font-semibold">
              {tournament.status}
            </span>
          </div>

        </div>

      </div>

      {/* COMPLETION CHECK */}

      <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6">

        <h2 className="text-xl font-bold">
          Completion Status
        </h2>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="bg-black rounded-xl p-5">

            <p className="text-gray-500 text-sm">
              Total Matches
            </p>

            <p className="text-3xl font-bold mt-2">
              {matches.length}
            </p>

          </div>

          <div className="bg-black rounded-xl p-5">

            <p className="text-gray-500 text-sm">
              Completed Matches
            </p>

            <p className="text-3xl font-bold text-green-400 mt-2">
              {completedMatches.length}
            </p>

          </div>

          <div className="bg-black rounded-xl p-5">

            <p className="text-gray-500 text-sm">
              Remaining Matches
            </p>

            <p className="text-3xl font-bold text-yellow-400 mt-2">
              {incompleteMatches.length}
            </p>

          </div>

        </div>

        <div className="mt-6">

          {matches.length === 0 && (
            <div className="border border-red-500/30 bg-red-500/10 rounded-xl p-5 text-red-300">
              No fixtures have been generated.
              The tournament cannot be completed.
            </div>
          )}

          {matches.length > 0 &&
            incompleteMatches.length > 0 && (
              <div className="border border-yellow-500/30 bg-yellow-500/10 rounded-xl p-5 text-yellow-300">
                The tournament cannot be completed
                yet. All tournament matches must be
                completed first.
              </div>
            )}

          {canComplete && (
            <div className="border border-green-500/30 bg-green-500/10 rounded-xl p-5 text-green-300">
              All tournament matches are completed.
              The tournament is ready to be officially
              completed.
            </div>
          )}

        </div>

      </div>

      {/* CHAMPION */}

      {champion && (
        <div className="bg-[#111111] border border-[#D4AF37]/40 rounded-2xl p-8">

          <p className="text-[#D4AF37] uppercase tracking-widest text-sm font-bold">
            Current Champion
          </p>

          <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-6">

            <div>

              <h2 className="text-4xl font-bold">
                🏆 {champion.name}
              </h2>

              <p className="text-gray-400 mt-2">
                {champion.type} ·{" "}
                {champion.points} points
              </p>

            </div>

            <div className="text-right">

              <p className="text-gray-500 text-sm">
                Record
              </p>

              <p className="font-semibold mt-1">
                {champion.wins}W{" "}
                {champion.draws}D{" "}
                {champion.losses}L
              </p>

            </div>

          </div>

        </div>
      )}

      {/* FINAL STANDINGS */}

      <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl overflow-hidden">

        <div className="p-6 border-b border-[#222]">

          <h2 className="text-2xl font-bold">
            Final Standings Preview
          </h2>

          <p className="text-gray-400 mt-1">
            These rankings will determine the final
            tournament result.
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[850px]">

            <thead className="bg-black">

              <tr className="text-left">

                <th className="p-5">
                  #
                </th>

                <th>
                  Participant
                </th>

                <th>
                  Type
                </th>

                <th>
                  P
                </th>

                <th>
                  W
                </th>

                <th>
                  D
                </th>

                <th>
                  L
                </th>

                <th>
                  SF
                </th>

                <th>
                  SA
                </th>

                <th>
                  Diff
                </th>

                <th className="pr-5">
                  Pts
                </th>

              </tr>

            </thead>

            <tbody>

              {standings.map(
                (standing, index) => (
                  <tr
                    key={standing.key}
                    className="border-t border-[#222]"
                  >

                    <td className="p-5 font-bold">
                      {index === 0
                        ? "🏆"
                        : index + 1}
                    </td>

                    <td className="font-semibold">
                      {standing.name}
                    </td>

                    <td>
                      <span className="px-3 py-1 rounded-full text-xs bg-purple-600/20 text-purple-300 border border-purple-500/30">
                        {standing.type}
                      </span>
                    </td>

                    <td>
                      {standing.played}
                    </td>

                    <td className="text-green-400">
                      {standing.wins}
                    </td>

                    <td className="text-yellow-400">
                      {standing.draws}
                    </td>

                    <td className="text-red-400">
                      {standing.losses}
                    </td>

                    <td>
                      {standing.scoreFor}
                    </td>

                    <td>
                      {standing.scoreAgainst}
                    </td>

                    <td
                      className={
                        standing.difference >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {standing.difference > 0
                        ? `+${standing.difference}`
                        : standing.difference}
                    </td>

                    <td className="pr-5">

                      <span className="inline-flex px-3 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 font-bold">
                        {standing.points}
                      </span>

                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* ACTIONS */}

      <div className="flex flex-wrap gap-4 pt-2">

        <button
          type="button"
          onClick={completeTournament}
          disabled={
            completing ||
            !canComplete ||
            tournament.status ===
              "Completed"
          }
          className="bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {completing
            ? "Completing Tournament..."
            : tournament.status ===
              "Completed"
            ? "Tournament Completed"
            : "Complete Tournament"}
        </button>

        <Link
          href={`/admin/tournaments/${tournamentId}/standings`}
          className="bg-black border border-gray-700 px-6 py-3 rounded-xl font-semibold hover:border-[#D4AF37] transition"
        >
          View Standings
        </Link>

        <Link
          href={`/admin/tournaments/${tournamentId}/matches`}
          className="bg-black border border-gray-700 px-6 py-3 rounded-xl font-semibold hover:border-[#D4AF37] transition"
        >
          View Matches
        </Link>

        <Link
          href={`/admin/tournaments/${tournamentId}`}
          className="bg-black border border-gray-700 px-6 py-3 rounded-xl font-semibold hover:border-[#D4AF37] transition"
        >
          Cancel
        </Link>

      </div>

    </div>
  );
}