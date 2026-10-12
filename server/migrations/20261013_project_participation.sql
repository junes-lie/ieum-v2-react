-- Apply after voice_profiles and project_tracks. Empty trusted source tables;
-- no prototype people, guessed ranges, or demo audio is promoted to live data.
begin;
create function public.ieum_valid_midi_range(p_range jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
begin
  if p_range is null or jsonb_typeof(p_range)<>'object' or
    jsonb_typeof(p_range->'lowMidi') is distinct from 'number' or
    jsonb_typeof(p_range->'highMidi') is distinct from 'number' then return false; end if;
  return (p_range->>'lowMidi')::numeric>=0 and (p_range->>'highMidi')::numeric<=127 and
    (p_range->>'lowMidi')::numeric<=(p_range->>'highMidi')::numeric;
end;
$$;
create function public.ieum_valid_arrangement(p_song text,p_key text,p_source jsonb,p_parts jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare part jsonb;
begin
  if p_song is null or p_song ~ '^[[:space:]]*$' or p_key is null or p_key ~ '^[[:space:]]*$' or
    p_source is null or jsonb_typeof(p_source)<>'object' or p_source->>'songId' is distinct from p_song or
    p_source->>'key' is distinct from p_key or jsonb_typeof(p_source->'revision') is distinct from 'string' or coalesce(p_source->>'revision','') ~ '^[[:space:]]*$' or
    jsonb_typeof(p_source->'duration') is distinct from 'number' or
    coalesce(p_source->>'sourceSha256','') !~ '^[a-f0-9]{64}$' or coalesce(p_source->>'backingSha256','') !~ '^[a-f0-9]{64}$' or
    p_parts is null or jsonb_typeof(p_parts)<>'array' then return false; end if;
  if (p_source->>'duration')::numeric<=0 or jsonb_array_length(p_parts) not between 2 and 4 then return false; end if;
  for part in select value from jsonb_array_elements(p_parts) loop
    if jsonb_typeof(part)<>'object' or jsonb_typeof(part->'id') is distinct from 'string' or
      (part->>'id') ~ '^[[:space:]]*$' or not public.ieum_valid_midi_range(part->'requiredRange') then return false; end if;
    if part->'requiredRange' ? 'tessitura' and not public.ieum_valid_midi_range(part->'requiredRange'->'tessitura') then return false; end if;
  end loop;
  return (select count(distinct value->>'id') from jsonb_array_elements(p_parts))=jsonb_array_length(p_parts);
end;
$$;
create table public.ieum_catalog_arrangements (
  id text primary key check (id !~ '^[[:space:]]*$'),
  song_id text not null,
  project_key text not null,
  audio_source_ref jsonb not null,
  parts jsonb not null,
  check (public.ieum_valid_arrangement(song_id,project_key,audio_source_ref,parts))
);
create table public.ieum_profile_voice_sources (
  user_id uuid primary key references auth.users(id),
  source_revision text not null check (source_revision !~ '^[[:space:]]*$'),
  range_data jsonb not null check (public.ieum_valid_midi_range(range_data)),
  range_measurement_sha256 text not null check (range_measurement_sha256 ~ '^[a-f0-9]{64}$'),
  range_analysis_version text not null check (range_analysis_version !~ '^[[:space:]]*$'),
  sample_object_id uuid not null,
  sample_audio_sha256 text not null check (sample_audio_sha256 ~ '^[a-f0-9]{64}$'),
  sample_duration double precision not null check (sample_duration>0 and sample_duration<'Infinity'::float8),
  verified_at timestamptz not null,
  check (not (range_data ? 'comfortableRange') or public.ieum_valid_midi_range(range_data->'comfortableRange'))
);
create function public.ieum_preserve_arrangement_revision() returns trigger
language plpgsql set search_path='' as $$
begin
  raise sqlstate 'PT409' using message='ARRANGEMENT_REVISION_IMMUTABLE';
end;
$$;
create trigger ieum_arrangement_revision_immutable before update on public.ieum_catalog_arrangements
  for each row execute function public.ieum_preserve_arrangement_revision();
create table public.ieum_operation_results (
  user_id uuid not null references auth.users(id),
  operation text not null check (operation in ('create-project','join-part')),
  request_key text not null check (request_key !~ '^[[:space:]]*$'),
  input jsonb not null,
  result jsonb not null,
  primary key(user_id,operation,request_key)
);
alter table public.ieum_projects add column owner_user_id uuid references auth.users(id);
alter table public.ieum_projects add column arrangement_id text references public.ieum_catalog_arrangements(id);
alter table public.ieum_catalog_arrangements enable row level security;
alter table public.ieum_profile_voice_sources enable row level security;
alter table public.ieum_operation_results enable row level security;
revoke all on public.ieum_catalog_arrangements,public.ieum_profile_voice_sources,public.ieum_operation_results from public,anon,authenticated;
grant all on public.ieum_catalog_arrangements,public.ieum_profile_voice_sources,public.ieum_operation_results to service_role;

-- Same containment and optional tessitura rule as matching.evaluatePartFit.
-- Preferences and Identity generation are deliberately not eligibility inputs.
create function public.ieum_require_part_fit(p_user uuid,p_required jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare measured public.ieum_profile_voice_sources; comfortable jsonb; tessitura jsonb;
begin
  select * into measured from public.ieum_profile_voice_sources where user_id=p_user for share;
  if not found then raise sqlstate 'PT403' using message='PROFILE_REQUIRED'; end if;
  if not public.ieum_valid_midi_range(p_required) then raise sqlstate 'PT409' using message='PART_RANGE_UNAVAILABLE'; end if;
  if (measured.range_data->>'lowMidi')::numeric>(p_required->>'lowMidi')::numeric or
    (measured.range_data->>'highMidi')::numeric<(p_required->>'highMidi')::numeric then
    raise sqlstate 'PT403' using message='PART_FIT_FAILED';
  end if;
  if p_required ? 'tessitura' then
    tessitura:=p_required->'tessitura';
    comfortable:=coalesce(measured.range_data->'comfortableRange',measured.range_data);
    if not public.ieum_valid_midi_range(tessitura) or (comfortable->>'lowMidi')::numeric>(tessitura->>'lowMidi')::numeric or
      (comfortable->>'highMidi')::numeric<(tessitura->>'highMidi')::numeric then
      raise sqlstate 'PT403' using message='PART_FIT_FAILED';
    end if;
  end if;
end;
$$;

create function public.ieum_create_project(p_arrangement_id text,p_owner_part_id text,p_request_key text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare caller uuid:=auth.uid(); arrangement public.ieum_catalog_arrangements; previous public.ieum_operation_results;
  request_input jsonb:=jsonb_build_object('arrangementId',p_arrangement_id,'ownerPartId',p_owner_part_id);
  own_part jsonb; part jsonb; project_id text; result jsonb;
begin
  if caller is null then raise sqlstate 'PT401' using message='AUTH_REQUIRED'; end if;
  if p_request_key is null or p_request_key ~ '^[[:space:]]*$' then raise sqlstate 'PT400' using message='IDEMPOTENCY_KEY_REQUIRED'; end if;
  perform pg_advisory_xact_lock(hashtextextended(caller::text || ':create-project:' || p_request_key,0));
  select * into previous from public.ieum_operation_results where user_id=caller and operation='create-project' and request_key=p_request_key;
  if found then
    if previous.input<>request_input then raise sqlstate 'PT409' using message='IDEMPOTENCY_CONFLICT'; end if;
    return previous.result;
  end if;
  select * into arrangement from public.ieum_catalog_arrangements where id=p_arrangement_id for share;
  if not found then raise sqlstate 'PT404' using message='ARRANGEMENT_NOT_FOUND'; end if;
  select value into own_part from jsonb_array_elements(arrangement.parts) where value->>'id'=p_owner_part_id;
  if not found then raise sqlstate 'PT400' using message='INVALID_PART'; end if;
  perform public.ieum_require_part_fit(caller,own_part->'requiredRange');
  project_id:=gen_random_uuid()::text;
  insert into public.ieum_projects(id,seed,song_id,project_key,audio_source_ref,part_count,owner_user_id,arrangement_id)
    values(project_id,gen_random_uuid()::text,arrangement.song_id,arrangement.project_key,arrangement.audio_source_ref,
      jsonb_array_length(arrangement.parts),caller,arrangement.id);
  for part in select value from jsonb_array_elements(arrangement.parts) loop
    insert into public.ieum_project_parts(project_id,part_id,assigned_user_id,required_range)
      values(project_id,part->>'id',case when part->>'id'=p_owner_part_id then caller else null end,part->'requiredRange');
  end loop;
  result:=public.ieum_get_project(project_id);
  insert into public.ieum_operation_results values(caller,'create-project',p_request_key,request_input,result);
  return result;
end;
$$;

create function public.ieum_join_project_part(p_project_id text,p_part_id text,p_request_key text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare caller uuid:=auth.uid(); project public.ieum_projects; part public.ieum_project_parts; previous public.ieum_operation_results;
  request_input jsonb:=jsonb_build_object('projectId',p_project_id,'partId',p_part_id); result jsonb;
begin
  if caller is null then raise sqlstate 'PT401' using message='AUTH_REQUIRED'; end if;
  if p_request_key is null or p_request_key ~ '^[[:space:]]*$' then raise sqlstate 'PT400' using message='IDEMPOTENCY_KEY_REQUIRED'; end if;
  perform pg_advisory_xact_lock(hashtextextended(caller::text || ':join-part:' || p_request_key,0));
  select * into previous from public.ieum_operation_results where user_id=caller and operation='join-part' and request_key=p_request_key;
  if found then
    if previous.input<>request_input then raise sqlstate 'PT409' using message='IDEMPOTENCY_CONFLICT'; end if;
    return previous.result;
  end if;
  select * into project from public.ieum_projects where id=p_project_id for update;
  if not found then raise sqlstate 'PT404' using message='PROJECT_NOT_FOUND'; end if;
  if project.lifecycle<>'recruiting' then raise sqlstate 'PT409' using message='PROJECT_NOT_RECRUITING'; end if;
  select * into part from public.ieum_project_parts where project_id=p_project_id and part_id=p_part_id for update;
  if not found then raise sqlstate 'PT404' using message='PART_NOT_FOUND'; end if;
  if part.assigned_user_id is not null and part.assigned_user_id<>caller then raise sqlstate 'PT409' using message='PART_ALREADY_ASSIGNED'; end if;
  if part.assigned_user_id is null then
    perform public.ieum_require_part_fit(caller,part.required_range);
    update public.ieum_project_parts set assigned_user_id=caller where project_id=p_project_id and part_id=p_part_id;
    update public.ieum_projects set revision=revision+1,last_valid_activity_at=now() where id=p_project_id;
  end if;
  result:=public.ieum_get_project(p_project_id);
  insert into public.ieum_operation_results values(caller,'join-part',p_request_key,request_input,result);
  return result;
end;
$$;
revoke all on function public.ieum_valid_midi_range(jsonb) from public,anon,authenticated;
revoke all on function public.ieum_valid_arrangement(text,text,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.ieum_require_part_fit(uuid,jsonb) from public,anon,authenticated;
revoke all on function public.ieum_preserve_arrangement_revision() from public,anon,authenticated;
revoke all on function public.ieum_create_project(text,text,text) from public,anon,authenticated;
revoke all on function public.ieum_join_project_part(text,text,text) from public,anon,authenticated;
grant execute on function public.ieum_valid_midi_range(jsonb),public.ieum_valid_arrangement(text,text,jsonb,jsonb) to service_role;
grant execute on function public.ieum_create_project(text,text,text),public.ieum_join_project_part(text,text,text) to authenticated;
commit;
