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
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [flipPhase, setFlipPhase] = useState<"idle" | "out" | "in">("idle");
  const [flashOn, setFlashOn] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);

  const canCapture = useMemo(() => !!adapter && isCameraReady && !captured && !loading && !done, [adapter, isCameraReady, captured, loading, done]);
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

    // 'playing' fires when the browser is actually rendering frames.
    // 'timeupdate' is a fallback — fires repeatedly as the live stream advances.
    const onReady = () => setIsCameraReady(true);
    video.addEventListener("playing", onReady);
    video.addEventListener("timeupdate", onReady);

    camera.start().catch((err) => {
      if (err instanceof Error &&
          (err.message.includes('interrupted') ||
           err.message.includes('aborted') ||
           err.message.includes('play()'))) {
        return;
      }
      setError(err instanceof Error ? err.message : "Camera permission required");
    });

    // Resume video on tab switch / phone unlock
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        video.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      camera.stop();
      video.removeEventListener("playing", onReady);
      video.removeEventListener("timeupdate", onReady);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (captured?.previewUrl) URL.revokeObjectURL(captured.previewUrl);
    };
  }, [captured]);

  const onFlip = async () => {
    if (!adapter || flipPhase !== "idle") return;
    const next = facingMode === "environment" ? "user" : "environment";
    setFlipPhase("out");
    setIsCameraReady(false);
    await new Promise((r) => setTimeout(r, 180));
    try {
      await adapter.switchCamera(next);
    } catch {
      // device may have only one camera — silently ignore
    }
    setFacingMode(next);
    setFlipPhase("in");
    await new Promise((r) => setTimeout(r, 180));
    setFlipPhase("idle");
  };

  const onCapture = async () => {
    if (!adapter) return;
    setError(null);
    const isBackCamera = facingMode === "environment";
    try {
      if (flashOn) {
        if (isBackCamera) {
          // Back camera: hardware torch only — enable, wait for LED to fully brighten
          await adapter.setTorch(true);
          await new Promise((r) => setTimeout(r, 150));
        } else {
          // Front camera: white screen overlay
          setFlashActive(true);
          await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
          await new Promise((r) => setTimeout(r, 200));
        }
      }
      const photo = await adapter.capture();
      if (flashOn) {
        if (isBackCamera) {
          await adapter.setTorch(false);
        } else {
          await new Promise((r) => setTimeout(r, 150));
          setFlashActive(false);
        }
      }
      setCaptured(photo);
    } catch (err) {
      setFlashActive(false);
      if (flashOn && isBackCamera) await adapter.setTorch(false).catch(() => {});
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
      <div className={["relative w-full flex-1", captured || done ? "hidden" : ""].join(" ").trim()}>
        <video
          ref={videoRef}
          className="w-full rounded-lg bg-black object-cover"
          style={{
            willChange: "transform",
            minHeight: 0,
            transform: flipPhase === "out" ? "scaleX(0)" : "scaleX(1)",
            transition: flipPhase !== "idle" ? "transform 0.18s ease-in-out" : undefined,
            height: "100%"
          }}
          playsInline
          muted
          autoPlay
        />
        {/* Screen flash overlay */}
        {flashActive && (
          <div className="pointer-events-none absolute inset-0 rounded-lg bg-white" style={{ opacity: 1 }} />
        )}
        {/* Flash toggle — top-left */}
        <button
          type="button"
          onClick={() => setFlashOn((v) => !v)}
          aria-label={flashOn ? "Turn flash off" : "Turn flash on"}
          className={[
            "absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm",
            flashOn ? "bg-yellow-400 text-slate-900" : "bg-black/40 text-white"
          ].join(" ")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={flashOn ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </button>
        {/* Flip camera — top-right */}
        <button
          type="button"
          onClick={onFlip}
          disabled={flipPhase !== "idle"}
          aria-label="Flip camera"
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm disabled:opacity-40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M20 7h-9" />
            <path d="M14 17H5" />
            <polyline points="17 4 20 7 17 10" />
            <polyline points="7 14 4 17 7 20" />
          </svg>
        </button>
      </div>
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
          {!adapter ? "Initializing Camera..." : !isCameraReady ? "Starting Camera..." : "Take Photo"}
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

