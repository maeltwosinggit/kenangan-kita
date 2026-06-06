"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { isEventActive } from "@kenangan/lib";

type Event = {
  id: string;
  name: string;
  event_date: string;
  event_code: string;
  gallery_visible: boolean;
  reveal_mode: string;
  created_by: string | null;
  latestPhotoUrl: string | null;
  photoCount?: number;
};

type Props = { events: Event[]; creatorMap: Record<string, string> };

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export default function AdminEventsClient({ events, creatorMap }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null); // stores href being navigated to

  const navigate = (href: string) => {
    setLoading(href);
    router.push(href);
  };

  const busy = loading !== null;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin Events</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => navigate("/admin/users")}
            className="flex items-center gap-1.5 rounded border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 disabled:opacity-60"
          >
            {loading === "/admin/users" ? <><Spinner className="h-3 w-3" />Loading...</> : "Users"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => navigate("/events/new")}
            className="flex items-center gap-1.5 rounded bg-slate-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
          >
            {loading === "/events/new" ? <><Spinner className="h-3 w-3" />Loading...</> : "New Event"}
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded border border-slate-200 p-6 text-center">
          <p className="text-sm text-slate-600">No events created yet.</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => navigate("/events/new")}
            className="mt-3 inline-block text-sm font-medium text-slate-900 underline disabled:opacity-60"
          >
            Create your first event
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => {
            const href = `/admin/events/${event.id}`;
            const isThisLoading = loading === href;
            const expired = !isEventActive(event.event_date);
            
            return (
              <button
                key={event.id}
                type="button"
                disabled={busy}
                onClick={() => navigate(href)}
                className="group relative block w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-slate-300 hover:shadow-md disabled:cursor-default"
              >
                {/* Loading overlay */}
                {isThisLoading && (
                  <span className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm">
                    <Spinner className="h-6 w-6 text-slate-900" />
                  </span>
                )}
                
                <div className={`flex items-start gap-4 ${isThisLoading ? "opacity-40" : busy ? "opacity-50" : ""}`}>
                  {/* Thumbnail Container */}
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
                    {event.latestPhotoUrl ? (
                      <img
                        src={event.latestPhotoUrl}
                        alt={`Latest from ${event.name}`}
                        className={["h-full w-full object-cover transition-transform group-hover:scale-105", expired ? "grayscale opacity-80" : ""].join(" ")}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                         <span className="material-symbols-outlined text-[24px]">image</span>
                      </div>
                    )}
                    {/* Photo Count Badge overlay */}
                    {event.photoCount !== undefined && (
                      <div className="absolute bottom-1 right-1 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-white backdrop-blur-md">
                         <span className="material-symbols-outlined text-[10px]">photo_library</span>
                         <span className="text-[10px] font-bold">{event.photoCount}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Event Details */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-start justify-between gap-2">
                       <h3 className="truncate text-base font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{event.name}</h3>
                       
                       {/* Standardized Status */}
                       <div className="shrink-0">
                         {expired ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-amber-700 ring-1 ring-amber-200">Ended</span>
                         ) : !event.gallery_visible ? (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-slate-600 ring-1 ring-slate-200">Hidden</span>
                         ) : (
                            <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-0.5 ring-1 ring-green-200">
                              <span className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                              <span className="text-[8px] font-black uppercase tracking-widest text-green-700">Live</span>
                            </div>
                         )}
                       </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                       <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-1.5 rounded shrink-0">{event.event_code}</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                         {new Date(event.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                       </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                       {event.created_by && (
                         <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 min-w-0">
                            <span className="material-symbols-outlined text-[12px] shrink-0">person</span>
                            <span className="truncate max-w-[100px]">{creatorMap[event.created_by] ?? "Unknown Host"}</span>
                         </div>
                       )}
                       <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 shrink-0">
                          <span className="material-symbols-outlined text-[12px] shrink-0">{event.reveal_mode === 'instant' ? 'visibility' : 'visibility_off'}</span>
                          <span className="whitespace-nowrap">{event.reveal_mode === 'instant' ? 'Instant Reveal' : 'Reveal After'}</span>
                       </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
