import Link from "next/link";
import { listAllEvents, getLatestEventPhoto } from "@kenangan/lib";
import AdminEventsClient from "./admin-events-client";
import Breadcrumb from "@/components/breadcrumb";

export default async function AdminEventsPage() {
  const events = await listAllEvents();

  const eventsWithThumbnails = await Promise.all(
    events.map(async (event) => {
      const latestPhotoUrl = await getLatestEventPhoto(event.id);
      return { ...event, latestPhotoUrl };
    })
  );

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-8">
      <Breadcrumb crumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Events" },
      ]} />
      <AdminEventsClient events={eventsWithThumbnails} />
    </main>
  );
}