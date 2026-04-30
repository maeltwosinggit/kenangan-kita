-- Allow admins to delete events (photos cascade via FK).
-- Uses the existing is_admin() security-definer function from 0005_rbac_users.sql.
create policy "admin delete events"
on public.events
for delete
to authenticated
using (public.is_admin());

-- Allow admins to remove storage objects for deleted events.
-- The storage bucket policies also need an admin delete rule.
create policy "admin delete event photos"
on public.photos
for delete
to authenticated
using (public.is_admin());
