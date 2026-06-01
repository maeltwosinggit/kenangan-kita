"use client";

import { compressImage, getLatestUserPhotoUrl, uploadEventPhoto, checkUserUploadLimit, WebCameraAdapter, type CapturedPhoto, type UserUploadLimitStatus } from "@kenangan/lib";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  eventCode: string;
  onClose?: () => void;
};

export function CameraCaptureClient({ eventCode, onClose }: Props) {
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
  const [showSaved, setShowSaved] = useState(false);
  const [lastThumbUrl, setLastThumbUrl] = useState<string | null>(null);
  const [limitStatus, setLimitStatus] = useState<UserUploadLimitStatus | null>(null);

  const isLimitReached = !!limitStatus && (limitStatus.isUserLimitReached || limitStatus.isEventLimitReached);
  const shotsLeft = limitStatus && limitStatus.userLimit !== null
    ? Math.max(0, limitStatus.userLimit - limitStatus.uploadCount)
    : null;
  const canCapture = useMemo(
    () => !!adapter && isCameraReady && !captured && !loading && !isLimitReached,
    [adapter, isCameraReady, captured, loading, isLimitReached]
  );
  const canUpload = useMemo(() => !!captured && !loading, [captured, loading]);

  const fetchLimitStatus = (uid: string | null) => {
    const supabase = getSupabaseBrowserClient();
    checkUserUploadLimit(eventCode, uid, supabase)
      .then((status) => {
        if (!uid && status.userLimit !== null) {
          const guestCountStr = localStorage.getItem(`guest_uploads_${eventCode}`);
          const guestCount = guestCountStr ? parseInt(guestCountStr, 10) : 0;
          status.uploadCount = guestCount;
          status.isUserLimitReached = guestCount >= status.userLimit;
        }
        setLimitStatus(status);
      })
      .catch((err) => {
        console.error("Failed to fetch limit status:", err);
      });
  };

  useEffect(() => {
    getSupabaseBrowserClient()
      .auth.getUser()
      .then(({ data }) => {
        const name = data.user?.user_metadata?.full_name ?? data.user?.user_metadata?.name ?? null;
        setLoggedInName(name);
        const uid = data.user?.id ?? null;
        setUserId(uid);
        fetchLimitStatus(uid);
      })
      .catch(() => {
        fetchLimitStatus(null);
      });
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const camera = new WebCameraAdapter(video, canvas);
    setAdapter(camera);

    const onReady = () => setIsCameraReady(true);
    video.addEventListener("playing", onReady);
    video.addEventListener("timeupdate", onReady);

    camera.start().catch((err) => {
      if (err instanceof Error && (err.message.includes('interrupted') || err.message.includes('aborted') || err.message.includes('play()'))) return;
      setError(err instanceof Error ? err.message : "Camera permission required");
    });

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') video.play().catch(() => {});
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
    } catch { /* ignore */ }
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
          await adapter.setTorch(true);
          await new Promise((r) => setTimeout(r, 150));
        } else {
          setFlashActive(true);
          await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
          await new Promise((r) => setTimeout(r, 200));
        }
      }
      const photo = await adapter.capture(!isBackCamera);
      if (flashOn) {
        if (isBackCamera) await adapter.setTorch(false);
        else {
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
    setError(null);
  };

  const onUpload = async () => {
    if (!captured || loading) return;
    setLoading(true);
    setError(null);
    const nameToUse = loggedInName ?? undefined;
    try {
      const supabase = getSupabaseBrowserClient();
      const freshStatus = await checkUserUploadLimit(eventCode, userId, supabase);
      if (!userId && freshStatus.userLimit !== null) {
        const guestCountStr = localStorage.getItem(`guest_uploads_${eventCode}`);
        const guestCount = guestCountStr ? parseInt(guestCountStr, 10) : 0;
        freshStatus.uploadCount = guestCount;
        freshStatus.isUserLimitReached = guestCount >= freshStatus.userLimit;
      }
      setLimitStatus(freshStatus);
      if (freshStatus.isUserLimitReached) {
        setError("You've reached your photo limit.");
        setLoading(false);
        return;
      }
      if (freshStatus.isEventLimitReached) {
        setError("This event has reached its total limit.");
        setLoading(false);
        return;
      }

      const compressed = await compressImage(captured.blob, { maxWidth: 1600, quality: 0.72 });
      await uploadEventPhoto({
        eventCode,
        file: compressed.blob,
        nickname: nameToUse,
        uploaderId: userId ?? undefined,
        width: compressed.width,
        height: compressed.height
      });

      const thumbUrl = URL.createObjectURL(compressed.blob);
      setLastThumbUrl(thumbUrl);
      if (captured?.previewUrl) URL.revokeObjectURL(captured.previewUrl);
      setCaptured(null);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
      if (!userId) {
        const count = parseInt(localStorage.getItem(`guest_uploads_${eventCode}`) || "0", 10);
        localStorage.setItem(`guest_uploads_${eventCode}`, String(count + 1));
      }
      fetchLimitStatus(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  return (
    <div className="relative h-full w-full max-w-[448px] mx-auto overflow-hidden bg-black">
      <canvas ref={canvasRef} className="hidden" />
      <video
        ref={videoRef}
        className={["absolute inset-0 h-full w-full object-cover", captured ? "invisible" : "visible"].join(" ")}
        style={{
          willChange: "transform",
          transform: flipPhase === "out" ? "scaleX(0)" : facingMode === "user" ? "scaleX(-1)" : "scaleX(1)",
          transition: flipPhase !== "idle" ? "transform 0.18s ease-in-out" : undefined,
        }}
        playsInline muted autoPlay
      />
      {flashActive && <div className="pointer-events-none absolute inset-0 z-40 bg-white" />}
      <div className="pointer-events-none absolute inset-0 z-10" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 78%, rgba(0,0,0,0.65) 100%)" }} />
      {!captured && !isCameraReady && !error && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-white/60">
            <svg className="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            <p className="text-[11px] uppercase tracking-widest">Starting camera…</p>
          </div>
        </div>
      )}
      {showSaved && (
        <div className="pointer-events-none absolute inset-x-0 top-24 z-50 flex justify-center animate-fade-in-up px-6">
          <div className="flex items-center gap-3 rounded-full bg-white/15 px-5 py-3 backdrop-blur-md ring-1 ring-white/20">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white"><svg className="h-4 w-4 text-slate-900" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
            <span className="text-sm font-semibold tracking-wide text-white">Memory saved!</span>
          </div>
        </div>
      )}
      {error && <div className="absolute left-4 right-4 top-20 z-50 rounded-xl bg-black/80 px-4 py-3 text-sm text-white backdrop-blur-md ring-1 ring-white/10"><p className="font-semibold">{error.includes("HTTPS") ? "🔒 HTTPS Required" : "Camera Issue"}</p><p className="mt-1 text-xs text-white/70">{error}</p></div>}
      
      <header className="absolute left-0 right-0 top-0 z-50 flex h-16 items-center justify-between px-4">
        <button
          onClick={handleClose}
          aria-label="Exit camera"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md transition-all active:scale-90 hover:bg-black/40"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/90 drop-shadow-sm">EVENT CAMERA</div>
        <div className="flex items-center gap-1">
          <button onClick={onFlip} disabled={flipPhase !== "idle" || !!captured} className="flex h-10 w-10 items-center justify-center text-white transition-opacity duration-150 hover:opacity-70 active:scale-95 disabled:opacity-30"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5"><path d="M20 7h-9M14 17H5M17 4l3 3-3 3M7 14l-3 3 3 3" /></svg></button>
          <button onClick={() => setFlashOn(!flashOn)} disabled={!!captured} className={["flex h-10 w-10 items-center justify-center transition-opacity duration-150 hover:opacity-70 active:scale-95 disabled:opacity-30", flashOn ? "text-yellow-300" : "text-white"].join(" ")}><svg viewBox="0 0 24 24" fill={flashOn ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" className="h-5 w-5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg></button>
        </div>
      </header>

      {!captured && (
        <div className="pointer-events-none absolute left-0 right-0 top-16 z-50 text-center">
          <span className="text-[10px] uppercase tracking-widest text-white/50">Kenangan Kita</span>
        </div>
      )}

      {!captured && (
        <footer className="absolute bottom-0 left-0 right-0 z-50 flex flex-col items-center px-8 pb-12">
          {limitStatus && limitStatus.userLimit !== null && (
            <div className="mb-5 flex flex-col items-center gap-2 w-full">
              <div className={["flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold backdrop-blur-sm", limitStatus.isUserLimitReached ? "bg-red-500/30 text-red-300 ring-1 ring-red-400/40" : "bg-white/10 text-white/90 ring-1 ring-white/20"].join(" ")}>
                {limitStatus.isUserLimitReached ? "No shots left" : `${shotsLeft} shots left`}
              </div>
              <div className="h-1 w-32 overflow-hidden rounded-full bg-white/20"><div className={["h-full rounded-full transition-all duration-500", limitStatus.isUserLimitReached ? "bg-red-400" : "bg-white"].join(" ")} style={{ width: `${Math.min(100, (limitStatus.uploadCount / limitStatus.userLimit) * 100)}%` }} /></div>
            </div>
          )}
          <div className="flex w-full items-center justify-between">
            <button onClick={() => {}} className="relative h-14 w-14 overflow-hidden rounded-xl border-2 border-white/20 transition-all duration-200 hover:border-white/40 active:scale-90">
              {lastThumbUrl ? <img src={lastThumbUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-white/70"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg></div>}
            </button>
            <div className="relative flex items-center justify-center">
              <div className="pointer-events-none absolute h-24 w-24 rounded-full border-4 border-white/30" />
              <button onClick={onCapture} disabled={!canCapture} className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg transition-all duration-200 active:scale-90 disabled:opacity-50"><div className="h-[72px] w-[72px] rounded-full border border-slate-200" /></button>
            </div>
            <div className="h-14 w-14" />
          </div>
        </footer>
      )}

      {captured && (
        <div className="absolute inset-0 z-50 bg-black">
          <img src={captured.previewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 40%, transparent 100%)" }} />
          <header className="absolute left-0 right-0 top-0 z-10 flex h-14 items-center justify-between border-b border-white/10 bg-white/10 px-4 backdrop-blur-md">
            <button onClick={onRetake} disabled={loading} className="flex h-10 w-10 items-center justify-center text-white transition-opacity active:opacity-70 disabled:opacity-30"><svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
            <h1 className="text-xs font-bold uppercase tracking-widest text-white">Photo Preview</h1>
            <div className="h-10 w-10" />
          </header>
          <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col gap-3 px-6 pb-10 pt-8">
            <button onClick={onUpload} disabled={!canUpload} className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-white text-base font-bold text-slate-900 transition-transform active:scale-[0.98] disabled:opacity-50">{loading ? "Uploading…" : "Keep it & Upload"}</button>
            <button onClick={onRetake} disabled={loading} className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 text-base font-semibold text-white backdrop-blur-sm transition-transform hover:bg-white/20 active:scale-[0.98] disabled:opacity-40">Retake Photo</button>
          </div>
        </div>
      )}
    </div>
  );
}
