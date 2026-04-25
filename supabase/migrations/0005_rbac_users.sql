alter table public.admin_profiles
  drop constraint if exists admin_profiles_role_check;

alter table public.admin_profiles
  add constraint admin_profiles_role_check
  check (role in ('admin', 'user'));

alter table public.admin_profiles
  alter column role set default 'user';

alter table public.admin_profiles
  add column if not exists email text;

create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.admin_profiles ap
    where ap.user_id = uid
      and ap.role = 'admin'
  );
$$;

grant execute on function public.is_admin(uuid) to authenticated;

drop policy if exists "admin profiles self read" on public.admin_profiles;

create policy "admin profiles self read"
on public.admin_profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy "admin profiles self insert"
on public.admin_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "admin profiles admin read all"
on public.admin_profiles
for select
to authenticated
using (public.is_admin());

create policy "admin profiles admin update all"
on public.admin_profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

