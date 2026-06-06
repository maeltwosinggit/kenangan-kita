import { getSupabaseClient } from "../supabase/client";

export type PricingPlan = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  photo_limit: number | null;
  storage_days: number;
  features: string[];
  region: string;
};

export type DiscountCode = {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  value: number;
  max_uses: number | null;
  use_count: number;
  expires_at: string | null;
  is_active: boolean;
};

/**
 * Validates a discount code and returns its details if valid.
 */
export async function validateDiscountCode(
  code: string,
  supabaseClient?: any
): Promise<DiscountCode | null> {
  const supabase = supabaseClient ?? getSupabaseClient();
  const { data, error } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;

  const discount = data as DiscountCode;

  // Check expiration
  if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
    return null;
  }

  // Check usage limit
  if (discount.max_uses !== null && discount.use_count >= discount.max_uses) {
    return null;
  }

  return discount;
}

/**
 * Lists all active pricing plans, optionally filtered by region.
 * Falls back to GLOBAL if no regional plans are found.
 */
export async function listPricingPlans(
  supabaseClient?: any,
  region: string = 'GLOBAL'
): Promise<PricingPlan[]> {
  const supabase = supabaseClient ?? getSupabaseClient();
  
  // Try fetching regional plans first
  const { data: regionalData, error: regionalError } = await supabase
    .from("pricing_plans")
    .select("*")
    .eq("is_active", true)
    .eq("region", region.toUpperCase())
    .order("price_cents", { ascending: true });

  if (!regionalError && regionalData && regionalData.length > 0) {
    return (regionalData as any[]).map(row => ({
      ...row,
      features: Array.isArray(row.features) ? row.features : []
    })) as PricingPlan[];
  }

  // Fallback to GLOBAL if region failed or returned empty
  const { data: globalData, error: globalError } = await supabase
    .from("pricing_plans")
    .select("*")
    .eq("is_active", true)
    .eq("region", "GLOBAL")
    .order("price_cents", { ascending: true });

  if (globalError) throw globalError;
  return (globalData as any[]).map(row => ({
    ...row,
    features: Array.isArray(row.features) ? row.features : []
  })) as PricingPlan[];
}

/**
 * Generates a new discount code (Admin only).
 */
export async function generateDiscountCode(
  input: {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    maxUses?: number;
    expiresAt?: string;
  },
  supabaseClient?: any
): Promise<DiscountCode> {
  const supabase = supabaseClient ?? getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("discount_codes")
    .insert({
      code: input.code.trim().toUpperCase(),
      discount_type: input.type,
      value: input.value,
      max_uses: input.maxUses ?? null,
      expires_at: input.expiresAt ?? null,
      created_by: user?.id ?? null
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as DiscountCode;
}

/**
 * Terminates (deactivates) a discount code (Admin only).
 */
export async function terminateDiscountCode(
  codeId: string,
  supabaseClient?: any
): Promise<DiscountCode> {
  const supabase = supabaseClient ?? getSupabaseClient();
  const { data, error } = await supabase
    .from("discount_codes")
    .update({ is_active: false })
    .eq("id", codeId)
    .select("*")
    .single();

  if (error) throw error;
  return data as DiscountCode;
}

/**
 * Updates the max uses for a discount code (Admin only).
 */
export async function updateDiscountCodeMaxUses(
  codeId: string,
  maxUses: number | null,
  supabaseClient?: any
): Promise<DiscountCode> {
  const supabase = supabaseClient ?? getSupabaseClient();
  const { data, error } = await supabase
    .from("discount_codes")
    .update({ max_uses: maxUses })
    .eq("id", codeId)
    .select("*")
    .single();

  if (error) throw error;
  return data as DiscountCode;
}
