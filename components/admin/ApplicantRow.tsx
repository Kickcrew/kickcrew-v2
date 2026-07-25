"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Applicant = {
  id: number;
  full_name: string;
  email: string;
  division: string;
  status: string;
};

type ApplicantRowProps = {
  applicant: Applicant;
};

export default function ApplicantRow({
  applicant,
}: ApplicantRowProps) {
  const router = useRouter();

  async function updateStatus(status: "Approved" | "Rejected") {
    const response = await fetch("/api/applicants/update-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: applicant.id,
        status,
      }),
    });

    const result = await response.json();

    if (result.success) {
      router.refresh();
    } else {
      alert(result.message);
    }
  }

  return (
    <tr className="border-b border-[#222]">
      <td className="p-5">{applicant.full_name}</td>

      <td>{applicant.email}</td>

      <td>{applicant.division}</td>

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

      <td className="text-center">
        <div className="flex justify-center gap-2">

          <Link
            href={`/admin/applicants/${applicant.id}`}
            className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500 transition"
          >
            View
          </Link>

          <button
            onClick={() => updateStatus("Approved")}
            className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-500 transition"
          >
            Approve
          </button>

          <button
            onClick={() => updateStatus("Rejected")}
            className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-500 transition"
          >
            Reject
          </button>

        </div>
      </td>
    </tr>
  );
}