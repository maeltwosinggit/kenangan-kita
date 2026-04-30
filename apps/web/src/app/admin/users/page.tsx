import { UsersClient } from "./users-client";
import Breadcrumb from "@/components/breadcrumb";

export default function AdminUsersPage() {
  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-8">
      <Breadcrumb crumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Events", href: "/admin/events" },
        { label: "Users" },
      ]} />
      <h1 className="text-xl font-semibold">User Management</h1>
      <p className="mt-1 text-sm text-slate-600">Toggle user roles between admin and standard user.</p>
      <UsersClient />
    </main>
  );
}

