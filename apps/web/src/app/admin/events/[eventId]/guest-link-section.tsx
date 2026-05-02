"use client";

import { useState } from "react";

import { QRCodeDisplay } from "@/components/qr-code-display";

interface GuestLinkSectionProps {
  eventId: string;
  eventCode: string;
  fullUrl: string;
}

export function GuestLinkSection({ eventId, eventCode, fullUrl }: GuestLinkSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4">
        <QRCodeDisplay url={fullUrl} size={150} />
      </div>

      <p className="text-xs text-slate-700 font-medium mb-2">Guest Link</p>
      <div className="rounded border border-slate-300 bg-white p-2 text-xs text-slate-800 font-mono break-all mb-3">
        {fullUrl}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 rounded bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors"
          >
            {copied ? "Copied!" : "Copy Link"}
          </button>
          <a
            href={`/e/${eventCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-center hover:bg-slate-50 transition-colors"
          >
            Open Link
          </a>
        </div>
        <a
          href={`/admin/events/${eventId}/print`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 text-center hover:bg-slate-50 transition-colors"
        >
          Print QR Card 🖨️
        </a>
      </div>
    </div>
  );
}