import { z } from "zod";
import { getSupabaseClient } from "../supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

const createEventInputSchema = z.object({
  name: z.string().min(2),
  eventDate: z.string().min(8)
});

export type EventRow = {
  id: string;
  name: string;
  event_date: string;
  event_code: string;
  reveal_mode: "instant" | "after_event";
  gallery_visible: boolean;
};

function randomEventCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function createEvent(input: z.infer<typeof createEventInputSchema>) {
  const parsed = createEventInputSchema.parse(input);
  const supabase = getSupabaseClient();
  const event_code = randomEventCode();

  const { data, error } = await supabase
    .from("events")
    .insert({
      name: parsed.name,
      event_date: parsed.eventDate,
      event_code
    })
    .select("id,name,event_date,event_code,reveal_mode,gallery_visible")
    .single();

  if (error) throw error;
  return data as EventRow;
}

export async function getEventByCode(eventCode: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .select("id,name,event_date,event_code,reveal_mode,gallery_visible")
    .eq("event_code", eventCode)
    .maybeSingle();

  if (error) throw error;
  return (data as EventRow | null) ?? null;
}

export async function getEventById(eventId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .select("id,name,event_date,event_code,reveal_mode,gallery_visible")
    .eq("id", eventId)
    .maybeSingle();

  if (error) throw error;
  return (data as EventRow | null) ?? null;
}

export async function setEventGalleryVisibility(eventId: string, galleryVisible: boolean) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .update({ gallery_visible: galleryVisible })
    .eq("id", eventId)
    .select("id,name,event_date,event_code,reveal_mode,gallery_visible")
    .single();

  if (error) throw error;
  return data as EventRow;
}

export async function listAllEvents() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .select("id,name,event_date,event_code,reveal_mode,gallery_visible")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as EventRow[]) ?? [];
}

export async function deleteEvent(supabase: SupabaseClient, eventId: string) {

  // Collect all storage paths before the row (and its photos) are deleted.
  const { data: photos, error: photosError } = await supabase
    .from("photos")
    .select("storage_path")
    .eq("event_id", eventId);

  if (photosError) throw photosError;

  // Delete storage objects in one batch call (max 1000 per call is fine for events).
  if (photos && photos.length > 0) {
    const paths = photos.map((p: { storage_path: string }) => p.storage_path);
    const { error: storageError } = await supabase.storage
      .from("event-photos")
      .remove(paths);
    if (storageError) throw storageError;
  }

  // Delete the event row — photos cascade via FK.
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw error;
}

