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

  // Fetch stats; only fetch latest photo if no cover is set
  const [{ count: photoCount }, { data: nicknameRows }, { data: latestPhoto }] =
    await Promise.all([
      supabase
        .from("photos")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event.id)
        .eq("is_deleted", false),
      supabase
        .from("photos")
        .select("nickname")
        .eq("event_id", event.id)
        .eq("is_deleted", false)
        .not("nickname", "is", null),
      event.cover_image_path
        ? Promise.resolve({ data: null })
        : supabase
            .from("photos")
            .select("storage_path")
            .eq("event_id", event.id)
            .eq("is_deleted", false)
            .order("captured_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
    ]);

  const guestCount = new Set(nicknameRows?.map((r) => r.nickname)).size;

  // Hero: use the event's designated cover photo first; fall back to latest uploaded photo.
  let heroUrl: string | null = null;
  if (event.cover_image_path) {
    const { data } = supabase.storage
      .from("event-covers")
      .getPublicUrl(event.cover_image_path);
    heroUrl = data.publicUrl ?? null;
  } else if (latestPhoto) {
    const { data } = await supabase.storage
      .from("event-photos")
      .createSignedUrl(latestPhoto.storage_path, 60 * 60);
    heroUrl = data?.signedUrl ?? null;
  }

  const eventDay = new Date(event.event_date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const eventYear = new Date(event.event_date).getFullYear();

  return (
    <div className="relative mx-auto min-h-screen max-w-[448px] overflow-x-hidden bg-white pb-24">

      {/* Floating transparent header — centered within the 448px column */}
      <header className="fixed left-1/2 top-0 z-50 flex h-16 w-full max-w-[448px] -translate-x-1/2 items-center justify-between px-4">
        <Link
          href={`/e/${eventCode}`}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-md transition-transform active:scale-95"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <h1 className="text-base font-bold tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
          {event.name}
        </h1>
        <Link
          href={`/e/${eventCode}/camera`}
          aria-label="Open camera"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-md transition-transform active:scale-95"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </Link>
      </header>

      {/* Hero section — 530px tall, cover photo with glassmorphism overlay */}
      <section className="relative h-[530px] w-full overflow-hidden">
        {heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroUrl} alt={event.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-700 to-slate-950" />
        )}

        {/* Glassmorphism metadata card */}
        <div
          className="absolute bottom-6 left-4 right-4 rounded-xl border border-white/20 p-5"
          style={{ backdropFilter: "blur(12px)", background: "rgba(255,255,255,0.15)" }}
        >
          <div className="flex flex-col gap-1">
            {/* Status badge */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
                {galleryOpen ? "Event Live" : "Event Ended"}
              </span>
              {galleryOpen && (
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              )}
            </div>

            {/* Stats row */}
            <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <div className="flex flex-col">
                <span className="text-[32px] font-black leading-none tracking-tighter text-white">
                  {guestCount}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
                  Guests
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[32px] font-black leading-none tracking-tighter text-white">
                  {photoCount ?? 0}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
                  Photos
                </span>
              </div>
              <div className="ml-auto flex flex-col items-end">
                <span className="text-[22px] font-black leading-none tracking-tighter text-white">
                  {eventDay}
                </span>
                <span className="text-[13px] font-black leading-none tracking-tighter text-white/60">
                  {eventYear}
                </span>
                <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-white/80">
                  Date
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery grid */}
      <section className="bg-white px-2 pt-3">
        <GalleryClient eventCode={eventCode} currentUserId={currentUserId} />
      </section>

      {/* Footer */}
      <footer className="pb-8 pt-4 text-center">
        <Link href="/">
          <Image src="/logo.png" alt="Kenangan Kita" width={80} height={40} unoptimized className="mx-auto object-contain opacity-40" />
        </Link>
      </footer>
    </div>
  );
}

