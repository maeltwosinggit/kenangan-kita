import Link from "next/link";
import { listAllEvents, getLatestEventPhoto } from "@kenangan/lib";
import { listUserProfiles } from "@kenangan/lib";
import AdminEventsClient from "./admin-events-client";
import Breadcrumb from "@/components/breadcrumb";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminEventsPage() {
  const supabase = await getSupabaseServerClient();
  const [events, users] = await Promise.all([
    listAllEvents(),
    listUserProfiles(supabase),
  ]);

  const creatorMap: Record<string, string> = {};
  for (const u of users) {
    creatorMap[u.user_id] = u.display_name ?? u.email ?? u.user_id.slice(0, 8);
  }

  const eventsWithThumbnails = await Promise.all(
    events.map(async (event) => {
      const latestPhotoUrl = await getLatestEventPhoto(event.id);
      return { ...event, latestPhotoUrl };
    })
  );

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-8">
      <Breadcrumb crumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Events" },
      ]} />
      <AdminEventsClient events={eventsWithThumbnails} creatorMap={creatorMap} />
    </main>
  );
}