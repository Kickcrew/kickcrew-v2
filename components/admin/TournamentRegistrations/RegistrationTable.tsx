"use client";

import RegistrationRow from "./RegistrationRow";

interface Registration {
  id: number;
  tournament_id: number;
  team_id: number | null;
  player_id: number | null;
  status: string;
  registered_at: string;

  teams?: {
  id: number;
  team_name: string | null;
}[];

players?: {
  id: number;
  full_name: string | null;
  gamer_tag: string | null;
}[];
}

interface RegistrationTableProps {
  registrations: Registration[];
  onDeleted: (id: number) => void;
}

export default function RegistrationTable({
  registrations,
  onDeleted,
}: RegistrationTableProps) {
  return (
    <div className="bg-[#111111] rounded-2xl border border-[#D4AF37]/20 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-black">
            <tr>
              <th className="text-left p-5">
                Participant
              </th>

              <th className="text-left">
                Full Name
              </th>

              <th className="text-left">
                Gamer Tag
              </th>

              <th className="text-left">
                Status
              </th>

              <th className="text-left">
                Registered
              </th>

              <th className="text-left">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {registrations.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-gray-400"
                >
                  No tournament registrations found.
                </td>
              </tr>
            ) : (
              registrations.map((registration) => (
                <RegistrationRow
                  key={registration.id}
                  registration={registration}
                  onDeleted={onDeleted}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}