-- Apply after verified_audio_receipts. Analysis is independent of submission/Mix.
begin;
create table public.ieum_submitted_track_analyses (
  track_id text primary key references public.ieum_submitted_tracks(id),
  analysis jsonb not null check (jsonb_typeof(analysis)='object'),
  created_at timestamptz not null default now()
);
alter table public.ieum_submitted_track_analyses enable row level security;
revoke all on public.ieum_submitted_track_analyses from public,anon,authenticated,service_role;

create function public.ieum_get_owned_submitted_track_analysis(p_project_id text,p_part_id text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare caller uuid:=auth.uid(); track public.ieum_submitted_tracks; intent public.ieum_upload_intents; saved jsonb;
begin
  if caller is null then raise sqlstate 'PT401' using message='AUTH_REQUIRED'; end if;
  select * into track from public.ieum_submitted_tracks where project_id=p_project_id and part_id=p_part_id;
  if not found then raise sqlstate 'PT404' using message='SUBMITTED_TRACK_NOT_FOUND'; end if;
  if track.user_id<>caller then raise sqlstate 'PT403' using message='TRACK_ANALYSIS_FORBIDDEN'; end if;
  select * into intent from public.ieum_upload_intents where id=track.upload_intent_id;
  if not found or intent.user_id<>caller or intent.project_id<>track.project_id or intent.part_id<>track.part_id or
    intent.audio_receipt is null or intent.verified_duration is distinct from track.duration then
    raise sqlstate 'PT409' using message='TRACK_AUDIO_NOT_VERIFIED';
  end if;
  select analysis into saved from public.ieum_submitted_track_analyses where track_id=track.id;
  return jsonb_build_object('trackId',track.id,'projectId',track.project_id,'partId',track.part_id,'userId',caller,
    'purpose','project-track','submitted',true,'audioVerified',true,'objectId',intent.object_id,
    'size',intent.byte_length,'sha256',intent.sha256,'contentType',intent.content_type,'receipt',intent.audio_receipt,'analysis',saved);
end;
$$;

create function public.ieum_confirm_submitted_track_analysis(p_project_id text,p_part_id text,p_user_id uuid,p_object_id uuid,p_analysis jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare track public.ieum_submitted_tracks; intent public.ieum_upload_intents; saved jsonb;
begin
  if p_analysis is null or jsonb_typeof(p_analysis)<>'object' or
    (select count(*) from jsonb_object_keys(p_analysis))<>7 or
    not(p_analysis ?& array['version','sourceSha256','byteLength','audioReceipt','features','featuresSha256','assessment']) or
    p_analysis->>'version' is distinct from 'ieum-track-analysis-v1' or
    jsonb_typeof(p_analysis->'byteLength') is distinct from 'number' or
    coalesce(p_analysis->>'featuresSha256','') !~ '^[a-f0-9]{64}$' or
    jsonb_typeof(p_analysis->'features') is distinct from 'object' or
    p_analysis->'features'->>'version' is distinct from 'ieum-basic-voice-v5' or
    p_analysis->'features'->>'pitchAnalysisVersion' is distinct from 'normalized-difference-v1' or
    p_analysis->'features'->>'pitchFrameLength' is distinct from '4096' or
    p_analysis->'features'->>'sampleRate' is distinct from '48000' or
    jsonb_typeof(p_analysis->'assessment') is distinct from 'object' or
    p_analysis->'assessment'->>'purpose' is distinct from 'project-track' or
    p_analysis->'assessment'->>'analysisVersion' is distinct from 'ieum-basic-voice-v5' then
    raise sqlstate 'PT400' using message='INVALID_TRACK_ANALYSIS';
  end if;
  perform 1 from public.ieum_projects where id=p_project_id for share;
  select * into track from public.ieum_submitted_tracks where project_id=p_project_id and part_id=p_part_id for update;
  if not found then raise sqlstate 'PT404' using message='SUBMITTED_TRACK_NOT_FOUND'; end if;
  if p_user_id is null or track.user_id<>p_user_id then raise sqlstate 'PT403' using message='TRACK_ANALYSIS_FORBIDDEN'; end if;
  select * into intent from public.ieum_upload_intents where id=track.upload_intent_id;
  if not found or intent.user_id<>p_user_id or intent.project_id<>track.project_id or intent.part_id<>track.part_id or
    p_object_id is null or intent.object_id<>p_object_id or intent.sha256 is distinct from p_analysis->>'sourceSha256' or
    intent.byte_length::text is distinct from p_analysis->>'byteLength' or
    intent.audio_receipt is null or intent.verified_duration is distinct from track.duration or
    intent.audio_receipt is distinct from p_analysis->'audioReceipt' then
    raise sqlstate 'PT409' using message='TRACK_ANALYSIS_SOURCE_MISMATCH';
  end if;
  select analysis into saved from public.ieum_submitted_track_analyses where track_id=track.id;
  if saved is not null then
    if saved is distinct from p_analysis then raise sqlstate 'PT409' using message='TRACK_ANALYSIS_CONFLICT'; end if;
  else
    insert into public.ieum_submitted_track_analyses(track_id,analysis) values(track.id,p_analysis);
  end if;
  return jsonb_build_object('trackId',track.id,'analysisStatus','verified','analysis',p_analysis);
end;
$$;
revoke all on function public.ieum_get_owned_submitted_track_analysis(text,text) from public,anon,authenticated;
grant execute on function public.ieum_get_owned_submitted_track_analysis(text,text) to authenticated;
revoke all on function public.ieum_confirm_submitted_track_analysis(text,text,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.ieum_confirm_submitted_track_analysis(text,text,uuid,uuid,jsonb) to service_role;
commit;
