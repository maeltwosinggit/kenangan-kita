-- Track which authenticated user uploaded each photo.
-- Nullable so guest (unauthenticated) uploads remain valid.
alter table public.photos
  add column if not exists uploader_id uuid null references auth.users(id) on delete set null;

create index if not exists idx_photos_uploader_captured
  on public.photos(uploader_id, captured_at desc)
  where uploader_id is not null;
