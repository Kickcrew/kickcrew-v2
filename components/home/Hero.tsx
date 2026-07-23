import { ArrowDown, Trophy } from "lucide-react";
import Button from "../ui/Button";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden text-white"
      style={{
        backgroundImage: "url('/images/hero-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90"></div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 border border-[#D4AF37]/40 bg-black/40 backdrop-blur-sm rounded-full px-5 py-2 mb-8">

          <Trophy
            size={18}
            className="text-[#D4AF37]"
          />

          <span className="text-sm uppercase tracking-[0.2em] text-[#D4AF37]">
            Kenya's Premier Esports Organization
          </span>

        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight">

          Building Africa's

          <span className="block text-[#D4AF37]">
            Next Generation
          </span>

          of Esports Champions

        </h1>

        {/* Description */}
        <p className="mt-8 max-w-3xl mx-auto text-lg md:text-xl text-gray-300 leading-8">
          KICKCREW Esports empowers players, teams, creators, and gaming
          communities through professional tournaments, education,
          mentorship, content creation, and career opportunities across Africa.
        </p>

        {/* Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row justify-center gap-5">

          <Button
  text="Join Tournament"
  variant="primary"
/>

<Button
  text="Learn More"
  variant="secondary"
/>

        </div>

      </div>

      {/* Scroll Indicator */}
      <a
        href="#about"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce"
      >
        <ArrowDown
          size={36}
          className="text-[#D4AF37] hover:text-white transition-colors"
        />
      </a>

    </section>
    
      

     
        
  );
}