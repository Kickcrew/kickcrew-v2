"use client";

import ImageUpload from "@/components/admin/ImageUpload";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Team {
  id: number;
  team_name: string;
}

interface Game {
  id: number;
  game_name: string;
}

interface PlayerForm {
  profile_photo: string;
  full_name: string;
  gamer_tag: string;
  email: string;
  phone: string;
  team_id: string;
  game: string;
  role: string;
  rank: string;
  country: string;
  status: string;
  bio: string;
}

const TEAM_GAMES = [
  "Valorant",
  "Counter-Strike 2",
  "Call of Duty Mobile",
  "PUBG Mobile",
  "Mobile Legends",
  "League of Legends",
  "Dota 2",
];

export default function NewPlayerPage() {
  const router = useRouter();

  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<PlayerForm>({
    profile_photo: "",
    full_name: "",
    gamer_tag: "",
    email: "",
    phone: "",
    team_id: "",
    game: "",
    role: "",
    rank: "",
    country: "",
    status: "Active",
    bio: "",
  });


  useEffect(() => {
    async function loadData() {
      try {
        const teamResponse = await fetch("/api/teams");
        const teamResult = await teamResponse.json();

        if (teamResult.success) {
          setTeams(teamResult.teams);
        }


        const gameResponse = await fetch("/api/games");
        const gameResult = await gameResponse.json();

        if (gameResult.success) {
          setGames(gameResult.games);
        }

      } catch (error) {
        console.error(error);
      }
    }

    loadData();
  }, []);



  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLSelectElement |
      HTMLTextAreaElement
    >
  ) {

    const { name, value } = e.target;


    setForm((previous) => {

      const updated = {
        ...previous,
        [name]: value,
      };


      if (
        name === "game" &&
        !TEAM_GAMES.includes(value)
      ) {
        updated.team_id = "";
      }


      return updated;

    });

  }



  async function handleSubmit(
    e: React.FormEvent
  ) {

    e.preventDefault();

    setSaving(true);


    try {

      const response = await fetch(
        "/api/players",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );


      const result = await response.json();


      if (!result.success) {
        alert(result.message);
        setSaving(false);
        return;
      }


      alert("Player created successfully!");

      router.push("/admin/players");
      router.refresh();


    } catch(error){

      console.error(error);
      alert("Something went wrong.");

    }


    setSaving(false);

  }



  return (

    <div className="max-w-6xl mx-auto">


      <div className="mb-10">

        <h1 className="text-4xl font-bold text-white">
          New Player
        </h1>

        <p className="text-gray-400 mt-2">
          Register a new KICKCREW esports player.
        </p>

      </div>



      <form
        onSubmit={handleSubmit}
        className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-8 space-y-8"
      >


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


          <div>

            <label className="block mb-2 font-semibold">
              Player Photo
            </label>

            <ImageUpload
              value={form.profile_photo}
              onChange={(url)=>
                setForm(previous=>({
                  ...previous,
                  profile_photo:url
                }))
              }
            />

          </div>



          {[
            ["full_name","Full Name"],
            ["gamer_tag","Gamer Tag"],
            ["email","Email"],
            ["phone","Phone"],
            ["role","Role"],
            ["rank","Rank"],
            ["country","Country"],
          ].map(([name,label])=>(

            <div key={name}>

              <label className="block mb-2 font-semibold">
                {label}
              </label>

              <input
                name={name}
                value={(form as any)[name]}
                onChange={handleChange}
                className="w-full bg-black border border-gray-700 rounded-xl p-3"
              />

            </div>

          ))}



          {TEAM_GAMES.includes(form.game) && (

            <div>

              <label className="block mb-2 font-semibold">
                Team
              </label>

              <select
                name="team_id"
                value={form.team_id}
                onChange={handleChange}
                className="w-full bg-black border border-gray-700 rounded-xl p-3"
              >

                <option value="">
                  Select Team
                </option>


                {teams.map(team=>(

                  <option
                    key={team.id}
                    value={String(team.id)}
                  >
                    {team.team_name}
                  </option>

                ))}

              </select>

            </div>

          )}



          <div>

            <label className="block mb-2 font-semibold">
              Game
            </label>


            <select
              name="game"
              value={form.game}
              onChange={handleChange}
              className="w-full bg-black border border-gray-700 rounded-xl p-3"
            >

              <option value="">
                Select Game
              </option>


              {games.map(game=>(

                <option
                  key={game.id}
                  value={game.game_name}
                >
                  {game.game_name}
                </option>

              ))}

            </select>

          </div>



          <div>

            <label className="block mb-2 font-semibold">
              Status
            </label>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full bg-black border border-gray-700 rounded-xl p-3"
            >

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



        <div>

          <label className="block mb-2 font-semibold">
            Player Bio
          </label>


          <textarea
            name="bio"
            rows={5}
            value={form.bio}
            onChange={handleChange}
            className="w-full bg-black border border-gray-700 rounded-xl p-3"
          />

        </div>



        <div className="flex gap-4">


          <button
            type="submit"
            disabled={saving}
            className="bg-[#D4AF37] text-black px-8 py-3 rounded-xl font-bold hover:bg-yellow-400 disabled:opacity-50"
          >

            {saving
              ? "Saving Player..."
              : "Save Player"}

          </button>



          <button
            type="button"
            onClick={()=>router.push("/admin/players")}
            className="bg-gray-700 px-8 py-3 rounded-xl"
          >
            Cancel
          </button>


        </div>


      </form>


    </div>

  );
}