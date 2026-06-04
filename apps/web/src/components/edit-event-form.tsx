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
  const [eventDate, setEventDate] = useState(event.event_date);
  const [revealMode, setRevealMode] = useState(event.reveal_mode);
  const [themeFilter, setThemeFilter] = useState(event.theme_filter || "normal");

  const mutation = useMutation({
    mutationFn: () => updateEvent({ id: event.id, name, eventDate, revealMode, themeFilter }),
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
          Event Date
        </label>
        <input
          type="date"
          required
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
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
