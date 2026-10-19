begin;
-- Empty private registry. Only trusted ingestion of a verified catalog backing
-- may insert a receipt; no demo music, invented analysis or public URLs seeded.
create table public.ieum_arrangement_audio (
  arrangement_id text primary key references public.ieum_catalog_arrangements(id),
  object_id uuid not null unique,
  audio_source_ref jsonb not null check (jsonb_typeof(audio_source_ref)='object'),
  receipt jsonb not null check (jsonb_typeof(receipt)='object')
);
alter table public.ieum_arrangement_audio enable row level security;
revoke all on public.ieum_arrangement_audio from public,anon,authenticated;
grant select,insert on public.ieum_arrangement_audio to service_role;
create trigger ieum_arrangement_audio_immutable before update or delete on public.ieum_arrangement_audio
  for each row execute function public.ieum_preserve_arrangement_revision();

create function public.ieum_get_mix_backing(p_job_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare context jsonb; backing public.ieum_arrangement_audio; arrangement public.ieum_catalog_arrangements;
begin
  context:=public.ieum_get_mix_completion_context(p_job_id);
  select a.* into arrangement from public.ieum_projects p join public.ieum_catalog_arrangements a on a.id=p.arrangement_id
    where p.id=context->>'projectId';
  if not found or arrangement.audio_source_ref is distinct from context->'audioSourceRef' then
    raise sqlstate 'PT409' using message='MIX_BACKING_UNAVAILABLE';
  end if;
  select * into backing from public.ieum_arrangement_audio where arrangement_id=arrangement.id;
  if not found then raise sqlstate 'PT409' using message='MIX_BACKING_UNAVAILABLE'; end if;
  if backing.audio_source_ref is distinct from arrangement.audio_source_ref or
    backing.receipt->>'sha256' is distinct from arrangement.audio_source_ref->>'backingSha256' then
    raise sqlstate 'PT409' using message='MIX_BACKING_CONFLICT';
  end if;
  return jsonb_build_object('jobId',p_job_id,'audioSourceRef',backing.audio_source_ref,
    'objectId',backing.object_id,'receipt',backing.receipt);
end;
$$;
revoke all on function public.ieum_get_mix_backing(uuid) from public,anon,authenticated;
grant execute on function public.ieum_get_mix_backing(uuid) to service_role;
commit;
