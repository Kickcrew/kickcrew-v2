import Container from "../ui/Container";

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] border-t border-[#D4AF37]/20 text-white">
      <Container>

        <div className="grid md:grid-cols-4 gap-10 py-16">

          {/* Brand */}
          <div>
            <h2 className="text-3xl font-bold">
              KICK<span className="text-[#D4AF37]">CREW</span>
            </h2>

            <p className="mt-5 text-gray-400 leading-7">
              Building Africa's next generation of esports champions through
              competition, education, and community.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-[#D4AF37] font-semibold mb-5">
              Quick Links
            </h3>

            <ul className="space-y-3 text-gray-400">
              <li><a href="#home" className="hover:text-[#D4AF37]">Home</a></li>
              <li><a href="#about" className="hover:text-[#D4AF37]">About</a></li>
              <li><a href="#tournaments" className="hover:text-[#D4AF37]">Tournaments</a></li>
              <li><a href="#teams" className="hover:text-[#D4AF37]">Teams</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[#D4AF37] font-semibold mb-5">
              Contact
            </h3>

            <ul className="space-y-3 text-gray-400">
              <li>Nairobi, Kenya</li>
              <li>kickcrewesports@gmail.com</li>
              <li>+254 XXX XXX XXX</li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-[#D4AF37] font-semibold mb-5">
              Follow Us
            </h3>

            <ul className="space-y-3 text-gray-400">
              <li>Facebook</li>
              <li>Instagram</li>
              <li>X (Twitter)</li>
              <li>YouTube</li>
              <li>Discord</li>
            </ul>
          </div>

        </div>

        <div className="border-t border-white/10 py-6 text-center text-gray-500 text-sm">
          © 2026 KICKCREW Esports. All Rights Reserved.
        </div>

      </Container>
    </footer>
  );
}