"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/admin/ImageUpload";

interface Game {
  id: number;
  game_name: string;
}

export default function NewTournamentPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  const [form, setForm] = useState({
    tournament_name: "",
    game_id: "",
    tournament_type: "",
    tournament_level: "",
    prize_pool: "",
    registration_fee: "",
    max_teams: "",

    registration_start: "",
    registration_end: "",

    start_date: "",
    end_date: "",

    location: "",
    banner_image: "",
    description: "",
    rules: "",
    status: "Upcoming",
  });

  // ==================================================
  // LOAD GAMES
  // ==================================================

  useEffect(() => {
    async function loadGames() {
      try {
        setGamesLoading(true);

        const response = await fetch("/api/games");

        const result = await response.json();

        if (!response.ok || !result.success) {
          console.error(
            "Failed to load games:",
            result.message
          );

          return;
        }

        setGames(result.games ?? []);
      } catch (error) {
        console.error(
          "Failed to load games:",
          error
        );
      } finally {
        setGamesLoading(false);
      }
    }

    loadGames();
  }, []);

  // ==================================================
  // HANDLE FORM CHANGES
  // ==================================================

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLSelectElement |
      HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // ==================================================
  // OPEN DATE/TIME PICKER
  // ==================================================

  function openDateTimePicker(
    e: React.MouseEvent<HTMLInputElement>
  ) {
    e.currentTarget.showPicker?.();
  }

  // ==================================================
  // HANDLE SUBMIT
  // ==================================================

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await fetch(
        "/api/tournaments",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(form),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        alert(
          result.message ||
            "Failed to create tournament."
        );

        return;
      }

      alert(
        "Tournament created successfully!"
      );

      router.push(
        "/admin/tournaments"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Tournament creation error:",
        error
      );

      alert(
        "Something went wrong while creating the tournament."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <div className="max-w-6xl mx-auto">

      {/* ==================================================
          HEADER
          ================================================== */}

      <div className="mb-10">

        <h1 className="text-4xl font-bold">
          New Tournament
        </h1>

        <p className="text-gray-400 mt-2">
          Create a new esports tournament.
        </p>

      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-8"
      >

        {/* ==================================================
            TOURNAMENT INFORMATION
            ================================================== */}

        <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-8">

          <h2 className="text-xl font-bold mb-6">
            Tournament Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* ==================================================
                BANNER
                ================================================== */}

            <div>

              <label className="block mb-2 font-semibold">
                Tournament Banner
              </label>

              <ImageUpload
                value={form.banner_image}
                onChange={(url) =>
                  setForm((previous) => ({
                    ...previous,
                    banner_image: url,
                  }))
                }
              />

            </div>

            {/* ==================================================
                NAME
                ================================================== */}

            <div>

              <label className="block mb-2 font-semibold">
                Tournament Name
              </label>

              <input
                type="text"
                name="tournament_name"
                value={
                  form.tournament_name
                }
                onChange={handleChange}
                required
                placeholder="Example: KICKCREW eFootball Championship"
                className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white"
              />

            </div>

            {/* ==================================================
                GAME
                ================================================== */}

            <div>

              <label className="block mb-2 font-semibold">
                Game
              </label>

              <select
                name="game_id"
                value={form.game_id}
                onChange={handleChange}
                required
                className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white"
              >

                <option value="">
                  {gamesLoading
                    ? "Loading games..."
                    : "Select Game"}
                </option>

                {games.map((game) => (
                  <option
                    key={game.id}
                    value={game.id}
                  >
                    {game.game_name}
                  </option>
                ))}

              </select>

            </div>

            {/* ==================================================
                TOURNAMENT FORMAT
                ================================================== */}

            <div>

              <label className="block mb-2 font-semibold">
                Tournament Format
              </label>

              <select
                name="tournament_type"
                value={
                  form.tournament_type
                }
                onChange={handleChange}
                required
                className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white"
              >

                <option value="">
                  Select Tournament Format
                </option>

                <option value="Round Robin">
                  Round Robin
                </option>

                <option value="Single Elimination">
                  Single Elimination
                </option>

                <option value="Double Elimination">
                  Double Elimination
                </option>

                <option value="Round Robin - Single Elimination">
                  Round Robin - Single Elimination
                </option>

                <option value="Round Robin - Double Elimination">
                  Round Robin - Double Elimination
                </option>

                <option value="Group Stage + Knockout">
                  Group Stage + Knockout
                </option>

                <option value="Swiss System">
                  Swiss System
                </option>

              </select>

              <p className="text-gray-500 text-xs mt-2">
                Choose the official competition format.
                Fixture generation will follow this format.
              </p>

            </div>

            {/* ==================================================
                LEVEL
                ================================================== */}

            <div>

              <label className="block mb-2 font-semibold">
                Tournament Level
              </label>

              <select
                name="tournament_level"
                value={
                  form.tournament_level
                }
                onChange={handleChange}
                required
                className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white"
              >

                <option value="">
                  Select Level
                </option>

                <option value="Local">
                  Local
                </option>

                <option value="Regional">
                  Regional
                </option>

                <option value="National">
                  National
                </option>

                <option value="East Africa">
                  East Africa
                </option>

                <option value="Africa">
                  Africa
                </option>

                <option value="International">
                  International
                </option>

              </select>

            </div>

            {/* ==================================================
                PRIZE POOL
                ================================================== */}

            <div>

              <label className="block mb-2 font-semibold">
                Prize Pool
              </label>

              <input
                type="text"
                name="prize_pool"
                value={form.prize_pool}
                onChange={handleChange}
                placeholder="Example: KES 100,000"
                className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white"
              />

            </div>

            {/* ==================================================
                REGISTRATION FEE
                ================================================== */}

            <div>

              <label className="block mb-2 font-semibold">
                Registration Fee
              </label>

              <input
                type="text"
                name="registration_fee"
                value={
                  form.registration_fee
                }
                onChange={handleChange}
                placeholder="Example: KES 500"
                className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white"
              />

            </div>

            {/* ==================================================
                MAX PARTICIPANTS
                ================================================== */}

            <div>

              <label className="block mb-2 font-semibold">
                Maximum Participants
              </label>

              <input
                type="number"
                name="max_teams"
                value={form.max_teams}
                onChange={handleChange}
                min="1"
                placeholder="Example: 32"
                className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white"
              />

              <p className="text-gray-500 text-xs mt-1">
                Number of teams or players allowed
                to register.
              </p>

            </div>

          </div>

        </div>

        {/* ==================================================
            SCHEDULE
            ================================================== */}

        <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-8">

          <h2 className="text-xl font-bold mb-2">
            Tournament Schedule
          </h2>

          <p className="text-gray-400 text-sm mb-6">
            Set when registration opens, when it
            closes, and when the tournament takes
            place.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* ==================================================
                REGISTRATION OPENS
                ================================================== */}

            <div>

              <label className="block mb-2 font-semibold">
                Registration Opens
              </label>

              <input
                type="datetime-local"
                name="registration_start"
                value={
                  form.registration_start
                }
                onChange={handleChange}
                onClick={
                  openDateTimePicker
                }
                required
                step="60"
                className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white cursor-pointer"
              />

              <p className="text-gray-500 text-xs mt-1">
                When participants can begin
                registering.
              </p>

            </div>

            {/* ==================================================
                REGISTRATION CLOSES
                ================================================== */}

            <div>

              <label className="block mb-2 font-semibold">
                Registration Closes
              </label>

              <input
                type="datetime-local"
                name="registration_end"
                value={
                  form.registration_end
                }
                onChange={handleChange}
                onClick={
                  openDateTimePicker
                }
                required
                step="60"
                className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white cursor-pointer"
              />

              <p className="text-gray-500 text-xs mt-1">
                Final date and time for registration.
              </p>

            </div>

            {/* ==================================================
                TOURNAMENT START
                ================================================== */}

            <div>

              <label className="block mb-2 font-semibold">
                Tournament Start
              </label>

              <input
                type="datetime-local"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
                onClick={
                  openDateTimePicker
                }
                required
                step="60"
                className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white cursor-pointer"
              />

              <p className="text-gray-500 text-xs mt-1">
                When the tournament officially begins.
              </p>

            </div>

            {/* ==================================================
                TOURNAMENT END
                ================================================== */}

            <div>

              <label className="block mb-2 font-semibold">
                Tournament End
              </label>

              <input
                type="datetime-local"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
                onClick={
                  openDateTimePicker
                }
                required
                step="60"
                className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white cursor-pointer"
              />

              <p className="text-gray-500 text-xs mt-1">
                Expected tournament completion date
                and time.
              </p>

            </div>

          </div>

        </div>

        {/* ==================================================
            LOCATION
            ================================================== */}

        <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-8">

          <h2 className="text-xl font-bold mb-6">
            Location
          </h2>

          <label className="block mb-2 font-semibold">
            Tournament Location
          </label>

          <input
            type="text"
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="Example: Nairobi, Kenya or Online"
            className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white"
          />

        </div>

        {/* ==================================================
            DESCRIPTION AND RULES
            ================================================== */}

        <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-8">

          <h2 className="text-xl font-bold mb-6">
            Tournament Content
          </h2>

          {/* DESCRIPTION */}

          <div>

            <label className="block mb-2 font-semibold">
              Tournament Description
            </label>

            <textarea
              name="description"
              rows={6}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the tournament..."
              className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white"
            />

          </div>

          {/* RULES */}

          <div className="mt-8">

            <label className="block mb-2 font-semibold">
              Tournament Rules
            </label>

            <textarea
              name="rules"
              rows={8}
              value={form.rules}
              onChange={handleChange}
              placeholder="Enter tournament rules..."
              className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white"
            />

          </div>

          {/* STATUS */}

          <div className="mt-8">

            <label className="block mb-2 font-semibold">
              Tournament Status
            </label>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white"
            >

              <option value="Upcoming">
                Upcoming
              </option>

              <option value="Registration Open">
                Registration Open
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

            </select>

          </div>

        </div>

        {/* ==================================================
            ACTIONS
            ================================================== */}

        <div className="flex flex-wrap gap-4 pb-10">

          <button
            type="submit"
            disabled={loading}
            className="bg-[#D4AF37] text-black px-8 py-3 rounded-xl font-bold hover:bg-yellow-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? "Creating Tournament..."
              : "Create Tournament"}
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/tournaments"
              )
            }
            className="bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-xl font-semibold transition"
          >
            Cancel
          </button>

        </div>

      </form>

    </div>
  );
}