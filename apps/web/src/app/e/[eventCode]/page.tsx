import Link from "next/link";
import Image from "next/image";
import { isEventGalleryOpen } from "@kenangan/lib";
import UserMenu from "@/components/user-menu";
import { headers } from "next/headers";
import { QRCodeDisplay } from "@/components/qr-code-display";
import { Suspense } from "react";
import { getCachedEventByCode, getCachedEventStats, getCachedLatestPhoto } from "@/lib/data/events";

/**
 * ── LivePulseStats Component ──
 * Fetches and displays the live photo/guest counters.
 */
async function LivePulseStats({ eventId }: { eventId: string }) {
  const { photoCount, guestCount } = await getCachedEventStats(eventId);

  return (
    <div className="mb-4 flex items-center gap-4">
      <div className="flex flex-col">
        <span className="text-2xl font-black text-white leading-none">{photoCount}</span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">Memories</span>
      </div>
      <div className="h-8 w-px bg-white/20" />
      <div className="flex flex-col">
        <span className="text-2xl font-black text-white leading-none">{guestCount}</span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">Guests</span>
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="mb-4 flex items-center gap-4 animate-pulse">
      <div className="flex flex-col gap-1">
        <div className="h-6 w-8 bg-white/20 rounded" />
        <div className="h-2 w-12 bg-white/10 rounded" />
      </div>
      <div className="h-8 w-px bg-white/20" />
      <div className="flex flex-col gap-1">
        <div className="h-6 w-8 bg-white/20 rounded" />
        <div className="h-2 w-12 bg-white/10 rounded" />
      </div>
    </div>
  );
}

/**
 * ── UserMenuWrapper ──
 */
async function UserMenuWrapper() {
  const supabaseClient = (await import("@/lib/supabase/server")).getSupabaseServerClient;
  const sb = await supabaseClient();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    return (
      <Link href="/login" className="rounded-full bg-slate-900 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white transition-transform active:scale-95">
        Sign In
      </Link>
    );
  }

  const displayName = (user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? "Guest") as string;
  const avatarUrl = (user.user_metadata?.avatar_url ?? null) as string | null;

  return <UserMenu avatarUrl={avatarUrl} displayName={displayName} />;
}

/**
 * ── EventPoster Component ──
 */
async function EventPoster({ 
  event, 
  formattedDate 
}: { 
  event: any; 
  formattedDate: string;
}) {
  const supabaseClient = (await import("@/lib/supabase/server")).getSupabaseServerClient;
  const sb = await supabaseClient();

  let coverUrl: string | null = null;
  if (event.cover_image_path) {
    const { data } = sb.storage.from("event-covers").getPublicUrl(event.cover_image_path);
    coverUrl = data.publicUrl ?? null;
  } else {
    // Fallback to latest photo (cached lookup)
    coverUrl = await getCachedLatestPhoto(event.id);
  }

  return (
    <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200/60 transition-opacity duration-500">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-slate-100">
        {coverUrl ? (
          <img 
            src={coverUrl} 
            alt={event.name} 
            className="h-full w-full object-cover animate-in fade-in duration-700" 
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-300" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        
        {/* Poster Content */}
        <div className="absolute bottom-6 left-6 right-6 text-left">
          <Suspense fallback={<StatsSkeleton />}>
            <LivePulseStats eventId={event.id} />
          </Suspense>
          
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">
            {formattedDate}
          </p>
          <h2 className="text-3xl font-black leading-tight text-white tracking-tighter uppercase">
            {event.name}
          </h2>
        </div>
      </div>
    </div>
  );
}

function PosterSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200/60">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-slate-100 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
    </div>
  );
}

export default async function EventLandingPage({
  params,
}: {
  params: Promise<{ eventCode: string }>;
}) {
  const { eventCode } = await params;
  const event = await getCachedEventByCode(eventCode);

  if (!event) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[448px] flex-col items-center justify-center px-4">
        <h1 className="text-lg font-semibold text-slate-900">Event not found</h1>
        <p className="mt-2 text-sm text-slate-500">Please check your QR code or link.</p>
      </main>
    );
  }

  const formattedDate = new Date(event.event_date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const shareUrl = `${protocol}://${host}/e/${eventCode}`;

  return (
    <div className="relative bg-slate-50 min-h-screen">
      {/* ── Global Header ── */}
      <header className="sticky top-0 z-50 mx-auto flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white/80 px-4 backdrop-blur-md">
        <Link href="/dashboard" className="transition-opacity hover:opacity-80">
          <Image src="/logo.png" alt="Kenangan Kita" width={70} height={35} unoptimized className="object-contain" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-green-700">Live Hub</span>
          </div>
          <Suspense fallback={<div className="h-10 w-10 rounded-full bg-slate-100 animate-pulse" />}>
            <UserMenuWrapper />
          </Suspense>
        </div>
      </header>

      <main className="flex flex-col px-4 pb-32 pt-6">
        
        {/* ── Visual Poster Card ── */}
        <section className="mb-8">
           <Suspense fallback={<PosterSkeleton />}>
              <EventPoster event={event} formattedDate={formattedDate} />
           </Suspense>
        </section>

        {/* ── Share / Invite Section ── */}
        <section className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200/50">
          <h3 className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-slate-900">
            Invite to Group
          </h3>
          <p className="mb-8 text-xs text-slate-500 font-medium">
            Let others join this event by scanning your screen.
          </p>
          <div className="mx-auto max-w-[200px]">
            <QRCodeDisplay url={shareUrl} size={200} />
          </div>
          <div className="mt-8 flex flex-col gap-2">
             <div className="rounded-lg bg-slate-50 px-4 py-2 text-[11px] font-mono text-slate-500 break-all select-all">
                {shareUrl}
             </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 pb-10 text-center opacity-40">
          <Image src="/logo.png" alt="Kenangan Kita" width={60} height={30} unoptimized className="mx-auto object-contain mb-2" />
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
            Digital Disposable Camera • {eventCode}
          </p>
        </footer>
      </main>
    </div>
  );
}
