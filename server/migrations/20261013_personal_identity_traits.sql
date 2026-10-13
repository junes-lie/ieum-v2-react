-- After personal_identity_results. Private exact-result traits only.
begin;
create function public.ieum_get_owned_personal_identity_traits(p_id text,p_revision text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare reference jsonb; traits jsonb; caller uuid:=auth.uid();
begin
  reference:=public.ieum_get_owned_personal_identity_result(p_id,p_revision);
  select result_data->'traits' into traits from public.ieum_personal_identity_results
    where user_id=caller and result_id=p_id and result_revision=p_revision;
  return reference || jsonb_build_object('traits',traits);
end;
$$;
revoke all on function public.ieum_get_owned_personal_identity_traits(text,text) from public,anon,service_role;
grant execute on function public.ieum_get_owned_personal_identity_traits(text,text) to authenticated;
commit;
