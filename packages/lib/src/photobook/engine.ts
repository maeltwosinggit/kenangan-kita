import { EventPhoto } from "../domain/photos";

export type PhotobookTemplate = "hero" | "duo" | "scrapbook" | "mosaic" | "stats";

export type PhotobookPage = {
  id: string;
  template: PhotobookTemplate;
  photos: EventPhoto[];
  stats?: any;
};

export type PhotobookData = {
  title: string;
  pages: PhotobookPage[];
};

/**
 * Photobook Engine
 * Organizes a collection of event photos into a structured book with unique layouts.
 */
export function generatePhotobookData(
  eventName: string,
  photos: EventPhoto[],
  guestCount: number
): PhotobookData {
  // Sort chronologically (earliest first for a story feel)
  const sortedPhotos = [...photos].sort(
    (a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime()
  );

  const pages: PhotobookPage[] = [];
  let photoIndex = 0;

  // ── 1. Intro Page (The Cover/Intro) ──
  if (sortedPhotos.length > 0) {
    pages.push({
      id: "intro",
      template: "hero",
      photos: [sortedPhotos[photoIndex++]]
    });
  }

  // ── 2. First Stats Page (Early Bird) ──
  pages.push({
    id: "stats-early",
    template: "stats",
    photos: [],
    stats: {
      type: "early-bird",
      photo: sortedPhotos[0],
      totalPhotos: photos.length,
      guestCount
    }
  });

  // ── 3. The Body (Dynamic Layouts) ──
  const layoutPool: PhotobookTemplate[] = ["duo", "scrapbook", "mosaic"];
  let layoutCounter = 0;

  while (photoIndex < sortedPhotos.length) {
    const template = layoutPool[layoutCounter % layoutPool.length];
    layoutCounter++;

    let count = 0;
    if (template === "duo") count = 2;
    else if (template === "scrapbook") count = 3;
    else if (template === "mosaic") count = 4;

    const pagePhotos = sortedPhotos.slice(photoIndex, photoIndex + count);
    if (pagePhotos.length === 0) break;

    pages.push({
      id: `page-${pages.length}`,
      template: pagePhotos.length === 1 ? "hero" : template,
      photos: pagePhotos
    });

    photoIndex += count;

    // Inject stats mid-way if we have enough pages
    if (pages.length === 5) {
      pages.push({
        id: "stats-middle",
        template: "stats",
        photos: [],
        stats: { type: "peak-hour", data: calculatePeakHour(photos) }
      });
    }
  }

  // ── 4. Final Stats Page (Night Owl) ──
  if (sortedPhotos.length > 1) {
    pages.push({
      id: "stats-final",
      template: "stats",
      photos: [],
      stats: {
        type: "night-owl",
        photo: sortedPhotos[sortedPhotos.length - 1]
      }
    });
  }

  return {
    title: eventName,
    pages
  };
}

function calculatePeakHour(photos: EventPhoto[]) {
  const hours = new Map<number, number>();
  photos.forEach((p) => {
    const h = new Date(p.captured_at).getHours();
    hours.set(h, (hours.get(h) ?? 0) + 1);
  });
  const peakHour = Array.from(hours.entries()).sort((a, b) => b[1] - a[1])[0];
  return { hour: peakHour?.[0] ?? 0, count: peakHour?.[1] ?? 0 };
}
