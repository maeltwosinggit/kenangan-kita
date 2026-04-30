import { getEventByCode } from "@kenangan/lib";
import Breadcrumb from "@/components/breadcrumb";
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
      <Breadcrumb crumbs={[
        { label: event.name, href: `/e/${eventCode}/camera` },
        { label: "Gallery" },
      ]} />
      <h1 className="text-xl font-semibold">{event.name} Gallery</h1>
      <p className="mt-2 text-sm text-slate-600">Memories shared by guests.</p>
      <GalleryClient eventCode={eventCode} />
    </main>
  );
}

