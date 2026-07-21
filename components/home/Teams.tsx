import TeamCard from "../ui/TeamCard";

export default function Teams() {
  return (
    <section
      id="teams"
      className="bg-[#0a0a0a] text-white py-24"
    >
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-16">
          <p className="uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
            Our Teams
          </p>

          <h2 className="text-5xl font-bold mt-4">
            Meet the KICKCREW Teams
          </h2>

          <p className="text-gray-400 mt-6 max-w-2xl mx-auto">
            Our teams compete across multiple esports titles, representing
            KICKCREW with passion, discipline, and excellence.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">

          <TeamCard
            name="KICKCREW Phoenix"
            game="EA Sports FC"
          />

          <TeamCard
            name="KICKCREW Titans"
            game="Valorant"
          />

          <TeamCard
            name="KICKCREW Legends"
            game="PUBG Mobile"
          />

        </div>

      </div>
    </section>
  );
}