import Link from "next/link";
import type { ParticipatedEvent, CreatedEvent } from "@/lib/data/dashboard";

type EventCardProps = {
  event: ParticipatedEvent | CreatedEvent;
  isCreated?: boolean;
};

const CameraIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const GalleryIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const ManageIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    <path d="M4.93 4.93a10 10 0 0 0 0 14.14" />
  </svg>
);

const btnBase = "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold uppercase tracking-widest";
const btnPrimary = `${btnBase} bg-slate-900 text-white`;
const btnOutline = `${btnBase} border border-slate-200 text-slate-900`;

export function EventCard({ event, isCreated = false }: EventCardProps) {
  return (
    <div className={["space-y-4 rounded-xl border border-slate-200 bg-white p-4", !event.isOpen ? "opacity-75" : ""].join(" ")}>
      {/* Header row */}
      <div className="flex items-start gap-3">
        {event.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.coverImageUrl} alt={event.name} className="h-16 w-16 shrink-0 rounded-lg object-cover border border-slate-200" />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 pr-3">
              <h3 className="truncate font-semibold leading-tight text-slate-900">{event.name}</h3>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {new Date(event.event_date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              {isCreated && (
                <p className="mt-0.5 text-[10px] uppercase tracking-widest text-slate-400">
                  Code: {event.event_code}
                </p>
              )}
            </div>
            <span
              className={
                event.isOpen
                  ? "shrink-0 rounded bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-green-700"
                  : "shrink-0 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500"
              }
            >
              {event.isOpen ? "Active" : "Closed"}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {event.isOpen && (
          <Link href={`/e/${event.event_code}/camera`} className={btnPrimary}>
            <CameraIcon /> Camera
          </Link>
        )}
        <Link href={`/e/${event.event_code}/gallery`} className={btnOutline}>
          <GalleryIcon /> {event.isOpen ? "Gallery" : "View Archive"}
        </Link>
        {isCreated && (
          <Link href={`/admin/events/${event.id}`} className={btnOutline}>
            <ManageIcon /> Manage
          </Link>
        )}
      </div>
    </div>
  );
}
