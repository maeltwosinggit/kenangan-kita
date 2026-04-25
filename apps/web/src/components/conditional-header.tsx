import { getSupabaseServerClient } from "@/lib/supabase/server";
import AdminHeader from "@/components/admin-header";
import { headers } from "next/headers";

export default async function ConditionalHeader() {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  // Don't show header on guest/auth/login pages
  const isPublic =
    pathname.startsWith("/e/") ||
    pathname.startsWith("/auth/") ||
    pathname === "/login";

  if (isPublic) return null;

  let user = null;
  try {
    const supabase = await getSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // not authenticated
  }

  if (!user) return null;
  return <AdminHeader user={user} />;
}
