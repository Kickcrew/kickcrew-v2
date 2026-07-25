"use client";

import { useState } from "react";

export default function ApplicationForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const response = await fetch("/api/applications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      setSubmitted(true);
      form.reset();
    } else {
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <section className="bg-[#111111] py-24">

      <div className="max-w-4xl mx-auto px-6">

        <div className="text-center">

          <p className="uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
            Application Form
          </p>

          <h2 className="text-5xl font-bold mt-4">
            Start Your Journey
          </h2>

          <p className="mt-6 text-gray-400">
            Complete the form below and our recruitment team will review your application.
          </p>

        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-16 space-y-6"
        >

          <div className="grid md:grid-cols-2 gap-6">

            <input
              name="fullName"
              type="text"
              placeholder="Full Name"
              required
              className="bg-black border border-gray-700 rounded-xl p-4 focus:border-[#D4AF37] outline-none"
            />

            <input
              name="email"
              type="email"
              placeholder="Email Address"
              required
              className="bg-black border border-gray-700 rounded-xl p-4 focus:border-[#D4AF37] outline-none"
            />

          </div>

          <div className="grid md:grid-cols-2 gap-6">

            <input
              name="phone"
              type="tel"
              placeholder="Phone Number"
              required
              className="bg-black border border-gray-700 rounded-xl p-4 focus:border-[#D4AF37] outline-none"
            />

            <input
              name="country"
              type="text"
              placeholder="Country"
              required
              className="bg-black border border-gray-700 rounded-xl p-4 focus:border-[#D4AF37] outline-none"
            />

          </div>

          <div className="grid md:grid-cols-2 gap-6">

            <select
              name="division"
              required
              className="bg-black border border-gray-700 rounded-xl p-4"
            >
              <option value="">Select Division</option>
              <option>EA SPORTS FC</option>
              <option>Valorant</option>
              <option>PUBG Mobile</option>
            </select>

            <input
              name="ign"
              type="text"
              placeholder="In-Game Name (IGN)"
              required
              className="bg-black border border-gray-700 rounded-xl p-4 focus:border-[#D4AF37] outline-none"
            />

          </div>

          <div className="grid md:grid-cols-2 gap-6">

            <input
              name="rank"
              type="text"
              placeholder="Current Rank"
              className="bg-black border border-gray-700 rounded-xl p-4 focus:border-[#D4AF37] outline-none"
            />

            <select
              name="platform"
              required
              className="bg-black border border-gray-700 rounded-xl p-4"
            >
              <option value="">Gaming Platform</option>
              <option>PC</option>
              <option>PlayStation</option>
              <option>Xbox</option>
              <option>Mobile</option>
            </select>

          </div>

          <textarea
            name="about"
            rows={5}
            placeholder="Tell us about yourself..."
            className="w-full bg-black border border-gray-700 rounded-xl p-4 focus:border-[#D4AF37] outline-none"
          />

          <textarea
            name="motivation"
            rows={5}
            placeholder="Why do you want to join KICKCREW?"
            className="w-full bg-black border border-gray-700 rounded-xl p-4 focus:border-[#D4AF37] outline-none"
          />

          <button
            type="submit"
            className="w-full bg-[#D4AF37] text-black py-4 rounded-xl font-bold hover:bg-yellow-400 transition"
          >
            Submit Application
          </button>

          {submitted && (

            <div className="mt-6 rounded-xl border border-green-600 bg-green-900/20 p-6 text-center">

              <h3 className="text-2xl font-bold text-green-400">
                ✅ Application Received!
              </h3>

              <p className="mt-3 text-gray-300">
                Thank you for applying to KICKCREW Esports.
                Our recruitment team will review your application and contact you if you are shortlisted.
              </p>

            </div>

          )}

        </form>

      </div>

    </section>
  );
}