export default function RecruitmentProcess() {
  const steps = [
    {
      step: "01",
      title: "Apply",
      description: "Complete the online application form with your gaming information.",
    },
    {
      step: "02",
      title: "Review",
      description: "Our recruitment team carefully reviews every application.",
    },
    {
      step: "03",
      title: "Trial",
      description: "Shortlisted applicants may be invited for gameplay trials or interviews.",
    },
    {
      step: "04",
      title: "Selection",
      description: "Successful applicants receive an invitation to join KICKCREW.",
    },
    {
      step: "05",
      title: "Welcome",
      description: "Begin your journey as an official KICKCREW member.",
    },
  ];

  return (
    <section className="bg-black py-24">

      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center">

          <p className="uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
            Recruitment Process
          </p>

          <h2 className="text-5xl font-bold mt-4">
            Your Journey Starts Here
          </h2>

          <p className="mt-6 max-w-3xl mx-auto text-gray-400 leading-8">
            We believe in creating opportunities for passionate gamers.
            Every application is reviewed fairly and every player has a chance
            to prove themselves.
          </p>

        </div>

        <div className="grid md:grid-cols-5 gap-8 mt-16">

          {steps.map((item) => (

            <div
              key={item.step}
              className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-8 text-center hover:border-[#D4AF37] transition duration-300"
            >

              <div className="text-5xl font-black text-[#D4AF37]">
                {item.step}
              </div>

              <h3 className="text-2xl font-bold mt-6">
                {item.title}
              </h3>

              <p className="mt-4 text-gray-400 leading-7">
                {item.description}
              </p>

            </div>

          ))}

        </div>

      </div>

    </section>
  );
}