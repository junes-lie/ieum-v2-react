begin;
create function public.ieum_get_owned_upload(p_project_id text,p_part_id text,p_upload_intent_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare caller uuid:=auth.uid(); intent public.ieum_upload_intents;
begin
  if caller is null then raise sqlstate 'PT401' using message='AUTH_REQUIRED'; end if;
  if not exists(select 1 from public.ieum_project_parts where project_id=p_project_id and part_id=p_part_id and assigned_user_id=caller) then
    raise sqlstate 'PT403' using message='PART_NOT_ASSIGNED';
  end if;
  select * into intent from public.ieum_upload_intents where id=p_upload_intent_id and project_id=p_project_id and part_id=p_part_id and user_id=caller;
  if not found then raise sqlstate 'PT409' using message='UPLOAD_NOT_VERIFIED'; end if;
  return jsonb_build_object('projectId',intent.project_id,'partId',intent.part_id,'userId',caller,
    'uploadIntentId',intent.id,'objectId',intent.object_id,'size',intent.byte_length,'sha256',intent.sha256,
    'contentType',intent.content_type,'receipt',intent.audio_receipt);
end;
$$;
revoke all on function public.ieum_get_owned_upload(text,text,uuid) from public,anon,authenticated;
grant execute on function public.ieum_get_owned_upload(text,text,uuid) to authenticated;
commit;
