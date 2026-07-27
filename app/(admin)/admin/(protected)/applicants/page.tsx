import { supabase } from "@/lib/supabase";
import ApplicantsTable from "@/components/admin/ApplicantsTable";

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

      <ApplicantsTable
        applicants={applicants ?? []}
      />

    </div>
  );
}