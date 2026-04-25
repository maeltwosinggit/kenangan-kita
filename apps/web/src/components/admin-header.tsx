"use client";

import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function AdminHeader({ user }: { user: User }) {
  const router = useRouter();

  const onSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const name = (user.user_metadata?.full_name ?? user.user_metadata?.name) as string | undefined;
  const email = user.email;
  const displayName = name ?? email ?? "Admin";
  const initial = displayName[0].toUpperCase();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2">
        <Link href="/">
          <Image
            src="/logo.png"
            alt="Kenangan Kita"
            width={80}
            height={40}
            unoptimized
            className="object-contain"
          />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={32}
                height={32}
                className="rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-600">
                {initial}
              </div>
            )}
            <span className="hidden text-sm text-slate-700 sm:block">{displayName}</span>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
