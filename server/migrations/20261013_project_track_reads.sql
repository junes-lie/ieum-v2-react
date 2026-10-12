begin;
-- Private originals for confirmed Workspace participants. Public/invitation
-- previews are separate Mix/Result resources, never private recording URLs.
create function public.ieum_list_project_tracks(p_project_id text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare caller uuid:=auth.uid(); tracks jsonb;
begin
  if caller is null then raise sqlstate 'PT401' using message='AUTH_REQUIRED'; end if;
  -- Hold the same Project boundary used by submission so the Track list and
  -- submitted count come from a consistent revision within this RPC.
  perform 1 from public.ieum_projects where id=p_project_id for share;
  if not found then
    raise sqlstate 'PT404' using message='PROJECT_NOT_FOUND';
  end if;
  if not exists(select 1 from public.ieum_project_parts where project_id=p_project_id and assigned_user_id=caller) then
    raise sqlstate 'PT403' using message='PART_NOT_ASSIGNED';
  end if;
  if exists(select 1 from public.ieum_submitted_tracks t join public.ieum_upload_intents i on i.id=t.upload_intent_id
    where t.project_id=p_project_id and (i.verified_at is null or i.audio_receipt is null or i.verified_duration<>t.duration or
      i.project_id<>t.project_id or i.part_id<>t.part_id or i.user_id<>t.user_id)) then
    raise sqlstate 'PT409' using message='UPLOAD_NOT_VERIFIED';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'projectId',t.project_id,'partId',t.part_id,'participantId',t.user_id,
    'duration',t.duration,'syncOffsetMs',t.sync_offset_ms,'audioSourceRef',t.audio_source_ref,'submittedAt',t.submitted_at,
    'objectId',i.object_id,'size',i.byte_length,'sha256',i.sha256,'contentType',i.content_type) order by t.part_id),'[]'::jsonb)
    into tracks from public.ieum_submitted_tracks t join public.ieum_upload_intents i on i.id=t.upload_intent_id where t.project_id=p_project_id;
  return jsonb_build_object('project',public.ieum_get_project(p_project_id),'tracks',tracks);
end;
$$;
revoke all on function public.ieum_list_project_tracks(text) from public,anon,authenticated;
grant execute on function public.ieum_list_project_tracks(text) to authenticated;
commit;
