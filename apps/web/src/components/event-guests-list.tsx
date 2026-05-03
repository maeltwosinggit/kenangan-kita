"use client";

import { useQuery } from "@tanstack/react-query";
import { getEventGuestsContributions } from "@kenangan/lib";

type Props = {
  eventId: string;
};

export function EventGuestsList({ eventId }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["event-guests", eventId],
    queryFn: () => getEventGuestsContributions(eventId),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-6 text-sm text-slate-500">
        Loading guests...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
        Failed to load guests.
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
        No guests have contributed photos yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-500 px-1">
        <span>Guest Name</span>
        <span>Photos</span>
      </div>
      <ul className="space-y-2">
        {data.map((guest, idx) => (
          <li
            key={idx}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
          >
            <span className="text-sm font-medium text-slate-900">{guest.name}</span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
              {guest.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
