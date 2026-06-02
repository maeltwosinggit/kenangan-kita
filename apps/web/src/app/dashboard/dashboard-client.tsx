"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { DashboardData, RecentPhoto, CreatedEvent } from "@/lib/data/dashboard";
import { EventCard } from "./_components/event-card";
import UserMenu from "@/components/user-menu";
import CreateEventForm from "@/app/events/new/create-event-client";
import { ManageEventSheet } from "./_components/manage-event-sheet";

type Props = DashboardData & {
  firstName: string;
  displayName: string;
  avatarUrl: string | null;
};

type Tab = "dashboard" | "create" | "events";

function PhotoStrip({ photos }: { photos: RecentPhoto[] }) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-tight text-slate-900">My Recent Photos</h2>
      <div className="flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {photos.map((photo) => (
          <div key={photo.id} className="relative h-48 w-36 flex-shrink-0 snap-start overflow-hidden rounded-xl">
            {photo.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.imageUrl} alt={photo.eventName ?? "Photo"} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-200">
                <svg className="h-8 w-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 flex h-16 items-end bg-gradient-to-t from-black/80 to-transparent p-2">
              <span className="text-[10px] font-medium text-white/90">{photo.eventName ?? ""}</span>
            </div>
          </div>
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

  const getTabIndex = (t: Tab) => {
    if (t === "dashboard") return 0;
    if (t === "create") return 1;
    if (t === "events") return 2;
    return 0;
  };

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
          className="flex h-full w-[300%] transition-transform duration-300 ease-in-out items-start"
          style={{ transform: `translateX(-${(getTabIndex(tab) * 100) / 3}%)` }}
        >
          {/* Dashboard tab */}
          <div className="w-1/3 h-full overflow-y-auto shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <main className="mx-auto max-w-[448px] space-y-8 px-4 pb-28 pt-6">
              <section className="space-y-1">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Hello, {firstName}</h1>
                <p className="text-sm text-slate-500">Welcome back to your memory hub.</p>
                </section>
              <section className="grid grid-cols-2 gap-4">
                {[
                  { value: photosTaken, label: "Photos Taken" },
                  { value: eventsAttended, label: "Events Attended" },
                ].map(({ value, label }) => (
                  <div key={label} className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 text-center">
                    <span className="text-3xl font-black text-slate-900">{value.toString().padStart(2, "0")}</span>
                    <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
                  </div>
                ))}
              </section>

              {recentPhotos.length > 0 && <PhotoStrip photos={recentPhotos} />}

              {participatedEvents.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-sm font-bold uppercase tracking-tight text-slate-900">My Events</h2>
                  <div className="space-y-3">
                    {participatedEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </section>
              )}

              {participatedEvents.length === 0 && recentPhotos.length === 0 && (
                <section className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center">
                  <p className="text-sm text-slate-500">No photos yet. Scan a QR code at an event to get started.</p>
                </section>
              )}
            </main>
          </div>

          {/* Create tab */}
          <div className="w-1/3 h-full overflow-y-auto shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <main className="mx-auto max-w-[448px] pb-28">
              <div className="px-4 pt-6">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Create Event</h1>
                <p className="mt-1 text-sm text-slate-500">Set up a new event and share the link with guests.</p>
              </div>
              <CreateEventForm onSuccess={(res) => setTab("events")} />
            </main>
          </div>

          {/* Events tab */}
          <div className="w-1/3 h-full overflow-y-auto shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <main className="mx-auto max-w-[448px] px-4 pb-28 pt-6">
              {/* Page header */}
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900">My Events</h1>
                  <p className="mt-1 text-sm text-slate-500">Manage your shared memories</p>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setTab("create")}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-all active:scale-[0.97] hover:bg-slate-800"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    New Event
                  </button>
                )}
              </div>

              {/* Events list */}
              {createdEvents.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-12 text-center">
                  <svg className="mx-auto mb-3 h-10 w-10 text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <p className="text-sm font-medium text-slate-500">No events yet.</p>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setTab("create")}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white"
                    >
                      Create your first event
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {createdEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      isCreated
                      onManage={() => setManagingEvent(event)}
                    />
                  ))}
                </div>
              )}
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

