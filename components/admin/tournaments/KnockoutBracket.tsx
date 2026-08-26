"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface Match {
  id: number;
  tournament_id: number;
  team_a_id: number | null;
  team_b_id: number | null;
  player_a_id: number | null;
  player_b_id: number | null;
  round: string | null;
  match_number: number | null;
  status: string | null;
  winner_id: number | null;
  winner_team_id?: number | null;
  winner_player_id?: number | null;
  score_team_a: number | null;
  score_team_b: number | null;
  notes?: string | null;
  next_match_id?: number | null;
  next_match_slot?: "A" | "B" | null;
}

interface Registration {
  team_id: number | null;
  player_id: number | null;
  teams?: { team_name?: string | null }[] | null;
  players?: {
    full_name?: string | null;
    gamer_tag?: string | null;
  }[] | null;
}

interface TournamentBracketProps {
  tournamentId: number | string;
  title?: string;
  refreshKey?: number;
}

const ROUND_ORDER = [
  "Round of 32",
  "Round of 16",
  "Quarterfinals",
  "Semifinals",
  "Final",
];

function normalize(value: unknown): string {
  return String(value ?? "").toLowerCase().trim();
}

function isBye(match: Match): boolean {
  const hasA =
    match.team_a_id !== null || match.player_a_id !== null;

  const hasB =
    match.team_b_id !== null || match.player_b_id !== null;

  return (
    normalize(match.notes).includes("automatic bye") ||
    (hasA !== hasB)
  );
}

function isPlaceholderMatch(match: Match): boolean {
  return (
    match.team_a_id === null &&
    match.team_b_id === null &&
    match.player_a_id === null &&
    match.player_b_id === null
  );
}

function getRoundIndex(round: string | null): number {
  const value = normalize(round);

  const index = ROUND_ORDER.findIndex(
    (item) => normalize(item) === value
  );

  return index === -1 ? 999 : index;
}

function participantId(
  match: Match,
  side: "A" | "B"
): number | null {
  return side === "A"
    ? match.team_a_id ?? match.player_a_id
    : match.team_b_id ?? match.player_b_id;
}

