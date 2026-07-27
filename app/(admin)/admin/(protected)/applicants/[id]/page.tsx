import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ApplicantDetailsPage({
  params,
}: Props) {
  const { id } = await params;

  const { data: applicant, error } = await supabase
    .from("applicants")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !applicant) {
    return (
      <main className="min-h-screen bg-black text-white p-10">
        <h1 className="text-4xl font-bold text-red-500">
          Applicant Not Found
        </h1>

        <Link
          href="/admin/applicants"
          className="inline-block mt-8 bg-[#D4AF37] text-black px-6 py-3 rounded-lg font-semibold"
        >
          ← Back to Applicants
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">

      <div className="max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-10">

          <div>

            <h1 className="text-5xl font-bold">
              Applicant Profile
            </h1>

            <p className="mt-3 text-gray-400">
              Recruitment Application Details
            </p>

          </div>

          <Link
            href="/admin/applicants"
            className="bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition"
          >
            ← Back
          </Link>

        </div>

        {/* Personal Information */}

        <div className="bg-[#111111] rounded-2xl border border-[#D4AF37]/20 p-8">

          <h2 className="text-2xl font-bold mb-6">
            Personal Information
          </h2>

          <div className="grid md:grid-cols-2 gap-8">

            <div>

              <p className="text-gray-400 text-sm">
                Full Name
              </p>

              <p className="text-xl font-semibold mt-2">
                {applicant.full_name}
              </p>

            </div>

            <div>

              <p className="text-gray-400 text-sm">
                Email Address
              </p>

              <p className="text-xl font-semibold mt-2">
                {applicant.email}
              </p>

            </div>

            <div>

              <p className="text-gray-400 text-sm">
                Phone Number
              </p>

              <p className="text-xl font-semibold mt-2">
                {applicant.phone}
              </p>

            </div>

            <div>

              <p className="text-gray-400 text-sm">
                Country
              </p>

              <p className="text-xl font-semibold mt-2">
                {applicant.country}
              </p>

            </div>

          </div>

        </div>
                {/* Gaming Information */}

        <div className="mt-8 bg-[#111111] rounded-2xl border border-[#D4AF37]/20 p-8">

          <h2 className="text-2xl font-bold mb-6">
            Gaming Information
          </h2>

          <div className="grid md:grid-cols-2 gap-8">

            <div>

              <p className="text-gray-400 text-sm">
                Division
              </p>

              <p className="text-xl font-semibold mt-2">
                {applicant.division}
              </p>

            </div>

            <div>

              <p className="text-gray-400 text-sm">
                In-Game Name
              </p>

              <p className="text-xl font-semibold mt-2">
                {applicant.ign}
              </p>

            </div>

            <div>

              <p className="text-gray-400 text-sm">
                Gaming Platform
              </p>

              <p className="text-xl font-semibold mt-2">
                {applicant.platform}
              </p>

            </div>

            <div>

              <p className="text-gray-400 text-sm">
                Current Status
              </p>

              <span
                className={`inline-block mt-2 px-4 py-2 rounded-full font-semibold ${
                  applicant.status === "Approved"
                    ? "bg-green-500/20 text-green-400"
                    : applicant.status === "Rejected"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {applicant.status}
              </span>

            </div>

          </div>

        </div>

        {/* About Applicant */}

        <div className="mt-8 bg-[#111111] rounded-2xl border border-[#D4AF37]/20 p-8">

          <h2 className="text-2xl font-bold mb-6">
            About the Applicant
          </h2>

          <p className="text-gray-300 leading-8 whitespace-pre-line">
            {applicant.about || "No information provided."}
          </p>

        </div>

        {/* Motivation */}

        <div className="mt-8 bg-[#111111] rounded-2xl border border-[#D4AF37]/20 p-8">

          <h2 className="text-2xl font-bold mb-6">
            Why They Want to Join KICKCREW
          </h2>

          <p className="text-gray-300 leading-8 whitespace-pre-line">
            {applicant.motivation || "No motivation provided."}
          </p>
          {/* Summary */}

<div className="grid md:grid-cols-3 gap-6 mb-8">

  <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6">

    <p className="text-gray-400 text-sm">
      Applicant ID
    </p>

    <h3 className="text-3xl font-bold mt-3">
      #{applicant.id}
    </h3>

  </div>

  <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6">

    <p className="text-gray-400 text-sm">
      Current Status
    </p>

    <h3
      className={`text-3xl font-bold mt-3 ${
        applicant.status === "Approved"
          ? "text-green-400"
          : applicant.status === "Rejected"
          ? "text-red-400"
          : "text-yellow-400"
      }`}
    >
      {applicant.status}
    </h3>

  </div>

  <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6">

    <p className="text-gray-400 text-sm">
      Applied On
    </p>

    <h3 className="text-xl font-bold mt-3">
      {new Date(applicant.created_at).toLocaleDateString()}
    </h3>

  </div>

</div>

        </div>

      </div>

    </main>
  );
}