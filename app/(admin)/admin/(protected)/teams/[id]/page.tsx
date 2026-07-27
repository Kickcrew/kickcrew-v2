"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditTeamPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id;

  const [teamName, setTeamName] = useState("");
  const [division, setDivision] = useState("");
  const [captain, setCaptain] = useState("");
  const [coach, setCoach] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadTeam() {
      const response = await fetch(`/api/teams/${id}`);
      const result = await response.json();

      if (result.success) {
        const team = result.team;

        setTeamName(team.team_name);
        setDivision(team.division);
        setCaptain(team.captain || "");
        setCoach(team.coach || "");
        setDescription(team.description || "");
      }

      setLoading(false);
    }

    loadTeam();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);

    const response = await fetch(`/api/teams/${id}`, {
      method: "PUT",
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

    setSaving(false);

    if (!result.success) {
      alert(result.message);
      return;
    }

    alert("Team updated successfully!");

    router.push("/admin/teams");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="text-xl">
        Loading team...
      </div>
    );
  }

  return (
    <div className="max-w-5xl">

      <h1 className="text-4xl font-bold">
        Edit Team
      </h1>

      <form
        onSubmit={handleSubmit}
        className="mt-10 space-y-8"
      >

        <input
          value={teamName}
          onChange={(e)=>setTeamName(e.target.value)}
          className="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl p-4"
        />

        <input
          value={division}
          onChange={(e)=>setDivision(e.target.value)}
          className="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl p-4"
        />

        <input
          value={captain}
          onChange={(e)=>setCaptain(e.target.value)}
          className="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl p-4"
        />

        <input
          value={coach}
          onChange={(e)=>setCoach(e.target.value)}
          className="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl p-4"
        />

        <textarea
          rows={6}
          value={description}
          onChange={(e)=>setDescription(e.target.value)}
          className="w-full bg-[#111111] border border-[#D4AF37]/20 rounded-xl p-4"
        />

        <button
          disabled={saving}
          className="bg-[#D4AF37] text-black px-8 py-4 rounded-xl font-bold"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

      </form>

    </div>
  );
}