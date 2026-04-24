import Link from "next/link";
import { headers } from "next/headers";
import { getEventById } from "@kenangan/lib";
import { AdminEventClient } from "./admin-event-client";
import { GuestLinkSection } from "./guest-link-section";

export default async function AdminEventPage({
  params
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await getEventById(eventId);
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const guestUrl = `${protocol}://${host}/e/${event?.event_code ?? ""}`;

  if (!event) {
    return (
      <main className="mx-auto min-h-screen max-w-md px-4 py-8">
        <h1 className="text-xl font-semibold">Event not found</h1>
        <p className="mt-2 text-sm text-slate-600">This admin event link is invalid.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-8">
      <div className="mb-4">
        <Link
          href="/admin/events"
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          ← Back to Events
        </Link>
      </div>
      <h1 className="text-xl font-semibold">{event.name}</h1>
      <p className="mt-1 text-sm text-slate-600">Admin dashboard</p>
      <GuestLinkSection eventCode={event.event_code} fullUrl={guestUrl} />
      <AdminEventClient event={event} />
    </main>
  );
}

