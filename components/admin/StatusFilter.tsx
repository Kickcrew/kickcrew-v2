"use client";

type Status =
  | "All"
  | "Pending"
  | "Approved"
  | "Rejected";

type StatusFilterProps = {
  status: Status;
  setStatus: (status: Status) => void;
};

const statuses: Status[] = [
  "All",
  "Pending",
  "Approved",
  "Rejected",
];

export default function StatusFilter({
  status,
  setStatus,
}: StatusFilterProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">

      {statuses.map((item) => (

        <button
          key={item}
          onClick={() => setStatus(item)}
          className={`px-5 py-2 rounded-xl font-semibold transition ${
            status === item
              ? "bg-[#D4AF37] text-black"
              : "bg-[#111111] border border-[#D4AF37]/20 text-white hover:border-[#D4AF37]"
          }`}
        >
          {item}
        </button>

      ))}

    </div>
  );
}