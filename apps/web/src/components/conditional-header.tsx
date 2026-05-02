import AdminHeader from "@/components/admin-header";
import { headers } from "next/headers";

export default async function ConditionalHeader() {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  // Don't show header on landing, guest, auth, login, admin overview or dashboard (have own headers)
  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/e/") ||
    pathname.startsWith("/auth/") ||
    pathname === "/login" ||
    pathname === "/dashboard" ||
    pathname === "/events/new" ||
    pathname.endsWith("/print");

  if (isPublic) return null;

  // Middleware sets these headers after validating the JWT with getUser().
  // Reading them here is safe and requires no additional Supabase calls.
  const userId = headersList.get("x-user-id");
  if (!userId) return null;

  const userInfo = {
    id: userId,
    email: headersList.get("x-user-email") ?? undefined,
    name: headersList.get("x-user-name") || undefined,
    avatarUrl: headersList.get("x-user-avatar") || undefined,
  };

  return <AdminHeader userInfo={userInfo} />;
}
