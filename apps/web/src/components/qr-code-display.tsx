"use client";

import { QRCodeCanvas } from "qrcode.react";
import { useRef } from "react";

interface QRCodeDisplayProps {
  url: string;
  size?: number;
}

export function QRCodeDisplay({ url, size = 200 }: QRCodeDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!containerRef.current) return;
    const canvas = containerRef.current.querySelector("canvas");
    if (!canvas) return;

    const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = "event-qr-code.png";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        ref={containerRef}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <QRCodeCanvas 
          value={url} 
          size={size} 
          level="H" 
          includeMargin={false} 
          fgColor="#0f172a" 
        />
      </div>
      <button
        type="button"
        onClick={handleDownload}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors print:hidden"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Download QR
      </button>
    </div>
  );
}
