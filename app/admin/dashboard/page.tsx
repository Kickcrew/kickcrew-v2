export default function AdminDashboardPage() {
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

        <div className="bg-[#111111] rounded-2xl p-6 border border-[#D4AF37]/20">

          <p className="text-gray-400">Applications</p>

          <h2 className="text-4xl font-bold mt-3">
            18
          </h2>

        </div>

        <div className="bg-[#111111] rounded-2xl p-6 border border-[#D4AF37]/20">

          <p className="text-gray-400">Teams</p>

          <h2 className="text-4xl font-bold mt-3">
            3
          </h2>

        </div>

        <div className="bg-[#111111] rounded-2xl p-6 border border-[#D4AF37]/20">

          <p className="text-gray-400">Players</p>

          <h2 className="text-4xl font-bold mt-3">
            27
          </h2>

        </div>

        <div className="bg-[#111111] rounded-2xl p-6 border border-[#D4AF37]/20">

          <p className="text-gray-400">Tournaments</p>

          <h2 className="text-4xl font-bold mt-3">
            5
          </h2>

        </div>

      </div>

      {/* Recent Applications */}

      <div className="bg-[#111111] rounded-2xl border border-[#D4AF37]/20">

        <div className="p-6 border-b border-[#D4AF37]/20">

          <h2 className="text-2xl font-bold">
            Recent Applications
          </h2>

        </div>

        <table className="w-full">

          <thead>

            <tr className="text-left border-b border-[#D4AF37]/20">

              <th className="p-5">Applicant</th>

              <th>Division</th>

              <th>Status</th>

            </tr>

          </thead>

          <tbody>

            <tr className="border-b border-[#222]">

              <td className="p-5">James Bright</td>

              <td>EA SPORTS FC</td>

              <td className="text-yellow-400">Pending</td>

            </tr>

            <tr className="border-b border-[#222]">

              <td className="p-5">Brian</td>

              <td>Valorant</td>

              <td className="text-green-400">Approved</td>

            </tr>

            <tr>

              <td className="p-5">Grace</td>

              <td>PUBG Mobile</td>

              <td className="text-yellow-400">Pending</td>

            </tr>

          </tbody>

        </table>

      </div>

      {/* Quick Actions */}

      <div className="bg-[#111111] rounded-2xl border border-[#D4AF37]/20 p-6">

        <h2 className="text-2xl font-bold mb-6">
          Quick Actions
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">

          <button className="bg-[#D4AF37] text-black py-4 rounded-xl font-bold hover:bg-yellow-400 transition">
            Add Tournament
          </button>

          <button className="bg-[#D4AF37] text-black py-4 rounded-xl font-bold hover:bg-yellow-400 transition">
            Create Team
          </button>

          <button className="bg-[#D4AF37] text-black py-4 rounded-xl font-bold hover:bg-yellow-400 transition">
            View Applications
          </button>

          <button className="bg-[#D4AF37] text-black py-4 rounded-xl font-bold hover:bg-yellow-400 transition">
            Manage Players
          </button>

        </div>

      </div>

    </div>
  );
}