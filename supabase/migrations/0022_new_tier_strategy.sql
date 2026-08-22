-- Migration: 0022_new_tier_strategy.sql
-- Description: Updates pricing plans to the new 20/250/500/1000 photo strategy.

-- 1. Delete all existing pricing plans to start fresh
DELETE FROM public.pricing_plans;

-- 2. Insert New MY (Malaysian) Plans
INSERT INTO public.pricing_plans (name, description, price_cents, currency, photo_limit, storage_days, features, region)
VALUES 
('Free', 'Perfect for small gatherings', 0, 'myr', 20, 7, '["20 photos limit", "7 days storage", "Web gallery"]', 'MY'),
('Starter', 'Great for birthday parties', 6000, 'myr', 250, 30, '["250 photos limit", "30 days storage", "Web gallery", "High-res downloads"]', 'MY'),
('Pro', 'Ideal for corporate events & larger parties', 10000, 'myr', 500, 60, '["500 photos limit", "60 days storage", "Digital Photobook access", "High-res downloads"]', 'MY'),
('Elite', 'Full coverage for weddings & grand celebrations', 17500, 'myr', 1000, 365, '["1000 photos limit", "1 year storage", "Custom event cover", "All-access ZIP export"]', 'MY');

-- 3. Insert New GLOBAL (USD) Plans (Estimated conversions)
INSERT INTO public.pricing_plans (name, description, price_cents, currency, photo_limit, storage_days, features, region)
VALUES 
('Free', 'Perfect for small gatherings', 0, 'usd', 20, 7, '["20 photos limit", "7 days storage", "Web gallery"]', 'GLOBAL'),
('Starter', 'Great for birthday parties', 1500, 'usd', 250, 30, '["250 photos limit", "30 days storage", "Web gallery", "High-res downloads"]', 'GLOBAL'),
('Pro', 'Ideal for corporate events & larger parties', 2500, 'usd', 500, 60, '["500 photos limit", "60 days storage", "Digital Photobook access", "High-res downloads"]', 'GLOBAL'),
('Elite', 'Full coverage for weddings & grand celebrations', 4500, 'usd', 1000, 365, '["1000 photos limit", "1 year storage", "Custom event cover", "All-access ZIP export"]', 'GLOBAL');
