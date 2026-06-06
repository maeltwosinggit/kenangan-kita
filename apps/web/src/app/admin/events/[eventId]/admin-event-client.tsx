"use client";

import { listEventPhotosForAdmin, setEventGalleryVisibility, softDeletePhoto, deleteEvent, updateEventUploadLimits, isEventActive, type EventRow } from "@kenangan/lib";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EditEventForm } from "@/components/edit-event-form";
import { EventGuestsList } from "@/components/event-guests-list";
import { PhotobookGenerator } from "./photobook/photobook-generator";

type Props = {
  event: EventRow;
};

const PAGE_SIZE = 24;

export function AdminEventClient({ event }: Props) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [eventState, setEventState] = useState(event);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeSection, setActiveSection] = useState<"overview" | "edit" | "photobook" | "guests" | "photos" | "danger">("overview");

  const isExpired = !isEventActive(eventState.event_date);

  // Upload limits state
  const [limitEnabled, setLimitEnabled] = useState(event.upload_limit_enabled);
  const [maxPerUser, setMaxPerUser] = useState(event.max_uploads_per_user ? String(event.max_uploads_per_user) : "");
  const [maxTotal, setMaxTotal] = useState(event.max_uploads_total ? String(event.max_uploads_total) : "");

  const uploadLimitsMutation = useMutation({
    mutationFn: () => updateEventUploadLimits(event.id, {
      uploadLimitEnabled: limitEnabled,
      maxUploadsPerUser: maxPerUser ? parseInt(maxPerUser, 10) : null,
      maxUploadsTotal: maxTotal ? parseInt(maxTotal, 10) : null,
    }),
    onSuccess: (updated) => {
      setEventState(updated);
      queryClient.invalidateQueries({ queryKey: ["admin-event", event.id] });
    }
  });

  const photosQuery = useInfiniteQuery({
    queryKey: ["admin-photos", event.id],
    queryFn: ({ pageParam = 0 }) =>
      listEventPhotosForAdmin({
        eventId: event.id,
        page: pageParam,
        pageSize: PAGE_SIZE
      }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    initialPageParam: 0
  });

  const visibilityMutation = useMutation({
    mutationFn: (nextValue: boolean) => setEventGalleryVisibility(eventState.id, nextValue),
    onSuccess: (nextEvent) => {
      setEventState(nextEvent);
      queryClient.setQueryData(["admin-event", eventState.id], nextEvent);
    },
    onError: (error) => {
      console.error('Failed to update gallery visibility:', error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (photoId: string) => softDeletePhoto(photoId),
    onSuccess: () => {
      void photosQuery.refetch();
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: () => deleteEvent(getSupabaseBrowserClient(), eventState.id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["admin-photos", eventState.id] });
      router.push("/admin/events");
      router.refresh();
    },
  });

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && photosQuery.hasNextPage && !photosQuery.isFetchingNextPage) {
          photosQuery.fetchNextPage();
        }
      },
      { rootMargin: "120px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [photosQuery]);

  const items = useMemo(() => photosQuery.data?.pages.flatMap((page) => page.items) ?? [], [photosQuery.data]);

  const sectionBtn = (s: typeof activeSection, label: string) => (
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
    <section className="mt-5 space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sectionBtn("overview", "Overview")}
        {sectionBtn("edit", "Edit")}
        {sectionBtn("photobook", "Photobook")}
        {sectionBtn("guests", "Guests")}
        {sectionBtn("photos", "Photos")}
        {sectionBtn("danger", "Danger")}
      </div>

      {activeSection === "overview" && (
      <div className="space-y-4">
        {/* Standardized Status Indicator */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5 leading-none">Event Status</p>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none mt-1">Platform Label</h3>
           </div>
           <div className="flex items-center gap-2">
              {isExpired ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700 ring-1 ring-amber-200">Ended</span>
              ) : !eventState.gallery_visible ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600 ring-1 ring-slate-200">Hidden</span>
              ) : (
                <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 ring-1 ring-green-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-green-700">Live</span>
                </div>
              )}
           </div>
        </div>

        <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-tight">Gallery Visibility</h2>
          <p className="mt-1 text-xs text-slate-600">
            Current status:{" "}
            <span className={eventState.gallery_visible ? "text-green-700 font-bold" : "text-amber-700 font-bold"}>
              {eventState.gallery_visible ? "Visible to guests" : "Hidden from guests"}
            </span>
          </p>
          {visibilityMutation.isError && (
            <p className="mt-2 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 font-medium">
              Failed to update gallery visibility. Please try again.
            </p>
          )}
          <button
            type="button"
            className="mt-4 w-full rounded-lg bg-slate-900 py-2.5 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50 hover:bg-slate-800 transition-all active:scale-[0.98]"
            disabled={visibilityMutation.isPending}
            onClick={() => {
              visibilityMutation.mutate(!eventState.gallery_visible);
            }}
          >
            {visibilityMutation.isPending
              ? "Updating..."
              : eventState.gallery_visible
                ? "Hide Gallery"
                : "Show Gallery"}
          </button>
        </div>

        <div className="rounded border border-slate-200 bg-white p-4 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-tight">Upload Limits</h2>
            <button
              type="button"
              role="switch"
              aria-checked={limitEnabled}
              onClick={() => setLimitEnabled(!limitEnabled)}
              className={[
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                limitEnabled ? "bg-indigo-600" : "bg-slate-200",
              ].join(" ")}
            >
              <span className={["pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200", limitEnabled ? "translate-x-5" : "translate-x-0"].join(" ")} />
            </button>
          </div>

          {limitEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400 font-bold">Per Guest</label>
                <input
                  type="number"
                  value={maxPerUser}
                  onChange={(e) => setMaxPerUser(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Unlimited"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400 font-bold">Total Event</label>
                <input
                  type="number"
                  value={maxTotal}
                  onChange={(e) => setMaxTotal(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Unlimited"
                />
              </div>
            </div>
          )}

          {uploadLimitsMutation.isError && (
             <p className="text-[11px] text-red-600 font-black uppercase tracking-tighter bg-red-50 p-2 rounded">Failed to save limits.</p>
          )}
          {uploadLimitsMutation.isSuccess && (
             <p className="text-[11px] text-green-600 font-black uppercase tracking-tighter bg-green-50 p-2 rounded">Limits updated ✓</p>
          )}

          <button
            type="button"
            onClick={() => uploadLimitsMutation.mutate()}
            disabled={uploadLimitsMutation.isPending}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {uploadLimitsMutation.isPending ? "Saving..." : "Save Limits"}
          </button>
        </div>
      </div>
      )}

      {activeSection === "edit" && (
        <div className="rounded border border-slate-200 bg-white p-4">
          <h2 className="mb-4 text-sm font-semibold">Edit Event Details</h2>
          <EditEventForm event={eventState} onSuccess={() => {
            // refresh page to update header if name changed
            router.refresh();
          }} />
        </div>
      )}

      {activeSection === "photobook" && (
        <PhotobookGenerator eventId={eventState.id} eventName={eventState.name} />
      )}

      {activeSection === "guests" && (
        <div>
          <h2 className="mb-4 text-sm font-semibold">Guest Contributions</h2>
          <EventGuestsList eventId={eventState.id} />
        </div>
      )}

      {activeSection === "photos" && (
      <div>
        <h2 className="text-sm font-semibold">Photos</h2>
        {photosQuery.isLoading && <p className="mt-2 text-xs text-slate-600">Loading photos...</p>}
        {photosQuery.isError && (
          <p className="mt-2 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
            Failed to load photos.
          </p>
        )}

        {items.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {items.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.id} className="h-36 w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-36 items-center justify-center text-xs text-slate-500">No preview</div>
                )}
                <div className="space-y-1 px-2 py-2">
                  <p className="truncate text-xs text-slate-700">
                    <span className="font-medium">By:</span>{" "}
                    {item.nickname ?? <span className="italic text-slate-400">Anonymous</span>}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(item.captured_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                    {" · "}
                    {new Date(item.captured_at).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <button
                    type="button"
                    className="w-full rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-700 disabled:opacity-50"
                    onClick={() => deleteMutation.mutate(item.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete Photo
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        {items.length === 0 && !photosQuery.isLoading && (
          <p className="mt-2 text-xs text-slate-600">No photos uploaded yet.</p>
        )}
        <div ref={sentinelRef} className="h-6" />
      </div>
      )}

      {activeSection === "danger" && (
      <div className="rounded border border-red-200 bg-red-50 p-4">
        <h2 className="text-sm font-semibold text-red-800">Danger Zone</h2>
        <p className="mt-1 text-xs text-red-700">
          Permanently delete this event and all its photos. This cannot be undone.
        </p>
        {deleteEventMutation.isError && (
          <p className="mt-2 rounded border border-red-300 bg-white px-2 py-1 text-xs text-red-700">
            Failed to delete event. Please try again.
          </p>
        )}
        {!showDeleteConfirm ? (
          <button
            type="button"
            className="mt-3 rounded border border-red-400 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Event
          </button>
        ) : (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium text-red-800">
              Are you sure? This will delete &ldquo;{eventState.name}&rdquo; and all its photos.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded bg-red-700 px-3 py-2 text-xs font-medium text-white hover:bg-red-800 disabled:opacity-50 transition-colors"
                disabled={deleteEventMutation.isPending}
                onClick={() => deleteEventMutation.mutate()}
              >
                {deleteEventMutation.isPending ? "Deleting..." : "Yes, delete"}
              </button>
              <button
                type="button"
                className="rounded border border-slate-300 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                disabled={deleteEventMutation.isPending}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      )}
    </section>
  );
}

