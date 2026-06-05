import { isEventActive } from "@kenangan/lib";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ParticipatedEvent, CreatedEvent } from "@/lib/data/dashboard";

type EventCardProps = {
  event: ParticipatedEvent | CreatedEvent;
  isCreated?: boolean;
  onManage?: () => void;
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ isOpen, isExpired }: { isOpen: boolean; isExpired?: boolean }) {
  if (isExpired) {
    return (
      <span className="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
        Ended
      </span>
    );
  }
  return (
    <span
      className={[
        "shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        isOpen ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500",
      ].join(" ")}
    >
      {isOpen ? "Active" : "Archived"}
    </span>
  );
}

function RoleBadge({ isCreated }: { isCreated: boolean }) {
  return (
    <div className="flex items-center gap-1 opacity-70">
      <span className={["material-symbols-outlined text-[12px]", isCreated ? "text-indigo-500" : "text-slate-400"].join(" ")}>
        {isCreated ? "stars" : "person"}
      </span>
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
        {isCreated ? "Host" : "Guest"}
      </span>
    </div>
  );
}

function EventThumbnail({
  src,
  alt,
  grayscale,
}: {
  src: string | null;
  alt: string;
  grayscale: boolean;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={[
          "h-24 w-24 shrink-0 rounded-lg object-cover border border-slate-100",
          grayscale ? "grayscale opacity-70" : "",
        ].join(" ")}
      />
    );
  }
  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100">
      <span className="material-symbols-outlined text-[32px] text-slate-300">image</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function EventCard({ event, isCreated = false, onManage }: EventCardProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const isOpen = event.isOpen;
  const isExpired = !isEventActive(event.event_date);
  const isArchived = !isOpen || isExpired;

  const formattedDate = new Date(event.event_date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const onShareWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const guestUrl = `${window.location.origin}/e/${event.event_code}`;
    const text = `Hey! Join the digital disposable camera for "${event.name}". 📸\n\nCapture and share moments here:\n${guestUrl}\n\n✨`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const onNativeShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const guestUrl = `${window.location.origin}/e/${event.event_code}`;
    const shareData = {
      title: event.name,
      text: `Join the digital disposable camera for "${event.name}". 📸`,
      url: guestUrl,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error('Share failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(guestUrl);
        alert("Link copied to clipboard!");
      } catch (err) { /* ignore */ }
    }
  };

  const onLiveHubClick = () => {
    setIsNavigating(true);
    router.push(`/e/${event.event_code}`);
  };

  return (
    <div
      className={[
        "rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-4",
        isArchived ? "opacity-75" : "",
      ].join(" ")}
    >
      {/* ── Top row: thumbnail + meta ── */}
      <div className="flex gap-4">
        <EventThumbnail src={event.coverImageUrl} alt={event.name} grayscale={isArchived} />

        <div className="flex-1 min-w-0">
          {/* Name + status badge on same row */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="flex-1 truncate text-[17px] font-semibold leading-tight text-slate-900">
              {event.name}
            </h3>
            <StatusBadge isOpen={isOpen} isExpired={isExpired} />
          </div>

          <div className="mt-1 flex items-center gap-3">
             <RoleBadge isCreated={isCreated} />
             <div className="h-2 w-px bg-slate-200" />
             <p className="font-mono text-[10px] text-slate-400">{formattedDate}</p>
          </div>

          {/* Event code with QR icon — indigo accent */}
          {isCreated && (
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-indigo-600">
              <span className="material-symbols-outlined text-[14px]">grid_view</span>
              <span className="font-mono tracking-wide">{event.event_code}</span>
            </p>
          )}
        </div>
      </div>

      {/* ── Bottom row: action buttons ── */}
      {isArchived ? (
        <div className="flex gap-2">
          <Link
            href={`/e/${event.event_code}?tab=gallery`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">visibility</span>
            View Archive
          </Link>
          <button
            type="button"
            onClick={onShareWhatsApp}
            aria-label="Share to WhatsApp"
            className="flex items-center justify-center rounded-xl border border-slate-200 px-3.5 text-[#25D366] transition-all hover:bg-green-50 active:scale-95"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.87 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.87 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onNativeShare}
            aria-label="More share options"
            className="flex items-center justify-center rounded-xl border border-slate-200 px-3.5 text-slate-500 transition-all hover:bg-slate-50 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>
          
          {/* Manage — restored for archived/ended state if host */}
          {isCreated && (
            <button
              type="button"
              onClick={onManage}
              aria-label="Manage event"
              className="flex items-center justify-center rounded-xl border border-slate-200 px-3 text-slate-500 transition-all hover:bg-slate-50 active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          {/* Live Hub — fills half width, dark */}
          <button
            onClick={onLiveHubClick}
            disabled={isNavigating}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition-all active:scale-95 hover:bg-slate-800 disabled:opacity-70"
          >
            {isNavigating ? (
              <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
            )}
            {isNavigating ? "Entering..." : "Live Hub"}
          </button>

          {/* Share — small WhatsApp button */}
          <button
            type="button"
            onClick={onShareWhatsApp}
            aria-label="Share to WhatsApp"
            className="flex items-center justify-center rounded-xl border border-slate-200 px-3 text-[#25D366] transition-all hover:bg-green-50 active:scale-95"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.87 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.87 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
          </button>

          {/* More options — small native share button */}
          <button
            type="button"
            onClick={onNativeShare}
            aria-label="More share options"
            className="flex items-center justify-center rounded-xl border border-slate-200 px-3 text-slate-500 transition-all hover:bg-slate-50 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>

          {/* Manage — icon-only square, outline */}
          {isCreated && (
            <button
              type="button"
              onClick={onManage}
              aria-label="Manage event"
              className="flex items-center justify-center rounded-xl border border-slate-200 px-3 text-slate-500 transition-all hover:bg-slate-50 active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
