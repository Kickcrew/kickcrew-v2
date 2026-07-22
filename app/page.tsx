import Footer from "../components/home/Footer";
import Navbar from "../components/layout/Navbar";
import Hero from "../components/home/Hero";
import About from "../components/home/About";
import Stats from "../components/home/Stats";
import Tournament from "../components/home/Tournament";
import Teams from "../components/home/Teams";
import Sponsors from "../components/home/Sponsors";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <About />
      <Stats />
      <Tournament />
      <Teams />
      <Sponsors />
      <Footer />
    </>
  );
}