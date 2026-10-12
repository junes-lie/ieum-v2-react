begin;
-- A participant-only view of an existing Mix job. No public original/result
-- access or worker completion is granted by this read contract.
create function public.ieum_get_project_mix(p_project_id text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare caller uuid:=auth.uid(); project public.ieum_projects; job public.ieum_mix_jobs; current_tracks jsonb;
begin
  if caller is null then raise sqlstate 'PT401' using message='AUTH_REQUIRED'; end if;
  select * into project from public.ieum_projects where id=p_project_id for share;
  if not found then raise sqlstate 'PT404' using message='PROJECT_NOT_FOUND'; end if;
  if not exists(select 1 from public.ieum_project_parts where project_id=p_project_id and assigned_user_id=caller) then
    raise sqlstate 'PT403' using message='PART_NOT_ASSIGNED';
  end if;
  select * into job from public.ieum_mix_jobs where project_id=p_project_id for share;
  if not found then
    if project.lifecycle<>'recruiting' then raise sqlstate 'PT409' using message='PROJECT_CONFLICT'; end if;
    return jsonb_build_object('project',public.ieum_get_project(p_project_id),'mix',null);
  end if;
  select jsonb_agg(id order by part_id) into current_tracks from public.ieum_submitted_tracks where project_id=p_project_id;
  if current_tracks is null or job.track_ids is distinct from current_tracks or jsonb_array_length(current_tracks)<>project.part_count or
    job.audio_source_ref is distinct from project.audio_source_ref or
    (job.status='succeeded' and project.lifecycle<>'completed') or
    (job.status<>'succeeded' and project.lifecycle<>'mixing') then
    raise sqlstate 'PT409' using message='PROJECT_CONFLICT';
  end if;
  return jsonb_build_object('project',public.ieum_get_project(p_project_id),'mix',jsonb_build_object(
    'jobId',job.id,'status',job.status,'result',case when job.status='succeeded' then
      jsonb_build_object('objectId',job.result_object_id,'sha256',job.result_sha256,
        'duration',job.result_duration,'completedAt',job.completed_at) else null end));
end;
$$;
revoke all on function public.ieum_get_project_mix(text) from public,anon,authenticated;
grant execute on function public.ieum_get_project_mix(text) to authenticated;
commit;
