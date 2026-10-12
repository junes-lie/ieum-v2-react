-- Shared lifecycle foundation. No sample/demo projects or users are imported.
-- Trusted server/catalog ingestion and verified Storage receipts are still required.
begin;
create table public.ieum_projects (
  id text primary key check (id !~ '^[[:space:]]*$'),
  seed text not null check (seed !~ '^[[:space:]]*$'),
  song_id text not null,
  project_key text not null,
  audio_source_ref jsonb not null check (jsonb_typeof(audio_source_ref) = 'object'),
  part_count integer not null check (part_count between 2 and 4),
  revision integer not null default 0 check (revision >= 0),
  lifecycle text not null default 'recruiting' check (lifecycle in ('recruiting','mixing','completed')),
  key_locked_at timestamptz,
  last_valid_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create table public.ieum_project_parts (
  project_id text not null references public.ieum_projects(id),
  part_id text not null check (part_id !~ '^[[:space:]]*$'),
  assigned_user_id uuid references auth.users(id),
  required_range jsonb not null check (jsonb_typeof(required_range) = 'object'),
  primary key (project_id,part_id)
);
create table public.ieum_upload_intents (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  part_id text not null,
  user_id uuid not null references auth.users(id),
  object_id uuid not null unique,
  byte_length bigint not null check (byte_length > 0),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  content_type text not null check (content_type like 'audio/%'),
  verified_at timestamptz,
  verified_duration double precision,
  check (verified_at is null or (verified_duration is not null and verified_duration>0 and verified_duration<'Infinity'::float8)),
  foreign key (project_id,part_id) references public.ieum_project_parts(project_id,part_id)
);
create table public.ieum_submitted_tracks (
  id text primary key,
  project_id text not null,
  part_id text not null,
  user_id uuid not null references auth.users(id),
  upload_intent_id uuid not null unique references public.ieum_upload_intents(id),
  request_key text not null check (request_key !~ '^[[:space:]]*$'),
  duration double precision not null check (duration > 0 and duration < 'Infinity'::float8),
  sync_offset_ms double precision not null check (sync_offset_ms >= 0 and sync_offset_ms < duration * 1000),
  audio_source_ref jsonb not null,
  client_features jsonb check (client_features is null or jsonb_typeof(client_features)='object'),
  submission_response jsonb not null default '{}'::jsonb check (jsonb_typeof(submission_response)='object'),
  submitted_at timestamptz not null default now(),
  unique (project_id,part_id),
  unique (user_id,request_key),
  foreign key (project_id,part_id) references public.ieum_project_parts(project_id,part_id)
);
create table public.ieum_mix_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id text not null unique references public.ieum_projects(id),
  track_ids jsonb not null check (jsonb_typeof(track_ids) = 'array' and jsonb_array_length(track_ids) between 2 and 4),
  audio_source_ref jsonb not null,
  status text not null default 'queued' check (status in ('queued','processing','failed','succeeded')),
  result_object_id uuid,
  result_sha256 text,
  result_duration double precision,
  completed_at timestamptz,
  check (status <> 'succeeded' or (result_object_id is not null and result_sha256 is not null and result_sha256 ~ '^[a-f0-9]{64}$'
    and result_duration is not null and result_duration > 0 and result_duration < 'Infinity'::float8 and completed_at is not null))
);
alter table public.ieum_projects enable row level security;
alter table public.ieum_project_parts enable row level security;
alter table public.ieum_upload_intents enable row level security;
alter table public.ieum_submitted_tracks enable row level security;
alter table public.ieum_mix_jobs enable row level security;
revoke all on public.ieum_projects,public.ieum_project_parts,public.ieum_upload_intents,
  public.ieum_submitted_tracks,public.ieum_mix_jobs from public,anon,authenticated;
-- Only the trusted server may ingest catalog/profile-backed projects or mark receipts verified.
grant all on public.ieum_projects,public.ieum_project_parts,public.ieum_upload_intents,
  public.ieum_submitted_tracks,public.ieum_mix_jobs to service_role;

