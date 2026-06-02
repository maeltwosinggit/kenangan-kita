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
export async function validateDiscountCode(code: string): Promise<DiscountCode | null> {
  const supabase = getSupabaseClient();
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
 * Lists all active pricing plans.
 */
export async function listPricingPlans(): Promise<PricingPlan[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("pricing_plans")
    .select("*")
    .eq("is_active", true)
    .order("price_cents", { ascending: true });

  if (error) throw error;
  return (data as any[]).map(row => ({
    ...row,
    features: Array.isArray(row.features) ? row.features : []
  })) as PricingPlan[];
}

/**
 * Generates a new discount code (Admin only).
 */
export async function generateDiscountCode(input: {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  maxUses?: number;
  expiresAt?: string;
}): Promise<DiscountCode> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("discount_codes")
    .insert({
      code: input.code.trim().toUpperCase(),
      discount_type: input.type,
      value: input.value,
      max_uses: input.maxUses ?? null,
      expires_at: input.expiresAt ?? null,
      created_by: user?.id
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as DiscountCode;
}
