"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { generateDiscountCode, getSupabaseClient } from "@kenangan/lib";

export function BillingAdmin() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState<number>(0);
  const [maxUses, setMaxUses] = useState<number | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);

  const discountCodesQuery = useQuery({
    queryKey: ["admin-discount-codes"],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const generateMutation = useMutation({
    mutationFn: generateDiscountCode,
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

  return (
    <div className="space-y-8">
      {/* Generate Code Form */}
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

      {/* Existing Codes List */}
      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 px-1">Active Discount Codes</h2>
        <div className="space-y-3">
          {discountCodesQuery.data?.map((dc: any) => (
            <div key={dc.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:border-slate-200">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                  <span className="material-symbols-outlined text-[20px]">sell</span>
                </div>
                <div>
                  <p className="text-sm font-black tracking-widest text-slate-900">{dc.code}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    {dc.discount_type === 'percentage' ? `${dc.value}% OFF` : `$${(dc.value / 100).toFixed(2)} OFF`}
                    {dc.max_uses ? ` • ${dc.use_count}/${dc.max_uses} used` : ` • ${dc.use_count} used`}
                  </p>
                </div>
              </div>
              <div className={["h-2 w-2 rounded-full", dc.is_active ? "bg-green-500" : "bg-slate-300"].join(" ")} />
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
