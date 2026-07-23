export default function EFootballPage() {
  return (
    <main className="bg-black text-white">

      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center text-center">

        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/tournament-bg.png')",
          }}
        />

        <div className="absolute inset-0 bg-black/70" />

        <div className="relative z-10 max-w-4xl px-6">

          <p className="uppercase tracking-[0.35em] text-[#D4AF37] font-semibold">
  KICKCREW EA SPORTS FC Division
</p>

<h1 className="text-6xl md:text-7xl font-bold mt-6">
  Where the
  <span className="text-[#D4AF37]"> Journey Began</span>
</h1>

<p className="mt-8 text-xl text-gray-300 leading-8">
  KICKCREW Esports was born from our passion for Konami eFootball Mobile.
  What started as a small group of friends competing together has grown
  into a vision of building one of Kenya's leading esports organizations,
  creating opportunities for players and gaming communities across Africa.
</p>
        </div>

      </section>
            {/* Our Story */}

      <section className="bg-[#111111] py-24">

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">

          {/* Left Side */}

          <div>

            <p className="uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
              Our Story
            </p>

            <h2 className="text-5xl font-bold mt-4">
              Where KICKCREW Began
            </h2>

            <p className="mt-8 text-gray-300 leading-8">
              KICKCREW Esports was founded through a shared passion for
              competitive eFootball. Before becoming an esports organization,
              we were simply friends enjoying football gaming and creating
              memorable competitions together.
            </p>

            <p className="mt-6 text-gray-300 leading-8">
              As our community continued to grow, we realized that esports
              could become something much bigger. That vision inspired us to
              build KICKCREW — an organization dedicated to developing players,
              hosting tournaments, and creating opportunities for gamers
              throughout Kenya and Africa.
            </p>

          </div>

          {/* Right Side */}

          <div className="bg-black rounded-2xl border border-[#D4AF37]/20 p-10">

            <h3 className="text-3xl font-bold text-[#D4AF37]">
              Our Mission
            </h3>

            <ul className="mt-8 space-y-5 text-gray-300">

              <li>⚽ Build Kenya's strongest eFootball community.</li>

              <li>🏆 Organize professional tournaments.</li>

              <li>🎮 Develop competitive players.</li>

              <li>🤝 Connect gamers through community events.</li>

              <li>🌍 Grow into one of Africa's leading esports organizations.</li>

            </ul>

          </div>

        </div>

      </section>

    </main>
  );
}