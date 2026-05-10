-- ─────────────────────────────────────────────────────────────────────────────
-- 0013: Phase 7 — Upload Limits
--
-- Adds per-event upload limit configuration and per-guest upload tracking.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Upload limit config columns on events
alter table public.events
  add column if not exists upload_limit_enabled  boolean  not null default false,
  add column if not exists max_uploads_per_user  integer  check (max_uploads_per_user > 0),
  add column if not exists max_uploads_total     integer  check (max_uploads_total > 0);

comment on column public.events.upload_limit_enabled is
  'When true, enforce upload limits for this event.';
comment on column public.events.max_uploads_per_user is
  'Maximum photos a single uploader may submit (null = unlimited).';
comment on column public.events.max_uploads_total is
  'Maximum total photos allowed for the event (null = unlimited).';

-- 2. Per-guest upload counter on event_guests
alter table public.event_guests
  add column if not exists upload_count integer not null default 0;

comment on column public.event_guests.upload_count is
  'Running count of non-deleted photos this user has uploaded to this event.';

-- 3. Backfill upload_count from existing photos
update public.event_guests eg
set upload_count = (
  select count(*)
  from public.photos p
  where p.event_id   = eg.event_id
    and p.uploader_id = eg.user_id
    and p.is_deleted  = false
);

-- 4. Trigger: keep upload_count in sync on INSERT / soft-DELETE of photos
create or replace function public.sync_guest_upload_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    -- Upsert the guest row (record_event_guest may not have fired yet for
    -- anonymous uploads where uploader_id is null — skip those)
    if new.uploader_id is not null then
      insert into public.event_guests (event_id, user_id, upload_count)
      values (new.event_id, new.uploader_id, 1)
      on conflict (event_id, user_id)
        do update set upload_count = event_guests.upload_count + 1;
    end if;

  elsif TG_OP = 'UPDATE' then
    -- Detect soft-delete: is_deleted flipped false → true
    if old.is_deleted = false and new.is_deleted = true then
      if new.uploader_id is not null then
        update public.event_guests
        set upload_count = greatest(0, upload_count - 1)
        where event_id = new.event_id
          and user_id  = new.uploader_id;
      end if;
    end if;
    -- Detect un-delete: is_deleted flipped true → false
    if old.is_deleted = true and new.is_deleted = false then
      if new.uploader_id is not null then
        update public.event_guests
        set upload_count = upload_count + 1
        where event_id = new.event_id
          and user_id  = new.uploader_id;
      end if;
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

-- Replace the old simpler guest-recording trigger with this one
drop trigger if exists trg_record_event_guest    on public.photos;
drop trigger if exists trg_sync_guest_upload_count on public.photos;

create trigger trg_sync_guest_upload_count
  after insert or update of is_deleted
  on public.photos
  for each row execute procedure public.sync_guest_upload_count();

-- 5. Helper RPC: get a user's current upload count for an event
--    Safe to call from the client (respects RLS via security invoker).
create or replace function public.get_user_upload_count(
  p_event_id  uuid,
  p_user_id   uuid
)
returns integer
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(upload_count, 0)
  from   public.event_guests
  where  event_id = p_event_id
    and  user_id  = p_user_id;
$$;

-- 6. Helper RPC: get overall event upload stats (total non-deleted photos)
create or replace function public.get_event_upload_stats(
  p_event_id uuid
)
returns table (
  total_uploads  bigint,
  total_limit    integer,
  limit_enabled  boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    (select count(*) from public.photos where event_id = p_event_id and is_deleted = false),
    e.max_uploads_total,
    e.upload_limit_enabled
  from public.events e
  where e.id = p_event_id;
$$;
