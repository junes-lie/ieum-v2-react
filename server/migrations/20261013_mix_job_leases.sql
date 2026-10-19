begin;
alter table public.ieum_mix_jobs add column lease_token uuid,
  add column lease_until timestamptz,
  add column queued_at timestamptz not null default now();

create function public.ieum_claim_mix_job(p_lease_seconds integer,p_job_id uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare job public.ieum_mix_jobs; token uuid;
begin
  if p_lease_seconds is null or p_lease_seconds<30 or p_lease_seconds>3600 then
    raise sqlstate 'PT400' using message='INVALID_MIX_LEASE';
  end if;
  select * into job from public.ieum_mix_jobs
    where (p_job_id is null or id=p_job_id) and
      (status='queued' or (status='processing' and (lease_until is null or lease_until<clock_timestamp())) or
        (p_job_id is not null and status='failed'))
    order by queued_at,id for update skip locked limit 1;
  if not found then return null; end if;
  token:=gen_random_uuid();
  update public.ieum_mix_jobs set status='processing',lease_token=token,
    lease_until=clock_timestamp()+make_interval(secs=>p_lease_seconds) where id=job.id;
  return jsonb_build_object('jobId',job.id,'leaseToken',token);
end;
$$;

create function public.ieum_renew_mix_job(p_job_id uuid,p_lease_token uuid,p_lease_seconds integer) returns boolean
language plpgsql security definer set search_path='' as $$
begin
  if p_lease_seconds is null or p_lease_seconds<30 or p_lease_seconds>3600 then
    raise sqlstate 'PT400' using message='INVALID_MIX_LEASE';
  end if;
  update public.ieum_mix_jobs set lease_until=clock_timestamp()+make_interval(secs=>p_lease_seconds)
    where id=p_job_id and status='processing' and lease_token=p_lease_token and lease_until>clock_timestamp();
  return found;
end;
$$;

create function public.ieum_fail_mix_job(p_job_id uuid,p_lease_token uuid) returns boolean
language plpgsql security definer set search_path='' as $$
begin
  update public.ieum_mix_jobs set status='failed',lease_token=null,lease_until=null
    where id=p_job_id and status='processing' and lease_token=p_lease_token and lease_until>clock_timestamp();
  return found;
end;
$$;

create function public.ieum_complete_claimed_mix(p_job_id uuid,p_lease_token uuid,p_object_id uuid,p_sha256 text,p_duration double precision)
returns jsonb language plpgsql security definer set search_path='' as $$
declare job public.ieum_mix_jobs; result jsonb;
begin
  select * into job from public.ieum_mix_jobs where id=p_job_id;
  if not found then raise sqlstate 'PT404' using message='MIX_JOB_NOT_FOUND'; end if;
  -- Match the existing completion lock order: Project, then job.
  perform 1 from public.ieum_projects where id=job.project_id for update;
  select * into job from public.ieum_mix_jobs where id=p_job_id for update;
  if p_lease_token is null or job.lease_token is distinct from p_lease_token or
    (job.status<>'succeeded' and (job.status<>'processing' or job.lease_until is null or job.lease_until<=clock_timestamp())) then
    raise sqlstate 'PT409' using message='MIX_LEASE_LOST';
  end if;
  result:=public.ieum_complete_verified_mix(p_job_id,p_object_id,p_sha256,p_duration);
  return result;
end;
$$;
revoke all on function public.ieum_claim_mix_job(integer,uuid),public.ieum_renew_mix_job(uuid,uuid,integer),
  public.ieum_fail_mix_job(uuid,uuid),public.ieum_complete_claimed_mix(uuid,uuid,uuid,text,double precision) from public,anon,authenticated;
grant execute on function public.ieum_claim_mix_job(integer,uuid),public.ieum_renew_mix_job(uuid,uuid,integer),
  public.ieum_fail_mix_job(uuid,uuid),public.ieum_complete_claimed_mix(uuid,uuid,uuid,text,double precision) to service_role;
commit;
