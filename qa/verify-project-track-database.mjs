import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'

if (!process.env.IEUM_PGLITE_ROOT) throw new Error('IEUM_PGLITE_ROOT must identify the isolated PostgreSQL QA runtime; no remote migration is applied')
const require = createRequire(join(process.env.IEUM_PGLITE_ROOT,'package.json'))
const { PGlite } = require('@electric-sql/pglite')
const db = new PGlite()
const users = [1,2,3,4].map(n => `${String(n).repeat(8)}-${String(n).repeat(4)}-4${String(n).repeat(3)}-8${String(n).repeat(3)}-${String(n).repeat(12)}`)
const asUser = async id => { await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id || '']); await db.exec('set role authenticated') }
const get = async project => (await db.query('select public.ieum_get_project($1) as result',[project])).rows[0].result
const start = (project,part) => db.query('select public.ieum_start_project_recording($1,$2)',[project,part])
const submit = (project,part,intent,key,duration=20,offset=0) => db.query(
  'select public.ieum_submit_verified_track($1,$2,$3::uuid,$4,$5::float8,$6::float8) as result',[project,part,intent,key,duration,offset])
try {
  await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`)
  for (const user of users) await db.query('insert into auth.users values ($1)',[user])
  await db.exec(await readFile(new URL('../server/migrations/20261013_project_tracks.sql',import.meta.url),'utf8'))
  await db.exec(await readFile(new URL('../server/migrations/20261013_project_mix_reads.sql',import.meta.url),'utf8'))
  const mix=async project=>(await db.query('select public.ieum_get_project_mix($1) as result',[project])).rows[0].result
  const source = { songId:'qa-fixture-song',key:'original',revision:'qa-source-v1',duration:20,sourceSha256:'a'.repeat(64),backingSha256:'b'.repeat(64) }
  // Trusted fixture ingestion, never the real song catalog or real users.
  for (const count of [2,3,4]) {
    await db.exec('reset role')
    const project = `qa-${count}`, intents = [], responses = []
    await db.query('insert into public.ieum_projects(id,seed,song_id,project_key,audio_source_ref,part_count) values ($1,$2,$3,$4,$5,$6)',
      [project,`seed-${count}`,'qa-fixture-song','original',JSON.stringify(source),count])
    for (let index=0;index<count;index++) {
      const part = `vocal-${index}`
      await db.query('insert into public.ieum_project_parts(project_id,part_id,assigned_user_id,required_range) values ($1,$2,$3,$4)',
        [project,part,users[index],JSON.stringify({ lowMidi:48,highMidi:67 })])
      const intent = (await db.query(`insert into public.ieum_upload_intents(project_id,part_id,user_id,object_id,byte_length,sha256,content_type)
        values ($1,$2,$3,gen_random_uuid(),4000,$4,'audio/wav') returning id`,[project,part,users[index],'c'.repeat(64)])).rows[0].id
      intents.push(intent)
    }
    await asUser(users[0])
    assert.equal((await get(project)).submittedTrackCount,0)
    assert.equal((await mix(project)).mix,null)
    assert.equal((await get(project)).parts.length,count)
    await assert.rejects(submit(project,'vocal-0',intents[0],`${project}-0`),error => error.code==='PT409' && error.message.includes('PROJECT_NOT_RECORDING'))
    await assert.rejects(start(project,'vocal-1'),error => error.code==='PT403')
    await start(project,'vocal-0')
    const locked = await get(project)
    assert.ok(locked.keyLockedAt)
    await start(project,'vocal-0')
    assert.equal((await get(project)).revision,locked.revision)
    await assert.rejects(submit(project,'vocal-0',intents[0],`${project}-0`),error => error.code==='PT409' && error.message.includes('UPLOAD_NOT_VERIFIED'))
    assert.equal((await get(project)).submittedTrackCount,0)
    await assert.rejects(db.query('update public.ieum_upload_intents set verified_at=now() where id=$1',[intents[0]]),error => error.code==='42501')
    for (const [duration,offset] of [[0,0],[20,20000],[20,-1],[NaN,0],[Infinity,0]])
      await assert.rejects(submit(project,'vocal-0',intents[0],`${project}-0`,duration,offset),error => error.code==='PT400')
    await db.exec('reset role')
    for (const update of ["project_key='changed'","seed='changed'","key_locked_at=null","part_count=2","audio_source_ref='{}'"]) {
      if (count===2 && update==='part_count=2') continue
      await assert.rejects(db.exec(`update public.ieum_projects set ${update} where id='${project}'`),error => error.code==='PT409')
    }
    await assert.rejects(db.query('delete from public.ieum_project_parts where project_id=$1',[project]),error => error.code==='PT409')
    await assert.rejects(db.query("update public.ieum_project_parts set required_range='{}' where project_id=$1",[project]),error => error.code==='PT409')
    for (let index=0;index<count;index++) {
      await db.exec('reset role')
      await db.query('update public.ieum_upload_intents set verified_at=now(),verified_duration=20 where id=$1',[intents[index]])
      await asUser(users[index])
      const part=`vocal-${index}`, key=`${project}-${index}`
      if (index===0) {
        await assert.rejects(submit(project,part,intents[1],key),error => error.code==='PT409')
      }
      const first = (await submit(project,part,intents[index],key)).rows[0].result
      responses.push(first)
      assert.equal(first.submissionStatus,'success')
      assert.equal(first.project.submittedTrackCount,index+1)
      assert.equal(first.project.lifecycle,index+1===count?'mixing':'recruiting')
      const repeat = (await submit(project,part,intents[index],key)).rows[0].result
      assert.deepEqual(repeat,first)
      await assert.rejects(submit(project,part,intents[index],`${key}-different`),error => error.code==='PT409')
      await assert.rejects(submit(project,part,intents[index],key,21),error => error.code==='PT409')
      await db.exec('reset role')
      const jobs = (await db.query('select * from public.ieum_mix_jobs where project_id=$1',[project])).rows
      assert.equal(jobs.length,index+1===count?1:0)
      await assert.rejects(db.query('update public.ieum_project_parts set assigned_user_id=$1 where project_id=$2 and part_id=$3',[users[(index+1)%4],project,part]),error => error.code==='PT409')
    }
    const job = (await db.query('select * from public.ieum_mix_jobs where project_id=$1',[project])).rows[0]
    assert.equal(job.status,'queued'); assert.equal(job.track_ids.length,count)
    assert.equal((await db.query('select lifecycle from public.ieum_projects where id=$1',[project])).rows[0].lifecycle,'mixing')
    await asUser(users[0])
    assert.equal((await mix(project)).mix.status,'queued')
    assert.equal((await mix(project)).mix.result,null)
    await assert.rejects(db.query('select public.ieum_complete_verified_mix($1,gen_random_uuid(),$2,20)',[job.id,'d'.repeat(64)]),error => error.code==='42501')
    await assert.rejects(db.exec('delete from public.ieum_submitted_tracks'),error => error.code==='42501')
    await db.exec('reset role')
    await assert.rejects(db.query("update public.ieum_mix_jobs set status='succeeded',completed_at=now() where id=$1",[job.id]),error => error.code==='23514')
    await db.query("update public.ieum_mix_jobs set status='failed' where id=$1",[job.id])
    await asUser(users[0])
    assert.equal((await mix(project)).mix.status,'failed')
    assert.equal((await mix(project)).mix.result,null)
    await db.exec('reset role')
    assert.equal((await db.query('select lifecycle from public.ieum_projects where id=$1',[project])).rows[0].lifecycle,'mixing')
    const object = (await db.query('select gen_random_uuid() as id')).rows[0].id
    await db.exec('set role service_role')
    await assert.rejects(db.query('select public.ieum_complete_verified_mix($1,$2,$3,20)',[job.id,object,'bad']),error => error.code==='PT400')
    const result = (await db.query('select public.ieum_complete_verified_mix($1,$2,$3,20) as result',[job.id,object,'d'.repeat(64)])).rows[0].result
    assert.equal(result.lifecycle,'completed')
    assert.deepEqual((await db.query('select public.ieum_complete_verified_mix($1,$2,$3,20) as result',[job.id,object,'d'.repeat(64)])).rows[0].result,result)
    await assert.rejects(db.query('select public.ieum_complete_verified_mix($1,$2,$3,20)',[job.id,object,'e'.repeat(64)]),error => error.code==='PT409')
    await asUser(users[0])
    assert.equal((await get(project)).lifecycle,'completed')
    const saved=(await mix(project)).mix
    assert.equal(saved.status,'succeeded');assert.equal(saved.result.objectId,object)
    assert.equal(saved.result.sha256,'d'.repeat(64));assert.equal(saved.result.duration,20)
    if(count<4){await asUser(users[3]);await assert.rejects(mix(project),e=>e.code==='PT403');await asUser(users[0])}
    assert.equal((await get(project)).submittedTrackCount,count)
    assert.deepEqual((await submit(project,'vocal-0',intents[0],`${project}-0`)).rows[0].result,responses[0])
  }
  await asUser(null)
  await assert.rejects(mix('qa-2'),error=>error.code==='PT401')
  await assert.rejects(get('qa-2'),error => error.code==='PT401')
  await db.exec('reset role; set role anon')
  await assert.rejects(mix('qa-2'),error=>error.code==='42501')
  await assert.rejects(get('qa-2'),error => error.code==='42501')
  for (const table of ['ieum_projects','ieum_project_parts','ieum_upload_intents','ieum_submitted_tracks','ieum_mix_jobs'])
    await assert.rejects(db.exec(`select * from public.${table}`),error => error.code==='42501')
  console.log('PASS PostgreSQL shared lifecycle: 2/3/4 actual Parts, assignment/receipt checks, no premature submission, original reference/key lock, repeat-submit stability, last Track queues one Mix, failed Mix stays incomplete, server-only validated completion, anonymous/direct-write denial. Isolated fixtures, not real users/audio/Storage/cross-connection concurrency.')
} finally { await db.close() }
