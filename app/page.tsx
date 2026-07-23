import Navbar from "../components/layout/Navbar";
import Hero from "../components/home/Hero";
import About from "../components/home/About";
import Stats from "../components/home/Stats";
import Tournament from "../components/home/Tournament";
import Teams from "../components/home/Teams";
import News from "../components/home/News";
import Sponsors from "../components/home/Sponsors";
import Footer from "../components/home/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <About />
      <Stats />
      <Tournament />
      <Teams />
      <News />
      <Sponsors />
      <Footer />
    </>
  );
}