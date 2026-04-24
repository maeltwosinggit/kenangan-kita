insert into storage.buckets (id, name, public)
values ('event-photos', 'event-photos', false)
on conflict (id) do nothing;

create policy "public upload event photos"
on storage.objects
for insert
to public
with check (bucket_id = 'event-photos');

create policy "public read event photos"
on storage.objects
for select
to public
using (bucket_id = 'event-photos');

