export default function Stats() {
  return (
    <section
  id="about"
  className="bg-[#111111] text-white py-20"
>
      <div className="max-w-6xl mx-auto px-6">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">

          <div>
            <h2 className="text-4xl font-bold text-[#D4AF37]">500+</h2>
            <p className="mt-2 text-gray-400">Community Members</p>
          </div>

          <div>
            <h2 className="text-4xl font-bold text-[#D4AF37]">20+</h2>
            <p className="mt-2 text-gray-400">Tournaments</p>
          </div>

          <div>
            <h2 className="text-4xl font-bold text-[#D4AF37]">50+</h2>
            <p className="mt-2 text-gray-400">Competitive Players</p>
          </div>

          <div>
            <h2 className="text-4xl font-bold text-[#D4AF37]">10+</h2>
            <p className="mt-2 text-gray-400">Partner Teams</p>
          </div>

        </div>

      </div>
    </section>
  );
}