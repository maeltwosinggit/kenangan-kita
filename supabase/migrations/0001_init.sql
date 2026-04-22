create extension if not exists "pgcrypto";

create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_date date not null,
  event_code text not null unique,
  reveal_mode text not null default 'instant'
    check (reveal_mode in ('instant', 'after_event')),
  gallery_visible boolean not null default true,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_events_event_date on public.events(event_date);
create index idx_events_created_at on public.events(created_at desc);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  storage_path text not null unique,
  captured_at timestamptz not null default now(),
  nickname text null,
  mime_type text not null default 'image/jpeg',
  width int null check (width > 0),
  height int null check (height > 0),
  size_bytes int null check (size_bytes >= 0),
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_photos_event_created on public.photos(event_id, created_at desc);
create index idx_photos_event_captured on public.photos(event_id, captured_at desc);
create index idx_photos_event_not_deleted on public.photos(event_id) where is_deleted = false;

create table public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

