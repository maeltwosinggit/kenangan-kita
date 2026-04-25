import type { SupabaseClient } from "@supabase/supabase-js";

export type AppUserRole = "admin" | "user";

export type AppUserProfile = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  role: AppUserRole;
  created_at: string;
};

export async function listUserProfiles(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("list_admin_profiles");

  if (error) throw error;
  return (data as AppUserProfile[]) ?? [];
}

export async function updateUserRole(supabase: SupabaseClient, userId: string, role: AppUserRole) {
  const { data, error } = await supabase
    .from("admin_profiles")
    .update({ role })
    .eq("user_id", userId)
    .select("user_id,display_name,email,role,created_at")
    .single();

  if (error) throw error;
  return data as AppUserProfile;
}

