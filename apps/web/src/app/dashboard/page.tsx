import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/data/dashboard";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const displayName = (
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email ??
    "Guest"
  ) as string;
  const firstName = displayName.split(" ")[0];
  const avatarUrl = (user.user_metadata?.avatar_url ?? null) as string | null;

  const data = await getDashboardData(user.id, supabase);

  // Detect country for regional pricing
  const headersList = await headers();
  const vercelCountry = headersList.get("x-vercel-ip-country");
  const cloudflareCountry = headersList.get("cf-ipcountry");
  const country = vercelCountry || cloudflareCountry || "GLOBAL";

  return (
    <DashboardClient
      firstName={firstName}
      displayName={displayName}
      avatarUrl={avatarUrl}
      country={country}
      debugCountry={{
        vercel: vercelCountry,
        cloudflare: cloudflareCountry
      }}
      {...data}
    />
  );
}
