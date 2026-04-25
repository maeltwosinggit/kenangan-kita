import { getEventByCode } from "@kenangan/lib";
import Link from "next/link";
import { GalleryClient } from "./gallery-client";

export default async function GalleryPage({
  params
}: {
  params: Promise<{ eventCode: string }>;
}) {
  const { eventCode } = await params;
  const event = await getEventByCode(eventCode);

  if (!event) {
    return (
      <main className="mx-auto min-h-screen max-w-md px-4 py-8">
        <h1 className="text-xl font-semibold">Gallery not found</h1>
        <p className="mt-2 text-sm text-slate-600">Event code is invalid or no longer available.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-8">
      <Link
        href={`/e/${eventCode}/camera`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        ← Back to Camera
      </Link>
      <h1 className="text-xl font-semibold">{event.name} Gallery</h1>
      <p className="mt-2 text-sm text-slate-600">Memories shared by guests.</p>
      <GalleryClient eventCode={eventCode} />
    </main>
  );
}

