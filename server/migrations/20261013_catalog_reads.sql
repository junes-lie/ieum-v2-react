-- Apply after project_participation. No songs/audio are seeded here.
begin;
create function public.ieum_list_catalog_arrangements(p_after_id text default null,p_limit integer default 20) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rows jsonb; items jsonb; more boolean;
begin
  if p_limit is null or p_limit<1 or p_limit>50 or (p_after_id is not null and p_after_id ~ '^[[:space:]]*$') then
    raise sqlstate 'PT400' using message='INVALID_CATALOG_REQUEST';
  end if;
  select coalesce(jsonb_agg(item order by id collate "C"),'[]'::jsonb) into rows from (
    select id,jsonb_build_object('id',id,'songId',song_id,'key',project_key,
      'audioSourceRef',jsonb_build_object('songId',song_id,'key',project_key,'revision',audio_source_ref->'revision',
        'duration',audio_source_ref->'duration','sourceSha256',audio_source_ref->'sourceSha256','backingSha256',audio_source_ref->'backingSha256'),
      'parts',(select jsonb_agg(jsonb_build_object('id',value->'id','requiredRange',
        jsonb_build_object('lowMidi',value->'requiredRange'->'lowMidi','highMidi',value->'requiredRange'->'highMidi') ||
        case when value->'requiredRange' ? 'tessitura' then jsonb_build_object('tessitura',
          jsonb_build_object('lowMidi',value->'requiredRange'->'tessitura'->'lowMidi','highMidi',value->'requiredRange'->'tessitura'->'highMidi'))
          else '{}'::jsonb end) order by ord) from jsonb_array_elements(parts) with ordinality as part(value,ord))) as item
    from public.ieum_catalog_arrangements
    where p_after_id is null or id collate "C">p_after_id collate "C"
    order by id collate "C" limit p_limit+1
  ) page;
  more:=jsonb_array_length(rows)>p_limit;
  select coalesce(jsonb_agg(value order by ord),'[]'::jsonb) into items
    from jsonb_array_elements(rows) with ordinality as entry(value,ord) where ord<=p_limit;
  return jsonb_build_object('items',items,'nextCursor',case when more then items->(p_limit-1)->>'id' else null end);
end;
$$;
revoke all on function public.ieum_list_catalog_arrangements(text,integer) from public,anon,authenticated;
grant execute on function public.ieum_list_catalog_arrangements(text,integer) to anon,authenticated;
commit;
