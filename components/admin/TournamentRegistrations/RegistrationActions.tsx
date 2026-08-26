"use client";

import Link from "next/link";

interface RegistrationActionsProps {
  registrationId: number;
  tournamentId: number;
}

export default function RegistrationActions({
  registrationId,
  tournamentId,
}: RegistrationActionsProps) {
  return (
    <Link
      href={`/admin/tournaments/${tournamentId}/registrations/${registrationId}`}
      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
    >
      View
    </Link>
  );
}