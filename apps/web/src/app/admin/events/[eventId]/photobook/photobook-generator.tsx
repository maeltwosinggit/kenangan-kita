"use client";

import { useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { listAllEventPhotos, generatePhotobookData, getEventStats } from "@kenangan/lib";
import { PhotobookPDF } from "@/components/photobook/photobook-pdf";

type Props = {
  eventId: string;
  eventName: string;
};

export function PhotobookGenerator({ eventId, eventName }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePrepare = async () => {
    setLoading(true);
    setError(null);
    try {
      const [photos, stats] = await Promise.all([
        listAllEventPhotos(eventId),
        getEventStats(eventId)
      ]);

      if (photos.length === 0) {
        throw new Error("No photos found for this event.");
      }

      const bookData = generatePhotobookData(eventName, photos, stats.guestCount);
      setData(bookData);
    } catch (err: any) {
      setError(err.message || "Failed to prepare photobook.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">A4 Landscape Photobook</h3>
          <p className="text-xs text-slate-500 mt-1">Generate a high-quality PDF memory book of this event.</p>
        </div>
        <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
           </svg>
        </div>
      </div>

      {!data && !loading && (
        <button
          onClick={handlePrepare}
          className="w-full rounded-lg bg-slate-900 py-3 text-sm font-bold text-white transition-all active:scale-95 hover:bg-slate-800"
        >
          Prepare Photobook
        </button>
      )}

      {loading && (
        <div className="flex w-full items-center justify-center gap-3 rounded-lg bg-slate-50 py-3 text-sm font-semibold text-slate-600">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Organizing Memories...
        </div>
      )}

      {data && !loading && (
        <div className="space-y-3">
          <PDFDownloadLink
            document={<PhotobookPDF data={data} />}
            fileName={`photobook-${eventName.toLowerCase().replace(/\s+/g, '-')}.pdf`}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-3 text-sm font-bold text-white transition-all active:scale-95 hover:bg-green-700"
          >
            {({ loading: pdfLoading }) => (
              pdfLoading ? "Rendering PDF..." : "Download PDF"
            )}
          </PDFDownloadLink>
          <button 
            onClick={() => setData(null)}
            className="w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-600"
          >
            Reset
          </button>
        </div>
      )}

      {error && (
        <p className="mt-3 text-center text-xs font-bold text-red-500 uppercase tracking-tight">{error}</p>
      )}
    </div>
  );
}
