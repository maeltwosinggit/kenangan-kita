"use client";

import { useEffect, useState } from "react";
import { listAllEventPhotos, generatePhotobookData, getEventStats, type PhotobookData } from "@kenangan/lib";
import Link from "next/link";
import { HtmlPhotobook } from "./_components/html-photobook";

export default function PreviewClient({ eventCode, eventId, eventName, coverUrl }: { eventCode: string, eventId: string, eventName: string, coverUrl: string | null }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PhotobookData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [photos, stats] = await Promise.all([
          listAllEventPhotos(eventId),
          getEventStats(eventId)
        ]);

        if (photos.length === 0) {
          throw new Error("No photos available for this event yet.");
        }

        const bookData = generatePhotobookData(eventName, photos, stats.guestCount, coverUrl);
        setData(bookData);
      } catch (err: any) {
        setError(err.message || "Failed to generate photobook preview.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventId, eventName, coverUrl]);

  return (
    <div className="fixed inset-0 z-[100] flex h-screen-fix flex-col bg-slate-900 pt-safe">
      
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-slate-800 bg-slate-950">
        <Link 
          href={`/e/${eventCode}?tab=gallery`} 
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
             <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold uppercase tracking-widest text-white">Photobook</span>
          <span className="text-[10px] text-white/50">{eventName}</span>
        </div>

        <div className="w-10" /> {/* Balance */}
      </header>

      {/* Main Content */}
      <div className="flex-1 relative bg-slate-900 flex items-center justify-center overflow-hidden">
        {loading && (
          <div className="flex flex-col items-center gap-4 text-white/60">
            <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-xs font-bold uppercase tracking-[0.2em] animate-pulse">Organizing Memories...</p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-red-500/10 p-6 text-center border border-red-500/20 max-w-[300px]">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto h-8 w-8 text-red-500 mb-3">
               <circle cx="12" cy="12" r="10" />
               <line x1="12" y1="8" x2="12" y2="12" />
               <line x1="12" y1="16" x2="12.01" y2="16" />
             </svg>
             <p className="text-sm font-bold text-red-400">{error}</p>
          </div>
        )}

        {data && !loading && !error && (
          <HtmlPhotobook data={data} />
        )}
      </div>

    </div>
  );
}
