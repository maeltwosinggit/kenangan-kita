-- ─────────────────────────────────────────────────────────────────────────────
-- 0012: Add event cover photo support
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add cover_image_path column to events (nullable, set on creation)
alter table public.events
  add column if not exists cover_image_path text null;

-- 2. Public bucket for event cover images (read publicly, write when authenticated)
insert into storage.buckets (id, name, public)
values ('event-covers', 'event-covers', true)
on conflict (id) do nothing;

-- Authenticated users can upload covers
create policy "Authenticated upload event covers"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'event-covers');

-- Public can read cover images (bucket is public, but explicit policy for clarity)
create policy "Public read event covers"
  on storage.objects for select
  to public
  using (bucket_id = 'event-covers');

-- Authenticated users can delete their own covers (cleanup on event delete etc.)
create policy "Authenticated delete event covers"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'event-covers');
