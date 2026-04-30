-- Custom access token hook: embeds the user's app role into the JWT.
-- This lets middleware read the role from the cookie (no DB round-trip).
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims   jsonb;
  app_role text;
begin
  select role
    into app_role
    from public.admin_profiles
   where user_id = (event->>'user_id')::uuid;

  claims := event->'claims';
  claims := jsonb_set(claims, '{app_role}', to_jsonb(coalesce(app_role, 'user')));

  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
