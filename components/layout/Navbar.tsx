export default function Navbar() {
  return (
    <header className="bg-black border-b border-[#D4AF37] sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-8 py-5">

        {/* Logo */}
        <h1 className="text-3xl font-extrabold text-[#D4AF37] tracking-wide">
          KICKCREW
        </h1>

        {/* Navigation */}
        <li><a href="#home" className="hover:text-[#D4AF37] transition">Home</a></li>
<li><a href="#about" className="hover:text-[#D4AF37] transition">About</a></li>
<li><a href="#tournaments" className="hover:text-[#D4AF37] transition">Tournaments</a></li>

        {/* CTA */}
        <button className="bg-[#D4AF37] text-black px-5 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition">
          Join Now
        </button>

      </nav>
    </header>
  );
}