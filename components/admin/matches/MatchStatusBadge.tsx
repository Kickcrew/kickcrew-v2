interface MatchStatusBadgeProps {
  status: string;
}

export default function MatchStatusBadge({
  status,
}: MatchStatusBadgeProps) {

  const colors: Record<string, string> = {
    Scheduled: "bg-blue-600",
    Live: "bg-red-600 animate-pulse",
    Completed: "bg-green-600",
    Postponed: "bg-yellow-600 text-black",
    Cancelled: "bg-gray-600",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-semibold ${
        colors[status] || "bg-gray-600"
      }`}
    >
      {status}
    </span>
  );
}