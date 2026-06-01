import Link from "next/link";
import Image from "next/image";
import { getEventByCode, getLatestEventPhoto, isEventGalleryOpen } from "@kenangan/lib";
import UserMenu from "@/components/user-menu";

/* ── Icons (inline SVG, no extra deps) ── */
function CameraIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function GalleryIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {filled ? (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" fill="white" />
          <path d="M21 15 16 10 5 21" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </>
      )}
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function QrIcon() {
  return (
    <svg className="h-6 w-6 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="5" y="5" width="3" height="3" fill="currentColor" />
      <rect x="16" y="5" width="3" height="3" fill="currentColor" />
      <rect x="5" y="16" width="3" height="3" fill="currentColor" />
      <path d="M14 14h2v2h-2z M18 14h3 M14 18h2 M18 18h3 M21 14v3" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="h-6 w-6 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

export default async function EventLandingPage({
  params,
}: {
  params: Promise<{ eventCode: string }>;
}) {
  const { eventCode } = await params;
  const event = await getEventByCode(eventCode);

  if (!event) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[448px] flex-col items-center justify-center px-4">
        <h1 className="text-lg font-semibold text-slate-900">Event not found</h1>
        <p className="mt-2 text-sm text-slate-500">Please check your QR code or link.</p>
      </main>
    );
  }

  const supabaseClient = (await import("@/lib/supabase/server")).getSupabaseServerClient;
  const sb = await supabaseClient();

  // Use the dedicated cover image if set; fall back to the latest guest photo
  let coverUrl: string | null = null;
  if (event.cover_image_path) {
    const { data } = sb.storage
      .from("event-covers")
      .getPublicUrl(event.cover_image_path);
    coverUrl = data.publicUrl ?? null;
  } else {
    coverUrl = await getLatestEventPhoto(event.id);
  }

  // Fetch user for global header
  const { data: { user } } = await sb.auth.getUser();
  let displayName: string | null = null;
  let avatarUrl: string | null = null;

  if (user) {
    displayName = (user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? "Guest") as string;
    avatarUrl = (user.user_metadata?.avatar_url ?? null) as string | null;
  }

  const galleryOpen = isEventGalleryOpen(event);
  const formattedDate = new Date(event.event_date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

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
            <span className="text-[10px] font-bold uppercase tracking-wider text-green-700">Live</span>
          </div>
          {user && displayName ? (
            <UserMenu avatarUrl={avatarUrl} displayName={displayName} />
          ) : (
            <Link href="/login" className="rounded-full bg-slate-900 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white transition-transform active:scale-95">
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex flex-col px-4 pb-32 pt-6">

        {/* Event Meta Card */}
        <section className="mb-6">
           <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200/60">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl">
                {coverUrl ? (
                  <img src={coverUrl} alt={event.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-slate-100 to-slate-200" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-left">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">
                    {formattedDate}
                  </p>
                  <h2 className="text-2xl font-bold leading-tight text-white tracking-tight">
                    {event.name}
                  </h2>
                </div>
              </div>
           </div>
        </section>

        {/* Primary Actions */}
        <section className="grid grid-cols-2 gap-3">
          <Link
            href={`/e/${eventCode}/camera`}
            className="flex h-24 flex-col items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white transition-all active:scale-[0.96] shadow-lg shadow-slate-200"
          >
            <CameraIcon filled />
            <span className="text-xs font-bold uppercase tracking-wider">Snap Photo</span>
          </Link>
          <Link
            href={`/e/${eventCode}/gallery`}
            className="flex h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-slate-900 transition-all active:scale-[0.96] shadow-sm"
          >
            <GalleryIcon />
            <span className="text-xs font-bold uppercase tracking-wider">Live Gallery</span>
          </Link>
        </section>

        {/* How it works */}
        <section className="mt-12 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50">
          <h3 className="mb-8 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Digital Disposable Camera
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { step: "1. Scan", icon: <QrIcon /> },
              { step: "2. Snap", icon: <CameraIcon /> },
              { step: "3. Share", icon: <ShareIcon /> },
            ].map(({ step, icon }) => (
              <div key={step} className="flex flex-col items-center text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 ring-1 ring-slate-100">
                  {icon}
                </div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{step}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 pb-10 text-center opacity-40">
          <Image src="/logo.png" alt="Kenangan Kita" width={60} height={30} unoptimized className="mx-auto object-contain mb-2" />
          <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
            Powered by Kenangan Kita
          </p>
        </footer>
      </main>
    </div>
  );
}

