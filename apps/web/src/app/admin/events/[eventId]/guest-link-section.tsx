"use client";

import { useState } from "react";

interface GuestLinkSectionProps {
  eventCode: string;
  fullUrl: string;
}

export function GuestLinkSection({ eventCode, fullUrl }: GuestLinkSectionProps) {
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
    <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs text-slate-700 font-medium mb-2">Guest Link</p>
      <div className="rounded border border-slate-300 bg-white p-2 text-xs text-slate-800 font-mono break-all mb-3">
        {fullUrl}
      </div>
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
          className="flex-1 rounded border border-slate-300 px-3 py-2 text-xs font-medium text-center hover:bg-slate-100 transition-colors"
        >
          Open Link
        </a>
      </div>
    </div>
  );
}