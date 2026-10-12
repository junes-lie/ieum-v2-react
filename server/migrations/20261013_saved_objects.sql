begin;

-- Personal bookmarks only. No participant, Track or Profile writes.
create table public.ieum_saved_objects (
  user_id uuid not null references auth.users(id),
  object_type text not null check (object_type in ('project', 'vocal', 'song')),
  object_id text not null check (object_id !~ '^[[:space:]]*$'),
  saved_at timestamptz not null default now(),
  primary key (user_id, object_type, object_id)
);
alter table public.ieum_saved_objects enable row level security;
revoke all on public.ieum_saved_objects from public, anon, authenticated;
grant select on public.ieum_saved_objects to authenticated;
create policy ieum_saved_own_read on public.ieum_saved_objects
  for select to authenticated using ((select auth.uid()) = user_id);

create function public.ieum_get_saved_objects() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid(); result jsonb;
begin
  if caller is null then raise sqlstate 'PT401' using message = 'AUTH_REQUIRED'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('type', object_type, 'objectId', object_id, 'savedAt', saved_at)
    order by saved_at desc, object_type, object_id), '[]'::jsonb) into result
    from public.ieum_saved_objects where user_id = caller;
  return jsonb_build_object('saves', result);
end;
$$;

create function public.ieum_set_saved_object(p_type text, p_object_id text, p_saved boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid(); stored_at timestamptz;
begin
  if caller is null then raise sqlstate 'PT401' using message = 'AUTH_REQUIRED'; end if;
  if p_type is null or p_type not in ('project','vocal','song') or p_object_id is null or
     p_object_id ~ '^[[:space:]]*$' or p_saved is null then
    raise sqlstate 'PT400' using message = 'INVALID_SAVED_OBJECT';
  end if;
  if p_saved then
    insert into public.ieum_saved_objects(user_id, object_type, object_id)
      values (caller, p_type, p_object_id) on conflict (user_id, object_type, object_id) do nothing;
    select saved_at into stored_at from public.ieum_saved_objects
      where user_id = caller and object_type = p_type and object_id = p_object_id;
  else
    delete from public.ieum_saved_objects
      where user_id = caller and object_type = p_type and object_id = p_object_id;
  end if;
  return jsonb_build_object('type', p_type, 'objectId', p_object_id, 'saved', p_saved, 'savedAt', stored_at);
end;
$$;
revoke all on function public.ieum_get_saved_objects() from public, anon, authenticated;
revoke all on function public.ieum_set_saved_object(text,text,boolean) from public, anon, authenticated;
grant execute on function public.ieum_get_saved_objects() to authenticated;
grant execute on function public.ieum_set_saved_object(text,text,boolean) to authenticated;
commit;
