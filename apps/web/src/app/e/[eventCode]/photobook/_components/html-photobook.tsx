"use client";

import { PhotobookData, PhotobookPage } from "@kenangan/lib";
import { useState } from "react";
import Image from "next/image";

function formatFuji(photo: any) {
  const d = new Date(photo.captured_at);
  const dateStr = d.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, ".");
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${dateStr} ${timeStr}`;
}

function PageContent({ page, eventName }: { page: PhotobookPage, eventName: string }) {
  return (
    <div className="absolute inset-0 bg-white p-6 md:p-10 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4 shrink-0">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 uppercase tracking-tighter">{eventName}</h2>
        <span className="text-[8px] md:text-[10px] font-semibold text-slate-400 tracking-widest">• KENANGAN KITA •</span>
      </div>

      {/* Body */}
      <div className="flex-1 relative">
        {page.template === "hero" && (
          <div className="w-full h-full relative">
            <img src={page.photos[0].imageUrl} className="w-full h-full object-cover rounded-lg" alt="" />
            <div className="absolute bottom-4 right-4 text-orange-500 font-mono text-sm md:text-base font-bold drop-shadow-md">
              {formatFuji(page.photos[0])}
            </div>
          </div>
        )}
        
        {page.template === "duo" && (
          <div className="flex gap-4 h-full">
            {page.photos.map((p) => (
              <div key={p.id} className="flex-1 relative">
                <img src={p.imageUrl} className="w-full h-full object-cover rounded-lg" alt="" />
                <div className="absolute bottom-3 right-3 text-orange-500 font-mono text-xs font-bold drop-shadow-md">
                  {formatFuji(p)}
                </div>
              </div>
            ))}
          </div>
        )}

        {page.template === "mosaic" && (
          <div className="grid grid-cols-2 gap-3 h-full content-start overflow-hidden">
            {page.photos.map((p) => (
              <div key={p.id} className="aspect-square relative">
                <img src={p.imageUrl} className="w-full h-full object-cover rounded-md" alt="" />
              </div>
            ))}
          </div>
        )}

        {page.template === "scrapbook" && (
          <div className="relative h-full w-full">
            {page.photos.map((p, i) => {
              const offsets = [
                { top: "5%", left: "5%", width: "55%", transform: "rotate(-3deg)", zIndex: 1 },
                { top: "15%", right: "5%", width: "45%", transform: "rotate(4deg)", zIndex: 2 },
                { bottom: "5%", left: "20%", width: "60%", transform: "rotate(-1deg)", zIndex: 3 },
              ];
              const style = offsets[i % offsets.length];
              return (
                <div key={p.id} className="absolute bg-white p-2 shadow-lg border border-slate-100" style={{...style}}>
                  <img src={p.imageUrl} className="w-full aspect-[4/3] object-cover" alt="" />
                  <div className="text-orange-500 font-mono text-[8px] md:text-xs font-bold mt-1 text-right">
                    {formatFuji(p)}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {page.template === "stats" && (
          <div className="h-full flex flex-col items-center justify-center bg-slate-50 rounded-xl p-6 text-center">
            {page.stats.type === "early-bird" && (
              <>
                <h3 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-[0.3em] mb-4">The Early Bird</h3>
                <p className="text-sm md:text-base text-slate-500">First memory captured by</p>
                <p className="text-3xl md:text-4xl font-black text-slate-900 mt-2">{page.stats.photo?.nickname || "A Guest"}</p>
                <div className="flex gap-8 mt-12">
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-slate-900">{page.stats.totalPhotos}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Memories</div>
                  </div>
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-slate-900">{page.stats.guestCount}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Guests</div>
                  </div>
                </div>
              </>
            )}
            {page.stats.type === "peak-hour" && (
              <>
                <h3 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-[0.3em] mb-4">The Rush Hour</h3>
                <p className="text-5xl md:text-6xl font-black text-slate-900 mt-2">{page.stats.data?.hour}:00</p>
                <p className="text-sm text-slate-500 mt-4">with {page.stats.data?.count} photos taken in 60 minutes.</p>
              </>
            )}
            {page.stats.type === "night-owl" && (
              <>
                <h3 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-[0.3em] mb-4">The Night Owl</h3>
                <p className="text-sm md:text-base text-slate-500">Final memory captured by</p>
                <p className="text-3xl md:text-4xl font-black text-slate-900 mt-2">{page.stats.photo?.nickname || "A Guest"}</p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center text-[8px] md:text-[10px] text-slate-300 tracking-widest uppercase">
        {eventName} — Digital Souvenir
      </div>
    </div>
  )
}

export function HtmlPhotobook({ data }: { data: PhotobookData }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const goNext = () => setCurrentIndex(i => Math.min(i + 1, data.pages.length - 1));
  const goPrev = () => setCurrentIndex(i => Math.max(i - 1, 0));

  const page = data.pages[currentIndex];

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto h-full justify-center px-4 md:px-12 py-8">
      
      {/* Book Container (Landscape aspect ratio) */}
      <div className="relative w-full aspect-[1.414/1] max-h-[70vh] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-r-lg border-l-[12px] border-slate-300 overflow-hidden ring-1 ring-slate-200">
         
         {/* Subtle inner spine shadow */}
         <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/20 to-transparent z-10 pointer-events-none" />

         <PageContent key={page.id} page={page} eventName={data.title} />
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-between w-full mt-8 md:px-10">
        <button 
          onClick={goPrev} 
          disabled={currentIndex === 0}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95 disabled:opacity-20"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-6 w-6"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        
        <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-white tracking-widest font-mono">
              {currentIndex + 1} / {data.pages.length}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-white/50 mt-1">Page</span>
        </div>
        
        <button 
          onClick={goNext} 
          disabled={currentIndex === data.pages.length - 1}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95 disabled:opacity-20"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-6 w-6"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>
    </div>
  )
}
