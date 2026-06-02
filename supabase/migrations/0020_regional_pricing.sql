-- Migration: 0020_regional_pricing.sql
-- Description: Adds regional support to pricing plans.

-- 1. Add region column
ALTER TABLE public.pricing_plans ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'GLOBAL';

-- 2. Update existing plans to be GLOBAL
UPDATE public.pricing_plans SET region = 'GLOBAL' WHERE region IS NULL;

-- 3. Insert Malaysian (MYR) Plans
INSERT INTO public.pricing_plans (name, description, price_cents, currency, photo_limit, storage_days, features, region)
VALUES 
('Free', 'Perfect for small gatherings', 0, 'myr', 25, 7, '["25 photos", "7 days storage", "Web gallery"]', 'MY'),
('Pro', 'Everything you need for a great party', 7900, 'myr', NULL, 30, '["Unlimited photos", "30 days storage", "Digital Photobook access", "High-res downloads"]', 'MY'),
('Wedding', 'Full coverage for your special day', 19900, 'myr', NULL, 365, '["Unlimited photos", "1 year storage", "Digital Photobook", "Custom event cover", "All-access ZIP export"]', 'MY');
