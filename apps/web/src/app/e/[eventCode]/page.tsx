import Link from "next/link";
import { getEventByCode } from "@kenangan/lib";

export default async function EventLandingPage({
  params
}: {
  params: Promise<{ eventCode: string }>;
}) {
  const { eventCode } = await params;
  const event = await getEventByCode(eventCode);

  if (!event) {
    return (
      <main className="mx-auto min-h-screen max-w-md px-4 py-8">
        <h1 className="text-lg font-semibold">Event not found</h1>
        <p className="mt-2 text-sm text-slate-600">Please check your QR code or link.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-8">
      <h1 className="text-xl font-semibold">{event.name}</h1>
      <p className="mt-1 text-sm text-slate-600">Event code: {event.event_code}</p>
      <div className="mt-5 space-y-3">
        <Link
          href={`/e/${event.event_code}/camera`}
          className="block rounded bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white"
        >
          Open Camera
        </Link>
        <Link
          href={`/e/${event.event_code}/gallery`}
          className="block rounded border border-slate-300 px-4 py-3 text-center text-sm font-medium"
        >
          Open Gallery
        </Link>
      </div>
    </main>
  );
}

