"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Applicant {
  id: number;
  status: string;
}

interface Player {
  id: number;
  full_name: string;
  gamer_tag: string;
  email: string;
  phone: string;
  team_id: string;
  game: string | null;
  role: string | null;
  rank: string | null;
  country: string | null;
  status: string | null;
  bio: string | null;
  profile_photo: string | null;

  teams?: {
    team_name: string;
  };

  applicant_id: number | null;

  applicants?: {
    id: number;
    status: string;
  } | null;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
const [loading, setLoading] = useState(true);

const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("All");
const [gameFilter, setGameFilter] = useState("All");
const [teamFilter, setTeamFilter] = useState("All");
  const totalPlayers = players.length;

const activePlayers = players.filter(
  (player) => player.status === "Active"
).length;
const teamPlayers = players.filter(
  (player) => player.teams?.team_name
).length;

const individualPlayers = players.filter(
  (player) => !player.teams?.team_name
).length;

const countries = new Set(
  players
    .filter((player) => player.country)
    .map((player) => player.country)
);

const totalCountries = countries.size;

const totalTeams = new Set(
  players.map((player) => player.team_id)
).size;

const totalGames = new Set(
  players
    .map((player) => player.game)
    .filter(Boolean)
).size;
const filteredPlayers = players.filter((player) => {
  const searchTerm = search.toLowerCase();

  const matchesSearch =
    player.full_name.toLowerCase().includes(searchTerm) ||
    player.gamer_tag.toLowerCase().includes(searchTerm) ||
    player.email.toLowerCase().includes(searchTerm);

  const matchesStatus =
  statusFilter === "All" ||
  player.status === statusFilter;

const matchesGame =
  gameFilter === "All" ||
  player.game === gameFilter;

const matchesTeam =
  teamFilter === "All" ||
  player.teams?.team_name === teamFilter;

return (
  matchesSearch &&
  matchesStatus &&
  matchesGame &&
  matchesTeam
);
});

