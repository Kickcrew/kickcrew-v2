import Image from "next/image";
import FadeIn from "../animations/FadeIn";
import Card from "../ui/Card";
import { Calendar, ArrowRight } from "lucide-react";

const news = [
  {
    title: "KICKCREW Valorant Open Registration Begins",
    image: "/images/news1.png",
    date: "August 10, 2026",
    category: "Tournament",
    excerpt:
      "Registration is officially open for our biggest Valorant tournament of the year.",
  },
  {
    title: "KICKCREW Announces New Community Partnership",
    image: "/images/news2.png",
    date: "August 5, 2026",
    category: "Partnership",
    excerpt:
      "We're excited to expand our esports community through a new strategic partnership.",
  },
  {
    title: "PUBG Mobile Tryouts Now Open",
    image: "/images/news3.png",
    date: "July 28, 2026",
    category: "Team",
    excerpt:
      "Think you have what it takes? Join our PUBG Mobile roster tryouts today.",
  },
];

export default function News() {
  return (
    <section
      id="news"
      className="bg-[#0a0a0a] text-white py-24"
    >
      <div className="max-w-7xl mx-auto px-6">

        <FadeIn>

          <div className="text-center">

            <p className="uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
              Latest News
            </p>

            <h2 className="text-5xl font-bold mt-4">
              What's Happening at KICKCREW
            </h2>

            <p className="mt-6 max-w-3xl mx-auto text-gray-400 leading-8">
              Stay updated with our latest tournaments,
              partnerships and community activities.
            </p>

          </div>

        </FadeIn>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 mt-16">

          {news.map((item) => (

            <FadeIn key={item.title}>

              <Card>

                <article className="group cursor-pointer">

                  <div className="relative h-60 overflow-hidden">

                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width:768px)100vw,(max-width:1200px)50vw,33vw"
                      className="object-cover transition duration-700 group-hover:scale-110"
                    />

                    <div className="absolute top-4 left-4 bg-[#D4AF37] text-black text-xs font-bold px-3 py-1 rounded-full">
                      {item.category}
                    </div>

                  </div>

                  <div className="p-7">

                    <div className="flex items-center gap-2 text-[#D4AF37] text-sm">

                      <Calendar size={16} />

                      {item.date}

                    </div>

                    <h3 className="text-2xl font-bold mt-4 group-hover:text-[#D4AF37] transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-gray-400 mt-4 leading-7">
                      {item.excerpt}
                    </p>

                    <div className="mt-8 flex items-center gap-2 text-[#D4AF37] font-semibold group-hover:gap-4 transition-all">

                      Read More

                      <ArrowRight size={18} />

                    </div>

                  </div>

                </article>

              </Card>

            </FadeIn>

          ))}

        </div>

      </div>
    </section>
  );
}