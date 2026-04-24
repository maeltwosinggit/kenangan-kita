alter table public.admin_profiles enable row level security;

create policy "admin profiles self read"
on public.admin_profiles
for select
to authenticated
using (auth.uid() = user_id);

