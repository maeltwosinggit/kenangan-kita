import { z } from "zod";
import { getSupabaseClient } from "../supabase/client";

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

