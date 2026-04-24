-- Allow public update on events (MVP; tighten with auth in a later phase)
drop policy if exists "public update events" on public.events;
create policy "public update events"
on public.events
for update
to public
using (true)
with check (true);

-- The soft-delete UPDATE on photos fails because after setting is_deleted=true,
-- PostgreSQL checks the new row against SELECT policies for post-update visibility.
-- The existing SELECT policy requires is_deleted=false, causing the write to be
-- rejected. Fix: add an unrestricted SELECT policy so soft-deleted rows remain
-- "visible" from the DB perspective after the write.
drop policy if exists "public update photos" on public.photos;
create policy "public update photos"
on public.photos
for update
to public
using (true)
with check (true);

drop policy if exists "public read all photos unrestricted" on public.photos;
create policy "public read all photos unrestricted"
on public.photos
for select
to public
using (true);
