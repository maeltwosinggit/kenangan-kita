"use client";

import { listEventPhotosByCode, softDeletePhoto, imprintPhoto } from "@kenangan/lib";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type PhotoItem = { id: string; imageUrl: string; nickname: string | null; uploader_id: string | null; captured_at: string };

type Props = {
  eventCode: string;
  eventName: string;
  currentUserId: string | null;
  eventId: string;
};

const PAGE_SIZE = 24;

function GallerySkeleton() {
  return (
    <div className="space-y-6">
      {[0, 1].map((g) => (
        <div key={g} className="space-y-3">
          <div className="h-3 w-32 animate-pulse rounded-full bg-slate-200" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-slate-200" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function GalleryClient({ eventCode, eventName, currentUserId, eventId }: Props) {
  const queryClient = useQueryClient();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [selected, setSelected] = useState<PhotoItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isVisible, setIsVisible] = useState(false);
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const [outgoing, setOutgoing] = useState<{ item: PhotoItem; startX: number; dir: "left" | "right" } | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number>(0);
  const isDragging = useRef(false);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);

  const allItems = useRef<PhotoItem[]>([]);

  const openPhoto = (item: PhotoItem, index: number) => {
    setSlideDir(null);
    setOutgoing(null);
    setSelected(item);
    setSelectedIndex(index);
    requestAnimationFrame(() => requestAnimationFrame(() => setIsVisible(true)));
  };

  const closePhoto = () => {
    setIsVisible(false);
    setOutgoing(null);
    setTimeout(() => {
      setSelected(null);
    }, 300);
  };

  const goTo = (index: number, dir: "left" | "right", startX = 0) => {
    const items = allItems.current;
    if (index < 0 || index >= items.length) return;
    setOutgoing({ item: selected!, startX, dir });
    setSlideDir(dir);
    setSelected(items[index]);
    setSelectedIndex(index);

    setTimeout(() => {
      setOutgoing(null);
      setSlideDir(null);
    }, 300);
  };

  const goPrev = () => goTo(selectedIndex - 1, "right");
  const goNext = () => goTo(selectedIndex + 1, "left");

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    touchCurrentX.current = dx;
    const c = imageContainerRef.current;
    if (!c) return;
    c.style.transform = `translateX(${dx}px)`;
    c.style.opacity = String(Math.max(0.35, 1 - Math.abs(dx) / 320));
  };

  const bounceBack = () => {
    touchCurrentX.current = 0;
    const c = imageContainerRef.current;
    if (!c) return;
    c.style.transition = "transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease";
    c.style.transform = "translateX(0)";
    c.style.opacity = "1";
    setTimeout(() => { 
        if (c) c.style.transition = ""; 
    }, 280);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current || touchStartX.current === null) return;
    isDragging.current = false;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 60) {
      const nextIndex = dx < 0 ? selectedIndex + 1 : selectedIndex - 1;
      const items = allItems.current;
      if (nextIndex < 0 || nextIndex >= items.length) {
        bounceBack();
        return;
      }
      const startX = touchCurrentX.current;
      touchCurrentX.current = 0;
      goTo(nextIndex, dx < 0 ? "left" : "right", startX);
    } else {
      bounceBack();
    }
  };

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Escape") closePhoto();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, selectedIndex]);

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [lightboxMenuOpen, setLightboxMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDownload = async (item: PhotoItem) => {
    try {
      const res = await fetch(item.imageUrl);
      const originalBlob = await res.blob();

      // Burn the orange stamp into the photo
      const imprintedBlob = await imprintPhoto(originalBlob, {
        nickname: item.nickname,
        capturedAt: item.captured_at,
        eventName: eventName
      });

      const url = URL.createObjectURL(imprintedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kenangan-${item.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (item: PhotoItem) => {
    if (deleting) return;
    setDeleting(true);
    try {
      await softDeletePhoto(item.id);
      setMenuOpenId(null);
      setLightboxMenuOpen(false);
      if (selected?.id === item.id) closePhoto();
      await query.refetch();
    } catch (err) { console.error(err); } finally {
      setDeleting(false);
    }
  };

  const query = useInfiniteQuery({
    queryKey: ["gallery", eventCode],
    queryFn: ({ pageParam = 0 }) =>
      listEventPhotosByCode({ eventCode, page: pageParam, pageSize: PAGE_SIZE }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    initialPageParam: 0
  });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`gallery-${eventId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "photos", filter: `event_id=eq.${eventId}` },
        async (payload) => {
          const newPhoto = payload.new as any;
          if (!newPhoto || newPhoto.is_deleted) return;
          const { data: signed } = await supabase.storage.from("event-photos").createSignedUrl(newPhoto.storage_path, 3600);
          if (!signed?.signedUrl) return;
          const newItem: PhotoItem = { id: newPhoto.id, imageUrl: signed.signedUrl, nickname: newPhoto.nickname, uploader_id: newPhoto.uploader_id, captured_at: newPhoto.captured_at };
          queryClient.setQueryData(["gallery", eventCode], (oldData: any) => {
            if (!oldData) return oldData;
            const alreadyExists = oldData.pages.some((page: any) => page.items.some((item: any) => item.id === newItem.id));
            if (alreadyExists) return oldData;
            const firstPage = oldData.pages[0];
            return { ...oldData, pages: [{ ...firstPage, items: [newItem, ...firstPage.items] }, ...oldData.pages.slice(1)] };
          });
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, eventCode, queryClient]);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && query.hasNextPage && !query.isFetchingNextPage) { query.fetchNextPage(); }
    }, { rootMargin: "120px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [query]);

  if (query.isLoading) return <GallerySkeleton />;
  if (query.isError) return <div className="p-4 text-center text-xs text-red-500">Failed to load photos.</div>;
  if (!query.data) return null;

  const items = query.data.pages.flatMap((page) => page.items);
  allItems.current = items;

  const groups: { label: string; items: PhotoItem[] }[] = [];
  for (const item of items) {
    const label = new Date(item.captured_at).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(item); else groups.push({ label, items: [item] });
  }

  // PORTAL FOR LIGHTBOX (To avoid parent transform constraints)
  const Lightbox = (selected && typeof document !== "undefined") ? createPortal(
    <div className={["fixed inset-0 z-[1000] flex flex-col bg-black transition-opacity duration-300", isVisible ? "opacity-100" : "opacity-0"].join(" ")} onClick={closePhoto}>
      <style>{`
        @keyframes kk-slide-in-right { from { transform: translateX(110%); opacity: 0.4; } to { transform: translateX(0); opacity: 1; } }
        @keyframes kk-slide-in-left { from { transform: translateX(-110%); opacity: 0.4; } to { transform: translateX(0); opacity: 1; } }
        @keyframes kk-exit-left { from { transform: translateX(var(--exit-x, 0px)); opacity: var(--exit-op, 1); } to { transform: translateX(-115%); opacity: 0; } }
        @keyframes kk-exit-right { from { transform: translateX(var(--exit-x, 0px)); opacity: var(--exit-op, 1); } to { transform: translateX(115%); opacity: 0; } }
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
        .fuji-imprint { font-family: 'Share Tech Mono', monospace; color: #f97316; text-shadow: 0 0 8px rgba(249,115,22,0.8); letter-spacing: 0.08em; }
      `}</style>
      <div className={["flex items-center justify-between px-4 py-3 transition-transform duration-300", isVisible ? "translate-y-0" : "-translate-y-4"].join(" ")} onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col"><span className="text-sm font-medium text-white">{selected.nickname ?? "Guest"}</span><span className="text-xs text-white/60">{new Date(selected.captured_at).toLocaleString()}</span></div>
        <div className="flex items-center gap-1">
          <button onClick={() => setLightboxMenuOpen(!lightboxMenuOpen)} className="flex h-10 w-10 items-center justify-center rounded-full text-white"><svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg></button>
          {lightboxMenuOpen && (
            <div className="absolute right-4 top-14 z-[1100] min-w-[160px] rounded-xl bg-white shadow-xl ring-1 ring-slate-200">
              <button onClick={(e) => { e.stopPropagation(); handleDownload(selected); setLightboxMenuOpen(false); }} className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors">Download</button>
              {selected.uploader_id === currentUserId && <button onClick={(e) => { e.stopPropagation(); handleDelete(selected); }} className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors">Delete</button>}
            </div>
          )}
          <button onClick={closePhoto} className="flex h-10 w-10 items-center justify-center rounded-full text-white"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
        </div>
      </div>
      <div className="relative flex flex-1 overflow-hidden" onTouchStart={(e) => { if (outgoing) return; touchStartX.current = e.touches[0].clientX; touchCurrentX.current = 0; isDragging.current = true; if (imageContainerRef.current) imageContainerRef.current.style.transition = ""; }} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        {outgoing && <div key={`out-${outgoing.item.id}`} style={{ "--exit-x": `${outgoing.startX}px`, "--exit-op": String(Math.max(0.35, 1 - Math.abs(outgoing.startX) / 320)), animation: `${outgoing.dir === "left" ? "kk-exit-left" : "kk-exit-right"} 0.26s ease-out forwards` } as any} className="absolute inset-0 flex items-center justify-center px-10"><img src={outgoing.item.imageUrl} className="max-h-full max-w-full rounded-lg object-contain" alt="" /></div>}
        <div key={selected.id} ref={imageContainerRef} style={slideDir ? { animation: `kk-slide-in-${slideDir === "left" ? "right" : "left"} 0.26s ease-out` } : undefined} className="absolute inset-0 flex items-center justify-center px-4">
          <div className={["relative max-h-full max-w-full transition-all duration-300", isVisible ? "scale-100 opacity-100" : "scale-90 opacity-0"].join(" ")} onClick={(e) => e.stopPropagation()}>
            <img src={selected.imageUrl} alt="" className="block max-h-[75dvh] max-w-full rounded-lg object-contain" />
            <div className="pointer-events-none absolute inset-0 rounded-lg" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`, mixBlendMode: "overlay", opacity: 0.55 }} />
            <div className="pointer-events-none absolute inset-0 rounded-lg" style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)" }} />
            
            {/* ── EDITORIAL FUJI STAMP OVERLAY ── */}
            {/* Top Right: Branding */}
            <div className="pointer-events-none absolute top-4 right-4 text-right">
               <span className="fuji-imprint text-[10px] tracking-[0.2em] opacity-50 uppercase">
                • Kenangan Kita •
              </span>
            </div>

            {/* Bottom Right: Metadata */}
            <div className="pointer-events-none absolute bottom-4 right-4 flex flex-col items-end gap-0.5 text-right">
              {/* Time */}
              <span className="fuji-imprint text-[18px] font-bold leading-none">
                {new Date(selected.captured_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
              </span>
              {/* Date */}
              <span className="fuji-imprint text-[11px] leading-none opacity-90">
                {new Date(selected.captured_at).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, ".")}
              </span>
              {/* Event Name */}
              <span className="fuji-imprint text-[10px] font-bold leading-none mt-1 opacity-90 uppercase">
                {eventName}
              </span>
              {/* Capturer */}
              {selected.nickname && (
                <span className="fuji-imprint text-[10px] leading-none opacity-80 uppercase">
                  {selected.nickname}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      {Lightbox}
      
      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group.label}>
            <h2 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{group.label}</h2>
            <div className="grid grid-cols-2 gap-2">
              {group.items.map((item, idx) => (
                <article key={item.id} className="group relative rounded-lg overflow-hidden bg-slate-200 aspect-[3/4]">
                  <button onClick={() => openPhoto(item, idx)} className="h-full w-full">
                    <img src={item.imageUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent px-2 py-3 flex justify-between items-end">
                      <span className="truncate text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-sm">{item.nickname ?? "Guest"}</span>
                      <span className="ml-2 shrink-0 text-[10px] font-bold text-white/80 drop-shadow-sm uppercase tracking-wider">
                        {new Date(item.captured_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}
                      </span>
                    </div>
                  </button>
                  <div className="absolute right-1 top-1 z-10">
                    <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === item.id ? null : item.id); }} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md transition-colors hover:bg-black/40 active:scale-90">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
                    </button>
                    {menuOpenId === item.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                        <div className="absolute right-0 mt-1 z-20 min-w-[120px] overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-200">
                          <button onClick={(e) => { e.stopPropagation(); handleDownload(item); setMenuOpenId(null); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Download</button>
                          {item.uploader_id === currentUserId && <button onClick={(e) => { e.stopPropagation(); handleDelete(item); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors">Delete</button>}
                        </div>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div ref={sentinelRef} className="h-20" />
    </>
  );
}
