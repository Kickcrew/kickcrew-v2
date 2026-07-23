"use client";

import { useEffect, useState } from "react";

export default function Countdown() {
  const targetDate = new Date("2026-09-20T09:00:00").getTime();

  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    setMounted(true);

    const updateCountdown = () => {
      setTimeLeft(targetDate - Date.now());
    };

    updateCountdown();

    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!mounted) {
    return (
      <div className="grid grid-cols-4 gap-4 mt-10">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="bg-[#111111] border border-[#D4AF37]/20 rounded-xl py-6 h-28 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (timeLeft <= 0) {
    return (
      <div className="text-center text-3xl font-bold text-[#D4AF37] mt-10">
        Tournament Started!
      </div>
    );
  }

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);

  const items = [
    { label: "Days", value: days },
    { label: "Hours", value: hours },
    { label: "Minutes", value: minutes },
    { label: "Seconds", value: seconds },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-[#111111] border border-[#D4AF37]/20 rounded-xl py-6 text-center"
        >
          <div className="text-4xl font-bold text-[#D4AF37]">
            {String(item.value).padStart(2, "0")}
          </div>

          <div className="text-gray-400 mt-2">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}