import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-8">
      <h1 className="text-2xl font-bold">Kenangan Kita</h1>
      <p className="mt-2 text-sm text-slate-600">Scan QR, take photo, upload in seconds.</p>

      <div className="mt-6 space-y-3">
        <Link
          className="block rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white"
          href="/admin/events/new"
        >
          Create Event (Admin)
        </Link>
        <Link
          className="block rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-medium"
          href="/e/demo"
        >
          Open Demo Event
        </Link>
      </div>
    </main>
  );
}

