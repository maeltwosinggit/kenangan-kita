import { CameraCaptureClient } from "./camera-capture-client";

export default async function CameraPage({
  params
}: {
  params: Promise<{ eventCode: string }>;
}) {
  const { eventCode } = await params;
  return (
    <main className="fixed inset-0 bg-black">
      <CameraCaptureClient eventCode={eventCode} />
    </main>
  );
}

