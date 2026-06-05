"use client";

import { useState, useEffect, useRef } from "react";
import {
  listEventPhotosForAdmin,
  setEventGalleryVisibility,
  softDeletePhoto,
  deleteEvent,
  updateEventUploadLimits,
  getEventUploadStats,
  updateEventCoverPhoto,
} from "@kenangan/lib";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreatedEvent } from "@/lib/data/dashboard";
import { QRCodeDisplay } from "@/components/qr-code-display";
import { EditEventForm } from "@/components/edit-event-form";
import { EventGuestsList } from "@/components/event-guests-list";
import { PhotobookGenerator } from "../../admin/events/[eventId]/photobook/photobook-generator";

type Props = {
  event: CreatedEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (eventId: string) => void;
  isAdmin?: boolean;
};

const PAGE_SIZE = 12;

function getTierName(maxTotal: number | null): string {
  if (maxTotal === 20) return "Free";
  if (maxTotal === 250) return "Starter";
  if (maxTotal === 500) return "Pro";
  if (maxTotal === 1000) return "Elite";
  if (!maxTotal) return "Custom (No Limit)";
  return `Custom (${maxTotal})`;
}

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

type Section = "overview" | "edit" | "guests" | "photos" | "photobook" | "danger";

export function ManageEventSheet({ event: incomingEvent, isOpen, onClose, onDeleted, isAdmin = false }: Props) {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();
  
  // Keep a local copy of event so it can animate out when incomingEvent becomes null
  const [event, setEvent] = useState(incomingEvent);
  useEffect(() => {
    if (incomingEvent) setEvent(incomingEvent);
  }, [incomingEvent]);

  // Track closing state for exit animation
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isOpen && event) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsClosing(false);
        setEvent(null);
      }, 300); // match exit animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, event]);

  const guestUrl = useEventUrl(event?.event_code ?? "");
  const [copied, setCopied] = useState(false);
  const [galleryVisible, setGalleryVisible] = useState(event?.isOpen ?? false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Upload limit local state
  const [limitEnabled, setLimitEnabled]   = useState(false);
  const [maxPerUser,   setMaxPerUser]     = useState<string>("");
  const [maxTotal,     setMaxTotal]       = useState<string>("");
  const [isCustomLimit, setIsCustomLimit] = useState(false);

  // Cover photo local state
  const coverFileRef  = useRef<HTMLInputElement>(null);
  const [coverFile,    setCoverFile]    = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Drag-to-dismiss state
  const [dragY, setDragY] = useState(0);
  const pointerStartY = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    pointerStartY.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointerStartY.current === null) return;
    const diff = e.clientY - pointerStartY.current;
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerStartY.current === null) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    if (dragY > 100) {
      onClose();
    }
    setDragY(0);
    pointerStartY.current = null;
  };

  // Lock body scroll while sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Sync state when sheet opens (or switches to a different event)
  useEffect(() => {
    if (isOpen && incomingEvent) {
      setGalleryVisible(incomingEvent.isOpen);
      setShowDeleteConfirm(false);
      setActiveSection("overview");
      // Seed limit fields from saved DB values
      setLimitEnabled(incomingEvent.upload_limit_enabled ?? false);
      const perUser = incomingEvent.max_uploads_per_user;
      setMaxPerUser(perUser != null ? String(perUser) : "");
      setMaxTotal(incomingEvent.max_uploads_total    != null ? String(incomingEvent.max_uploads_total)    : "");

      // Check if current perUser limit is one of the "quick" options
      setIsCustomLimit(perUser !== null && ![5, 10, 25].includes(perUser));

      // Reset cover photo picker
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverFile(null);
      setCoverPreview(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, incomingEvent?.id, incomingEvent?.upload_limit_enabled, incomingEvent?.max_uploads_per_user, incomingEvent?.max_uploads_total]);

  const photosQuery = useInfiniteQuery({
    queryKey: ["creator-photos", event?.id],
    queryFn: ({ pageParam = 0 }) =>
      listEventPhotosForAdmin({ eventId: event!.id, page: pageParam as number, pageSize: PAGE_SIZE }),
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    initialPageParam: 0,
    enabled: !!event && isOpen && activeSection === "photos",
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
    mutationFn: (next: boolean) => setEventGalleryVisibility(event!.id, next),
    onSuccess: (updated) => {
      setGalleryVisible(updated.gallery_visible);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: string) => softDeletePhoto(photoId),
    onSuccess: () => {
      photosQuery.refetch();
      setPhotoToDelete(null);
    },
    onError: () => {
      setPhotoToDelete(null);
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: () => deleteEvent(supabase, event!.id),
    onSuccess: () => {
      onClose();
      onDeleted(event!.id);
    },
  });

  const coverMutation = useMutation({
    mutationFn: () =>
      updateEventCoverPhoto(
        supabase,
        event!.id,
        event!.cover_image_path,
        coverFile!
      ),
    onSuccess: (newUrl) => {
      // Show the new cover immediately in the preview
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverPreview(newUrl);
      setCoverFile(null);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const uploadLimitsMutation = useMutation({
    mutationFn: () =>
      updateEventUploadLimits(event!.id, {
        uploadLimitEnabled: limitEnabled,
        maxUploadsPerUser:  maxPerUser  ? parseInt(maxPerUser,  10) : null,
        maxUploadsTotal:    maxTotal    ? parseInt(maxTotal,    10) : null,
      }),
    onSuccess: () => {
      // Refresh both the stats widget and the parent dashboard list
      // so incomingEvent carries the new values next time the sheet opens.
      queryClient.invalidateQueries({ queryKey: ["upload-stats", event!.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const statsQuery = useQuery({
    queryKey: ["upload-stats", event?.id],
    queryFn:  () => getEventUploadStats(event!.id),
    enabled:  !!event && isOpen && activeSection === "overview",
    staleTime: 30_000,
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(guestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const onShareWhatsApp = () => {
    if (!guestUrl) return;
    const text = `Hey! Join the digital disposable camera for "${event?.name}". 📸\n\nCapture and share moments here:\n${guestUrl}\n\n✨`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!isOpen && !isClosing) return null;
  if (!event) return null;

  const sectionBtn = (s: Section, label: string) => (
    <button
      type="button"
      onClick={() => setActiveSection(s)}
      className={[
        "shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors",
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
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm ${
          isClosing ? "animate-sheet-fade-out" : "animate-sheet-fade-in"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Manage ${event.name}`}
        className={`fixed inset-x-0 bottom-0 z-[60] mx-auto max-w-[448px] rounded-t-2xl bg-white shadow-2xl pb-safe ${
          isClosing ? "animate-sheet-slide-down" : "animate-sheet-slide-up"
        }`}
        style={{ 
          height: "85dvh", 
          display: "flex", 
          flexDirection: "column",
          transform: dragY > 0 && !isClosing ? `translateY(${dragY}px)` : undefined,
          transition: dragY === 0 && !isClosing ? "transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)" : undefined
        }}
      >
        {/* Drag handle + header */}
        <div 
          className="shrink-0 px-4 pb-3 pt-4 touch-none cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
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
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sectionBtn("overview", "Overview")}
            {sectionBtn("edit", "Edit")}
            {sectionBtn("photobook", "Photobook")}
            {sectionBtn("guests", "Guests")}
            {sectionBtn("photos", "Photos")}
            {sectionBtn("danger", "Danger")}
          </div>
        </div>

        <div className="divider h-px bg-slate-100 shrink-0" />

        {/* Swipeable body wrapper */}
        <div className="flex-1 overflow-hidden relative">
          <div
            className="flex h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{
              transform: `translateX(-${
                ["overview", "edit", "photobook", "guests", "photos", "danger"].indexOf(activeSection) * 100
              }%)`,
            }}
          >
            {/* ── OVERVIEW ── */}
            <div className="w-full shrink-0 overflow-y-auto px-4 py-4 space-y-4">
              {/* Plan Tier Indicator */}
              <section className="rounded-xl border-2 border-indigo-100 bg-indigo-50/50 p-4 flex items-center justify-between shadow-sm">
                 <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 leading-none mb-1 block">Current Event Tier</span>
                    <h4 className="text-xl font-black text-indigo-900 uppercase tracking-tight leading-none">{getTierName(event.max_uploads_total)}</h4>
                 </div>
                 <div className="flex flex-col items-end border-l border-indigo-100 pl-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 leading-none mb-1 block">Total Quota</span>
                    <span className="text-xs font-bold text-indigo-700 bg-white border border-indigo-100 px-2 py-0.5 rounded-full">{event.max_uploads_total ? `${event.max_uploads_total} Photos` : "Unlimited"}</span>
                 </div>
              </section>

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
                <div className="flex flex-col gap-2">
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
                  <button
                    type="button"
                    onClick={onShareWhatsApp}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-green-100 transition-all active:scale-[0.98]"
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.87 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.87 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    Share to WhatsApp
                  </button>
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
                {/* Total photos usage */}
                {statsQuery.data && (
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-slate-500">Total photos uploaded</span>
                        <span className="font-semibold text-slate-900">
                          {statsQuery.data.totalUploads}
                          {statsQuery.data.limitEnabled && statsQuery.data.totalLimit
                            ? ` / ${statsQuery.data.totalLimit}`
                            : ""}
                        </span>
                      </div>
                      {statsQuery.data.limitEnabled && statsQuery.data.totalLimit && (
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={[
                              "h-full rounded-full transition-all",
                              statsQuery.data.totalUploads >= statsQuery.data.totalLimit
                                ? "bg-red-500"
                                : statsQuery.data.totalUploads / statsQuery.data.totalLimit > 0.8
                                ? "bg-amber-400"
                                : "bg-green-500",
                            ].join(" ")}
                            style={{ width: `${Math.min(100, (statsQuery.data.totalUploads / statsQuery.data.totalLimit) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {statsQuery.data.limitEnabled && statsQuery.data.maxUploadsPerUser && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Limit per person</span>
                        <span className="font-semibold text-slate-900">
                          {statsQuery.data.maxUploadsPerUser} photos
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Upload Limits */}
              <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Guest Upload Limits</h3>
                  {/* Toggle — Admin Only */}
                  <button
                    type="button"
                    role="switch"
                    disabled={!isAdmin}
                    aria-checked={limitEnabled}
                    onClick={() => setLimitEnabled((v) => !v)}
                    className={[
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                      limitEnabled ? "bg-slate-900" : "bg-slate-200",
                      !isAdmin ? "opacity-50 cursor-not-allowed" : ""
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200",
                        limitEnabled ? "translate-x-5" : "translate-x-0",
                      ].join(" ")}
                    />
                  </button>
                </div>

                {limitEnabled && (
                  <div className="space-y-5 pt-1">
                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Photos per guest
                      </label>
                      
                      <div className="grid grid-cols-5 gap-1.5">
                        {[5, 10, 25, 50].map((val) => (
                           <button
                             key={val}
                             type="button"
                             onClick={() => {
                                setMaxPerUser(String(val));
                                setIsCustomLimit(false);
                             }}
                             className={[
                               "py-2.5 rounded-xl text-xs font-black transition-all border-2",
                               !isCustomLimit && parseInt(maxPerUser) === val 
                                 ? "bg-slate-900 border-slate-900 text-white shadow-lg scale-[1.05] z-10" 
                                 : "bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50"
                             ].join(" ")}
                           >
                             {val}
                           </button>
                        ))}
                        <button
                           type="button"
                           onClick={() => setIsCustomLimit(true)}
                           className={[
                              "py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all border-2",
                              isCustomLimit 
                                ? "bg-slate-900 border-slate-900 text-white shadow-lg scale-[1.05] z-10" 
                                : "bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50"
                           ].join(" ")}
                        >
                           Custom
                        </button>
                      </div>

                      {isCustomLimit && (
                        <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                          <input
                            type="number"
                            min="1"
                            placeholder="Enter limit"
                            value={maxPerUser}
                            onChange={(e) => setMaxPerUser(e.target.value)}
                            className="w-full rounded-lg border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none placeholder:text-slate-300 placeholder:font-normal"
                            autoFocus
                          />
                        </div>
                      )}
                      
                      <p className="mt-2 text-[10px] text-slate-400 leading-relaxed font-medium italic">Ensure everyone gets a chance to participate by setting a fair limit per person.</p>
                    </div>

                    <div className="h-px bg-slate-50" />

                    <div>
                      <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Max photos total for event
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder={isAdmin ? "e.g. 200 (leave blank = unlimited)" : "Admin controlled"}
                        value={maxTotal}
                        disabled={!isAdmin}
                        onChange={(e) => setMaxTotal(e.target.value)}
                        className={["w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900", !isAdmin ? "opacity-60 cursor-not-allowed bg-slate-100 font-mono" : "font-bold text-indigo-600"].join(" ")}
                      />
                      {!isAdmin && (
                        <p className="mt-1 text-[9px] text-slate-400 font-black uppercase tracking-tighter text-indigo-600/60 leading-none">Tier Protected Limit</p>
                      )}
                    </div>
                  </div>
                )}
                
                {!limitEnabled && !isAdmin && (
                   <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                      <span className="material-symbols-outlined text-[18px]">info</span>
                      <p className="text-[10px] font-bold uppercase tracking-tight">Upload limits are disabled.</p>
                   </div>
                )}

                {uploadLimitsMutation.isError && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    Failed to save limits. Please try again.
                  </p>
                )}
                {uploadLimitsMutation.isSuccess && (
                  <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                    Upload limits saved ✓
                  </p>
                )}

                <button
                  type="button"
                  disabled={uploadLimitsMutation.isPending}
                  onClick={() => uploadLimitsMutation.mutate()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
                >
                  {uploadLimitsMutation.isPending ? <Spinner /> : null}
                  {uploadLimitsMutation.isPending ? "Saving…" : "Save Limits"}
                </button>
              </section>

              <div className="h-4" />
            </div>

            {/* ── EDIT EVENT ── */}
            <div className="w-full shrink-0 overflow-y-auto px-4 py-4 space-y-4">
              {/* Cover photo */}
              <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Cover Photo</h3>

                {/* Current / new preview */}
                <div className="relative overflow-hidden rounded-xl bg-slate-100" style={{ aspectRatio: "16/7" }}>
                  {(coverPreview ?? event.coverImageUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverPreview ?? event.coverImageUrl!}
                      alt="Cover"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="material-symbols-outlined text-[40px] text-slate-300">image</span>
                    </div>
                  )}
                  {/* Badge: unsaved new cover */}
                  {coverFile && (
                    <div className="absolute bottom-2 left-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      Unsaved
                    </div>
                  )}
                </div>

                {/* Hidden file input */}
                <input
                  ref={coverFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (!file) return;
                    if (coverPreview?.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
                    setCoverFile(file);
                    setCoverPreview(URL.createObjectURL(file));
                    e.target.value = "";
                  }}
                />

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => coverFileRef.current?.click()}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">photo_library</span>
                    {(coverPreview ?? event.coverImageUrl) ? "Change" : "Add Photo"}
                  </button>

                  {coverFile && (
                    <button
                      type="button"
                      disabled={coverMutation.isPending}
                      onClick={() => coverMutation.mutate()}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60 active:scale-95 transition-all"
                    >
                      {coverMutation.isPending ? <Spinner /> : <span className="material-symbols-outlined text-[16px]">upload</span>}
                      {coverMutation.isPending ? "Uploading…" : "Save Cover"}
                    </button>
                  )}
                </div>

                {coverMutation.isError && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    Failed to upload cover photo. Please try again.
                  </p>
                )}
                {coverMutation.isSuccess && !coverFile && (
                  <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                    Cover photo updated ✓
                  </p>
                )}
              </section>

              {/* Event details form */}
              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Edit Details</h3>
                <EditEventForm event={event} />
              </section>
              <div className="h-4" />
            </div>

            {/* ── PHOTOBOOK ── */}
            <div className="w-full shrink-0 overflow-y-auto px-4 py-4 space-y-4">
               <PhotobookGenerator eventId={event.id} eventName={event.name} />
               <div className="h-4" />
            </div>

            {/* ── GUESTS ── */}
            <div className="w-full shrink-0 overflow-y-auto px-4 py-4 space-y-4">
              <section>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Guest Contributions</h3>
                <EventGuestsList eventId={event.id} />
              </section>
              <div className="h-4" />
            </div>

            {/* ── PHOTOS ── */}
            <div className="w-full shrink-0 overflow-y-auto px-4 py-4 space-y-4">
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
                  <div className="grid grid-cols-2 gap-3">
                    {photos.map((photo) => {
                      const isDeleting = deletePhotoMutation.isPending && deletePhotoMutation.variables === photo.id;
                      const isConfirming = photoToDelete === photo.id;

                      return (
                        <div key={photo.id} className="group relative overflow-hidden rounded-xl bg-slate-100 aspect-[4/5] ring-1 ring-slate-200/50 shadow-sm">
                          {photo.imageUrl ? (
                            <img
                              src={photo.imageUrl}
                              alt=""
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-300 bg-slate-50">
                              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                            </div>
                          )}
                          
                          {/* Confirmation Overlay */}
                          {isConfirming && !isDeleting && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 px-2 text-center backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                              <p className="text-[10px] font-bold text-white uppercase tracking-wider mb-2">Delete photo?</p>
                              <div className="flex w-full gap-1.5 px-1">
                                <button
                                  onClick={() => deletePhotoMutation.mutate(photo.id)}
                                  className="flex-1 rounded-lg bg-red-600 py-1.5 text-[10px] font-black text-white uppercase tracking-tighter"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setPhotoToDelete(null)}
                                  className="flex-1 rounded-lg bg-white/20 py-1.5 text-[10px] font-black text-white uppercase tracking-tighter backdrop-blur-md"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Delete Trigger Button (top right) */}
                          {!isConfirming && (
                            <div className="absolute right-2 top-2 z-10">
                              <button
                                type="button"
                                onClick={() => setPhotoToDelete(photo.id)}
                                disabled={deletePhotoMutation.isPending}
                                aria-label="Delete photo"
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all hover:bg-red-600 active:scale-90 disabled:opacity-50"
                              >
                                {isDeleting ? (
                                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                  </svg>
                                ) : (
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          )}

                          {/* Bottom info gradient */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2 pt-8 pointer-events-none">
                            <p className="truncate text-xs font-bold text-white drop-shadow-md">
                              {photo.nickname ?? "Guest"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div ref={sentinelRef} className="h-4" />
                {photosQuery.isFetchingNextPage && (
                  <div className="flex justify-center py-2">
                    <Spinner />
                  </div>
                )}
              </section>
              <div className="h-4" />
            </div>

            {/* ── DANGER ── */}
            <div className="w-full shrink-0 overflow-y-auto px-4 py-4 space-y-4">
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
              <div className="h-4" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
