-- After personal_identity_results and profile_source_registration.
-- A received personal result must use the exact registered Sample analysis,
-- not merely claim the same original audio hash with different feature values.
begin;
create function public.ieum_check_personal_identity_sources() returns trigger
language plpgsql security definer set search_path='' as $$
declare source jsonb; inputs jsonb:=new.result_data->'manifest'->'sources';
begin
  select source_data into source from public.ieum_profile_source_metadata
    where user_id=new.user_id and source_revision=new.profile_revision;
  if not found then raise sqlstate 'PT409' using message='IDENTITY_SOURCE_UNAVAILABLE'; end if;
  if jsonb_typeof(inputs) is distinct from 'array' then
    raise sqlstate 'PT409' using message='IDENTITY_SOURCE_MISMATCH';
  end if;
  if jsonb_array_length(inputs)<>2 or not exists(
    select 1 from jsonb_array_elements(inputs) item where item->>'purpose'='voice-range'
      and item->>'recordId'='voice-range:' || (source->'rangeProvenance'->>'revision')
      and item->>'sha256'=source->'rangeProvenance'->>'measurementSha256'
      and item->>'analysisVersion'=source->'rangeProvenance'->>'analysisVersion'
      and item->'data'=source->'rangeData') or not exists(
    select 1 from jsonb_array_elements(inputs) item where item->>'purpose'='voice-sample'
      and item->>'recordId'=source->'sampleAnalysisRef'->>'uploadIntentId'
      and item->>'sha256'=source->'sampleProvenance'->>'audioSha256'
      and item->>'analysisVersion'=source->'sampleFeatures'->>'version'
      and item->'data'=source->'sampleFeatures') then
    raise sqlstate 'PT409' using message='IDENTITY_SOURCE_MISMATCH';
  end if;
  return new;
end;
$$;
create trigger ieum_personal_identity_source_binding before insert on public.ieum_personal_identity_results
  for each row execute function public.ieum_check_personal_identity_sources();
revoke all on function public.ieum_check_personal_identity_sources() from public,anon,authenticated,service_role;
commit;
