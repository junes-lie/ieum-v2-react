begin;
-- Service-only execution inputs. The existing completion transaction rechecks
-- the same submitted snapshot after rendering and Storage I/O.
create function public.ieum_get_mix_render_context(p_job_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare context jsonb; tracks jsonb; parts jsonb;
begin
  context:=public.ieum_get_mix_completion_context(p_job_id);
  if exists(select 1 from public.ieum_submitted_tracks t
    join public.ieum_upload_intents i on i.id=t.upload_intent_id
    where t.project_id=context->>'projectId' and
      (i.verified_at is null or i.audio_receipt is null or i.verified_duration<>t.duration or
       i.project_id<>t.project_id or i.part_id<>t.part_id or i.user_id<>t.user_id or
       t.audio_source_ref is distinct from context->'audioSourceRef')) then
    raise sqlstate 'PT409' using message='MIX_INPUT_CONFLICT';
  end if;
  select jsonb_agg(part_id order by part_id) into parts from public.ieum_project_parts where project_id=context->>'projectId';
  select jsonb_agg(jsonb_build_object('id',t.id,'projectId',t.project_id,'partId',t.part_id,
    'kind','submitted-track','submitted',true,'audioSourceRef',t.audio_source_ref,'syncOffsetMs',t.sync_offset_ms,
    'objectId',i.object_id,'size',i.byte_length,'sha256',i.sha256,'contentType',i.content_type,'receipt',i.audio_receipt)
    order by t.part_id) into tracks from public.ieum_submitted_tracks t
    join public.ieum_upload_intents i on i.id=t.upload_intent_id where t.project_id=context->>'projectId';
  return context || jsonb_build_object('partIds',parts,'tracks',tracks);
end;
$$;
revoke all on function public.ieum_get_mix_render_context(uuid) from public,anon,authenticated;
grant execute on function public.ieum_get_mix_render_context(uuid) to service_role;
commit;
