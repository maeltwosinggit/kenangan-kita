-- 0014: Fix get_event_upload_stats RPC to include max_uploads_per_user

create or replace function public.get_event_upload_stats(
  p_event_id uuid
)
returns table (
  total_uploads         bigint,
  max_uploads_per_user  integer,
  max_uploads_total     integer,
  limit_enabled         boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    (select count(*) from public.photos where event_id = p_event_id and is_deleted = false),
    e.max_uploads_per_user,
    e.max_uploads_total,
    e.upload_limit_enabled
  from public.events e
  where e.id = p_event_id;
$$;
