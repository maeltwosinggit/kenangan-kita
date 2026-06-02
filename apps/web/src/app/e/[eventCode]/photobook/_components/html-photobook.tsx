"use client";

import { PhotobookData, PhotobookPage } from "@kenangan/lib";
import { useState, useRef } from "react";

function formatFuji(photo: any) {
  const d = new Date(photo.captured_at);
  const dateStr = d.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, ".");
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${dateStr} ${timeStr}`;
}

function PageContent({ page, eventName }: { page: PhotobookPage, eventName: string }) {
  return (
    <div className="absolute inset-0 bg-white p-4 md:p-10 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-2 md:pb-3 mb-3 md:mb-4 shrink-0">
        <h2 className="text-lg md:text-2xl font-bold text-slate-900 uppercase tracking-tighter truncate pr-4">{eventName}</h2>
        <span className="text-[8px] md:text-[10px] font-semibold text-slate-400 tracking-widest shrink-0">• KENANGAN KITA •</span>
      </div>

      {/* Body */}
      <div className="flex-1 relative min-h-0">
        {page.template === "hero" && (
          <div className="w-full h-full relative rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shadow-inner">
            <img src={page.photos[0].imageUrl} className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110" alt="" draggable={false} />
            <img src={page.photos[0].imageUrl} className="relative z-10 max-w-full max-h-full object-contain rounded shadow-lg" alt="" draggable={false} />
            <div className="absolute bottom-3 right-3 z-20 text-orange-600 font-mono text-[10px] md:text-sm font-bold bg-white/90 px-2 py-1 rounded shadow-sm backdrop-blur-sm border border-white/50">
              {formatFuji(page.photos[0])}
            </div>
          </div>
        )}
        
        {page.template === "duo" && (
          <div className="flex gap-2 md:gap-4 h-full">
            {page.photos.map((p) => (
              <div key={p.id} className="flex-1 relative rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shadow-inner">
                <img src={p.imageUrl} className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110" alt="" draggable={false} />
                <img src={p.imageUrl} className="relative z-10 max-w-full max-h-full object-contain rounded shadow-md" alt="" draggable={false} />
                <div className="absolute bottom-2 right-2 z-20 text-orange-600 font-mono text-[8px] md:text-xs font-bold bg-white/90 px-1.5 py-0.5 rounded shadow-sm backdrop-blur-sm border border-white/50">
                  {formatFuji(p)}
                </div>
              </div>
            ))}
          </div>
        )}

        {page.template === "mosaic" && (
          <div className="grid grid-cols-2 gap-2 h-full content-start overflow-hidden rounded-lg">
            {page.photos.map((p) => (
              <div key={p.id} className="aspect-square relative bg-slate-100">
                <img src={p.imageUrl} className="w-full h-full object-cover" alt="" draggable={false} />
              </div>
            ))}
          </div>
        )}

        {page.template === "scrapbook" && (
          <div className="relative h-full w-full bg-slate-50 rounded-lg shadow-inner overflow-hidden">
            {page.photos.map((p, i) => {
              const offsets = [
                { top: "5%", left: "5%", width: "55%", transform: "rotate(-3deg)", zIndex: 1 },
                { top: "15%", right: "5%", width: "45%", transform: "rotate(4deg)", zIndex: 2 },
                { bottom: "5%", left: "20%", width: "60%", transform: "rotate(-1deg)", zIndex: 3 },
              ];
              const style = offsets[i % offsets.length];
              return (
                <div key={p.id} className="absolute bg-white p-1.5 md:p-2 shadow-lg border border-slate-200" style={{...style}}>
                  <img src={p.imageUrl} className="w-full aspect-[4/3] object-cover" alt="" draggable={false} />
                  <div className="text-orange-500 font-mono text-[8px] md:text-xs font-bold mt-1 text-right">
                    {formatFuji(p)}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {page.template === "stats" && (
          <div className="h-full flex flex-col items-center justify-center bg-slate-50 rounded-xl p-4 md:p-6 text-center shadow-inner border border-slate-100">
            {page.stats.type === "early-bird" && (
              <>
                <h3 className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-[0.3em] mb-2 md:mb-4">The Early Bird</h3>
                <p className="text-xs md:text-base text-slate-500">First memory captured by</p>
                <p className="text-2xl md:text-4xl font-black text-slate-900 mt-1 md:mt-2 truncate w-full px-4">{page.stats.photo?.nickname || "A Guest"}</p>
                <div className="flex gap-6 md:gap-8 mt-6 md:mt-12">
                  <div>
                    <div className="text-2xl md:text-4xl font-bold text-slate-900">{page.stats.totalPhotos}</div>
                    <div className="text-[8px] md:text-[10px] text-slate-400 uppercase tracking-widest mt-1">Memories</div>
                  </div>
                  <div>
                    <div className="text-2xl md:text-4xl font-bold text-slate-900">{page.stats.guestCount}</div>
                    <div className="text-[8px] md:text-[10px] text-slate-400 uppercase tracking-widest mt-1">Guests</div>
                  </div>
                </div>
              </>
            )}
            {page.stats.type === "peak-hour" && (
              <>
                <h3 className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-[0.3em] mb-2 md:mb-4">The Rush Hour</h3>
                <p className="text-4xl md:text-6xl font-black text-slate-900 mt-2">{page.stats.data?.hour}:00</p>
                <p className="text-xs md:text-sm text-slate-500 mt-2 md:mt-4 px-4">with {page.stats.data?.count} photos taken in 60 minutes.</p>
              </>
            )}
            {page.stats.type === "night-owl" && (
              <>
                <h3 className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-[0.3em] mb-2 md:mb-4">The Night Owl</h3>
                <p className="text-xs md:text-base text-slate-500">Final memory captured by</p>
                <p className="text-2xl md:text-4xl font-black text-slate-900 mt-1 md:mt-2 truncate w-full px-4">{page.stats.photo?.nickname || "A Guest"}</p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="absolute bottom-2 md:bottom-4 left-0 right-0 text-center text-[6px] md:text-[8px] text-slate-300 tracking-widest uppercase">
        {eventName} — Digital Souvenir
      </div>
    </div>
  )
}

export function HtmlPhotobook({ data }: { data: PhotobookData }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animState, setAnimState] = useState<"idle" | "flipping-out-next" | "flipping-in-next" | "flipping-out-prev" | "flipping-in-prev">("idle");
  const touchStartX = useRef<number | null>(null);
  
  const FLIP_DURATION = 200; // ms per half-flip

  const goNext = () => {
    if (currentIndex < data.pages.length - 1 && animState === "idle") {
      setAnimState("flipping-out-next");
      setTimeout(() => {
        setCurrentIndex(i => i + 1);
        setAnimState("flipping-in-next");
        setTimeout(() => setAnimState("idle"), FLIP_DURATION);
      }, FLIP_DURATION);
    }
  };
  
  const goPrev = () => {
    if (currentIndex > 0 && animState === "idle") {
      setAnimState("flipping-out-prev");
      setTimeout(() => {
        setCurrentIndex(i => i - 1);
        setAnimState("flipping-in-prev");
        setTimeout(() => setAnimState("idle"), FLIP_DURATION);
      }, FLIP_DURATION);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    
    if (diff > 50) goPrev();
    else if (diff < -50) goNext();
    
    touchStartX.current = null;
  };

  // Determine 3D transform based on animation state
  let transformStyle = "perspective(1200px) rotateY(0deg)";
  if (animState === "flipping-out-next") transformStyle = "perspective(1200px) rotateY(-90deg)";
  if (animState === "flipping-in-next") transformStyle = "perspective(1200px) rotateY(90deg)";
  if (animState === "flipping-out-prev") transformStyle = "perspective(1200px) rotateY(90deg)";
  if (animState === "flipping-in-prev") transformStyle = "perspective(1200px) rotateY(-90deg)";

  const page = data.pages[currentIndex];

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto h-full justify-center px-2 py-4 md:p-8 overflow-hidden">
      
      {/* 
         Book Container: Responsive aspect ratio that scales to fit mobile screens.
         Using max-h-[60vh] and computing max-width based on that ensures it never clips the bottom.
      */}
      <div 
        className="relative w-full max-h-[65vh] max-w-[calc(65vh*1.414)] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.4)] rounded-r-lg border-l-[12px] border-slate-300 ring-1 ring-slate-200"
        style={{ 
          aspectRatio: '1.414 / 1', 
          transform: transformStyle,
          transition: animState === "idle" ? "none" : `transform ${FLIP_DURATION}ms ease-in-out`
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
         {/* Subtle inner spine shadow */}
         <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/20 to-transparent z-10 pointer-events-none" />

         <PageContent key={page.id} page={page} eventName={data.title} />
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-between w-full max-w-[calc(65vh*1.414)] mt-6 md:mt-8 px-2 md:px-4 shrink-0">
        <button 
          onClick={goPrev} 
          disabled={currentIndex === 0 || animState !== "idle"}
          className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95 disabled:opacity-20 backdrop-blur-sm"
          aria-label="Previous Page"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5 md:h-6 md:w-6"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        
        <div className="flex flex-col items-center">
            <span className="text-sm md:text-base font-bold text-white tracking-widest font-mono drop-shadow-md">
              {currentIndex + 1} / {data.pages.length}
            </span>
            <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-white/50 mt-1">Page</span>
        </div>
        
        <button 
          onClick={goNext} 
          disabled={currentIndex === data.pages.length - 1 || animState !== "idle"}
          className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95 disabled:opacity-20 backdrop-blur-sm"
          aria-label="Next Page"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5 md:h-6 md:w-6"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>
    </div>
  )
}

