import { CameraCaptureClient } from "./camera-capture-client";

export default async function CameraPage({
  params
}: {
  params: Promise<{ eventCode: string }>;
}) {
  const { eventCode } = await params;
  return (
    // Fixed full-screen layout prevents scroll while video is active.
    // Scrollable containers during live video rendering cause layout jank on mobile.
    <main className="fixed inset-0 flex flex-col overflow-hidden bg-slate-950">
      <div className="flex shrink-0 items-center gap-2 bg-slate-950 px-4 py-3">
        <a href={`/e/${eventCode}`} className="text-sm text-slate-400 hover:text-white">← Back</a>
        <span className="text-sm font-medium text-white">{eventCode}</span>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <CameraCaptureClient eventCode={eventCode} />
      </div>
    </main>
  );
}

