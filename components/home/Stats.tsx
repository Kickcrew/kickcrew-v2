import FadeIn from "../animations/FadeIn";
import Container from "../ui/Container";
import SectionTitle from "../ui/SectionTitle";
import Counter from "../ui/Counter";

export default function Stats() {
  return (
    <section
      id="stats"
      className="bg-[#111111] text-white py-24"
    >
      <FadeIn>
        <Container>

          <SectionTitle
            eyebrow="Community Impact"
            title="Growing the Future of African Esports"
            description="Every tournament, every player, and every partnership brings us closer to building a stronger esports ecosystem across Kenya and Africa."
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">

            {/* Card 1 */}
            <div className="bg-black rounded-xl border border-[#D4AF37]/20 p-8 text-center hover:border-[#D4AF37] hover:-translate-y-2 hover:shadow-[0_0_25px_rgba(212,175,55,0.25)] transition-all duration-300">
              <h3 className="text-5xl font-bold text-[#D4AF37]">
                <Counter end={500} suffix="+" />
              </h3>

              <p className="mt-4 text-gray-300 font-medium">
                Community Members
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-black rounded-xl border border-[#D4AF37]/20 p-8 text-center hover:border-[#D4AF37] hover:-translate-y-2 hover:shadow-[0_0_25px_rgba(212,175,55,0.25)] transition-all duration-300">
              <h3 className="text-5xl font-bold text-[#D4AF37]">
                <Counter end={20} suffix="+" />
              </h3>

              <p className="mt-4 text-gray-300 font-medium">
                Professional Tournaments
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-black rounded-xl border border-[#D4AF37]/20 p-8 text-center hover:border-[#D4AF37] hover:-translate-y-2 hover:shadow-[0_0_25px_rgba(212,175,55,0.25)] transition-all duration-300">
              <h3 className="text-5xl font-bold text-[#D4AF37]">
                <Counter end={50} suffix="+" />
              </h3>

              <p className="mt-4 text-gray-300 font-medium">
                Competitive Players
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-black rounded-xl border border-[#D4AF37]/20 p-8 text-center hover:border-[#D4AF37] hover:-translate-y-2 hover:shadow-[0_0_25px_rgba(212,175,55,0.25)] transition-all duration-300">
              <h3 className="text-5xl font-bold text-[#D4AF37]">
                <Counter end={10} suffix="+" />
              </h3>

              <p className="mt-4 text-gray-300 font-medium">
                Strategic Partners
              </p>
            </div>

          </div>

        </Container>
      </FadeIn>
    </section>
  );
}