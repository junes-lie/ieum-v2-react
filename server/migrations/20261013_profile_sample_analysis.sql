-- Apply after profile_sample_receipts. Trusted source analysis, not Identity.
begin;
alter table public.ieum_profile_sample_upload_intents add column voice_analysis jsonb
  check (voice_analysis is null or jsonb_typeof(voice_analysis)='object');
create or replace function public.ieum_get_owned_profile_sample_upload(p_upload_intent_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare caller uuid:=auth.uid(); intent public.ieum_profile_sample_upload_intents;
begin
  if caller is null then raise sqlstate 'PT401' using message='AUTH_REQUIRED'; end if;
  select * into intent from public.ieum_profile_sample_upload_intents where id=p_upload_intent_id and user_id=caller;
  if not found then raise sqlstate 'PT404' using message='SAMPLE_UPLOAD_NOT_FOUND'; end if;
  return jsonb_build_object('uploadIntentId',intent.id,'userId',intent.user_id,'objectId',intent.object_id,
    'purpose','voice-sample','size',intent.byte_length,'sha256',intent.sha256,'contentType',intent.content_type,
    'audioVerified',intent.audio_receipt is not null,'receipt',intent.audio_receipt,'analysis',intent.voice_analysis);
end;
$$;
create function public.ieum_confirm_profile_sample_analysis(p_user_id uuid,p_upload_intent_id uuid,p_object_id uuid,p_analysis jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare intent public.ieum_profile_sample_upload_intents;
begin
  if p_analysis is null or jsonb_typeof(p_analysis)<>'object' or (select count(*) from jsonb_object_keys(p_analysis))<>7 or
    not(p_analysis ?& array['version','sourceSha256','byteLength','audioReceipt','features','featuresSha256','assessment']) or
    p_analysis->>'version' is distinct from 'ieum-sample-analysis-v1' or
    jsonb_typeof(p_analysis->'byteLength') is distinct from 'number' or
    coalesce(p_analysis->>'featuresSha256','') !~ '^[a-f0-9]{64}$' or
    jsonb_typeof(p_analysis->'features') is distinct from 'object' or
    p_analysis->'features'->>'version' is distinct from 'ieum-basic-voice-v5' or
    p_analysis->'features'->>'pitchAnalysisVersion' is distinct from 'normalized-difference-v1' or
    p_analysis->'features'->>'pitchFrameLength' is distinct from '4096' or
    p_analysis->'features'->>'sampleRate' is distinct from '48000' or
    jsonb_typeof(p_analysis->'assessment') is distinct from 'object' or
    p_analysis->'assessment'->>'purpose' is distinct from 'voice-sample' or
    p_analysis->'assessment'->>'analysisVersion' is distinct from 'ieum-basic-voice-v5' then
    raise sqlstate 'PT400' using message='INVALID_SAMPLE_ANALYSIS';
  end if;
  select * into intent from public.ieum_profile_sample_upload_intents where id=p_upload_intent_id for update;
  if not found or p_user_id is null or intent.user_id<>p_user_id or p_object_id is null or intent.object_id<>p_object_id or
    intent.sha256 is distinct from p_analysis->>'sourceSha256' or intent.byte_length::text is distinct from p_analysis->>'byteLength' then
    raise sqlstate 'PT409' using message='UPLOAD_OBJECT_MISMATCH';
  end if;
  if intent.audio_receipt is null then raise sqlstate 'PT409' using message='SAMPLE_AUDIO_NOT_VERIFIED'; end if;
  if intent.audio_receipt is distinct from p_analysis->'audioReceipt' then raise sqlstate 'PT409' using message='AUDIO_RECEIPT_CONFLICT'; end if;
  if intent.voice_analysis is not null then
    if intent.voice_analysis is distinct from p_analysis then raise sqlstate 'PT409' using message='SAMPLE_ANALYSIS_CONFLICT'; end if;
  else
    update public.ieum_profile_sample_upload_intents set voice_analysis=p_analysis where id=intent.id;
  end if;
  return jsonb_build_object('uploadIntentId',intent.id,'analysisStatus','verified','analysis',p_analysis);
end;
$$;
revoke all on function public.ieum_confirm_profile_sample_analysis(uuid,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.ieum_confirm_profile_sample_analysis(uuid,uuid,uuid,jsonb) to service_role;
commit;
