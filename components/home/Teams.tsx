import Link from "next/link";
import Image from "next/image";
import Card from "../ui/Card";
import FadeIn from "../animations/FadeIn";

const teams = [
  {
    name: "Valorant",
    image: "/images/valorant.png",
    players: "5 Players",
    captain: "Roster Forming",
    status: "ACTIVE",
    link: "/teams/valorant",
  },
  {
    name: "EA SPORTS FC",
    image: "/images/fc25.png",
    players: "8 Players",
    captain: "Roster Forming",
    status: "RECRUITING",
    link: "/teams/efootball",
  },
  {
    name: "PUBG Mobile",
    image: "/images/pubgm.png",
    players: "4 Players",
    captain: "Roster Forming",
    status: "ACTIVE",
    link: "/teams/pubgm",
  },
];

export default function Teams() {
  return (
    <section
      id="teams"
      className="bg-black text-white py-24"
    >
      <div className="max-w-7xl mx-auto px-6">

        <FadeIn>
          <div className="text-center">

            <p className="uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
              Competitive Teams
            </p>

            <h2 className="text-5xl font-bold mt-4">
              Meet Our Teams
            </h2>

            <p className="mt-6 max-w-3xl mx-auto text-gray-400 leading-8">
              KICKCREW develops talented players across multiple esports
              titles while preparing them for regional and international
              competition.
            </p>

          </div>
        </FadeIn>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 mt-16">

          {teams.map((team) => (

            <FadeIn key={team.name}>

              <Card>

                <div className="relative h-60 overflow-hidden">

                  <Image
                    src={team.image}
                    alt={team.name}
                    fill
                    className="object-cover hover:scale-110 transition duration-700"
                  />

                </div>

                <div className="p-8">

                  <div className="flex justify-between items-center">

                    <h3 className="text-2xl font-bold">
                      {team.name}
                    </h3>

                    <span className="text-xs bg-[#D4AF37] text-black px-3 py-1 rounded-full font-semibold">
                      {team.status}
                    </span>

                  </div>

                  <p className="mt-5 text-gray-400">
                    {team.players}
                  </p>

                  <p className="mt-2 text-gray-400">
                    {team.captain}
                  </p>

                  <Link
                    href={team.link}
                    className="mt-8 block w-full text-center bg-[#D4AF37] text-black py-3 rounded-lg font-semibold hover:bg-yellow-500 transition duration-300"
                  >
                    View Team
                  </Link>

                </div>

              </Card>

            </FadeIn>

          ))}

        </div>

      </div>
    </section>
  );
}