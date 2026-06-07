"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateEvent } from "@kenangan/lib";

type Props = {
  event: {
    id: string;
    name: string;
    event_date: string;
    reveal_mode: "instant" | "after_event";
    theme_filter?: string;
  };
  onSuccess?: () => void;
};

export function EditEventForm({ event, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(event.name);
  
  // Format the initial date for datetime-local input (YYYY-MM-DDTHH:mm)
  const [eventDate, setEventDate] = useState(() => {
    try {
      const d = new Date(event.event_date);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    } catch {
      return event.event_date.slice(0, 16);
    }
  });

  const [revealMode, setRevealMode] = useState(event.reveal_mode);
  const [themeFilter, setThemeFilter] = useState(event.theme_filter || "normal");

  const mutation = useMutation({
    mutationFn: () => {
      // Convert back to ISO string for the backend
      const isoDate = new Date(eventDate).toISOString();
      return updateEvent({ id: event.id, name, eventDate: isoDate, revealMode, themeFilter });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin-event", event.id] });
      onSuccess?.();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="space-y-4"
    >
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-500">
          Event Name
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-500">
          Event Date & End Time
        </label>
        <div className="relative group">
          <input
            type="datetime-local"
            required
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-0 appearance-none cursor-pointer"
          />
          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
          </div>
        </div>
        
        {eventDate && (
          <div className="mt-2 rounded-xl bg-indigo-50/50 border border-indigo-100 p-3 animate-in fade-in slide-in-from-top-1 duration-300">
             <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500 mb-1 leading-none italic">Upload Window Remark</p>
             <p className="text-[11px] font-medium text-indigo-900/70 leading-normal">
                Camera will lock on <strong>{new Date(new Date(eventDate).getTime() + 6 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {new Date(new Date(eventDate).getTime() + 6 * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</strong>.
             </p>
          </div>
        )}
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-500">
          Photo Reveal Mode
        </label>
        <select
          value={revealMode}
          onChange={(e) => setRevealMode(e.target.value as "instant" | "after_event")}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        >
          <option value="instant">Instant (Photos visible immediately)</option>
          <option value="after_event">After Event (Photos hidden until event ends)</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
          Camera Theme / Filter
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['normal', 'grain', 'monochrome'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setThemeFilter(filter)}
              className={[
                "flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all active:scale-95",
                themeFilter === filter 
                  ? "border-slate-900 bg-slate-900 text-white shadow-md" 
                  : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
              ].join(" ")}
            >
              <span className="material-symbols-outlined mb-1 text-[20px]">
                {filter === 'normal' ? 'photo_camera' : filter === 'grain' ? 'grain' : 'contrast'}
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest">{filter}</span>
            </button>
          ))}
        </div>
      </div>

      {mutation.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          Failed to update event details. Please try again.
        </div>
      )}
      {mutation.isSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-700">
          Event details updated successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="flex w-full items-center justify-center rounded-lg bg-slate-900 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
      >
        {mutation.isPending ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
