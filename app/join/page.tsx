import Hero from "./components/Hero";
import WhyJoin from "./components/WhyJoin";
import RecruitmentProcess from "./components/RecruitmentProcess";
import ApplicationForm from "./components/ApplicationForm";

export default function JoinPage() {
  return (
    <main className="bg-black text-white">
      <Hero />
      <WhyJoin />
      <RecruitmentProcess />
      <ApplicationForm />
    </main>
  );
}