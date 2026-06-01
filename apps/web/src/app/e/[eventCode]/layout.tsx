import { getEventByCode } from "@kenangan/lib";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { EventBottomNav } from "./_components/event-bottom-nav";

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventCode: string }>;
}) {
  const { eventCode } = await params;
  const event = await getEventByCode(eventCode);

  if (!event) {
    notFound();
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="relative mx-auto min-h-screen max-w-[448px] bg-white">
      {children}
      <EventBottomNav eventCode={eventCode} hasUser={!!user} />
    </div>
  );
}
