-- Migration: 0016_monetization_schema.sql
-- Description: Adds tables for pricing plans, discount codes, and payment tracking.

-- 1. PRICING PLANS
CREATE TABLE IF NOT EXISTS public.pricing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL DEFAULT 0, -- Price in smallest currency unit (e.g., cents)
    currency TEXT NOT NULL DEFAULT 'usd',
    photo_limit INTEGER, -- NULL means unlimited
    storage_days INTEGER DEFAULT 30,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. DISCOUNT CODES
CREATE TABLE IF NOT EXISTS public.discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE, -- e.g., 'SAVE20'
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    value INTEGER NOT NULL, -- percentage amount or cents
    max_uses INTEGER,
    use_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PAYMENT TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    event_id UUID REFERENCES public.events(id),
    plan_id UUID REFERENCES public.pricing_plans(id),
    discount_code_id UUID REFERENCES public.discount_codes(id),
    amount_paid_cents INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    stripe_session_id TEXT UNIQUE,
    stripe_payment_intent_id TEXT UNIQUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Pricing Plans: Everyone can view active plans
CREATE POLICY "Pricing plans are viewable by everyone" 
ON public.pricing_plans FOR SELECT 
USING (is_active = true);

-- Discount Codes: Only admins can manage, authenticated users can view/check them
CREATE POLICY "Admins can manage discount codes" 
ON public.discount_codes FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.admin_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Users can view active discount codes" 
ON public.discount_codes FOR SELECT 
TO authenticated 
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Transactions: Users can view their own transactions, admins can view all
CREATE POLICY "Users can view own transactions" 
ON public.payment_transactions FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all transactions" 
ON public.payment_transactions FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.admin_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Insert Default Plans
INSERT INTO public.pricing_plans (name, description, price_cents, photo_limit, storage_days, features)
VALUES 
('Free', 'Perfect for small gatherings', 0, 25, 7, '["25 photos", "7 days storage", "Web gallery"]'),
('Pro', 'Everything you need for a great party', 1900, NULL, 30, '["Unlimited photos", "30 days storage", "Digital Photobook access", "High-res downloads"]'),
('Wedding', 'Full coverage for your special day', 4900, NULL, 365, '["Unlimited photos", "1 year storage", "Digital Photobook", "Custom event cover", "All-access ZIP export"]');