export default function TournamentBracket({
  tournamentId,
  title = "Knockout Bracket",
  refreshKey = 0,
}: TournamentBracketProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const tournamentIdNumber = Number(tournamentId);

  const loadBracket = useCallback(async () => {
    if (!Number.isInteger(tournamentIdNumber)) {
      setError("A valid tournament ID is required.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [matchesResponse, registrationsResponse] =
        await Promise.all([
          fetch(
            `/api/matches?tournament_id=${tournamentIdNumber}`,
            { cache: "no-store" }
          ),
          fetch(
            `/api/tournament-registrations?tournament_id=${tournamentIdNumber}`,
            { cache: "no-store" }
          ),
        ]);

      const matchesResult = await matchesResponse.json();
      const registrationsResult =
        await registrationsResponse.json();

      if (
        !matchesResponse.ok ||
        !matchesResult.success
      ) {
        throw new Error(
          matchesResult.message ||
            "Failed to load tournament matches."
        );
      }

      setMatches(matchesResult.matches ?? []);

      if (
        registrationsResponse.ok &&
        registrationsResult.success
      ) {
        setRegistrations(
          registrationsResult.registrations ?? []
        );
      }
    } catch (err) {
      console.error("Bracket load error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load knockout bracket."
      );
    } finally {
      setLoading(false);
    }
  }, [tournamentIdNumber]);

  useEffect(() => {
    loadBracket();
  }, [loadBracket, refreshKey]);

  const participantNames = useMemo(() => {
    const map = new Map<string, string>();

    for (const registration of registrations) {
      if (registration.team_id !== null) {
        map.set(
          `team:${registration.team_id}`,
          registration.teams?.[0]?.team_name ??
            `Team #${registration.team_id}`
        );
      }

      if (registration.player_id !== null) {
        map.set(
          `player:${registration.player_id}`,
          registration.players?.[0]?.gamer_tag ??
            registration.players?.[0]?.full_name ??
            `Player #${registration.player_id}`
        );
      }
    }

    return map;
  }, [registrations]);

  const matchesByNumber = useMemo(() => {
    const map = new Map<number, Match>();

    for (const match of matches) {
      if (match.match_number !== null) {
        map.set(match.match_number, match);
      }
    }

    return map;
  }, [matches]);

  const knockoutMatches = useMemo(
    () =>
      matches
        .filter((match) =>
          ROUND_ORDER.some(
            (round) =>
              normalize(round) === normalize(match.round)
          )
        )
        .sort((a, b) => {
          const roundDifference =
            getRoundIndex(a.round) -
            getRoundIndex(b.round);

          if (roundDifference !== 0) {
            return roundDifference;
          }

          return (
            Number(a.match_number ?? 0) -
            Number(b.match_number ?? 0)
          );
        }),
    [matches]
  );

  const rounds = useMemo(() => {
    const map = new Map<string, Match[]>();

    for (const match of knockoutMatches) {
      if (!match.round) continue;

      const existing = map.get(match.round) ?? [];
      existing.push(match);
      map.set(match.round, existing);
    }

    return ROUND_ORDER.filter((round) =>
      map.has(round)
    ).map((round) => ({
      name: round,
      matches: map.get(round) ?? [],
    }));
  }, [knockoutMatches]);

  function resolveParticipantName(
    match: Match,
    side: "A" | "B"
  ): string {
    const id = participantId(match, side);

    if (id !== null) {
      const key =
        match.team_a_id !== null ||
        match.team_b_id !== null
          ? `team:${id}`
          : `player:${id}`;

      return (
        participantNames.get(key) ??
        (key.startsWith("team:")
          ? `Team #${id}`
          : `Player #${id}`)
      );
    }

    /*
     * A future knockout match has no participant IDs until the
     * source match is completed. Show the source match instead
     * of the misleading "TBD".
     */
    const notes = match.notes ?? "";

    const sourceMatches = Array.from(
      notes.matchAll(/Match\s+(\d+)/gi)
    ).map((result) => Number(result[1]));

    const sourceMatchNumber =
      side === "A"
        ? sourceMatches[0]
        : sourceMatches[1];

    if (Number.isFinite(sourceMatchNumber)) {
      const source = matchesByNumber.get(
        sourceMatchNumber
      );

      if (source) {
        const sourceWinnerId = source.winner_id;

        if (sourceWinnerId !== null) {
          const winnerIsTeam =
            source.winner_team_id !== null ||
            (source.team_a_id !== null &&
              source.player_a_id === null);

          const key = winnerIsTeam
            ? `team:${sourceWinnerId}`
            : `player:${sourceWinnerId}`;

          return (
            participantNames.get(key) ??
            (winnerIsTeam
              ? `Team #${sourceWinnerId}`
              : `Player #${sourceWinnerId}`)
          );
        }
      }

      return `Winner of Match ${sourceMatchNumber}`;
    }

    if (
      normalize(notes).includes("loser of match")
    ) {
      return "Loser pending";
    }

    return "Pending";
  }

  function getScore(
    match: Match,
    side: "A" | "B"
  ): string | null {
    if (isBye(match)) return null;

    const score =
      side === "A"
        ? match.score_team_a
        : match.score_team_b;

    return score === null ? null : String(score);
  }

  function getStatusLabel(match: Match): string {
    if (isBye(match)) return "BYE";

    const status = normalize(match.status);

    if (status === "completed") return "Completed";
    if (status === "live" || status === "in progress") {
      return "Live";
    }
    if (status === "scheduled") return "Scheduled";

    return "Pending";
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-black/40 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-7 w-56 rounded bg-white/10" />
          <div className="h-64 rounded bg-white/5" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <h2 className="text-xl font-bold text-white">
          {title}
        </h2>
        <p className="mt-3 text-sm text-red-300">
          {error}
        </p>
      </section>
    );
  }

  if (rounds.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-black/40 p-6 text-white">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-3 text-sm text-white/50">
          No knockout matches have been generated yet.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-black/50 p-6 text-white shadow-xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-wide">
            {title}
          </h2>
          <p className="mt-1 text-sm text-white/50">
            BYE matches advance automatically and do not display
            artificial scores.
          </p>
        </div>

        <button
          type="button"
          onClick={loadBracket}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-[#D4AF37]/50 hover:text-white"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto pb-4">
        <div
          className="grid min-w-[900px] gap-8"
          style={{
            gridTemplateColumns: `repeat(${rounds.length}, minmax(220px, 1fr))`,
          }}
        >
          {rounds.map((round) => (
            <div key={round.name}>
              <div className="mb-4 border-b border-[#D4AF37]/20 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-[#D4AF37]">
                  {round.name}
                </h3>
              </div>

              <div className="space-y-5">
                {round.matches.map((match) => {
                  const bye = isBye(match);
                  const placeholder =
                    isPlaceholderMatch(match);

                  const nameA =
                    resolveParticipantName(match, "A");
                  const nameB =
                    resolveParticipantName(match, "B");

                  const scoreA =
                    getScore(match, "A");
                  const scoreB =
                    getScore(match, "B");

                  const winner =
                    match.winner_id !== null;

                  return (
                    <div
                      key={match.id}
                      className={`overflow-hidden rounded-xl border bg-black/70 ${
                        bye
                          ? "border-[#D4AF37]/30"
                          : "border-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                          Match #{match.match_number}
                        </span>

                        <span
                          className={`text-[10px] font-bold uppercase ${
                            bye
                              ? "text-[#D4AF37]"
                              : normalize(match.status) ===
                                  "completed"
                                ? "text-green-400"
                                : "text-white/40"
                          }`}
                        >
                          {getStatusLabel(match)}
                        </span>
                      </div>

                      <div className="divide-y divide-white/5">
                        <div
                          className={`flex items-center justify-between px-4 py-3 ${
                            winner &&
                            match.winner_id ===
                              participantId(match, "A")
                              ? "bg-[#D4AF37]/10"
                              : ""
                          }`}
                        >
                          <div className="min-w-0 pr-3">
                            <p
                              className={`truncate text-sm font-semibold ${
                                bye && participantId(match, "A") !== null
                                  ? "text-[#D4AF37]"
                                  : "text-white"
                              }`}
                            >
                              {nameA}
                            </p>

                            {bye &&
                              participantId(match, "A") !== null && (
                                <span className="text-[10px] uppercase tracking-wider text-[#D4AF37]/70">
                                  Advances by bye
                                </span>
                              )}
                          </div>

                          {!placeholder && scoreA !== null && (
                            <span className="text-lg font-black">
                              {scoreA}
                            </span>
                          )}
                        </div>

                        <div
                          className={`flex items-center justify-between px-4 py-3 ${
                            winner &&
                            match.winner_id ===
                              participantId(match, "B")
                              ? "bg-[#D4AF37]/10"
                              : ""
                          }`}
                        >
                          <div className="min-w-0 pr-3">
                            <p
                              className={`truncate text-sm font-semibold ${
                                bye && participantId(match, "B") !== null
                                  ? "text-[#D4AF37]"
                                  : "text-white"
                              }`}
                            >
                              {nameB}
                            </p>

                            {bye &&
                              participantId(match, "B") !== null && (
                                <span className="text-[10px] uppercase tracking-wider text-[#D4AF37]/70">
                                  Advances by bye
                                </span>
                              )}
                          </div>

                          {!placeholder && scoreB !== null && (
                            <span className="text-lg font-black">
                              {scoreB}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}