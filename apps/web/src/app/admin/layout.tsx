import { getSupabaseServerClient } from "@/lib/supabase/server";
import AdminHeaderWrapper from "./admin-header-wrapper";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userInfo = user
    ? {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name ?? user.user_metadata?.name,
        avatarUrl: user.user_metadata?.avatar_url,
      }
    : null;

  return (
    <>
      {userInfo && <AdminHeaderWrapper userInfo={userInfo} />}
      {children}
    </>
  );
}
