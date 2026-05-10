"use client";

import { usePathname } from "next/navigation";
import AdminHeader from "@/components/admin-header";

export default function AdminHeaderWrapper({
  userInfo,
}: {
  userInfo: {
    id: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
  };
}) {
  const pathname = usePathname();

  // Hide the header on the print page
  if (pathname?.endsWith("/print")) return null;

  return <AdminHeader userInfo={userInfo} />;
}
