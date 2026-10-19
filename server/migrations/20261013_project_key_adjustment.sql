-- Apply after project_participation. No guessed transposition or source ingestion.
begin;
alter table public.ieum_operation_results drop constraint ieum_operation_results_operation_check;
alter table public.ieum_operation_results add constraint ieum_operation_results_operation_check
  check (operation in ('create-project','join-part','set-key'));

create function public.ieum_set_project_key(p_project_id text,p_arrangement_id text,p_expected_revision integer,p_request_key text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare caller uuid:=auth.uid(); project public.ieum_projects; arrangement public.ieum_catalog_arrangements;
  previous public.ieum_operation_results; part public.ieum_project_parts; target jsonb; result jsonb;
  request_input jsonb:=jsonb_build_object('projectId',p_project_id,'arrangementId',p_arrangement_id,'expectedRevision',p_expected_revision);
begin
  if caller is null then raise sqlstate 'PT401' using message='AUTH_REQUIRED'; end if;
  if p_request_key is null or p_request_key ~ '^[[:space:]]*$' then raise sqlstate 'PT400' using message='IDEMPOTENCY_KEY_REQUIRED'; end if;
  if p_expected_revision is null or p_expected_revision<0 then raise sqlstate 'PT400' using message='INVALID_PROJECT_REQUEST'; end if;
  perform pg_advisory_xact_lock(hashtextextended(caller::text || ':set-key:' || p_request_key,0));
  select * into project from public.ieum_projects where id=p_project_id for update;
  if not found then raise sqlstate 'PT404' using message='PROJECT_NOT_FOUND'; end if;
  if project.owner_user_id is distinct from caller then raise sqlstate 'PT403' using message='PROJECT_OWNER_REQUIRED'; end if;
  select * into previous from public.ieum_operation_results where user_id=caller and operation='set-key' and request_key=p_request_key;
  if found then
    if previous.input<>request_input then raise sqlstate 'PT409' using message='IDEMPOTENCY_CONFLICT'; end if;
    return previous.result;
  end if;
  if project.key_locked_at is not null or project.lifecycle<>'recruiting' or
    exists(select 1 from public.ieum_submitted_tracks where project_id=p_project_id) then
    raise sqlstate 'PT409' using message='PROJECT_AUDIO_LOCKED';
  end if;
  if project.revision<>p_expected_revision then raise sqlstate 'PT409' using message='PROJECT_REVISION_CONFLICT'; end if;
  select * into arrangement from public.ieum_catalog_arrangements where id=p_arrangement_id for share;
  if not found then raise sqlstate 'PT404' using message='ARRANGEMENT_NOT_FOUND'; end if;
  if arrangement.song_id<>project.song_id or jsonb_array_length(arrangement.parts)<>project.part_count or
    (select count(*) from public.ieum_project_parts where project_id=p_project_id)<>project.part_count then
    raise sqlstate 'PT409' using message='ARRANGEMENT_PARTS_MISMATCH';
  end if;
  -- Keep actual assignments/Part IDs. Recheck their measured fit before any mutation.
  for part in select * from public.ieum_project_parts where project_id=p_project_id order by part_id for update loop
    select value into target from jsonb_array_elements(arrangement.parts) where value->>'id'=part.part_id;
    if not found then raise sqlstate 'PT409' using message='ARRANGEMENT_PARTS_MISMATCH'; end if;
    if part.assigned_user_id is not null then perform public.ieum_require_part_fit(part.assigned_user_id,target->'requiredRange'); end if;
  end loop;
  if project.arrangement_id is distinct from arrangement.id then
    update public.ieum_project_parts as stored set required_range=target.value->'requiredRange'
      from jsonb_array_elements(arrangement.parts) as target(value)
      where stored.project_id=p_project_id and stored.part_id=target.value->>'id';
    update public.ieum_projects set project_key=arrangement.project_key,audio_source_ref=arrangement.audio_source_ref,
      arrangement_id=arrangement.id,revision=revision+1,last_valid_activity_at=now() where id=p_project_id;
  end if;
  result:=public.ieum_get_project(p_project_id);
  insert into public.ieum_operation_results values(caller,'set-key',p_request_key,request_input,result);
  return result;
end;
$$;
revoke all on function public.ieum_set_project_key(text,text,integer,text) from public,anon,authenticated;
grant execute on function public.ieum_set_project_key(text,text,integer,text) to authenticated;
commit;
