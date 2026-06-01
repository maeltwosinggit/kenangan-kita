"use client";

import { 
  compressImage, 
  getLatestUserPhotoUrl, 
  uploadEventPhoto, 
  checkUserUploadLimit, 
  WebCameraAdapter, 
  type CapturedPhoto, 
  type UserUploadLimitStatus 
} from "@kenangan/lib";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
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
  const [showSaved, setShowSaved] = useState(false);
  const [lastThumbUrl, setLastThumbUrl] = useState<string | null>(null);
  const [limitStatus, setLimitStatus] = useState<UserUploadLimitStatus | null>(null);

  const isLimitReached = !!limitStatus && (limitStatus.isUserLimitReached || limitStatus.isEventLimitReached);
  const shotsLeft = limitStatus && limitStatus.userLimit !== null ? Math.max(0, limitStatus.userLimit - limitStatus.uploadCount) : null;
  
  const canCapture = useMemo(() => 
    !!adapter && isCameraReady && !captured && !loading && !isLimitReached, 
    [adapter, isCameraReady, captured, loading, isLimitReached]
  );
  
  const canUpload = useMemo(() => !!captured && !loading, [captured, loading]);

  const fetchLimitStatus = async (uid: string | null) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const status = await checkUserUploadLimit(eventCode, uid, supabase);
      if (!uid && status.userLimit !== null) {
        const guestCountStr = localStorage.getItem(`guest_uploads_${eventCode}`);
        const guestCount = guestCountStr ? parseInt(guestCountStr, 10) : 0;
        status.uploadCount = guestCount;
        status.isUserLimitReached = guestCount >= status.userLimit;
      }
      setLimitStatus(status);
    } catch (err) {
      console.error("Limit check error:", err);
    }
  };

  useEffect(() => {
    getSupabaseBrowserClient().auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      setLoggedInName(data.user?.user_metadata?.full_name ?? data.user?.user_metadata?.name ?? null);
      fetchLimitStatus(uid);
    }).catch(() => fetchLimitStatus(null));
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const camera = new WebCameraAdapter(video, canvas);
    setAdapter(camera);

    const onReady = () => setIsCameraReady(true);
    video.addEventListener("playing", onReady);

    camera.start().catch((err) => {
      if (err instanceof Error && (err.message.includes('interrupted') || err.message.includes('aborted'))) return;
      setError(err instanceof Error ? err.message : "Camera permission required");
    });

    return () => {
      camera.stop();
      video.removeEventListener("playing", onReady);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    getLatestUserPhotoUrl(eventCode, userId).then((url) => {
      if (url) setLastThumbUrl(url);
    }).catch(() => {});
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
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      const photo = await adapter.capture(!isBackCamera);

      if (flashOn) {
        if (isBackCamera) await adapter.setTorch(false);
        else setFlashActive(false);
      }

      setCaptured(photo);
    } catch (err) {
      setFlashActive(false);
      setError(err instanceof Error ? err.message : "Capture failed");
    }
  };

  const onUpload = async () => {
    if (!captured || loading) return;
    setLoading(true);
    try {
      const compressed = await compressImage(captured.blob, { maxWidth: 1600, quality: 0.75 });
      await uploadEventPhoto({
        eventCode,
        file: compressed.blob,
        nickname: loggedInName ?? undefined,
        uploaderId: userId ?? undefined,
        width: compressed.width,
        height: compressed.height
      });

      const thumbUrl = URL.createObjectURL(compressed.blob);
      setLastThumbUrl(thumbUrl);
      setCaptured(null);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2500);

      if (!userId) {
        const count = parseInt(localStorage.getItem(`guest_uploads_${eventCode}`) || "0", 10);
        localStorage.setItem(`guest_uploads_${eventCode}`, String(count + 1));
      }
      fetchLimitStatus(userId);
    } catch (err) {
      setError("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-full w-full max-w-[448px] mx-auto overflow-hidden bg-black flex flex-col">
      <canvas ref={canvasRef} className="hidden" />
      
      {/* ── Viewfinder Area ── */}
      <div className="relative flex-1 w-full bg-slate-900 overflow-hidden">
        <video 
          ref={videoRef} 
          className={["absolute inset-0 h-full w-full object-cover transition-opacity duration-300", captured ? "opacity-0" : "opacity-100"].join(" ")}
          style={{ transform: flipPhase === "out" ? "scaleX(0)" : facingMode === "user" ? "scaleX(-1)" : "scaleX(1)", transition: "transform 0.2s ease-in-out" }}
          playsInline muted autoPlay 
        />
        
        {captured && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={captured.previewUrl} alt="" className="absolute inset-0 h-full w-full object-cover animate-in fade-in zoom-in-95 duration-300" />
        )}

        {flashActive && <div className="pointer-events-none absolute inset-0 z-40 bg-white" />}
        <div className="pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />

        {/* Starting indicator */}
        {!captured && !isCameraReady && !error && (
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-white/40">
              <svg className="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              <p className="text-[10px] font-bold uppercase tracking-widest">Warming Up</p>
            </div>
          </div>
        )}

        {/* Success Toast */}
        {showSaved && (
          <div className="absolute inset-x-0 top-24 z-50 flex justify-center animate-in fade-in slide-in-from-top-4 duration-300 px-6">
            <div className="flex items-center gap-3 rounded-full bg-green-500 px-5 py-3 shadow-lg ring-1 ring-white/20">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white"><svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
              <span className="text-sm font-black uppercase tracking-wider text-white">Saved to Hub</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="absolute left-4 right-4 top-20 z-50 rounded-2xl bg-red-500/90 p-4 text-white backdrop-blur-md shadow-xl">
            <p className="text-xs font-black uppercase tracking-widest opacity-80">Hardware Error</p>
            <p className="mt-1 text-sm font-bold leading-snug">{error}</p>
          </div>
        )}
      </div>

      {/* ── Top Controls ── */}
      <header className="absolute left-0 right-0 top-0 z-50 flex h-20 items-center justify-between px-6 pt-4">
        <div className="h-10 w-10" /> {/* Space for parent's back button */}
        <div className="flex flex-col items-center">
           <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/90">DISPO-01</div>
           <div className="h-1 w-1 rounded-full bg-red-500 mt-1 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onFlip} disabled={flipPhase !== "idle" || !!captured} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all active:scale-90 disabled:opacity-30"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5"><path d="M20 7h-9M14 17H5M17 4l3 3-3 3M7 14l-3 3 3 3" /></svg></button>
          <button onClick={() => setFlashOn(!flashOn)} disabled={!!captured} className={["flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all active:scale-90 disabled:opacity-30", flashOn ? "bg-yellow-400 text-black" : "bg-white/10 text-white"].join(" ")}><svg viewBox="0 0 24 24" fill={flashOn ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" className="h-5 w-5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg></button>
        </div>
      </header>

      {/* ── Bottom Interface ── */}
      <footer className="relative z-50 flex h-[220px] flex-col items-center justify-center bg-black px-10 pb-8 pt-4 border-t border-white/5">
        
        {!captured ? (
          <>
            {limitStatus?.userLimit && (
              <div className="mb-6 flex flex-col items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Remaining Frames</span>
                <div className="flex gap-1">
                   {Array.from({ length: Math.min(10, limitStatus.userLimit) }).map((_, i) => (
                      <div key={i} className={["h-1.5 w-4 rounded-sm transition-colors", i < limitStatus.uploadCount ? "bg-white/10" : "bg-green-500"].join(" ")} />
                   ))}
                </div>
              </div>
            )}
            
            <div className="flex w-full items-center justify-between">
               {/* Thumbnail Preview */}
               <div className="h-16 w-16 overflow-hidden rounded-xl bg-slate-900 ring-2 ring-white/10 shadow-2xl">
                  {lastThumbUrl ? <img src={lastThumbUrl} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-white/20"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6"><rect x="3" y="3" width="18" height="18" rx="2" /><polyline points="21 15 16 10 5 21" /></svg></div>}
               </div>

               {/* Shutter Button */}
               <button 
                  onClick={onCapture} 
                  disabled={!canCapture} 
                  className="group relative flex h-24 w-24 items-center justify-center rounded-full bg-white transition-all active:scale-90 disabled:opacity-20"
               >
                  <div className="h-[76px] w-[76px] rounded-full border-4 border-black/5" />
                  <div className="absolute inset-0 rounded-full border-8 border-transparent group-hover:border-slate-100 transition-colors" />
               </button>

               <div className="w-16" /> {/* Balance spacer */}
            </div>
          </>
        ) : (
          <div className="flex w-full flex-col gap-3 animate-in slide-in-from-bottom-4 duration-500">
             <button 
                onClick={onUpload} 
                disabled={!canUpload} 
                className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-white text-base font-black uppercase tracking-widest text-black transition-all active:scale-95 disabled:opacity-50"
             >
                {loading ? "Developing…" : "Save to Roll"}
                {!loading && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-5 w-5"><polyline points="20 6 9 17 4 12" /></svg>}
             </button>
             <button 
                onClick={() => setCaptured(null)} 
                disabled={loading} 
                className="flex h-14 w-full items-center justify-center rounded-2xl border border-white/20 bg-white/5 text-sm font-bold uppercase tracking-widest text-white/70 transition-all active:scale-95"
             >
                Discard Shot
             </button>
          </div>
        )}
      </footer>
    </div>
  );
}
