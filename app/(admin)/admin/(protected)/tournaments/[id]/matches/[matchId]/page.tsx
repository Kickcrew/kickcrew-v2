"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

interface Participant {
  id: number;
  name: string;
  type: "player" | "team";
}

interface Match {
  id: number;
  tournament_id: number;
  game_id: number | null;

  team_a_id: number | null;
  team_b_id: number | null;

  player_a_id: number | null;
  player_b_id: number | null;

  player_a?: {
    id: number;
    full_name: string | null;
    gamer_tag: string | null;
  } | null;

  player_b?: {
    id: number;
    full_name: string | null;
    gamer_tag: string | null;
  } | null;

  team_a?: {
    id: number;
    team_name: string;
  } | null;

  team_b?: {
    id: number;
    team_name: string;
  } | null;

  round: string | null;
  match_number: number | null;

  best_of: string | null;

  scheduled_date: string | null;
  scheduled_time: string | null;

  winner_id: number | null;

  score_team_a: number | null;
  score_team_b: number | null;

  penalty_score_a?: number | null;
  penalty_score_b?: number | null;

  status: string | null;

  stream_link: string | null;
  notes: string | null;
}

interface Tournament {
  id: number;
  tournament_name: string;
  tournament_type: string | null;
  status: string | null;
}

interface FormState {
  scoreA: string;
  scoreB: string;

  penaltyA: string;
  penaltyB: string;

  status: string;

  scheduledDate: string;
  scheduledTime: string;

  streamLink: string;
  notes: string;
}

interface ApiResult {
  success?: boolean;
  message?: string;
  locked?: boolean;

  match?: Match;
  tournament?: Tournament;

  participants?: Participant[];
  registrations?: any[];
}

/*
 * ==========================================================
 * API RESPONSE HELPER
 * ==========================================================
 *
 * Prevents:
 *
 * Failed to execute 'json' on 'Response':
 * Unexpected end of JSON input
 *
 * when the server returns an empty response.
 */

async function parseApiResponse(
  response: Response
): Promise<{
  data: ApiResult | null;
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
      data: JSON.parse(rawText) as ApiResult,
      rawText,
    };
  } catch {
    return {
      data: null,
      rawText,
    };
  }
}

/*
 * ==========================================================
 * MATCH STAGE DETECTION
 * ==========================================================
 *
 * Supports:
 *
 * Round 1
 * Round 2
 *
 * Leg 1 - Round 1
 *
 * Group A - Round 1
 * Group A - Round 2
 * Group B - Round 1
 *
 * And knockout stages:
 *
 * Round of 16
 * Quarterfinal
 * Semifinal
 * Final
 */

function getStageType(
  round: string | null
): "Round Robin" | "Knockout" | "Unknown" {
  const value = (round ?? "")
    .trim()
    .toLowerCase();

  /*
   * --------------------------------------------------------
   * ROUND ROBIN / GROUP STAGE
   * --------------------------------------------------------
   */

  const isSimpleRoundRobin =
    /^round\s+\d+$/i.test(value);

  const isLegRoundRobin =
    /^leg\s+\d+\s*-\s*round\s+\d+$/i.test(
      value
    );

  const isGroupRoundRobin =
    /^group\s+[a-z0-9]+\s*-\s*round\s+\d+$/i.test(
      value
    );

  if (
    isSimpleRoundRobin ||
    isLegRoundRobin ||
    isGroupRoundRobin
  ) {
    return "Round Robin";
  }

  /*
   * --------------------------------------------------------
   * KNOCKOUT
   * --------------------------------------------------------
   */

  const isKnockout =
    value.includes("round of") ||
    value.includes("quarterfinal") ||
    value.includes("quarter-final") ||
    value.includes("semifinal") ||
    value.includes("semi-final") ||
    value === "final" ||
    value.startsWith("final -") ||
    value.includes("knockout");

  if (isKnockout) {
    return "Knockout";
  }

  return "Unknown";
}

/*
 * ==========================================================
 * DATE / TIME HELPERS
 * ==========================================================
 */

function getDateValue(
  value: string | null
): string {
  if (!value) return "";

  return value.slice(0, 10);
}

function getTimeValue(
  value: string | null
): string {
  if (!value) return "";

  return value.slice(0, 5);
}

/*
 * ==========================================================
 * NORMALIZE
 * ==========================================================
 */

function normalize(
  value: unknown
): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

/*
 * ==========================================================
 * PAGE
 * ==========================================================
 */

