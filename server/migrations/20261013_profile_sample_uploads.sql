-- Personal representative Sample uploads are not Project Track submissions.
begin;
create table public.ieum_profile_sample_upload_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  request_key text not null check (request_key !~ '^[[:space:]]*$'),
  object_id uuid not null unique default gen_random_uuid(),
  byte_length bigint not null check (byte_length>0 and byte_length<=9007199254740991),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  content_type text not null check (content_type ~ '^audio/[a-z0-9][a-z0-9!#$&^_.+-]*$'),
  created_at timestamptz not null default now(),
  audio_receipt jsonb check (audio_receipt is null or jsonb_typeof(audio_receipt)='object'),
  verified_at timestamptz,
  check ((audio_receipt is null)=(verified_at is null)),
  unique(user_id,request_key)
);
alter table public.ieum_profile_sample_upload_intents enable row level security;
revoke all on public.ieum_profile_sample_upload_intents from public,anon,authenticated;
grant select,insert on public.ieum_profile_sample_upload_intents to service_role;

create function public.ieum_prepare_profile_sample_upload(p_request_key text,p_size bigint,p_sha256 text,p_content_type text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare caller uuid:=auth.uid(); intent public.ieum_profile_sample_upload_intents;
begin
  if caller is null then raise sqlstate 'PT401' using message='AUTH_REQUIRED'; end if;
  if p_request_key is null or p_request_key ~ '^[[:space:]]*$' or p_size is null or p_size<=0 or p_size>9007199254740991 or
    p_sha256 is null or p_sha256 !~ '^[a-f0-9]{64}$' or p_content_type is null or p_content_type !~ '^audio/[a-z0-9][a-z0-9!#$&^_.+-]*$' then
    raise sqlstate 'PT400' using message='INVALID_UPLOAD_FILE';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(caller::text || ':profile-sample-upload:' || p_request_key,0));
  select * into intent from public.ieum_profile_sample_upload_intents where user_id=caller and request_key=p_request_key;
  if found then
    if intent.byte_length<>p_size or intent.sha256<>p_sha256 or intent.content_type<>p_content_type then
      raise sqlstate 'PT409' using message='IDEMPOTENCY_CONFLICT';
    end if;
  else
    insert into public.ieum_profile_sample_upload_intents(user_id,request_key,byte_length,sha256,content_type)
      values(caller,p_request_key,p_size,p_sha256,p_content_type) returning * into intent;
  end if;
  return jsonb_build_object('uploadIntentId',intent.id,'userId',intent.user_id,'objectId',intent.object_id,
    'purpose','voice-sample','size',intent.byte_length,'sha256',intent.sha256,'contentType',intent.content_type,
    'audioVerified',intent.audio_receipt is not null);
end;
$$;
create function public.ieum_get_owned_profile_sample_upload(p_upload_intent_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare caller uuid:=auth.uid(); intent public.ieum_profile_sample_upload_intents;
begin
  if caller is null then raise sqlstate 'PT401' using message='AUTH_REQUIRED'; end if;
  select * into intent from public.ieum_profile_sample_upload_intents where id=p_upload_intent_id and user_id=caller;
  if not found then raise sqlstate 'PT404' using message='SAMPLE_UPLOAD_NOT_FOUND'; end if;
  return jsonb_build_object('uploadIntentId',intent.id,'userId',intent.user_id,'objectId',intent.object_id,
    'purpose','voice-sample','size',intent.byte_length,'sha256',intent.sha256,'contentType',intent.content_type,
    'audioVerified',intent.audio_receipt is not null,'receipt',intent.audio_receipt);
end;
$$;
revoke all on function public.ieum_prepare_profile_sample_upload(text,bigint,text,text),public.ieum_get_owned_profile_sample_upload(uuid) from public,anon,authenticated;
grant execute on function public.ieum_prepare_profile_sample_upload(text,bigint,text,text),public.ieum_get_owned_profile_sample_upload(uuid) to authenticated;
commit;
