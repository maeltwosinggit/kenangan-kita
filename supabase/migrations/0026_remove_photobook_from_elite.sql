-- Migration: 0026_remove_photobook_from_elite.sql
-- Description: Removes the "Digital Photobook" feature from Elite pricing plans.

-- Strip any feature containing "Photobook" from Elite plans (all regions).
UPDATE public.pricing_plans
SET features = (
  SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
  FROM jsonb_array_elements_text(features::jsonb) AS elem
  WHERE elem NOT ILIKE '%photobook%'
)
WHERE name = 'Elite';
