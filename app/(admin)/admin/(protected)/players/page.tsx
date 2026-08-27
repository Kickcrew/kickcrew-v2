"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Player } from "@/lib/types/player";

interface PlayerListItem extends Player {
  teams?: {
    team_name: string;
  } | null;

  applicants?: {
    id: number;
    status: string;
  } | null;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<PlayerListItem[]>([]);
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

  const totalCountries = new Set(
    players
      .filter((player) => player.country)
      .map((player) => player.country)
  ).size;

  const totalTeams = new Set(
    players
      .map((player) => player.team_id)
      .filter(Boolean)
  ).size;

  const totalGames = new Set(
    players
      .map((player) => player.game)
      .filter(Boolean)
  ).size;


  const filteredPlayers = players.filter((player) => {
    const searchTerm = search.toLowerCase();

    const matchesSearch =
      player.full_name?.toLowerCase().includes(searchTerm) ||
      player.gamer_tag?.toLowerCase().includes(searchTerm) ||
      player.email?.toLowerCase().includes(searchTerm);

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


    const response = await fetch(
      `/api/players/${id}`,
      {
        method: "DELETE",
      }
    );


    const result = await response.json();


    if (!result.success) {
      alert(result.message);
      return;
    }


    setPlayers((previous) =>
      previous.filter(
        (player) => player.id !== id
      )
    );


    alert("Player deleted successfully.");
  }


  useEffect(() => {
    loadPlayers();
  }, []);



  return (
    <div className="space-y-8">


      <div className="flex justify-between items-center">

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
          className="bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-bold"
        >
          + New Player
        </Link>

      </div>



      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        {[
          ["Total Players", totalPlayers],
          ["Active Players", activePlayers],
          ["Team Players", teamPlayers],
          ["Solo Players", individualPlayers],
        ].map(([label, value]) => (

          <div
            key={String(label)}
            className="bg-[#111] border border-[#D4AF37]/20 rounded-2xl p-6"
          >

            <p className="text-gray-400 text-sm">
              {label}
            </p>

            <h2 className="text-4xl font-bold mt-2 text-[#D4AF37]">
              {value}
            </h2>

          </div>

        ))}

      </div>



      <div className="bg-[#111] border border-[#D4AF37]/20 rounded-2xl p-5">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">


          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            className="bg-black border border-gray-700 rounded-xl p-4"
          />


          <select
            value={gameFilter}
            onChange={(e)=>setGameFilter(e.target.value)}
            className="bg-black border border-gray-700 rounded-xl p-4"
          >

            <option value="All">
              All Games
            </option>

            {[...new Set(
              players
                .map(p=>p.game)
                .filter(Boolean)
            )].map(game=>(
              <option key={game} value={game!}>
                {game}
              </option>
            ))}

          </select>



          <select
            value={teamFilter}
            onChange={(e)=>setTeamFilter(e.target.value)}
            className="bg-black border border-gray-700 rounded-xl p-4"
          >

            <option value="All">
              All Teams
            </option>


            {[...new Set(
              players
                .map(p=>p.teams?.team_name)
                .filter(Boolean)
            )].map(team=>(
              <option key={team} value={team!}>
                {team}
              </option>
            ))}

          </select>



          <select
            value={statusFilter}
            onChange={(e)=>setStatusFilter(e.target.value)}
            className="bg-black border border-gray-700 rounded-xl p-4"
          >

            <option value="All">
              All Status
            </option>

            <option value="Active">
              Active
            </option>

            <option value="Inactive">
              Inactive
            </option>

            <option value="Suspended">
              Suspended
            </option>

          </select>


        </div>

      </div>




      <div className="overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-[#111]">

        <table className="w-full">

          <thead className="bg-black">

            <tr className="text-left">

              <th className="p-5">Player</th>
              <th>Gamer Tag</th>
              <th>Team</th>
              <th>Game</th>
              <th>Status</th>
              <th>Actions</th>

            </tr>

          </thead>


          <tbody>


          {!loading &&
            filteredPlayers.map(player=>(

              <tr
                key={player.id}
                className="border-t border-[#222]"
              >

                <td className="p-5 flex items-center gap-4">

                  <img
                    src={
                      player.profile_photo ||
                      "https://placehold.co/60x60"
                    }
                    className="w-14 h-14 rounded-full"
                    alt=""
                  />

                  <div>
                    <div className="font-bold text-white">
                      {player.full_name}
                    </div>

                    <div className="text-gray-400">
                      {player.email}
                    </div>
                  </div>

                </td>


                <td className="text-[#D4AF37] font-semibold">
                  {player.gamer_tag}
                </td>


                <td>
                  {
                    player.teams?.team_name ??
                    "Solo Player"
                  }
                </td>


                <td>
                  {player.game ?? "-"}
                </td>


                <td>
                  {player.status ?? "-"}
                </td>


                <td>

                  <div className="flex gap-2">

                    <Link
                      href={`/admin/players/${player.id}/view`}
                      className="bg-green-600 px-3 py-2 rounded"
                    >
                      View
                    </Link>


                    <Link
                      href={`/admin/players/${player.id}`}
                      className="bg-blue-600 px-3 py-2 rounded"
                    >
                      Edit
                    </Link>


                    <button
                      onClick={()=>deletePlayer(player.id)}
                      className="bg-red-600 px-3 py-2 rounded"
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