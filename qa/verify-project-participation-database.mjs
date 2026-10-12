import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { evaluatePartFit } from '../src/matching.js'
import {catalogReadRequest,catalogReadErrorResponse} from '../server/catalogRead.js'
import {createRemoteProjectService} from '../src/projectService.js'
if (!process.env.IEUM_PGLITE_ROOT) throw new Error('IEUM_PGLITE_ROOT must identify the isolated QA runtime; no remote migrations are applied')
const require=createRequire(join(process.env.IEUM_PGLITE_ROOT,'package.json'))
const { PGlite }=require('@electric-sql/pglite')
const db=new PGlite()
const users=[1,2,3,4].map(n=>`${String(n).repeat(8)}-${String(n).repeat(4)}-4${String(n).repeat(3)}-8${String(n).repeat(3)}-${String(n).repeat(12)}`)
const asUser=async id=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id || '']);await db.exec('set role authenticated')}
const create=async(arrangement,part,key)=>(await db.query('select public.ieum_create_project($1,$2,$3) as result',[arrangement,part,key])).rows[0].result
const joinPart=async(project,part,key)=>(await db.query('select public.ieum_join_project_part($1,$2,$3) as result',[project,part,key])).rows[0].result
const get=async project=>(await db.query('select public.ieum_get_project($1) as result',[project])).rows[0].result
try {
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`)
  for(const user of users)await db.query('insert into auth.users values($1)',[user])
  for(const file of ['20261013_voice_profiles.sql','20261013_project_tracks.sql','20261013_project_participation.sql','20261013_profile_source_history.sql','20261013_catalog_reads.sql'])
    await db.exec(await readFile(new URL(`../server/migrations/${file}`,import.meta.url),'utf8'))
  await db.exec('set role anon')
  assert.deepEqual((await db.query('select public.ieum_list_catalog_arrangements() as result')).rows[0].result,{items:[],nextCursor:null})
  await db.exec('reset role')
  const source={songId:'qa-song',key:'original',revision:'qa-v1',duration:20,sourceSha256:'a'.repeat(64),backingSha256:'b'.repeat(64)}
  const insertArrangement=(id,parts,audio=source)=>db.query('insert into public.ieum_catalog_arrangements values($1,$2,$3,$4,$5)',
    [id,'qa-song','original',JSON.stringify(audio),JSON.stringify(parts)])
  for(const count of [2,3,4])await insertArrangement(`a-${count}`,Array.from({length:count},(_,index)=>({id:`vocal-${index}`,requiredRange:{lowMidi:50,highMidi:65}})))
  for(const parts of [[],[{id:'x',requiredRange:{lowMidi:50,highMidi:65}}],
    [{id:'x',requiredRange:{lowMidi:50,highMidi:65}},{id:'x',requiredRange:{lowMidi:50,highMidi:65}}],
    [{id:'x',requiredRange:{}},{id:'y',requiredRange:{lowMidi:50,highMidi:65}}]])
    await assert.rejects(insertArrangement('invalid',parts),error=>error.code==='23514')
  await assert.rejects(insertArrangement('wrong-key',[{id:'x',requiredRange:{lowMidi:50,highMidi:65}},{id:'y',requiredRange:{lowMidi:50,highMidi:65}}],{...source,key:'fake-transposition'}),error=>error.code==='23514')
  await assert.rejects(db.exec("update public.ieum_catalog_arrangements set project_key='changed'"),error=>error.code==='PT409')
  await asUser(users[0])
  await assert.rejects(create('a-2','vocal-0','create-missing-profile'),error=>error.code==='PT403' && error.message.includes('PROFILE_REQUIRED'))
  await db.exec('reset role')
  const measured={lowMidi:48,highMidi:67}
  // Trusted source fixtures only: not real measurement, Storage or catalog data.
  for(const user of users.slice(0,3))await db.query(`insert into public.ieum_profile_voice_sources
    values($1,'qa-source-revision',$2,$3,'normalized-difference-v1',gen_random_uuid(),$4,20,now())`,
    [user,JSON.stringify(measured),'c'.repeat(64),'d'.repeat(64)])
  for(const count of [2,3,4]) {
    await asUser(users[0])
    const first=await create(`a-${count}`,'vocal-0',`create-${count}`)
    assert.equal(first.parts.length,count);assert.equal(first.submittedTrackCount,0);assert.equal(first.lifecycle,'recruiting')
    assert.equal(first.parts.filter(part=>part.status==='ready').length,1)
    assert.equal(first.parts.filter(part=>part.status==='open').length,count-1)
    assert.equal(first.parts.find(part=>part.id==='vocal-0').participantId,users[0])
    assert.deepEqual(first.audioSourceRef,source)
    assert.deepEqual(await create(`a-${count}`,'vocal-0',`create-${count}`),first)
    await assert.rejects(create(`a-${count}`,'vocal-1',`create-${count}`),error=>error.code==='PT409')
    await asUser(users[3])
    await assert.rejects(joinPart(first.id,'vocal-1',`missing-${count}`),error=>error.code==='PT403')
    await asUser(users[1])
    const joined=await joinPart(first.id,'vocal-1',`join-${count}`)
    assert.equal(joined.submittedTrackCount,0)
    assert.equal(joined.parts.find(part=>part.id==='vocal-1').participantId,users[1])
    assert.deepEqual(await joinPart(first.id,'vocal-1',`join-${count}`),joined)
    await assert.rejects(joinPart(first.id,'vocal-0',`join-${count}`),error=>error.code==='PT409')
    const anotherKey=await joinPart(first.id,'vocal-1',`same-part-new-key-${count}`)
    assert.equal(anotherKey.revision,joined.revision)
    await asUser(users[2])
    await assert.rejects(joinPart(first.id,'vocal-1',`competition-${count}`),error=>error.code==='PT409')
    assert.equal((await get(first.id)).submittedTrackCount,0)
    await asUser(users[0])
    await db.query('select public.ieum_start_project_recording($1,$2)',[first.id,'vocal-0'])
    assert.deepEqual(await create(`a-${count}`,'vocal-0',`create-${count}`),first)
    await db.exec('reset role')
    assert.equal((await db.query('select owner_user_id from public.ieum_projects where id=$1',[first.id])).rows[0].owner_user_id,users[0])
    assert.equal((await db.query('select count(*)::int as count from public.ieum_submitted_tracks where project_id=$1',[first.id])).rows[0].count,0)
  }
  // Compare SQL eligibility with the existing React domain rule, including tessitura.
  let fitRevision=0
  for(const [range,required] of [[measured,{lowMidi:48,highMidi:67}],
    [measured,{lowMidi:47,highMidi:67}],[measured,{lowMidi:48,highMidi:68}],
    [{...measured,comfortableRange:{lowMidi:52,highMidi:62}},{lowMidi:50,highMidi:65,tessitura:{lowMidi:53,highMidi:61}}],
    [{...measured,comfortableRange:{lowMidi:52,highMidi:62}},{lowMidi:50,highMidi:65,tessitura:{lowMidi:51,highMidi:63}}]]) {
    await db.exec('reset role')
    await db.query('update public.ieum_profile_voice_sources set range_data=$1,source_revision=$3 where user_id=$2',[JSON.stringify(range),users[0],`qa-fit-revision-${++fitRevision}`])
    const expected=evaluatePartFit({rangeData:range,part:required}).eligible
    const operation=db.query('select public.ieum_require_part_fit($1,$2)',[users[0],JSON.stringify(required)])
    if(expected)await operation;else await assert.rejects(operation,error=>error.code==='PT403')
  }
  await asUser(users[0])
  const originalCreated=await create('a-2','vocal-0','create-2')
  for(let index=0;index<2;index++) {
    await db.exec('reset role')
    const intent=(await db.query(`insert into public.ieum_upload_intents(project_id,part_id,user_id,object_id,byte_length,sha256,content_type,verified_at,verified_duration)
      values($1,$2,$3,gen_random_uuid(),4000,$4,'audio/wav',now(),20) returning id`,
      [originalCreated.id,`vocal-${index}`,users[index],'e'.repeat(64)])).rows[0].id
    await asUser(users[index])
    await db.query('select public.ieum_submit_verified_track($1,$2,$3,$4,20,0)',[originalCreated.id,`vocal-${index}`,intent,`connected-submit-${index}`])
  }
  assert.equal((await get(originalCreated.id)).lifecycle,'mixing')
  assert.equal((await get(originalCreated.id)).submittedTrackCount,2)
  await asUser(users[0])
  assert.deepEqual(await create('a-2','vocal-0','create-2'),originalCreated)
  for(const table of ['ieum_catalog_arrangements','ieum_profile_voice_sources','ieum_operation_results'])
    await assert.rejects(db.exec(`select * from public.${table}`),error=>error.code==='42501')
  await assert.rejects(db.exec("update public.ieum_profile_voice_sources set range_data='{}'"),error=>error.code==='42501')
  await asUser(null)
  await assert.rejects(create('a-2','vocal-0','unauth'),error=>error.code==='PT401')
  await db.exec('reset role;set role anon')
  await assert.rejects(create('a-2','vocal-0','anon'),error=>error.code==='42501')
  const page=async(after=null,limit=2)=>(await db.query('select public.ieum_list_catalog_arrangements($1,$2) as result',[after,limit])).rows[0].result
  assert.deepEqual((await page()).items.map(item=>item.id),['a-2','a-3'])
  assert.equal((await page()).nextCursor,'a-3')
  assert.deepEqual((await page('a-3')).items.map(item=>item.id),['a-4'])
  assert.equal((await page('a-3')).nextCursor,null)
  assert.deepEqual(await page('zz'),{items:[],nextCursor:null})
  for(const limit of [null,0,51])await assert.rejects(page(null,limit),error=>error.code==='PT400')
  await assert.rejects(db.exec('select * from public.ieum_catalog_arrangements'),error=>error.code==='42501')
  await db.exec('reset role')
  await insertArrangement('zz-private',[{id:'one',userId:users[0],requiredRange:{lowMidi:50,highMidi:65,privateDiagnostic:'secret',tessitura:{lowMidi:53,highMidi:61,privateField:'secret'}}},
    {id:'two',requiredRange:{lowMidi:50,highMidi:65}}],{...source,signedUrl:'https://private.example/secret',userId:users[0]})
  await db.exec('set role anon')
  assert.ok(!JSON.stringify(await page('a-4')).includes('secret'))
  assert.ok(!JSON.stringify(await page('a-4')).includes(users[0]))
  const env={IEUM_DB_PROVIDER:'supabase',IEUM_AUTH_PROVIDER:'supabase',IEUM_SUPABASE_URL:'https://example.supabase.co',IEUM_SUPABASE_PUBLISHABLE_KEY:'qa-public'}
  let calls=0,unavailable=false,invalid=false
  const fetchImpl=async(url,options)=>{
    calls++;assert.ok(url.endsWith('/ieum_list_catalog_arrangements'))
    assert.equal(options.headers.Authorization,undefined);assert.equal(options.headers.apikey,'qa-public')
    assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');assert.equal(options.referrerPolicy,'no-referrer')
    if(unavailable)throw new Error('private upstream url/token')
    const body=JSON.parse(options.body),result=await page(body.p_after_id,body.p_limit)
    return Response.json(invalid?{items:[{}],nextCursor:null}:result)
  }
  const read=path=>catalogReadRequest(new Request('https://ieum.example/api/catalog-arrangements'+path,{headers:{Authorization:'Bearer must-not-forward'}}),{env,fetchImpl})
  const firstPage=await read('?limit=2');assert.equal(firstPage.status,200)
  assert.deepEqual(await firstPage.json(),await page())
  assert.equal(firstPage.headers.get('cache-control'),'public, max-age=0, must-revalidate')
  for(const query of ['?limit=0','?limit=51','?limit=1.5','?limit=01','?after=','?limit=2&limit=3','?userId=someone']){
    const before=calls;await assert.rejects(read(query),error=>error.code==='INVALID_CATALOG_REQUEST');assert.equal(calls,before)
  }
  invalid=true;await assert.rejects(read(''),error=>error.code==='INVALID_CATALOG_RESPONSE');invalid=false
  unavailable=true
  const errorResponse=await read('').catch(catalogReadErrorResponse)
  assert.equal(errorResponse.status,503);assert.deepEqual(await errorResponse.json(),{error:{code:'CATALOG_UNAVAILABLE'}})
  unavailable=false
  const client=createRemoteProjectService({baseUrl:'https://ieum.example/api',getAccessToken:()=>{assert.fail('Public catalog must not read a personal token')},fetchImpl:async(url,options)=>{
    assert.equal(options.headers.Authorization,undefined)
    return catalogReadRequest(new Request(url,options),{env,fetchImpl})
  }})
  assert.deepEqual(await client.getCatalog({limit:2}),await page())
  assert.deepEqual(await client.getCatalog({after:'a-3',limit:2}),await page('a-3'))
  console.log('PASS public catalog SQL→HTTP→client: no Profile/login dependency, 2–4 actual Part metadata, deterministic bounded pages, no private extra fields/personal bearer, request/upstream failures, direct table access denied. Trusted fixtures only; no real approved songs/rights/App discovery activation.')
  console.log('PASS actual PostgreSQL Project creation/join: catalog-backed 2/3/4 Parts, creator assignment/others OPEN/0 Tracks, immutable sources, stored-profile range+tessitura parity, missing Profile denial, repeated-operation results, occupied-seat denial, no duplicate participation or direct source edits. Isolated fixtures, not live users/catalog/audio/cross-connection concurrency.')
} finally {await db.close()}
