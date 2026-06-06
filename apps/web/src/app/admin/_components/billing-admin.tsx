"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { generateDiscountCode, getSupabaseClient, listPricingPlans, terminateDiscountCode, updateDiscountCodeMaxUses } from "@kenangan/lib";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function BillingAdmin() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();
  
  // Tab for regional plans view
  const [pricingRegion, setPricingRegion] = useState<"MY" | "GLOBAL">("MY");

  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState<number>(0);
  const [maxUses, setMaxUses] = useState<number | undefined>();

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

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
      alert("Discount code generated!");
    },
    onError: (err) => {
      alert("Failed to generate code: " + (err as Error).message);
    }
  });

  const terminateMutation = useMutation({
    mutationFn: (codeId: string) => terminateDiscountCode(codeId, supabase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-discount-codes"] });
    },
    onError: (err) => {
      alert("Failed to deactivate code: " + (err as Error).message);
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
    <div className="space-y-10">
      {/* 1. PRICING PLANS VIEW */}
      <section>
        <div className="mb-4 flex items-end justify-between px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Regional Pricing Plans</h2>
          <div className="flex bg-slate-100 p-1 rounded-lg">
             <button 
               onClick={() => setPricingRegion("MY")}
               className={["px-3 py-1 text-[10px] font-black rounded-md transition-all", pricingRegion === 'MY' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"].join(" ")}
             >MY</button>
             <button 
               onClick={() => setPricingRegion("GLOBAL")}
               className={["px-3 py-1 text-[10px] font-black rounded-md transition-all", pricingRegion === 'GLOBAL' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"].join(" ")}
             >GLOBAL</button>
          </div>
        </div>
        
        <div className="space-y-3">
          {pricingPlansQuery.data?.map((plan) => (
            <div key={plan.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">{plan.region}</p>
                    <h3 className="text-sm font-black uppercase text-slate-900">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-lg font-black text-slate-900">
                      {getCurrencySymbol(plan.currency)}{plan.price_cents / 100}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{plan.currency}</p>
                 </div>
              </div>
            </div>
          ))}
          {pricingPlansQuery.isLoading && <div className="py-10 text-center animate-pulse text-slate-300 font-bold uppercase text-xs">Loading Plans...</div>}
        </div>
      </section>

      {/* 2. GENERATE CODE FORM */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900">Generate Discount Code</h2>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Code</label>
              <input 
                type="text" 
                placeholder="e.g. SAVE20" 
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm font-black tracking-widest focus:border-slate-900 focus:outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Type</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm font-bold focus:border-slate-900 focus:outline-none"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (Cents)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Value</label>
              <input 
                type="number" 
                placeholder={type === 'percentage' ? "20" : "500"} 
                value={value || ""}
                onChange={(e) => setValue(parseInt(e.target.value))}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm font-bold focus:border-slate-900 focus:outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Max Uses (Optional)</label>
              <input 
                type="number" 
                placeholder="Unlimited" 
                value={maxUses || ""}
                onChange={(e) => setMaxUses(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm font-bold focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={generateMutation.isPending}
            className="w-full rounded-xl bg-slate-900 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {generateMutation.isPending ? "Generating..." : "Generate Code"}
          </button>
        </form>
      </section>

      {/* 3. EXISTING CODES LIST */}
      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 px-1">Manage Discount Codes</h2>
        <div className="space-y-3">
          {discountCodesQuery.data?.map((dc: any) => (
            <div key={dc.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-slate-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={["flex h-10 w-10 items-center justify-center rounded-full text-indigo-600 transition-colors", dc.is_active ? "bg-indigo-50" : "bg-slate-100 grayscale"].join(" ")}>
                    <span className="material-symbols-outlined text-[20px]">sell</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <p className={["text-sm font-black tracking-widest", dc.is_active ? "text-slate-900" : "text-slate-400 line-through"].join(" ")}>{dc.code}</p>
                       {!dc.is_active && <span className="text-[8px] font-black uppercase bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Terminated</span>}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {dc.discount_type === 'percentage' ? `${dc.value}% OFF` : `$${(dc.value / 100).toFixed(2)} OFF`}
                    </p>
                  </div>
                </div>
                <div className={["h-2 w-2 rounded-full", dc.is_active ? "bg-green-500" : "bg-slate-300"].join(" ")} />
              </div>

              <div className="flex flex-col gap-4 pt-4 border-t border-slate-50">
                 <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                    <div className="flex gap-6">
                       <div>
                          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Usage</p>
                          <p className="text-sm font-bold text-slate-900 leading-none">{dc.use_count} used</p>
                       </div>
                       <div>
                          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Quota Limit</p>
                          <div className="flex items-center gap-2">
                             <p className="text-sm font-bold text-slate-900 leading-none">{dc.max_uses ?? "Unlimited"}</p>
                          </div>
                       </div>
                    </div>

                    {editingId !== dc.id && dc.is_active && (
                       <button 
                         onClick={() => {
                           setEditingId(dc.id);
                           setEditingValue(dc.max_uses?.toString() ?? "");
                         }}
                         className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                       >
                          <span className="material-symbols-outlined text-[14px]">edit_note</span>
                          Edit Quota
                       </button>
                    )}
                 </div>

                 {editingId === dc.id && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                       <div className="flex flex-col gap-2 p-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Update Quota Limit</label>
                          <div className="flex items-center gap-2">
                             <input
                               type="number"
                               value={editingValue}
                               onChange={(e) => setEditingValue(e.target.value)}
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter') {
                                   updateMaxUsesMutation.mutate({ id: dc.id, max: editingValue === "" ? null : parseInt(editingValue) });
                                 } else if (e.key === 'Escape') {
                                   setEditingId(null);
                                 }
                               }}
                               className="flex-1 rounded-xl border-2 border-indigo-600 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 focus:outline-none shadow-sm"
                               autoFocus
                               placeholder="e.g. 50 (empty for unlimited)"
                             />
                             <button 
                               onClick={() => updateMaxUsesMutation.mutate({ id: dc.id, max: editingValue === "" ? null : parseInt(editingValue) })}
                               disabled={updateMaxUsesMutation.isPending}
                               className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-100"
                               title="Save Changes"
                             >
                               <span className="material-symbols-outlined text-[20px]">check</span>
                             </button>
                             <button 
                               onClick={() => setEditingId(null)}
                               className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
                               title="Cancel"
                             >
                               <span className="material-symbols-outlined text-[20px]">close</span>
                             </button>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium italic px-1">Press Enter to save, Esc to cancel.</p>
                       </div>
                    </div>
                 )}

                 {dc.is_active && editingId !== dc.id && (
                   <button 
                     onClick={() => {
                       if (confirm(`Are you sure you want to terminate ${dc.code}?`)) {
                         terminateMutation.mutate(dc.id);
                       }
                     }}
                     className="w-full rounded-xl border border-red-100 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors"
                   >
                     Terminate Code
                   </button>
                 )}
              </div>
            </div>
          ))}
          {discountCodesQuery.data?.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-slate-100 py-12 text-center text-slate-300">
              <p className="text-xs font-bold uppercase tracking-widest">No codes generated yet</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
