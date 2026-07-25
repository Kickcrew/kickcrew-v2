export default function ApplicantsPage() {
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

            <tr className="border-b border-[#222]">

              <td className="p-5">James Bright</td>

              <td>kickcrewesports@gmail.com</td>

              <td>EA SPORTS FC</td>

              <td className="text-yellow-400">
                Pending
              </td>

              <td className="text-center">

                <button className="bg-green-600 px-4 py-2 rounded-lg mr-2 hover:bg-green-500">
                  Approve
                </button>

                <button className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-500">
                  Reject
                </button>

              </td>

            </tr>

          </tbody>

        </table>

      </div>

    </div>
  );
}