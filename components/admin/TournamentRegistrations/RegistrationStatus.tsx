interface RegistrationStatusProps {
  status: string;
}

export default function RegistrationStatus({
  status,
}: RegistrationStatusProps) {
  const statusClasses =
    status === "Approved"
      ? "bg-green-600 text-white"
      : status === "Rejected"
      ? "bg-red-600 text-white"
      : "bg-yellow-600 text-black";

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${statusClasses}`}
    >
      {status}
    </span>
  );
}