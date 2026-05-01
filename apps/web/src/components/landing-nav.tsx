import Image from "next/image";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import UserMenu from "@/components/user-menu";
import { SignInNavButton } from "@/components/landing-buttons";

export default async function LandingNav() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName = (
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email ??
    "Me"
  );
  const avatarUrl = (user?.user_metadata?.avatar_url as string | null) ?? null;

  return (
    <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
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

      {user ? (
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Dashboard
          </Link>
          <UserMenu displayName={displayName} avatarUrl={avatarUrl} />
        </div>
      ) : (
        <SignInNavButton />
      )}
    </nav>
  );
}
