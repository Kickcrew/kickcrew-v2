import Navbar from "../components/layout/Navbar";
import Hero from "../components/home/Hero";
import Stats from "../components/home/Stats";
import Tournament from "../components/home/Tournament";
import Teams from "../components/home/Teams";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Stats />
      <Tournament />
      <Teams />
    </>
  );
}