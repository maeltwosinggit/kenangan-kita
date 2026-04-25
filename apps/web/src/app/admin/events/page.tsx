import Link from "next/link";
import { listAllEvents, getLatestEventPhoto } from "@kenangan/lib";

export default async function AdminEventsPage() {
  const events = await listAllEvents();
  
  // Get latest photo for each event
  const eventsWithThumbnails = await Promise.all(
    events.map(async (event) => {
      const latestPhotoUrl = await getLatestEventPhoto(event.id);
      return {
        ...event,
        latestPhotoUrl
      };
    })
  );

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin Events</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/users"
            className="rounded border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800"
          >
            Users
          </Link>
          <Link
            href="/admin/events/new"
            className="rounded bg-slate-900 px-3 py-2 text-xs font-medium text-white"
          >
            New Event
          </Link>
        </div>
      </div>

      {eventsWithThumbnails.length === 0 ? (
        <div className="rounded border border-slate-200 p-6 text-center">
          <p className="text-sm text-slate-600">No events created yet.</p>
          <Link
            href="/admin/events/new"
            className="mt-3 inline-block text-sm font-medium text-slate-900 underline"
          >
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {eventsWithThumbnails.map((event) => (
            <Link
              key={event.id}
              href={`/admin/events/${event.id}`}
              className="block rounded border border-slate-200 p-4 transition-colors hover:bg-slate-50"
            >
              <div className="flex items-start gap-3">
                {event.latestPhotoUrl ? (
                  <img
                    src={event.latestPhotoUrl}
                    alt={`Latest from ${event.name}`}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-slate-100 text-xs text-slate-500">
                    No photos
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{event.name}</h3>
                  <p className="text-sm text-slate-600">
                    {new Date(event.event_date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-slate-500">
                    Code: {event.event_code}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className={`rounded px-1.5 py-0.5 ${
                      event.gallery_visible 
                        ? "bg-green-100 text-green-700" 
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {event.gallery_visible ? "Gallery Open" : "Gallery Closed"}
                    </span>
                    <span className="text-slate-500">
                      {event.reveal_mode === "instant" ? "Photos visible immediately" : "Photos visible after event date"}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 pt-4 border-t border-slate-200">
        <Link
          href="/"
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}