"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 50);
    }

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? "bg-black shadow-lg border-b border-[#D4AF37]/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">

        {/* Logo */}
        <Link
          href="/"
          className="text-3xl font-bold text-[#D4AF37] tracking-wide"
        >
          KICKCREW
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">

          <a
            href="#home"
            className="hover:text-[#D4AF37] transition-colors duration-300"
          >
            Home
          </a>

          <a
            href="#teams"
            className="hover:text-[#D4AF37] transition-colors duration-300"
          >
            Teams
          </a>

          <a
            href="#tournaments"
            className="hover:text-[#D4AF37] transition-colors duration-300"
          >
            Tournaments
          </a>

          <a
            href="#news"
            className="hover:text-[#D4AF37] transition-colors duration-300"
          >
            News
          </a>

          <a
            href="#contact"
            className="hover:text-[#D4AF37] transition-colors duration-300"
          >
            Contact
          </a>

        </nav>

        {/* Join Button */}
        <a
          href="#tournaments"
          className="hidden md:inline-block bg-[#D4AF37] text-black px-5 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition duration-300"
        >
          Join Now
        </a>

      </div>
    </header>
  );
}