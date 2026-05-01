"use client";

import { listEventPhotosByCode, softDeletePhoto } from "@kenangan/lib";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

type Props = {
  eventCode: string;
  currentUserId: string | null;
};

const PAGE_SIZE = 24;

type PhotoItem = { id: string; imageUrl: string; nickname: string | null; uploader_id: string | null; captured_at: string };

export function GalleryClient({ eventCode, currentUserId }: Props) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [selected, setSelected] = useState<PhotoItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isVisible, setIsVisible] = useState(false);
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  // outgoing: the photo that is animating OUT simultaneously with the new one animating in
  const [outgoing, setOutgoing] = useState<{ item: PhotoItem; startX: number; dir: "left" | "right" } | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number>(0);
  const isDragging = useRef(false);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);

  // flat ordered list, updated whenever query data changes
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
    setTimeout(() => setSelected(null), 300);
  };

  // goTo: sets both outgoing (exit) and selected (enter) simultaneously — no black gap
  const goTo = (index: number, dir: "left" | "right", startX = 0) => {
    const items = allItems.current;
    if (index < 0 || index >= items.length) return;
    setOutgoing({ item: selected!, startX, dir });
    setSlideDir(dir);
    setSelected(items[index]);
    setSelectedIndex(index);
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
    const ref = c;
    setTimeout(() => { ref.style.transition = ""; }, 280);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current || touchStartX.current === null) return;
    isDragging.current = false;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 60) {
      const nextIndex = dx < 0 ? selectedIndex + 1 : selectedIndex - 1;
      const items = allItems.current;
      // Boundary guard: bounce back if no photo in that direction
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

  // Keyboard navigation
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Escape") closePhoto();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, selectedIndex]);

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [lightboxMenuOpen, setLightboxMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDownload = async (item: PhotoItem) => {
    try {
      const res = await fetch(item.imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `photo-${item.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
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
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  const query = useInfiniteQuery({
    queryKey: ["gallery", eventCode],
    queryFn: ({ pageParam = 0 }) =>
      listEventPhotosByCode({
        eventCode,
        page: pageParam,
        pageSize: PAGE_SIZE
      }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    initialPageParam: 0
  });

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
          query.fetchNextPage();
        }
      },
      { rootMargin: "120px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [query]);

  if (query.isLoading) {
    return (
      <div className="mt-4 space-y-6">
        {[0, 1].map((g) => (
          <div key={g}>
            {/* Date label skeleton */}
            <div className="mb-2 h-3 w-40 animate-pulse rounded-full bg-slate-200" />
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="relative overflow-hidden rounded-lg bg-slate-200">
                  <div className="h-44 w-full animate-pulse bg-slate-200" />
                  {/* Shimmer sweep */}
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                  {/* Bottom bar skeleton */}
                  <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-2 py-1.5">
                    <div className="h-2.5 w-16 rounded-full bg-slate-300/60" />
                    <div className="h-2.5 w-10 rounded-full bg-slate-300/60" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        Failed to load gallery. Please try again.
      </p>
    );
  }

  if (!query.data) return null;

  const firstPage = query.data.pages[0];
  if (!firstPage.galleryOpen) {
    return (
      <div className="mt-4 rounded border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-700">
        Gallery is hidden for now. Please come back after the event ends.
      </div>
    );
  }

  const items = query.data!.pages.flatMap((page) => page.items);
  allItems.current = items;
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
          <svg className="h-9 w-9 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <div>
          <p className="text-base font-bold text-slate-900">No photos yet</p>
          <p className="mt-1 text-sm text-slate-500">Be the first to capture a memory!</p>
        </div>
      </div>
    );
  }

  // Group items by local date string
  const groups: { label: string; items: typeof items }[] = [];
  for (const item of items) {
    const label = new Date(item.captured_at).toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  }

  return (
    <>
    <style>{`
      @keyframes kk-slide-in-right {
        from { transform: translateX(110%); opacity: 0.4; }
        to   { transform: translateX(0);    opacity: 1;   }
      }
      @keyframes kk-slide-in-left {
        from { transform: translateX(-110%); opacity: 0.4; }
        to   { transform: translateX(0);     opacity: 1;   }
      }
    `}</style>
    {/* Lightbox overlay */}
    {selected && (
      <div
        className={[
          "fixed inset-0 z-50 flex flex-col bg-black transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0",
        ].join(" ")}
        onClick={closePhoto}
      >
        {/* Header */}
        <div
          className={[
            "flex items-center justify-between px-4 py-3 transition-transform duration-300",
            isVisible ? "translate-y-0" : "-translate-y-4",
          ].join(" ")}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">{selected.nickname ?? ""}</span>
            <span className="text-xs text-white/60">
              {new Date(selected.captured_at).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* Three-dot menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLightboxMenuOpen((v) => !v)}
                aria-label="More options"
                className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10 active:scale-95"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
              {lightboxMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setLightboxMenuOpen(false)} />
                  <div className="absolute right-0 top-11 z-20 min-w-[160px] overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-200">
                    <button
                      type="button"
                      onClick={() => { handleDownload(selected); setLightboxMenuOpen(false); }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download
                    </button>
                    {selected.uploader_id === currentUserId && currentUserId && (
                      <button
                        type="button"
                        onClick={() => handleDelete(selected)}
                        disabled={deleting}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                        </svg>
                        {deleting ? "Deleting…" : "Delete"}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
            {/* Close button */}
            <button
              type="button"
              onClick={closePhoto}
              aria-label="Close"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10 active:scale-95"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
        {/* Image */}
        <div
          className="relative flex flex-1 overflow-hidden pb-6"
          onTouchStart={(e) => {
            if (outgoing) return; // ignore new gesture during transition
            touchStartX.current = e.touches[0].clientX;
            touchCurrentX.current = 0;
            isDragging.current = true;
            const c = imageContainerRef.current;
            if (c) c.style.transition = "";
          }}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={closePhoto}
        >
          {/* Outgoing photo — exits simultaneously with incoming entering */}
          {outgoing && (
            <div
              key={`out-${outgoing.item.id}`}
              ref={(el) => {
                if (!el) return;
                // Start from the exact drag position, then animate to off-screen
                el.style.transform = `translateX(${outgoing.startX}px)`;
                el.style.opacity = String(Math.max(0.35, 1 - Math.abs(outgoing.startX) / 320));
                requestAnimationFrame(() => {
                  el.style.transition = "transform 0.26s ease-out, opacity 0.22s ease-out";
                  el.style.transform = `translateX(${outgoing.dir === "left" ? "-115%" : "115%"})`;
                  el.style.opacity = "0";
                });
              }}
              onTransitionEnd={() => setOutgoing(null)}
              className="absolute inset-0 flex items-center justify-center px-10 pointer-events-none"
              aria-hidden
            >
              <img
                src={outgoing.item.imageUrl}
                className="max-h-full max-w-full rounded-lg object-contain"
                alt=""
              />
            </div>
          )}
          {/* Incoming photo — slides in from opposite side */}
          <div
            key={selected.id}
            ref={imageContainerRef}
            style={slideDir ? {
              animation: `kk-slide-in-${slideDir === "left" ? "right" : "left"} 0.26s ease-out`,
            } : undefined}
            onAnimationEnd={() => setSlideDir(null)}
            className="absolute inset-0 flex items-center justify-center px-10"
          >
            <img
              src={selected.imageUrl}
              alt={`Photo by ${selected.nickname ?? "guest"}`}
              onClick={(e) => e.stopPropagation()}
              className={[
                "max-h-full max-w-full rounded-lg object-contain transition-all duration-300",
                isVisible ? "scale-100 opacity-100" : "scale-90 opacity-0",
              ].join(" ")}
            />
          </div>
          {/* Preload adjacent images to eliminate load delay */}
          {allItems.current[selectedIndex - 1] && (
            <img key={`pre-${allItems.current[selectedIndex - 1].id}`} src={allItems.current[selectedIndex - 1].imageUrl} className="hidden" aria-hidden alt="" />
          )}
          {allItems.current[selectedIndex + 1] && (
            <img key={`pre-${allItems.current[selectedIndex + 1].id}`} src={allItems.current[selectedIndex + 1].imageUrl} className="hidden" aria-hidden alt="" />
          )}
          {/* Prev arrow */}
          {selectedIndex > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 active:scale-90"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          {/* Next arrow */}
          {selectedIndex < allItems.current.length - 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 active:scale-90"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>
      </div>
    )}
    <section className="mt-4 space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {group.label}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {group.items.map((item) => (
              <article key={item.id} className="relative rounded-lg">
                {item.imageUrl ? (
                  <>
                    {/* Tappable card */}
                    <div className="relative overflow-hidden rounded-lg bg-slate-200">
                      <button
                        type="button"
                        className="block w-full text-left focus:outline-none"
                        onClick={() => openPhoto(item, allItems.current.findIndex((i) => i.id === item.id))}
                        aria-label={`View photo by ${item.nickname ?? "guest"}`}
                      >
                        <img
                          src={item.imageUrl}
                          alt={`Event photo ${item.id}`}
                          className="h-44 w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                          <span className="truncate text-xs font-medium text-white drop-shadow">
                            {item.nickname ?? ""}
                          </span>
                          <span className="ml-2 shrink-0 text-xs text-white/80 drop-shadow">
                            {new Date(item.captured_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}
                          </span>
                        </div>
                      </button>
                    </div>
                    {/* Three-dot menu button */}
                    <div className="absolute right-1 top-1 z-10">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === item.id ? null : item.id); }}
                        aria-label="More options"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 active:scale-90"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                          <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                        </svg>
                      </button>
                      {menuOpenId === item.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                          <div className="absolute right-0 top-8 z-20 min-w-[150px] overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-200">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDownload(item); setMenuOpenId(null); }}
                              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                              Download
                            </button>
                            {item.uploader_id === currentUserId && currentUserId && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                                disabled={deleting}
                                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                                </svg>
                                {deleting ? "Deleting…" : "Delete"}
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex h-44 items-center justify-center rounded-lg bg-slate-200 text-xs text-slate-500">Image unavailable</div>
                )}
              </article>
            ))}
          </div>
        </div>
      ))}

      <div ref={sentinelRef} className="h-6" />
      {query.isFetchingNextPage && <p className="text-center text-xs text-slate-500">Loading more...</p>}
    </section>
    </>  
  );
}

