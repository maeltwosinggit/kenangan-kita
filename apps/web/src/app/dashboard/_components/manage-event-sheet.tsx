"use client";

import { useState, useEffect, useRef } from "react";
import {
  listEventPhotosForAdmin,
  setEventGalleryVisibility,
  softDeletePhoto,
  deleteEvent,
} from "@kenangan/lib";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreatedEvent } from "@/lib/data/dashboard";
import { QRCodeDisplay } from "@/components/qr-code-display";

type Props = {
  event: CreatedEvent;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (eventId: string) => void;
};

const PAGE_SIZE = 12;

function useEventUrl(eventCode: string) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const origin = window.location.origin;
    setUrl(`${origin}/e/${eventCode}`);
  }, [eventCode]);
  return url;
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

type Section = "overview" | "photos" | "danger";

export function ManageEventSheet({ event, isOpen, onClose, onDeleted }: Props) {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();
  const guestUrl = useEventUrl(event.event_code);
  const [copied, setCopied] = useState(false);
  const [galleryVisible, setGalleryVisible] = useState(event.isOpen);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Lock body scroll while sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Reset state when sheet opens for a different event
  useEffect(() => {
    if (isOpen) {
      setGalleryVisible(event.isOpen);
      setShowDeleteConfirm(false);
      setActiveSection("overview");
    }
  }, [isOpen, event.id, event.isOpen]);

  const photosQuery = useInfiniteQuery({
    queryKey: ["creator-photos", event.id],
    queryFn: ({ pageParam = 0 }) =>
      listEventPhotosForAdmin({ eventId: event.id, page: pageParam as number, pageSize: PAGE_SIZE }),
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    initialPageParam: 0,
    enabled: isOpen && activeSection === "photos",
  });

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && photosQuery.hasNextPage && !photosQuery.isFetchingNextPage) {
        photosQuery.fetchNextPage();
      }
    }, { rootMargin: "80px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [photosQuery]);

  const photos = photosQuery.data?.pages.flatMap((p) => p.items) ?? [];

  const visibilityMutation = useMutation({
    mutationFn: (next: boolean) => setEventGalleryVisibility(event.id, next),
    onSuccess: (updated) => {
      setGalleryVisible(updated.gallery_visible);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: string) => softDeletePhoto(photoId),
    onSuccess: () => photosQuery.refetch(),
  });

  const deleteEventMutation = useMutation({
    mutationFn: () => deleteEvent(supabase, event.id),
    onSuccess: () => {
      onClose();
      onDeleted(event.id);
    },
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(guestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (!isOpen) return null;

  const sectionBtn = (s: Section, label: string) => (
    <button
      type="button"
      onClick={() => setActiveSection(s)}
      className={[
        "rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors",
        activeSection === s
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200",
      ].join(" ")}
    >
      {label}
    </button>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Manage ${event.name}`}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[448px] rounded-t-2xl bg-white shadow-2xl"
        style={{ maxHeight: "90dvh", display: "flex", flexDirection: "column" }}
      >
        {/* Drag handle + header */}
        <div className="shrink-0 px-4 pb-3 pt-4">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-slate-900">{event.name}</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {new Date(event.event_date).toLocaleDateString("en-US", {
                  month: "long", day: "numeric", year: "numeric",
                })}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={[
                  "rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                  galleryVisible
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-500",
                ].join(" ")}
              >
                {galleryVisible ? "Open" : "Closed"}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Section tabs */}
          <div className="mt-3 flex gap-2">
            {sectionBtn("overview", "Overview")}
            {sectionBtn("photos", "Photos")}
            {sectionBtn("danger", "Danger")}
          </div>
        </div>

        <div className="divider h-px bg-slate-100 shrink-0" />

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-4">

          {/* ── OVERVIEW ── */}
          {activeSection === "overview" && (
            <>
              {/* Guest link + QR */}
              <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Guest Link & QR</h3>
                {guestUrl && (
                  <div className="flex justify-center">
                    <QRCodeDisplay url={guestUrl} size={130} />
                  </div>
                )}
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-[11px] text-slate-700 break-all">
                  {guestUrl || "Loading…"}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex-1 rounded-lg bg-slate-900 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-800 active:scale-[0.98]"
                  >
                    {copied ? "Copied ✓" : "Copy Link"}
                  </button>
                  <a
                    href={`/e/${event.event_code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-lg border border-slate-200 py-2.5 text-center text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Open Link
                  </a>
                  <a
                    href={`/admin/events/${event.id}/print`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-lg border border-slate-200 py-2.5 text-center text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Print QR
                  </a>
                </div>
              </section>

              {/* Gallery visibility */}
              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Gallery Visibility</h3>
                <p className="mt-2 text-sm text-slate-700">
                  Gallery is currently{" "}
                  <span className={galleryVisible ? "font-semibold text-green-700" : "font-semibold text-slate-500"}>
                    {galleryVisible ? "open" : "closed"}
                  </span>{" "}
                  — guests {galleryVisible ? "can" : "cannot"} see uploaded photos.
                </p>
                {visibilityMutation.isError && (
                  <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    Failed to update. Please try again.
                  </p>
                )}
                <button
                  type="button"
                  disabled={visibilityMutation.isPending}
                  onClick={() => visibilityMutation.mutate(!galleryVisible)}
                  className={[
                    "mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-60",
                    galleryVisible
                      ? "border border-slate-200 text-slate-700 hover:bg-slate-50"
                      : "bg-green-600 text-white hover:bg-green-700",
                  ].join(" ")}
                >
                  {visibilityMutation.isPending ? <Spinner /> : null}
                  {visibilityMutation.isPending
                    ? "Updating…"
                    : galleryVisible
                      ? "Close Gallery"
                      : "Open Gallery"}
                </button>
              </section>

              {/* Event details */}
              <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Event Details</h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Event code</span>
                  <span className="font-mono font-semibold text-slate-900">{event.event_code}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Event date</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(event.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </section>
            </>
          )}

          {/* ── PHOTOS ── */}
          {activeSection === "photos" && (
            <section>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                Uploaded Photos
              </h3>
              {photosQuery.isLoading && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Spinner /> Loading photos…
                </div>
              )}
              {photosQuery.isError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  Failed to load photos. Please try again.
                </p>
              )}
              {!photosQuery.isLoading && photos.length === 0 && (
                <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                  No photos uploaded yet.
                </p>
              )}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo) => (
                    <div key={photo.id} className="group relative overflow-hidden rounded-xl bg-slate-100 aspect-square">
                      {photo.imageUrl ? (
                        <img
                          src={photo.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}
                      {/* Delete overlay */}
                      <div className="absolute inset-0 flex items-end justify-center bg-black/0 p-1 transition-colors group-hover:bg-black/30">
                        <button
                          type="button"
                          onClick={() => deletePhotoMutation.mutate(photo.id)}
                          disabled={deletePhotoMutation.isPending}
                          className="hidden w-full rounded-lg bg-red-600 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white opacity-0 transition-opacity group-hover:opacity-100 group-hover:flex disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                      {/* By label */}
                      {photo.nickname && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 pb-1 pt-4">
                          <p className="truncate text-[9px] font-medium text-white/90">{photo.nickname}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div ref={sentinelRef} className="h-4" />
              {photosQuery.isFetchingNextPage && (
                <div className="flex justify-center py-2">
                  <Spinner />
                </div>
              )}
            </section>
          )}

          {/* ── DANGER ── */}
          {activeSection === "danger" && (
            <section className="rounded-xl border border-red-200 bg-red-50 p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-red-600">Danger Zone</h3>
              <p className="mt-2 text-sm text-red-700">
                Permanently delete <strong>&ldquo;{event.name}&rdquo;</strong> and all its photos. This action cannot be undone.
              </p>
              {deleteEventMutation.isError && (
                <p className="mt-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-xs text-red-700">
                  Failed to delete event. Please try again.
                </p>
              )}
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="mt-4 flex w-full items-center justify-center rounded-lg border border-red-400 py-2.5 text-xs font-bold uppercase tracking-widest text-red-700 transition-colors hover:bg-red-100"
                >
                  Delete Event
                </button>
              ) : (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-red-800">
                    Are you sure? This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={deleteEventMutation.isPending}
                      onClick={() => deleteEventMutation.mutate()}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-700 py-2.5 text-xs font-bold text-white transition-colors hover:bg-red-800 disabled:opacity-60"
                    >
                      {deleteEventMutation.isPending ? <><Spinner /> Deleting…</> : "Yes, delete"}
                    </button>
                    <button
                      type="button"
                      disabled={deleteEventMutation.isPending}
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Bottom safe area */}
          <div className="h-4" />
        </div>
      </div>
    </>
  );
}