create function public.ieum_guard_recorded_project() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.key_locked_at is not null and
    (new.project_key is distinct from old.project_key or new.song_id is distinct from old.song_id or
     new.audio_source_ref is distinct from old.audio_source_ref or new.seed is distinct from old.seed or
     new.part_count is distinct from old.part_count or new.key_locked_at is distinct from old.key_locked_at) then
    raise sqlstate 'PT409' using message = 'PROJECT_AUDIO_LOCKED';
  end if;
  return new;
end;
$$;
create trigger ieum_project_audio_lock before update on public.ieum_projects
  for each row execute function public.ieum_guard_recorded_project();

create function public.ieum_guard_recorded_parts() returns trigger
language plpgsql set search_path = '' as $$
declare target text; locked_at timestamptz;
begin
  target := case when tg_op='INSERT' then new.project_id else old.project_id end;
  select key_locked_at into locked_at from public.ieum_projects where id=target for update;
  if locked_at is not null and (tg_op <> 'UPDATE' or new.project_id is distinct from old.project_id or
      new.part_id is distinct from old.part_id or new.required_range is distinct from old.required_range) then
    raise sqlstate 'PT409' using message = 'PROJECT_AUDIO_LOCKED';
  end if;
  if tg_op='UPDATE' and new.assigned_user_id is distinct from old.assigned_user_id and
    exists (select 1 from public.ieum_submitted_tracks where project_id=old.project_id and part_id=old.part_id) then
    raise sqlstate 'PT409' using message = 'TRACK_ALREADY_SUBMITTED';
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
create trigger ieum_part_roster_lock before insert or update or delete on public.ieum_project_parts
  for each row execute function public.ieum_guard_recorded_parts();

