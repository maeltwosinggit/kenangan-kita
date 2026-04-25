import Link from "next/link";
import Image from "next/image";
import { getSupabaseServerClient } from "@/lib/supabase/server";

async function getIsAdmin(): Promise<boolean> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase
      .from("admin_profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    return data?.role === "admin";
  } catch {
    return false;
  }
}

export default async function HomePage() {
  const isAdmin = await getIsAdmin();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center px-4 py-12">
      <Image
        src="/logo.png"
        alt="Kenangan Kita"
        width={180}
        height={180}
        priority
        unoptimized
        className="mb-2"
      />
      <p className="mt-1 text-sm text-slate-500">Scan QR, take photo, upload in seconds.</p>

      <div className="mt-8 w-full space-y-3">
        {isAdmin && (
          <Link
            className="block rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white"
            href="/admin/events"
          >
            Admin Dashboard
          </Link>
        )}
        <Link
          className="block rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-medium"
          href="/admin/events/new"
        >
          Create Event
        </Link>
      </div>
    </main>
  );
}

