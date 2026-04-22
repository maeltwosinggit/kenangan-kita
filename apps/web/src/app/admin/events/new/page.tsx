"use client";

import { createEvent } from "@kenangan/lib";
import { useState } from "react";

export default function NewEventPage() {
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await createEvent({ name, eventDate });
      setCreatedCode(result.event_code);
      setName("");
      setEventDate("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

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
      {createdCode && (
        <p className="mt-3 text-sm text-green-700">
          Event created. Guest link: <span className="font-mono">/e/{createdCode}</span>
        </p>
      )}
    </main>
  );
}

