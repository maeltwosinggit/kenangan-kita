"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { generateDiscountCode, getSupabaseClient, listPricingPlans, terminateDiscountCode, updateDiscountCodeMaxUses, updatePricingPlan } from "@kenangan/lib";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function BillingAdmin() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();
  
  // Tab for regional plans view
  const [pricingRegion, setPricingRegion] = useState<"MY" | "GLOBAL">("MY");

  // Discount code list filtering
  const [codeFilter, setCodeFilter] = useState<"active" | "terminated" | "all">("active");
  const [showGenerate, setShowGenerate] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isCodesOpen, setIsCodesOpen] = useState(true);

  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState<number>(0);
  const [maxUses, setMaxUses] = useState<number | undefined>();

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [terminatingId, setTerminatingId] = useState<string | null>(null);

  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingPlanData, setEditingPlanData] = useState<{
    price_cents: string;
    photo_limit: string;
    storage_days: string;
  }>({ price_cents: "", photo_limit: "", storage_days: "" });

  const discountCodesQuery = useQuery({
    queryKey: ["admin-discount-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000 // Poll every 10s
  });

  const filteredCodes = (discountCodesQuery.data ?? []).filter(dc => {
    if (codeFilter === 'active') return dc.is_active;
    if (codeFilter === 'terminated') return !dc.is_active;
    return true;
  });

  const pricingPlansQuery = useQuery({
    queryKey: ["admin-pricing-plans", pricingRegion],
    queryFn: () => listPricingPlans(supabase, pricingRegion),
  });

  const generateMutation = useMutation({
    mutationFn: (input: any) => generateDiscountCode(input, supabase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-discount-codes"] });
      setCode("");
      setValue(0);
      setMaxUses(undefined);
      setShowGenerate(false);
    },
    onError: (err) => {
      alert("Failed to generate code: " + (err as Error).message);
    }
  });

  const terminateMutation = useMutation({
    mutationFn: (codeId: string) => terminateDiscountCode(codeId, supabase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-discount-codes"] });
      setTerminatingId(null);
    },
    onError: (err) => {
      alert("Failed to deactivate code: " + (err as Error).message);
    }
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updatePricingPlan(id, data, supabase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pricing-plans"] });
      setEditingPlanId(null);
    },
    onError: (err) => {
      alert("Failed to update pricing plan: " + (err as Error).message);
    }
  });

  const updateMaxUsesMutation = useMutation({
    mutationFn: ({ id, max }: { id: string, max: number | null }) => updateDiscountCodeMaxUses(id, max, supabase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-discount-codes"] });
      setEditingId(null);
    },
    onError: (err) => {
      alert("Failed to update limit: " + (err as Error).message);
    }
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || value <= 0) return;
    generateMutation.mutate({
      code,
      type,
      value,
      maxUses
    });
  };

  const getCurrencySymbol = (currency: string) => {
    if (currency.toLowerCase() === 'myr') return 'RM';
    return '$';
  };

  return (
    <div className="space-y-8 pb-20">
      {/* 1. PRICING PLANS VIEW */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1 cursor-pointer group" onClick={() => setIsPricingOpen(!isPricingOpen)}>
          <div className="flex items-center gap-2">
            <span className={["material-symbols-outlined text-[18px] text-slate-400 transition-transform duration-300", isPricingOpen ? "rotate-90" : ""].join(" ")}>chevron_right</span>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-600 transition-colors">Regional Tiers</h2>
          </div>
          
          {isPricingOpen && (
            <div className="flex bg-slate-200/50 p-1 rounded-xl" onClick={e => e.stopPropagation()}>
               <button 
                 onClick={() => setPricingRegion("MY")}
                 className={["px-3 py-1 text-[9px] font-black rounded-lg transition-all", pricingRegion === 'MY' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"].join(" ")}
               >MY</button>
               <button 
                 onClick={() => setPricingRegion("GLOBAL")}
                 className={["px-3 py-1 text-[9px] font-black rounded-lg transition-all", pricingRegion === 'GLOBAL' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"].join(" ")}
               >GLOBAL</button>
            </div>
          )}
        </div>
        
        {isPricingOpen && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            {pricingPlansQuery.data?.map((plan) => (
              <div key={plan.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm flex flex-col justify-between group">
                {editingPlanId === plan.id ? (
                  <div className="space-y-3 animate-in fade-in duration-200">
                     <div className="flex items-center justify-between pb-2 border-b border-indigo-50">
                       <h3 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Edit {plan.name}</h3>
                       <button onClick={() => setEditingPlanId(null)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1 rounded-lg">
                         <span className="material-symbols-outlined text-[16px]">close</span>
                       </button>
                     </div>
                     <div className="grid grid-cols-3 gap-3">
                       <div>
                         <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Price (Cents)</label>
                         <input 
                           type="number" 
                           value={editingPlanData.price_cents} 
                           onChange={(e) => setEditingPlanData(prev => ({ ...prev, price_cents: e.target.value }))}
                           className="w-full rounded-lg border-2 border-indigo-100 bg-indigo-50/30 p-2 text-sm font-bold focus:border-indigo-600 focus:bg-white focus:outline-none transition-colors" 
                         />
                       </div>
                       <div>
                         <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Photo Limit</label>
                         <input 
                           type="number" 
                           placeholder="Unlimited"
                           value={editingPlanData.photo_limit} 
                           onChange={(e) => setEditingPlanData(prev => ({ ...prev, photo_limit: e.target.value }))}
                           className="w-full rounded-lg border-2 border-indigo-100 bg-indigo-50/30 p-2 text-sm font-bold focus:border-indigo-600 focus:bg-white focus:outline-none transition-colors" 
                         />
                       </div>
                       <div>
                         <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Storage (Days)</label>
                         <input 
                           type="number" 
                           value={editingPlanData.storage_days} 
                           onChange={(e) => setEditingPlanData(prev => ({ ...prev, storage_days: e.target.value }))}
                           className="w-full rounded-lg border-2 border-indigo-100 bg-indigo-50/30 p-2 text-sm font-bold focus:border-indigo-600 focus:bg-white focus:outline-none transition-colors" 
                         />
                       </div>
                     </div>
                     <button 
                       onClick={() => updatePlanMutation.mutate({ 
                         id: plan.id, 
                         data: {
                           price_cents: parseInt(editingPlanData.price_cents),
                           photo_limit: editingPlanData.photo_limit === "" ? null : parseInt(editingPlanData.photo_limit),
                           storage_days: parseInt(editingPlanData.storage_days)
                         }
                       })}
                       disabled={updatePlanMutation.isPending}
                       className="w-full rounded-xl bg-indigo-600 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
                     >
                       {updatePlanMutation.isPending ? "Saving..." : "Save Changes"}
                     </button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">{plan.name}</h3>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">{plan.photo_limit ?? "Unlimited"} Photos</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">{plan.storage_days} Days</span>
                      </div>
                      <p className="text-[10px] font-medium text-slate-500 leading-relaxed truncate">{plan.description}</p>
                    </div>
                    
                    <div className="flex flex-col items-end shrink-0 gap-2">
                      <p className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                         {getCurrencySymbol(plan.currency)}{plan.price_cents / 100}
                      </p>
                      <button 
                        onClick={() => {
                          setEditingPlanId(plan.id);
                          setEditingPlanData({
                            price_cents: plan.price_cents.toString(),
                            photo_limit: plan.photo_limit?.toString() ?? "",
                            storage_days: plan.storage_days?.toString() ?? "7"
                          });
                        }}
                        className="text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 hover:bg-indigo-50 p-1.5 rounded-lg opacity-0 group-hover:opacity-100"
                        title="Edit Tier"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="h-px bg-slate-100" />

      {/* 2. DISCOUNT CODES MANAGEMENT */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1 cursor-pointer group" onClick={() => setIsCodesOpen(!isCodesOpen)}>
           <div className="flex items-center gap-2">
             <span className={["material-symbols-outlined text-[18px] text-slate-400 transition-transform duration-300", isCodesOpen ? "rotate-90" : ""].join(" ")}>chevron_right</span>
             <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-600 transition-colors">Discount Codes</h2>
           </div>
           
           {isCodesOpen && (
             <button 
               onClick={(e) => { e.stopPropagation(); setShowGenerate(!showGenerate); }}
               className={["flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", showGenerate ? "bg-slate-100 text-slate-500" : "bg-indigo-600 text-white shadow-lg shadow-indigo-100"].join(" ")}
             >
               <span className="material-symbols-outlined text-[16px]">{showGenerate ? 'close' : 'add'}</span>
               {showGenerate ? 'Cancel' : 'New Code'}
             </button>
           )}
        </div>

        {isCodesOpen && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Generate Form — Collapsible */}
            {showGenerate && (
              <div className="rounded-2xl border-2 border-indigo-600 bg-white p-5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                <form onSubmit={handleGenerate} className="space-y-4">
                   <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">Code</label>
                       <input type="text" placeholder="SAVE20" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-black tracking-widest focus:border-indigo-600 focus:outline-none" required />
                     </div>
                     <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">Type</label>
                       <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-bold focus:border-indigo-600 focus:outline-none">
                         <option value="percentage">Percentage (%)</option>
                         <option value="fixed">Fixed (Cents)</option>
                       </select>
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">Value</label>
                       <input type="number" value={value || ""} onChange={(e) => setValue(parseInt(e.target.value))} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-bold focus:border-indigo-600 focus:outline-none" required />
                     </div>
                     <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">Max Uses</label>
                       <input type="number" placeholder="∞" value={maxUses || ""} onChange={(e) => setMaxUses(e.target.value ? parseInt(e.target.value) : undefined)} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-bold focus:border-indigo-600 focus:outline-none" />
                     </div>
                   </div>
                   <button type="submit" disabled={generateMutation.isPending} className="w-full rounded-xl bg-indigo-600 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-[0.98]">
                     {generateMutation.isPending ? "Generating..." : "Generate & Save"}
                   </button>
                </form>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
               {(['active', 'terminated', 'all'] as const).map(f => (
                 <button
                   key={f}
                   onClick={() => setCodeFilter(f)}
                   className={["px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all", codeFilter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"].join(" ")}
                 >
                   {f}
                 </button>
               ))}
            </div>

            {/* Dense List */}
            <div className="space-y-2">
              {filteredCodes.map((dc: any) => (
                <div key={dc.id} className={["rounded-2xl border bg-white shadow-sm transition-all overflow-hidden", dc.is_active ? "border-slate-100" : "border-slate-50 opacity-60 grayscale"].join(" ")}>
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={["flex h-8 w-8 shrink-0 items-center justify-center rounded-full", dc.is_active ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-400"].join(" ")}>
                        <span className="material-symbols-outlined text-[18px]">sell</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black tracking-widest text-slate-900 truncate uppercase">{dc.code}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                          {dc.discount_type === 'percentage' ? `${dc.value}% OFF` : `$${(dc.value / 100).toFixed(2)} OFF`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 pl-2">
                       <div className="text-right">
                          <p className="text-[9px] font-black text-slate-400 uppercase leading-none">{dc.use_count}{dc.max_uses ? ` / ${dc.max_uses}` : ''}</p>
                          <p className="text-[8px] font-bold text-slate-300 uppercase mt-0.5 tracking-tighter">Uses</p>
                       </div>
                       
                       {editingId !== dc.id && dc.is_active && (
                         <button 
                           onClick={() => { setEditingId(dc.id); setTerminatingId(null); setEditingValue(dc.max_uses?.toString() ?? ""); }}
                           className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 transition-colors"
                         >
                            <span className="material-symbols-outlined text-[18px]">edit_note</span>
                         </button>
                       )}
                       
                       {dc.is_active && editingId !== dc.id && terminatingId !== dc.id && (
                         <button 
                           onClick={() => { setTerminatingId(dc.id); setEditingId(null); }}
                           className="p-2 rounded-lg bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                         >
                            <span className="material-symbols-outlined text-[18px]">block</span>
                         </button>
                       )}
                    </div>
                  </div>

                  {/* Inline Terminate Confirmation */}
                  {terminatingId === dc.id && (
                     <div className="bg-red-50 p-4 border-t border-red-100 animate-in fade-in slide-in-from-top-1 duration-200">
                        <p className="text-xs font-bold text-red-800 mb-3 text-center">Terminate {dc.code}?</p>
                        <div className="flex gap-2">
                           <button 
                             onClick={() => setTerminatingId(null)}
                             className="flex-1 rounded-xl bg-white border border-red-200 text-slate-600 py-2 text-xs font-bold transition-all hover:bg-slate-50"
                           >Cancel</button>
                           <button 
                             onClick={() => terminateMutation.mutate(dc.id)}
                             disabled={terminateMutation.isPending}
                             className="flex-1 rounded-xl bg-red-600 text-white py-2 text-xs font-black uppercase tracking-widest shadow-lg shadow-red-100 transition-all active:scale-95 disabled:opacity-50"
                           >
                             {terminateMutation.isPending ? "..." : "Terminate"}
                           </button>
                        </div>
                     </div>
                  )}

                  {/* Inline Edit Area */}
                  {editingId === dc.id && (
                     <div className="bg-indigo-50 p-4 border-t border-indigo-100 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2">
                           <div className="flex-1">
                              <p className="text-[8px] font-black uppercase text-indigo-400 mb-1 pl-1">New Quota Limit</p>
                              <input
                                 type="number"
                                 value={editingValue}
                                 onChange={(e) => setEditingValue(e.target.value)}
                                 onKeyDown={(e) => e.key === 'Enter' && updateMaxUsesMutation.mutate({ id: dc.id, max: editingValue === "" ? null : parseInt(editingValue) })}
                                 className="w-full rounded-xl border-2 border-indigo-600 bg-white px-3 py-2 text-sm font-bold focus:outline-none"
                                 autoFocus
                                 placeholder="∞"
                              />
                           </div>
                           <div className="flex gap-1 pt-4">
                              <button 
                                 onClick={() => updateMaxUsesMutation.mutate({ id: dc.id, max: editingValue === "" ? null : parseInt(editingValue) })}
                                 className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg"
                              ><span className="material-symbols-outlined">check</span></button>
                              <button onClick={() => setEditingId(null)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 border border-indigo-100"><span className="material-symbols-outlined">close</span></button>
                           </div>
                        </div>
                     </div>
                  )}
                </div>
              ))}
              {filteredCodes.length === 0 && (
                <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-100">
                   <span className="material-symbols-outlined text-slate-200 text-4xl mb-2">inventory_2</span>
                   <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No {codeFilter} codes found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
