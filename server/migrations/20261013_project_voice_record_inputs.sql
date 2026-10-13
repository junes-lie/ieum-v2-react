-- After track_voice_layers. Historical graphics inputs, not successful Mixes.
begin;
create table public.ieum_project_voice_record_inputs (
  project_id text not null references public.ieum_projects(id),
  input_digest text not null check(input_digest ~ '^[a-f0-9]{64}$'),
  project_revision integer not null,
  input jsonb not null,
  source_bindings jsonb not null,
  primary key(project_id,input_digest)
);
alter table public.ieum_project_voice_record_inputs enable row level security;
revoke all on public.ieum_project_voice_record_inputs from public,anon,authenticated,service_role;
create function public.ieum_get_project_voice_record_context(p_project_id text,p_layer_refs jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare project public.ieum_projects; part_ids jsonb; tracks jsonb:='[]'::jsonb; item record; layer public.ieum_track_voice_layers; wanted jsonb;
begin
  select * into project from public.ieum_projects where id=p_project_id;
  if not found then raise sqlstate 'PT404' using message='PROJECT_NOT_FOUND'; end if;
  select jsonb_agg(part_id order by part_id) into part_ids from public.ieum_project_parts where project_id=p_project_id;
  if jsonb_array_length(part_ids) is distinct from project.part_count or jsonb_typeof(p_layer_refs) is distinct from 'object' then
    raise sqlstate 'PT409' using message='VOICE_RECORD_PARTS_MISMATCH'; end if;
  if exists(select 1 from jsonb_object_keys(p_layer_refs) ref where not(part_ids ? ref)) then
    raise sqlstate 'PT409' using message='VOICE_RECORD_PARTS_MISMATCH'; end if;
  for item in select t.id,t.part_id,t.user_id,i.object_id,i.byte_length,i.sha256,i.content_type,i.audio_receipt,i.verified_duration,t.duration,a.analysis
    from public.ieum_submitted_tracks t join public.ieum_upload_intents i on i.id=t.upload_intent_id
    left join public.ieum_submitted_track_analyses a on a.track_id=t.id where t.project_id=p_project_id order by t.part_id loop
    if item.analysis is null or item.audio_receipt is null or item.verified_duration is distinct from item.duration or
      item.analysis->>'sourceSha256' is distinct from item.sha256 or item.analysis->>'byteLength' is distinct from item.byte_length::text or
      item.analysis->'audioReceipt' is distinct from item.audio_receipt then raise sqlstate 'PT409' using message='VOICE_LAYER_ANALYSIS_REQUIRED'; end if;
    wanted:=p_layer_refs->item.part_id;
    if wanted is not null then
      select * into layer from public.ieum_track_voice_layers where track_id=item.id and layer_id=wanted->>'id' and layer_revision=wanted->>'revision';
      if not found or layer.project_seed<>project.seed or layer.user_id<>item.user_id or
        (layer.result_data->'ref')-'inputDigest' is distinct from wanted-'inputDigest' or
        (wanted ? 'inputDigest' and wanted->>'inputDigest' is distinct from layer.result_data->'ref'->>'inputDigest') then
        raise sqlstate 'PT409' using message='VOICE_RECORD_LAYER_MISMATCH'; end if;
    end if;
    tracks:=tracks || jsonb_build_array(jsonb_build_object('trackId',item.id,'partId',item.part_id,'size',item.byte_length,'sha256',item.sha256,
      'contentType',item.content_type,'receipt',item.audio_receipt,'analysis',item.analysis,
      'layerRef',case when wanted is null then null else layer.result_data->'ref' end));
  end loop;
  if exists(select 1 from jsonb_object_keys(p_layer_refs) ref where not exists(
    select 1 from public.ieum_submitted_tracks t where t.project_id=p_project_id and t.part_id=ref)) then
    raise sqlstate 'PT409' using message='VOICE_RECORD_LAYER_MISMATCH'; end if;
  return jsonb_build_object('projectId',project.id,'projectSeed',project.seed,'partIds',part_ids,'projectRevision',project.revision,'tracks',tracks);
end;
$$;
create function public.ieum_store_project_voice_record_input(p_project_id text,p_expected_revision integer,p_input jsonb,p_sources jsonb,p_layer_refs jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare context jsonb; item jsonb; track jsonb; previous public.ieum_project_voice_record_inputs; ready boolean;
begin
  perform 1 from public.ieum_projects where id=p_project_id for share;
  select * into previous from public.ieum_project_voice_record_inputs where project_id=p_project_id and input_digest=p_input->>'inputDigest';
  if found then
    if previous.input is distinct from p_input or previous.source_bindings is distinct from p_sources then
      raise sqlstate 'PT409' using message='VOICE_RECORD_REVISION_CONFLICT'; end if;
    return jsonb_build_object('projectId',p_project_id,'inputDigest',previous.input_digest,'input',previous.input);
  end if;
  context:=public.ieum_get_project_voice_record_context(p_project_id,p_layer_refs);
  if (context->>'projectRevision')::integer is distinct from p_expected_revision or p_input->>'projectId' is distinct from p_project_id or
    p_input->>'projectSeed' is distinct from context->>'projectSeed' or p_input->'partIds' is distinct from context->'partIds' or
    p_input->>'contractVersion' is distinct from 'ieum-identity-input-v1' or coalesce(p_input->>'inputDigest','') !~ '^[a-f0-9]{64}$' or
    coalesce(p_input->>'generatorVersion','') ~ '^[[:space:]]*$' or jsonb_typeof(p_input->'layers') is distinct from 'array' or
    jsonb_typeof(p_sources) is distinct from 'object' then raise sqlstate 'PT409' using message='VOICE_RECORD_SOURCE_MISMATCH'; end if;
  if jsonb_array_length(p_input->'layers')<>jsonb_array_length(context->'tracks') or
    (select count(*) from jsonb_object_keys(p_sources))<>jsonb_array_length(context->'tracks') or
    (p_input->>'submittedCount')::integer is distinct from jsonb_array_length(context->'tracks') or
    (p_input->>'allRequiredTracksSubmitted')::boolean is distinct from (jsonb_array_length(context->'tracks')=jsonb_array_length(context->'partIds')) then
    raise sqlstate 'PT409' using message='VOICE_RECORD_SOURCE_MISMATCH'; end if;
  ready:=jsonb_array_length(context->'tracks')>0;
  for item in select value from jsonb_array_elements(p_input->'layers') loop
    select value into track from jsonb_array_elements(context->'tracks') where value->>'trackId'=item->>'trackId' and value->>'partId'=item->>'partId';
    if not found or item->>'trackRevision' is distinct from p_sources->(item->>'trackId')->>'sourceRevision' or
      p_sources->(item->>'trackId')->>'sha256' is distinct from track->>'sha256' or
      p_sources->(item->>'trackId')->>'byteLength' is distinct from track->>'size' or
      p_sources->(item->>'trackId')->>'featuresSha256' is distinct from track->'analysis'->>'featuresSha256' or
      p_sources->(item->>'trackId')->'audioReceipt' is distinct from track->'receipt' or
      item->'layerRef' is distinct from (case when track->'layerRef'='null'::jsonb then 'null'::jsonb else (track->'layerRef')-'inputDigest' end) then
      raise sqlstate 'PT409' using message='VOICE_RECORD_SOURCE_MISMATCH'; end if;
    if item->'layerRef'='null'::jsonb then ready:=false; end if;
  end loop;
  if (select count(distinct value->>'trackId') from jsonb_array_elements(p_input->'layers'))<>jsonb_array_length(context->'tracks') or
    (p_input->>'allSubmittedLayersReady')::boolean is distinct from ready then raise sqlstate 'PT409' using message='VOICE_RECORD_SOURCE_MISMATCH'; end if;
  insert into public.ieum_project_voice_record_inputs values(p_project_id,p_input->>'inputDigest',p_expected_revision,p_input,p_sources)
    on conflict(project_id,input_digest) do nothing;
  select * into previous from public.ieum_project_voice_record_inputs where project_id=p_project_id and input_digest=p_input->>'inputDigest';
  if previous.input is distinct from p_input or previous.source_bindings is distinct from p_sources then
    raise sqlstate 'PT409' using message='VOICE_RECORD_REVISION_CONFLICT'; end if;
  return jsonb_build_object('projectId',p_project_id,'inputDigest',previous.input_digest,'input',previous.input);
end;
$$;
create function public.ieum_get_project_voice_record_input(p_project_id text,p_input_digest text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare caller uuid:=auth.uid(); result public.ieum_project_voice_record_inputs;
begin
  if caller is null then raise sqlstate 'PT401' using message='AUTH_REQUIRED'; end if;
  if not exists(select 1 from public.ieum_projects where id=p_project_id and owner_user_id=caller) and
    not exists(select 1 from public.ieum_project_parts where project_id=p_project_id and assigned_user_id=caller) then
    raise sqlstate 'PT404' using message='VOICE_RECORD_NOT_FOUND'; end if;
  select * into result from public.ieum_project_voice_record_inputs where project_id=p_project_id and input_digest=p_input_digest;
  if not found then raise sqlstate 'PT404' using message='VOICE_RECORD_NOT_FOUND'; end if;
  return jsonb_build_object('projectId',result.project_id,'inputDigest',result.input_digest,'input',result.input);
end;
$$;
create trigger ieum_project_voice_record_input_immutable before update or delete on public.ieum_project_voice_record_inputs
  for each row execute function public.ieum_reject_personal_identity_change();
revoke all on function public.ieum_get_project_voice_record_context(text,jsonb),public.ieum_store_project_voice_record_input(text,integer,jsonb,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.ieum_get_project_voice_record_context(text,jsonb),public.ieum_store_project_voice_record_input(text,integer,jsonb,jsonb,jsonb) to service_role;
revoke all on function public.ieum_get_project_voice_record_input(text,text) from public,anon,service_role;
grant execute on function public.ieum_get_project_voice_record_input(text,text) to authenticated;
commit;
