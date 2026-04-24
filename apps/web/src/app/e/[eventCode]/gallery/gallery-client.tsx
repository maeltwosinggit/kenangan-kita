"use client";

import { listEventPhotosByCode } from "@kenangan/lib";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

type Props = {
  eventCode: string;
};

const PAGE_SIZE = 24;

export function GalleryClient({ eventCode }: Props) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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
    return <p className="mt-4 text-sm text-slate-600">Loading gallery...</p>;
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
  if (items.length === 0) {
    return <p className="mt-4 text-sm text-slate-600">No photos yet. Be the first to upload!</p>;
  }

  return (
    <section className="mt-4">
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-lg bg-slate-200">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={`Event photo ${item.id}`}
                className="h-44 w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="flex h-44 items-center justify-center text-xs text-slate-500">Image unavailable</div>
            )}
            {item.nickname && (
              <div className="truncate bg-white px-2 py-1 text-xs text-slate-700">{item.nickname}</div>
            )}
          </article>
        ))}
      </div>

      <div ref={sentinelRef} className="h-6" />
      {query.isFetchingNextPage && <p className="text-center text-xs text-slate-500">Loading more...</p>}
    </section>
  );
}

