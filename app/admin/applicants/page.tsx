import ApplicantRow from "@/components/admin/ApplicantRow";
import { supabase } from "@/lib/supabase";

export default async function ApplicantsPage() {
  const { data: applicants, error } = await supabase
    .from("applicants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">
          Applicants
        </h1>

        <p className="mt-2 text-gray-400">
          Manage recruitment applications submitted through the KICKCREW website.
        </p>
      </div>

      <div className="bg-[#111111] rounded-2xl border border-[#D4AF37]/20 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#D4AF37]/20 text-left">
              <th className="p-5">Name</th>
              <th>Email</th>
              <th>Division</th>
              <th>Status</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {applicants && applicants.length > 0 ? (
              applicants.map((applicant) => (
                <ApplicantRow
                  key={applicant.id}
                  applicant={applicant}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-gray-400"
                >
                  No applications found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}