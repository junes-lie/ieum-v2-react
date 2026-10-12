begin;
alter table public.ieum_upload_intents add column audio_receipt jsonb
  check (audio_receipt is null or jsonb_typeof(audio_receipt)='object');

-- Only a trusted worker that checked Auth/ownership and decoded the exact
-- Storage object may invoke this. It never inserts a Track or queues a Mix.
create function public.ieum_confirm_original_audio(p_project_id text,p_part_id text,p_user_id uuid,
  p_upload_intent_id uuid,p_object_id uuid,p_receipt jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare project public.ieum_projects; intent public.ieum_upload_intents;
  duration float8; frames bigint; rate integer;
begin
  if p_receipt is null or jsonb_typeof(p_receipt)<>'object' or
     (select count(*) from jsonb_object_keys(p_receipt))<>9 or
     not (p_receipt ?& array['size','sha256','contentType','duration','decodedFrames','sampleRate','analysisVersion','decoderVersion','decoderSha256']) or
     jsonb_typeof(p_receipt->'size')<>'number' or jsonb_typeof(p_receipt->'duration')<>'number' or
     jsonb_typeof(p_receipt->'decodedFrames')<>'number' or jsonb_typeof(p_receipt->'sampleRate')<>'number' or
     jsonb_typeof(p_receipt->'sha256')<>'string' or jsonb_typeof(p_receipt->'contentType')<>'string' or
     jsonb_typeof(p_receipt->'analysisVersion')<>'string' or jsonb_typeof(p_receipt->'decoderVersion')<>'string' or
     jsonb_typeof(p_receipt->'decoderSha256')<>'string' or
     (p_receipt->>'sha256') !~ '^[a-f0-9]{64}$' or (p_receipt->>'decoderSha256') !~ '^[a-f0-9]{64}$' or
     (p_receipt->>'analysisVersion')<>'decoded-pcm-v1' or (p_receipt->>'decoderVersion') !~ '^ffmpeg version [^[:cntrl:]]+$' or
     (p_receipt->>'size') !~ '^[1-9][0-9]*$' or (p_receipt->>'decodedFrames') !~ '^[1-9][0-9]*$' or
     (p_receipt->>'sampleRate')<>'48000' then
    raise sqlstate 'PT400' using message='INVALID_AUDIO_RECEIPT';
  end if;
  begin
    duration:=(p_receipt->>'duration')::float8;
    frames:=(p_receipt->>'decodedFrames')::bigint;
    rate:=(p_receipt->>'sampleRate')::integer;
  exception when others then raise sqlstate 'PT400' using message='INVALID_AUDIO_RECEIPT'; end;
  if not (duration>0 and duration<'Infinity'::float8) or duration<>frames::float8/rate then
    raise sqlstate 'PT400' using message='INVALID_AUDIO_RECEIPT';
  end if;
  select * into project from public.ieum_projects where id=p_project_id for update;
  if not found then raise sqlstate 'PT404' using message='PROJECT_NOT_FOUND'; end if;
  select * into intent from public.ieum_upload_intents where id=p_upload_intent_id for update;
  if not found or intent.project_id<>p_project_id or intent.part_id<>p_part_id or
     p_user_id is null or intent.user_id<>p_user_id or p_object_id is null or intent.object_id<>p_object_id or
     intent.byte_length::text<>p_receipt->>'size' or intent.sha256<>p_receipt->>'sha256' or
     intent.content_type<>p_receipt->>'contentType' then
    raise sqlstate 'PT409' using message='UPLOAD_OBJECT_MISMATCH';
  end if;
  if not exists(select 1 from public.ieum_project_parts where project_id=p_project_id and part_id=p_part_id and assigned_user_id=p_user_id) then
    raise sqlstate 'PT403' using message='PART_NOT_ASSIGNED';
  end if;
  if intent.verified_at is not null then
    if intent.audio_receipt is distinct from p_receipt or intent.verified_duration<>duration then
      raise sqlstate 'PT409' using message='AUDIO_RECEIPT_CONFLICT';
    end if;
  else
    if project.lifecycle<>'recruiting' or project.key_locked_at is null or exists
      (select 1 from public.ieum_submitted_tracks where project_id=p_project_id and part_id=p_part_id) then
      raise sqlstate 'PT409' using message='PROJECT_NOT_RECORDING';
    end if;
    update public.ieum_upload_intents set verified_at=now(),verified_duration=duration,audio_receipt=p_receipt where id=intent.id;
  end if;
  return jsonb_build_object('uploadIntentId',intent.id,'verificationStatus','verified','receipt',p_receipt);
end;
$$;
revoke all on function public.ieum_confirm_original_audio(text,text,uuid,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.ieum_confirm_original_audio(text,text,uuid,uuid,uuid,jsonb) to service_role;
commit;
