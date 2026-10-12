import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'
if (!process.env.IEUM_PGLITE_ROOT) throw new Error('IEUM_PGLITE_ROOT must identify the isolated QA runtime; no remote migrations are applied')
const require=createRequire(join(process.env.IEUM_PGLITE_ROOT,'package.json'))
const { PGlite }=require('@electric-sql/pglite')
const db=new PGlite()
const userA='11111111-1111-4111-8111-111111111111'
const userB='22222222-2222-4222-8222-222222222222'
const current=async user=>(await db.query(`select to_jsonb(source) || jsonb_build_object('verified_at',
  to_char(verified_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) as data
  from public.ieum_profile_voice_sources source where user_id=$1`,[user])).rows[0]?.data
const history=async user=>(await db.query('select source_revision,source_data from public.ieum_profile_voice_source_history where user_id=$1 order by source_revision',[user])).rows
try {
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`)
  for(const user of [userA,userB])await db.query('insert into auth.users values($1)',[user])
  for(const file of ['20261013_voice_profiles.sql','20261013_project_tracks.sql','20261013_project_participation.sql'])
    await db.exec(await readFile(new URL(`../server/migrations/${file}`,import.meta.url),'utf8'))
  // Trusted fixtures only; these values do not claim physical measurement.
  await db.query(`insert into public.ieum_profile_voice_sources values
    ($1,'revision-1',$2,$3,'normalized-difference-v1',$4,$5,20,'2026-10-13T00:00:00Z')`,
    [userA,JSON.stringify({lowMidi:48,highMidi:67}),'a'.repeat(64),'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','b'.repeat(64)])
  const original=await current(userA)
  await db.exec(await readFile(new URL('../server/migrations/20261013_profile_source_history.sql',import.meta.url),'utf8'))
  assert.deepEqual(await history(userA),[{source_revision:'revision-1',source_data:original}])
  assert.deepEqual(await history(userB),[])
  await db.exec('set role service_role')
  await db.query(`update public.ieum_profile_voice_sources set source_revision='revision-2',
    range_data=$1,range_measurement_sha256=$2,sample_object_id=$3,sample_audio_sha256=$4,
    sample_duration=18,verified_at='2026-10-13T01:00:00Z' where user_id=$5`,
    [JSON.stringify({lowMidi:50,highMidi:65}),'c'.repeat(64),'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','d'.repeat(64),userA])
  const second=await current(userA)
  assert.deepEqual((await history(userA)).map(row=>row.source_data),[original,second])
  await db.query('update public.ieum_profile_voice_sources set range_data=range_data where user_id=$1',[userA])
  assert.equal((await history(userA)).length,2)
  await db.exec("set time zone 'UTC'")
  await db.query('update public.ieum_profile_voice_sources set range_data=range_data where user_id=$1',[userA])
  assert.deepEqual(await current(userA),second)
  for(const assignment of [`range_data='{"lowMidi":40,"highMidi":75}'`, "sample_duration=19", "range_analysis_version='changed'", "verified_at=now()", `user_id='${userB}'`]) {
    await assert.rejects(db.query(`update public.ieum_profile_voice_sources set ${assignment} where user_id=$1`,[userA]),error=>error.code==='PT409')
    assert.deepEqual(await current(userA),second)
    assert.equal((await history(userA)).length,2)
  }
  // Ingestion cannot rewrite a prior revision through a later update either.
  await assert.rejects(db.query("update public.ieum_profile_voice_sources set source_revision='revision-1' where user_id=$1",[userA]),error=>error.code==='PT409')
  await assert.rejects(db.query("update public.ieum_profile_voice_sources set source_revision='invalid-revision',sample_duration=-1 where user_id=$1",[userA]),error=>error.code==='23514')
  assert.equal((await history(userA)).length,2)
  await db.query(`insert into public.ieum_profile_voice_sources values
    ($1,'revision-1',$2,$3,'normalized-difference-v1',$4,$5,12,'2026-10-13T02:00:00Z')`,
    [userB,JSON.stringify({lowMidi:55,highMidi:70}),'e'.repeat(64),'cccccccc-cccc-4ccc-8ccc-cccccccccccc','f'.repeat(64)])
  assert.deepEqual((await history(userB)).map(row=>row.source_data),[await current(userB)])
  assert.deepEqual((await history(userA)).map(row=>row.source_data),[original,second])
  for(const sql of ['insert into public.ieum_profile_voice_source_history select * from public.ieum_profile_voice_source_history','update public.ieum_profile_voice_source_history set source_data=source_data','delete from public.ieum_profile_voice_source_history','truncate public.ieum_profile_voice_source_history'])
    await assert.rejects(db.exec(sql),error=>error.code==='42501')
  await db.exec('reset role')
  // Even an accidental owner write cannot alter already captured provenance.
  for(const sql of ['update public.ieum_profile_voice_source_history set source_data=source_data','delete from public.ieum_profile_voice_source_history'])
    await assert.rejects(db.exec(sql),error=>error.code==='PT409')
  for(const user of [userA,userB]) {
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user])
    await db.exec('set role authenticated')
    await assert.rejects(db.exec('select * from public.ieum_profile_voice_source_history'),error=>error.code==='42501')
    await assert.rejects(db.exec('select public.ieum_preserve_profile_source_revision()'),error=>error.code==='42501')
    await db.query("select public.ieum_patch_profile_preferences($1,0)",[JSON.stringify({roles:[],genres:[],preferredSongIds:[]})])
    await db.exec('reset role')
  }
  assert.deepEqual(await current(userA),second)
  assert.deepEqual((await history(userA)).map(row=>row.source_data),[original,second])
  // Part Fit uses the current source; an old wider range is not silently reused.
  await assert.rejects(db.query('select public.ieum_require_part_fit($1,$2)',[userA,JSON.stringify({lowMidi:48,highMidi:67})]),error=>error.code==='PT403')
  await db.query('select public.ieum_require_part_fit($1,$2)',[userA,JSON.stringify({lowMidi:50,highMidi:65})])
  for(const table of ['ieum_projects','ieum_submitted_tracks','ieum_mix_jobs'])
    assert.equal((await db.query(`select count(*)::int as count from public.${table}`)).rows[0].count,0)
  await db.exec('set role anon')
  await assert.rejects(db.exec('select * from public.ieum_profile_voice_source_history'),error=>error.code==='42501')
  console.log('PASS PostgreSQL source history: exact backfill, immutable revisions, changed-revision retention, same-revision conflict rollback, owner isolation, preferences independent, current Part Fit, no Project/Track/Mix. Isolated fixtures, not real profile ingestion or Supabase evidence.')
} finally { await db.close() }
