import { notFound } from "next/navigation";
import { getCachedEventByCode } from "@/lib/data/events";

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventCode: string }>;
}) {
  const { eventCode } = await params;
  
  // This is cached and very fast
  const event = await getCachedEventByCode(eventCode);

  if (!event) {
    notFound();
  }

  return (
    <div className="relative mx-auto min-h-screen max-w-[448px] bg-white">
      {children}
    </div>
  );
}
