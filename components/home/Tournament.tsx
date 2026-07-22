import { Calendar, Trophy, Users, MapPin } from "lucide-react";
import Container from "../ui/Container";
import SectionTitle from "../ui/SectionTitle";
import Button from "../ui/Button";

export default function Tournament() {
  return (
    <section
      id="tournaments"
      className="bg-black text-white py-24"
    >
      <Container>

        <SectionTitle
          eyebrow="Featured Tournament"
          title="KICKCREW Valorant Championship"
          description="Compete against the best teams in Kenya and showcase your skills on the national stage."
        />

        <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl overflow-hidden hover:border-[#D4AF37] hover:shadow-[0_0_35px_rgba(212,175,55,0.25)] transition-all duration-300">

          <div className="grid lg:grid-cols-2">

            {/* Left Side */}
            <div
              className="min-h-[350px] bg-cover bg-center"
              style={{
               backgroundImage: "url('/images/hero-bg.png')",
              }}
            />

            {/* Right Side */}
            <div className="p-10">

              <span className="inline-block bg-[#D4AF37] text-black text-sm font-bold px-4 py-2 rounded-full">
                Registration Open
              </span>

              <h3 className="text-4xl font-bold mt-6">
                Valorant Championship 2026
              </h3>

              <p className="mt-6 text-gray-400 leading-8">
                Assemble your squad and compete against Kenya's top Valorant
                teams for glory, prizes, and national recognition.
              </p>

              <div className="grid grid-cols-2 gap-6 mt-10">

                <div className="flex items-center gap-3">
                  <Calendar className="text-[#D4AF37]" />
                  <span>15 August 2026</span>
                </div>

                <div className="flex items-center gap-3">
                  <Trophy className="text-[#D4AF37]" />
                  <span>KES 100,000 Prize Pool</span>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="text-[#D4AF37]" />
                  <span>5v5 Teams</span>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="text-[#D4AF37]" />
                  <span>Nairobi & Online</span>
                </div>

              </div>

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Button
                  text="Register Now"
                  variant="primary"
                />

                <Button
                  text="Tournament Details"
                  variant="secondary"
                />
              </div>

            </div>

          </div>

        </div>

      </Container>
    </section>
  );
}