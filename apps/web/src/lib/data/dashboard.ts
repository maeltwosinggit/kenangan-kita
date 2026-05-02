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
};

export type DashboardData = {
  isAdmin: boolean;
  photosTaken: number;
  eventsAttended: number;
  recentPhotos: RecentPhoto[];
  participatedEvents: ParticipatedEvent[];
  createdEvents: CreatedEvent[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDashboardData(userId: string, supabase: SupabaseClient<any>): Promise<DashboardData> {
  const [
    { data: adminProfile },
    { count: photosTaken },
    { data: photoEventRows },
    { data: recentPhotoRows },
    createdEventRows,
  ] = await Promise.all([
    supabase.from("admin_profiles").select("role").eq("user_id", userId).maybeSingle(),
    supabase.from("photos").select("id", { count: "exact", head: true }).eq("uploader_id", userId).eq("is_deleted", false),
    supabase.from("photos").select("event_id").eq("uploader_id", userId).eq("is_deleted", false),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.from("photos").select("id, storage_path, captured_at, events(name, event_code)").eq("uploader_id", userId).eq("is_deleted", false).order("captured_at", { ascending: false }).limit(3) as any,
    listEventsByCreator(userId),
  ]);

  const isAdmin = adminProfile?.role === "admin";
  const distinctEventIds = [
    ...new Set((photoEventRows ?? []).map((r: { event_id: string }) => r.event_id)),
  ];

  // Resolve signed URLs for recent photos in one batch call
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentPaths = (recentPhotoRows ?? []).map((r: any) => r.storage_path as string);
  let signedUrlMap = new Map<string, string>();
  if (recentPaths.length > 0) {
    const { data: signedData } = await supabase.storage
      .from("event-photos")
      .createSignedUrls(recentPaths, 3600);
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
  }));

  return {
    isAdmin,
    photosTaken: photosTaken ?? 0,
    eventsAttended: distinctEventIds.length,
    recentPhotos,
    participatedEvents,
    createdEvents,
  };
}
