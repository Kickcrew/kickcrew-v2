"use client";

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
  team_id?: number | null;
  player_id?: number | null;
  status?: string | null;

  teams?: Team | Team[] | null;
  players?: Player | Player[] | null;
}

/*
 * IMPORTANT
 *
 * These properties intentionally match the flexible
 * Match shape used by the tournament page.
 *
 * They are optional because the API/page Match type
 * allows some of them to be undefined.
 */
interface TournamentResultMatch {
  id: number;

  team_a_id?: number | null;
  team_b_id?: number | null;

  player_a_id?: number | null;
  player_b_id?: number | null;

  round?: string | null;

  winner_id?: number | null;

  score_team_a?: number | null;
  score_team_b?: number | null;

  status?: string | null;
}

interface TournamentResultsProps {
  matches: TournamentResultMatch[];
  registrations: Registration[];
}

interface ResultParticipant {
  id: number;
  name: string;
  type: "Team" | "Player";
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

/* =========================================================
   PARTICIPANT LOOKUP
========================================================= */

function getParticipant(
  id: number | null | undefined,
  registrations: Registration[]
): ResultParticipant | null {
  if (id == null) {
    return null;
  }

  for (const registration of registrations) {
    /*
     * TEAM
     */
    if (
      registration.team_id != null &&
      Number(registration.team_id) === Number(id)
    ) {
      const team = firstRelation(
        registration.teams
      );

      return {
        id,
        name:
          team?.team_name?.trim() ||
          `Team #${id}`,
        type: "Team",
      };
    }

    /*
     * PLAYER
     */
    if (
      registration.player_id != null &&
      Number(registration.player_id) === Number(id)
    ) {
      const player = firstRelation(
        registration.players
      );

      return {
        id,
        name:
          player?.gamer_tag?.trim() ||
          player?.full_name?.trim() ||
          `Player #${id}`,
        type: "Player",
      };
    }
  }

  /*
   * The participant might not have a
   * relationship returned by Supabase.
   *
   * We still return a fallback name.
   */
  return {
    id,
    name: `Participant #${id}`,
    type: "Player",
  };
}

/* =========================================================
   MATCH PARTICIPANTS
========================================================= */

function getMatchParticipants(
  match: TournamentResultMatch
): {
  a: number | null;
  b: number | null;
} {
  /*
   * If either team ID exists, this is treated
   * as a team match.
   */
  const isTeamMatch =
    match.team_a_id != null ||
    match.team_b_id != null;

  if (isTeamMatch) {
    return {
      a: match.team_a_id ?? null,
      b: match.team_b_id ?? null,
    };
  }

  return {
    a: match.player_a_id ?? null,
    b: match.player_b_id ?? null,
  };
}

/* =========================================================
   WINNER
========================================================= */

function getWinnerId(
  match: TournamentResultMatch
): number | null {
  /*
   * Prefer the database winner_id.
   */
  if (match.winner_id != null) {
    return Number(match.winner_id);
  }

  /*
   * Fall back to the recorded scores.
   */
  const {
    a,
    b,
  } = getMatchParticipants(match);

  if (
    a == null ||
    b == null
  ) {
    return null;
  }

  if (
    match.score_team_a == null ||
    match.score_team_b == null
  ) {
    return null;
  }

  /*
   * Draws do not produce a tournament winner.
   */
  if (
    match.score_team_a ===
    match.score_team_b
  ) {
    return null;
  }

  return match.score_team_a >
    match.score_team_b
    ? a
    : b;
}

/* =========================================================
   COMPLETION
========================================================= */

function isCompleted(
  match: TournamentResultMatch
): boolean {
  return (
    normalize(match.status) ===
      "completed" &&
    getWinnerId(match) != null
  );
}

/* =========================================================
   ROUND DETECTION
========================================================= */

function isFinal(
  match: TournamentResultMatch
): boolean {
  const round = normalize(
    match.round
  );

  if (!round) {
    return false;
  }

  /*
   * Supported examples:
   *
   * Final
   * Grand Final
   * Knockout Final
   * Final - Round 1
   */
  return (
    round === "final" ||
    round.includes("grand final") ||
    round.includes("knockout final")
  );
}

function isThirdPlaceMatch(
  match: TournamentResultMatch
): boolean {
  const round = normalize(
    match.round
  );

  if (!round) {
    return false;
  }

  return (
    round.includes("3rd place") ||
    round.includes("third place") ||
    round.includes("third-place") ||
    round.includes("bronze")
  );
}

function isSemifinal(
  match: TournamentResultMatch
): boolean {
  const round = normalize(
    match.round
  );

  if (!round) {
    return false;
  }

  return (
    round.includes("semifinal") ||
    round.includes("semi-final") ||
    round.includes("semi final")
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function TournamentResults({
  matches,
  registrations,
}: TournamentResultsProps) {
  /*
   * Only completed knockout-result matches
   * are relevant here.
   */
  const completedKnockoutMatches =
    matches.filter((match) => {
      if (!isCompleted(match)) {
        return false;
      }

      const round = normalize(
        match.round
      );

      /*
       * Do not use Round Robin matches
       * to determine final positions.
       */
      return (
        round.includes("final") ||
        round.includes("semifinal") ||
        round.includes("semi-final") ||
        round.includes("semi final") ||
        round.includes("3rd place") ||
        round.includes("third place") ||
        round.includes("third-place") ||
        round.includes("bronze")
      );
    });

  /* =======================================================
     FIND FINAL
  ======================================================= */

  const finalMatch =
    completedKnockoutMatches.find(
      isFinal
    );

  /*
   * The final has not been completed yet.
   */
  if (!finalMatch) {
    return (
      <section className="mt-6 bg-[#111111] border border-[#D4AF37]/20 rounded-xl overflow-hidden">

        <div className="p-6 border-b border-[#222]">
          <h2 className="text-xl font-bold uppercase text-white">
            Tournament Results
          </h2>

          <p className="text-sm text-gray-400 mt-1">
            Champion, Runner-up and 3rd Place
            will be determined from the
            completed Knockout stage.
          </p>
        </div>

        <div className="p-6">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5">

            <h3 className="font-bold text-yellow-400">
              Final Not Completed
            </h3>

            <p className="text-sm text-gray-400 mt-1">
              Complete the Knockout Final to
              determine the Champion and
              Runner-up.
            </p>

          </div>
        </div>

      </section>
    );
  }

  /* =======================================================
     CHAMPION + RUNNER-UP
  ======================================================= */

  const championId =
    getWinnerId(finalMatch);

  const {
    a: finalParticipantA,
    b: finalParticipantB,
  } = getMatchParticipants(
    finalMatch
  );

  let runnerUpId:
    | number
    | null = null;

  if (championId != null) {
    if (
      finalParticipantA ===
      championId
    ) {
      runnerUpId =
        finalParticipantB;
    } else if (
      finalParticipantB ===
      championId
    ) {
      runnerUpId =
        finalParticipantA;
    }
  }

  /* =======================================================
     THIRD PLACE
  ======================================================= */

  let thirdPlaceId:
    | number
    | null = null;

  /*
   * FIRST:
   *
   * Look for a dedicated 3rd-place match.
   */
  const thirdPlaceMatch =
    completedKnockoutMatches.find(
      isThirdPlaceMatch
    );

  if (thirdPlaceMatch) {
    thirdPlaceId =
      getWinnerId(
        thirdPlaceMatch
      );
  }

  /*
   * SECOND:
   *
   * If there is no dedicated 3rd-place
   * match, identify the semifinal losers.
   */
  if (thirdPlaceId == null) {
    const semifinalMatches =
      completedKnockoutMatches.filter(
        isSemifinal
      );

    const semifinalLosers:
      number[] = [];

    for (
      const semifinal
      of semifinalMatches
    ) {
      const winner =
        getWinnerId(
          semifinal
        );

      const {
        a,
        b,
      } = getMatchParticipants(
        semifinal
      );

      if (
        winner == null
      ) {
        continue;
      }

      let loser:
        | number
        | null = null;

      if (winner === a) {
        loser = b;
      } else if (
        winner === b
      ) {
        loser = a;
      }

      if (loser != null) {
        semifinalLosers.push(
          loser
        );
      }
    }

    /*
     * IMPORTANT:
     *
     * With two semifinal losers but no
     * 3rd-place match, we do NOT invent a
     * winner.
     *
     * We display 3rd Place as
     * "Not determined" until the tournament
     * provides a dedicated 3rd-place match.
     */
    if (
      semifinalLosers.length === 1
    ) {
      thirdPlaceId =
        semifinalLosers[0];
    }
  }

  /* =======================================================
     PARTICIPANTS
  ======================================================= */

  const champion =
    getParticipant(
      championId,
      registrations
    );

  const runnerUp =
    getParticipant(
      runnerUpId,
      registrations
    );

  const thirdPlace =
    getParticipant(
      thirdPlaceId,
      registrations
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section className="mt-6 bg-[#111111] border border-[#D4AF37]/20 rounded-xl overflow-hidden">

      {/* HEADER */}

      <div className="p-6 border-b border-[#222]">

        <h2 className="text-xl font-bold uppercase text-white">
          Tournament Results
        </h2>

        <p className="text-sm text-gray-400 mt-1">
          Final tournament positions
          determined from the completed
          Knockout stage.
        </p>

      </div>

      {/* RESULTS */}

      <div className="p-6">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* CHAMPION */}

          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/40 rounded-xl p-6">

            <div className="text-4xl">
              🏆
            </div>

            <p className="text-xs uppercase font-bold text-[#D4AF37] mt-4">
              Champion
            </p>

            <h3 className="text-2xl font-bold text-white mt-2">
              {champion?.name ||
                "Unknown"}
            </h3>

            {champion && (
              <p className="text-xs text-gray-500 mt-2">
                {champion.type} ID:{" "}
                {champion.id}
              </p>
            )}

          </div>

          {/* RUNNER-UP */}

          <div className="bg-gray-400/10 border border-gray-400/30 rounded-xl p-6">

            <div className="text-4xl">
              🥈
            </div>

            <p className="text-xs uppercase font-bold text-gray-300 mt-4">
              Runner-up
            </p>

            <h3 className="text-2xl font-bold text-white mt-2">
              {runnerUp?.name ||
                "Unknown"}
            </h3>

            {runnerUp && (
              <p className="text-xs text-gray-500 mt-2">
                {runnerUp.type} ID:{" "}
                {runnerUp.id}
              </p>
            )}

          </div>

          {/* THIRD PLACE */}

          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">

            <div className="text-4xl">
              🥉
            </div>

            <p className="text-xs uppercase font-bold text-orange-400 mt-4">
              3rd Place
            </p>

            <h3 className="text-2xl font-bold text-white mt-2">
              {thirdPlace?.name ||
                "Not determined"}
            </h3>

            {thirdPlace && (
              <p className="text-xs text-gray-500 mt-2">
                {thirdPlace.type} ID:{" "}
                {thirdPlace.id}
              </p>
            )}

            {!thirdPlace && (
              <p className="text-xs text-gray-500 mt-2">
                A dedicated 3rd-place match
                is required to determine
                this position.
              </p>
            )}

          </div>

        </div>

        {/* FINAL DETAILS */}

        <div className="mt-6 bg-black border border-[#222] rounded-xl p-5">

          <h3 className="font-bold text-white">
            Final Result
          </h3>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">

            <div>

              <p className="text-xs text-gray-500">
                Final Match
              </p>

              <p className="font-bold text-white mt-1">
                Match #{finalMatch.id}
              </p>

            </div>

            <div>

              <p className="text-xs text-gray-500">
                Final Score
              </p>

              <p className="font-bold text-[#D4AF37] mt-1">
                {finalMatch.score_team_a ??
                  "-"}{" "}
                -{" "}
                {finalMatch.score_team_b ??
                  "-"}
              </p>

            </div>

            <div>

              <p className="text-xs text-gray-500">
                Status
              </p>

              <p className="font-bold text-green-400 mt-1">
                Completed
              </p>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}