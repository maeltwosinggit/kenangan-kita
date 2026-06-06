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
        <div className="space-y-3">
          {events.map((event) => {
            const href = `/admin/events/${event.id}`;
            const isThisLoading = loading === href;
            return (
              <button
                key={event.id}
                type="button"
                disabled={busy}
                onClick={() => navigate(href)}
                className="relative block w-full rounded border border-slate-200 p-4 text-left transition-colors hover:bg-slate-50 disabled:cursor-default"
              >
                {/* Loading overlay on the clicked card */}
                {isThisLoading && (
                  <span className="absolute inset-0 flex items-center justify-center rounded bg-white/60">
                    <Spinner className="h-5 w-5 text-slate-600" />
                  </span>
                )}
                <div className={`flex items-start gap-3 ${isThisLoading ? "opacity-40" : busy ? "opacity-50" : ""}`}>
                  {event.latestPhotoUrl ? (
                    <img
                      src={event.latestPhotoUrl}
                      alt={`Latest from ${event.name}`}
                      className="h-12 w-12 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-slate-100 text-xs text-slate-500">
                      No photos
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium">{event.name}</h3>
                    <p className="text-sm text-slate-600">
                      {new Date(event.event_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500">Code: {event.event_code}</p>
                    {event.created_by && (
                      <p className="text-xs text-slate-400">
                        By: {creatorMap[event.created_by] ?? event.created_by.slice(0, 8)}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                      {(() => {
                        const expired = !isEventActive(event.event_date);
                        if (expired) {
                          return <span className="rounded px-1.5 py-0.5 bg-amber-100 text-amber-700">Ended</span>;
                        }
                        if (!event.gallery_visible) {
                          return <span className="rounded px-1.5 py-0.5 bg-slate-100 text-slate-500">Hidden</span>;
                        }
                        return <span className="rounded px-1.5 py-0.5 bg-green-100 text-green-700">Live</span>;
                      })()}
                      <span className="text-slate-400 font-bold">
                        {event.reveal_mode === "instant"
                          ? "Instant Reveal"
                          : "Reveal After Event"}
                      </span>
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
