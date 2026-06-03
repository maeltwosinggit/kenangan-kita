"use client";

import { useState, useRef, useEffect } from "react";
import { createEvent, listPricingPlans, validateDiscountCode, type PricingPlan, type DiscountCode } from "@kenangan/lib";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { QRCodeDisplay } from "@/components/qr-code-display";
import Image from "next/image";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export type CreateEventResult = { eventCode: string; eventId: string };

type Step = "details" | "pricing";

export default function CreateEventForm({
  onSuccess,
  country = "GLOBAL",
  isAdmin = false,
  debugCountry,
}: {
  /** Called after successful creation. If omitted the component manages its own success state. */
  onSuccess?: (result: CreateEventResult) => void;
  country?: string;
  isAdmin?: boolean;
  debugCountry?: { vercel: string | null; cloudflare: string | null };
}) {
  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  
  // Billing states
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [discountInput, setDiscountInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  const [currentRegion, setCurrentRegion] = useState(country);
  const [customRegion, setCustomRegion] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateEventResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [openingPicker, setOpeningPicker] = useState<"camera" | "gallery" | null>(null);

  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    listPricingPlans(supabase, currentRegion).then(p => {
      setPlans(p);
      if (p.length > 0) setSelectedPlan(p[0]);
    }).catch(console.error);
  }, [currentRegion]);

  const applyDiscount = async (rawCode: string) => {
    if (!rawCode.trim()) return null;
    setIsValidatingDiscount(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const code = await validateDiscountCode(rawCode, supabase);
      if (code) {
        setAppliedDiscount(code);
        setDiscountInput("");
        return code;
      } else {
        setError("Invalid or expired discount code");
        return null;
      }
    } catch (err) {
      setError("Failed to validate code");
      return null;
    } finally {
      setIsValidatingDiscount(false);
    }
  };

  const getCurrencySymbol = (currency: string) => {
    if (currency.toLowerCase() === 'myr') return 'RM';
    return '$';
  };

  const handleApplyDiscount = () => applyDiscount(discountInput);

  const calculateFinalPrice = (tempDiscount?: DiscountCode | null) => {
    const discountToUse = tempDiscount !== undefined ? tempDiscount : appliedDiscount;
    if (!selectedPlan) return 0;
    if (!discountToUse) return selectedPlan.price_cents;

    if (discountToUse.discount_type === 'percentage') {
      const discount = Math.round(selectedPlan.price_cents * (discountToUse.value / 100));
      return Math.max(0, selectedPlan.price_cents - discount);
    } else {
      return Math.max(0, selectedPlan.price_cents - discountToUse.value);
    }
  };

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError("Image must be under 10 MB");
      return;
    }
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setError(null);
  };

  const openPicker = (type: "camera" | "gallery", ref: React.RefObject<HTMLInputElement>) => {
    setOpeningPicker(type);
    ref.current?.click();
    
    const handleFocus = () => {
      setOpeningPicker(null);
      window.removeEventListener("focus", handleFocus);
    };
    window.addEventListener("focus", handleFocus);
    setTimeout(handleFocus, 2000);
  };

  const reset = () => {
    setStep("details");
    setName("");
    setEventDate("");
    setCoverFile(null);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(null);
    setResult(null);
    setError(null);
    setCopied(false);
    setAppliedDiscount(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "details") {
      if (!coverFile) {
        setError("A cover photo is required");
        return;
      }
      setStep("pricing");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Auto-apply discount if one is typed but not yet applied
      let discountToValidate = appliedDiscount;
      if (!appliedDiscount && discountInput.trim()) {
        const validated = await applyDiscount(discountInput);
        if (!validated) {
          setLoading(false);
          return; // Error already set by applyDiscount
        }
        discountToValidate = validated;
      }

      const finalPrice = calculateFinalPrice(discountToValidate);
      
      if (finalPrice > 0) {
        setError(`Total is $${(finalPrice / 100).toFixed(2)}. Online payment is coming soon. Use a 100% discount code.`);
        setLoading(false);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      let coverImagePath: string | undefined;
      
      if (coverFile) {
        const ext = coverFile.type === "image/png" ? "png" : "jpg";
        const path = `covers/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("event-covers")
          .upload(path, coverFile, { contentType: coverFile.type, upsert: false });
        if (uploadError) throw uploadError;
        coverImagePath = path;
      }

      if (!coverImagePath) {
        throw new Error("Cover photo upload failed. Please try again.");
      }

      const created = await createEvent({ 
        name, 
        eventDate, 
        coverImagePath,
        upload_limit_enabled: selectedPlan?.photo_limit !== null,
        max_uploads_total: selectedPlan?.photo_limit ?? undefined,
        discount_code_id: discountToValidate?.id
      }, supabase);

      const res: CreateEventResult = { eventCode: created.event_code, eventId: created.id };
      setResult(res);
      onSuccess?.(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const guestUrl =
    result && typeof window !== "undefined"
      ? `${window.location.origin}/e/${result.eventCode}`
      : result
        ? `/e/${result.eventCode}`
        : null;

  const onShareWhatsApp = () => {
    if (!guestUrl) return;
    const text = `Hey! I've created a digital disposable camera for "${name}". 📸\n\nCapture and share your favorite moments from the event here:\n${guestUrl}\n\nCan't wait to see your shots! ✨`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  /* ── Success state ── */
  if (result && guestUrl) {
    return (
      <div className="flex flex-col items-center gap-6 px-4 py-10 text-center animate-in fade-in zoom-in-95">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          🎉
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Your Event is Live!</h2>
          <p className="mt-1 text-sm text-slate-500 font-medium">Invite your favorite people to start capturing.</p>
        </div>

        <QRCodeDisplay url={guestUrl} size={180} />

        <div className="w-full space-y-3">
          <button
            onClick={onShareWhatsApp}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-4 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-green-100 transition-all active:scale-[0.98]"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.87 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.87 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Share to WhatsApp
          </button>

          <div className="group relative flex w-full flex-col items-center gap-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300">
             <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Direct Link</span>
             <p className="w-full truncate px-4 font-mono text-[11px] font-bold tracking-tight text-slate-600">{guestUrl}</p>
             <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(guestUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="mt-3 w-full rounded-xl bg-slate-900 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-[0.98]"
             >
                {copied ? "✓ Copied Link" : "Copy to Clipboard"}
             </button>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2">
          <a
            href={`/admin/events/${result.eventId}/print`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Print QR Entry Card
          </a>
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
          >
            Start Another Event
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="px-4 py-6 space-y-6">
      
      {/* ── PROGRESS INDICATOR ── */}
      <div className="flex items-center gap-4 px-2 mb-2">
        <div className="flex items-center gap-2">
           <div className={["h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black", step === 'details' ? "bg-slate-900 text-white" : "bg-green-500 text-white"].join(" ")}>
              {step === 'details' ? "1" : "✓"}
           </div>
           <span className={["text-[10px] font-black uppercase tracking-widest", step === 'details' ? "text-slate-900" : "text-slate-400"].join(" ")}>Details</span>
        </div>
        <div className="h-px flex-1 bg-slate-200" />
        <div className="flex items-center gap-2">
           <div className={["h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black", step === 'pricing' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"].join(" ")}>
              2
           </div>
           <span className={["text-[10px] font-black uppercase tracking-widest", step === 'pricing' ? "text-slate-900" : "text-slate-400"].join(" ")}>Pricing</span>
        </div>
      </div>

      {step === "details" ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Cover photo */}
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Cover Photo
            </p>

            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="relative flex h-44 w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-white transition-all hover:border-slate-300 group"
            >
              {coverPreview ? (
                <img src={coverPreview} alt="Cover preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-300">
                  <span className="material-symbols-outlined text-5xl">add_a_photo</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Tap to add</span>
                </div>
              )}
              {coverPreview && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Change Photo</span>
                </div>
              )}
            </button>

            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={() => openPicker("camera", cameraRef)}
                disabled={openingPicker !== null}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all active:scale-95 disabled:opacity-50"
              >
                {openingPicker === "camera" ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                )}
                Camera
              </button>
              <button
                type="button"
                onClick={() => openPicker("gallery", galleryRef)}
                disabled={openingPicker !== null}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all active:scale-95 disabled:opacity-50"
              >
                {openingPicker === "gallery" ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">image</span>
                )}
                Gallery
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Event Name
            </label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              placeholder="e.g. Sarah's Wedding"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
            />
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Event Date
            </label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900 appearance-none"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Admin Detection Diagnostics */}
          {isAdmin && (
            <section className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 space-y-3">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">System Diagnostics</span>
                  <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[8px] font-black text-white uppercase">Admin Only</span>
               </div>
               
               <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col">
                     <span className="text-[8px] font-bold text-indigo-300 uppercase">Vercel IP Country</span>
                     <span className="text-xs font-black text-indigo-900">{debugCountry?.vercel || "null"}</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[8px] font-bold text-indigo-300 uppercase">Cloudflare Country</span>
                     <span className="text-xs font-black text-indigo-900">{debugCountry?.cloudflare || "null"}</span>
                  </div>
               </div>

               <div className="h-px bg-indigo-100" />

               <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                     <span className="text-[8px] font-bold text-indigo-300 uppercase">Active Pricing Region</span>
                     <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-black text-indigo-900">{currentRegion}</span>
                        {currentRegion !== country && (
                           <span className="text-[8px] font-bold text-indigo-400 italic">(Overridden)</span>
                        )}
                     </div>
                  </div>
                  <div className="flex gap-1">
                     <button 
                       type="button"
                       onClick={() => setCurrentRegion("MY")}
                       className={["px-2.5 py-1 text-[9px] font-black rounded-lg transition-all", currentRegion === 'MY' ? "bg-indigo-600 text-white" : "bg-white text-indigo-400 border border-indigo-100"].join(" ")}
                     >MY</button>
                     <button 
                       type="button"
                       onClick={() => setCurrentRegion("GLOBAL")}
                       className={["px-2.5 py-1 text-[9px] font-black rounded-lg transition-all", currentRegion === 'GLOBAL' ? "bg-indigo-600 text-white" : "bg-white text-indigo-400 border border-indigo-100"].join(" ")}
                     >GLOBAL</button>
                     <div className="relative">
                        <input 
                          type="text" 
                          placeholder="Code"
                          value={customRegion}
                          onChange={(e) => setCustomRegion(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && customRegion && setCurrentRegion(customRegion)}
                          className="w-12 px-2 py-1 text-[9px] font-black rounded-lg border border-indigo-100 bg-white uppercase focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        />
                     </div>
                  </div>
               </div>
            </section>
          )}

          <div>
            <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">
              Select Your Plan
            </p>
            <div className="space-y-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan)}
                  className={[
                    "w-full relative overflow-hidden rounded-2xl border-2 p-5 text-left transition-all",
                    selectedPlan?.id === plan.id 
                      ? "border-slate-900 bg-slate-900 text-white shadow-xl translate-y-[-2px]" 
                      : "border-slate-200 bg-white text-slate-900 hover:border-slate-300"
                  ].join(" ")}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-lg font-black uppercase tracking-tight leading-none">{plan.name}</h4>
                      <p className={["text-[10px] font-bold mt-1 uppercase tracking-wider", selectedPlan?.id === plan.id ? "text-slate-400" : "text-slate-400"].join(" ")}>
                        {plan.price_cents === 0 ? "Completely Free" : `${getCurrencySymbol(plan.currency)}${(plan.price_cents / 100).toFixed(0)} One-time`}
                      </p>
                    </div>
                    {selectedPlan?.id === plan.id && (
                      <span className="material-symbols-outlined text-white">check_circle</span>
                    )}
                  </div>
                  <p className={["text-xs font-medium leading-relaxed mb-4", selectedPlan?.id === plan.id ? "text-slate-300" : "text-slate-500"].join(" ")}>
                    {plan.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {plan.features.slice(0, 3).map((f, i) => (
                      <span key={i} className={["text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg", selectedPlan?.id === plan.id ? "bg-white/10 text-white" : "bg-slate-50 text-slate-500"].join(" ")}>
                        {f}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
              {plans.length === 0 && (
                <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-100">
                   <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No plans found for region {currentRegion}</p>
                </div>
              )}
            </div>
          </div>

          {/* Discount Section */}
          <div className="pt-2">
             <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">
              Promotional Code
            </p>
            {appliedDiscount ? (
              <div className="flex items-center justify-between rounded-2xl bg-green-50 border border-green-200 p-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-green-600">sell</span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-green-700">{appliedDiscount.code}</p>
                    <p className="text-[9px] font-bold text-green-600">
                      {appliedDiscount.discount_type === 'percentage' ? `${appliedDiscount.value}% OFF Applied` : `${getCurrencySymbol(selectedPlan?.currency || 'usd')}${(appliedDiscount.value/100).toFixed(2)} OFF Applied`}
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setAppliedDiscount(null)}
                  className="text-[10px] font-black uppercase tracking-widest text-green-700 opacity-60 hover:opacity-100"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="SAVE20"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                  className="w-full h-14 rounded-2xl bg-white border border-slate-200 pl-4 pr-12 text-sm font-black tracking-[0.2em] focus:border-slate-900 focus:outline-none transition-all shadow-sm"
                />
                <button 
                  type="button"
                  onClick={handleApplyDiscount}
                  disabled={isValidatingDiscount || !discountInput}
                  className="absolute right-2 top-2 h-10 px-4 flex items-center justify-center rounded-xl bg-slate-100 text-slate-900 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                >
                  {isValidatingDiscount ? "..." : "Apply"}
                </button>
              </div>
            )}
          </div>

          {/* Price Summary */}
          {selectedPlan && selectedPlan.price_cents > 0 && (
             <div className="rounded-2xl bg-slate-50 p-5 space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                   <span>Subtotal</span>
                   <span>{getCurrencySymbol(selectedPlan.currency)}{(selectedPlan.price_cents / 100).toFixed(2)}</span>
                </div>
                {appliedDiscount && (
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-green-600">
                      <span>Discount</span>
                      <span>-{getCurrencySymbol(selectedPlan.currency)}{((selectedPlan.price_cents - calculateFinalPrice()) / 100).toFixed(2)}</span>
                   </div>
                )}
                <div className="h-px bg-slate-200 my-2" />
                <div className="flex justify-between text-sm font-black uppercase tracking-widest text-slate-900">
                   <span>Total</span>
                   <span>{getCurrencySymbol(selectedPlan.currency)}{(calculateFinalPrice() / 100).toFixed(2)}</span>
                </div>
             </div>
          )}

          <button 
            type="button" 
            onClick={() => setStep("details")}
            className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 hover:text-slate-500 transition-colors"
          >
            Go Back
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-100 px-5 py-4 text-[11px] font-bold text-red-600 animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || (step === 'pricing' && !selectedPlan)}
        className={[
          "w-full rounded-2xl py-4 text-xs font-black uppercase tracking-[0.3em] text-white shadow-xl transition-all active:scale-[0.98] disabled:opacity-50",
          step === 'pricing' && calculateFinalPrice() > 0 ? "bg-indigo-600 shadow-indigo-100" : "bg-slate-900 shadow-slate-200"
        ].join(" ")}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Creating…
          </span>
        ) : step === "details" ? (
          "Continue to Pricing"
        ) : calculateFinalPrice() === 0 ? (
          "Create Free Event"
        ) : (
          `Pay ${getCurrencySymbol(selectedPlan?.currency || 'usd')}${(calculateFinalPrice() / 100).toFixed(2)} & Create`
        )}
      </button>

      {/* Hidden inputs */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </form>
  );
}
