-- Apply after project_participation. Preserve trusted source revisions without
-- selecting an Identity regeneration policy or promoting client measurements.
begin;
create table public.ieum_profile_voice_source_history (
  user_id uuid not null references auth.users(id),
  source_revision text not null check (source_revision !~ '^[[:space:]]*$'),
  source_data jsonb not null check (
    jsonb_typeof(source_data)='object' and
    (source_data->>'user_id' is not distinct from user_id::text) and
    (source_data->>'source_revision' is not distinct from source_revision)
  ),
  primary key(user_id,source_revision)
);
alter table public.ieum_profile_voice_source_history enable row level security;
revoke all on public.ieum_profile_voice_source_history from public,anon,authenticated,service_role;
grant select on public.ieum_profile_voice_source_history to service_role;

-- Existing verified sources are copied exactly; absent sources stay absent.
insert into public.ieum_profile_voice_source_history(user_id,source_revision,source_data)
  select user_id,source_revision,to_jsonb(source) || jsonb_build_object('verified_at',
    to_char(verified_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
  from public.ieum_profile_voice_sources source;

create function public.ieum_preserve_profile_source_revision() returns trigger
language plpgsql security definer set search_path='' as $$
declare snapshot jsonb:=to_jsonb(new) || jsonb_build_object('verified_at',
  to_char(new.verified_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')); previous jsonb;
begin
  if tg_op='UPDATE' and new.user_id is distinct from old.user_id then
    raise sqlstate 'PT409' using message='PROFILE_SOURCE_OWNER_IMMUTABLE';
  end if;
  insert into public.ieum_profile_voice_source_history(user_id,source_revision,source_data)
    values(new.user_id,new.source_revision,snapshot)
    on conflict(user_id,source_revision) do nothing;
  select source_data into previous from public.ieum_profile_voice_source_history
    where user_id=new.user_id and source_revision=new.source_revision;
  if previous is distinct from snapshot then
    raise sqlstate 'PT409' using message='PROFILE_SOURCE_REVISION_CONFLICT';
  end if;
  return new;
end;
$$;
create trigger ieum_profile_source_revision_snapshot before insert or update
  on public.ieum_profile_voice_sources for each row
  execute function public.ieum_preserve_profile_source_revision();

create function public.ieum_reject_profile_source_history_change() returns trigger
language plpgsql set search_path='' as $$
begin
  raise sqlstate 'PT409' using message='PROFILE_SOURCE_HISTORY_IMMUTABLE';
end;
$$;
create trigger ieum_profile_source_history_immutable before update or delete
  on public.ieum_profile_voice_source_history for each row
  execute function public.ieum_reject_profile_source_history_change();
revoke all on function public.ieum_preserve_profile_source_revision() from public,anon,authenticated,service_role;
revoke all on function public.ieum_reject_profile_source_history_change() from public,anon,authenticated,service_role;
commit;
