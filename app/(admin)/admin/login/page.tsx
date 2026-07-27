"use client";

import { useActionState } from "react";
import { login } from "./actions";

const initialState = {
  error: "",
};

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(
    login,
    initialState
  );

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-6">

      <div className="w-full max-w-md bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-10">

        <div className="text-center">

          <h1 className="text-4xl font-bold text-white">
            KICKCREW
          </h1>

          <p className="mt-3 text-[#D4AF37] uppercase tracking-[0.3em] text-sm">
            Admin Portal
          </p>

          <p className="mt-6 text-gray-400">
            Sign in to access the administration dashboard.
          </p>

        </div>

        <form
          action={formAction}
          className="mt-10 space-y-6"
        >

          <input
            name="email"
            type="email"
            placeholder="Email Address"
            required
            className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-[#D4AF37] outline-none"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:border-[#D4AF37] outline-none"
          />

          {state?.error && (
            <p className="text-red-500 text-sm">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-[#D4AF37] text-black py-4 rounded-xl font-bold hover:bg-yellow-400 transition disabled:opacity-60"
          >
            {pending ? "Signing In..." : "Sign In"}
          </button>

        </form>

      </div>

    </main>
  );
}