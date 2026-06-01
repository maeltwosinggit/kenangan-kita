"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/* ── Icons ── */
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-6 w-6 ${active ? "text-slate-900" : "text-slate-400"}`} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function CameraIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-6 w-6 ${active ? "text-white" : "text-slate-400"}`} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function GalleryIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-6 w-6 ${active ? "text-slate-900" : "text-slate-400"}`} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function PersonIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-6 w-6 ${active ? "text-slate-900" : "text-slate-400"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function EventBottomNav({ eventCode, hasUser }: { eventCode: string; hasUser: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  const isHome = pathname === `/e/${eventCode}`;
  const isGallery = pathname === `/e/${eventCode}/gallery`;
  const isCamera = pathname === `/e/${eventCode}/camera`;

  // Aggressive prefetching for "instant" feel
  useEffect(() => {
    router.prefetch(`/e/${eventCode}`);
    router.prefetch(`/e/${eventCode}/gallery`);
    router.prefetch(`/e/${eventCode}/camera`);
  }, [eventCode, router]);

  return (
    <nav 
      className={`fixed inset-x-0 bottom-0 z-40 mx-auto flex h-20 max-w-[448px] items-center justify-around border-t border-slate-100 bg-white/80 px-4 pb-safe backdrop-blur-lg transition-transform duration-300 ease-in-out ${isCamera ? "translate-y-full" : "translate-y-0"}`}
    >
      <Link
        href={`/e/${eventCode}`}
        className="flex flex-1 flex-col items-center gap-1 transition-all active:scale-90"
      >
        <HomeIcon active={isHome} />
        <span className={`text-[10px] font-bold uppercase tracking-wider ${isHome ? "text-slate-900" : "text-slate-400"}`}>
          Home
        </span>
      </Link>
  ...
      <Link
        href={`/e/${eventCode}/camera`}
        className={`relative -top-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-xl transition-all active:scale-95 ${isCamera ? "bg-slate-900 rotate-0" : "bg-white border border-slate-100 rotate-3 hover:rotate-0"}`}
      >
        <CameraIcon active={isCamera} />
      </Link>

      <Link
        href={`/e/${eventCode}/gallery`}
        className="flex flex-1 flex-col items-center gap-1 transition-all active:scale-90"
      >
        <GalleryIcon active={isGallery} />
        <span className={`text-[10px] font-bold uppercase tracking-wider ${isGallery ? "text-slate-900" : "text-slate-400"}`}>
          Gallery
        </span>
      </Link>

      <Link
        href={hasUser ? "/dashboard" : "/login"}
        className="flex flex-1 flex-col items-center gap-1 transition-all active:scale-90"
      >
        <PersonIcon active={false} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Profile
        </span>
      </Link>
    </nav>
  );
}
