-- Apply after project_participation. Public read only; no demo or personal data.
begin;
create function public.ieum_list_discovery_projects(p_song_id text default null,p_after_id text default null,p_limit integer default 20) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rows jsonb; items jsonb; more boolean;
begin
  if p_limit is null or p_limit<1 or p_limit>50 or (p_after_id is not null and p_after_id ~ '^[[:space:]]*$') or
    (p_song_id is not null and p_song_id ~ '^[[:space:]]*$') then raise sqlstate 'PT400' using message='INVALID_CATALOG_REQUEST'; end if;
  select coalesce(jsonb_agg(item order by id collate "C"),'[]'::jsonb) into rows from (
    select p.id,jsonb_build_object('id',p.id,'seed',p.seed,'songId',p.song_id,'key',p.project_key,'arrangementId',p.arrangement_id,
      'partCount',p.part_count,'revision',p.revision,'lifecycle',p.lifecycle,'keyLockedAt',p.key_locked_at,'createdAt',p.created_at,
      'submittedTrackCount',(select count(*) from public.ieum_submitted_tracks where project_id=p.id),
      'parts',(select jsonb_agg(jsonb_build_object('id',part.part_id,
        'requiredRange',jsonb_build_object('lowMidi',part.required_range->'lowMidi','highMidi',part.required_range->'highMidi') ||
          case when part.required_range ? 'tessitura' then jsonb_build_object('tessitura',
            jsonb_build_object('lowMidi',part.required_range->'tessitura'->'lowMidi','highMidi',part.required_range->'tessitura'->'highMidi')) else '{}'::jsonb end,
        'status',case when t.id is not null then 'submitted' when part.assigned_user_id is not null then 'ready' else 'open' end)
        order by part.part_id) from public.ieum_project_parts part left join public.ieum_submitted_tracks t
          on t.project_id=part.project_id and t.part_id=part.part_id where part.project_id=p.id)) as item
    from public.ieum_projects p join public.ieum_catalog_arrangements a on a.id=p.arrangement_id
      and a.song_id=p.song_id and a.project_key=p.project_key and a.audio_source_ref=p.audio_source_ref
    where (p_song_id is null or p.song_id=p_song_id) and (p_after_id is null or p.id collate "C">p_after_id collate "C")
      and (p.lifecycle<>'completed' or exists(select 1 from public.ieum_mix_jobs where project_id=p.id and status='succeeded'))
    order by p.id collate "C" limit p_limit+1
  ) page;
  more:=jsonb_array_length(rows)>p_limit;
  select coalesce(jsonb_agg(value order by ord),'[]'::jsonb) into items from jsonb_array_elements(rows) with ordinality as entry(value,ord) where ord<=p_limit;
  return jsonb_build_object('items',items,'nextCursor',case when more then items->(p_limit-1)->>'id' else null end);
end;
$$;
revoke all on function public.ieum_list_discovery_projects(text,text,integer) from public,anon,authenticated;
grant execute on function public.ieum_list_discovery_projects(text,text,integer) to anon,authenticated;
commit;
