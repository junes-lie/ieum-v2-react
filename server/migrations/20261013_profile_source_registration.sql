-- Apply after profile_source_history and profile_sample_analysis.
-- Browser range provenance stays distinct from server-verified Sample audio.
begin;
create table public.ieum_profile_source_metadata (
  user_id uuid not null,
  source_revision text not null,
  source_data jsonb not null check (jsonb_typeof(source_data)='object'),
  primary key(user_id,source_revision),
  foreign key(user_id,source_revision) references public.ieum_profile_voice_source_history(user_id,source_revision)
);
alter table public.ieum_profile_source_metadata enable row level security;
revoke all on public.ieum_profile_source_metadata from public,anon,authenticated,service_role;
grant select on public.ieum_profile_source_metadata to service_role;
create trigger ieum_profile_source_metadata_immutable before update or delete
  on public.ieum_profile_source_metadata for each row execute function public.ieum_reject_profile_source_history_change();
alter table public.ieum_operation_results drop constraint ieum_operation_results_operation_check;
alter table public.ieum_operation_results add check(operation in ('create-project','join-part','register-profile-source'));

create function public.ieum_get_voice_source() returns jsonb
language plpgsql security definer set search_path='' as $$
declare caller uuid:=auth.uid(); current_source public.ieum_profile_voice_sources; metadata jsonb;
begin
  if caller is null then raise sqlstate 'PT401' using message='AUTH_REQUIRED'; end if;
  select * into current_source from public.ieum_profile_voice_sources where user_id=caller;
  if not found then return jsonb_build_object('source',null); end if;
  select source_data into metadata from public.ieum_profile_source_metadata where user_id=caller and source_revision=current_source.source_revision;
  if metadata is null then
    metadata:=jsonb_build_object('sourceRevision',current_source.source_revision,'rangeData',current_source.range_data,'provenanceStatus','unavailable');
  end if;
  return jsonb_build_object('source',metadata);
