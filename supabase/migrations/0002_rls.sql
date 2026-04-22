alter table public.events enable row level security;
alter table public.photos enable row level security;

-- MVP public read for event discovery by code.
create policy "public read events by code"
on public.events
for select
to public
using (true);

-- MVP public insert events; tighten in Phase 4 with stronger controls.
create policy "public insert events"
on public.events
for insert
to public
with check (true);

-- MVP public insert photos; tighten in Phase 4 with stronger controls.
create policy "public insert photos"
on public.photos
for insert
to public
with check (true);

-- MVP public read non-deleted photos only when gallery_visible.
create policy "public read photos when gallery visible"
on public.photos
for select
to public
using (
  is_deleted = false
  and exists (
    select 1
    from public.events e
    where e.id = photos.event_id
      and e.gallery_visible = true
  )
);

