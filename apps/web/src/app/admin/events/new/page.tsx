"use client";

import { createEvent } from "@kenangan/lib";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewEventPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const guestUrl = createdCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/e/${createdCode}`
    : null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await createEvent({ name, eventDate });
      setCreatedCode(result.event_code);
      setCreatedEventId(result.id);
      setName("");
      setEventDate("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const onCopy = async () => {
    if (!guestUrl) return;
    await navigator.clipboard.writeText(guestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (createdCode && guestUrl) {
    return (
      <main className="mx-auto min-h-screen max-w-md px-4 py-8">
        <div className="flex flex-col items-center gap-6 pt-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
            🎉
          </div>
          <div>
            <h1 className="text-xl font-semibold">Event Created!</h1>
            <p className="mt-1 text-sm text-slate-500">Share this link with your guests</p>
          </div>

          {/* Link display + copy */}
          <div className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="break-all font-mono text-sm text-slate-700">{guestUrl}</p>
            <button
              onClick={onCopy}
              className="mt-3 w-full rounded bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 active:bg-slate-800"
              type="button"
            >
              {copied ? "✓ Copied!" : "Copy Link"}
            </button>
          </div>

          {/* Actions */}
          <div className="flex w-full flex-col gap-2">
            {createdEventId && (
              <button
                type="button"
                disabled={adminLoading}
                onClick={() => {
                  setAdminLoading(true);
                  router.push(`/admin/events/${createdEventId}`);
                }}
                className="flex w-full items-center justify-center gap-2 rounded bg-slate-900 px-4 py-2.5 text-center text-sm font-medium text-white disabled:opacity-60"
              >
                {adminLoading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Opening…
                  </>
                ) : (
                  "Open Admin Dashboard"
                )}
              </button>
            )}
            <a
              href={`/e/${createdCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded border border-slate-300 px-4 py-2.5 text-center text-sm font-medium hover:bg-slate-50"
            >
              Open Event Page ↗
            </a>
            <button
              onClick={() => {
                setResetting(true);
                setTimeout(() => {
                  setCreatedCode(null);
                  setCreatedEventId(null);
                  setCopied(false);
                  setResetting(false);
                }, 150);
              }}
              disabled={resetting}
              className="w-full rounded px-4 py-2.5 text-sm text-slate-500 hover:text-slate-800 disabled:opacity-50"
              type="button"
            >
              Create Another Event
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-8">
      <h1 className="text-xl font-semibold">Create Event</h1>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <input
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          placeholder="Event name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
        />
        <button
          className="w-full rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={loading}
          type="submit"
        >
          {loading ? "Creating..." : "Create Event"}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </main>
  );
}

