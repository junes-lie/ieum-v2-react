-- After personal_identity_results and submitted_track_analysis.
-- Immutable received graphics; never submission, approval or Mix completion.
begin;
create table public.ieum_track_voice_layers (
  track_id text not null references public.ieum_submitted_tracks(id),
  layer_id text not null,
  layer_revision text not null,
  user_id uuid not null,
  personal_id text not null,
  personal_revision text not null,
  project_seed text not null,
  result_data jsonb not null,
  png bytea not null check(octet_length(png) between 24 and 8388608),
  primary key(track_id,layer_id,layer_revision),
  foreign key(user_id,personal_id,personal_revision) references public.ieum_personal_identity_results(user_id,result_id,result_revision)
);
alter table public.ieum_track_voice_layers enable row level security;
revoke all on public.ieum_track_voice_layers from public,anon,authenticated,service_role;

create function public.ieum_get_track_voice_layer_context(p_project_id text,p_part_id text,p_user_id uuid,p_personal_id text,p_personal_revision text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare track public.ieum_submitted_tracks; original public.ieum_upload_intents; personal public.ieum_personal_identity_results;
  project public.ieum_projects; analysis jsonb; artifact jsonb;
begin
  select * into project from public.ieum_projects where id=p_project_id;
  select * into track from public.ieum_submitted_tracks where project_id=p_project_id and part_id=p_part_id;
  if not found then raise sqlstate 'PT404' using message='SUBMITTED_TRACK_NOT_FOUND'; end if;
  if p_user_id is null or track.user_id<>p_user_id then raise sqlstate 'PT403' using message='VOICE_LAYER_FORBIDDEN'; end if;
  select * into original from public.ieum_upload_intents where id=track.upload_intent_id;
  select a.analysis into analysis from public.ieum_submitted_track_analyses a where track_id=track.id;
  if analysis is null or original.audio_receipt is null or original.user_id is distinct from track.user_id or
    original.project_id is distinct from track.project_id or original.part_id is distinct from track.part_id or
    original.verified_duration is distinct from track.duration or analysis->'audioReceipt' is distinct from original.audio_receipt or
    analysis->>'sourceSha256' is distinct from original.sha256 or analysis->>'byteLength' is distinct from original.byte_length::text then
    raise sqlstate 'PT409' using message='VOICE_LAYER_ANALYSIS_REQUIRED';
  end if;
  select * into personal from public.ieum_personal_identity_results
    where user_id=p_user_id and result_id=p_personal_id and result_revision=p_personal_revision;
  if not found then raise sqlstate 'PT404' using message='IDENTITY_RESULT_NOT_FOUND'; end if;
  artifact:=personal.result_data->'artifact';
  return jsonb_build_object('projectId',project.id,'projectSeed',project.seed,'partId',track.part_id,'trackId',track.id,'userId',track.user_id,
    'objectId',original.object_id,'size',original.byte_length,'sha256',original.sha256,'contentType',original.content_type,
    'receipt',original.audio_receipt,'analysis',analysis,'traits',personal.result_data->'traits',
    'personalRef',jsonb_build_object('id',personal.result_id,'revision',personal.result_revision,'inputDigest',artifact->>'inputDigest',
      'generatorVersion',artifact->>'generatorVersion','outputSha256',artifact->>'outputSha256'));
end;
$$;

create function public.ieum_store_track_voice_layer(p_project_id text,p_part_id text,p_user_id uuid,p_result jsonb,p_png text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare context jsonb; ref jsonb:=p_result->'ref'; input jsonb:=p_result->'trackInput'; artifact jsonb:=p_result->'artifact';
  previous public.ieum_track_voice_layers; image bytea;
begin
  context:=public.ieum_get_track_voice_layer_context(p_project_id,p_part_id,p_user_id,
    p_result->'personalRef'->>'id',p_result->'personalRef'->>'revision');
  if jsonb_typeof(p_result) is distinct from 'object' or coalesce(ref->>'id','') ~ '^[[:space:]]*$' or
    length(ref->>'id')>128 or coalesce(ref->>'revision','') ~ '^[[:space:]]*$' or length(ref->>'revision')>128 or
    coalesce(ref->>'inputDigest','') !~ '^[a-f0-9]{64}$' or coalesce(ref->>'outputSha256','') !~ '^[a-f0-9]{64}$' or
    p_result->'personalRef' is distinct from context->'personalRef' or input->>'trackId' is distinct from context->>'trackId' or
    input->>'generatorVersion' is distinct from ref->>'generatorVersion' or input->>'inputDigest' is distinct from ref->>'inputDigest' or
    input->'identityRef' is distinct from jsonb_build_object('id',context->'personalRef'->>'id','revision',context->'personalRef'->>'revision',
      'outputSha256',context->'personalRef'->>'outputSha256') or
    input->'source'->>'recordId' is distinct from context->>'trackId' or input->'source'->>'purpose' is distinct from 'project-track' or
    input->'source'->>'sha256' is distinct from context->>'sha256' or
    input->'source'->>'analysisVersion' is distinct from context->'analysis'->'features'->>'version' or
    input->'source'->'data'->>'projectId' is distinct from p_project_id or input->'source'->'data'->>'partId' is distinct from p_part_id or
    input->'source'->'data'->'analysis' is distinct from context->'analysis'->'features' or
    input->'source'->'data'->'assessment' is distinct from context->'analysis'->'assessment' or
    input->'source'->'data'->'audioReceipt' is distinct from context->'receipt' or
    artifact->>'projectId' is distinct from p_project_id or artifact->>'partId' is distinct from p_part_id or
    artifact->>'participantId' is distinct from p_user_id::text or artifact->>'projectSeed' is distinct from context->>'projectSeed' or
    artifact->>'sourceSha256' is distinct from context->>'sha256' or artifact->>'outputSha256' is distinct from ref->>'outputSha256' or
    p_result->'controls'->'inputs'->'identity'->>'traitDigest' is distinct from context->'traits'->>'snapshotDigest' or
    p_result->'controls'->'inputs'->'resonance'->>'traitDigest' is distinct from context->'traits'->>'snapshotDigest' or
    p_png is null or length(p_png)>11184812 then raise sqlstate 'PT409' using message='VOICE_LAYER_SOURCE_MISMATCH'; end if;
  image:=decode(p_png,'base64');
  insert into public.ieum_track_voice_layers values(context->>'trackId',ref->>'id',ref->>'revision',p_user_id,
    context->'personalRef'->>'id',context->'personalRef'->>'revision',context->>'projectSeed',p_result,image)
    on conflict(track_id,layer_id,layer_revision) do nothing;
  select * into previous from public.ieum_track_voice_layers where track_id=context->>'trackId' and layer_id=ref->>'id' and layer_revision=ref->>'revision';
  if previous.result_data is distinct from p_result or previous.png is distinct from image then
    raise sqlstate 'PT409' using message='VOICE_LAYER_REVISION_CONFLICT';
  end if;
  return jsonb_build_object('resultStatus','stored','projectId',p_project_id,'partId',p_part_id,'projectSeed',previous.project_seed,
    'ref',previous.result_data->'ref','personalRef',previous.result_data->'personalRef');
end;
$$;
create function public.ieum_get_owned_track_voice_layer(p_project_id text,p_part_id text,p_id text,p_revision text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare caller uuid:=auth.uid(); result public.ieum_track_voice_layers;
begin
  if caller is null then raise sqlstate 'PT401' using message='AUTH_REQUIRED'; end if;
  select layer.* into result from public.ieum_track_voice_layers layer join public.ieum_submitted_tracks track on track.id=layer.track_id
    where track.project_id=p_project_id and track.part_id=p_part_id and layer.user_id=caller and layer.layer_id=p_id and layer.layer_revision=p_revision;
  if not found then raise sqlstate 'PT404' using message='VOICE_LAYER_NOT_FOUND'; end if;
  return jsonb_build_object('resultStatus','stored','projectId',p_project_id,'partId',p_part_id,'projectSeed',result.project_seed,
    'ref',result.result_data->'ref','personalRef',result.result_data->'personalRef');
end;
$$;
create trigger ieum_track_voice_layer_immutable before update or delete on public.ieum_track_voice_layers
  for each row execute function public.ieum_reject_personal_identity_change();
revoke all on function public.ieum_get_track_voice_layer_context(text,text,uuid,text,text),public.ieum_store_track_voice_layer(text,text,uuid,jsonb,text)
  from public,anon,authenticated;
grant execute on function public.ieum_get_track_voice_layer_context(text,text,uuid,text,text),public.ieum_store_track_voice_layer(text,text,uuid,jsonb,text) to service_role;
revoke all on function public.ieum_get_owned_track_voice_layer(text,text,text,text) from public,anon,service_role;
grant execute on function public.ieum_get_owned_track_voice_layer(text,text,text,text) to authenticated;
commit;
