import { z } from "zod";
import { getSupabaseClient } from "../supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";

const createEventInputSchema = z.object({
  name: z.string().min(2),
  eventDate: z.string().min(8),
  coverImagePath: z.string().optional(),
  upload_limit_enabled: z.boolean().optional(),
  max_uploads_total: z.number().optional(),
});

const updateEventInputSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  eventDate: z.string().min(8),
  revealMode: z.enum(["instant", "after_event"]),
});

export type EventRow = {
  id: string;
  name: string;
  event_date: string;
  event_code: string;
  reveal_mode: "instant" | "after_event";
  gallery_visible: boolean;
  created_by: string | null;
  cover_image_path: string | null;
  upload_limit_enabled: boolean;
  max_uploads_per_user: number | null;
  max_uploads_total: number | null;
};

export type EventUploadStats = {
  totalUploads: number;
  maxUploadsPerUser: number | null;
  totalLimit: number | null;
  limitEnabled: boolean;
};

export type UserUploadLimitStatus = {
  /** How many photos this user has uploaded to the event (non-deleted) */
  uploadCount: number;
  /** The per-user cap, or null if no limit is set / limits are disabled */
  userLimit: number | null;
  /** The event-wide total cap, or null if no limit is set / limits are disabled */
  totalLimit: number | null;
  /** Whether the user has reached their personal cap */
  isUserLimitReached: boolean;
  /** Whether the event-wide total cap has been reached */
  isEventLimitReached: boolean;
};

function randomEventCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function createEvent(
  input: z.infer<typeof createEventInputSchema>,
  supabaseClient?: SupabaseClient
) {
  const parsed = createEventInputSchema.parse(input);
  const supabase = supabaseClient ?? getSupabaseClient();
  const event_code = randomEventCode();

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("events")
    .insert({
      name: parsed.name,
      event_date: parsed.eventDate,
      event_code,
      created_by: user?.id ?? null,
      cover_image_path: parsed.coverImagePath ?? null,
      upload_limit_enabled: parsed.upload_limit_enabled ?? false,
      max_uploads_total: parsed.max_uploads_total ?? null,
    })
    .select("id,name,event_date,event_code,reveal_mode,gallery_visible,created_by,cover_image_path,upload_limit_enabled,max_uploads_per_user,max_uploads_total")
    .single();

  if (error) throw error;
  return data as EventRow;
}

export const getEventByCode = cache(async (eventCode: string) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .select("id,name,event_date,event_code,reveal_mode,gallery_visible,cover_image_path,upload_limit_enabled,max_uploads_per_user,max_uploads_total")
    .eq("event_code", eventCode)
    .maybeSingle();

  if (error) throw error;
  return (data as EventRow | null) ?? null;
});

/**
 * Optimized stats fetching for the event hub/gallery.
 * Wrapped in React cache to deduplicate within a single request.
 */
export const getEventStats = cache(async (eventId: string) => {
  const supabase = getSupabaseClient();
  const [{ count: photoCount }, { data: nicknameRows }] = await Promise.all([
    supabase
      .from("photos")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("is_deleted", false),
    supabase
      .from("photos")
      .select("nickname")
      .eq("event_id", eventId)
      .eq("is_deleted", false)
      .not("nickname", "is", null),
  ]);

  const guestCount = new Set(nicknameRows?.map((r) => r.nickname)).size;
  return { photoCount: photoCount ?? 0, guestCount };
});

export async function updateEvent(input: z.infer<typeof updateEventInputSchema>) {
  const parsed = updateEventInputSchema.parse(input);
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .update({
      name: parsed.name,
      event_date: parsed.eventDate,
      reveal_mode: parsed.revealMode,
    })
    .eq("id", parsed.id)
    .select("id,name,event_date,event_code,reveal_mode,gallery_visible,cover_image_path,upload_limit_enabled,max_uploads_per_user,max_uploads_total")
    .single();

  if (error) throw error;
  return data as EventRow;
}

export async function getEventById(eventId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .select("id,name,event_date,event_code,reveal_mode,gallery_visible,cover_image_path,upload_limit_enabled,max_uploads_per_user,max_uploads_total")
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
    .select("id,name,event_date,event_code,reveal_mode,gallery_visible,upload_limit_enabled,max_uploads_per_user,max_uploads_total")
    .single();

  if (error) throw error;
  return data as EventRow;
}

export async function listAllEvents() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .select("id,name,event_date,event_code,reveal_mode,gallery_visible,created_by,cover_image_path,upload_limit_enabled,max_uploads_per_user,max_uploads_total")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as EventRow[]) ?? [];
}

export async function listEventsByCreator(userId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .select("id,name,event_date,event_code,reveal_mode,gallery_visible,created_by,cover_image_path,upload_limit_enabled,max_uploads_per_user,max_uploads_total")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as EventRow[]) ?? [];
}


export async function deleteEvent(supabase: SupabaseClient, eventId: string) {
  // 1. Fetch event first to get cover_image_path
  const { data: event, error: eventFetchError } = await supabase
    .from("events")
    .select("cover_image_path")
    .eq("id", eventId)
    .single();

  if (eventFetchError) throw eventFetchError;

  // 2. Collect all photo storage paths before the row (and its photos) are deleted.
  const { data: photos, error: photosError } = await supabase
    .from("photos")
    .select("storage_path")
    .eq("event_id", eventId);

  if (photosError) throw photosError;

  // 3. Delete event photos from storage
  if (photos && photos.length > 0) {
    const paths = photos.map((p: { storage_path: string }) => p.storage_path);
    await supabase.storage.from("event-photos").remove(paths);
  }

  // 4. Delete cover photo from storage if exists
  if (event.cover_image_path) {
    await supabase.storage.from("event-covers").remove([event.cover_image_path]);
  }

  // 5. Delete the event row — photos cascade via FK.
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw error;
}

