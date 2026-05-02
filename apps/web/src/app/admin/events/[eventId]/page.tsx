import Link from "next/link";
import { headers } from "next/headers";
import { getEventById } from "@kenangan/lib";
import { AdminEventClient } from "./admin-event-client";
import { GuestLinkSection } from "./guest-link-section";
import Breadcrumb from "@/components/breadcrumb";
import AdminBottomNav from "../../_components/admin-bottom-nav";

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
      <div className="relative min-h-screen bg-slate-50">
        <main className="mx-auto max-w-[448px] px-4 pb-28 pt-6">
          <h1 className="text-xl font-semibold">Event not found</h1>
          <p className="mt-2 text-sm text-slate-600">This admin event link is invalid.</p>
        </main>
        <AdminBottomNav />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50">
      <main className="mx-auto max-w-[448px] px-4 pb-28 pt-6">
        <Breadcrumb crumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Events", href: "/admin/events" },
          { label: event.name },
        ]} />
        <div className="mt-4">
          <h1 className="text-xl font-semibold">{event.name}</h1>
          <p className="mt-1 text-sm text-slate-600">Admin dashboard</p>
          <GuestLinkSection eventId={event.id} eventCode={event.event_code} fullUrl={guestUrl} />
          <AdminEventClient event={event} />
        </div>
      </main>
      <AdminBottomNav />
    </div>
  );
}

