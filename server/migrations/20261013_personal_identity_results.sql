-- After profile_source_history. Received immutable results, not approval,
-- Profile selection, regeneration, Track submission or Mix completion.
begin;
create table public.ieum_personal_identity_results (
  user_id uuid not null,
  profile_revision text not null,
  result_id text not null,
  result_revision text not null,
  result_data jsonb not null,
  png bytea not null check (octet_length(png) between 24 and 8388608),
  primary key(user_id,result_id,result_revision),
  foreign key(user_id,profile_revision) references public.ieum_profile_voice_source_history(user_id,source_revision)
);
alter table public.ieum_personal_identity_results enable row level security;
revoke all on public.ieum_personal_identity_results from public,anon,authenticated,service_role;

create function public.ieum_store_personal_identity_result(p_user_id uuid,p_profile_revision text,p_result jsonb,p_png text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare source jsonb; previous public.ieum_personal_identity_results; image bytea; artifact jsonb:=p_result->'artifact';
begin
  if p_user_id is null or jsonb_typeof(p_result) is distinct from 'object' or
    jsonb_typeof(artifact) is distinct from 'object' or
    p_result->'manifest'->>'userId' is distinct from p_user_id::text or
    p_result->'manifest'->>'profileRevision' is distinct from p_profile_revision or
    coalesce(artifact->>'id','') ~ '^[[:space:]]*$' or length(artifact->>'id')>128 or
    position(p_user_id::text in artifact->>'id')>0 or
    coalesce(artifact->>'revision','') ~ '^[[:space:]]*$' or length(artifact->>'revision')>128 or
    coalesce(artifact->>'outputSha256','') !~ '^[a-f0-9]{64}$' or
    coalesce(artifact->>'inputDigest','') !~ '^[a-f0-9]{64}$' or
    artifact->>'inputDigest' is distinct from p_result->'manifest'->>'inputDigest' or
    artifact->>'generatorVersion' is distinct from p_result->'manifest'->>'generatorVersion' or
    coalesce(artifact->>'generatorVersion','') ~ '^[[:space:]]*$' or
    p_png is null or length(p_png)>11184812 then
    raise sqlstate 'PT400' using message='INVALID_IDENTITY_RESULT';
  end if;
  select source_data into source from public.ieum_profile_voice_source_history
    where user_id=p_user_id and source_revision=p_profile_revision;
  if not found then raise sqlstate 'PT409' using message='IDENTITY_SOURCE_UNAVAILABLE'; end if;
  if not exists(select 1 from jsonb_array_elements(p_result->'manifest'->'sources') item
    where item->>'purpose'='voice-range' and item->>'sha256'=source->>'range_measurement_sha256'
      and item->>'analysisVersion'=source->>'range_analysis_version' and item->'data'=source->'range_data') or
    not exists(select 1 from jsonb_array_elements(p_result->'manifest'->'sources') item
    where item->>'purpose'='voice-sample' and item->>'sha256'=source->>'sample_audio_sha256') then
    raise sqlstate 'PT409' using message='IDENTITY_SOURCE_MISMATCH';
  end if;
  image:=decode(p_png,'base64');
  insert into public.ieum_personal_identity_results values(p_user_id,p_profile_revision,artifact->>'id',artifact->>'revision',p_result,image)
    on conflict(user_id,result_id,result_revision) do nothing;
  select * into previous from public.ieum_personal_identity_results
    where user_id=p_user_id and result_id=artifact->>'id' and result_revision=artifact->>'revision';
  if previous.profile_revision is distinct from p_profile_revision or previous.result_data is distinct from p_result or previous.png is distinct from image then
    raise sqlstate 'PT409' using message='IDENTITY_REVISION_CONFLICT';
  end if;
  return jsonb_build_object('resultStatus','stored','profileRevision',previous.profile_revision,
    'ref',jsonb_build_object('id',artifact->>'id','revision',artifact->>'revision','inputDigest',artifact->>'inputDigest',
      'generatorVersion',artifact->>'generatorVersion','outputSha256',artifact->>'outputSha256'));
end;
$$;
create function public.ieum_get_owned_personal_identity_result(p_id text,p_revision text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare caller uuid:=auth.uid(); result public.ieum_personal_identity_results; artifact jsonb;
begin
  if caller is null then raise sqlstate 'PT401' using message='AUTH_REQUIRED'; end if;
  select * into result from public.ieum_personal_identity_results where user_id=caller and result_id=p_id and result_revision=p_revision;
  if not found then raise sqlstate 'PT404' using message='IDENTITY_RESULT_NOT_FOUND'; end if;
  artifact:=result.result_data->'artifact';
  return jsonb_build_object('resultStatus','stored','profileRevision',result.profile_revision,
    'ref',jsonb_build_object('id',artifact->>'id','revision',artifact->>'revision','inputDigest',artifact->>'inputDigest',
      'generatorVersion',artifact->>'generatorVersion','outputSha256',artifact->>'outputSha256'));
end;
$$;
create function public.ieum_reject_personal_identity_change() returns trigger language plpgsql set search_path='' as $$
begin raise sqlstate 'PT409' using message='IDENTITY_RESULT_IMMUTABLE'; end;
$$;
create trigger ieum_personal_identity_immutable before update or delete on public.ieum_personal_identity_results
  for each row execute function public.ieum_reject_personal_identity_change();
revoke all on function public.ieum_store_personal_identity_result(uuid,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.ieum_store_personal_identity_result(uuid,text,jsonb,text) to service_role;
revoke all on function public.ieum_get_owned_personal_identity_result(text,text) from public,anon,service_role;
grant execute on function public.ieum_get_owned_personal_identity_result(text,text) to authenticated;
revoke all on function public.ieum_reject_personal_identity_change() from public,anon,authenticated,service_role;
commit;