export default function MatchEditPage() {
  const params = useParams();

  const tournamentId = Array.isArray(
    params.id
  )
    ? params.id[0]
    : params.id;

  const matchId = Array.isArray(
    params.matchId
  )
    ? params.matchId[0]
    : params.matchId;

  /*
   * --------------------------------------------------------
   * STATE
   * --------------------------------------------------------
   */

  const [match, setMatch] =
    useState<Match | null>(null);

  const [tournament, setTournament] =
    useState<Tournament | null>(null);

  const [participants, setParticipants] =
    useState<Participant[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [tournamentLocked, setTournamentLocked] =
    useState(false);

  const [form, setForm] =
    useState<FormState>({
      scoreA: "",
      scoreB: "",

      penaltyA: "",
      penaltyB: "",

      status: "Scheduled",

      scheduledDate: "",
      scheduledTime: "",

      streamLink: "",
      notes: "",
    });

  /*
   * ==========================================================
   * LOAD MATCH
   * ==========================================================
   */

  async function loadMatch() {
    if (!matchId) {
      setError("Match ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/matches/${matchId}`,
        {
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const {
        data: result,
        rawText,
      } = await parseApiResponse(
        response
      );

      console.log(
        "Load match HTTP status:",
        response.status
      );

      console.log(
        "Load match response:",
        result
      );

      /*
       * EMPTY RESPONSE
       */

      if (!rawText.trim()) {
        throw new Error(
          `The match API returned an empty response. HTTP ${response.status}.`
        );
      }

      /*
       * INVALID JSON
       */

      if (!result) {
        throw new Error(
          `The match API returned invalid JSON. HTTP ${response.status}. Response: ${rawText.slice(
            0,
            500
          )}`
        );
      }

      /*
       * API ERROR
       */

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            `Failed to load match. HTTP ${response.status}.`
        );
      }

      /*
       * MATCH
       */

      if (!result.match) {
        throw new Error(
          "The API response did not contain match information."
        );
      }

      const loadedMatch =
        result.match;

      setMatch(loadedMatch);

      /*
       * ------------------------------------------------------
       * TOURNAMENT
       * ------------------------------------------------------
       */

      if (tournamentId) {
        try {
          const tournamentResponse =
            await fetch(
              `/api/tournaments/${tournamentId}`,
              {
                cache: "no-store",
                headers: {
                  Accept:
                    "application/json",
                },
              }
            );

          const {
            data: tournamentResult,
            rawText:
              tournamentRawText,
          } =
            await parseApiResponse(
              tournamentResponse
            );

          if (
            tournamentResponse.ok &&
            tournamentResult?.success &&
            tournamentResult.tournament
          ) {
            const loadedTournament =
              tournamentResult.tournament;

            setTournament(
              loadedTournament
            );

            const isCompleted =
              normalize(
                loadedTournament.status
              ) === "completed";

            setTournamentLocked(
              isCompleted
            );
          } else if (
            !tournamentRawText.trim()
          ) {
            console.warn(
              "Tournament API returned an empty response."
            );
          }
        } catch (tournamentError) {
          console.error(
            "Tournament loading error:",
            tournamentError
          );
        }
      }

      /*
       * ------------------------------------------------------
       * PARTICIPANTS FROM MATCH API
       * ------------------------------------------------------
       */

      if (
        Array.isArray(
          result.participants
        )
      ) {
        setParticipants(
          result.participants
        );
      }

      /*
       * ------------------------------------------------------
       * FORM
       * ------------------------------------------------------
       */

      setForm({
        scoreA:
          loadedMatch.score_team_a !==
            null &&
          loadedMatch.score_team_a !==
            undefined
            ? String(
                loadedMatch.score_team_a
              )
            : "",

        scoreB:
          loadedMatch.score_team_b !==
            null &&
          loadedMatch.score_team_b !==
            undefined
            ? String(
                loadedMatch.score_team_b
              )
            : "",

        penaltyA:
          loadedMatch.penalty_score_a !==
            null &&
          loadedMatch.penalty_score_a !==
            undefined
            ? String(
                loadedMatch.penalty_score_a
              )
            : "",

        penaltyB:
          loadedMatch.penalty_score_b !==
            null &&
          loadedMatch.penalty_score_b !==
            undefined
            ? String(
                loadedMatch.penalty_score_b
              )
            : "",

        status:
          loadedMatch.status ||
          "Scheduled",

        scheduledDate:
          getDateValue(
            loadedMatch.scheduled_date
          ),

        scheduledTime:
          getTimeValue(
            loadedMatch.scheduled_time
          ),

        streamLink:
          loadedMatch.stream_link ||
          "",

        notes:
          loadedMatch.notes ||
          "",
      });
    } catch (err) {
      console.error(
        "Match loading error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load match."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ==========================================================
   * LOAD PARTICIPANTS
   * ==========================================================
   */

  async function loadParticipants() {
    if (!tournamentId) return;

    try {
      const response = await fetch(
        `/api/tournament-registrations?tournament_id=${encodeURIComponent(
          tournamentId
        )}`,
        {
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const {
        data: result,
        rawText,
      } =
        await parseApiResponse(
          response
        );

      if (!rawText.trim()) {
        console.warn(
          "Registration API returned an empty response."
        );

        return;
      }

      if (!result) {
        console.warn(
          "Registration API returned invalid JSON."
        );

        return;
      }

      if (
        !response.ok ||
        !result.success
      ) {
        console.warn(
          "Failed to load registrations:",
          result.message
        );

        return;
      }

      const registrations =
        result.registrations ?? [];

      const mapped: Participant[] =
        registrations
          .map(
            (
              registration: any
            ): Participant | null => {
              /*
               * PLAYER
               */

              if (
                registration.player_id !==
                null &&
                registration.player_id !==
                  undefined
              ) {
                return {
                  id:
                    registration.player_id,

                  name:
                    registration.players
                      ?.gamer_tag ||
                    registration.players
                      ?.full_name ||
                    `Player #${registration.player_id}`,

                  type: "player",
                };
              }

              /*
               * TEAM
               */

              if (
                registration.team_id !==
                null &&
                registration.team_id !==
                  undefined
              ) {
                return {
                  id:
                    registration.team_id,

                  name:
                    registration.teams
                      ?.team_name ||
                    `Team #${registration.team_id}`,

                  type: "team",
                };
              }

              return null;
            }
          )
          .filter(
            (
              item
            ): item is Participant =>
              item !== null
          );

      setParticipants(mapped);
    } catch (err) {
      console.error(
        "Participant loading error:",
        err
      );
    }
  }

  /*
   * ==========================================================
   * INITIAL LOAD
   * ==========================================================
   */

  useEffect(() => {
    if (!matchId) {
      setLoading(false);
      return;
    }

    loadMatch();
    loadParticipants();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    matchId,
    tournamentId,
  ]);

  /*
   * ==========================================================
   * PARTICIPANT NAMES
   * ==========================================================
   */

  const participantAName =
    useMemo(() => {
      if (!match) {
        return "Participant A";
      }

      /*
       * Prefer nested player information.
       */

      if (
        match.player_a_id !== null
      ) {
        return (
          match.player_a?.gamer_tag ||
          match.player_a?.full_name ||
          `Player #${match.player_a_id}`
        );
      }

      /*
       * Prefer nested team information.
       */

      if (
        match.team_a_id !== null
      ) {
        return (
          match.team_a?.team_name ||
          `Team #${match.team_a_id}`
        );
      }

      /*
       * Fallback to participant list.
       */

      if (
        match.player_a_id !== null
      ) {
        const participant =
          participants.find(
            (item) =>
              item.id ===
                match.player_a_id &&
              item.type === "player"
          );

        if (participant) {
          return participant.name;
        }
      }

      if (
        match.team_a_id !== null
      ) {
        const participant =
          participants.find(
            (item) =>
              item.id ===
                match.team_a_id &&
              item.type === "team"
          );

        if (participant) {
          return participant.name;
        }
      }

      return "Participant A";
    }, [
      match,
      participants,
    ]);

  const participantBName =
    useMemo(() => {
      if (!match) {
        return "Participant B";
      }

      /*
       * Prefer nested player information.
       */

      if (
        match.player_b_id !== null
      ) {
        return (
          match.player_b?.gamer_tag ||
          match.player_b?.full_name ||
          `Player #${match.player_b_id}`
        );
      }

      /*
       * Prefer nested team information.
       */

      if (
        match.team_b_id !== null
      ) {
        return (
          match.team_b?.team_name ||
          `Team #${match.team_b_id}`
        );
      }

      /*
       * Fallback to participant list.
       */

      if (
        match.player_b_id !== null
      ) {
        const participant =
          participants.find(
            (item) =>
              item.id ===
                match.player_b_id &&
              item.type === "player"
          );

        if (participant) {
          return participant.name;
        }
      }

      if (
        match.team_b_id !== null
      ) {
        const participant =
          participants.find(
            (item) =>
              item.id ===
                match.team_b_id &&
              item.type === "team"
          );

        if (participant) {
          return participant.name;
        }
      }

      return "Participant B";
    }, [
      match,
      participants,
    ]);

  /*
   * ==========================================================
   * MATCH TYPE
   * ==========================================================
   */

  const matchType =
    getStageType(
      match?.round ?? null
    );

  const isRoundRobin =
    matchType === "Round Robin";

  const isKnockout =
    matchType === "Knockout";

  /*
   * ==========================================================
   * SCORE PARSING
   * ==========================================================
   */

  const scoreA =
    form.scoreA === ""
      ? null
      : Number(form.scoreA);

  const scoreB =
    form.scoreB === ""
      ? null
      : Number(form.scoreB);

  const penaltyA =
    form.penaltyA === ""
      ? null
      : Number(form.penaltyA);

  const penaltyB =
    form.penaltyB === ""
      ? null
      : Number(form.penaltyB);

  /*
   * ==========================================================
   * SCORE VALIDATION
   * ==========================================================
   */

  const validScores =
    scoreA !== null &&
    scoreB !== null &&
    Number.isFinite(scoreA) &&
    Number.isFinite(scoreB) &&
    scoreA >= 0 &&
    scoreB >= 0;

  const validPenalties =
    penaltyA !== null &&
    penaltyB !== null &&
    Number.isFinite(penaltyA) &&
    Number.isFinite(penaltyB) &&
    penaltyA >= 0 &&
    penaltyB >= 0;

  /*
   * ==========================================================
   * RESULT CALCULATION
   * ==========================================================
   */

  const resultInfo =
    useMemo(() => {
      /*
       * No score yet.
       */

      if (!validScores) {
        return {
          result: "Not determined",

          winner: "No winner yet",

          winnerId:
            null as number | null,

          needsWinner: false,

          penaltyRequired: false,
        };
      }

      /*
       * ------------------------------------------------------
       * ROUND ROBIN
       * ------------------------------------------------------
       *
       * Draws are completely valid.
       */

      if (isRoundRobin) {
        /*
         * DRAW
         */

        if (
          scoreA === scoreB
        ) {
          return {
            result: "Draw",

            winner: "Draw",

            winnerId:
              null as number | null,

            needsWinner: false,

            penaltyRequired: false,
          };
        }

        /*
         * PARTICIPANT A
         */

        if (
          scoreA! > scoreB!
        ) {
          return {
            result:
              "Participant A wins",

            winner:
              participantAName,

            winnerId:
              match?.player_a_id ??
              match?.team_a_id ??
              null,

            needsWinner: false,

            penaltyRequired: false,
          };
        }

        /*
         * PARTICIPANT B
         */

        return {
          result:
            "Participant B wins",

          winner:
            participantBName,

          winnerId:
            match?.player_b_id ??
            match?.team_b_id ??
            null,

          needsWinner: false,

          penaltyRequired: false,
        };
      }

      /*
       * ------------------------------------------------------
       * KNOCKOUT
       * ------------------------------------------------------
       */

      if (isKnockout) {
        /*
         * A wins regulation.
         */

        if (
          scoreA! > scoreB!
        ) {
          return {
            result:
              "Participant A wins",

            winner:
              participantAName,

            winnerId:
              match?.player_a_id ??
              match?.team_a_id ??
              null,

            needsWinner: false,

            penaltyRequired: false,
          };
        }

        /*
         * B wins regulation.
         */

        if (
          scoreB! > scoreA!
        ) {
          return {
            result:
              "Participant B wins",

            winner:
              participantBName,

            winnerId:
              match?.player_b_id ??
              match?.team_b_id ??
              null,

            needsWinner: false,

            penaltyRequired: false,
          };
        }

        /*
         * Regulation draw.
         *
         * Check penalties.
         */

        if (
          validPenalties &&
          penaltyA !== penaltyB
        ) {
          /*
           * A wins penalties.
           */

          if (
            penaltyA! >
            penaltyB!
          ) {
            return {
              result:
                "Won on penalties",

              winner:
                participantAName,

              winnerId:
                match?.player_a_id ??
                match?.team_a_id ??
                null,

              needsWinner: false,

              penaltyRequired: false,
            };
          }

          /*
           * B wins penalties.
           */

          return {
            result:
              "Won on penalties",

            winner:
              participantBName,

            winnerId:
              match?.player_b_id ??
              match?.team_b_id ??
              null,

            needsWinner: false,

            penaltyRequired: false,
          };
        }

        /*
         * Still waiting for penalties.
         */

        return {
          result:
            "Penalty Shootout",

          winner:
            "No winner yet",

          winnerId:
            null as number | null,

          needsWinner: true,

          penaltyRequired: true,
        };
      }

      /*
       * ------------------------------------------------------
       * UNKNOWN STAGE
       * ------------------------------------------------------
       *
       * Safest fallback is Round Robin-like behavior.
       *
       * We do not force a penalty shootout unless the
       * stage is explicitly identified as Knockout.
       */

      if (
        scoreA === scoreB
      ) {
        return {
          result: "Draw",

          winner: "Draw",

          winnerId:
            null as number | null,

          needsWinner: false,

          penaltyRequired: false,
        };
      }

      if (
        scoreA! > scoreB!
      ) {
        return {
          result:
            "Participant A wins",

          winner:
            participantAName,

          winnerId:
            match?.player_a_id ??
            match?.team_a_id ??
            null,

          needsWinner: false,

          penaltyRequired: false,
        };
      }

      return {
        result:
          "Participant B wins",

        winner:
          participantBName,

        winnerId:
          match?.player_b_id ??
          match?.team_b_id ??
          null,

        needsWinner: false,

        penaltyRequired: false,
      };
    }, [
      validScores,
      validPenalties,
      scoreA,
      scoreB,
      penaltyA,
      penaltyB,
      isRoundRobin,
      isKnockout,
      participantAName,
      participantBName,
      match,
    ]);

  /*
   * ==========================================================
   * FORM STATUS
   * ==========================================================
   */

  const canComplete =
    validScores &&
    !resultInfo.needsWinner;

  /*
   * ==========================================================
   * FORM HANDLER
   * ==========================================================
   */

  function updateForm(
    field: keyof FormState,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSuccess("");
  }

  /*
   * ==========================================================
   * SAVE MATCH
   * ==========================================================
   */

  async function saveMatch(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    /*
     * --------------------------------------------------------
     * BASIC CHECK
     * --------------------------------------------------------
     */

    if (!match) {
      setError(
        "Match information is not loaded."
      );

      return;
    }

    /*
     * --------------------------------------------------------
     * CLIENT LOCK CHECK
     * --------------------------------------------------------
     */

    if (tournamentLocked) {
      setError(
        "This tournament has been completed. Match results are locked."
      );

      return;
    }

    /*
     * --------------------------------------------------------
     * SCORE VALIDATION
     * --------------------------------------------------------
     */

    if (
      form.scoreA !== "" &&
      (
        Number.isNaN(scoreA) ||
        scoreA! < 0
      )
    ) {
      setError(
        "Participant A score must be a valid non-negative number."
      );

      return;
    }

    if (
      form.scoreB !== "" &&
      (
        Number.isNaN(scoreB) ||
        scoreB! < 0
      )
    ) {
      setError(
        "Participant B score must be a valid non-negative number."
      );

      return;
    }

    /*
     * --------------------------------------------------------
     * PENALTY VALIDATION
     * --------------------------------------------------------
     */

    if (
      form.penaltyA !== "" &&
      (
        Number.isNaN(penaltyA) ||
        penaltyA! < 0
      )
    ) {
      setError(
        "Participant A penalty score must be valid."
      );

      return;
    }

    if (
      form.penaltyB !== "" &&
      (
        Number.isNaN(penaltyB) ||
        penaltyB! < 0
      )
    ) {
      setError(
        "Participant B penalty score must be valid."
      );

      return;
    }

    /*
     * --------------------------------------------------------
     * KNOCKOUT TIE
     * --------------------------------------------------------
     */

    if (
      isKnockout &&
      validScores &&
      scoreA === scoreB &&
      !validPenalties
    ) {
      setError(
        "This knockout match is tied. Enter both penalty shootout scores to determine the winner."
      );

      return;
    }

    /*
     * --------------------------------------------------------
     * EQUAL PENALTIES
     * --------------------------------------------------------
     */

    if (
      isKnockout &&
      validScores &&
      scoreA === scoreB &&
      validPenalties &&
      penaltyA === penaltyB
    ) {
      setError(
        "The penalty shootout is still tied. Enter different penalty scores to determine the winner."
      );

      return;
    }

    /*
     * --------------------------------------------------------
     * COMPLETED KNOCKOUT MUST HAVE WINNER
     * --------------------------------------------------------
     */

    if (
      isKnockout &&
      normalize(form.status) ===
        "completed" &&
      resultInfo.needsWinner
    ) {
      setError(
        "A knockout match cannot be completed until a winner has been determined."
      );

      return;
    }

    /*
     * --------------------------------------------------------
     * COMPLETED MATCH WITHOUT SCORES
     * --------------------------------------------------------
     */

    if (
      normalize(form.status) ===
        "completed" &&
      !validScores
    ) {
      setError(
        "A completed match must have valid scores for both participants."
      );

      return;
    }

    /*
     * --------------------------------------------------------
     * SAVE
     * --------------------------------------------------------
     */

    try {
      setSaving(true);

      const payload = {
        score_team_a:
          form.scoreA === ""
            ? null
            : Number(form.scoreA),

        score_team_b:
          form.scoreB === ""
            ? null
            : Number(form.scoreB),

        penalty_score_a:
          form.penaltyA === ""
            ? null
            : Number(form.penaltyA),

        penalty_score_b:
          form.penaltyB === ""
            ? null
            : Number(form.penaltyB),

        status:
          form.status,

        scheduled_date:
          form.scheduledDate ||
          null,

        scheduled_time:
          form.scheduledTime ||
          null,

        stream_link:
          form.streamLink.trim() ||
          null,

        notes:
          form.notes.trim() ||
          null,

        /*
         * Automatically calculated result.
         */

        result:
          resultInfo.result,

        winner_id:
          resultInfo.winnerId,
      };

      console.log(
        "Updating match:",
        matchId
      );

      console.log(
        "Match update payload:",
        payload
      );

      const response =
        await fetch(
          `/api/matches/${matchId}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body: JSON.stringify(
              payload
            ),
          }
        );

      const {
        data: result,
        rawText,
      } =
        await parseApiResponse(
          response
        );

      console.log(
        "Update match HTTP status:",
        response.status
      );

      console.log(
        "Update match response:",
        result
      );

      /*
       * ------------------------------------------------------
       * EMPTY RESPONSE
       * ------------------------------------------------------
       */

      if (!rawText.trim()) {
        throw new Error(
          `The matches API returned an empty response while saving. HTTP ${response.status}.`
        );
      }

      /*
       * ------------------------------------------------------
       * INVALID JSON
       * ------------------------------------------------------
       */

      if (!result) {
        throw new Error(
          `The matches API returned invalid JSON while saving. HTTP ${response.status}. Response: ${rawText.slice(
            0,
            500
          )}`
        );
      }

      /*
       * ------------------------------------------------------
       * API ERROR
       * ------------------------------------------------------
       */

      if (
        !response.ok ||
        !result.success
      ) {
        /*
         * Tournament lock from server.
         */

        if (
          response.status === 403 &&
          result.locked
        ) {
          setTournamentLocked(
            true
          );

          setError(
            result.message ||
              "This tournament has been completed. Match results are locked."
          );

          return;
        }

        throw new Error(
          result.message ||
            `Failed to update match. HTTP ${response.status}.`
        );
      }

      /*
       * ------------------------------------------------------
       * SUCCESS
       * ------------------------------------------------------
       */

      setSuccess(
        "Match result updated successfully."
      );

      /*
       * Reload the actual database state.
       */

      await loadMatch();
    } catch (err) {
      console.error(
        "Match update error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update match."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ==========================================================
   * LOADING
   * ==========================================================
   */

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12">
        <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-12 text-center">
          <p className="text-gray-400">
            Loading match...
          </p>
        </div>
      </div>
    );
  }

  /*
   * ==========================================================
   * MATCH NOT FOUND
   * ==========================================================
   */

  if (!match) {
    return (
      <div className="max-w-7xl mx-auto py-12">
        <div className="bg-[#111111] border border-red-500/30 rounded-2xl p-12 text-center">
          <h1 className="text-2xl font-bold text-red-400">
            Match not found
          </h1>

          <p className="text-gray-400 mt-3">
            {error ||
              "The requested match could not be loaded."}
          </p>

          <Link
            href={`/admin/tournaments/${tournamentId}/fixtures`}
            className="inline-block mt-6 bg-[#D4AF37] text-black px-5 py-3 rounded-xl font-bold"
          >
            Back to Fixtures
          </Link>
        </div>
      </div>
    );
  }

  /*
   * ==========================================================
   * PAGE
   * ==========================================================
   */

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div>
        <Link
          href={`/admin/tournaments/${tournamentId}/matches`}
          className="text-gray-400 hover:text-white transition"
        >
          ← Back to Matches
        </Link>

        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
            Match Management
          </p>

          <h1 className="text-4xl font-bold mt-2">
            Match #
            {match.match_number ??
              match.id}
          </h1>

          <p className="text-gray-400 mt-2">
            Manage this tournament match
            result and scheduling details.
          </p>
        </div>
      </div>

      {/* =====================================================
          ALERTS
          ===================================================== */}

      {error && (
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 text-red-300">
          <p className="text-xs uppercase tracking-wider font-bold text-red-400 mb-1">
            Error
          </p>

          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-950/40 border border-green-500/40 rounded-xl p-4 text-green-300">
          <p className="text-xs uppercase tracking-wider font-bold text-green-400 mb-1">
            Success
          </p>

          {success}
        </div>
      )}

      {/* =====================================================
          TOURNAMENT LOCK
          ===================================================== */}

      {tournamentLocked && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="text-2xl">
              🔒
            </div>

            <div>
              <h2 className="font-bold text-red-400">
                Tournament Completed
              </h2>

              <p className="text-gray-400 text-sm mt-1">
                {tournament?.tournament_name
                  ? `${tournament.tournament_name} has been completed. `
                  : "This tournament has been completed. "}
                Match results are locked
                and can no longer be
                modified.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          MATCH HEADER
          ===================================================== */}

      <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">

          {/* PARTICIPANT A */}

          <div className="bg-black rounded-xl p-6 text-center">

            <p className="text-xs uppercase tracking-wider text-gray-500">
              Participant A
            </p>

            <h2 className="text-xl font-bold text-white mt-3">
              {participantAName}
            </h2>

            <p className="text-4xl font-bold text-white mt-3">
              {form.scoreA || "0"}
            </p>

          </div>

          {/* CENTER */}

          <div className="text-center">

            <p className="text-xs uppercase tracking-wider text-gray-500">
              {match.round ||
                "Tournament Match"}
            </p>

            <div className="text-3xl font-bold text-[#D4AF37] mt-4">
              VS
            </div>

            <p className="text-sm text-gray-400 mt-3">
              {match.best_of ||
                "BO1"}
            </p>

            <div
              className={`mt-4 inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
                isKnockout
                  ? "border-purple-500/40 text-purple-400"
                  : isRoundRobin
                  ? "border-blue-500/40 text-blue-400"
                  : "border-gray-700 text-gray-400"
              }`}
            >
              {matchType}
            </div>

          </div>

          {/* PARTICIPANT B */}

          <div className="bg-black rounded-xl p-6 text-center">

            <p className="text-xs uppercase tracking-wider text-gray-500">
              Participant B
            </p>

            <h2 className="text-xl font-bold text-white mt-3">
              {participantBName}
            </h2>

            <p className="text-4xl font-bold text-white mt-3">
              {form.scoreB || "0"}
            </p>

          </div>

        </div>

      </div>

      {/* =====================================================
          RESULT PREVIEW
          ===================================================== */}

      <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6">

        <h2 className="text-xl font-bold">
          Result Preview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">

          {/* MATCH TYPE */}

          <div className="bg-black rounded-xl p-4">

            <p className="text-xs text-gray-500">
              Match Type
            </p>

            <p className="font-semibold mt-2">
              {matchType}
            </p>

          </div>

          {/* RESULT */}

          <div className="bg-black rounded-xl p-4">

            <p className="text-xs text-gray-500">
              Result
            </p>

            <p className="font-semibold text-[#D4AF37] mt-2">
              {resultInfo.result}
            </p>

          </div>

          {/* WINNER */}

          <div className="bg-black rounded-xl p-4">

            <p className="text-xs text-gray-500">
              Winner
            </p>

            <p className="font-semibold text-green-400 mt-2">
              {resultInfo.winner}
            </p>

          </div>

        </div>

        {/* ROUND ROBIN DRAW */}

        {isRoundRobin &&
          validScores &&
          scoreA === scoreB && (
            <div className="mt-4 bg-green-950/30 border border-green-500/30 rounded-xl p-4">

              <p className="font-semibold text-green-400">
                Round Robin draw is valid.
              </p>

              <p className="text-sm text-gray-400 mt-1">
                No winner is required for a
                Round Robin match.
              </p>

            </div>
          )}

        {/* KNOCKOUT WARNING */}

        {isKnockout &&
          resultInfo.needsWinner && (
            <div className="mt-4 bg-yellow-950/40 border border-yellow-500/40 rounded-xl p-4">

              <p className="font-semibold text-yellow-400">
                Knockout match is tied.
              </p>

              <p className="text-sm text-gray-400 mt-1">
                A winner is required before
                the knockout match can be
                completed.
              </p>

            </div>
          )}

      </div>

      {/* =====================================================
          MATCH FORM
          ===================================================== */}

      <form
        onSubmit={saveMatch}
        className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6 space-y-8"
      >

        {/* FORM HEADER */}

        <div>
          <h2 className="text-xl font-bold">
            Match Information
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Enter the result and match
            details.
          </p>
        </div>

        {/* ===================================================
            SCORES
            =================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <div>

            <label className="block text-sm text-gray-400 mb-2">
              {participantAName} Score
            </label>

            <input
              type="number"
              min="0"
              step="1"
              value={form.scoreA}
              onChange={(event) =>
                updateForm(
                  "scoreA",
                  event.target.value
                )
              }
              className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
              disabled={
                tournamentLocked
              }
            />

          </div>

          <div>

            <label className="block text-sm text-gray-400 mb-2">
              {participantBName} Score
            </label>

            <input
              type="number"
              min="0"
              step="1"
              value={form.scoreB}
              onChange={(event) =>
                updateForm(
                  "scoreB",
                  event.target.value
                )
              }
              className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
              disabled={
                tournamentLocked
              }
            />

          </div>

        </div>

        {/* ===================================================
            PENALTIES
            =================================================== */}

        {isKnockout && (
          <div className="bg-black/60 border border-[#D4AF37]/20 rounded-xl p-5">

            <div className="mb-4">

              <h3 className="font-bold">
                Penalty Shootout
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Only required when a knockout
                match is tied after regulation.
              </p>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>

                <label className="block text-sm text-gray-400 mb-2">
                  {participantAName} Penalties
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.penaltyA}
                  onChange={(event) =>
                    updateForm(
                      "penaltyA",
                      event.target.value
                    )
                  }
                  className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
                  disabled={
                    tournamentLocked
                  }
                />

              </div>

              <div>

                <label className="block text-sm text-gray-400 mb-2">
                  {participantBName} Penalties
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.penaltyB}
                  onChange={(event) =>
                    updateForm(
                      "penaltyB",
                      event.target.value
                    )
                  }
                  className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
                  disabled={
                    tournamentLocked
                  }
                />

              </div>

            </div>

          </div>
        )}

        {/* ===================================================
            STATUS + RESULT
            =================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <div>

            <label className="block text-sm text-gray-400 mb-2">
              Match Status
            </label>

            <select
              value={form.status}
              onChange={(event) =>
                updateForm(
                  "status",
                  event.target.value
                )
              }
              className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
              disabled={
                tournamentLocked
              }
            >

              <option value="Scheduled">
                Scheduled
              </option>

              <option value="Live">
                Live
              </option>

              <option value="Completed">
                Completed
              </option>

              <option value="Cancelled">
                Cancelled
              </option>

              <option value="Postponed">
                Postponed
              </option>

            </select>

          </div>

          <div>

            <label className="block text-sm text-gray-400 mb-2">
              Result
            </label>

            <input
              type="text"
              value={
                resultInfo.result
              }
              readOnly
              className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-gray-300 focus:outline-none"
              disabled={
                tournamentLocked
              }
            />

            <p className="text-xs text-gray-500 mt-2">
              Automatically determined
              from the score and penalty
              result.
            </p>

          </div>

        </div>

        {/* ===================================================
            DATE + TIME
            =================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <div>

            <label className="block text-sm text-gray-400 mb-2">
              Scheduled Date
            </label>

            <input
              type="date"
              value={
                form.scheduledDate
              }
              onChange={(event) =>
                updateForm(
                  "scheduledDate",
                  event.target.value
                )
              }
              className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
              disabled={
                tournamentLocked
              }
            />

          </div>

          <div>

            <label className="block text-sm text-gray-400 mb-2">
              Scheduled Time
            </label>

            <input
              type="time"
              value={
                form.scheduledTime
              }
              onChange={(event) =>
                updateForm(
                  "scheduledTime",
                  event.target.value
                )
              }
              className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
              disabled={
                tournamentLocked
              }
            />

          </div>

        </div>

        {/* ===================================================
            STREAM LINK
            =================================================== */}

        <div>

          <label className="block text-sm text-gray-400 mb-2">
            Stream Link
          </label>

          <input
            type="url"
            value={form.streamLink}
            onChange={(event) =>
              updateForm(
                "streamLink",
                event.target.value
              )
            }
            placeholder="https://..."
            className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
            disabled={
              tournamentLocked
            }
          />

        </div>

        {/* ===================================================
            NOTES
            =================================================== */}

        <div>

          <label className="block text-sm text-gray-400 mb-2">
            Notes
          </label>

          <textarea
            rows={5}
            value={form.notes}
            onChange={(event) =>
              updateForm(
                "notes",
                event.target.value
              )
            }
            placeholder="Add match notes..."
            className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] resize-none"
            disabled={
              tournamentLocked
            }
          />

        </div>

        {/* ===================================================
            ACTIONS
            =================================================== */}

        <div className="flex flex-wrap gap-3 pt-3">

          <button
            type="submit"
            disabled={
              saving ||
              tournamentLocked
            }
            className={`px-5 py-3 rounded-xl font-bold transition ${
              tournamentLocked
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : saving
                ? "bg-[#D4AF37]/60 text-black cursor-wait"
                : "bg-[#D4AF37] text-black hover:bg-yellow-400"
            }`}
          >
            {tournamentLocked
              ? "🔒 Match Locked"
              : saving
              ? "Saving..."
              : "Save Match"}
          </button>

          <Link
            href={`/admin/tournaments/${tournamentId}/matches`}
            className="bg-black border border-gray-700 hover:border-[#D4AF37] px-6 py-3 rounded-xl font-semibold transition"
          >
            Cancel
          </Link>

        </div>

      </form>

    </div>
  );
}