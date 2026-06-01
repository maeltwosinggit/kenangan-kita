import { getSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { EventBottomNav } from "./_components/event-bottom-nav";
import { Suspense } from "react";
import { getCachedEventByCode } from "@/lib/data/events";

/**
 * ── BottomNavWrapper ──
 * Moves the auth check behind a Suspense boundary so the 
 * layout shell can render instantly without waiting for Supabase Auth.
 */
async function BottomNavWrapper({ eventCode }: { eventCode: string }) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  return <EventBottomNav eventCode={eventCode} hasUser={!!user} />;
}

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventCode: string }>;
}) {
  const { eventCode } = await params;
  
  // This is now cached and very fast
  const event = await getCachedEventByCode(eventCode);

  if (!event) {
    notFound();
  }

  return (
    <div className="relative mx-auto min-h-screen max-w-[448px] bg-white">
      {children}
      
      {/* 
         The Nav is now in Suspense. 
         This allows the 'children' (the pages) to start rendering 
         IMMEDIATELY without waiting for the Auth check.
      */}
      <Suspense fallback={
        <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex h-20 max-w-[448px] items-center justify-around border-t border-slate-100 bg-white/80 backdrop-blur-lg animate-pulse">
           <div className="h-10 w-10 bg-slate-100 rounded-full" />
           <div className="h-14 w-14 bg-slate-100 rounded-2xl -top-4 relative" />
           <div className="h-10 w-10 bg-slate-100 rounded-full" />
        </nav>
      }>
        <BottomNavWrapper eventCode={eventCode} />
      </Suspense>
    </div>
  );
}