end;
$$;
create function public.ieum_register_profile_source(p_user_id uuid,p_upload_intent_id uuid,p_range_data jsonb,
  p_range_provenance jsonb,p_sample_provenance jsonb,p_source_revision text,p_expected_source_revision text,
  p_request_key text,p_request_sha256 text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare intent public.ieum_profile_sample_upload_intents; current_source public.ieum_profile_voice_sources;
  previous public.ieum_operation_results; source jsonb; prior_metadata jsonb; saved_at timestamptz; result jsonb;
begin
  if p_user_id is null or p_request_key is null or p_request_key ~ '^[[:space:]]*$' or
    coalesce(p_request_sha256,'') !~ '^[a-f0-9]{64}$' or coalesce(p_source_revision,'') !~ '^ieum-voice-source-set-v1:[a-f0-9]{64}$' or
    not public.ieum_valid_midi_range(p_range_data) or p_range_data->>'analysisVersion' is distinct from 'normalized-difference-v1' or
    p_range_provenance->>'version' is distinct from 'ieum-profile-source-v1' or p_range_provenance->>'purpose' is distinct from 'voice-range' or
    p_range_provenance->>'analysisVersion' is distinct from 'normalized-difference-v1' or coalesce(p_range_provenance->>'revision','') ~ '^[[:space:]]*$' or
    coalesce(p_range_provenance->>'measurementSha256','') !~ '^[a-f0-9]{64}$' or
    p_sample_provenance->>'version' is distinct from 'ieum-profile-source-v1' or p_sample_provenance->>'purpose' is distinct from 'voice-sample' or
    p_sample_provenance->>'analysisVersion' is distinct from 'ieum-basic-voice-v5' or coalesce(p_sample_provenance->>'revision','') ~ '^[[:space:]]*$' then
    raise sqlstate 'PT400' using message='INVALID_PROFILE_SOURCE';
  end if;
  -- One source writer per user, including initial registration without a row.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':profile-source',0));
  select * into previous from public.ieum_operation_results where user_id=p_user_id and operation='register-profile-source' and request_key=p_request_key;
  if found then
    if previous.input<>jsonb_build_object('sha256',p_request_sha256) then raise sqlstate 'PT409' using message='IDEMPOTENCY_CONFLICT'; end if;
    return previous.result;
  end if;
  select * into current_source from public.ieum_profile_voice_sources where user_id=p_user_id for update;
  if current_source.source_revision is distinct from p_expected_source_revision then
    raise sqlstate 'PT409' using message='PROFILE_SOURCE_REVISION_CONFLICT';
  end if;
  select * into intent from public.ieum_profile_sample_upload_intents where id=p_upload_intent_id and user_id=p_user_id for share;
  if not found then raise sqlstate 'PT404' using message='SAMPLE_UPLOAD_NOT_FOUND'; end if;
  if intent.audio_receipt is null or intent.voice_analysis is null then raise sqlstate 'PT409' using message='SAMPLE_ANALYSIS_REQUIRED'; end if;
  if intent.sha256 is distinct from p_sample_provenance->>'audioSha256' or intent.byte_length::text is distinct from p_sample_provenance->>'byteLength' then
    raise sqlstate 'PT409' using message='UPLOAD_OBJECT_MISMATCH';
  end if;
  source:=jsonb_build_object('sourceRevision',p_source_revision,'rangeData',p_range_data,'rangeProvenance',p_range_provenance,
    'rangeOrigin','browser-pitch-analysis','sampleProvenance',p_sample_provenance,
    'sampleDuration',(intent.audio_receipt->>'duration')::float8,'sampleFeatures',intent.voice_analysis->'features',
    'sampleAnalysisRef',jsonb_build_object('uploadIntentId',intent.id,'version',intent.voice_analysis->>'version','featuresSha256',intent.voice_analysis->>'featuresSha256'),
    'sampleOrigin','server-decoded-private-original');
  select source_data into prior_metadata from public.ieum_profile_source_metadata where user_id=p_user_id and source_revision=p_source_revision;
  if prior_metadata is not null and prior_metadata<>source then raise sqlstate 'PT409' using message='PROFILE_SOURCE_REVISION_CONFLICT'; end if;
  if current_source.source_revision is distinct from p_source_revision then
    select (source_data->>'verified_at')::timestamptz into saved_at from public.ieum_profile_voice_source_history
      where user_id=p_user_id and source_revision=p_source_revision;
    insert into public.ieum_profile_voice_sources(user_id,source_revision,range_data,range_measurement_sha256,range_analysis_version,
      sample_object_id,sample_audio_sha256,sample_duration,verified_at)
      values(p_user_id,p_source_revision,p_range_data,p_range_provenance->>'measurementSha256','normalized-difference-v1',
        intent.object_id,intent.sha256,(intent.audio_receipt->>'duration')::float8,coalesce(saved_at,now()))
      on conflict(user_id) do update set source_revision=excluded.source_revision,range_data=excluded.range_data,
        range_measurement_sha256=excluded.range_measurement_sha256,range_analysis_version=excluded.range_analysis_version,
        sample_object_id=excluded.sample_object_id,sample_audio_sha256=excluded.sample_audio_sha256,
        sample_duration=excluded.sample_duration,verified_at=excluded.verified_at;
  elsif prior_metadata is null then
    raise sqlstate 'PT409' using message='PROFILE_SOURCE_REVISION_CONFLICT';
  end if;
  insert into public.ieum_profile_source_metadata values(p_user_id,p_source_revision,source) on conflict do nothing;
  result:=jsonb_build_object('registrationStatus','success','source',source);
  insert into public.ieum_operation_results values(p_user_id,'register-profile-source',p_request_key,jsonb_build_object('sha256',p_request_sha256),result);
  return result;
end;
$$;
revoke all on function public.ieum_get_voice_source() from public,anon,authenticated;
grant execute on function public.ieum_get_voice_source() to authenticated;
revoke all on function public.ieum_register_profile_source(uuid,uuid,jsonb,jsonb,jsonb,text,text,text,text) from public,anon,authenticated;
grant execute on function public.ieum_register_profile_source(uuid,uuid,jsonb,jsonb,jsonb,text,text,text,text) to service_role;
commit;
