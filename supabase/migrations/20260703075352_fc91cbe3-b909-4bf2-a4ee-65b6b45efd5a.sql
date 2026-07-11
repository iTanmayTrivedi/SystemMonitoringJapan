create or replace function public.initialize_current_user(_desired_role public.app_role default 'user')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := auth.jwt() ->> 'email';
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.profiles (user_id, email)
  values (current_user_id, current_email)
  on conflict (user_id) do update
    set email = coalesce(excluded.email, public.profiles.email);

  insert into public.user_roles (user_id, role)
  values (current_user_id, coalesce(_desired_role, 'user'::public.app_role))
  on conflict (user_id, role) do nothing;
end;
$$;

grant execute on function public.initialize_current_user(public.app_role) to authenticated;
revoke all on function public.initialize_current_user(public.app_role) from anon;