"use client";

import { useState, useEffect } from "react";
import { GalleryClient } from "./gallery-client";
import { CameraCaptureClient } from "./camera-capture-client";
import UserMenu from "@/components/user-menu";
import Image from "next/image";
import Link from "next/link";
import { QRCodeDisplay } from "@/components/qr-code-display";
import { useSearchParams, useRouter } from "next/navigation";

type Props = {
  event: any;
  eventCode: string;
  currentUserId: string | null;
  initialStats: { photoCount: number; guestCount: number };
  initialHeroUrl: string | null;
  shareUrl: string;
  userMenuProps: { avatarUrl: string | null; displayName: string } | null;
};

export function EventViewHub({
  event,
  eventCode,
  currentUserId,
  initialStats,
  initialHeroUrl,
  shareUrl,
  userMenuProps
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") as "event" | "camera" | "gallery" | null;
  const [activeTab, setActiveTab] = useState<"event" | "camera" | "gallery">(initialTab || "event");

  // Sync state if query param changes (browser back/forward)
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "event" || tab === "camera" || tab === "gallery") {
      setActiveTab(tab);
    } else if (!tab) {
      setActiveTab("event");
    }
  }, [searchParams]);

  const handleTabChange = (newTab: "event" | "camera" | "gallery") => {
    setActiveTab(newTab);
    // Update URL without triggering a full reload
    const params = new URLSearchParams(searchParams.toString());
    if (newTab === "event") {
      params.delete("tab");
    } else {
      params.set("tab", newTab);
    }
    router.replace(`/e/${eventCode}?${params.toString()}`, { scroll: false });
  };

  // Format date once
  const formattedDate = new Date(event.event_date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  /* ── Icons ── */
  const EventIcon = ({ active }: { active: boolean }) => (
    <svg className={`h-6 w-6 ${active ? "text-slate-900" : "text-slate-400"}`} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );

  const CameraIcon = ({ active }: { active: boolean }) => (
    <svg className={`h-6 w-6 ${active ? "text-white" : "text-slate-400"}`} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );

  const GalleryIcon = ({ active }: { active: boolean }) => (
    <svg className={`h-6 w-6 ${active ? "text-slate-900" : "text-slate-400"}`} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );

  return (
    <div className="relative min-h-screen bg-slate-50">
      
      {/* ── CONDITIONAL CONTENT ── */}

      {/* 1. EVENT HUB TAB */}
      {activeTab === "event" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <header className="sticky top-0 z-50 mx-auto flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white/80 px-4 backdrop-blur-md">
            <Link href="/dashboard" className="transition-opacity hover:opacity-80">
              <Image src="/logo.png" alt="Kenangan Kita" width={70} height={35} unoptimized className="object-contain" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-green-700">Live Hub</span>
              </div>
              {userMenuProps ? (
                <UserMenu avatarUrl={userMenuProps.avatarUrl} displayName={userMenuProps.displayName} />
              ) : (
                <Link href="/login" className="rounded-full bg-slate-900 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white transition-transform active:scale-95">
                  Sign In
                </Link>
              )}
            </div>
          </header>

          <main className="flex flex-col px-4 pb-32 pt-6">
            <section className="mb-8">
               <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200/60">
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl">
                    {initialHeroUrl ? (
                      <img src={initialHeroUrl} alt={event.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-300" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 text-left">
                      <div className="mb-4 flex items-center gap-4">
                         <div className="flex flex-col">
                            <span className="text-2xl font-black text-white leading-none">{initialStats.photoCount}</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">Memories</span>
                         </div>
                         <div className="h-8 w-px bg-white/20" />
                         <div className="flex flex-col">
                            <span className="text-2xl font-black text-white leading-none">{initialStats.guestCount}</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">Guests</span>
                         </div>
                      </div>
                      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">
                        {formattedDate}
                      </p>
                      <h2 className="text-3xl font-black leading-tight text-white tracking-tighter uppercase">
                        {event.name}
                      </h2>
                    </div>
                  </div>
               </div>
            </section>

            <section className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200/50">
              <h3 className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-slate-900">Invite to Group</h3>
              <p className="mb-8 text-xs text-slate-500 font-medium">Let others join by scanning your screen.</p>
              <div className="mx-auto max-w-[200px]">
                <QRCodeDisplay url={shareUrl} size={200} />
              </div>
            </section>

            <footer className="mt-16 pb-10 text-center opacity-40">
              <Image src="/logo.png" alt="Kenangan Kita" width={60} height={30} unoptimized className="mx-auto object-contain mb-2" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Digital Disposable Camera • {eventCode}</p>
            </footer>
          </main>
        </div>
      )}

      {/* 2. CAMERA TAB */}
      {activeTab === "camera" && (
        <div className="fixed inset-0 z-[60] bg-black animate-in fade-in zoom-in-95 duration-200">
           <CameraCaptureClient eventCode={eventCode} />
           {/* Overriding the default back behavior of CameraCaptureClient to use our state */}
           <button 
              onClick={() => handleTabChange("event")}
              className="absolute left-4 top-4 z-[70] flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md transition-all active:scale-90"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
           </button>
        </div>
      )}

      {/* 3. GALLERY TAB */}
      {activeTab === "gallery" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <header className="sticky top-0 z-50 mx-auto flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white/80 px-4 backdrop-blur-md">
            <button onClick={() => setActiveTab("event")} className="transition-opacity hover:opacity-80">
              <Image src="/logo.png" alt="Kenangan Kita" width={70} height={35} unoptimized className="object-contain" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-green-700">Live</span>
              </div>
              {userMenuProps && <UserMenu avatarUrl={userMenuProps.avatarUrl} displayName={userMenuProps.displayName} />}
            </div>
          </header>

          <section className="relative h-[240px] w-full overflow-hidden bg-slate-100">
             {initialHeroUrl ? (
               <img src={initialHeroUrl} alt={event.name} className="h-full w-full object-cover" />
             ) : (
               <div className="h-full w-full bg-gradient-to-br from-slate-700 to-slate-950" />
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
             <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-white">{initialStats.photoCount}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/60">Photos</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-white">{initialStats.guestCount}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/60">Guests</span>
                  </div>
                </div>
             </div>
          </section>

          <section className="px-2 pt-3 pb-32">
             <GalleryClient eventCode={eventCode} currentUserId={currentUserId} eventId={event.id} />
          </section>
        </div>
      )}

      {/* ── SHARED BOTTOM NAV ── */}
      <nav 
        className={`fixed inset-x-0 bottom-0 z-40 mx-auto flex h-20 max-w-[448px] items-center justify-around border-t border-slate-100 bg-white/80 px-4 pb-safe backdrop-blur-lg transition-transform duration-300 ease-in-out ${activeTab === "camera" ? "translate-y-full" : "translate-y-0"}`}
      >
        <button
          onClick={() => handleTabChange("event")}
          className="flex flex-1 flex-col items-center gap-1 transition-all active:scale-90"
        >
          <EventIcon active={activeTab === "event"} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${activeTab === "event" ? "text-slate-900" : "text-slate-400"}`}>
            Event
          </span>
        </button>

        <button
          onClick={() => handleTabChange("camera")}
          className={`relative -top-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-xl transition-all active:scale-95 ${activeTab === "camera" ? "bg-slate-900" : "bg-white border border-slate-100"}`}
        >
          <CameraIcon active={activeTab === "camera"} />
        </button>

        <button
          onClick={() => handleTabChange("gallery")}
          className="flex flex-1 flex-col items-center gap-1 transition-all active:scale-90"
        >
          <GalleryIcon active={activeTab === "gallery"} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${activeTab === "gallery" ? "text-slate-900" : "text-slate-400"}`}>
            Gallery
          </span>
        </button>
      </nav>

    </div>
  );
}
