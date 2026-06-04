-- Migration: 0021_event_filters.sql
-- Description: Adds theme_filter column to events table to support camera visual filters.

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS theme_filter TEXT NOT NULL DEFAULT 'normal';
