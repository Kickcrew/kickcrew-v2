import { supabase } from "@/lib/supabase";

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

  winner_id?: number | null;
  winner_team_id: number | null;
  winner_player_id: number | null;

  score_team_a: number | null;
  score_team_b: number | null;

  next_match_id?: number | null;
  next_match_slot?: string | null;
}

interface AdvanceResult {
  advanced: boolean;
  message: string;
  nextMatchId?: number;
  nextRound?: string;
}

/*
|--------------------------------------------------------------------------
| NORMALIZE
|--------------------------------------------------------------------------
*/

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/*
|--------------------------------------------------------------------------
| DETERMINE WHETHER THIS IS A TEAM MATCH
|--------------------------------------------------------------------------
*/

function isTeamMatch(match: Match): boolean {
  return (
    match.team_a_id !== null ||
    match.team_b_id !== null ||
    match.winner_team_id !== null
  );
}

/*
|--------------------------------------------------------------------------
| GET WINNER
|--------------------------------------------------------------------------
|
| Prefer the explicit winner_team_id / winner_player_id fields.
|
| winner_id is retained as a fallback because the knockout generator
| currently uses winner_id for automatic BYEs.
|
|--------------------------------------------------------------------------
*/

function getWinnerId(match: Match): number | null {
  const teamMatch = isTeamMatch(match);

  if (teamMatch) {
    return (
      match.winner_team_id ??
      match.winner_id ??
      null
    );
  }

  return (
    match.winner_player_id ??
    match.winner_id ??
    null
  );
}

/*
|--------------------------------------------------------------------------
| GET NEXT MATCH SLOT
|--------------------------------------------------------------------------
*/

function getNextSlot(
  match: Match
): "A" | "B" | null {
  const slot = String(
    match.next_match_slot ?? ""
  )
    .trim()
    .toUpperCase();

  if (slot === "A") {
    return "A";
  }

  if (slot === "B") {
    return "B";
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| LOAD MATCH
|--------------------------------------------------------------------------
*/

async function loadMatch(
  matchId: number
): Promise<Match | null> {
  const {
    data,
    error,
  } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load match ${matchId}: ${error.message}`
    );
  }

  return data as Match | null;
}

/*
|--------------------------------------------------------------------------
| CHECK WHETHER A MATCH HAS BOTH PARTICIPANTS
|--------------------------------------------------------------------------
*/

function hasBothParticipants(
  match: Match
): boolean {
  const teamMatch =
    match.team_a_id !== null ||
    match.team_b_id !== null ||
    match.winner_team_id !== null;

  if (teamMatch) {
    return (
      match.team_a_id !== null &&
      match.team_b_id !== null
    );
  }

  return (
    match.player_a_id !== null &&
    match.player_b_id !== null
  );
}

/*
|--------------------------------------------------------------------------
| PLACE WINNER INTO NEXT MATCH
|--------------------------------------------------------------------------
*/

async function placeWinnerIntoNextMatch(
  completedMatch: Match,
  nextMatch: Match,
  slot: "A" | "B"
): Promise<Match> {
  const teamMatch =
    isTeamMatch(completedMatch);

  const winnerId =
    getWinnerId(completedMatch);

  if (winnerId === null) {
    throw new Error(
      `Match ${completedMatch.id} has no valid winner.`
    );
  }

  const updates: Record<
    string,
    unknown
  > = {};

  if (teamMatch) {
    /*
     * Team tournament
     */

    updates.player_a_id = null;
    updates.player_b_id = null;

    if (slot === "A") {
      updates.team_a_id = winnerId;
    } else {
      updates.team_b_id = winnerId;
    }
  } else {
    /*
     * Individual tournament
     */

    updates.team_a_id = null;
    updates.team_b_id = null;

    if (slot === "A") {
      updates.player_a_id = winnerId;
    } else {
      updates.player_b_id = winnerId;
    }
  }

  /*
   * Reload the current next match so we know whether
   * the other participant is already present.
   */

  const currentNextMatch =
    await loadMatch(nextMatch.id);

  if (!currentNextMatch) {
    throw new Error(
      `Next knockout match ${nextMatch.id} could not be found.`
    );
  }

  /*
   * Determine whether both sides will now exist.
   */

  const participantA =
    slot === "A"
      ? winnerId
      : teamMatch
        ? currentNextMatch.team_a_id
        : currentNextMatch.player_a_id;

  const participantB =
    slot === "B"
      ? winnerId
      : teamMatch
        ? currentNextMatch.team_b_id
        : currentNextMatch.player_b_id;

  const bothReady =
    participantA !== null &&
    participantB !== null;

  /*
   * Activate the match once both participants
   * are known.
   */

  updates.status = bothReady
    ? "Scheduled"
    : "Pending";

  const {
    data: updatedMatch,
    error,
  } = await supabase
    .from("matches")
    .update(updates)
    .eq("id", nextMatch.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(
      `Failed to update next knockout match: ${error.message}`
    );
  }

  if (!updatedMatch) {
    throw new Error(
      `Next knockout match ${nextMatch.id} was not returned after update.`
    );
  }

  return updatedMatch as Match;
}

/*
|--------------------------------------------------------------------------
| FIND 3RD PLACE MATCH
|--------------------------------------------------------------------------
|
| The 3rd Place match is created by the knockout generation route.
|
| We deliberately do NOT create it here.
|
|--------------------------------------------------------------------------
*/

async function findThirdPlaceMatch(
  tournamentId: number
): Promise<Match | null> {
  const {
    data,
    error,
  } = await supabase
    .from("matches")
    .select("*")
    .eq(
      "tournament_id",
      tournamentId
    )
    .ilike(
      "round",
      "3rd Place"
    )
    .order(
      "match_number",
      {
        ascending: true,
      }
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load 3rd Place match: ${error.message}`
    );
  }

  return data as Match | null;
}

