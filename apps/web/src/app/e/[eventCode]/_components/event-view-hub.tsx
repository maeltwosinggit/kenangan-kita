"use client";

import { useState, useEffect } from "react";
import { GalleryClient } from "./gallery-client";
import { CameraCaptureClient } from "./camera-capture-client";
import UserMenu from "@/components/user-menu";
import Image from "next/image";
import Link from "next/link";
import { QRCodeDisplay } from "@/components/qr-code-display";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getEventStats, isEventActive } from "@kenangan/lib";

type Props = {
  event: any;
  eventCode: string;
  currentUserId: string | null;
  isAdmin?: boolean;
  initialStats: { photoCount: number; guestCount: number };
  initialHeroUrl: string | null;
  shareUrl: string;
  userMenuProps: { avatarUrl: string | null; displayName: string } | null;
};

export function EventViewHub({
  event,
  eventCode,
  currentUserId,
  isAdmin = false,
  initialStats,
  initialHeroUrl,
  shareUrl,
  userMenuProps
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [guestNickname, setGuestNickname] = useState<string | null>(null);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [tempName, setTempName] = useState("");

  // ── Stats Query ──
  const statsQuery = useQuery({
    queryKey: ["event-stats", eventCode],
    queryFn: () => getEventStats(event.id),
    initialData: initialStats,
    refetchOnWindowFocus: true
  });

  const photoCount = statsQuery.data?.photoCount ?? initialStats.photoCount;
  const guestCount = statsQuery.data?.guestCount ?? initialStats.guestCount;
  const isExpired = !isEventActive(event.event_date);

  // ── Guest Onboarding ──
  useEffect(() => {
    if (currentUserId) return; // Authenticated users don't need prompt
    
    const saved = localStorage.getItem("kenangan_guest_nickname");
    if (saved) {
      setGuestNickname(saved);
    } else {
      setShowNamePrompt(true);
    }
  }, [currentUserId]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    
    const name = tempName.trim();
    localStorage.setItem("kenangan_guest_nickname", name);
    setGuestNickname(name);
    setShowNamePrompt(false);
  };

  const initialTab = searchParams.get("tab") as "event" | "camera" | "gallery" | null;
  const [activeTab, setActiveTab] = useState<"event" | "camera" | "gallery">(initialTab || "event");
  const [shouldMountCamera, setShouldMountCamera] = useState(activeTab === "camera");

  // Sync state if query param changes (browser back/forward)
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "event" || tab === "camera" || tab === "gallery") {
      setActiveTab(tab);
    } else if (!tab) {
      setActiveTab("event");
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === "camera") {
      setShouldMountCamera(true);
    } else {
      // Wait for slide-down animation (500ms) to finish before unmounting
      const timer = setTimeout(() => {
        setShouldMountCamera(false);
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const handleTabChange = (newTab: "event" | "camera" | "gallery") => {
    setActiveTab(newTab);
    // Update URL without triggering a full reload
    const params = new URLSearchParams(searchParams.toString());
    if (newTab === "event") {
      params.delete("tab");
    } else {
      params.set("tab", newTab);
    }
    router.replace(`/e/${eventCode}?${params.toString()}`, { scroll: false });
  };

  // Format date once
  const formattedDate = new Date(event.event_date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const onNativeShare = async () => {
    const shareData = {
      title: event.name,
      text: `Join the digital disposable camera for "${event.name}". 📸`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error('Share failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!");
      } catch (err) { /* ignore */ }
    }
  };

  /* ── Icons ── */
  const EventIcon = ({ active }: { active: boolean }) => (
    <svg className={`h-6 w-6 ${active ? "text-slate-900" : "text-slate-400"}`} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );

  const CameraIcon = ({ active }: { active: boolean }) => (
    <svg className={`h-6 w-6 ${active ? "text-white" : "text-slate-400"}`} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );

  const GalleryIcon = ({ active }: { active: boolean }) => (
    <svg className={`h-6 w-6 ${active ? "text-slate-900" : "text-slate-400"}`} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );

  return (
    <div className="flex h-screen-fix flex-col bg-slate-50 overflow-hidden relative pt-safe">
      
      {/* ── SHARED DYNAMIC HEADER ── */}
      <header className="shrink-0 sticky top-0 z-30 mx-auto flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white/80 px-4 backdrop-blur-md">
        {activeTab === "gallery" ? (
          <button onClick={() => handleTabChange("event")} className="transition-opacity hover:opacity-80">
            <Image src="/logo.png" alt="Kenangan Kita" width={70} height={35} unoptimized className="object-contain" />
          </button>
        ) : (
          <Link href="/dashboard" className="transition-opacity hover:opacity-80">
            <Image src="/logo.png" alt="Kenangan Kita" width={70} height={35} unoptimized className="object-contain" />
          </Link>
        )}

        <div className="flex items-center gap-3">
          {/* Photobook link - only in Gallery for Admin/Creator */}
          {activeTab === "gallery" && (isAdmin || currentUserId === event.created_by) && (
            <Link 
              href={`/e/${eventCode}/photobook`} 
              className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 transition-colors hover:bg-slate-200"
              aria-label="Generate Photobook"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-slate-700">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Photobook</span>
            </Link>
          )}

          <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 ring-1 ring-green-200">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-green-700">
              {activeTab === "gallery" ? "Live" : "Live"}
            </span>
          </div>

          <div className="ml-2 flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              {activeTab === "gallery" ? "Gallery" : "Event Hub"}
            </span>
          </div>

          {userMenuProps ? (
            <UserMenu avatarUrl={userMenuProps.avatarUrl} displayName={userMenuProps.displayName} isAdmin={isAdmin} />
          ) : (
            <Link href="/login" className="rounded-full bg-slate-900 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white transition-transform active:scale-95">
              Sign In
            </Link>
          )}
        </div>
      </header>
      
      {/* ── MAIN CONTENT CONTAINER (Sliding) ── */}
      <div className="flex-1 relative overflow-hidden">
        <div 
          className="flex h-full w-[200%] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform"
          style={{ transform: `translate3d(${activeTab === "gallery" ? "-50%" : "0%"}, 0, 0)` }}
        >
          {/* 1. EVENT HUB TAB */}
          <div className="w-1/2 h-full overflow-y-auto shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overscroll-none">
            <main className="flex flex-col px-4 pb-32 pt-6">
              <section className="mb-8">
                 <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200/60">
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl">
                      {initialHeroUrl ? (
                        <img src={initialHeroUrl} alt={event.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-300" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      <div className="absolute bottom-6 left-6 right-6 text-left">
                        <div className="mb-4 flex items-center gap-4">
                           <div className="flex flex-col">
                              <span className="text-2xl font-black text-white leading-none">{photoCount}</span>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">Memories</span>
                           </div>
                           <div className="h-8 w-px bg-white/20" />
                           <div className="flex flex-col">
                              <span className="text-2xl font-black text-white leading-none">{guestCount}</span>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">Guests</span>
                           </div>
                        </div>
                        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">
                          {formattedDate}
                        </p>
                        <h2 className="text-3xl font-black leading-tight text-white tracking-tighter">
                          {event.name}
                        </h2>
                      </div>
                    </div>
                 </div>
              </section>

              <section className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200/50">
                <h3 className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-slate-900">Invite to Group</h3>
                <p className="mb-8 text-xs text-slate-500 font-medium">Let others join by scanning your screen or sharing the link.</p>
                
                <div className="mx-auto max-w-[200px] mb-8">
                  <QRCodeDisplay url={shareUrl} size={200} />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const text = `Hey! Join the digital disposable camera for "${event.name}". 📸\n\nCapture and share moments here:\n${shareUrl}\n\n✨`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="flex-[2] flex items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-4 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-green-100 transition-all active:scale-[0.98]"
                  >
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.87 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.87 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    Share to WhatsApp
                  </button>
                  <button
                    onClick={onNativeShare}
                    className="flex-1 flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-4 text-slate-500 transition-all active:scale-[0.98] shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[24px]">share</span>
                  </button>
                </div>
              </section>

              <footer className="mt-16 pb-10 text-center opacity-40">
                <Image src="/logo.png" alt="Kenangan Kita" width={60} height={30} unoptimized className="mx-auto object-contain mb-2" />
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Digital Disposable Camera • {eventCode}</p>
              </footer>
            </main>
          </div>

          {/* 3. GALLERY TAB */}
          <div className="w-1/2 h-full overflow-y-auto shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overscroll-none">
            <section className="relative h-[240px] w-full overflow-hidden bg-slate-100">
               {initialHeroUrl ? (
                 <img src={initialHeroUrl} alt={event.name} className="h-full w-full object-cover" />
               ) : (
                 <div className="h-full w-full bg-gradient-to-br from-slate-700 to-slate-950" />
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
               <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div className="flex gap-4">
                    <div className="flex flex-col">
                      <span className="text-2xl font-black text-white">{photoCount}</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/60">Photos</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-black text-white">{guestCount}</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/60">Guests</span>
                    </div>
                  </div>
               </div>
            </section>

            <section className="px-2 pt-3 pb-32">
               <GalleryClient eventCode={eventCode} eventName={event.name} currentUserId={currentUserId} eventId={event.id} />
            </section>
          </div>
        </div>
      </div>

      {/* 2. CAMERA TAB (Slide-up Overlay) */}
      <div 
        className="fixed inset-0 z-[60] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{ transform: `translateY(${activeTab === "camera" ? "0%" : "100%"})` }}
      >
         {/* 
            CRITICAL FIX: Only mount camera when active or during transition to allow slide animation
         */}
         {shouldMountCamera && (
           <div className="h-screen-fix w-full bg-black">
              <CameraCaptureClient 
                eventCode={eventCode} 
                themeFilter={event.theme_filter}
                guestNickname={guestNickname || undefined}
                onClose={() => handleTabChange("event")} 
                onGalleryClick={() => handleTabChange("gallery")}
              />
           </div>
         )}
      </div>

      {/* ── Guest Name Prompt Modal ── */}
      {showNamePrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 p-6 backdrop-blur-md animate-in fade-in duration-300">
           <div className="w-full max-sm:max-w-none max-w-sm rounded-[2.5rem] bg-white p-8 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl">👋</div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none mb-3">Join the Event</h2>
              <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">
                Welcome to <strong>{event.name}</strong>! Enter your name so others know who took the photos.
              </p>
              
              <form onSubmit={handleNameSubmit} className="space-y-4">
                 <input 
                   type="text" 
                   placeholder="Your Nickname"
                   required
                   autoFocus
                   value={tempName}
                   onChange={(e) => setTempName(e.target.value)}
                   className="w-full h-16 rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 text-lg font-bold text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none transition-all placeholder:text-slate-300"
                 />
                 <button
                   type="submit"
                   disabled={!tempName.trim()}
                   className="w-full h-16 rounded-2xl bg-slate-900 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-30"
                 >
                   Start Capturing
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* ── SHARED BOTTOM NAV ── */}
      <nav 
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto flex h-20 max-w-[448px] items-center justify-around border-t border-slate-100 bg-white/80 px-4 pb-safe backdrop-blur-lg transition-transform duration-300 ease-in-out ${activeTab === "camera" ? "translate-y-full" : "translate-y-0"}`}
      >
        <button
          onClick={() => handleTabChange("event")}
          className="flex flex-1 flex-col items-center gap-1 transition-all active:scale-90"
        >
          <EventIcon active={activeTab === "event"} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${activeTab === "event" ? "text-slate-900" : "text-slate-400"}`}>
            Event
          </span>
        </button>

        <button
          onClick={() => !isExpired && handleTabChange("camera")}
          disabled={isExpired}
          className={`relative -top-4 flex h-16 w-16 flex-col items-center justify-center rounded-2xl shadow-xl transition-all active:scale-95 ${activeTab === "camera" ? "bg-slate-900" : "bg-white border border-slate-100"} ${isExpired ? "opacity-40 grayscale" : ""}`}
        >
          {isExpired ? (
            <svg className="h-6 w-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          ) : (
            <CameraIcon active={activeTab === "camera"} />
          )}
          {isExpired && <span className="absolute -bottom-5 text-[8px] font-black uppercase tracking-tighter text-slate-400">Closed</span>}
        </button>

        <button
          onClick={() => handleTabChange("gallery")}
          className="flex flex-1 flex-col items-center gap-1 transition-all active:scale-90"
        >
          <GalleryIcon active={activeTab === "gallery"} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${activeTab === "gallery" ? "text-slate-900" : "text-slate-400"}`}>
            Gallery
          </span>
        </button>
      </nav>

    </div>
  );
}
