"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Game {
  id: number;
  name?: string;
  game_name?: string;
}

interface Tournament {
  id: number;
  tournament_name: string;
  game_id: number | null;
  tournament_type: string;
  tournament_level: string;
  prize_pool: number | null;
  registration_fee: number | null;
  max_teams: number | null;
  registration_start: string | null;
  registration_end: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  banner_image: string | null;
  description: string | null;
  rules: string | null;
  status: string;
}

const tournamentTypes = [
  "Round Robin",
  "Single Elimination",
  "Double Elimination",
  "Round Robin + Single Elimination",
  "Round Robin + Double Elimination",
  "Group Stage + Knockout",
  "Swiss System",
];

const tournamentLevels = [
  "Local",
  "Regional",
  "National",
  "East Africa",
  "Africa",
  "International",
];

const tournamentStatuses = [
  "Upcoming",
  "Registration Open",
  "Live",
  "Completed",
  "Cancelled",
];

function parseDate(value: string | null): Date | null {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateForDatabase(
  value: Date | null
): string | null {
  if (!value) return null;

  return value.toISOString();
}

export default function EditTournamentPage() {
  const params = useParams();
  const router = useRouter();

  const tournamentId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [tournament, setTournament] =
    useState<Tournament | null>(null);

  const [games, setGames] = useState<Game[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [registrationStart, setRegistrationStart] =
    useState<Date | null>(null);

  const [registrationEnd, setRegistrationEnd] =
    useState<Date | null>(null);

  const [startDate, setStartDate] =
    useState<Date | null>(null);

  const [endDate, setEndDate] =
    useState<Date | null>(null);

  const [form, setForm] = useState({
    tournament_name: "",
    game_id: "",
    tournament_type: "Round Robin",
    tournament_level: "Local",
    prize_pool: "",
    registration_fee: "",
    max_teams: "",
    location: "",
    banner_image: "",
    description: "",
    rules: "",
    status: "Upcoming",
  });

  useEffect(() => {
    if (!tournamentId) return;

    async function loadData() {
      try {
        setLoading(true);

        const [
          tournamentResponse,
          gamesResponse,
        ] = await Promise.all([
          fetch(`/api/tournaments/${tournamentId}`),
          fetch("/api/games"),
        ]);

        const tournamentResult =
          await tournamentResponse.json();

        const gamesResult =
          await gamesResponse.json();

        if (
          !tournamentResponse.ok ||
          !tournamentResult.success
        ) {
          throw new Error(
            tournamentResult.message ||
              "Failed to load tournament."
          );
        }

        if (!gamesResponse.ok) {
          throw new Error(
            gamesResult.message ||
              "Failed to load games."
          );
        }

        const loadedTournament =
          tournamentResult.tournament;

        setTournament(loadedTournament);

        setGames(gamesResult.games ?? []);

        setForm({
          tournament_name:
            loadedTournament.tournament_name ?? "",

          game_id:
            loadedTournament.game_id != null
              ? String(loadedTournament.game_id)
              : "",

          tournament_type:
            loadedTournament.tournament_type ??
            "Round Robin",

          tournament_level:
            loadedTournament.tournament_level ??
            "Local",

          prize_pool:
            loadedTournament.prize_pool != null
              ? String(loadedTournament.prize_pool)
              : "",

          registration_fee:
            loadedTournament.registration_fee != null
              ? String(
                  loadedTournament.registration_fee
                )
              : "",

          max_teams:
            loadedTournament.max_teams != null
              ? String(loadedTournament.max_teams)
              : "",

          location:
            loadedTournament.location ?? "",

          banner_image:
            loadedTournament.banner_image ?? "",

          description:
            loadedTournament.description ?? "",

          rules:
            loadedTournament.rules ?? "",

          status:
            loadedTournament.status ?? "Upcoming",
        });

        setRegistrationStart(
          parseDate(
            loadedTournament.registration_start
          )
        );

        setRegistrationEnd(
          parseDate(
            loadedTournament.registration_end
          )
        );

        setStartDate(
          parseDate(
            loadedTournament.start_date
          )
        );

        setEndDate(
          parseDate(
            loadedTournament.end_date
          )
        );
      } catch (error) {
        console.error(
          "Failed to load edit data:",
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : "Failed to load tournament."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [tournamentId]);

  function updateField(
    field: string,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.tournament_name.trim()) {
      alert("Tournament name is required.");
      return;
    }

    if (!form.game_id) {
      alert("Please select a game.");
      return;
    }

    if (!form.tournament_type) {
      alert("Please select a tournament type.");
      return;
    }

    if (!form.tournament_level) {
      alert("Please select a tournament level.");
      return;
    }

    /*
     * Registration opening cannot be after
     * registration closing.
     */
    if (
      registrationStart &&
      registrationEnd &&
      registrationEnd < registrationStart
    ) {
      alert(
        "Registration closing date cannot be before the registration opening date."
      );
      return;
    }

    /*
     * Registration must close before
     * tournament starts.
     */
    if (
      registrationEnd &&
      startDate &&
      registrationEnd > startDate
    ) {
      alert(
        "Registration closing date cannot be after the tournament start date."
      );
      return;
    }

    /*
     * Tournament end cannot be before
     * tournament start.
     */
    if (
      startDate &&
      endDate &&
      endDate < startDate
    ) {
      alert(
        "Tournament end date cannot be before the tournament start date."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/tournaments/${tournamentId}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            tournament_name:
              form.tournament_name.trim(),

            game_id:
              Number(form.game_id),

            tournament_type:
              form.tournament_type,

            tournament_level:
              form.tournament_level,

            prize_pool:
              form.prize_pool
                ? Number(form.prize_pool)
                : null,

            registration_fee:
              form.registration_fee
                ? Number(
                    form.registration_fee
                  )
                : null,

            max_teams:
              form.max_teams
                ? Number(form.max_teams)
                : null,

            registration_start:
              formatDateForDatabase(
                registrationStart
              ),

            registration_end:
              formatDateForDatabase(
                registrationEnd
              ),

            start_date:
              formatDateForDatabase(
                startDate
              ),

            end_date:
              formatDateForDatabase(
                endDate
              ),

            location:
              form.location.trim() || null,

            banner_image:
              form.banner_image.trim() ||
              null,

            description:
              form.description.trim() ||
              null,

            rules:
              form.rules.trim() || null,

            status:
              form.status,
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
            "Failed to update tournament."
        );
      }

      alert(
        "Tournament details updated successfully."
      );

      router.push(
        `/admin/tournaments/${tournamentId}`
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Tournament update error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to update tournament."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-10">
        <p className="text-gray-400">
          Loading tournament details...
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

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* HEADER */}

      <div>
        <Link
          href={`/admin/tournaments/${tournamentId}`}
          className="text-gray-400 hover:text-white transition"
        >
          ← Back to Tournament
        </Link>

        <h1 className="text-4xl font-bold mt-5">
          Edit Tournament
        </h1>

        <p className="text-gray-400 mt-2">
          Update the tournament details and
          settings.
        </p>
      </div>

      {/* FORM */}

      <form
        onSubmit={handleSubmit}
        className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-8 space-y-8"
      >

        {/* BASIC INFORMATION */}

        <section>
          <h2 className="text-xl font-bold mb-5">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-2">
                Tournament Name
              </label>

              <input
                type="text"
                value={
                  form.tournament_name
                }
                onChange={(e) =>
                  updateField(
                    "tournament_name",
                    e.target.value
                  )
                }
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-[#D4AF37]"
                placeholder="Tournament name"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Game
              </label>

              <select
                value={form.game_id}
                onChange={(e) =>
                  updateField(
                    "game_id",
                    e.target.value
                  )
                }
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-[#D4AF37]"
              >
                <option value="">
                  Select game
                </option>

                {games.map((game) => (
                  <option
                    key={game.id}
                    value={game.id}
                  >
                    {game.game_name ??
                      game.name ??
                      `Game #${game.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* TOURNAMENT TYPE */}

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Tournament Type
              </label>

              <select
                name="tournament_type"
                value={form.tournament_type}
                onChange={(e) =>
                  updateField(
                    "tournament_type",
                    e.target.value
                  )
                }
                required
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
              >
                <option value="">
                  Select Type
                </option>

                {tournamentTypes.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  )
                )}
              </select>

              <p className="text-gray-500 text-xs mt-2">
                Select a tournament format supported
                by the KICKCREW fixture system.
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Tournament Level
              </label>

              <select
                value={
                  form.tournament_level
                }
                onChange={(e) =>
                  updateField(
                    "tournament_level",
                    e.target.value
                  )
                }
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-[#D4AF37]"
              >
                {tournamentLevels.map(
                  (level) => (
                    <option
                      key={level}
                      value={level}
                    >
                      {level}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Status
              </label>

              <select
                value={form.status}
                onChange={(e) =>
                  updateField(
                    "status",
                    e.target.value
                  )
                }
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-[#D4AF37]"
              >
                {tournamentStatuses.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  )
                )}
              </select>
            </div>

          </div>
        </section>

        {/* TOURNAMENT SETTINGS */}

        <section>
          <h2 className="text-xl font-bold mb-5">
            Tournament Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Prize Pool
              </label>

              <input
                type="number"
                min="0"
                value={
                  form.prize_pool
                }
                onChange={(e) =>
                  updateField(
                    "prize_pool",
                    e.target.value
                  )
                }
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-[#D4AF37]"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Registration Fee
              </label>

              <input
                type="number"
                min="0"
                value={
                  form.registration_fee
                }
                onChange={(e) =>
                  updateField(
                    "registration_fee",
                    e.target.value
                  )
                }
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-[#D4AF37]"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Maximum Teams
              </label>

              <input
                type="number"
                min="1"
                value={
                  form.max_teams
                }
                onChange={(e) =>
                  updateField(
                    "max_teams",
                    e.target.value
                  )
                }
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-[#D4AF37]"
                placeholder="Maximum participants"
              />
            </div>

          </div>
        </section>

        {/* SCHEDULE */}

        <section>
          <h2 className="text-xl font-bold mb-5">
            Schedule
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* REGISTRATION OPENS */}

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Registration Opens
              </label>

              <DatePicker
                selected={
                  registrationStart
                }
                onChange={(
                  date: Date | null
                ) =>
                  setRegistrationStart(date)
                }
                showTimeSelect
                timeIntervals={15}
                dateFormat="dd/MM/yyyy h:mm aa"
                placeholderText="Select registration opening date and time"
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                calendarClassName="kickcrew-datepicker"
                isClearable
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
              />

              <p className="text-gray-500 text-xs mt-2">
                When participants can begin
                registering.
              </p>
            </div>

            {/* REGISTRATION CLOSES */}

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Registration Closes
              </label>

              <DatePicker
                selected={
                  registrationEnd
                }
                onChange={(
                  date: Date | null
                ) =>
                  setRegistrationEnd(date)
                }
                showTimeSelect
                timeIntervals={15}
                dateFormat="dd/MM/yyyy h:mm aa"
                placeholderText="Select registration closing date and time"
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                calendarClassName="kickcrew-datepicker"
                isClearable
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
              />

              <p className="text-gray-500 text-xs mt-2">
                Final date and time for
                registration.
              </p>
            </div>

            {/* TOURNAMENT START */}

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Tournament Start
              </label>

              <DatePicker
                selected={startDate}
                onChange={(
                  date: Date | null
                ) =>
                  setStartDate(date)
                }
                showTimeSelect
                timeIntervals={15}
                dateFormat="dd/MM/yyyy h:mm aa"
                placeholderText="Select tournament start date and time"
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                calendarClassName="kickcrew-datepicker"
                isClearable
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
              />

              <p className="text-gray-500 text-xs mt-2">
                When the tournament officially
                begins.
              </p>
            </div>

            {/* TOURNAMENT END */}

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Tournament End
              </label>

              <DatePicker
                selected={endDate}
                onChange={(
                  date: Date | null
                ) =>
                  setEndDate(date)
                }
                showTimeSelect
                timeIntervals={15}
                dateFormat="dd/MM/yyyy h:mm aa"
                placeholderText="Select tournament end date and time"
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                calendarClassName="kickcrew-datepicker"
                isClearable
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
              />

              <p className="text-gray-500 text-xs mt-2">
                Expected tournament completion
                date and time.
              </p>
            </div>

          </div>
        </section>

        {/* LOCATION */}

        <section>
          <h2 className="text-xl font-bold mb-5">
            Location & Media
          </h2>

          <div className="space-y-6">

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Location
              </label>

              <input
                type="text"
                value={form.location}
                onChange={(e) =>
                  updateField(
                    "location",
                    e.target.value
                  )
                }
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-[#D4AF37]"
                placeholder="Online, Nairobi, venue, etc."
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Banner Image URL
              </label>

              <input
                type="text"
                value={
                  form.banner_image
                }
                onChange={(e) =>
                  updateField(
                    "banner_image",
                    e.target.value
                  )
                }
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-[#D4AF37]"
                placeholder="/images/tournament-banner.jpg"
              />
            </div>

          </div>
        </section>

        {/* DESCRIPTION */}

        <section>
          <h2 className="text-xl font-bold mb-5">
            Tournament Description
          </h2>

          <textarea
            value={form.description}
            onChange={(e) =>
              updateField(
                "description",
                e.target.value
              )
            }
            rows={6}
            className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-[#D4AF37] resize-y"
            placeholder="Describe the tournament..."
          />
        </section>

        {/* RULES */}

        <section>
          <h2 className="text-xl font-bold mb-5">
            Rules
          </h2>

          <textarea
            value={form.rules}
            onChange={(e) =>
              updateField(
                "rules",
                e.target.value
              )
            }
            rows={8}
            className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-[#D4AF37] resize-y"
            placeholder="Tournament rules..."
          />
        </section>

        {/* ACTIONS */}

        <div className="flex flex-wrap gap-4 pt-4 border-t border-[#222]">

          <button
            type="submit"
            disabled={saving}
            className="bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>

          <Link
            href={`/admin/tournaments/${tournamentId}`}
            className="bg-black border border-gray-700 px-6 py-3 rounded-xl font-semibold hover:border-[#D4AF37] transition"
          >
            Cancel
          </Link>

        </div>

      </form>

    </div>
  );
}