"use client";

import { compressImage, uploadEventPhoto, WebCameraAdapter, type CapturedPhoto } from "@kenangan/lib";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  eventCode: string;
};

export function CameraCaptureClient({ eventCode }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [adapter, setAdapter] = useState<WebCameraAdapter | null>(null);
  const [captured, setCaptured] = useState<CapturedPhoto | null>(null);
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState(false);
  const [loggedInName, setLoggedInName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);

  const canCapture = useMemo(() => !!adapter && !captured && !loading && !done, [adapter, captured, loading, done]);
  const canUpload = useMemo(() => !!captured && !loading && !done, [captured, loading, done]);

  // Fetch logged-in user's display name once on mount
  useEffect(() => {
    getSupabaseBrowserClient()
      .auth.getUser()
      .then(({ data }) => {
        const name =
          data.user?.user_metadata?.full_name ??
          data.user?.user_metadata?.name ??
          null;
        setLoggedInName(name);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const camera = new WebCameraAdapter(video, canvas);
    setAdapter(camera);
    camera.start().catch((err) => {
      // Don't show minor play interruption errors if camera is working
      if (err instanceof Error && 
          (err.message.includes('interrupted') || 
           err.message.includes('aborted') ||
           err.message.includes('play()'))) {
        // Camera is likely working, just had a play interruption
        console.warn('Camera play interrupted:', err.message);
        return;
      }
      setError(err instanceof Error ? err.message : "Camera permission required");
    });

    return () => {
      camera.stop();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (captured?.previewUrl) URL.revokeObjectURL(captured.previewUrl);
    };
  }, [captured]);

  const onCapture = async () => {
    if (!adapter) return;
    setError(null);
    try {
      const photo = await adapter.capture();
      setCaptured(photo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to capture photo");
    }
  };

  const onRetake = () => {
    if (captured?.previewUrl) URL.revokeObjectURL(captured.previewUrl);
    setCaptured(null);
    setDone(false);
    setError(null);
  };

  const onTakeAnother = () => {
    if (uploadedPreviewUrl) URL.revokeObjectURL(uploadedPreviewUrl);
    setUploadedPreviewUrl(null);
    onRetake();
    if (!loggedInName) setNickname("");
  };

  const onUpload = async () => {
    if (!captured || done || loading) return;
    if (!loggedInName && !nickname.trim()) {
      setNicknameError(true);
      return;
    }
    setLoading(true);
    setError(null);
    const nameToUse = (loggedInName ?? nickname.trim()) || undefined;
    try {
      const compressed = await compressImage(captured.blob, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.72
      });

      await uploadEventPhoto({
        eventCode,
        file: compressed.blob,
        nickname: nameToUse,
        width: compressed.width,
        height: compressed.height
      });
      setUploadedPreviewUrl(captured.previewUrl); // save before revoking
      setDone(true);
      setCaptured(null);
      if (!loggedInName) setNickname("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col gap-3 px-4 pb-4">
      {error && (
        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          <p className="font-medium">Camera Issue:</p>
          <p>{error}</p>
          {error.includes("HTTPS") ? (
            <div className="mt-2 text-xs">
              <p className="font-medium">🔒 Camera requires HTTPS. Try these options:</p>
              <ul className="ml-4 mt-1 list-disc">
                <li><strong>Option 1:</strong> On your computer: <code className="bg-amber-100 px-1">localhost:3000</code></li>
                <li><strong>Option 2:</strong> Use dev tunneling (ngrok/cloudflare tunnel)</li>
                <li><strong>Option 3:</strong> Test on your computer first</li>
              </ul>
            </div>
          ) : (
            <p className="mt-1 text-xs">
              📱 <strong>Mobile users:</strong> Allow camera permission when prompted, then refresh this page.
            </p>
          )}
        </div>
      )}

      {done && uploadedPreviewUrl ? (
        <img src={uploadedPreviewUrl} alt="Uploaded photo" className="w-full flex-1 rounded-lg object-cover" style={{ minHeight: 0 }} />
      ) : captured ? (
        <img src={captured.previewUrl} alt="Captured preview" className="w-full flex-1 rounded-lg object-cover" style={{ minHeight: 0 }} />
      ) : null}
      {/* Always keep video in DOM so the adapter's reference stays valid */}
      <video
        ref={videoRef}
        className={[
          "w-full flex-1 rounded-lg bg-black object-cover",
          captured || done ? "hidden" : ""
        ].join(" ").trim()}
        style={{ willChange: "transform", minHeight: 0 }}
        playsInline
        muted
        autoPlay
      />
      <canvas ref={canvasRef} className="hidden" />

      {!done && (
        <div className="flex flex-col gap-1">
          {!loggedInName && (
            <p className="text-xs text-slate-400 italic">Sign your memory — so we'll always know who made it 🤍</p>
          )}
          {loggedInName ? (
            <div className="w-full rounded border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600">
              {loggedInName}
            </div>
          ) : (
            <>
              <input
                className={[
                  "w-full rounded border px-3 py-2 text-sm",
                  nicknameError ? "border-red-400 bg-red-50" : "border-slate-300"
                ].join(" ")}
                placeholder="Your name *"
                value={nickname}
                onChange={(e) => { setNickname(e.target.value); setNicknameError(false); }}
                disabled={loading}
              />
              {nicknameError && (
                <p className="text-xs text-red-500">Please enter your name before uploading.</p>
              )}
            </>
          )}
        </div>
      )}

      {!captured && !done ? (
        <button
          className="w-full rounded bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
          onClick={onCapture}
          disabled={!canCapture}
          type="button"
        >
          {!adapter ? "Initializing Camera..." : canCapture ? "Take Photo" : "Camera Loading..."}
        </button>
      ) : captured ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            className="rounded border border-slate-300 px-4 py-3 text-sm font-medium"
            onClick={onRetake}
            disabled={loading}
            type="button"
          >
            Retake
          </button>
          <button
            className="rounded bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
            onClick={onUpload}
            disabled={!canUpload}
            type="button"
          >
            {loading ? "Uploading..." : done ? "Uploaded" : "Upload"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            className="rounded border border-slate-300 px-4 py-3 text-sm font-medium"
            onClick={onTakeAnother}
            type="button"
          >
            Take Another
          </button>
          <Link
            href={`/e/${eventCode}/gallery`}
            className="rounded bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white"
          >
            View Gallery
          </Link>
        </div>
      )}

      {done && (
        <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Upload complete. Thank you for sharing your memory.
        </div>
      )}
    </section>
  );
}

