"use client";

import {
  useEffect,
  useState,
} from "react";

interface Participant {
  seed: number;
  registration_id: number;

  team_id: number | null;
  player_id: number | null;

  name: string;

  type: "Team" | "Player";
}

interface TournamentGroup {
  id: number;
  group_name: string;
  group_code: string;
  group_order: number;
  status: string | null;
  participant_count: number;
  participants: Participant[];
}

interface GroupResponse {
  success: boolean;
  message?: string;
  already_exists?: boolean;
  group_count?: number;
  participant_count?: number;
  groups?: TournamentGroup[];
}

interface Props {
  tournamentId: number | string;
}

export default function GroupStageSetup({
  tournamentId,
}: Props) {
  const [groupCount, setGroupCount] =
    useState("2");

  const [groups, setGroups] =
    useState<TournamentGroup[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function loadGroups() {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          `/api/tournaments/${tournamentId}/groups`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const result: GroupResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Failed to load tournament groups."
        );
      }

      const loadedGroups =
        Array.isArray(result.groups)
          ? result.groups
          : [];

      setGroups(
        loadedGroups
      );
    } catch (error) {
      console.error(
        "Group loading error:",
        error
      );

      setGroups([]);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load tournament groups."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!tournamentId) {
      return;
    }

    loadGroups();
  }, [tournamentId]);

  async function handleCreateGroups() {
    setError("");
    setSuccess("");

    const count =
      Number(groupCount);

    if (
      !Number.isInteger(count) ||
      count < 2 ||
      count > 16
    ) {
      setError(
        "Select between 2 and 16 groups."
      );

      return;
    }

    try {
      setCreating(true);

      const response =
        await fetch(
          `/api/tournaments/${tournamentId}/groups`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              group_count:
                count,
            }),
          }
        );

      const result: GroupResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ??
            "Failed to create groups."
        );
      }

      const createdGroups =
        Array.isArray(result.groups)
          ? result.groups
          : [];

      setGroups(
        createdGroups
      );

      setSuccess(
        result.already_exists
          ? "Tournament groups already exist."
          : result.message ??
            "Groups created successfully."
      );
    } catch (error) {
      console.error(
        "Group creation error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create groups."
      );
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-[#111111] p-6">
        <p className="text-gray-400">
          Loading group stage...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* SETUP */}

      <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#111111] p-6">

        <div className="mb-6">

          <h2 className="text-2xl font-bold text-white">
            Group Stage Setup
          </h2>

          <p className="mt-2 text-sm text-gray-400">
            Create groups and distribute the
            approved tournament participants.
          </p>

        </div>

        {groups.length === 0 ? (
          <>
            <div className="max-w-md">

              <label
                htmlFor="group-count"
                className="mb-2 block text-sm font-semibold text-white"
              >
                Number of Groups
              </label>

              <select
                id="group-count"
                value={groupCount}
                onChange={(event) =>
                  setGroupCount(
                    event.target.value
                  )
                }
                disabled={creating}
                className="w-full rounded-xl border border-gray-700 bg-black p-3 text-white outline-none focus:border-[#D4AF37]"
              >

                {Array.from(
                  { length: 15 },
                  (_, index) => index + 2
                ).map((count) => (
                  <option
                    key={count}
                    value={count}
                  >
                    {count} Groups
                  </option>
                ))}

              </select>

            </div>

            <div className="mt-6">

              <button
                type="button"
                onClick={
                  handleCreateGroups
                }
                disabled={creating}
                className="rounded-xl bg-[#D4AF37] px-6 py-3 font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating
                  ? "Creating Groups..."
                  : "Create Groups"}
              </button>

            </div>
          </>
        ) : (
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">

            <p className="font-semibold text-green-400">
              Group stage created
            </p>

            <p className="mt-1 text-sm text-gray-400">
              {groups.length} groups have been
              created and participants assigned.
            </p>

          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">

            <p className="text-sm text-red-400">
              {error}
            </p>

          </div>
        )}

        {success && (
          <div className="mt-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4">

            <p className="text-sm text-green-400">
              {success}
            </p>

          </div>
        )}

      </div>

      {/* GROUPS */}

      {groups.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {groups.map((group) => {

            const participants =
              Array.isArray(
                group.participants
              )
                ? group.participants
                : [];

            return (
              <div
                key={group.id}
                className="overflow-hidden rounded-2xl border border-gray-800 bg-[#111111]"
              >

                {/* HEADER */}

                <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">

                  <div>

                    <h3 className="text-xl font-bold text-white">
                      {group.group_name}
                    </h3>

                    <p className="text-xs uppercase tracking-wider text-gray-500">
                      {participants.length}{" "}
                      participants
                    </p>

                  </div>

                  <span className="rounded-lg border border-[#D4AF37]/30 px-3 py-1 text-sm font-bold text-[#D4AF37]">
                    {group.group_code}
                  </span>

                </div>

                {/* PARTICIPANTS */}

                {participants.length === 0 ? (
                  <div className="p-6">

                    <p className="text-sm text-gray-500">
                      No participants assigned.
                    </p>

                  </div>
                ) : (
                  <div className="divide-y divide-gray-800">

                    {participants.map(
                      (participant) => (
                        <div
                          key={
                            participant.registration_id
                          }
                          className="flex items-center gap-4 px-6 py-4"
                        >

                          <span className="w-8 text-sm font-bold text-gray-500">
                            {participant.seed}
                          </span>

                          <div className="min-w-0">

                            <p className="font-semibold text-white">
                              {participant.name}
                            </p>

                            <p className="text-xs text-gray-500">
                              {participant.type}
                            </p>

                          </div>

                        </div>
                      )
                    )}

                  </div>
                )}

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}