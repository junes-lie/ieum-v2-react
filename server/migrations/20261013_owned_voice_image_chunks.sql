begin;
-- Exact owned revision only. Bounded chunks keep the existing function small;
-- neither public URLs nor automatic latest-result selection are introduced.
create function public.ieum_get_owned_personal_identity_image_chunk(p_id text,p_revision text,p_offset integer,p_length integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare metadata jsonb; image bytea; receipt jsonb;
begin
  metadata:=public.ieum_get_owned_personal_identity_result(p_id,p_revision);
  select png,result_data->'imageReceipt' into image,receipt from public.ieum_personal_identity_results
    where user_id=auth.uid() and result_id=p_id and result_revision=p_revision;
  if p_offset is null or p_offset<0 or p_offset>=octet_length(image) or p_length is null or p_length<1 or p_length>262144 then
    raise sqlstate 'PT400' using message='INVALID_IMAGE_RANGE'; end if;
  return jsonb_build_object('metadata',metadata,'receipt',receipt,'size',octet_length(image),'offset',p_offset,
    'png',encode(substring(image from p_offset+1 for p_length),'base64'));
end;
$$;
create function public.ieum_get_owned_track_voice_image_chunk(p_project_id text,p_part_id text,p_id text,p_revision text,p_offset integer,p_length integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare metadata jsonb; image bytea; receipt jsonb;
begin
  metadata:=public.ieum_get_owned_track_voice_layer(p_project_id,p_part_id,p_id,p_revision);
  select layer.png,layer.result_data->'imageReceipt' into image,receipt from public.ieum_track_voice_layers layer
    join public.ieum_submitted_tracks track on track.id=layer.track_id
    where track.project_id=p_project_id and track.part_id=p_part_id and layer.user_id=auth.uid()
      and layer.layer_id=p_id and layer.layer_revision=p_revision;
  if p_offset is null or p_offset<0 or p_offset>=octet_length(image) or p_length is null or p_length<1 or p_length>262144 then
    raise sqlstate 'PT400' using message='INVALID_IMAGE_RANGE'; end if;
  return jsonb_build_object('metadata',metadata,'receipt',receipt,'size',octet_length(image),'offset',p_offset,
    'png',encode(substring(image from p_offset+1 for p_length),'base64'));
end;
$$;
revoke all on function public.ieum_get_owned_personal_identity_image_chunk(text,text,integer,integer),
  public.ieum_get_owned_track_voice_image_chunk(text,text,text,text,integer,integer) from public,anon,service_role;
grant execute on function public.ieum_get_owned_personal_identity_image_chunk(text,text,integer,integer),
  public.ieum_get_owned_track_voice_image_chunk(text,text,text,text,integer,integer) to authenticated;
commit;
