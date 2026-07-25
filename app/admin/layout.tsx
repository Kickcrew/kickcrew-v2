import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-[#0B0B0B] text-white">

      {/* Sidebar */}
      <aside className="w-72 bg-black border-r border-[#D4AF37]/20">

        <div className="p-8 border-b border-[#D4AF37]/20">

          <h1 className="text-3xl font-bold">
            KICKCREW
          </h1>

          <p className="text-[#D4AF37] uppercase tracking-[0.25em] text-xs mt-2">
            Admin Portal
          </p>

        </div>

        <nav className="p-6 space-y-2">

          <Link
            href="/admin/dashboard"
            className="block px-4 py-3 rounded-xl hover:bg-[#D4AF37] hover:text-black transition"
          >
            📊 Dashboard
          </Link>

          <Link
            href="/admin/applicants"
            className="block px-4 py-3 rounded-xl hover:bg-[#D4AF37] hover:text-black transition"
          >
            👥 Applicants
          </Link>

          <Link
            href="/admin/teams"
            className="block px-4 py-3 rounded-xl hover:bg-[#D4AF37] hover:text-black transition"
          >
            🏆 Teams
          </Link>

          <Link
            href="/admin/tournaments"
            className="block px-4 py-3 rounded-xl hover:bg-[#D4AF37] hover:text-black transition"
          >
            🎮 Tournaments
          </Link>

          <Link
            href="/admin/settings"
            className="block px-4 py-3 rounded-xl hover:bg-[#D4AF37] hover:text-black transition"
          >
            ⚙️ Settings
          </Link>

        </nav>

      </aside>

      {/* Main Content */}
      <div className="flex-1">

        <header className="h-20 border-b border-[#D4AF37]/20 flex items-center justify-between px-10">

          <h2 className="text-2xl font-bold">
            Administration
          </h2>

          <div className="text-gray-400">
            Welcome, Administrator
          </div>

        </header>

        <main className="p-10">
          {children}
        </main>

      </div>

    </div>
  );
}