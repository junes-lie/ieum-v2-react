begin;
-- Stable, private result identity for retries after render/upload/DB failures.
-- Neither allocating it nor uploading a file submits a Track or completes Mix.
alter table public.ieum_mix_jobs add column output_object_id uuid unique,
  add column output_sha256 text,
  add column output_byte_length bigint,
  add constraint ieum_mix_output_manifest check (
    (output_object_id is null and output_sha256 is null and output_byte_length is null) or
    (output_object_id is not null and output_sha256 is not null and output_sha256 ~ '^[a-f0-9]{64}$' and output_byte_length is not null and output_byte_length>0));
create function public.ieum_guard_mix_output_manifest() returns trigger
language plpgsql set search_path='' as $$
begin
  if old.output_object_id is not null and (new.output_object_id is distinct from old.output_object_id or
    new.output_sha256 is distinct from old.output_sha256 or new.output_byte_length is distinct from old.output_byte_length) then
    raise sqlstate 'PT409' using message='MIX_RESULT_CONFLICT';
  end if;
  if new.status='succeeded' and new.output_object_id is not null and
    (new.result_object_id is distinct from new.output_object_id or new.result_sha256 is distinct from new.output_sha256) then
    raise sqlstate 'PT409' using message='MIX_RESULT_CONFLICT';
  end if;
  return new;
end;
$$;
create trigger ieum_mix_output_manifest_guard before update on public.ieum_mix_jobs
for each row execute function public.ieum_guard_mix_output_manifest();
revoke all on function public.ieum_guard_mix_output_manifest() from public,anon,authenticated,service_role;
create function public.ieum_prepare_mix_output(p_job_id uuid,p_sha256 text,p_size bigint) returns jsonb
language plpgsql security definer set search_path='' as $$
declare job public.ieum_mix_jobs; object_id uuid;
begin
  if p_sha256 is null or p_sha256 !~ '^[a-f0-9]{64}$' or p_size is null or p_size<=0 then
    raise sqlstate 'PT400' using message='INVALID_MIX_RESULT';
  end if;
  select * into job from public.ieum_mix_jobs where id=p_job_id;
  if not found then raise sqlstate 'PT404' using message='MIX_JOB_NOT_FOUND'; end if;
  perform 1 from public.ieum_projects where id=job.project_id for update;
  select * into job from public.ieum_mix_jobs where id=p_job_id for update;
  perform public.ieum_get_mix_completion_context(p_job_id);
  if (job.output_sha256 is not null and (job.output_sha256<>p_sha256 or job.output_byte_length<>p_size)) or
    (job.status='succeeded' and job.result_sha256<>p_sha256) then
    raise sqlstate 'PT409' using message='MIX_RESULT_CONFLICT';
  end if;
  if job.status='succeeded' then object_id:=job.result_object_id;
  else
    object_id:=coalesce(job.output_object_id,gen_random_uuid());
    if job.output_object_id is null then update public.ieum_mix_jobs set output_object_id=object_id,output_sha256=p_sha256,output_byte_length=p_size where id=p_job_id; end if;
  end if;
  return jsonb_build_object('jobId',job.id,'projectId',job.project_id,'objectId',object_id,'status',job.status,'sha256',p_sha256,'size',p_size,'contentType','audio/wav');
end;
$$;
revoke all on function public.ieum_prepare_mix_output(uuid,text,bigint) from public,anon,authenticated;
grant execute on function public.ieum_prepare_mix_output(uuid,text,bigint) to service_role;
commit;
