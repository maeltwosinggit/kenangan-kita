-- ─────────────────────────────────────────────────────────────────────────────
-- 0010: Ensure events.created_by is auto-set + add event_guests tracking
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Default created_by to the authenticated user performing the INSERT.
--    Existing rows remain NULL (they predate this migration).
alter table public.events
  alter column created_by set default auth.uid();

-- 2. Event guests table — one row per (event, user) pair.
--    Populated automatically when a user uploads their first photo to an event.
create table if not exists public.event_guests (
  event_id  uuid        not null references public.events(id)   on delete cascade,
  user_id   uuid        not null references auth.users(id)       on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index if not exists idx_event_guests_event   on public.event_guests(event_id);
create index if not exists idx_event_guests_user    on public.event_guests(user_id);

-- 3. Trigger: whenever an authenticated user uploads a photo, upsert them as a
--    guest of that event (do nothing if they're already recorded).
create or replace function public.record_event_guest()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.uploader_id is not null then
    insert into public.event_guests (event_id, user_id)
    values (new.event_id, new.uploader_id)
    on conflict (event_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_record_event_guest on public.photos;
create trigger trg_record_event_guest
  after insert on public.photos
  for each row execute procedure public.record_event_guest();

-- 4. Backfill event_guests from existing photos that already have uploader_id.
insert into public.event_guests (event_id, user_id, joined_at)
select distinct
  p.event_id,
  p.uploader_id,
  min(p.captured_at) over (partition by p.event_id, p.uploader_id)
from public.photos p
where p.uploader_id is not null
  and p.is_deleted = false
on conflict (event_id, user_id) do nothing;

-- 5. RLS for event_guests:
--    - Admins can see all guests.
--    - Event creator can see guests of their events.
--    - Users can see their own guest rows.
alter table public.event_guests enable row level security;

create policy "Guests: own rows visible to self"
  on public.event_guests for select
  using (user_id = auth.uid());

create policy "Guests: event creator can view"
  on public.event_guests for select
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and e.created_by = auth.uid()
    )
  );

create policy "Guests: admins can view all"
  on public.event_guests for select
  using (
    exists (
      select 1 from public.admin_profiles ap
      where ap.user_id = auth.uid()
        and ap.role = 'admin'
    )
  );
