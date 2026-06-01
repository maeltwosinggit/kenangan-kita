import Link from "next/link";
import Image from "next/image";
import { isEventGalleryOpen } from "@kenangan/lib";
import { GalleryClient } from "./gallery-client";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import UserMenu from "@/components/user-menu";
import { getCachedEventByCode, getCachedEventStats, getCachedLatestPhoto } from "@/lib/data/events";
import { Suspense } from "react";

/**
 * ── GalleryPulseStats ──
 * Inline stats for the gallery hero.
 */
async function GalleryPulseStats({ eventId }: { eventId: string }) {
  const { photoCount, guestCount } = await getCachedEventStats(eventId);
  return (
    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
      <div className="flex gap-4">
        <div className="flex flex-col">
          <span className="text-2xl font-black text-white">{photoCount}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/60">Photos</span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-black text-white">{guestCount}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/60">Guests</span>
        </div>
      </div>
    </div>
  );
}

/**
 * ── GalleryHeroImage ──
 */
async function GalleryHeroImage({ event }: { event: any }) {
  const supabaseClient = (await import("@/lib/supabase/server")).getSupabaseServerClient;
  const supabase = await supabaseClient();

  let heroUrl: string | null = null;
  if (event.cover_image_path) {
    const { data } = supabase.storage
      .from("event-covers")
      .getPublicUrl(event.cover_image_path);
    heroUrl = data.publicUrl ?? null;
  } else {
    heroUrl = await getCachedLatestPhoto(event.id);
  }

  return heroUrl ? (
    <img src={heroUrl} alt={event.name} className="h-full w-full object-cover animate-in fade-in duration-500" />
  ) : (
    <div className="h-full w-full bg-gradient-to-br from-slate-700 to-slate-950" />
  );
}

export default async function GalleryPage({
  params
}: {
  params: Promise<{ eventCode: string }>;
}) {
  const { eventCode } = await params;
  const event = await getCachedEventByCode(eventCode);

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

  return (
    <div className="pb-32">
      {/* ── Global Header ── */}
      <header className="sticky top-0 z-50 mx-auto flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white/80 px-4 backdrop-blur-md">
        <Link href={`/e/${eventCode}`} className="transition-opacity hover:opacity-80">
          <Image src="/logo.png" alt="Kenangan Kita" width={70} height={35} unoptimized className="object-contain" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-green-700">Live</span>
          </div>
          {user ? (
            <UserMenu 
              avatarUrl={(user.user_metadata?.avatar_url as string | null) ?? null} 
              displayName={(user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? "Guest") as string} 
            />
          ) : (
            <Link href="/login" className="rounded-full bg-slate-900 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white transition-transform active:scale-95">
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Hero section */}
      <section className="relative h-[300px] w-full overflow-hidden bg-slate-100">
        <Suspense fallback={<div className="h-full w-full bg-slate-100 animate-pulse" />}>
          <GalleryHeroImage event={event} />
        </Suspense>

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <Suspense fallback={null}>
          <GalleryPulseStats eventId={event.id} />
        </Suspense>
      </section>

      {/* Gallery grid */}
      <section className="px-2 pt-3">
        <GalleryClient eventCode={eventCode} currentUserId={currentUserId} eventId={event.id} />
      </section>

      {/* Footer */}
      <footer className="pb-10 pt-10 text-center">
        <Image src="/logo.png" alt="Kenangan Kita" width={60} height={30} unoptimized className="mx-auto object-contain opacity-20" />
      </footer>
    </div>
  );
}
