export default function Hero() {
  return (
    <section className="relative h-[60vh] flex items-center justify-center">

      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/hero-bg.png')",
        }}
      />

      <div className="absolute inset-0 bg-black/80" />

      <div className="relative z-10 text-center max-w-4xl px-6">

        <p className="uppercase tracking-[0.35em] text-[#D4AF37] font-semibold">
          Recruitment
        </p>

        <h1 className="text-6xl md:text-7xl font-bold mt-6">
          Join
          <span className="text-[#D4AF37]"> KICKCREW</span>
        </h1>

        <p className="mt-8 text-xl text-gray-300 leading-8">
          Ready to compete, learn and grow with one of Kenya's emerging
          esports organizations? Start your journey with KICKCREW today.
        </p>

      </div>

    </section>
  );
}