  async function loadPlayers() {
    try {
      const response = await fetch("/api/players");
      const result = await response.json();

      console.log(JSON.stringify(result, null, 2));

      if (result.success) {
        setPlayers(result.players);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function deletePlayer(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this player?"
    );

    if (!confirmed) return;

    const response = await fetch(`/api/players/${id}`, {
      method: "DELETE",
    });

   const result = await response.json();

console.log("PLAYERS RESPONSE:", result);

    if (!result.success) {
      alert(result.message);
      return;
    }

    setPlayers((previous) =>
      previous.filter((player) => player.id !== id)
    );

    alert("Player deleted successfully.");
  }

  useEffect(() => {
    loadPlayers();
  }, []);

  return (
    <div className="space-y-8">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-4xl font-bold text-white">
            Players
          </h1>

          <p className="text-gray-400 mt-2">
            Manage KICKCREW esports players.
          </p>
        </div>

        <Link
          href="/admin/players/new"
          className="bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition"
        >
          + New Player
        </Link>

      </div>

      {/* Table */}
      {/* Dashboard Cards */}

<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

  {/* Total Players */}

  <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6">

    <p className="text-gray-400 text-sm">
      Total Players
    </p>

    <h2 className="text-4xl font-bold mt-2 text-[#D4AF37]">
      {totalPlayers}
    </h2>

  </div>

  {/* Active Players */}

  <div className="bg-[#111111] border border-green-500/20 rounded-2xl p-6">

    <p className="text-gray-400 text-sm">
      Active Players
    </p>

    <h2 className="text-4xl font-bold mt-2 text-green-400">
      {activePlayers}
    </h2>

  </div>

  {/* Team Players */}

  <div className="bg-[#111111] border border-blue-500/20 rounded-2xl p-6">

    <p className="text-gray-400 text-sm">
      Team Players
    </p>

    <h2 className="text-4xl font-bold mt-2 text-blue-400">
      {teamPlayers}
    </h2>

  </div>

  {/* Solo Player */}

  <div className="bg-[#111111] border border-purple-500/20 rounded-2xl p-6">

    <p className="text-gray-400 text-sm">
      Solo Player
    </p>

    <h2 className="text-4xl font-bold mt-2 text-purple-400">
      {individualPlayers}
    </h2>

  </div>

</div>

{/* Search & Filters */}

<div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-5 space-y-4">

  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

    {/* Search */}

    <div className="md:col-span-3">

      <input
        type="text"
        placeholder="🔍 Search by Gamer Tag, Name or Email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-black border border-gray-700 rounded-xl p-4 focus:border-[#D4AF37] outline-none"
      />

    </div>

    {/* Filters */}

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* Game */}

      <select
        value={gameFilter}
        onChange={(e) => setGameFilter(e.target.value)}
        className="bg-black border border-gray-700 rounded-xl p-4 focus:border-[#D4AF37] outline-none"
      >
        <option value="All">All Games</option>

        {[...new Set(
          players
            .map((player) => player.game)
            .filter(Boolean)
        )].map((game) => (
          <option key={game} value={game!}>
            {game}
          </option>
        ))}

      </select>

      {/* Team */}

      <select
        value={teamFilter}
        onChange={(e) => setTeamFilter(e.target.value)}
        className="bg-black border border-gray-700 rounded-xl p-4 focus:border-[#D4AF37] outline-none"
      >
        <option value="All">All Teams</option>

        {[...new Set(
          players
            .map((player) => player.teams?.team_name)
            .filter(Boolean)
        )].map((team) => (
          <option key={team} value={team!}>
            {team}
          </option>
        ))}

      </select>

      {/* Status */}

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="bg-black border border-gray-700 rounded-xl p-4 focus:border-[#D4AF37] outline-none"
      >
        <option value="All">All Status</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
        <option value="Suspended">Suspended</option>
      </select>

    </div>

  </div>

  <div className="flex justify-between items-center">

    <p className="text-gray-400 text-sm">
      Showing {filteredPlayers.length} of {players.length} players
    </p>

  </div>

</div>

<div className="overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-[#111111]">

  <table className="w-full">

    <thead className="bg-black">

      <tr className="text-left">

       <th className="p-5">Photo</th>
<th>Gamer Tag</th>
<th>Full Name</th>
<th>Team</th>
<th>Game</th>
<th>Application</th>
<th>Country</th>
<th>Role</th>
<th>Rank</th>
<th>Status</th>
<th className="pr-5">Actions</th>

      </tr>

    </thead>
    <tbody>

  {loading && (

    <tr>

      <td
        colSpan={11}
        className="text-center py-10 text-gray-400"
      >
        Loading players...
      </td>

    </tr>

  )}

  {!loading && filteredPlayers.length === 0 && (

    <tr>

      <td
        colSpan={11}
        className="text-center py-10 text-gray-400"
      >
        No players found.
      </td>

    </tr>

  )}

  {!loading &&
    filteredPlayers.map((player) => (

      <tr
        key={player.id}
        className="border-t border-[#222] hover:bg-[#181818] transition"
      >

        {/* Photo */}

        <td className="p-5">

          <img
            src={
              player.profile_photo ||
              "https://placehold.co/60x60?text=Player"
            }
            alt={player.gamer_tag}
            className="w-14 h-14 rounded-full object-cover border border-[#D4AF37]/30"
          />

        </td>

        {/* Gamer Tag */}

        <td className="font-semibold text-[#D4AF37]">
          {player.gamer_tag}
        </td>

        {/* Full Name */}

        <td>{player.full_name}</td>

        {/* Team */}

        <td>

          {player.teams?.team_name ? (

            <span className="text-white">
              {player.teams.team_name}
            </span>

          ) : (

            <span className="text-blue-400 font-medium">
  Solo Player
</span>

          )}

        </td>

        {/* Game */}

        <td>

          {player.game ? (

            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                player.game === "Valorant"
                  ? "bg-red-600 text-white"
                  : player.game === "Counter-Strike 2"
                  ? "bg-orange-600 text-white"
                  : player.game === "Call of Duty Mobile"
                  ? "bg-green-600 text-white"
                  : player.game === "PUBG Mobile"
                  ? "bg-yellow-600 text-black"
                  : player.game === "Mobile Legends"
                  ? "bg-blue-600 text-white"
                  : player.game === "League of Legends"
                  ? "bg-cyan-600 text-white"
                  : player.game === "Dota 2"
                  ? "bg-rose-700 text-white"
                  : player.game === "EA SPORTS FC 26"
                  ? "bg-emerald-600 text-white"
                  : player.game === "eFootball"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-700 text-white"
              }`}
            >
              {player.game}
            </span>

          ) : (

            "-"

          )}

        </td>
        {/* Application */}

<td>

  {player.applicant_id ? (

    <div className="flex flex-col gap-1">

      <span className="text-blue-400 font-semibold">
        Applicant #{player.applicant_id}
      </span>

      {player.applicants?.status && (
        <span className="text-green-400 text-xs">
          {player.applicants.status}
        </span>
      )}

    </div>

  ) : (

    <span className="text-gray-500 text-sm">
      Manually Added
    </span>

  )}

</td>

        {/* Country */}

        <td>
          {player.country && player.country !== "null"
            ? player.country
            : "-"}
        </td>

        {/* Role */}

        <td>
          {player.role && player.role !== "null"
            ? player.role
            : "-"}
        </td>

        {/* Rank */}

        <td>
          {player.rank && player.rank !== "null"
            ? player.rank
            : "-"}
        </td>

        {/* Status */}

        <td>

          <span
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
              player.status === "Active"
                ? "bg-green-600/20 text-green-400 border border-green-500"
                : player.status === "Inactive"
                ? "bg-gray-700/20 text-gray-300 border border-gray-500"
                : "bg-yellow-600/20 text-yellow-400 border border-yellow-500"
            }`}
          >
            {player.status === "Active"
              ? "🟢 Active"
              : player.status === "Inactive"
              ? "⚪ Inactive"
              : "🟠 Suspended"}
          </span>

        </td>

        {/* Actions */}

<td className="pr-5">

  <div className="flex gap-2">

    <Link
      href={`/admin/players/${player.id}/view`}
      className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-sm font-semibold transition"
    >
      View
    </Link>

    <Link
      href={`/admin/players/${player.id}`}
      className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-semibold transition"
    >
      Edit
    </Link>

    <button
      onClick={() => deletePlayer(player.id)}
      className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg text-sm font-semibold transition"
    >
      Delete
    </button>

  </div>

</td>

</tr>

))}

</tbody>

</table>

</div>

</div>

);
}