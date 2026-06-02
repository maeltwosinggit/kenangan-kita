import { EventPhoto } from "../domain/photos";

export type PhotobookPhoto = EventPhoto & { imageUrl: string; score?: number };

export type PhotobookTemplate = "cover" | "opening" | "hero" | "duo" | "trio" | "collage" | "stats" | "closing" | "back";

export type PhotobookPage = {
  id: string;
  template: PhotobookTemplate;
  photos: PhotobookPhoto[];
  title?: string;
  subtitle?: string;
  stats?: any;
};

export type PhotobookData = {
  title: string;
  pages: PhotobookPage[];
};

/**
 * Photobook Engine
 * Implements a "Story Flow" narrative structure with intelligent layout assignments.
 */
export function generatePhotobookData(
  eventName: string,
  photos: PhotobookPhoto[],
  guestCount: number
): PhotobookData {
  if (photos.length === 0) {
    return { title: eventName, pages: [] };
  }

  // 1. Sort chronologically
  const sortedPhotos = [...photos].sort(
    (a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime()
  );

  // 2. Score photos (Simple heuristic: resolution area as proxy for quality)
  // Higher resolution / area -> better score -> more likely to be a hero shot
  sortedPhotos.forEach(p => {
    const area = (p.width || 1000) * (p.height || 1000);
    p.score = area;
  });

  const pages: PhotobookPage[] = [];
  let photoIndex = 0;

  // Helper to get photos and advance index
  const takePhotos = (count: number): PhotobookPhoto[] => {
    const batch = sortedPhotos.slice(photoIndex, photoIndex + count);
    photoIndex += batch.length;
    return batch;
  };

  // ── CHAPTER 1: The Arrival / Cover ──
  // Cover Page
  pages.push({
    id: "cover",
    template: "cover",
    photos: takePhotos(1),
    title: eventName,
    subtitle: new Date(sortedPhotos[0].captured_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  });

  // Opening Spread
  if (photoIndex < sortedPhotos.length) {
    pages.push({
      id: "opening",
      template: "opening",
      photos: takePhotos(1),
      title: "Moments from Our Special Day"
    });
  }

  // Early Moments (Arrival shots)
  if (photoIndex < sortedPhotos.length) {
    pages.push({
      id: "early-moments",
      template: "duo",
      photos: takePhotos(2),
      title: "The Beginning"
    });
  }

  // ── CHAPTER 2: The Main Event & Highlights ──
  // We'll alternate between different grid layouts and occasional hero shots.
  const mainLayoutPool: PhotobookTemplate[] = ["collage", "trio", "duo"];
  let spreadCounter = 0;

  while (photoIndex < sortedPhotos.length) {
    // If we only have a few photos left, break and let the closing section handle them
    if (sortedPhotos.length - photoIndex <= 3) {
      break;
    }

    // Every 4th spread, force a Hero highlight if we have a high-scoring photo
    if (spreadCounter > 0 && spreadCounter % 4 === 0) {
      pages.push({
        id: `highlight-${spreadCounter}`,
        template: "hero",
        photos: takePhotos(1)
      });
      spreadCounter++;
      continue;
    }

    // Otherwise, pick from the pool to create rhythm
    const template = mainLayoutPool[spreadCounter % mainLayoutPool.length];
    
    let count = 0;
    if (template === "collage") count = 4;
    else if (template === "trio") count = 3;
    else if (template === "duo") count = 2;

    const pagePhotos = takePhotos(count);
    if (pagePhotos.length === 0) break;

    pages.push({
      id: `spread-${spreadCounter}`,
      template: pagePhotos.length === 1 ? "hero" : template,
      photos: pagePhotos
    });

    spreadCounter++;

    // Inject Fun Stats mid-way through the main event
    if (spreadCounter === 3) {
      pages.push({
        id: "stats-peak",
        template: "stats",
        photos: [],
        stats: { type: "peak-hour", data: calculatePeakHour(sortedPhotos) }
      });
    }
  }

  // ── CHAPTER 3: Closing & Afterglow ──
  
  // Closing Shots
  const remaining = sortedPhotos.slice(photoIndex);
  if (remaining.length > 0) {
     if (remaining.length === 1) {
       pages.push({ id: "closing-hero", template: "hero", photos: [remaining[0]] });
     } else if (remaining.length === 2) {
       pages.push({ id: "closing-duo", template: "duo", photos: remaining });
     } else {
       pages.push({ id: "closing-trio", template: "trio", photos: remaining.slice(0, 3) });
     }
  }

  // Final Stats
  pages.push({
    id: "stats-summary",
    template: "stats",
    photos: [],
    stats: {
      type: "summary",
      totalPhotos: sortedPhotos.length,
      guestCount,
      earlyBird: sortedPhotos[0],
      nightOwl: sortedPhotos[sortedPhotos.length - 1]
    }
  });

  // Back Page
  pages.push({
    id: "back-page",
    template: "back",
    photos: [],
    title: "Thank you for being part of our day",
    subtitle: "• KENANGAN KITA •"
  });

  return {
    title: eventName,
    pages
  };
}

function calculatePeakHour(photos: PhotobookPhoto[]) {
  const hours = new Map<number, number>();
  photos.forEach((p) => {
    const h = new Date(p.captured_at).getHours();
    hours.set(h, (hours.get(h) ?? 0) + 1);
  });
  const peakHour = Array.from(hours.entries()).sort((a, b) => b[1] - a[1])[0];
  return { hour: peakHour?.[0] ?? 0, count: peakHour?.[1] ?? 0 };
}
