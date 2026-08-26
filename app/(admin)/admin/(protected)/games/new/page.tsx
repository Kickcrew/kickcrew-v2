"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewGamePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    game_name: "",
    category: "",
    active: true,
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.message);
        setLoading(false);
        return;
      }

      alert("Game created successfully!");

      router.push("/admin/games");
      router.refresh();

    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }

    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto">

      <div className="mb-10">
        <h1 className="text-4xl font-bold">
          New Game
        </h1>

        <p className="text-gray-400 mt-2">
          Add a supported esports title.
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

        <button
          type="submit"
          disabled={loading}
          className="bg-[#D4AF37] text-black px-8 py-3 rounded-xl font-bold hover:bg-yellow-400 transition"
        >
          {loading ? "Saving..." : "Save Game"}
        </button>

      </form>

    </div>
  );
}