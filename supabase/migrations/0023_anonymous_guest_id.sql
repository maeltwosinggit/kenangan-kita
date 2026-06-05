-- Migration: 0023_anonymous_guest_id.sql
-- Description: Adds guest_id column to track anonymous contributions.

ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS guest_id UUID;
CREATE INDEX IF NOT EXISTS idx_photos_guest_id ON public.photos(guest_id);
