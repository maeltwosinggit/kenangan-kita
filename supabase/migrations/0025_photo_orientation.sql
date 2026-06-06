-- Migration: 0025_photo_orientation.sql
-- Description: Adds orientation column to track if a photo was taken in portrait or landscape.

ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS orientation TEXT;
