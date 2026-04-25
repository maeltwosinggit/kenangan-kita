import Link from "next/link";
import { UsersClient } from "./users-client";

export default function AdminUsersPage() {
  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-8">
      <div className="mb-4">
        <Link href="/admin/events" className="text-sm text-slate-600 hover:text-slate-900">
          ← Back to Events
        </Link>
      </div>
      <h1 className="text-xl font-semibold">User Management</h1>
      <p className="mt-1 text-sm text-slate-600">Toggle user roles between admin and standard user.</p>
      <UsersClient />
    </main>
  );
}

