import Button from "../ui/Button";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center text-white"
      style={{
        backgroundImage: "url('/images/hero-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/70"></div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-5xl text-center px-6">

        <p className="uppercase tracking-[0.35em] text-[#D4AF37] font-semibold mb-6">
          Kenya&apos;s Premier Esports Organization
        </p>

        <h1 className="text-6xl md:text-8xl font-bold leading-tight">
          Building Africa&apos;s Next Generation of
          <span className="text-[#D4AF37]"> Esports Champions</span>
        </h1>

        <p className="mt-8 text-lg md:text-xl text-gray-200 max-w-3xl mx-auto">
          KICKCREW Esports empowers players, teams, creators and gaming
          communities through tournaments, education, mentorship and career
          opportunities across Africa.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Button text="Join Tournament" />
          <Button text="Learn More" />
        </div>

      </div>

      {/* Scroll Down Arrow */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <a
          href="#about"
          className="text-white text-3xl animate-bounce"
        >
          ↓
        </a>
      </div>

    </section>
  );
}