import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'

if (!process.env.IEUM_PGLITE_ROOT) throw new Error('IEUM_PGLITE_ROOT must identify the isolated QA runtime; no remote migration is applied')
const require = createRequire(join(process.env.IEUM_PGLITE_ROOT,'package.json'))
const { PGlite } = require('@electric-sql/pglite')
const db = new PGlite()
const a = '11111111-1111-4111-8111-111111111111', b = '22222222-2222-4222-8222-222222222222'
try {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
    insert into auth.users values ('${a}'),('${b}');`)
  for (const file of ['20261013_voice_profiles.sql','20261013_saved_objects.sql']) {
    await db.exec(await readFile(new URL(`../server/migrations/${file}`,import.meta.url),'utf8'))
  }
  const asUser = async id => { await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id || '']); await db.exec('set role authenticated') }
  const set = (type,id,saved) => db.query('select public.ieum_set_saved_object($1,$2,$3) as result',[type,id,saved])
  const list = async () => (await db.query('select public.ieum_get_saved_objects() as result')).rows[0].result.saves
  await asUser(a)
  await db.query("select public.ieum_patch_profile_preferences('{\"preferredSongIds\":[\"keep-preference\"]}',0)")
  assert.deepEqual(await list(),[])
  for (const type of ['project','vocal','song']) await set(type,'same-id',true)
  assert.equal((await list()).length,3)
  const savedAt = (await set('song','same-id',true)).rows[0].result.savedAt
  assert.equal((await set('song','same-id',true)).rows[0].result.savedAt,savedAt)
  assert.equal((await list()).length,3)
  await set('song','same-id',false); await set('song','same-id',false)
  assert.deepEqual((await list()).map(item => item.type).sort(),['project','vocal'])
  assert.deepEqual((await db.query('select public.ieum_get_profile() as result')).rows[0].result.profile,{ preferredSongIds:['keep-preference'] })
  for (const values of [['track','x',true],['song','\t\n',true],['song',null,true],['song','x',null]]) {
    await assert.rejects(set(...values),error => error.code === 'PT400')
  }
  for (const sql of ['delete from public.ieum_saved_objects',"update public.ieum_saved_objects set object_id='other'"])
    await assert.rejects(db.exec(sql),error => error.code === '42501')
  await asUser(b)
  assert.deepEqual(await list(),[])
  assert.equal((await db.query('select * from public.ieum_saved_objects')).rows.length,0)
  await set('project','same-id',false)
  await set('song','same-id',true)
  assert.deepEqual((await list()).map(item => item.type),['song'])
  await asUser(a)
  assert.deepEqual((await list()).map(item => item.type).sort(),['project','vocal'])
  await asUser(null)
  await assert.rejects(list(),error => error.code === 'PT401')
  await db.exec('reset role; set role anon')
  await assert.rejects(list(),error => error.code === '42501')
  await assert.rejects(set('song','x',true),error => error.code === '42501')
  await assert.rejects(db.exec('select * from public.ieum_saved_objects'),error => error.code === '42501')
  console.log('PASS PostgreSQL saved objects: own-row RLS, cross-user isolation, type independence, repeated PUT/timestamp preservation, repeated removal, Profile preference independence, anonymous/direct-write denial. PGlite, not live Supabase/concurrent connections.')
} finally { await db.close() }
