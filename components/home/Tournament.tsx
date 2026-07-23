import Countdown from "./Countdown";
import FadeIn from "../animations/FadeIn";
import Button from "../ui/Button";
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
} from "lucide-react";

export default function Tournament() {
  return (
    <section
      id="tournaments"
      className="relative py-28 text-white"
      style={{
        backgroundImage: "url('/images/tournament-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/80"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">

        <FadeIn>

          <div className="text-center">

            <span className="inline-block bg-[#D4AF37] text-black font-bold px-5 py-2 rounded-full mb-6">
              🔥 NEXT MAJOR EVENT
            </span>

            <h2 className="text-5xl md:text-6xl font-bold">
              KICKCREW Valorant Open
            </h2>

            <p className="mt-6 max-w-3xl mx-auto text-gray-300 leading-8">
              Kenya's premier Valorant tournament where the nation's
              best teams battle for prestige, cash prizes, and a place
              among Africa's elite.
            </p>

          </div>

        </FadeIn>

        <FadeIn>
          <Countdown />
        </FadeIn>

        <div className="grid md:grid-cols-4 gap-6 mt-16">

          <div className="bg-black/60 backdrop-blur-md rounded-xl p-6 border border-[#D4AF37]/30 text-center">
            <Trophy className="mx-auto text-[#D4AF37]" size={36} />
            <h3 className="mt-4 text-[#D4AF37] font-semibold">
              Prize Pool
            </h3>
            <p className="text-2xl font-bold mt-2">
              KES 100,000
            </p>
          </div>

          <div className="bg-black/60 backdrop-blur-md rounded-xl p-6 border border-[#D4AF37]/30 text-center">
            <Calendar className="mx-auto text-[#D4AF37]" size={36} />
            <h3 className="mt-4 text-[#D4AF37] font-semibold">
              Date
            </h3>
            <p className="text-2xl font-bold mt-2">
              Sept 20, 2026
            </p>
          </div>

          <div className="bg-black/60 backdrop-blur-md rounded-xl p-6 border border-[#D4AF37]/30 text-center">
            <Users className="mx-auto text-[#D4AF37]" size={36} />
            <h3 className="mt-4 text-[#D4AF37] font-semibold">
              Teams
            </h3>
            <p className="text-2xl font-bold mt-2">
              32 Teams
            </p>
          </div>

          <div className="bg-black/60 backdrop-blur-md rounded-xl p-6 border border-[#D4AF37]/30 text-center">
            <MapPin className="mx-auto text-[#D4AF37]" size={36} />
            <h3 className="mt-4 text-[#D4AF37] font-semibold">
              Venue
            </h3>
            <p className="text-2xl font-bold mt-2">
              Nairobi
            </p>
          </div>

        </div>

        <div className="flex justify-center gap-5 mt-14 flex-wrap">

          <Button text="Register Now" />

          <Button
            text="Tournament Details"
            variant="secondary"
          />

        </div>

      </div>
    </section>
  );
}