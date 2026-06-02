import { getEventById } from "@kenangan/lib";
import { headers } from "next/headers";
import { QRCodeDisplay } from "@/components/qr-code-display";
import { notFound } from "next/navigation";
import { PrintClient } from "./print-client";

export default async function PrintEventQRPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await getEventById(eventId);
  
  if (!event) {
    notFound();
  }

  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "kenangan-kita-web.vercel.app";
  const protocol = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const guestUrl = `${protocol}://${host}/e/${event.event_code}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-8 print:p-0">
      <div className="flex w-full max-w-2xl flex-col items-center justify-center rounded-2xl border-2 border-slate-200 p-12 text-center shadow-lg print:border-none print:shadow-none">
        <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-slate-900">
          {event.name}
        </h1>
        <p className="mb-12 text-lg text-slate-500">Scan this code to join our shared photo gallery!</p>

        <div className="mb-12 rounded-3xl border-4 border-slate-900 bg-white p-8">
          <QRCodeDisplay url={guestUrl} size={300} />
        </div>

        <div className="space-y-2">
          <p className="font-mono text-xl font-bold text-slate-800 tracking-wider">
            {guestUrl}
          </p>
          <p className="text-sm font-medium text-slate-400">Powered by Kenangan Kita</p>
        </div>
      </div>
      <PrintClient />
    </div>
  );
}
