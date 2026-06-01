-- 0015: Enable Realtime for photos table
-- This allows the gallery to update instantly when a new photo is uploaded.

alter publication supabase_realtime add table public.photos;
