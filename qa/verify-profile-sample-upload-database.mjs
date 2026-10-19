import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {join} from 'node:path'
if(!process.env.IEUM_PGLITE_ROOT)throw new Error('IEUM_PGLITE_ROOT is required; no remote migration is applied')
const require=createRequire(join(process.env.IEUM_PGLITE_ROOT,'package.json'))
const {PGlite}=require('@electric-sql/pglite')
const db=new PGlite()
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222'
const asUser=async id=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id || '']);await db.exec('set role authenticated')}
const prepare=async(key='shared-key',size=4000,sha='a'.repeat(64),mime='audio/webm')=>
  (await db.query('select public.ieum_prepare_profile_sample_upload($1,$2,$3,$4) as result',[key,size,sha,mime])).rows[0].result
const lookup=async id=>(await db.query('select public.ieum_get_owned_profile_sample_upload($1) as result',[id])).rows[0].result
try{
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;
    create table auth.users(id uuid primary key);insert into auth.users values('${a}'),('${b}');
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`)
  for(const file of ['20261013_voice_profiles.sql','20261013_project_tracks.sql','20261013_project_participation.sql','20261013_profile_source_history.sql','20261013_track_uploads.sql','20261013_profile_sample_uploads.sql'])
    await db.exec(await readFile(new URL(`../server/migrations/${file}`,import.meta.url),'utf8'))
  const profile={roles:['화음·코러스'],rangeData:{lowMidi:48,highMidi:67},identity:{status:'blocked'}}
  await db.query('insert into public.ieum_profiles(user_id,profile_data) values($1,$2)',[a,JSON.stringify(profile)])
  // The existing current source stays unchanged during Sample upload preparation.
  await db.query(`insert into public.ieum_profile_voice_sources values($1,'existing-revision',$2,$3,
    'normalized-difference-v1',gen_random_uuid(),$4,20,now())`,[a,JSON.stringify(profile.rangeData),'b'.repeat(64),'c'.repeat(64)])
  const existing=(await db.query('select to_jsonb(s) as data from public.ieum_profile_voice_sources s')).rows[0].data
  await asUser(a)
  const first=await prepare()
  assert.equal(first.purpose,'voice-sample');assert.equal(first.userId,a)
  assert.match(first.objectId,/^[a-f0-9-]{36}$/)
  assert.notEqual(first.objectId,a)
  assert.equal(first.audioVerified,false)
  assert.deepEqual(await prepare(),first);assert.deepEqual(await lookup(first.uploadIntentId),{...first,receipt:null})
  for(const args of [['shared-key',4001],['shared-key',4000,'b'.repeat(64)],['shared-key',4000,'a'.repeat(64),'audio/mp4']])
    await assert.rejects(prepare(...args),error=>error.code==='PT409')
  for(const args of [['',4000],['invalid',0],['invalid',4000,'bad'],['invalid',4000,'a'.repeat(64),'image/png']])
    await assert.rejects(prepare(...args),error=>error.code==='PT400')
  await assert.rejects(db.exec('select * from public.ieum_profile_sample_upload_intents'),error=>error.code==='42501')
  await assert.rejects(db.exec("update public.ieum_profile_sample_upload_intents set sha256='wrong'"),error=>error.code==='42501')
  await asUser(b)
  await assert.rejects(lookup(first.uploadIntentId),error=>error.code==='PT404')
  const second=await prepare()
  assert.notEqual(second.objectId,first.objectId);assert.equal(second.userId,b)
  // No prior Profile/Part is needed for a first personal Sample upload.
  assert.equal((await db.query('select public.ieum_get_profile() as result')).rows[0].result.profile,null)
  await asUser(null)
  await assert.rejects(prepare(),error=>error.code==='PT401')
  await assert.rejects(lookup(first.uploadIntentId),error=>error.code==='PT401')
  await db.exec('reset role')
  assert.deepEqual((await db.query('select to_jsonb(s) as data from public.ieum_profile_voice_sources s')).rows[0].data,existing)
  assert.deepEqual((await db.query('select profile_data from public.ieum_profiles where user_id=$1',[a])).rows[0].profile_data,profile)
  assert.equal((await db.query('select count(*)::int as n from public.ieum_profile_voice_source_history')).rows[0].n,1)
  for(const table of ['ieum_projects','ieum_submitted_tracks','ieum_mix_jobs','ieum_upload_intents'])
    assert.equal((await db.query(`select count(*)::int as n from public.${table}`)).rows[0].n,0)
  // Same key in the two purpose namespaces cannot turn a Sample into a Track.
  await db.exec(`insert into public.ieum_projects(id,seed,song_id,project_key,audio_source_ref,part_count) values('p','seed','qa-song','original','{}',2);
    insert into public.ieum_project_parts values('p','lead','${a}','{}'),('p','harmony','${b}','{}');`)
  await asUser(a)
  await db.exec("select public.ieum_start_project_recording('p','lead')")
  const track=(await db.query("select public.ieum_prepare_track_upload('p','lead','shared-key',4000,$1,'audio/webm') as result",['a'.repeat(64)])).rows[0].result
  assert.notEqual(track.uploadIntentId,first.uploadIntentId);assert.notEqual(track.objectId,first.objectId)
  await assert.rejects(db.query("select public.ieum_submit_verified_track('p','lead',$1,'submit-sample',20,0)",[first.uploadIntentId]),error=>error.code==='PT409')
  await db.exec('reset role;set role anon')
  await assert.rejects(prepare(),error=>error.code==='42501')
  await assert.rejects(lookup(first.uploadIntentId),error=>error.code==='42501')
  console.log('PASS PostgreSQL personal Sample uploads: stable per-user IDs/keys, changed-file conflict, own lookup, first Setup without Profile/Part, no source/preferences/Identity mutation, 0 Track/Mix, separate Track namespace, anon/direct-write denial. Fixtures, not live Supabase or physical recording.')
}finally{await db.close()}
