import Link from "next/link";
import Image from "next/image";
import { getEventByCode, isEventGalleryOpen } from "@kenangan/lib";
import { GalleryClient } from "./gallery-client";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import UserMenu from "@/components/user-menu";

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

      {/* Hero section — reduced height since we have a dedicated page for info */}
      <section className="relative h-[300px] w-full overflow-hidden">
        {heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroUrl} alt={event.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-700 to-slate-950" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Stats overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div className="flex gap-4">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white">{photoCount ?? 0}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/60">Photos</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white">{guestCount}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/60">Guests</span>
              </div>
            </div>
        </div>
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
