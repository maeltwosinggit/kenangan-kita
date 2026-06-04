import type { SupabaseClient } from "@supabase/supabase-js";
import { isEventGalleryOpen, listEventsByCreator } from "@kenangan/lib";

export type RecentPhoto = {
  id: string;
  imageUrl: string;
  eventName: string | null;
  eventCode: string | null;
};

export type ParticipatedEvent = {
  id: string;
  name: string;
  event_date: string;
  event_code: string;
  isOpen: boolean;
  coverImageUrl: string | null;
};

export type CreatedEvent = {
  id: string;
  name: string;
  event_date: string;
  event_code: string;
  isOpen: boolean;
  coverImageUrl: string | null;
  /** Raw storage path in the event-covers bucket (used for deletion on replace) */
  cover_image_path: string | null;
  reveal_mode: "instant" | "after_event";
  upload_limit_enabled: boolean;
  max_uploads_per_user: number | null;
  max_uploads_total: number | null;
  theme_filter: string;
};

export type DashboardData = {
  isAdmin: boolean;
  photosTaken: number;
  eventsAttended: number;
  recentPhotos: RecentPhoto[];
  participatedEvents: ParticipatedEvent[];
  createdEvents: CreatedEvent[];
  throwbackPhoto: RecentPhoto | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDashboardData(userId: string, supabase: SupabaseClient<any>): Promise<DashboardData> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    { data: adminProfile },
    { count: photosTaken },
    { data: photoEventRows },
    { data: recentPhotoRows },
    { data: throwbackPhotoRows },
    createdEventRows,
  ] = await Promise.all([
    supabase.from("admin_profiles").select("role").eq("user_id", userId).maybeSingle(),
    supabase.from("photos").select("id", { count: "exact", head: true }).eq("uploader_id", userId).eq("is_deleted", false),
    supabase.from("photos").select("event_id").eq("uploader_id", userId).eq("is_deleted", false),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.from("photos").select("id, storage_path, captured_at, events(name, event_code)").eq("uploader_id", userId).eq("is_deleted", false).order("captured_at", { ascending: false }).limit(10) as any,
    // Random throwback from more than 7 days ago
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.from("photos").select("id, storage_path, captured_at, events(name, event_code)").eq("uploader_id", userId).eq("is_deleted", false).lt("captured_at", sevenDaysAgo.toISOString()).limit(1) as any,
    listEventsByCreator(userId),
  ]);

  const isAdmin = adminProfile?.role === "admin";
  const distinctEventIds = [
    ...new Set((photoEventRows ?? []).map((r: { event_id: string }) => r.event_id)),
  ];

  // Resolve signed URLs for recent photos in one batch call
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentPaths = (recentPhotoRows ?? []).map((r: any) => r.storage_path as string);
  const throwbackPath = (throwbackPhotoRows?.[0] as any)?.storage_path;
  const allPaths = [...recentPaths];
  if (throwbackPath) allPaths.push(throwbackPath);

  let signedUrlMap = new Map<string, string>();
  if (allPaths.length > 0) {
    const { data: signedData } = await supabase.storage
      .from("event-photos")
      .createSignedUrls(allPaths, 3600);
    signedUrlMap = new Map(
      (signedData ?? [])
        .filter(
          (item): item is typeof item & { path: string; signedUrl: string } =>
            !!item.signedUrl && item.path !== null
        )
        .map((item) => [item.path, item.signedUrl])
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentPhotos: RecentPhoto[] = (recentPhotoRows ?? []).map((r: any) => ({
    id: r.id,
    imageUrl: signedUrlMap.get(r.storage_path) ?? "",
    eventName: r.events?.name ?? null,
    eventCode: r.events?.event_code ?? null,
  }));

  const throwbackPhoto: RecentPhoto | null = throwbackPhotoRows?.[0] ? {
    id: (throwbackPhotoRows[0] as any).id,
    imageUrl: signedUrlMap.get(throwbackPath) ?? "",
    eventName: (throwbackPhotoRows[0] as any).events?.name ?? null,
    eventCode: (throwbackPhotoRows[0] as any).events?.event_code ?? null,
  } : null;

  let participatedEvents: ParticipatedEvent[] = [];
  if (distinctEventIds.length > 0) {
    const { data: eventRows } = await supabase
      .from("events")
      .select("id, name, event_date, event_code, reveal_mode, gallery_visible, cover_image_path")
      .in("id", distinctEventIds)
      .order("event_date", { ascending: false });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    participatedEvents = (eventRows ?? []).map((e: any) => ({
      id: e.id,
      name: e.name,
      event_date: e.event_date,
      event_code: e.event_code,
      isOpen: isEventGalleryOpen(e),
      coverImageUrl: e.cover_image_path
        ? supabase.storage.from("event-covers").getPublicUrl(e.cover_image_path).data.publicUrl
        : null,
    }));
  }

  const createdEvents: CreatedEvent[] = createdEventRows.map((e) => ({
    id: e.id,
    name: e.name,
    event_date: e.event_date,
    event_code: e.event_code,
    isOpen: isEventGalleryOpen(e),
    coverImageUrl: e.cover_image_path
      ? supabase.storage.from("event-covers").getPublicUrl(e.cover_image_path).data.publicUrl
      : null,
    cover_image_path: e.cover_image_path ?? null,
    reveal_mode: e.reveal_mode,
    upload_limit_enabled: e.upload_limit_enabled ?? false,
    max_uploads_per_user: e.max_uploads_per_user ?? null,
    max_uploads_total:    e.max_uploads_total    ?? null,
    theme_filter: e.theme_filter ?? "normal",
  }));

  return {
    isAdmin,
    photosTaken: photosTaken ?? 0,
    eventsAttended: distinctEventIds.length,
    recentPhotos,
    participatedEvents,
    createdEvents,
    throwbackPhoto,
  };
}
