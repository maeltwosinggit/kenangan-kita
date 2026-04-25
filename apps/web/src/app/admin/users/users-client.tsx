"use client";

import { listUserProfiles, type AppUserProfile, updateUserRole } from "@kenangan/lib";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

function getLabel(profile: AppUserProfile) {
  return profile.display_name || profile.email || profile.user_id;
}

export function UsersClient() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listUserProfiles(supabase),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: "admin" | "user" }) =>
      updateUserRole(supabase, userId, role),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    }
  });

  if (usersQuery.isLoading) {
    return <p className="mt-3 text-sm text-slate-600">Loading users...</p>;
  }

  if (usersQuery.isError) {
    return (
      <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        Failed to load users.
      </p>
    );
  }

  return (
    <section className="mt-4 space-y-3">
      {usersQuery.data?.map((profile) => {
        const nextRole = profile.role === "admin" ? "user" : "admin";
        return (
          <article key={profile.user_id} className="rounded border border-slate-200 bg-white p-3">
            <p className="truncate text-sm font-medium">{getLabel(profile)}</p>
            <p className="mt-1 truncate text-xs text-slate-500">{profile.email ?? profile.user_id}</p>
            <div className="mt-2 flex items-center justify-between">
              <span
                className={`rounded px-2 py-1 text-xs font-medium ${
                  profile.role === "admin" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"
                }`}
              >
                {profile.role}
              </span>
              <button
                type="button"
                onClick={() => updateRoleMutation.mutate({ userId: profile.user_id, role: nextRole })}
                disabled={updateRoleMutation.isPending}
                className="rounded border border-slate-300 px-2 py-1 text-xs font-medium disabled:opacity-50"
              >
                Set as {nextRole}
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}

