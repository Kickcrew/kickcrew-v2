export default function About() {
  return (
    <section
      id="about"
      className="bg-black text-white py-24"
    >
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">

        {/* Left Side */}
        <div>

          <p className="uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
            About KICKCREW
          </p>

          <h2 className="text-5xl font-bold mt-4 leading-tight">
            Building Africa's Future Through Esports
          </h2>

          <p className="mt-8 text-gray-300 leading-8">
            KICKCREW Esports is more than a competitive gaming organization.
            We are building an ecosystem where players, creators, tournament
            organizers, and gaming communities can grow together.
          </p>

          <p className="mt-6 text-gray-300 leading-8">
            Through professional tournaments, player development,
            coaching, education, partnerships, and content creation,
            we are creating opportunities that inspire the next
            generation of African esports talent.
          </p>
          <div className="mt-10">
  <button className="bg-[#D4AF37] text-black font-semibold px-6 py-3 rounded-lg hover:bg-yellow-500 transition duration-300">
    Learn More About Us
  </button>
</div>

        </div>

        {/* Right Side */}
        <div className="grid grid-cols-2 gap-6">

          <div className="bg-[#111111] rounded-xl p-6 border border-[#D4AF37]/20">
            <h3 className="text-[#D4AF37] text-xl font-bold">
              🎮 Competitive Teams
            </h3>

            <p className="mt-3 text-gray-400">
              Developing players to compete at the highest level.
            </p>
          </div>

          <div className="bg-[#111111] rounded-xl p-6 border border-[#D4AF37]/20">
            <h3 className="text-[#D4AF37] text-xl font-bold">
              🏆 Tournaments
            </h3>

            <p className="mt-3 text-gray-400">
              Organizing exciting competitions for the gaming community.
            </p>
          </div>

          <div className="bg-[#111111] rounded-xl p-6 border border-[#D4AF37]/20">
            <h3 className="text-[#D4AF37] text-xl font-bold">
              🎓 Gaming Academy
            </h3>

            <p className="mt-3 text-gray-400">
              Coaching, mentorship, and talent development programs.
            </p>
          </div>

          <div className="bg-[#111111] rounded-xl p-6 border border-[#D4AF37]/20">
            <h3 className="text-[#D4AF37] text-xl font-bold">
              🌍 Community
            </h3>

            <p className="mt-3 text-gray-400">
              Growing esports across Kenya and throughout Africa.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}