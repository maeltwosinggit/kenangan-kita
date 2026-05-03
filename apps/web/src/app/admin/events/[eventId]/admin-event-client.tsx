"use client";

import { listEventPhotosForAdmin, setEventGalleryVisibility, softDeletePhoto, deleteEvent, type EventRow } from "@kenangan/lib";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EditEventForm } from "@/components/edit-event-form";
import { EventGuestsList } from "@/components/event-guests-list";

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
  const [activeSection, setActiveSection] = useState<"overview" | "edit" | "guests" | "photos" | "danger">("overview");

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
        {sectionBtn("guests", "Guests")}
        {sectionBtn("photos", "Photos")}
        {sectionBtn("danger", "Danger")}
      </div>

      {activeSection === "overview" && (
      <div className="rounded border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Gallery Visibility</h2>
        <p className="mt-1 text-xs text-slate-600">
          Current status:{" "}
          <span className={eventState.gallery_visible ? "text-green-700" : "text-amber-700"}>
            {eventState.gallery_visible ? "Visible to guests" : "Hidden from guests"}
          </span>
        </p>
        {visibilityMutation.isError && (
          <p className="mt-2 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
            Failed to update gallery visibility. Please try again.
          </p>
        )}
        <button
          type="button"
          className="mt-3 rounded bg-slate-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-50 hover:bg-slate-800 transition-colors"
          disabled={visibilityMutation.isPending}
          onClick={() => {
            console.log('Toggling gallery visibility from:', eventState.gallery_visible, 'to:', !eventState.gallery_visible);
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