/**
 * Replaces (or sets) the cover photo for an event.
 * - Uploads the new file to the `event-covers` bucket.
 * - Removes the old cover file from storage if one existed.
 * - Updates `events.cover_image_path` to the new path.
 *
 * @param supabase    Browser client (must be authenticated as the event creator or admin).
 * @param eventId     The event to update.
 * @param oldPath     The existing cover_image_path (or null) — used to delete the old file.
 * @param file        The new cover image File object.
 * @returns           The updated public URL of the new cover.
 */
export async function updateEventCoverPhoto(
  supabase: SupabaseClient,
  eventId: string,
  oldPath: string | null,
  file: File
): Promise<string> {
  const ext  = file.type === "image/png" ? "png" : "jpg";
  const newPath = `covers/${crypto.randomUUID()}.${ext}`;

  // Upload new file
  const { error: uploadError } = await supabase.storage
    .from("event-covers")
    .upload(newPath, file, { contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;

  // Update the DB row
  const { error: updateError } = await supabase
    .from("events")
    .update({ cover_image_path: newPath })
    .eq("id", eventId);
  if (updateError) throw updateError;

  // Remove old file (best-effort — don't throw if it fails)
  if (oldPath) {
    supabase.storage.from("event-covers").remove([oldPath]).catch(() => {});
  }

  const { data: { publicUrl } } = supabase.storage
    .from("event-covers")
    .getPublicUrl(newPath);

  return publicUrl;
}

// ── Upload limit helpers ──────────────────────────────────────────────────────

/**
 * Returns the number of non-deleted photos the given user has uploaded
 * to an event (reads event_guests.upload_count, maintained by DB trigger).
 */
export async function getUserUploadCount(
  eventId: string,
  userId: string
): Promise<number> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .rpc("get_user_upload_count", { p_event_id: eventId, p_user_id: userId });
  if (error) throw error;
  return (data as number) ?? 0;
}

/**
 * Returns overall upload statistics for an event: total photos uploaded,
 * configured total limit, and whether limits are enabled.
 */
export async function getEventUploadStats(
  eventId: string
): Promise<EventUploadStats> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .rpc("get_event_upload_stats", { p_event_id: eventId });
    
  if (error) throw error;
  
  const row = (data as any)?.[0] || data;
  
  return {
    totalUploads:      Number(row?.total_uploads ?? 0),
    maxUploadsPerUser: row?.max_uploads_per_user ?? null,
    totalLimit:        row?.max_uploads_total    ?? null,
    limitEnabled:      row?.limit_enabled        ?? false,
  };
}

/**
 * Checks whether a user is allowed to upload another photo to an event.
 * Returns a structured status so callers can show the right message.
 */
export async function checkUserUploadLimit(
  eventCode: string,
  userId: string | null,
  supabaseClient?: SupabaseClient
): Promise<UserUploadLimitStatus> {
  const supabase = supabaseClient ?? getSupabaseClient();

  // First resolve the event code to an event ID
  const { data: eventData, error: eventError } = await supabase
    .from("events")
    .select("id")
    .eq("event_code", eventCode)
    .single();

  if (eventError || !eventData) {
    throw new Error("Event not found");
  }
  const eventId = eventData.id;

  const [countResult, statsResult] = await Promise.all([
    userId 
      ? supabase.rpc("get_user_upload_count", { p_event_id: eventId, p_user_id: userId })
      : Promise.resolve({ data: 0, error: null }),
    supabase.rpc("get_event_upload_stats", { p_event_id: eventId }),
  ]);

  if (countResult.error) throw countResult.error;
  if (statsResult.error) throw statsResult.error;

  const uploadCount = (countResult.data as number) ?? 0;
  const statsRow = (statsResult.data as any)?.[0] || statsResult.data;
  const limitEnabled: boolean     = statsRow?.limit_enabled ?? false;
  const userLimit: number | null  = limitEnabled ? (statsRow?.max_uploads_per_user ?? null) : null;
  const totalLimit: number | null = limitEnabled ? (statsRow?.max_uploads_total ?? null) : null;
  const totalUploads: number      = Number(statsRow?.total_uploads ?? 0);

  return {
    uploadCount,
    userLimit,
    totalLimit,
    isUserLimitReached:  limitEnabled && userLimit  !== null && uploadCount  >= userLimit,
    isEventLimitReached: limitEnabled && totalLimit !== null && totalUploads >= totalLimit,
  };
}

/**
 * Update the upload limit configuration for an event (creator / admin only).
 */
export async function updateEventUploadLimits(
  eventId: string,
  config: {
    uploadLimitEnabled: boolean;
    maxUploadsPerUser: number | null;
    maxUploadsTotal: number | null;
  }
): Promise<EventRow> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .update({
      upload_limit_enabled: config.uploadLimitEnabled,
      max_uploads_per_user: config.maxUploadsPerUser,
      max_uploads_total:    config.maxUploadsTotal,
    })
    .eq("id", eventId)
    .select("id,name,event_date,event_code,reveal_mode,gallery_visible,created_by,cover_image_path,upload_limit_enabled,max_uploads_per_user,max_uploads_total")
    .single();

  if (error) throw error;
  return data as EventRow;
}
