-- Migration: 0018_fix_monetization_rls.sql
-- Description: Updates monetization-related RLS policies to use is_admin() security-definer function.
-- This avoids issues where subqueries on admin_profiles are restricted by its own RLS.

-- 1. DISCOUNT CODES
DROP POLICY IF EXISTS "Admins can manage discount codes" ON public.discount_codes;
CREATE POLICY "Admins can manage discount codes" 
ON public.discount_codes FOR ALL 
TO authenticated 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 2. PAYMENT TRANSACTIONS (Admin view)
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.payment_transactions;
CREATE POLICY "Admins can view all transactions" 
ON public.payment_transactions FOR SELECT 
TO authenticated 
USING (public.is_admin(auth.uid()));

-- 3. PRICING PLANS (Admin management)
DROP POLICY IF EXISTS "Admins can manage pricing plans" ON public.pricing_plans;
CREATE POLICY "Admins can manage pricing plans" 
ON public.pricing_plans FOR ALL 
TO authenticated 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
