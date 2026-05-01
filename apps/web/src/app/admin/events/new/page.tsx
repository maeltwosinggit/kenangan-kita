import { redirect } from "next/navigation";

// Moved to /events/new — accessible to all authenticated users, not just admins.
export default function AdminNewEventPage() {
  redirect("/events/new");
}
