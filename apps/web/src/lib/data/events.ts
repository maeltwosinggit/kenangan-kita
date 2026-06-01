import { getEventByCode, getEventStats, getLatestEventPhoto } from "@kenangan/lib";
import { unstable_cache } from "next/cache";

/**
 * ── Persistent Server Caching ──
 * These functions use Next.js unstable_cache to store results across requests.
 * This makes "Back to Event" and tab switching feel instantaneous.
 */

export const getCachedEventByCode = (code: string) => 
  unstable_cache(
    async () => getEventByCode(code),
    [`event-code-${code}`],
    { revalidate: 60, tags: [`event-code-${code}`] }
  )();

export const getCachedEventStats = (eventId: string) =>
  unstable_cache(
    async () => getEventStats(eventId),
    [`event-stats-${eventId}`],
    { revalidate: 15, tags: [`event-stats-${eventId}`] }
  )();

export const getCachedLatestPhoto = (eventId: string) =>
  unstable_cache(
    async () => getLatestEventPhoto(eventId),
    [`event-latest-photo-${eventId}`],
    { revalidate: 30, tags: [`event-latest-photo-${eventId}`] }
  )();
