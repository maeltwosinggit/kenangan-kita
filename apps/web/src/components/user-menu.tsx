"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UserMenu({
  avatarUrl,
  displayName,
  isAdmin = false,
}: {
  avatarUrl: string | null;
  displayName: string;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const onSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const initial = displayName[0]?.toUpperCase() ?? "?";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="User menu"
        className="group flex h-10 w-10 overflow-hidden rounded-full border border-slate-200 transition-all hover:border-slate-400 active:scale-90"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm font-semibold text-slate-600">
            {initial}
          </div>
        )}
      </button>

      <div 
        className={[
          "fixed inset-0 z-10",
          menuOpen ? "block" : "hidden"
        ].join(" ")} 
        onClick={() => setMenuOpen(false)} 
      />
      
      <div 
        className={[
          "absolute right-0 top-12 z-20 min-w-[180px] overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-200 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] origin-top-right",
          menuOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 -translate-y-2 pointer-events-none"
        ].join(" ")}
      >
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="truncate text-xs font-medium text-slate-400 uppercase tracking-widest mb-0.5">Signed in as</p>
          <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
        </div>
        
        {isAdmin && (
          <>
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-50 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 shrink-0 text-amber-500"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Admin Dashboard
            </Link>
            <div className="h-px bg-slate-100" />
          </>
        )}

        <Link
          href="/dashboard"
          onClick={() => setMenuOpen(false)}
          className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 shrink-0 text-slate-400"
          >
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
          My Dashboard
        </Link>

        <div className="h-px bg-slate-100" />

        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 shrink-0"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign out
        </button>
      </div>
    </div>
  );
}
