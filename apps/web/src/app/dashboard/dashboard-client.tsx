"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { DashboardData, RecentPhoto, CreatedEvent } from "@/lib/data/dashboard";
import { EventCard } from "./_components/event-card";
import UserMenu from "@/components/user-menu";
import CreateEventForm from "@/app/events/new/create-event-client";
import { ManageEventSheet } from "./_components/manage-event-sheet";
import { getEventByCode } from "@kenangan/lib";
import { useRouter } from "next/navigation";

type Props = DashboardData & {
  firstName: string;
  displayName: string;
  avatarUrl: string | null;
};

type Tab = "dashboard" | "create" | "events";

function PhotoStrip({ photos }: { photos: RecentPhoto[] }) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between px-1">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Your Film Roll</h2>
        <span className="text-[10px] font-bold text-slate-300">RECENT</span>
      </div>
      <div className="flex snap-x gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-1">
        {photos.map((photo) => (
          <Link 
            href={`/e/${photo.eventCode}?tab=gallery`}
            key={photo.id} 
            className="group relative h-56 w-40 flex-shrink-0 snap-start overflow-hidden rounded-sm bg-white p-1.5 shadow-md transition-transform hover:-rotate-1 active:scale-95"
          >
            {/* Film Perforations */}
            <div className="absolute left-1 top-0 bottom-0 flex flex-col justify-between py-2 z-10 opacity-20">
              {[...Array(6)].map((_, i) => <div key={i} className="w-1.5 h-2 bg-black rounded-sm" />)}
            </div>
            <div className="absolute right-1 top-0 bottom-0 flex flex-col justify-between py-2 z-10 opacity-20">
              {[...Array(6)].map((_, i) => <div key={i} className="w-1.5 h-2 bg-black rounded-sm" />)}
            </div>

            <div className="h-[82%] w-full overflow-hidden bg-slate-100">
              {photo.imageUrl ? (
                <img src={photo.imageUrl} alt={photo.eventName ?? "Photo"} className="h-full w-full object-cover grayscale-[0.2] transition-all group-hover:grayscale-0" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-200">
                  <span className="material-symbols-outlined text-slate-400">image</span>
                </div>
              )}
            </div>
            <div className="mt-2 px-1">
               <p className="truncate font-mono text-[9px] font-bold uppercase tracking-tighter text-slate-800">
                {photo.eventName || "Untitled"}
               </p>
               <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">
                #{photo.eventCode}
               </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function DashboardClient({
  firstName,
  displayName,
  avatarUrl,
  isAdmin,
  photosTaken,
  eventsAttended,
  recentPhotos,
  participatedEvents,
  createdEvents,
}: Props) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [managingEvent, setManagingEvent] = useState<CreatedEvent | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<"all" | "hosted" | "joined">("all");
  const router = useRouter();

  const getTabIndex = (t: Tab) => {
    if (t === "dashboard") return 0;
    if (t === "create") return 1;
    if (t === "events") return 2;
    return 0;
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;

    setIsJoining(true);
    setJoinError(null);

    try {
      const event = await getEventByCode(code);
      if (event) {
        router.push(`/e/${code}`);
      } else {
        setJoinError("Code not found");
        // Clear error after a shake animation or 3 seconds
        setTimeout(() => setJoinError(null), 3000);
      }
    } catch (err) {
      setJoinError("Error joining group");
    } finally {
      setIsJoining(false);
    }
  };

  const featuredPhoto = recentPhotos[0];

  return (
    <div className="flex h-screen flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-200 bg-white z-40">
        <div className="mx-auto flex h-16 max-w-[448px] items-center justify-between px-4">
          <Link href="/dashboard">
            <Image src="/logo.png" alt="Kenangan Kita" width={80} height={40} unoptimized className="object-contain" />
          </Link>
          <UserMenu avatarUrl={avatarUrl} displayName={displayName} isAdmin={isAdmin} />
        </div>
      </header>

      {/* Swipeable Tabs Container */}
      <div className="flex-1 relative overflow-hidden">
        <div 
          className="flex h-full w-[300%] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform"
          style={{ transform: `translate3d(-${(getTabIndex(tab) * 100) / 3}%, 0, 0)` }}
        >
          {/* Dashboard tab */}
          <div className="w-1/3 h-full overflow-y-auto shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overscroll-none">
            <main className="mx-auto max-w-[448px] space-y-8 px-4 pb-32 pt-6">

              {/* ── HERO: FEATURED MEMORY ── */}
              <section className="relative pt-2">
                <div className="relative mx-auto w-[90%] rotate-[-2deg] bg-white p-3 shadow-xl ring-1 ring-slate-200 transition-transform hover:rotate-0">
                  <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
                    {featuredPhoto?.imageUrl ? (
                      <img src={featuredPhoto.imageUrl} alt="Featured" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                        <span className="material-symbols-outlined text-slate-300 text-6xl">photo_camera</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/5" />
                  </div>
                  <div className="pt-4 pb-1 text-center">
                    <p className="font-['DS-Digital'] text-2xl text-orange-500 opacity-80 leading-none tracking-widest">
                      {new Date().toLocaleDateString('en-GB', { year: '2-digit', month: '2-digit', day: '2-digit' }).replace(/\//g, ' . ')}
                    </p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                      Recently Captured
                    </p>
                  </div>
                </div>
                {/* Visual Accent */}
                <div className="absolute -left-2 top-10 h-20 w-1 bg-slate-900/10 rounded-full" />
                <div className="absolute -right-2 bottom-20 h-16 w-1 bg-slate-900/10 rounded-full" />
              </section>

              {/* ── GREETING ── */}
              <section className="text-center px-4">
                <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">
                  Hi, {firstName}!
                </h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Ready to make new memories?
                </p>
              </section>

              {/* ── QUICK ACTIONS ── */}
              <section className="grid grid-cols-2 gap-3 px-2">
                <form onSubmit={handleJoin} className="relative group">
                  <input 
                    type="text" 
                    placeholder="CODE"
                    value={joinCode}
                    disabled={isJoining}
                    onChange={(e) => {
                      setJoinCode(e.target.value.toUpperCase());
                      if (joinError) setJoinError(null);
                    }}
                    className={[
                      "w-full h-14 rounded-2xl bg-white border pl-4 pr-10 text-sm font-black tracking-[0.2em] focus:ring-2 focus:outline-none shadow-sm transition-all",
                      joinError 
                        ? "border-red-500 ring-red-500 animate-shake" 
                        : "border-slate-200 focus:ring-slate-900"
                    ].join(" ")}
                  />
                  <button 
                    type="submit"
                    disabled={isJoining || !joinCode}
                    className="absolute right-2 top-2 h-10 w-10 flex items-center justify-center rounded-xl bg-slate-900 text-white transition-transform active:scale-90 disabled:opacity-50"
                  >
                    {isJoining ? (
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    ) : (
                      <span className="material-symbols-outlined">arrow_forward</span>
                    )}
                  </button>
                  <label className={[
                    "absolute -top-2 left-4 bg-white px-2 text-[8px] font-black uppercase tracking-widest transition-colors",
                    joinError ? "text-red-500" : "text-slate-400"
                  ].join(" ")}>
                    {joinError || "Join Group"}
                  </label>
                </form>

                <button 
                  onClick={() => setTab("create")}
                  className="h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center gap-3 px-4 shadow-lg shadow-slate-200 transition-transform active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                  <span className="text-[11px] font-black uppercase tracking-widest">Host Event</span>
                </button>
              </section>

              {/* ── STATS: THE ACHIEVEMENTS ── */}
              <section className="grid grid-cols-2 gap-4 px-2">
                {[
                  { value: photosTaken, label: "Snapshots", icon: "camera" },
                  { value: eventsAttended, label: "Journeys", icon: "explore" },
                ].map(({ value, label, icon }) => (
                  <div key={label} className="relative overflow-hidden flex flex-col items-center rounded-2xl bg-white border border-slate-200 p-6 text-center group transition-colors hover:border-slate-300">
                    <span className="material-symbols-outlined text-slate-100 text-6xl absolute -right-4 -bottom-4 rotate-12 transition-transform group-hover:rotate-0">{icon}</span>
                    <span className="text-4xl font-black text-slate-900 relative z-10">{value.toString().padStart(2, "0")}</span>
                    <span className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 relative z-10">{label}</span>
                  </div>
                ))}
              </section>

              {recentPhotos.length > 0 && <PhotoStrip photos={recentPhotos} />}

              {participatedEvents.length > 0 && (
                <section className="space-y-4 px-2">
                  <div className="flex items-end justify-between">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Recent Highlights</h2>
                    <button 
                      onClick={() => setTab("events")}
                      className="text-[10px] font-bold text-slate-900 uppercase tracking-wider underline-offset-4 hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {participatedEvents.slice(0, 3).map((event) => {
                      const isCreator = createdEvents.some(ce => ce.id === event.id);
                      return (
                        <EventCard 
                          key={event.id} 
                          event={event} 
                          isCreated={isCreator} 
                          onManage={isCreator ? () => {
                            setTab("events");
                            setManagingEvent(createdEvents.find(ce => ce.id === event.id) || null);
                          } : undefined}
                        />
                      );
                    })}
                  </div>
                </section>
              )}

              {participatedEvents.length === 0 && recentPhotos.length === 0 && (
                <section className="rounded-2xl border-2 border-dashed border-slate-200 px-4 py-16 text-center mx-2">
                  <span className="material-symbols-outlined text-slate-300 text-5xl mb-4">auto_stories</span>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    Your story begins here.<br/>Scan a QR to start capturing.
                  </p>
                </section>
              )}
            </main>
          </div>


          {/* Create tab */}
          <div className="w-1/3 h-full overflow-y-auto shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overscroll-none">
            <main className="mx-auto max-w-[448px] pb-28">
              <div className="px-4 pt-6">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Create Event</h1>
                <p className="mt-1 text-sm text-slate-500">Set up a new event and share the link with guests.</p>
              </div>
              <CreateEventForm onSuccess={(res) => setTab("events")} />
            </main>
          </div>

          {/* Events tab */}
          <div className="w-1/3 h-full overflow-y-auto shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overscroll-none">
            <main className="mx-auto max-w-[448px] px-4 pb-32 pt-6">
              {/* Page header */}
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">My Events</h1>
                  <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">The Memory Vault</p>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setTab("create")}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-200 transition-all active:scale-90"
                  >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                  </button>
                )}
              </div>

              {/* Segmented Filter */}
              <div className="mb-6 flex p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                {(["all", "hosted", "joined"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setEventFilter(f)}
                    className={[
                      "flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl",
                      eventFilter === f ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-600"
                    ].join(" ")}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Events list */}
              {(() => {
                const filtered = participatedEvents.filter(event => {
                  const isCreator = createdEvents.some(ce => ce.id === event.id);
                  if (eventFilter === "hosted") return isCreator;
                  if (eventFilter === "joined") return !isCreator;
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="rounded-2xl border-2 border-dashed border-slate-100 px-4 py-20 text-center">
                      <span className="material-symbols-outlined text-slate-200 text-5xl mb-4">folder_open</span>
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No {eventFilter === "all" ? "" : eventFilter} events found</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {filtered.map((event) => {
                      const isCreator = createdEvents.some(ce => ce.id === event.id);
                      return (
                        <EventCard
                          key={event.id}
                          event={event}
                          isCreated={isCreator}
                          onManage={isCreator ? () => setManagingEvent(createdEvents.find(ce => ce.id === event.id) || null) : undefined}
                        />
                      );
                    })}
                  </div>
                );
              })()}
            </main>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <ManageEventSheet
        event={managingEvent}
        isOpen={managingEvent !== null}
        onClose={() => setManagingEvent(null)}
        onDeleted={() => { window.location.reload(); }}
      />
      <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-20 max-w-[448px] items-center justify-around border-t border-slate-200 bg-white/90 px-6 backdrop-blur-md">
        <NavButton active={tab === "dashboard"} onClick={() => setTab("dashboard")} label="Dashboard">
          {tab === "dashboard" ? (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" />
              <rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" />
            </svg>
          ) : (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" />
              <rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" />
            </svg>
          )}
        </NavButton>

        {/* Create button — prominent pill in the middle */}
        <button
          type="button"
          onClick={() => setTab("create")}
          aria-label="Create event"
          className={[
            "flex h-12 w-12 items-center justify-center rounded-full shadow-md transition-transform active:scale-95",
            tab === "create" ? "bg-slate-900 text-white" : "bg-slate-900 text-white",
          ].join(" ")}
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <NavButton active={tab === "events"} onClick={() => setTab("events")} label="My Events">
          {tab === "events" ? (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" fill="currentColor" opacity="0.15" />
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          ) : (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          )}
        </NavButton>
      </nav>
    </div>
  );
}

function NavButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={["flex flex-col items-center justify-center transition-colors", active ? "text-slate-900" : "text-slate-400 hover:text-slate-700"].join(" ")}
    >
      {children}
      <span className="mt-1 text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

