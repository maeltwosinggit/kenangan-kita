import Link from "next/link";
import { listAllEvents, getLatestEventPhoto } from "@kenangan/lib";
import AdminEventsClient from "./admin-events-client";

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
      <div className="mt-8 border-t border-slate-200 pt-4">
        <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
          ← Back to Home
        </Link>
      </div>

      <AdminEventsClient events={eventsWithThumbnails} />
    </main>
  );
}