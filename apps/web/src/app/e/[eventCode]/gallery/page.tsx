import Link from "next/link";
import Image from "next/image";
import { getEventByCode, isEventGalleryOpen } from "@kenangan/lib";
import { GalleryClient } from "./gallery-client";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function GalleryPage({
  params
}: {
  params: Promise<{ eventCode: string }>;
}) {
  const { eventCode } = await params;
  const event = await getEventByCode(eventCode);

  if (!event) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[448px] flex-col items-center justify-center px-4">
        <h1 className="text-lg font-semibold text-slate-900">Gallery not found</h1>
        <p className="mt-2 text-sm text-slate-500">Event code is invalid or no longer available.</p>
      </main>
    );
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;
  const galleryOpen = isEventGalleryOpen(event);

  // Get cover public URL if set
  let coverUrl: string | null = null;
  if (event.cover_image_path) {
    const { data } = supabase.storage.from("event-covers").getPublicUrl(event.cover_image_path);
    coverUrl = data.publicUrl ?? null;
  }

  const formattedDate = new Date(event.event_date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="relative min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-[448px] items-center gap-3 px-4">
          <Link
            href={`/e/${eventCode}`}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
            aria-label="Back to event"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-bold text-slate-900">{event.name}</span>
            <span className="text-[11px] text-slate-400">{formattedDate}</span>
          </div>
          <span className={[
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
            galleryOpen ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500",
          ].join(" ")}>
            {galleryOpen ? "Live" : "Closed"}
          </span>
        </div>
      </header>

      {/* Event banner */}
      {coverUrl && (
        <div className="relative mx-auto max-w-[448px] overflow-hidden" style={{ height: 160 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverUrl} alt={event.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      {/* Content */}
      <main className="mx-auto max-w-[448px] px-4 pb-10 pt-5">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900">Gallery</h1>
          <Link
            href={`/e/${eventCode}/camera`}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white transition-transform active:scale-[0.98]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Add Photo
          </Link>
        </div>
        <GalleryClient eventCode={eventCode} currentUserId={currentUserId} />
      </main>

      {/* Footer logo */}
      <footer className="pb-8 pt-4 text-center">
        <Link href="/">
          <Image src="/logo.png" alt="Kenangan Kita" width={80} height={40} unoptimized className="mx-auto object-contain opacity-40" />
        </Link>
      </footer>
    </div>
  );
}

