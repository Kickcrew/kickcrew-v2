"use client";

import { useMemo, useState } from "react";
import ApplicantRow from "./ApplicantRow";
import SearchBar from "./SearchBar";
import StatusFilter from "./StatusFilter";

type Applicant = {
  id: number;
  full_name: string;
  email: string;
  division: string;
  status: string;
};

type ApplicantsTableProps = {
  applicants: Applicant[];
};

export default function ApplicantsTable({
  applicants,
}: ApplicantsTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<
    "All" | "Pending" | "Approved" | "Rejected"
  >("All");

  const filteredApplicants = useMemo(() => {
    return applicants.filter((applicant) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        applicant.full_name.toLowerCase().includes(keyword) ||
        applicant.email.toLowerCase().includes(keyword) ||
        applicant.division.toLowerCase().includes(keyword);

      const matchesStatus =
        status === "All" || applicant.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [applicants, search, status]);

  return (
    <>
      <SearchBar
        search={search}
        setSearch={setSearch}
      />

      <StatusFilter
        status={status}
        setStatus={setStatus}
      />

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
            {filteredApplicants.length > 0 ? (
              filteredApplicants.map((applicant) => (
                <ApplicantRow
                  key={applicant.id}
                  applicant={applicant}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="text-center p-10 text-gray-400"
                >
                  No applicants found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}