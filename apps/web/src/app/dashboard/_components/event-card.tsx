import Link from "next/link";
import type { ParticipatedEvent, CreatedEvent } from "@/lib/data/dashboard";

type EventCardProps = {
  event: ParticipatedEvent | CreatedEvent;
  isCreated?: boolean;
  onManage?: () => void;
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ isOpen }: { isOpen: boolean }) {
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
  const isOpen = event.isOpen;
  const isArchived = !isOpen;

  const formattedDate = new Date(event.event_date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

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
            <StatusBadge isOpen={isOpen} />
          </div>

          {/* Date — monospace style */}
          <p className="mt-1.5 font-mono text-xs text-slate-500">{formattedDate}</p>

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
        /* Archived: single full-width outline button */
        <Link
          href={`/e/${event.event_code}?tab=gallery`}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">visibility</span>
          View Archive
        </Link>
      ) : (
        <div className="flex gap-2">
          {/* Camera — fills half width, dark */}
          <Link
            href={`/e/${event.event_code}?tab=camera`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition-all active:scale-95 hover:bg-slate-800"
          >
            <span className="material-symbols-outlined text-[20px]">photo_camera</span>
            Camera
          </Link>

          {/* Gallery — fills remaining width, outline */}
          <Link
            href={`/e/${event.event_code}?tab=gallery`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">grid_view</span>
            Gallery
          </Link>

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
