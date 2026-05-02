
import Image from "next/image";
import Link from "next/link";
import UserMenu from "./user-menu";

interface UserInfo {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}

export default function AdminHeader({ userInfo }: { userInfo: UserInfo }) {
  const displayName = userInfo.name ?? userInfo.email ?? "Admin";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-[448px] items-center justify-between px-4">
        <Link href="/admin">
          <Image
            src="/logo.png"
            alt="Kenangan Kita"
            width={80}
            height={40}
            unoptimized
            className="object-contain"
          />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Dashboard
          </Link>
          <UserMenu avatarUrl={userInfo.avatarUrl || null} displayName={displayName} />
        </div>
      </div>
    </header>
  );
}
