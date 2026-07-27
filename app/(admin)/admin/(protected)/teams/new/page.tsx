"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewTeamPage() {
  const router = useRouter();

  const [teamName, setTeamName] = useState("");
  const [division, setDivision] = useState("");
  const [captain, setCaptain] = useState("");
  const [coach, setCoach] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    const response = await fetch("/api/teams", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        team_name: teamName,
        division,
        captain,
        coach,
        description,
      }),
    });

    const result = await response.json();

    setLoading(false);

    if (!result.success) {
      alert(result.message);
      return;
    }

    alert("Team created successfully!");

    router.push("/admin/teams");
    router.refresh();
  }

  return (
    <div className="max-w-5xl">

      <h1 className="text-4xl font-bold">
        Create New Team
      </h1>

      <p className="text-gray-400 mt-2">
        Add a new competitive esports team.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-10 space-y-8"
      >

        <div>
          <label className="block mb-2 font-semibold">
            Team Name
          </label>

          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="EA SPORTS FC"
            className="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl p-4"
            required
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">
            Division
          </label>

          <select
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl p-4"
            required
          >
            <option value="">Select Division</option>
            <option>EA SPORTS FC</option>
            <option>Valorant</option>
            <option>PUBG Mobile</option>
            <option>Call of Duty Mobile</option>
            <option>League of Legends</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 font-semibold">
            Captain
          </label>

          <input
            type="text"
            value={captain}
            onChange={(e) => setCaptain(e.target.value)}
            placeholder="Captain Name"
            className="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl p-4"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">
            Coach
          </label>

          <input
            type="text"
            value={coach}
            onChange={(e) => setCoach(e.target.value)}
            placeholder="Coach Name"
            className="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl p-4"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">
            Team Description
          </label>

          <textarea
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the team..."
            className="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl p-4"
          />
        </div>

        <div className="flex gap-4">

          <button
            type="submit"
            disabled={loading}
            className="bg-[#D4AF37] text-black px-8 py-4 rounded-xl font-bold hover:bg-yellow-400 transition disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Team"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/admin/teams")}
            className="border border-gray-700 px-8 py-4 rounded-xl hover:border-white transition"
          >
            Cancel
          </button>

        </div>

      </form>

    </div>
  );
}