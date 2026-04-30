import { getSupabaseServerClient } from "@/lib/supabase/server";
import HomeButtons from "@/components/home-buttons";
import Link from "next/link";

async function getSessionInfo(): Promise<{ isAdmin: boolean; name: string | null }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { isAdmin: false, name: null };
    const { data } = await supabase
      .from("admin_profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    const name =
      (user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? null) as string | null;
    return { isAdmin: data?.role === "admin", name };
  } catch {
    return { isAdmin: false, name: null };
  }
}

export default async function DashboardPage() {
  const { isAdmin, name } = await getSessionInfo();

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      {name && (
        <p className="text-sm text-slate-500">
          Welcome back, <span className="font-medium text-slate-700">{name.split(" ")[0]}</span>
        </p>
      )}

      {isAdmin ? (
        <>
          <p className="mt-0.5 text-xs text-slate-400">Signed in as admin</p>
          <HomeButtons isAdmin={true} />
        </>
      ) : (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-slate-500">
            Scan the QR code at your event to start taking photos.
          </p>
          <Link
            href="/"
            className="inline-block text-sm text-slate-500 underline underline-offset-2"
          >
            ← Back to home
          </Link>
        </div>
      )}
    </main>
  );
}
