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

/**
 * Returns a persistent unique identifier for an anonymous guest.
 * Stores in localStorage and a 1-year cookie for maximum durability.
 */
export function getGuestId(): string {
  if (typeof window === "undefined") return "";

  const key = "kenangan_guest_id";
  
  // 1. Try LocalStorage
  let id = localStorage.getItem(key);
  
  // 2. Try Cookie if LocalStorage is empty
  if (!id) {
    const cookieMatch = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
    if (cookieMatch) id = cookieMatch[2];
  }

  // 3. Generate new if both empty
  if (!id) {
    id = crypto.randomUUID();
  }

  // 4. Persistence Sync
  localStorage.setItem(key, id);
  // Set cookie for 1 year
  document.cookie = `${key}=${id}; Max-Age=${365 * 24 * 60 * 60}; path=/; SameSite=Lax`;

  return id;
}