create function public.ieum_get_project(p_project_id text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid(); project public.ieum_projects; parts jsonb; submitted integer;
begin
  if caller is null then raise sqlstate 'PT401' using message = 'AUTH_REQUIRED'; end if;
  select * into project from public.ieum_projects where id = p_project_id;
  if not found then raise sqlstate 'PT404' using message = 'PROJECT_NOT_FOUND'; end if;
  select count(*) into submitted from public.ieum_submitted_tracks where project_id = project.id;
  select jsonb_agg(jsonb_build_object('id',p.part_id,'participantId',p.assigned_user_id,
    'requiredRange',p.required_range,'status',case when t.id is not null then 'submitted'
      when p.assigned_user_id is not null then 'ready' else 'open' end,'trackId',t.id) order by p.part_id)
    into parts from public.ieum_project_parts p left join public.ieum_submitted_tracks t
      on t.project_id=p.project_id and t.part_id=p.part_id where p.project_id=project.id;
  return jsonb_build_object('id',project.id,'seed',project.seed,'songId',project.song_id,'key',project.project_key,
    'audioSourceRef',project.audio_source_ref,'partCount',project.part_count,'parts',coalesce(parts,'[]'::jsonb),
    'submittedTrackCount',submitted,'revision',project.revision,'lifecycle',project.lifecycle,'keyLockedAt',project.key_locked_at);
end;
$$;

create function public.ieum_start_project_recording(p_project_id text,p_part_id text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid(); project public.ieum_projects;
begin
  if caller is null then raise sqlstate 'PT401' using message = 'AUTH_REQUIRED'; end if;
  select * into project from public.ieum_projects where id=p_project_id for update;
  if not found then raise sqlstate 'PT404' using message = 'PROJECT_NOT_FOUND'; end if;
  if not exists (select 1 from public.ieum_project_parts where project_id=p_project_id and part_id=p_part_id and assigned_user_id=caller) then
    raise sqlstate 'PT403' using message = 'PART_NOT_ASSIGNED';
  end if;
  if project.lifecycle <> 'recruiting' or exists (select 1 from public.ieum_submitted_tracks where project_id=p_project_id and part_id=p_part_id) then
    raise sqlstate 'PT409' using message = 'TRACK_ALREADY_SUBMITTED';
  end if;
  if project.key_locked_at is null then
    update public.ieum_projects set key_locked_at=now(),revision=revision+1,last_valid_activity_at=now() where id=p_project_id;
  end if;
  return public.ieum_get_project(p_project_id);
end;
$$;

create function public.ieum_submit_verified_track(p_project_id text,p_part_id text,p_upload_intent_id uuid,
  p_request_key text,p_duration double precision,p_sync_offset_ms double precision,p_features jsonb default null,p_project_seed text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid(); project public.ieum_projects; intent public.ieum_upload_intents;
  track public.ieum_submitted_tracks; submitted integer; actual_parts integer; job_id uuid; result jsonb;
begin
  if caller is null then raise sqlstate 'PT401' using message = 'AUTH_REQUIRED'; end if;
  if p_request_key is null or p_request_key ~ '^[[:space:]]*$' or p_duration is null or
    not (p_duration > 0 and p_duration < 'Infinity'::float8) or p_sync_offset_ms is null or
    not (p_sync_offset_ms >= 0 and p_sync_offset_ms < p_duration*1000) or
    (p_features is not null and jsonb_typeof(p_features)<>'object') then
    raise sqlstate 'PT400' using message = 'INVALID_TAKE_METADATA';
  end if;
  -- Lock order is always Project then Part/intent. Last submission queues one Mix.
  select * into project from public.ieum_projects where id=p_project_id for update;
  if not found then raise sqlstate 'PT404' using message = 'PROJECT_NOT_FOUND'; end if;
  if p_project_seed is not null and p_project_seed<>project.seed then
    raise sqlstate 'PT409' using message = 'PROJECT_AUDIO_CONFLICT';
  end if;
  if not exists (select 1 from public.ieum_project_parts where project_id=p_project_id and part_id=p_part_id and assigned_user_id=caller) then
    raise sqlstate 'PT403' using message = 'PART_NOT_ASSIGNED';
  end if;
  select * into track from public.ieum_submitted_tracks where project_id=p_project_id and part_id=p_part_id;
  if found then
    if track.user_id <> caller or track.upload_intent_id <> p_upload_intent_id or track.request_key <> p_request_key or
      track.duration <> p_duration or track.sync_offset_ms <> p_sync_offset_ms or track.client_features is distinct from p_features then
      raise sqlstate 'PT409' using message = 'TRACK_ALREADY_SUBMITTED';
    end if;
    return track.submission_response;
  end if;
  if project.lifecycle <> 'recruiting' or project.key_locked_at is null then
    raise sqlstate 'PT409' using message = 'PROJECT_NOT_RECORDING';
  end if;
  select count(*) into actual_parts from public.ieum_project_parts where project_id=p_project_id;
  if actual_parts <> project.part_count then raise sqlstate 'PT409' using message = 'PROJECT_PARTS_INCOMPLETE'; end if;
  select * into intent from public.ieum_upload_intents where id=p_upload_intent_id for update;
  if not found or intent.user_id <> caller or intent.project_id <> p_project_id or intent.part_id <> p_part_id or
    intent.verified_at is null or intent.verified_duration is distinct from p_duration then
    raise sqlstate 'PT409' using message = 'UPLOAD_NOT_VERIFIED';
  end if;
  if exists (select 1 from public.ieum_submitted_tracks where user_id=caller and request_key=p_request_key) then
    raise sqlstate 'PT409' using message = 'IDEMPOTENCY_CONFLICT';
  end if;
  insert into public.ieum_submitted_tracks(id,project_id,part_id,user_id,upload_intent_id,request_key,duration,sync_offset_ms,audio_source_ref,client_features)
    values(p_project_id || ':' || p_part_id,p_project_id,p_part_id,caller,p_upload_intent_id,p_request_key,p_duration,p_sync_offset_ms,project.audio_source_ref,p_features)
    returning * into track;
  select count(*) into submitted from public.ieum_submitted_tracks where project_id=p_project_id;
  update public.ieum_projects set revision=revision+1,last_valid_activity_at=now(),
    lifecycle=case when submitted=part_count then 'mixing' else lifecycle end where id=p_project_id;
  if submitted=project.part_count then
    insert into public.ieum_mix_jobs(project_id,track_ids,audio_source_ref)
      select p_project_id,jsonb_agg(id order by part_id),project.audio_source_ref
      from public.ieum_submitted_tracks where project_id=p_project_id
      on conflict(project_id) do nothing returning id into job_id;
  end if;
  result := jsonb_build_object('trackId',track.id,'submissionStatus','success','project',public.ieum_get_project(p_project_id));
  update public.ieum_submitted_tracks set submission_response=result where id=track.id;
  return result;
end;
$$;
-- Server calls this only after independently verifying the persisted Mix file.
-- Queuing/rendering/upload alone never changes the Project to completed.
create function public.ieum_complete_verified_mix(p_job_id uuid,p_object_id uuid,p_sha256 text,p_duration double precision)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare job public.ieum_mix_jobs; project public.ieum_projects; current_tracks jsonb;
begin
  if p_object_id is null or p_sha256 is null or p_sha256 !~ '^[a-f0-9]{64}$' or p_duration is null or
     not (p_duration>0 and p_duration<'Infinity'::float8) then
    raise sqlstate 'PT400' using message = 'INVALID_MIX_RESULT';
  end if;
  select * into job from public.ieum_mix_jobs where id=p_job_id;
  if not found then raise sqlstate 'PT404' using message = 'MIX_JOB_NOT_FOUND'; end if;
  select * into project from public.ieum_projects where id=job.project_id for update;
  select * into job from public.ieum_mix_jobs where id=p_job_id for update;
  if job.status='succeeded' then
    if job.result_object_id<>p_object_id or job.result_sha256<>p_sha256 or job.result_duration<>p_duration then
      raise sqlstate 'PT409' using message = 'MIX_RESULT_CONFLICT';
    end if;
    return jsonb_build_object('projectId',job.project_id,'jobId',job.id,'lifecycle','completed');
  end if;
  select jsonb_agg(id order by part_id) into current_tracks from public.ieum_submitted_tracks where project_id=job.project_id;
  if project.lifecycle<>'mixing' or job.track_ids is distinct from current_tracks or
    jsonb_array_length(current_tracks)<>project.part_count or job.audio_source_ref is distinct from project.audio_source_ref then
    raise sqlstate 'PT409' using message = 'MIX_INPUT_CONFLICT';
  end if;
  update public.ieum_mix_jobs set status='succeeded',result_object_id=p_object_id,result_sha256=p_sha256,
    result_duration=p_duration,completed_at=now() where id=p_job_id;
  update public.ieum_projects set lifecycle='completed',revision=revision+1,last_valid_activity_at=now() where id=job.project_id;
  return jsonb_build_object('projectId',job.project_id,'jobId',job.id,'lifecycle','completed');
end;
$$;
revoke all on function public.ieum_get_project(text) from public,anon,authenticated;
revoke all on function public.ieum_start_project_recording(text,text) from public,anon,authenticated;
revoke all on function public.ieum_submit_verified_track(text,text,uuid,text,double precision,double precision,jsonb,text) from public,anon,authenticated;
revoke all on function public.ieum_guard_recorded_project() from public,anon,authenticated;
revoke all on function public.ieum_guard_recorded_parts() from public,anon,authenticated;
revoke all on function public.ieum_complete_verified_mix(uuid,uuid,text,double precision) from public,anon,authenticated;
grant execute on function public.ieum_get_project(text) to authenticated;
grant execute on function public.ieum_start_project_recording(text,text) to authenticated;
grant execute on function public.ieum_submit_verified_track(text,text,uuid,text,double precision,double precision,jsonb,text) to authenticated;
grant execute on function public.ieum_complete_verified_mix(uuid,uuid,text,double precision) to service_role;
commit;