/*
|--------------------------------------------------------------------------
| GET LOSER
|--------------------------------------------------------------------------
|
| Returns the participant who lost the completed match.
|
|--------------------------------------------------------------------------
*/

function getLoserId(
  completedMatch: Match
): number | null {
  const winnerId =
    getWinnerId(completedMatch);

  if (winnerId === null) {
    return null;
  }

  const teamMatch =
    isTeamMatch(completedMatch);

  if (teamMatch) {
    if (
      completedMatch.team_a_id !== null &&
      completedMatch.team_a_id === winnerId
    ) {
      return completedMatch.team_b_id;
    }

    if (
      completedMatch.team_b_id !== null &&
      completedMatch.team_b_id === winnerId
    ) {
      return completedMatch.team_a_id;
    }

    return null;
  }

  if (
    completedMatch.player_a_id !== null &&
    completedMatch.player_a_id === winnerId
  ) {
    return completedMatch.player_b_id;
  }

  if (
    completedMatch.player_b_id !== null &&
    completedMatch.player_b_id === winnerId
  ) {
    return completedMatch.player_a_id;
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| PLACE SEMIFINAL LOSER INTO 3RD PLACE
|--------------------------------------------------------------------------
*/

async function placeLoserIntoThirdPlace(
  completedSemifinal: Match
): Promise<AdvanceResult> {
  const loserId =
    getLoserId(completedSemifinal);

  if (loserId === null) {
    return {
      advanced: false,
      message:
        `Semifinal Match ${completedSemifinal.id} has no identifiable loser.`,
    };
  }

  /*
   * Find the 3rd Place match created during bracket generation.
   */

  const thirdPlaceMatch =
    await findThirdPlaceMatch(
      completedSemifinal.tournament_id
    );

  /*
   * Some tournaments may not use a 3rd Place match.
   *
   * Do not fail the normal knockout advancement
   * if one does not exist.
   */

  if (!thirdPlaceMatch) {
    return {
      advanced: true,
      message:
        "Semifinal loser determined. No 3rd Place Playoff exists for this tournament.",
    };
  }

  const teamMatch =
    isTeamMatch(completedSemifinal);

  /*
   * Determine which slot is already occupied.
   */

  const slotAOccupied =
    teamMatch
      ? thirdPlaceMatch.team_a_id !== null
      : thirdPlaceMatch.player_a_id !== null;

  const slotBOccupied =
    teamMatch
      ? thirdPlaceMatch.team_b_id !== null
      : thirdPlaceMatch.player_b_id !== null;

  /*
   * Check whether this loser is already present.
   *
   * This makes the operation safe if the completion
   * handler is accidentally called more than once.
   */

  const alreadyPresent =
    teamMatch
      ? thirdPlaceMatch.team_a_id === loserId ||
        thirdPlaceMatch.team_b_id === loserId
      : thirdPlaceMatch.player_a_id === loserId ||
        thirdPlaceMatch.player_b_id === loserId;

  if (alreadyPresent) {
    return {
      advanced: true,

      message:
        `Semifinal loser is already assigned to the 3rd Place Playoff.`,

      nextMatchId:
        thirdPlaceMatch.id,

      nextRound:
        thirdPlaceMatch.round ??
        "3rd Place",
    };
  }

  /*
   * Choose the first available slot.
   */

  let slot: "A" | "B" | null = null;

  if (!slotAOccupied) {
    slot = "A";
  } else if (!slotBOccupied) {
    slot = "B";
  }

  if (!slot) {
    throw new Error(
      `3rd Place Playoff ${thirdPlaceMatch.id} already has two participants.`
    );
  }

  const updates: Record<
    string,
    unknown
  > = {};

  if (teamMatch) {
    updates.player_a_id = null;
    updates.player_b_id = null;

    if (slot === "A") {
      updates.team_a_id = loserId;
    } else {
      updates.team_b_id = loserId;
    }
  } else {
    updates.team_a_id = null;
    updates.team_b_id = null;

    if (slot === "A") {
      updates.player_a_id = loserId;
    } else {
      updates.player_b_id = loserId;
    }
  }

  /*
   * Determine whether both semifinal losers are now present.
   */

  const participantA =
    slot === "A"
      ? loserId
      : teamMatch
        ? thirdPlaceMatch.team_a_id
        : thirdPlaceMatch.player_a_id;

  const participantB =
    slot === "B"
      ? loserId
      : teamMatch
        ? thirdPlaceMatch.team_b_id
        : thirdPlaceMatch.player_b_id;

  const bothReady =
    participantA !== null &&
    participantB !== null;

  /*
   * The 3rd Place match becomes Scheduled
   * only after both semifinal losers are known.
   */

  updates.status = bothReady
    ? "Scheduled"
    : "Pending";

  const {
    data: updatedThirdPlace,
    error,
  } = await supabase
    .from("matches")
    .update(updates)
    .eq(
      "id",
      thirdPlaceMatch.id
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(
      `Failed to assign semifinal loser to 3rd Place Playoff: ${error.message}`
    );
  }

  if (!updatedThirdPlace) {
    throw new Error(
      `3rd Place Playoff ${thirdPlaceMatch.id} was not returned after update.`
    );
  }

  return {
    advanced: true,

    message: bothReady
      ? "Semifinal loser assigned to the 3rd Place Playoff. The match is ready."
      : "Semifinal loser assigned to the 3rd Place Playoff. Waiting for the other semifinal loser.",

    nextMatchId:
      updatedThirdPlace.id,

    nextRound:
      updatedThirdPlace.round ??
      "3rd Place",
  };
}

/*
|--------------------------------------------------------------------------
| PROCESS AUTOMATIC BYE
|--------------------------------------------------------------------------
|
| A BYE match can already be completed when the bracket is generated.
|
| Example:
|
| Round of 8
|
| Match 1:
| Team A vs BYE
|
| Team A automatically advances.
|
|--------------------------------------------------------------------------
*/

async function processByeWinner(
  byeMatch: Match
): Promise<AdvanceResult> {
  const winnerId =
    getWinnerId(byeMatch);

  if (winnerId === null) {
    return {
      advanced: false,
      message:
        "BYE match has no winner.",
    };
  }

  /*
   * Final cannot have a next match.
   */

  if (
    byeMatch.next_match_id === null ||
    byeMatch.next_match_id === undefined
  ) {
    return {
      advanced: true,
      message:
        "BYE winner has no next match. Tournament stage is complete.",
    };
  }

  const nextMatch =
    await loadMatch(
      Number(
        byeMatch.next_match_id
      )
    );

  if (!nextMatch) {
    throw new Error(
      `Next match ${byeMatch.next_match_id} could not be found for BYE advancement.`
    );
  }

  const slot =
    getNextSlot(byeMatch);

  if (!slot) {
    throw new Error(
      `Match ${byeMatch.id} has an invalid next_match_slot.`
    );
  }

  const updatedNextMatch =
    await placeWinnerIntoNextMatch(
      byeMatch,
      nextMatch,
      slot
    );

  /*
   * If the next match is still waiting for another
   * participant, we are finished for now.
   */

  if (
    !hasBothParticipants(
      updatedNextMatch
    )
  ) {
    return {
      advanced: true,

      message:
        `BYE winner advanced to ${
          updatedNextMatch.round ??
          "the next round"
        } and is waiting for the other participant.`,

      nextMatchId:
        updatedNextMatch.id,

      nextRound:
        updatedNextMatch.round ??
        undefined,
    };
  }

  return {
    advanced: true,

    message:
      `BYE winner advanced to ${
        updatedNextMatch.round ??
        "the next round"
      } and the match is ready.`,

    nextMatchId:
      updatedNextMatch.id,

    nextRound:
      updatedNextMatch.round ??
      undefined,
  };
}

/*
|--------------------------------------------------------------------------
| ADVANCE KNOCKOUT WINNER
|--------------------------------------------------------------------------
*/

export async function advanceKnockoutMatch(
  completedMatch: Match
): Promise<AdvanceResult> {
  /*
   * -------------------------------------------------
   * 1. ONLY COMPLETED MATCHES
   * -------------------------------------------------
   */

  if (
    normalize(
      completedMatch.status
    ) !== "completed"
  ) {
    return {
      advanced: false,

      message:
        "Match is not completed. No advancement required.",
    };
  }

  /*
   * -------------------------------------------------
   * 2. DETERMINE WINNER
   * -------------------------------------------------
   */

  const winnerId =
    getWinnerId(completedMatch);

  if (winnerId === null) {
    return {
      advanced: false,

      message:
        "Completed knockout match does not have a valid winner.",
    };
  }

  /*
   * -------------------------------------------------
   * 3. SEMIFINAL LOSER → 3RD PLACE
   * -------------------------------------------------
   *
   * This happens independently of the winner path.
   *
   * The semifinal winner continues toward the Final.
   * The semifinal loser goes to the 3rd Place Playoff.
   * -------------------------------------------------
   */

  const round =
    normalize(
      completedMatch.round
    );

  const isSemifinal =
    round.includes("semifinal") ||
    round.includes("semi-final");

  let thirdPlaceResult:
    AdvanceResult | null = null;

  if (isSemifinal) {
    thirdPlaceResult =
      await placeLoserIntoThirdPlace(
        completedMatch
      );

    console.log(
      "SEMIFINAL LOSER → 3RD PLACE:",
      {
        semifinalMatchId:
          completedMatch.id,

        result:
          thirdPlaceResult,
      }
    );
  }

  /*
   * -------------------------------------------------
   * 4. FINAL
   * -------------------------------------------------
   *
   * A Final has no next_match_id.
   *
   * The winner is therefore the champion.
   * -------------------------------------------------
   */

  if (
    completedMatch.next_match_id === null ||
    completedMatch.next_match_id === undefined
  ) {
    return {
      advanced: true,

      message:
        "Final completed. Tournament champion determined.",
    };
  }

  /*
   * -------------------------------------------------
   * 5. GET NEXT MATCH
   * -------------------------------------------------
   */

  const nextMatch =
    await loadMatch(
      Number(
        completedMatch.next_match_id
      )
    );

  if (!nextMatch) {
    throw new Error(
      `Next knockout match ${completedMatch.next_match_id} could not be found.`
    );
  }

  /*
   * -------------------------------------------------
   * 6. DETERMINE NEXT SLOT
   * -------------------------------------------------
   */

  const winnerSlot =
    getNextSlot(
      completedMatch
    );

  if (!winnerSlot) {
    throw new Error(
      `Match ${completedMatch.id} has no valid next_match_slot.`
    );
  }

  /*
   * -------------------------------------------------
   * 7. PLACE WINNER
   * -------------------------------------------------
   */

  const updatedNextMatch =
    await placeWinnerIntoNextMatch(
      completedMatch,
      nextMatch,
      winnerSlot
    );

  /*
   * -------------------------------------------------
   * 8. CHECK WHETHER NEXT MATCH IS READY
   * -------------------------------------------------
   */

  const ready =
    hasBothParticipants(
      updatedNextMatch
    );

  if (!ready) {
    return {
      advanced: true,

      message:
        isSemifinal &&
        thirdPlaceResult
          ? `Winner advanced to ${
              updatedNextMatch.round ??
              "the next round"
            }. ${
              thirdPlaceResult.message
            }`
          : `Winner advanced to ${
              updatedNextMatch.round ??
              "the next round"
            }. Waiting for the other participant.`,

      nextMatchId:
        updatedNextMatch.id,

      nextRound:
        updatedNextMatch.round ??
        undefined,
    };
  }

  /*
   * -------------------------------------------------
   * 9. NEXT MATCH READY
   * -------------------------------------------------
   */

  return {
    advanced: true,

    message:
      isSemifinal &&
      thirdPlaceResult
        ? `${
            updatedNextMatch.round ??
            "Next-round"
          } match is ready to be played. ${
            thirdPlaceResult.message
          }`
        : `${
            updatedNextMatch.round ??
            "Next-round"
          } match is ready to be played.`,

    nextMatchId:
      updatedNextMatch.id,

    nextRound:
      updatedNextMatch.round ??
      undefined,
  };
}

/*
|--------------------------------------------------------------------------
| ADVANCE A GENERATED BYE
|--------------------------------------------------------------------------
|
| This is intentionally exported separately so the bracket-generation
| route can immediately process BYEs after inserting the first round.
|
|--------------------------------------------------------------------------
*/

export async function advanceByeMatch(
  byeMatch: Match
): Promise<AdvanceResult> {
  if (
    normalize(
      byeMatch.status
    ) !== "completed"
  ) {
    return {
      advanced: false,

      message:
        "BYE match is not completed.",
    };
  }

  const hasBye =
    (
      byeMatch.team_a_id !== null &&
      byeMatch.team_b_id === null
    ) ||
    (
      byeMatch.team_a_id === null &&
      byeMatch.team_b_id !== null
    ) ||
    (
      byeMatch.player_a_id !== null &&
      byeMatch.player_b_id === null
    ) ||
    (
      byeMatch.player_a_id === null &&
      byeMatch.player_b_id !== null
    );

  if (!hasBye) {
    return {
      advanced: false,

      message:
        "This is not a BYE match.",
    };
  }

  return processByeWinner(
    byeMatch
  );
}