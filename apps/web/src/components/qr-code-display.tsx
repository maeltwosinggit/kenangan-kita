"use client";

import { QRCodeCanvas } from "qrcode.react";

interface QRCodeDisplayProps {
  url: string;
  size?: number;
}

export function QRCodeDisplay({ url, size = 200 }: QRCodeDisplayProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <QRCodeCanvas 
          value={url} 
          size={size} 
          level="H" 
          includeMargin={false} 
          fgColor="#0f172a" 
        />
      </div>
    </div>
  );
}
