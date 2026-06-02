import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import CreateEventForm from "./create-event-client";

export default async function NewEventPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check admin status
  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";

  const headersList = await headers();
  const vercelCountry = headersList.get("x-vercel-ip-country");
  const cloudflareCountry = headersList.get("cf-ipcountry");
  const country = vercelCountry || cloudflareCountry || "GLOBAL";

  return (
    <div className="relative min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-[448px] items-center gap-3 px-4">
          <Link
            href="/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Back to dashboard"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <Link href="/dashboard">
            <Image
              src="/logo.png"
              alt="Kenangan Kita"
              width={80}
              height={40}
              unoptimized
              className="object-contain"
            />
          </Link>
        </div>
      </header>

      {/* Form */}
      <main className="mx-auto max-w-[448px]">
        <div className="px-4 pt-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Create Event</h1>
          <p className="mt-1 text-sm text-slate-500">Set up your event and share the link with guests.</p>
        </div>
        <CreateEventForm 
          country={country} 
          isAdmin={isAdmin} 
          debugCountry={{
            vercel: vercelCountry,
            cloudflare: cloudflareCountry
          }}
        />
      </main>
    </div>
  );
}
