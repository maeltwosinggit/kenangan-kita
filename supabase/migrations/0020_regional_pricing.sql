-- Migration: 0020_regional_pricing.sql
-- Description: Adds regional support to pricing plans.

-- 1. Add region column
ALTER TABLE public.pricing_plans ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'GLOBAL';

-- 2. Update existing plans to be GLOBAL
UPDATE public.pricing_plans SET region = 'GLOBAL' WHERE region IS NULL;

-- 3. Insert Malaysian (MYR) Plans
INSERT INTO public.pricing_plans (name, description, price_cents, currency, photo_limit, storage_days, features, region)
VALUES 
('Free', 'Sesuai untuk perjumpaan kecil', 0, 'myr', 25, 7, '["25 keping gambar", "Simpanan 7 hari", "Galeri web"]', 'MY'),
('Pro', 'Semua yang anda perlukan untuk parti hebat', 7900, 'myr', NULL, 30, '["Gambar tanpa had", "Simpanan 30 hari", "Akses Photobook Digital", "Muat turun kualiti tinggi"]', 'MY'),
('Wedding', 'Liputan penuh untuk hari istimewa anda', 19900, 'myr', NULL, 365, '["Gambar tanpa had", "Simpanan 1 tahun", "Photobook Digital", "Kulit acara tersuai", "Eksport ZIP akses penuh"]', 'MY');
