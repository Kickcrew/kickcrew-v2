"use client";

import { logout } from "@/app/(admin)/admin/logout/actions";

export default function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-xl font-semibold transition"
      >
        Logout
      </button>
    </form>
  );
}