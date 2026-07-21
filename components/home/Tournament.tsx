export default function Tournament() {
  return (
   <section
  id="tournaments"
  className="bg-black text-white py-24"
>
      <div className="max-w-6xl mx-auto px-6">

        <div className="border border-[#D4AF37] rounded-2xl p-10 bg-[#111111]">

          <p className="text-[#D4AF37] uppercase tracking-[0.3em] font-semibold">
            Upcoming Tournament
          </p>

          <h2 className="text-4xl font-bold mt-4">
            KICKCREW Community Championship
          </h2>

          <p className="mt-6 text-gray-300 max-w-3xl">
            Join Kenya's growing esports community and compete against the
            country's best players. Register today and begin your journey
            toward becoming Africa's next esports champion.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">

            <div className="bg-black border border-[#D4AF37] px-5 py-3 rounded-lg">
              📅 August 2026
            </div>

            <div className="bg-black border border-[#D4AF37] px-5 py-3 rounded-lg">
              📍 Nairobi, Kenya
            </div>

            <div className="bg-black border border-[#D4AF37] px-5 py-3 rounded-lg">
              🎮 EA FC 26
            </div>

          </div>

          <button className="mt-10 bg-[#D4AF37] text-black px-8 py-4 rounded-lg font-semibold hover:bg-yellow-500 transition">
            Register Now
          </button>

        </div>

      </div>
    </section>
  );
}