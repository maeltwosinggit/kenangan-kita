"use client";

import { useEffect, useState } from "react";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { listAllEventPhotos, generatePhotobookData, getEventStats, type PhotobookData } from "@kenangan/lib";
import { PhotobookPDF } from "@/components/photobook/photobook-pdf";
import Link from "next/link";

export default function PreviewClient({ eventCode, eventId, eventName }: { eventCode: string, eventId: string, eventName: string }) {
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

        const bookData = generatePhotobookData(eventName, photos, stats.guestCount);
        setData(bookData);
      } catch (err: any) {
        setError(err.message || "Failed to generate photobook preview.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventId, eventName]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900">
      
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
          <span className="text-xs font-bold uppercase tracking-widest text-white">Photobook Preview</span>
          <span className="text-[10px] text-white/50">{eventName}</span>
        </div>

        {data && !loading ? (
          <PDFDownloadLink
            document={<PhotobookPDF data={data} />}
            fileName={`photobook-${eventName.toLowerCase().replace(/\s+/g, '-')}.pdf`}
            className="flex items-center gap-1.5 rounded-full bg-green-600 px-4 py-1.5 transition-all active:scale-95 hover:bg-green-500"
          >
            {({ loading: pdfLoading }) => (
              <>
                {pdfLoading ? (
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-white">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                  {pdfLoading ? "Wait" : "Save"}
                </span>
              </>
            )}
          </PDFDownloadLink>
        ) : (
          <div className="w-[84px]" />
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 relative bg-slate-900 flex items-center justify-center">
        {loading && (
          <div className="flex flex-col items-center gap-4 text-white/60">
            <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-xs font-bold uppercase tracking-[0.2em] animate-pulse">Rendering Photobook...</p>
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
          <div className="absolute inset-0 h-full w-full">
            <PDFViewer width="100%" height="100%" showToolbar={false} className="border-none">
              <PhotobookPDF data={data} />
            </PDFViewer>
          </div>
        )}
      </div>

    </div>
  );
}
