import { getCachedEventByCode } from "@/lib/data/events";
import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import PreviewClient from "./preview-client";

export default async function PhotobookPreviewPage({
  params,
}: {
  params: Promise<{ eventCode: string }>;
}) {
  const { eventCode } = await params;
  const event = await getCachedEventByCode(eventCode);

  if (!event) {
    notFound();
  }

  // Double check authorization: must be creator or admin
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

  if (!isAdmin && currentUserId !== event.created_by) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[448px] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-lg font-semibold text-slate-900">Access Denied</h1>
        <p className="mt-2 text-sm text-slate-500">Only the event creator or admins can generate a photobook.</p>
      </main>
    );
  }

  let coverUrl: string | null = null;
  if (event.cover_image_path) {
    const { data } = supabase.storage.from("event-covers").getPublicUrl(event.cover_image_path);
    coverUrl = data.publicUrl ?? null;
  }

  return (
    <PreviewClient 
      eventCode={eventCode} 
      eventId={event.id} 
      eventName={event.name} 
      coverUrl={coverUrl}
    />
  );
}
