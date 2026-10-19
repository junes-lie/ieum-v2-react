begin;
-- Trusted worker context, not a public signing/completion endpoint. Validate
-- current inputs again in the existing completion transaction after file I/O.
create function public.ieum_get_mix_completion_context(p_job_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare job public.ieum_mix_jobs; project public.ieum_projects; current_tracks jsonb;
begin
  select * into job from public.ieum_mix_jobs where id=p_job_id;
  if not found then raise sqlstate 'PT404' using message='MIX_JOB_NOT_FOUND'; end if;
  select * into project from public.ieum_projects where id=job.project_id for share;
  select * into job from public.ieum_mix_jobs where id=p_job_id for share;
  select jsonb_agg(id order by part_id) into current_tracks from public.ieum_submitted_tracks where project_id=job.project_id;
  if current_tracks is null or job.track_ids is distinct from current_tracks or
    jsonb_array_length(current_tracks)<>project.part_count or job.audio_source_ref is distinct from project.audio_source_ref or
    (job.status='succeeded' and project.lifecycle<>'completed') or
    (job.status<>'succeeded' and project.lifecycle<>'mixing') then
    raise sqlstate 'PT409' using message='MIX_INPUT_CONFLICT';
  end if;
  return jsonb_build_object('jobId',job.id,'projectId',project.id,'projectSeed',project.seed,
    'partCount',project.part_count,'trackIds',current_tracks,'audioSourceRef',project.audio_source_ref,'status',job.status,
    'result',case when job.status='succeeded' then jsonb_build_object('objectId',job.result_object_id,
      'sha256',job.result_sha256,'duration',job.result_duration) else null end);
end;
$$;
revoke all on function public.ieum_get_mix_completion_context(uuid) from public,anon,authenticated;
grant execute on function public.ieum_get_mix_completion_context(uuid) to service_role;
commit;
