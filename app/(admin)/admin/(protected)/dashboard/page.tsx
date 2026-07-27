import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function AdminDashboardPage() {
  const { data: applicants } = await supabase
    .from("applicants")
    .select("*")
    .order("created_at", { ascending: false });

  const totalApplications = applicants?.length ?? 0;

  const pending =
    applicants?.filter((a) => a.status === "Pending").length ?? 0;

  const approved =
    applicants?.filter((a) => a.status === "Approved").length ?? 0;

  const rejected =
    applicants?.filter((a) => a.status === "Rejected").length ?? 0;

  return (
    <div className="space-y-10">

      {/* Heading */}

      <div>

        <h1 className="text-4xl font-bold">
          Dashboard
        </h1>

        <p className="mt-2 text-gray-400">
          Welcome to the KICKCREW Administration Portal.
        </p>

      </div>

      {/* Statistics */}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

        <div className="bg-[#111111] rounded-2xl p-6 border border-[#D4AF37]/20 hover:border-[#D4AF37] transition">

          <p className="text-gray-400">
            Total Applications
          </p>

          <h2 className="text-5xl font-bold mt-3 text-[#D4AF37]">
            {totalApplications}
          </h2>

        </div>

        <div className="bg-[#111111] rounded-2xl p-6 border border-yellow-500/20 hover:border-yellow-400 transition">

          <p className="text-gray-400">
            Pending
          </p>

          <h2 className="text-5xl font-bold mt-3 text-yellow-400">
            {pending}
          </h2>

        </div>

        <div className="bg-[#111111] rounded-2xl p-6 border border-green-500/20 hover:border-green-400 transition">

          <p className="text-gray-400">
            Approved
          </p>

          <h2 className="text-5xl font-bold mt-3 text-green-400">
            {approved}
          </h2>

        </div>

        <div className="bg-[#111111] rounded-2xl p-6 border border-red-500/20 hover:border-red-400 transition">

          <p className="text-gray-400">
            Rejected
          </p>

          <h2 className="text-5xl font-bold mt-3 text-red-400">
            {rejected}
          </h2>

        </div>

      </div>

      {/* Recent Applications */}

      <div className="bg-[#111111] rounded-2xl border border-[#D4AF37]/20 overflow-hidden">

        <div className="p-6 border-b border-[#D4AF37]/20 flex justify-between items-center">

          <h2 className="text-2xl font-bold">
            Recent Applications
          </h2>

          <Link
            href="/admin/applicants"
            className="text-[#D4AF37] hover:underline"
          >
            View All →
          </Link>

        </div>

        <table className="w-full">

          <thead>

            <tr className="border-b border-[#D4AF37]/20 text-left">

              <th className="p-5">Applicant</th>
              <th>Email</th>
              <th>Division</th>
              <th>Status</th>

            </tr>

          </thead>

          <tbody>

            {applicants && applicants.length > 0 ? (

              applicants.slice(0, 5).map((applicant) => (

                <tr
                  key={applicant.id}
                  className="border-b border-[#222]"
                >

                  <td className="p-5 font-semibold">
                    {applicant.full_name}
                  </td>

                  <td>
                    {applicant.email}
                  </td>

                  <td>
                    {applicant.division}
                  </td>

                  <td>

                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        applicant.status === "Approved"
                          ? "bg-green-500/20 text-green-400"
                          : applicant.status === "Rejected"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {applicant.status}
                    </span>

                  </td>

                </tr>

              ))

            ) : (

              <tr>

                <td
                  colSpan={4}
                  className="text-center py-10 text-gray-400"
                >
                  No applications found.
                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

      {/* Quick Actions */}

      <div className="bg-[#111111] rounded-2xl border border-[#D4AF37]/20 p-6">

        <h2 className="text-2xl font-bold mb-6">
          Quick Actions
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">

          <Link
            href="/admin/applicants"
            className="bg-[#D4AF37] text-center text-black py-4 rounded-xl font-bold hover:bg-yellow-400 transition"
          >
            View Applicants
          </Link>

          <button className="bg-[#D4AF37] text-black py-4 rounded-xl font-bold hover:bg-yellow-400 transition">
            Add Tournament
          </button>

          <button className="bg-[#D4AF37] text-black py-4 rounded-xl font-bold hover:bg-yellow-400 transition">
            Create Team
          </button>

          <button className="bg-[#D4AF37] text-black py-4 rounded-xl font-bold hover:bg-yellow-400 transition">
            Manage Players
          </button>

        </div>

      </div>

    </div>
  );
}