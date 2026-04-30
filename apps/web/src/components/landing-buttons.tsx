"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function SignInNavButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => { setLoading(true); router.push("/login"); }}
      className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
    >
      {loading ? <><Spinner />Loading...</> : "Sign In"}
    </button>
  );
}

export function HeroCTAButtons() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
      <button
        type="button"
        disabled={loading}
        onClick={() => { setLoading(true); router.push("/login"); }}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-medium text-white disabled:opacity-70 sm:w-auto"
      >
        {loading ? <><Spinner />Loading...</> : "Get Started"}
      </button>
      <a
        href="#how-it-works"
        className="w-full rounded-lg border border-slate-200 px-6 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
      >
        How it works
      </a>
    </div>
  );
}
