-- RPC that joins admin_profiles with auth.users so email/display_name
-- are always fresh regardless of whether the columns are populated.
create or replace function public.list_admin_profiles()
returns table (
  user_id   uuid,
  display_name text,
  email     text,
  role      text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    ap.user_id,
    coalesce(
      ap.display_name,
      au.raw_user_meta_data->>'full_name',
      au.raw_user_meta_data->>'name'
    ) as display_name,
    coalesce(ap.email, au.email) as email,
    ap.role,
    ap.created_at
  from public.admin_profiles ap
  join auth.users au on au.id = ap.user_id
  order by ap.created_at desc;
$$;

grant execute on function public.list_admin_profiles() to authenticated;
