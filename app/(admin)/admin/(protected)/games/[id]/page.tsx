"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditGamePage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    game_name: "",
    category: "",
    active: true,
  });

  useEffect(() => {
    async function loadGame() {
      try {
        const response = await fetch(`/api/games/${id}`);
        const result = await response.json();

        if (result.success) {
          setForm(result.game);
        }
      } catch (error) {
        console.error(error);
      }

      setLoading(false);
    }

    loadGame();
  }, [id]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    if (name === "active") {
      setForm((previous) => ({
        ...previous,
        active: value === "true",
      }));
      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);

    try {
      const response = await fetch(`/api/games/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.message);
        setSaving(false);
        return;
      }

      alert("Game updated successfully!");

      router.push("/admin/games");
      router.refresh();

    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }

    setSaving(false);
  }

  if (loading) {
    return <div>Loading game...</div>;
  }  return (
    <div className="max-w-3xl mx-auto">

      <div className="mb-10">

        <h1 className="text-4xl font-bold">
          Edit Game
        </h1>

        <p className="text-gray-400 mt-2">
          Update a supported esports title.
        </p>

      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-8 space-y-6"
      >

        <div>

          <label className="block mb-2 font-semibold">
            Game Name
          </label>

          <input
            type="text"
            name="game_name"
            value={form.game_name}
            onChange={handleChange}
            required
            className="w-full bg-black border border-gray-700 rounded-xl p-3 focus:border-[#D4AF37] outline-none"
          />

        </div>

        <div>

          <label className="block mb-2 font-semibold">
            Category
          </label>

          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            required
            className="w-full bg-black border border-gray-700 rounded-xl p-3 focus:border-[#D4AF37] outline-none"
          >

            <option value="">Select Category</option>
            <option value="PC">PC</option>
            <option value="Console">Console</option>
            <option value="Mobile">Mobile</option>
            <option value="Fighting">Fighting</option>

          </select>

        </div>

        <div>

          <label className="block mb-2 font-semibold">
            Status
          </label>

          <select
            name="active"
            value={String(form.active)}
            onChange={handleChange}
            className="w-full bg-black border border-gray-700 rounded-xl p-3 focus:border-[#D4AF37] outline-none"
          >

            <option value="true">
              Active
            </option>

            <option value="false">
              Inactive
            </option>

          </select>

        </div>

        <div className="flex gap-4">

          <button
            type="submit"
            disabled={saving}
            className="bg-[#D4AF37] text-black px-8 py-3 rounded-xl font-bold hover:bg-yellow-400 transition disabled:opacity-60"
          >
            {saving ? "Updating..." : "Update Game"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/admin/games")}
            className="bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-xl font-semibold transition"
          >
            Cancel
          </button>

        </div>

      </form>

    </div>
  );
}