export default function Stats() {
  return (
    <section
      id="stats"
      className="bg-[#111111] text-white py-24"
    >
      <div className="max-w-7xl mx-auto px-6">

        {/* Section Heading */}
        <div className="text-center mb-16">
          <p className="uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
            Community Impact
          </p>

          <h2 className="text-5xl font-bold mt-4">
            Growing the Future of African Esports
          </h2>

          <p className="mt-6 max-w-3xl mx-auto text-gray-400 leading-8">
            Every tournament, every player, and every partnership brings us
            closer to building a stronger esports ecosystem across Kenya and
            Africa.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Card 1 */}
          <div className="bg-black rounded-xl border border-[#D4AF37]/20 p-8 text-center hover:border-[#D4AF37] hover:-translate-y-2 hover:shadow-[0_0_25px_rgba(212,175,55,0.25)] transition-all duration-300">

            <h3 className="text-5xl font-bold text-[#D4AF37]">
              500+
            </h3>

            <p className="mt-4 text-gray-300 font-medium">
              Community Members
            </p>

          </div>

          {/* Card 2 */}
          <div className="bg-black rounded-xl border border-[#D4AF37]/20 p-8 text-center hover:border-[#D4AF37] hover:-translate-y-2 hover:shadow-[0_0_25px_rgba(212,175,55,0.25)] transition-all duration-300">

            <h3 className="text-5xl font-bold text-[#D4AF37]">
              20+
            </h3>

            <p className="mt-4 text-gray-300 font-medium">
              Professional Tournaments
            </p>

          </div>

          {/* Card 3 */}
          <div className="bg-black rounded-xl border border-[#D4AF37]/20 p-8 text-center hover:border-[#D4AF37] hover:-translate-y-2 hover:shadow-[0_0_25px_rgba(212,175,55,0.25)] transition-all duration-300">

            <h3 className="text-5xl font-bold text-[#D4AF37]">
              50+
            </h3>

            <p className="mt-4 text-gray-300 font-medium">
              Competitive Players
            </p>

          </div>

          {/* Card 4 */}
          <div className="bg-black rounded-xl border border-[#D4AF37]/20 p-8 text-center hover:border-[#D4AF37] hover:-translate-y-2 hover:shadow-[0_0_25px_rgba(212,175,55,0.25)] transition-all duration-300">

            <h3 className="text-5xl font-bold text-[#D4AF37]">
              10+
            </h3>

            <p className="mt-4 text-gray-300 font-medium">
              Strategic Partners
            </p>

          </div>

        </div>

      </div>
    </section>
  );
}