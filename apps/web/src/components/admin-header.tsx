
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
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white pt-safe">
      <div className="mx-auto flex h-16 max-w-[448px] items-center justify-between px-4">
        <Link href="/admin" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Image
            src="/logo.png"
            alt="Kenangan Kita"
            width={80}
            height={40}
            unoptimized
            className="object-contain"
          />
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-800">Admin</span>
        </Link>
        <div className="flex items-center gap-2">
          <UserMenu avatarUrl={userInfo.avatarUrl || null} displayName={displayName} />
        </div>
      </div>
    </header>
  );
}
