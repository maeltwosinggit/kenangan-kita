"use client";

import { useState, useRef } from "react";
import { createEvent } from "@kenangan/lib";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { QRCodeDisplay } from "@/components/qr-code-display";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export type CreateEventResult = { eventCode: string; eventId: string };

export default function CreateEventForm({
  onSuccess,
}: {
  /** Called after successful creation. If omitted the component manages its own success state. */
  onSuccess?: (result: CreateEventResult) => void;
}) {
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateEventResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [openingPicker, setOpeningPicker] = useState<"camera" | "gallery" | null>(null);

  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError("Image must be under 10 MB");
      return;
    }
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setError(null);
  };

  const openPicker = (type: "camera" | "gallery", ref: React.RefObject<HTMLInputElement>) => {
    setOpeningPicker(type);
    ref.current?.click();
    
    // The OS file picker causes the browser window to lose focus. 
    // We clear the "opening" state once the window regains focus (when picker closes).
    const handleFocus = () => {
      setOpeningPicker(null);
      window.removeEventListener("focus", handleFocus);
    };
    window.addEventListener("focus", handleFocus);
    
    // Fallback in case focus event isn't reliable on some mobile browsers
    setTimeout(handleFocus, 2000);
  };

  const reset = () => {
    setName("");
    setEventDate("");
    setCoverFile(null);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(null);
    setResult(null);
    setError(null);
    setCopied(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      let coverImagePath: string | undefined;
      if (coverFile) {
        const ext = coverFile.type === "image/png" ? "png" : "jpg";
        const path = `covers/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("event-covers")
          .upload(path, coverFile, { contentType: coverFile.type, upsert: false });
        if (uploadError) throw uploadError;
        coverImagePath = path;
      }

      const created = await createEvent({ name, eventDate, coverImagePath }, supabase);
      const res: CreateEventResult = { eventCode: created.event_code, eventId: created.id };
      setResult(res);
      onSuccess?.(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const guestUrl =
    result && typeof window !== "undefined"
      ? `${window.location.origin}/e/${result.eventCode}`
      : result
        ? `/e/${result.eventCode}`
        : null;

  /* ── Success state ── */
  if (result && guestUrl) {
    return (
      <div className="flex flex-col items-center gap-6 px-4 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          🎉
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Event Created!</h2>
          <p className="mt-1 text-sm text-slate-500">Share this link with your guests</p>
        </div>

        <QRCodeDisplay url={guestUrl} size={180} />

        <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="break-all font-mono text-sm text-slate-700">{guestUrl}</p>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(guestUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="mt-3 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-transform active:scale-[0.98]"
          >
            {copied ? "✓ Copied!" : "Copy Link"}
          </button>
        </div>

        <div className="flex w-full flex-col gap-2">
          <a
            href={`/admin/events/${result.eventId}/print`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Print QR Card 🖨️
          </a>
          <a
            href={`/e/${result.eventCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Open Event Page ↗
          </a>
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-lg px-4 py-2.5 text-sm text-slate-500 hover:text-slate-800"
          >
            Create Another Event
          </button>
        </div>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <form onSubmit={onSubmit} className="space-y-5 px-4 py-6">
      {/* Cover photo */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          Cover Photo <span className="font-normal normal-case text-slate-400">(optional)</span>
        </p>

        {/* Preview / placeholder */}
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          className="relative flex h-44 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:bg-slate-100"
        >
          {coverPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverPreview} alt="Cover preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span className="text-xs font-medium">Tap to add cover photo</span>
            </div>
          )}
          {coverPreview && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
              <span className="text-xs font-bold text-white">Change Photo</span>
            </div>
          )}
        </button>

        {/* Camera / Gallery buttons */}
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => openPicker("camera", cameraRef)}
            disabled={openingPicker !== null}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 active:bg-slate-100 disabled:opacity-70"
          >
            {openingPicker === "camera" ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            )}
            Camera
          </button>
          <button
            type="button"
            onClick={() => openPicker("gallery", galleryRef)}
            disabled={openingPicker !== null}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 active:bg-slate-100 disabled:opacity-70"
          >
            {openingPicker === "gallery" ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            )}
            Gallery
          </button>
        </div>

        {/* Hidden inputs */}
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* Event name */}
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
          Event Name
        </label>
        <input
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
          placeholder="e.g. Sarah's Wedding"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
        />
      </div>

      {/* Event date */}
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
          Event Date
        </label>
        <input
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-bold uppercase tracking-widest text-white transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Creating…
          </span>
        ) : (
          "Create Event"
        )}
      </button>
    </form>
  );
}
