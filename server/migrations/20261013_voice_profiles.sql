-- Apply once to the selected Supabase project after access is available.
-- No local/demo data is imported and no Auth users are created here.
begin;

create table public.ieum_profiles (
  user_id uuid primary key references auth.users(id),
  revision integer not null default 0 check (revision >= 0),
  profile_data jsonb not null default '{}'::jsonb
    check (jsonb_typeof(profile_data) = 'object'),
  updated_at timestamptz not null default now()
);
alter table public.ieum_profiles enable row level security;
revoke all on public.ieum_profiles from public, anon, authenticated;
grant select on public.ieum_profiles to authenticated;
create policy ieum_profile_own_read on public.ieum_profiles
  for select to authenticated using ((select auth.uid()) = user_id);

-- Callers never choose a user ID. Writes only go through the restricted RPC.
create function public.ieum_get_profile() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  current_profile public.ieum_profiles;
begin
  if caller is null then raise sqlstate 'PT401' using message = 'AUTH_REQUIRED'; end if;
  select * into current_profile from public.ieum_profiles where user_id = caller;
  if not found then return jsonb_build_object('profile', null, 'revision', 0); end if;
  return jsonb_build_object('profile', current_profile.profile_data, 'revision', current_profile.revision);
end;
$$;

create function public.ieum_patch_profile_preferences(p_patch jsonb, p_expected_revision integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  current_profile public.ieum_profiles;
  field_name text;
  field_values jsonb;
begin
  if caller is null then raise sqlstate 'PT401' using message = 'AUTH_REQUIRED'; end if;
  if p_expected_revision is null or p_expected_revision < 0 or
     p_patch is null or jsonb_typeof(p_patch) <> 'object' or p_patch = '{}'::jsonb then
    raise sqlstate 'PT400' using message = 'INVALID_PROFILE_PATCH';
  end if;
  for field_name, field_values in select key, value from jsonb_each(p_patch) loop
    if field_name not in ('roles', 'genres', 'taste', 'preferredSongIds') or
       jsonb_typeof(field_values) <> 'array' then
      raise sqlstate 'PT400' using message = 'INVALID_PROFILE_PATCH';
    end if;
    if exists (select 1 from jsonb_array_elements(field_values) as item(value)
               where jsonb_typeof(value) <> 'string' or (value #>> '{}') ~ '^[[:space:]]*$') or
       (select count(*) from jsonb_array_elements(field_values)) <>
       (select count(distinct value) from jsonb_array_elements(field_values) as item(value)) then
      raise sqlstate 'PT400' using message = 'INVALID_PROFILE_PATCH';
    end if;
  end loop;

  insert into public.ieum_profiles(user_id) values (caller) on conflict (user_id) do nothing;
  select * into current_profile from public.ieum_profiles where user_id = caller for update;
  if current_profile.revision <> p_expected_revision then
    raise sqlstate 'PT409' using message = 'PROFILE_REVISION_CONFLICT';
  end if;
  -- Only submitted preference keys change. Range, Sample and Identity stay intact.
  update public.ieum_profiles
    set profile_data = profile_data || p_patch, revision = revision + 1, updated_at = now()
    where user_id = caller returning * into current_profile;
  return jsonb_build_object('profile', current_profile.profile_data, 'revision', current_profile.revision);
end;
$$;

revoke all on function public.ieum_get_profile() from public, anon, authenticated;
revoke all on function public.ieum_patch_profile_preferences(jsonb, integer) from public, anon, authenticated;
grant execute on function public.ieum_get_profile() to authenticated;
grant execute on function public.ieum_patch_profile_preferences(jsonb, integer) to authenticated;
commit;
