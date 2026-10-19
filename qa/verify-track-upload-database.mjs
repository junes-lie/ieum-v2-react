import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'
if (!process.env.IEUM_PGLITE_ROOT) throw new Error('IEUM_PGLITE_ROOT must identify the isolated QA runtime; no remote migrations are applied')
const require=createRequire(join(process.env.IEUM_PGLITE_ROOT,'package.json'))
const { PGlite }=require('@electric-sql/pglite')
const db=new PGlite()
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222'
const asUser=async id=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id || '']);await db.exec('set role authenticated')}
const prepare=async(project='p',part='lead',key='upload-1',size=4000,sha='a'.repeat(64),mime='audio/webm')=>
  (await db.query('select public.ieum_prepare_track_upload($1,$2,$3,$4,$5,$6) as result',[project,part,key,size,sha,mime])).rows[0].result
try {
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;
    create table auth.users(id uuid primary key);insert into auth.users values('${a}'),('${b}');
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`)
  for(const file of ['20261013_project_tracks.sql','20261013_track_uploads.sql'])
    await db.exec(await readFile(new URL(`../server/migrations/${file}`,import.meta.url),'utf8'))
  await db.exec(`insert into public.ieum_projects(id,seed,song_id,project_key,audio_source_ref,part_count) values('p','seed','qa-song','original','{}',2);
    insert into public.ieum_project_parts values('p','lead','${a}','{}'),('p','harmony','${b}','{}');`)
  await asUser(a)
  await assert.rejects(prepare(),error=>error.code==='PT409')
  await db.query("select public.ieum_start_project_recording('p','lead')")
  const first=await prepare()
  assert.equal(first.submissionVerified,false);assert.equal(first.size,4000);assert.equal(first.contentType,'audio/webm')
  assert.match(first.objectId,/^[a-f0-9-]{36}$/);assert.ok(!first.objectId.includes(a))
  assert.deepEqual(await prepare(),first)
  for(const values of [['p','harmony','upload-1'],['p','lead','upload-1',4001],['p','lead','upload-1',4000,'b'.repeat(64)],['p','lead','upload-1',4000,'a'.repeat(64),'audio/mp4']])
    await assert.rejects(prepare(...values),error=>['PT403','PT409'].includes(error.code))
  for(const values of [['p','lead','',4000],['p','lead','bad-0',0],['p','lead','bad-mime',4000,'a'.repeat(64),'text/plain'],['p','lead','bad-hash',4000,'bad']])
    await assert.rejects(prepare(...values),error=>error.code==='PT400')
  await assert.rejects(db.exec('update public.ieum_upload_intents set verified_at=now(),verified_duration=20'),error=>error.code==='42501')
  await assert.rejects(db.query("select public.ieum_submit_verified_track('p','lead',$1,'submit-1',20,0)",[first.uploadIntentId]),error=>error.code==='PT409')
  await db.exec('reset role')
  assert.equal((await db.query('select count(*)::int as n from public.ieum_upload_intents')).rows[0].n,1)
  assert.equal((await db.query('select count(*)::int as n from public.ieum_submitted_tracks')).rows[0].n,0)
  assert.equal((await db.query('select count(*)::int as n from public.ieum_mix_jobs')).rows[0].n,0)
  await db.query('update public.ieum_upload_intents set verified_at=now(),verified_duration=20 where id=$1',[first.uploadIntentId])
  await asUser(a)
  assert.equal((await prepare()).submissionVerified,true)
  await db.query("select public.ieum_submit_verified_track('p','lead',$1,'submit-1',20,0)",[first.uploadIntentId])
  assert.equal((await prepare()).uploadIntentId,first.uploadIntentId)
  await assert.rejects(prepare('p','lead','new-after-submit'),error=>error.code==='PT409')
  await asUser(b)
  await assert.rejects(prepare(),error=>error.code==='PT403')
  const other=await prepare('p','harmony','upload-1')
  assert.notEqual(other.objectId,first.objectId)
  await asUser(null)
  await assert.rejects(prepare(),error=>error.code==='PT401')
  await db.exec('reset role;set role anon')
  await assert.rejects(prepare(),error=>error.code==='42501')
  console.log('PASS PostgreSQL upload allocation: assigned owner/recording lock, stable opaque IDs per user/key, changed-file conflict, no Track/Mix increase, no client verification writes, original intent retry after submission, anonymous denial. Isolated fixtures, not live Storage/audio duration validation.')
} finally {await db.close()}
