-- Apply after profile_sample_uploads. Decode proof for a personal Sample only;
-- this does not register its Profile.
begin;
create function public.ieum_confirm_profile_sample_audio(p_user_id uuid,p_upload_intent_id uuid,p_object_id uuid,p_receipt jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare intent public.ieum_profile_sample_upload_intents; duration float8; frames bigint;
begin
  if p_receipt is null or jsonb_typeof(p_receipt)<>'object' or
    (select count(*) from jsonb_object_keys(p_receipt))<>9 or
    not(p_receipt ?& array['size','sha256','contentType','duration','decodedFrames','sampleRate','analysisVersion','decoderVersion','decoderSha256']) or
    jsonb_typeof(p_receipt->'size') is distinct from 'number' or jsonb_typeof(p_receipt->'duration') is distinct from 'number' or
    jsonb_typeof(p_receipt->'decodedFrames') is distinct from 'number' or jsonb_typeof(p_receipt->'sampleRate') is distinct from 'number' or
    jsonb_typeof(p_receipt->'sha256') is distinct from 'string' or jsonb_typeof(p_receipt->'contentType') is distinct from 'string' or
    jsonb_typeof(p_receipt->'analysisVersion') is distinct from 'string' or jsonb_typeof(p_receipt->'decoderVersion') is distinct from 'string' or
    jsonb_typeof(p_receipt->'decoderSha256') is distinct from 'string' or
    (p_receipt->>'sha256') !~ '^[a-f0-9]{64}$' or (p_receipt->>'decoderSha256') !~ '^[a-f0-9]{64}$' or
    (p_receipt->>'analysisVersion')<>'decoded-pcm-v1' or (p_receipt->>'decoderVersion') !~ '^ffmpeg version [^[:cntrl:]]+$' or
    (p_receipt->>'size') !~ '^[1-9][0-9]*$' or (p_receipt->>'decodedFrames') !~ '^[1-9][0-9]*$' or (p_receipt->>'sampleRate')<>'48000' then
    raise sqlstate 'PT400' using message='INVALID_AUDIO_RECEIPT';
  end if;
  begin duration:=(p_receipt->>'duration')::float8; frames:=(p_receipt->>'decodedFrames')::bigint;
  exception when others then raise sqlstate 'PT400' using message='INVALID_AUDIO_RECEIPT'; end;
  if not(duration>0 and duration<'Infinity'::float8) or duration<>frames::float8/48000 then
    raise sqlstate 'PT400' using message='INVALID_AUDIO_RECEIPT';
  end if;
  select * into intent from public.ieum_profile_sample_upload_intents where id=p_upload_intent_id for update;
  if not found or p_user_id is null or intent.user_id<>p_user_id or p_object_id is null or intent.object_id<>p_object_id or
    intent.byte_length::text<>p_receipt->>'size' or intent.sha256<>p_receipt->>'sha256' or intent.content_type<>p_receipt->>'contentType' then
    raise sqlstate 'PT409' using message='UPLOAD_OBJECT_MISMATCH';
  end if;
  if intent.audio_receipt is not null then
    if intent.audio_receipt is distinct from p_receipt then raise sqlstate 'PT409' using message='AUDIO_RECEIPT_CONFLICT'; end if;
  else
    update public.ieum_profile_sample_upload_intents set audio_receipt=p_receipt,verified_at=now() where id=intent.id;
  end if;
  return jsonb_build_object('uploadIntentId',intent.id,'purpose','voice-sample','verificationStatus','verified','receipt',p_receipt);
end;
$$;
revoke all on function public.ieum_confirm_profile_sample_audio(uuid,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.ieum_confirm_profile_sample_audio(uuid,uuid,uuid,jsonb) to service_role;
commit;
