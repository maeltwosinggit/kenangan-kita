import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "../supabase/client";
import { getEventByCode } from "./events";

type UploadPhotoInput = {
  eventCode: string;
  file: Blob;
  thumbnailFile?: Blob;
  nickname?: string;
  uploaderId?: string;
  guestId?: string;
  capturedAt?: string;
  width?: number;
  height?: number;
  orientation?: string;
};

export async function uploadEventPhoto(input: UploadPhotoInput, supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient ?? getSupabaseClient();
  const event = await getEventByCode(input.eventCode);

  if (!event) {
    throw new Error("Event not found");
  }

  // ── Limit Enforcement ──────────────────────────────────────────────────────
  // 1. Check total event limit (ALWAYS enforced for business compliance)
  if (event.max_uploads_total !== null) {
    const { data: statsData, error: totalError } = await supabase
      .rpc("get_event_upload_stats", { p_event_id: event.id });
    
    if (totalError) throw totalError;
    
    const stats = (statsData as any)?.[0] || statsData;
    const totalCount = Number(stats?.total_uploads ?? 0);
    if (totalCount >= event.max_uploads_total) {
      throw new Error("Event upload limit reached");
    }
  }

  // 2. Check per-user limit
  if (!input.uploaderId) {
    // ANONYMOUS GUEST: Limit to 10 photos total
    if (input.guestId) {
      const { count, error: countError } = await supabase
        .from("photos")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event.id)
        .eq("guest_id", input.guestId)
        .eq("is_deleted", false);

      if (countError) throw countError;
      if ((count ?? 0) >= 10) {
        throw new Error("Guest limit reached. Please sign in to upload more photos.");
      }
    }
  } else if (event.upload_limit_enabled && event.max_uploads_per_user !== null) {
    // LOGGED IN USER: Enforce host's preference
    const { data: userCount, error: countError } = await supabase
      .rpc("get_user_upload_count", { p_event_id: event.id, p_user_id: input.uploaderId });
    if (countError) throw countError;

    if ((userCount ?? 0) >= event.max_uploads_per_user) {
      throw new Error("Personal upload limit reached for this event");
    }
  }
  // ───────────────────────────────────────────────────────────────────────────

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

  if (input.thumbnailFile) {
    const thumbPath = `events/${event.id}/${photoId}_thumb.jpg`;
    await supabase.storage
      .from("event-photos")
      .upload(thumbPath, input.thumbnailFile, {
        contentType: "image/jpeg",
        upsert: false
      }).catch(() => {
        // Silently fail if thumb upload fails, original image is what matters
      });
  }

  const { error: insertError } = await supabase.from("photos").insert({
    id: photoId,
    event_id: event.id,
    storage_path: storagePath,
    captured_at: capturedAt,
    nickname: input.nickname ?? null,
    uploader_id: input.uploaderId ?? null,
    guest_id: input.guestId ?? null,
    mime_type: "image/jpeg",
    size_bytes: input.file.size,
    width: input.width ?? null,
    height: input.height ?? null,
    orientation: input.orientation ?? null
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
  uploader_id: string | null;
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
      items: [] as Array<EventPhoto & { imageUrl: string; thumbUrl: string }>,
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
    .select("id,storage_path,captured_at,nickname,uploader_id,width,height")
    .eq("event_id", event.id)
    .eq("is_deleted", false)
    .order("captured_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw error;
  }

  const rows = (data as EventPhoto[]) ?? [];
  const paths = rows.map((row) => row.storage_path);
  const thumbPaths = rows.map((row) => row.storage_path.replace(".jpg", "_thumb.jpg"));
  
  let signedUrlMap = new Map<string, string>();

  if (paths.length > 0) {
    const { data: signedData, error: signedError } = await supabase.storage
      .from("event-photos")
      .createSignedUrls([...paths, ...thumbPaths], 60 * 60);

    if (signedError) {
      throw signedError;
    }

    signedUrlMap = new Map(
      (signedData ?? [])
        .filter((item): item is typeof item & { path: string; signedUrl: string } => !!item.signedUrl && item.path !== null)
        .map((item) => [item.path, item.signedUrl])
    );
  }

  const items = rows.map((row) => {
    const thumbPath = row.storage_path.replace(".jpg", "_thumb.jpg");
    return {
      ...row,
      imageUrl: signedUrlMap.get(row.storage_path) ?? "",
      thumbUrl: signedUrlMap.get(thumbPath) ?? signedUrlMap.get(row.storage_path) ?? ""
    };
  });

  return {
    event,
    galleryOpen: true,
    items,
    hasMore: rows.length === pageSize,
    page
  };
}

/**
 * Returns a short-lived signed URL for the most recently uploaded photo by a
 * specific user in a given event, or null if none exists.
 */
export async function getLatestUserPhotoUrl(
  eventCode: string,
  userId: string
): Promise<string | null> {
  const supabase = getSupabaseClient();
  const event = await getEventByCode(eventCode);
  if (!event) return null;

  const { data, error } = await supabase
    .from("photos")
    .select("storage_path")
    .eq("event_id", event.id)
    .eq("uploader_id", userId)
    .eq("is_deleted", false)
    .order("captured_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const { data: signed, error: signedError } = await supabase.storage
    .from("event-photos")
    .createSignedUrl(data.storage_path, 60 * 60);

  if (signedError || !signed?.signedUrl) return null;
  return signed.signedUrl;
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

export async function listAllEventPhotos(eventId: string): Promise<Array<EventPhoto & { imageUrl: string }>> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("photos")
    .select("id,storage_path,captured_at,nickname,uploader_id,width,height")
    .eq("event_id", eventId)
    .eq("is_deleted", false)
    .order("captured_at", { ascending: true }); // Chronological

  if (error) throw error;

  const rows = (data as EventPhoto[]) ?? [];
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

  return rows.map((row) => ({
    ...row,
    imageUrl: signedUrlMap.get(row.storage_path) ?? ""
  }));
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

export async function getEventGuestsContributions(eventId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("photos")
    .select("nickname")
    .eq("event_id", eventId)
    .eq("is_deleted", false);

  if (error) throw error;

  const contributions = new Map<string, number>();
  for (const row of data) {
    const name = row.nickname?.trim() || "Anonymous";
    contributions.set(name, (contributions.get(name) ?? 0) + 1);
  }

  return Array.from(contributions.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

