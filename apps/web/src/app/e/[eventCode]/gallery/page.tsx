export default async function GalleryPage({
  params
}: {
  params: Promise<{ eventCode: string }>;
}) {
  const { eventCode } = await params;
  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-8">
      <h1 className="text-xl font-semibold">Gallery - {eventCode}</h1>
      <p className="mt-2 text-sm text-slate-600">Gallery flow will be implemented in Phase 3.</p>
    </main>
  );
}

