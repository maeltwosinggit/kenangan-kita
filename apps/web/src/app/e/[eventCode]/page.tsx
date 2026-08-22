import { getEventByCode, getLatestEventPhoto, getEventStats } from "@kenangan/lib";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { EventViewHub } from "./_components/event-view-hub";

/**
 * Per-event metadata for social link previews (WhatsApp, Telegram, etc.).
 * Emits Open Graph + Twitter tags so the shared link shows the event's
 * cover photo and name instead of the generic site logo.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventCode: string }>;
}): Promise<Metadata> {
  const { eventCode } = await params;
  const event = await getEventByCode(eventCode);

  if (!event) {
    return { title: "Event Not Found — Kenangan Kita" };
  }

  const supabase = await getSupabaseServerClient();

  // Resolve the best preview image: event cover, else latest gallery photo.
  let imageUrl: string | null = null;
  if (event.cover_image_path) {
    const { data } = supabase.storage.from("event-covers").getPublicUrl(event.cover_image_path);
    imageUrl = data.publicUrl ?? null;
  } else {
    imageUrl = await getLatestEventPhoto(event.id);
  }

  const title = `${event.name} — Kenangan Kita`;
  const description = "Join the digital disposable camera! Capture & share your favorite moments from this event.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function UnifiedEventPage({
  params,
}: {
  params: Promise<{ eventCode: string }>;
}) {
  const { eventCode } = await params;
  const event = await getEventByCode(eventCode);

  if (!event) {
    notFound();
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  let isAdmin = false;
  if (currentUserId) {
    const { data: roleData } = await supabase
      .from("admin_profiles")
      .select("role")
      .eq("user_id", currentUserId)
      .maybeSingle();
    isAdmin = roleData?.role === "admin";
  }

  // Initial data for fast first paint
  const [stats, latestPhoto] = await Promise.all([
    getEventStats(event.id),
    event.cover_image_path ? Promise.resolve(null) : getLatestEventPhoto(event.id)
  ]);

  let heroUrl: string | null = null;
  if (event.cover_image_path) {
    const { data } = supabase.storage.from("event-covers").getPublicUrl(event.cover_image_path);
    heroUrl = data.publicUrl ?? null;
  } else {
    heroUrl = latestPhoto;
  }

  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "kenangan-kita-web.vercel.app";
  const protocol = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const shareUrl = `${protocol}://${host}/e/${eventCode}`;

  const userMenuProps = user ? {
    avatarUrl: (user.user_metadata?.avatar_url as string | null) ?? null,
    displayName: (user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? "Guest") as string
  } : null;

  return (
    <EventViewHub 
      event={event}
      eventCode={eventCode}
      currentUserId={currentUserId}
      isAdmin={isAdmin}
      initialStats={stats}
      initialHeroUrl={heroUrl}
      shareUrl={shareUrl}
      userMenuProps={userMenuProps}
    />
  );
}
