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
  photoCount?: number;
};

type Props = { 
  events: Event[]; 
  creatorMap: Record<string, string>;
  onManageEvent?: (event: Event) => void;
};

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export default function AdminEventsClient({ events, creatorMap, onManageEvent }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null); // stores href being navigated to
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = (href: string) => {
    setLoading(href);
    router.push(href);
  };

  const busy = loading !== null;

  const filteredEvents = events.filter((event) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const hostName = (event.created_by ? creatorMap[event.created_by] : "Unknown")?.toLowerCase() || "";
    return (
      event.name.toLowerCase().includes(query) ||
      event.event_code.toLowerCase().includes(query) ||
      hostName.includes(query)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
         <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">All Events</h1>
      </div>
      
      {events.length > 0 && (
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, code, or host..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-medium text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
          />
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">search</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
      )}

      {events.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-100 p-10 text-center animate-in fade-in duration-300">
          <span className="material-symbols-outlined text-[40px] text-slate-200 mb-2">event_note</span>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">No events found</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => navigate("/events/new")}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            Create Event
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-100">
           <span className="material-symbols-outlined text-slate-200 text-4xl mb-2">search_off</span>
           <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No matching events</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredEvents.map((event) => {
            const href = `/admin/events/${event.id}`;
            const isThisLoading = loading === href;
            const expired = !isEventActive(event.event_date);
            
            return (
              <div
                key={event.id}
                className="group relative block w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-slate-300 hover:shadow-md"
              >
                {/* Loading overlay */}
                {isThisLoading && (
                  <span className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm">
                    <Spinner className="h-6 w-6 text-slate-900" />
                  </span>
                )}
                
                <div className={`flex items-start gap-4 w-full overflow-hidden ${isThisLoading ? "opacity-40" : busy ? "opacity-50" : ""}`}>
                  {/* Thumbnail Container */}
                  <div 
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl shadow-inner border border-white/20 flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, hsl(${(event.name.charCodeAt(0) * 137) % 360}, 80%, 75%), hsl(${((event.name.charCodeAt(0) * 137) + 40) % 360}, 70%, 60%))`
                    }}
                  >
                    <span className="text-3xl font-black text-white mix-blend-overlay opacity-90 drop-shadow-md">{event.name.charAt(0).toUpperCase()}</span>
                    
                    {/* Status Badge overlay (Top Left) */}
                    <div className="absolute top-1 left-1 flex items-center">
                       {expired ? (
                          <span className="rounded bg-amber-100/90 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest text-amber-800 backdrop-blur-sm shadow-sm border border-amber-200/50">Ended</span>
                       ) : !event.gallery_visible ? (
                          <span className="rounded bg-slate-100/90 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest text-slate-700 backdrop-blur-sm shadow-sm border border-slate-200/50">Hidden</span>
                       ) : (
                          <div className="flex items-center gap-1 rounded bg-green-100/90 px-1.5 py-0.5 backdrop-blur-sm shadow-sm border border-green-200/50">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse shrink-0" />
                            <span className="text-[7px] font-black uppercase tracking-widest text-green-800">Live</span>
                          </div>
                       )}
                    </div>

                    {/* Photo Count Badge overlay */}
                    {event.photoCount !== undefined && (
                      <div className="absolute bottom-1 right-1 flex items-center justify-center min-w-[20px] h-5 rounded bg-slate-900/80 px-1.5 backdrop-blur-md shadow-sm border border-slate-700/50">
                         <span className="text-[9px] font-black text-white">{event.photoCount}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Event Details */}
                  <div className="min-w-0 flex-1 grid grid-cols-1 gap-1 py-0.5">
                    <h3 className="truncate text-base font-bold text-slate-900 leading-tight w-full">{event.name}</h3>

                    <div className="flex items-center gap-2 overflow-hidden w-full mb-0.5">
                       <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-1.5 rounded shrink-0">{event.event_code}</span>
                       <span className="truncate text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                         {new Date(event.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                       </span>
                    </div>

                    <div className="flex items-center justify-between w-full mt-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 min-w-0 shrink">
                        <span className="material-symbols-outlined text-[12px] shrink-0">person</span>
                        <span className="truncate">{event.created_by ? (creatorMap[event.created_by] ?? "Unknown") : "Unknown"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onManageEvent?.(event);
                        }}
                        className="flex items-center justify-center p-1.5 rounded-lg bg-slate-50 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[18px]">settings</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
