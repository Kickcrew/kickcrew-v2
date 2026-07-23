"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const navItems = [
  { name: "Home", href: "#home" },
  { name: "About", href: "#about" },
  { name: "Impact", href: "#stats" },
  { name: "Teams", href: "#teams" },
  { name: "Tournaments", href: "#tournaments" },
  { name: "News", href: "#news" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      let current = "home";

      navItems.forEach((item) => {
        const section = document.querySelector(item.href);

        if (!section) return;

        const top = (section as HTMLElement).offsetTop - 120;
        const height = (section as HTMLElement).offsetHeight;

        if (window.scrollY >= top && window.scrollY < top + height) {
          current = item.href.substring(1);
        }
      });

      setActiveSection(current);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? "bg-black/95 backdrop-blur-md shadow-lg border-b border-[#D4AF37]/20"
          : "bg-black/40 backdrop-blur-md"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
        <Link href="/" className="text-3xl font-bold tracking-wide">
          <span className="text-white">KICK</span>
          <span className="text-[#D4AF37]">CREW</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const active = activeSection === item.href.substring(1);

            return (
              <a
                key={item.name}
                href={item.href}
                className={`relative transition-colors duration-300 ${
                  active ? "text-[#D4AF37]" : "hover:text-[#D4AF37]"
                }`}
              >
                {item.name}

                <span
                  className={`absolute left-0 -bottom-2 h-[2px] bg-[#D4AF37] transition-all duration-300 ${
                    active ? "w-full" : "w-0"
                  }`}
                />
              </a>
            );
          })}
        </nav>

        <a
          href="#tournaments"
          className="hidden md:inline-flex bg-[#D4AF37] text-black px-5 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition duration-300"
        >
          Join Now
        </a>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white"
        >
          {menuOpen ? <X size={30} /> : <Menu size={30} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-black border-t border-[#D4AF37]/20">
          <nav className="flex flex-col">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={closeMenu}
                className="px-6 py-4 hover:bg-[#D4AF37] hover:text-black transition"
              >
                {item.name}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}