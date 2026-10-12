import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'

// Optional QA runtime only. Never install a database engine in the app bundle.
if (!process.env.IEUM_PGLITE_ROOT) throw new Error('IEUM_PGLITE_ROOT must point to an isolated PGlite QA runtime; no DB connection or migration will be made automatically')
const require = createRequire(join(process.env.IEUM_PGLITE_ROOT, 'package.json'))
const { PGlite } = require('@electric-sql/pglite')
const db = new PGlite()
const userA = '11111111-1111-4111-8111-111111111111', userB = '22222222-2222-4222-8222-222222222222'
try {
  // Test-only Auth context, not an OAuth verification substitute.
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
    insert into auth.users values ('${userA}'),('${userB}');`)
  await db.exec(await readFile(new URL('../server/migrations/20261013_voice_profiles.sql', import.meta.url), 'utf8'))
  const asUser = async id => { await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id || '']); await db.exec('set role authenticated') }
  const patch = (value, revision) => db.query('select public.ieum_patch_profile_preferences($1::jsonb,$2::integer) as result', [JSON.stringify(value), revision])
  await asUser(userA)
  assert.deepEqual((await db.query('select public.ieum_get_profile() as result')).rows[0].result, { profile: null, revision: 0 })
  assert.equal((await patch({ roles: [], genres: ['재즈'], preferredSongIds: ['city-of-stars'] }, 0)).rows[0].result.revision, 1)
  await assert.rejects(patch({ roles: ['메인 멜로디'] }, 0), error => error.code === 'PT409')
  assert.equal((await db.query('select * from public.ieum_profiles')).rows.length, 1)
  for (const sql of ['delete from public.ieum_profiles', "update public.ieum_profiles set profile_data='{}'", `insert into public.ieum_profiles(user_id) values ('${userB}')`]) {
    await assert.rejects(db.exec(sql), error => error.code === '42501')
  }
  await asUser(userB)
  assert.equal((await db.query('select * from public.ieum_profiles')).rows.length, 0)
  assert.equal((await db.query('select public.ieum_get_profile() as result')).rows[0].result.profile, null)
  await patch({ roles: ['화음·코러스'] }, 0)
  assert.deepEqual((await db.query('select public.ieum_get_profile() as result')).rows[0].result.profile, { roles: ['화음·코러스'] })
  await db.exec('reset role')
  const protectedData = { rangeData: { lowMidi: 48, highMidi: 72 }, sampleProvenance: { sha256: 'keep-original' }, identity: { revision: 'keep-shape' } }
  await db.query('update public.ieum_profiles set profile_data=profile_data || $1::jsonb where user_id=$2', [JSON.stringify(protectedData), userA])
  await asUser(userA)
  const outcomes = await Promise.allSettled([patch({ roles: ['메인 멜로디'] }, 1), patch({ roles: ['화음·코러스'] }, 1)])
  assert.equal(outcomes.filter(value => value.status === 'fulfilled').length, 1)
  assert.equal(outcomes.filter(value => value.status === 'rejected' && value.reason.code === 'PT409').length, 1)
  const saved = (await db.query('select public.ieum_get_profile() as result')).rows[0].result
  for (const [key, value] of Object.entries(protectedData)) assert.deepEqual(saved.profile[key], value)
  assert.equal(saved.revision, 2)
  for (const value of [{ userId: userB }, { identity: {} }, { rangeData: {} }, { roles: [null] }, { roles: ['x','x'] }, { roles: [' '] }, { roles: ['\t\n'] }, {}]) {
    await assert.rejects(patch(value, 2), error => error.code === 'PT400')
  }
  assert.equal((await patch({ roles: [], genres: [], preferredSongIds: [], taste: [] }, 2)).rows[0].result.revision, 3)
  await asUser(null)
  await assert.rejects(patch({ roles: [] }, 0), error => error.code === 'PT401')
  await db.exec('reset role; set role anon')
  await assert.rejects(db.exec('select * from public.ieum_profiles'), error => error.code === '42501')
  await assert.rejects(db.exec('select public.ieum_get_profile()'), error => error.code === '42501')
  await assert.rejects(patch({ roles: [] }, 0), error => error.code === '42501')
  console.log('PASS actual PostgreSQL SQL: two isolated Auth contexts, own-row RLS, anon/direct-write denial, revision conflict, one winner per revision, partial patch source preservation, empty selections, malformed/forged-user rejection. PGlite fixture, not real Supabase/Google/cross-connection evidence.')
} finally { await db.close() }
