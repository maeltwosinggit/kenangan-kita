-- Migration: 0024_event_timestamp.sql
-- Description: Changes event_date from DATE to TIMESTAMPTZ to support specific end times.

ALTER TABLE public.events 
  ALTER COLUMN event_date TYPE TIMESTAMPTZ 
  USING event_date::TIMESTAMPTZ;

COMMENT ON COLUMN public.events.event_date IS 'The official end time of the event. Uploads close 6 hours after this timestamp.';
