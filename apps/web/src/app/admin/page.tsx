import Link from "next/link";
import Image from "next/image";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { listAllEvents, getLatestEventPhoto, isEventGalleryOpen } from "@kenangan/lib";
import AdminClient from "./admin-client";


type ActivityRow = {
  id: string;
  nickname: string | null;
  captured_at: string;
  events: { name: string } | null;
};

export default async function AdminPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName = (
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email ??
    "Admin"
  ) as string;
  const avatarUrl = (user?.user_metadata?.avatar_url ?? null) as string | null;

  // Parallel data fetches
  const [
    { count: totalPhotos },
    { count: activeEventsCount },
    events,
    { data: uploaderRows },
    { data: rawActivity },
  ] = await Promise.all([
    supabase
      .from("photos")
      .select("id", { count: "exact", head: true })
      .eq("is_deleted", false),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("gallery_visible", true),
    listAllEvents(),
    supabase
      .from("photos")
      .select("uploader_id")
      .eq("is_deleted", false)
      .not("uploader_id", "is", null)
      .limit(1000),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.from("photos").select("id, nickname, captured_at, events(name)").eq("is_deleted", false).order("captured_at", { ascending: false }).limit(6) as any,
  ]);

  const activityRows = (rawActivity ?? []) as ActivityRow[];
  const totalGuests = new Set(
    (uploaderRows ?? []).map((r: { uploader_id: string }) => r.uploader_id)
  ).size;

  // Recent 5 events with thumbnails + open/closed state
  const recentEvents = await Promise.all(
    events.slice(0, 5).map(async (event) => ({
      ...event,
      latestPhotoUrl: await getLatestEventPhoto(event.id),
      isOpen: isEventGalleryOpen(event),
    }))
  );

  // We need allEvents and creatorMap for the Events tab
  const allEvents = await Promise.all(
    events.map(async (event) => ({
      ...event,
      latestPhotoUrl: await getLatestEventPhoto(event.id),
      isOpen: isEventGalleryOpen(event),
    }))
  );

  const creatorMap: Record<string, string> = {};
  const users = await import("@kenangan/lib").then((m) => m.listUserProfiles(supabase));
  for (const u of users) {
    creatorMap[u.user_id] = u.display_name ?? u.email ?? u.user_id.slice(0, 8);
  }

  return (
    <AdminClient
      totalPhotos={totalPhotos ?? 0}
      activeEventsCount={activeEventsCount ?? 0}
      totalGuests={totalGuests}
      recentEvents={recentEvents}
      activityRows={activityRows}
      allEvents={allEvents}
      creatorMap={creatorMap}
      displayName={displayName}
      avatarUrl={avatarUrl}
    />
  );
}
