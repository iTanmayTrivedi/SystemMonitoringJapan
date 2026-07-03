drop function if exists public.initialize_current_user(public.app_role);

create unique index if not exists user_roles_one_role_per_user_idx on public.user_roles (user_id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can create own initial role" on public.user_roles;
create policy "Users can create own initial role"
on public.user_roles
for insert
to authenticated
with check (auth.uid() = user_id);