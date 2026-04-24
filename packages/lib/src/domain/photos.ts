import { getSupabaseClient } from "../supabase/client";
import { getEventByCode } from "./events";

type UploadPhotoInput = {
  eventCode: string;
  file: Blob;
  nickname?: string;
  capturedAt?: string;
  width?: number;
  height?: number;
};

export async function uploadEventPhoto(input: UploadPhotoInput) {
  const supabase = getSupabaseClient();
  const event = await getEventByCode(input.eventCode);

  if (!event) {
    throw new Error("Event not found");
  }

  const photoId = crypto.randomUUID();
  const storagePath = `events/${event.id}/${photoId}.jpg`;
  const capturedAt = input.capturedAt ?? new Date().toISOString();

  const { error: uploadError } = await supabase.storage
    .from("event-photos")
    .upload(storagePath, input.file, {
      contentType: "image/jpeg",
      upsert: false
    });

  if (uploadError) {
    throw uploadError;
  }

  const { error: insertError } = await supabase.from("photos").insert({
    id: photoId,
    event_id: event.id,
    storage_path: storagePath,
    captured_at: capturedAt,
    nickname: input.nickname ?? null,
    mime_type: "image/jpeg",
    size_bytes: input.file.size,
    width: input.width ?? null,
    height: input.height ?? null
  });

  if (insertError) {
    throw insertError;
  }

  return { photoId, storagePath, eventId: event.id };
}

type ListEventPhotosInput = {
  eventCode: string;
  page?: number;
  pageSize?: number;
};

export type EventPhoto = {
  id: string;
  storage_path: string;
  captured_at: string;
  nickname: string | null;
  width: number | null;
  height: number | null;
};

export function isEventGalleryOpen(event: {
  reveal_mode: "instant" | "after_event";
  gallery_visible: boolean;
  event_date: string;
}) {
  if (!event.gallery_visible) return false;
  if (event.reveal_mode === "instant") return true;

  const today = new Date();
  const eventDate = new Date(`${event.event_date}T23:59:59`);
  return today >= eventDate;
}

export async function listEventPhotosByCode(input: ListEventPhotosInput) {
  const supabase = getSupabaseClient();
  const event = await getEventByCode(input.eventCode);
  if (!event) {
    throw new Error("Event not found");
  }

  const galleryOpen = isEventGalleryOpen(event);
  if (!galleryOpen) {
    return {
      event,
      galleryOpen: false,
      items: [] as Array<EventPhoto & { imageUrl: string }>,
      hasMore: false,
      page: input.page ?? 0
    };
  }

  const page = input.page ?? 0;
  const pageSize = input.pageSize ?? 24;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("photos")
    .select("id,storage_path,captured_at,nickname,width,height")
    .eq("event_id", event.id)
    .eq("is_deleted", false)
    .order("captured_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw error;
  }

  const rows = (data as EventPhoto[]) ?? [];
  const paths = rows.map((row) => row.storage_path);
  let signedUrlMap = new Map<string, string>();

  if (paths.length > 0) {
    const { data: signedData, error: signedError } = await supabase.storage
      .from("event-photos")
      .createSignedUrls(paths, 60 * 60);

    if (signedError) {
      throw signedError;
    }

    signedUrlMap = new Map(
      (signedData ?? [])
        .filter((item): item is typeof item & { path: string; signedUrl: string } => !!item.signedUrl && item.path !== null)
        .map((item) => [item.path, item.signedUrl])
    );
  }

  const items = rows.map((row) => ({
    ...row,
    imageUrl: signedUrlMap.get(row.storage_path) ?? ""
  }));

  return {
    event,
    galleryOpen: true,
    items,
    hasMore: rows.length === pageSize,
    page
  };
}

type ListAdminPhotosInput = {
  eventId: string;
  page?: number;
  pageSize?: number;
};

export async function listEventPhotosForAdmin(input: ListAdminPhotosInput) {
  const supabase = getSupabaseClient();
  const page = input.page ?? 0;
  const pageSize = input.pageSize ?? 24;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("photos")
    .select("id,storage_path,captured_at,nickname,width,height,is_deleted")
    .eq("event_id", input.eventId)
    .order("captured_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw error;
  }

  const rows =
    ((data as Array<EventPhoto & { is_deleted: boolean }>) ?? []).filter((item) => !item.is_deleted) ?? [];

  const paths = rows.map((row) => row.storage_path);
  let signedUrlMap = new Map<string, string>();

  if (paths.length > 0) {
    const { data: signedData, error: signedError } = await supabase.storage
      .from("event-photos")
      .createSignedUrls(paths, 60 * 60);
    if (signedError) throw signedError;

    signedUrlMap = new Map(
      (signedData ?? [])
        .filter((item): item is typeof item & { path: string; signedUrl: string } => !!item.signedUrl && item.path !== null)
        .map((item) => [item.path, item.signedUrl])
    );
  }

  return {
    items: rows.map((row) => ({
      ...row,
      imageUrl: signedUrlMap.get(row.storage_path) ?? ""
    })),
    page,
    hasMore: rows.length === pageSize
  };
}

export async function softDeletePhoto(photoId: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("photos").update({ is_deleted: true }).eq("id", photoId);
  if (error) throw error;
}

export async function getLatestEventPhoto(eventId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("photos")
    .select("storage_path")
    .eq("event_id", eventId)
    .eq("is_deleted", false)
    .order("captured_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { data: signedData, error: signedError } = await supabase.storage
    .from("event-photos")
    .createSignedUrl(data.storage_path, 60 * 60);

  if (signedError) throw signedError;
  return signedData?.signedUrl ?? null;
}

