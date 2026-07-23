"use client";

import CountUp from "react-countup";

type CounterProps = {
  end: number;
  suffix?: string;
};

export default function Counter({
  end,
  suffix = "",
}: CounterProps) {
  return (
    <CountUp
      end={end}
      duration={2.5}
      enableScrollSpy
      scrollSpyOnce
      suffix={suffix}
    />
  );
}