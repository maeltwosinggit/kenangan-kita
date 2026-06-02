import { getEventByCode, getLatestEventPhoto, getEventStats } from "@kenangan/lib";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { EventViewHub } from "./_components/event-view-hub";

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
