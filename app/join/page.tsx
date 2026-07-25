"use client";

import { useState } from "react";

export default function JoinPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="bg-black text-white">

      {/* ================= HERO ================= */}

      <section className="relative h-[60vh] flex items-center justify-center">

        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/hero-bg.png')",
          }}
        />

        <div className="absolute inset-0 bg-black/80" />

        <div className="relative z-10 text-center max-w-4xl px-6">

          <p className="uppercase tracking-[0.35em] text-[#D4AF37] font-semibold">
            Recruitment
          </p>

          <h1 className="text-6xl md:text-7xl font-bold mt-6">
            Join
            <span className="text-[#D4AF37]"> KICKCREW</span>
          </h1>

          <p className="mt-8 text-xl text-gray-300 leading-8">
            Ready to compete, learn and grow with one of Kenya's emerging
            esports organizations? Start your journey with KICKCREW today.
          </p>

        </div>

      </section>

      {/* ================= WHY JOIN ================= */}

      <section className="py-24 bg-[#111111]">

        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center">

            <p className="uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
              Why Join KICKCREW
            </p>

            <h2 className="text-5xl font-bold mt-4">
              More Than Just a Gaming Team
            </h2>

            <p className="mt-6 max-w-3xl mx-auto text-gray-400 leading-8">
              KICKCREW is building an esports community where players can
              compete, improve their skills, make new friends, and discover
              opportunities within the gaming industry.
            </p>

          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">

            <div className="bg-black p-8 rounded-2xl border border-[#D4AF37]/20">

              <h3 className="text-2xl font-bold text-[#D4AF37]">
                🏆 Compete
              </h3>

              <p className="mt-4 text-gray-400">
                Represent KICKCREW in local and regional esports tournaments.
              </p>

            </div>

            <div className="bg-black p-8 rounded-2xl border border-[#D4AF37]/20">

              <h3 className="text-2xl font-bold text-[#D4AF37]">
                📈 Develop
              </h3>

              <p className="mt-4 text-gray-400">
                Improve your gameplay through teamwork, practice and experience.
              </p>

            </div>

            <div className="bg-black p-8 rounded-2xl border border-[#D4AF37]/20">

              <h3 className="text-2xl font-bold text-[#D4AF37]">
                🤝 Community
              </h3>

              <p className="mt-4 text-gray-400">
                Meet passionate gamers and become part of Kenya's growing esports
                community.
              </p>

            </div>

            <div className="bg-black p-8 rounded-2xl border border-[#D4AF37]/20">

              <h3 className="text-2xl font-bold text-[#D4AF37]">
                🌍 Grow
              </h3>

              <p className="mt-4 text-gray-400">
                Build opportunities in competitive gaming, content creation and
                esports leadership.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* ================= RECRUITMENT PROCESS ================= */}

      <section className="bg-black py-24">

        <div className="max-w-6xl mx-auto px-6">

          <div className="text-center">

            <p className="uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
              Recruitment Process
            </p>

            <h2 className="text-5xl font-bold mt-4">
              Your Journey Starts Here
            </h2>

            <p className="mt-6 text-gray-400 max-w-3xl mx-auto">
              Every application is carefully reviewed to ensure we build a
              competitive, supportive and passionate esports community.
            </p>

          </div>

          <div className="grid md:grid-cols-5 gap-8 mt-16">

            {[
              {
                step: "01",
                title: "Apply",
                description: "Submit your application online.",
              },
              {
                step: "02",
                title: "Review",
                description: "Our team reviews your application.",
              },
              {
                step: "03",
                title: "Trial",
                description: "Attend an interview or gameplay trial.",
              },
              {
                step: "04",
                title: "Selection",
                description: "Successful applicants receive an offer.",
              },
              {
                step: "05",
                title: "Welcome",
                description: "Become an official member of KICKCREW.",
              },
            ].map((item) => (              <div
                key={item.step}
                className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-8 text-center"
              >

                <div className="text-5xl font-black text-[#D4AF37]">
                  {item.step}
                </div>

                <h3 className="text-2xl font-bold mt-6">
                  {item.title}
                </h3>

                <p className="mt-4 text-gray-400 leading-7">
                  {item.description}
                </p>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* ================= APPLICATION FORM ================= */}

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
              Complete the form below and our recruitment team will contact you.
            </p>

          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-16 space-y-6"
          >

            <div className="grid md:grid-cols-2 gap-6">

              <input
                type="text"
                placeholder="Full Name"
                required
                className="bg-black border border-gray-700 rounded-xl p-4 focus:border-[#D4AF37] outline-none"
              />

              <input
                type="email"
                placeholder="Email Address"
                required
                className="bg-black border border-gray-700 rounded-xl p-4 focus:border-[#D4AF37] outline-none"
              />

            </div>

            <div className="grid md:grid-cols-2 gap-6">

              <input
                type="tel"
                placeholder="Phone Number"
                required
                className="bg-black border border-gray-700 rounded-xl p-4 focus:border-[#D4AF37] outline-none"
              />

              <input
                type="text"
                placeholder="Country"
                required
                className="bg-black border border-gray-700 rounded-xl p-4 focus:border-[#D4AF37] outline-none"
              />

            </div>

            <div className="grid md:grid-cols-2 gap-6">

              <select
                required
                className="bg-black border border-gray-700 rounded-xl p-4"
              >
                <option value="">Select Division</option>
                <option>EA SPORTS FC</option>
                <option>Valorant</option>
                <option>PUBG Mobile</option>
              </select>

              <input
                type="text"
                placeholder="In-Game Name (IGN)"
                required
                className="bg-black border border-gray-700 rounded-xl p-4 focus:border-[#D4AF37] outline-none"
              />

            </div>

            <div className="grid md:grid-cols-2 gap-6">

              <input
                type="text"
                placeholder="Current Rank"
                className="bg-black border border-gray-700 rounded-xl p-4 focus:border-[#D4AF37] outline-none"
              />

              <select
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
              rows={5}
              placeholder="Tell us about yourself..."
              className="w-full bg-black border border-gray-700 rounded-xl p-4 focus:border-[#D4AF37] outline-none"
            />

            <textarea
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
                  Our recruitment team will review your application and contact
                  you if you are shortlisted.
                </p>

              </div>

            )}

          </form>

        </div>

      </section>

    </main>
  );
}