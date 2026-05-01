-- ─────────────────────────────────────────────────────────────────────────────
-- 0011: Backfill events.created_by for rows created before migration 0010.
--
-- Since all events were created by the single admin, set created_by to the
-- first admin_profiles user for any event where created_by is still NULL.
-- This is safe because the system had exactly one admin at that time.
-- ─────────────────────────────────────────────────────────────────────────────
update public.events
set created_by = (
  select user_id from public.admin_profiles limit 1
)
where created_by is null;
