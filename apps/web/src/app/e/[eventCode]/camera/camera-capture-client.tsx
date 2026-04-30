"use client";

import { compressImage, getLatestUserPhotoUrl, uploadEventPhoto, WebCameraAdapter, type CapturedPhoto } from "@kenangan/lib";
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
  const [loggedInName, setLoggedInName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [flipPhase, setFlipPhase] = useState<"idle" | "out" | "in">("idle");
  const [flashOn, setFlashOn] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const [lastThumbUrl, setLastThumbUrl] = useState<string | null>(null);

  const canCapture = useMemo(() => !!adapter && isCameraReady && !captured && !loading && !done, [adapter, isCameraReady, captured, loading, done]);
  const canUpload = useMemo(() => !!captured && !loading && !done, [captured, loading, done]);

  // Fetch logged-in user's display name and id once on mount
  useEffect(() => {
    getSupabaseBrowserClient()
      .auth.getUser()
      .then(({ data }) => {
        const name =
          data.user?.user_metadata?.full_name ??
          data.user?.user_metadata?.name ??
          null;
        setLoggedInName(name);
        setUserId(data.user?.id ?? null);
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

  // On mount (or when user identity resolves), fetch the latest uploaded photo
  // for this user so the gallery thumbnail persists across devices/sessions.
  useEffect(() => {
    if (!userId) return;
    getLatestUserPhotoUrl(eventCode, userId)
      .then((url) => {
        if (url) setLastThumbUrl(url);
      })
      .catch(() => {});
  }, [userId, eventCode]);

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
  };

  const onUpload = async () => {
    if (!captured || done || loading) return;
    setLoading(true);
    setError(null);
    const nameToUse = loggedInName ?? undefined;
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
        uploaderId: userId ?? undefined,
        width: compressed.width,
        height: compressed.height
      });
      setUploadedPreviewUrl(captured.previewUrl); // save before revoking
      // Immediately show local blob as thumbnail for instant feedback.
      // Only revoke it if it's a blob: URL (remote signed URLs must not be revoked).
      const thumbUrl = URL.createObjectURL(compressed.blob);
      setLastThumbUrl((prev) => { if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev); return thumbUrl; });
      setDone(true);
      setCaptured(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-full w-full max-w-[448px] mx-auto overflow-hidden bg-black">
      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── Full-screen media layer ── */}
      {/* Video — always in DOM so the adapter reference stays valid */}
      <video
        ref={videoRef}
        className={["absolute inset-0 h-full w-full object-cover", captured || done ? "invisible" : "visible"].join(" ")}
        style={{
          willChange: "transform",
          transform: flipPhase === "out"
            ? "scaleX(0)"
            : facingMode === "user" ? "scaleX(-1)" : "scaleX(1)",
          transition: flipPhase !== "idle" ? "transform 0.18s ease-in-out" : undefined,
        }}
        playsInline
        muted
        autoPlay
      />

      {/* Captured photo review */}
      {captured && !done && (
        <img src={captured.previewUrl} alt="Captured preview" className="absolute inset-0 h-full w-full object-cover" />
      )}

      {/* Uploaded photo — done state */}
      {done && uploadedPreviewUrl && (
        <img src={uploadedPreviewUrl} alt="Uploaded photo" className="absolute inset-0 h-full w-full object-cover" />
      )}

      {/* Front-camera screen flash overlay */}
      {flashActive && <div className="pointer-events-none absolute inset-0 z-40 bg-white" />}

      {/* Gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 78%, rgba(0,0,0,0.65) 100%)",
        }}
      />

      {/* Camera loading indicator */}
      {!captured && !done && !isCameraReady && !error && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-white/60">
            <svg className="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-[11px] uppercase tracking-widest">Starting camera…</p>
          </div>
        </div>
      )}

      {/* Done checkmark overlay */}
      {done && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
              <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm font-medium tracking-wide text-white">Memory saved!</p>
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="absolute left-4 right-4 top-20 z-50 rounded-xl bg-black/80 px-4 py-3 text-sm text-white backdrop-blur-md ring-1 ring-white/10">
          <p className="font-semibold">{error.includes("HTTPS") ? "🔒 HTTPS Required" : "Camera Issue"}</p>
          <p className="mt-1 text-xs text-white/70">{error}</p>
          {!error.includes("HTTPS") && (
            <p className="mt-1 text-xs text-white/50">Allow camera permission and refresh the page.</p>
          )}
        </div>
      )}

      {/* ── Top header ── */}
      <header className="absolute left-0 right-0 top-0 z-50 flex h-14 items-center justify-between px-4">
        {/* Flip camera */}
        <button
          type="button"
          onClick={onFlip}
          disabled={flipPhase !== "idle" || !!captured || done}
          aria-label="Flip camera"
          className="p-2 text-white transition-opacity duration-150 hover:opacity-70 active:scale-95 disabled:opacity-30"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M20 7h-9" />
            <path d="M14 17H5" />
            <polyline points="17 4 20 7 17 10" />
            <polyline points="7 14 4 17 7 20" />
          </svg>
        </button>

        {/* Brand label */}
        <div className="text-sm font-black uppercase tracking-[0.2em] text-white">EVENT CAM</div>

        {/* Flash toggle */}
        <button
          type="button"
          onClick={() => setFlashOn((v) => !v)}
          disabled={!!captured || done}
          aria-label={flashOn ? "Turn flash off" : "Turn flash on"}
          className={["p-2 transition-opacity duration-150 hover:opacity-70 active:scale-95 disabled:opacity-30", flashOn ? "text-yellow-300" : "text-white"].join(" ")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={flashOn ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </button>
      </header>

      {/* Kenangan Kita subtitle */}
      {!captured && !done && (
        <div className="pointer-events-none absolute left-0 right-0 top-16 z-50 text-center">
          <span className="text-[10px] uppercase tracking-widest text-white/50">Kenangan Kita</span>
        </div>
      )}

      {/* Uploader name badge — shown while reviewing a capture */}
      {captured && !done && loggedInName && (
        <div className="absolute bottom-36 left-0 right-0 z-50 flex justify-center px-8">
          <div className="rounded-full bg-black/50 px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm ring-1 ring-white/10">
            {loggedInName}
          </div>
        </div>
      )}

      {/* ── Bottom controls ── */}
      <footer className="absolute bottom-0 left-0 right-0 z-50 flex items-center justify-between px-8 pb-12">
        {/* Left: Gallery link / Retake / Take Another */}
        {!captured && !done ? (
          <Link
            href={`/e/${eventCode}/gallery`}
            aria-label="View gallery"
            className="relative h-14 w-14 overflow-hidden rounded-xl border-2 border-white/20 transition-all duration-200 hover:border-white/40 active:scale-90"
          >
            {lastThumbUrl ? (
              <img src={lastThumbUrl} alt="Latest photo" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white/70">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            )}
          </Link>
        ) : captured ? (
          <button
            type="button"
            onClick={onRetake}
            disabled={loading}
            aria-label="Retake photo"
            className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white/20 text-white/70 transition-all duration-200 hover:border-white/40 active:scale-90 disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={onTakeAnother}
            aria-label="Take another photo"
            className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white/20 text-white/70 transition-all duration-200 hover:border-white/40 active:scale-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        )}

        {/* Center: Shutter / Confirm / Done indicator */}
        <div className="relative flex items-center justify-center">
          <div className="pointer-events-none absolute h-24 w-24 rounded-full border-4 border-white/30" />
          {!captured && !done ? (
            <button
              type="button"
              onClick={onCapture}
              disabled={!canCapture}
              aria-label="Take photo"
              className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg transition-all duration-200 active:scale-90 disabled:opacity-50"
            >
              <div className="h-[72px] w-[72px] rounded-full border border-slate-200" />
            </button>
          ) : captured ? (
            <button
              type="button"
              onClick={onUpload}
              disabled={!canUpload}
              aria-label={loading ? "Uploading…" : "Upload photo"}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg transition-all duration-200 active:scale-90 disabled:opacity-50"
            >
              {loading ? (
                <svg className="h-7 w-7 animate-spin text-slate-800" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-8 w-8 text-slate-800" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>

        {/* Right: Info / spacer / View Gallery */}
        {!captured && !done ? (
          <button
            type="button"
            aria-label="Info"
            className="flex h-14 w-14 items-center justify-center rounded-full text-white/70 transition-all duration-200 hover:bg-white/10 active:scale-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>
        ) : captured ? (
          <div className="h-14 w-14" />
        ) : (
          <Link
            href={`/e/${eventCode}/gallery`}
            aria-label="View gallery"
            className="flex h-14 w-14 items-center justify-center rounded-full text-white/70 transition-all duration-200 hover:bg-white/10 active:scale-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </Link>
        )}
      </footer>

      {/* Grid indicator dots */}
      <div className="pointer-events-none absolute left-4 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-2 opacity-30">
        <div className="h-1 w-1 rounded-full bg-white" />
        <div className="h-1 w-1 rounded-full bg-white" />
        <div className="h-1 w-1 rounded-full bg-white" />
      </div>
      <div className="pointer-events-none absolute right-4 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-2 opacity-30">
        <div className="h-1 w-1 rounded-full bg-white" />
        <div className="h-1 w-1 rounded-full bg-white" />
        <div className="h-1 w-1 rounded-full bg-white" />
      </div>
    </div>
  );
}

