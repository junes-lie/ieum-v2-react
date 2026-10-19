begin;
alter table public.ieum_upload_intents add column request_key text;
create unique index ieum_upload_request_unique on public.ieum_upload_intents(user_id,request_key) where request_key is not null;

create function public.ieum_prepare_track_upload(p_project_id text,p_part_id text,p_request_key text,
  p_size bigint,p_sha256 text,p_content_type text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare caller uuid:=auth.uid(); project public.ieum_projects; intent public.ieum_upload_intents;
begin
  if caller is null then raise sqlstate 'PT401' using message='AUTH_REQUIRED'; end if;
  if p_request_key is null or p_request_key ~ '^[[:space:]]*$' or p_size is null or p_size<=0 or p_size>9007199254740991 or
    p_sha256 is null or p_sha256 !~ '^[a-f0-9]{64}$' or p_content_type is null or p_content_type !~ '^audio/[a-z0-9][a-z0-9!#$&^_.+-]*$' then
    raise sqlstate 'PT400' using message='INVALID_UPLOAD_FILE';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(caller::text || ':upload:' || p_request_key,0));
  select * into project from public.ieum_projects where id=p_project_id for update;
  if not found then raise sqlstate 'PT404' using message='PROJECT_NOT_FOUND'; end if;
  if not exists (select 1 from public.ieum_project_parts where project_id=p_project_id and part_id=p_part_id and assigned_user_id=caller) then
    raise sqlstate 'PT403' using message='PART_NOT_ASSIGNED';
  end if;
  select * into intent from public.ieum_upload_intents where user_id=caller and request_key=p_request_key for update;
  if found then
    if intent.project_id<>p_project_id or intent.part_id<>p_part_id or intent.byte_length<>p_size or intent.sha256<>p_sha256 or intent.content_type<>p_content_type then
      raise sqlstate 'PT409' using message='IDEMPOTENCY_CONFLICT';
    end if;
  else
    if project.key_locked_at is null or project.lifecycle<>'recruiting' or exists
      (select 1 from public.ieum_submitted_tracks where project_id=p_project_id and part_id=p_part_id) then
      raise sqlstate 'PT409' using message='PROJECT_NOT_RECORDING';
    end if;
    insert into public.ieum_upload_intents(project_id,part_id,user_id,object_id,byte_length,sha256,content_type,request_key)
      values(p_project_id,p_part_id,caller,gen_random_uuid(),p_size,p_sha256,p_content_type,p_request_key) returning * into intent;
  end if;
  -- Private server receipt metadata. The API never returns object IDs as user IDs.
  return jsonb_build_object('uploadIntentId',intent.id,'objectId',intent.object_id,'size',intent.byte_length,
    'sha256',intent.sha256,'contentType',intent.content_type,'submissionVerified',intent.verified_at is not null);
end;
$$;
revoke all on function public.ieum_prepare_track_upload(text,text,text,bigint,text,text) from public,anon,authenticated;
grant execute on function public.ieum_prepare_track_upload(text,text,text,bigint,text,text) to authenticated;
commit;
