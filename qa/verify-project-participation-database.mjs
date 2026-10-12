import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { evaluatePartFit } from '../src/matching.js'
import {catalogReadRequest,catalogReadErrorResponse} from '../server/catalogRead.js'
import {createRemoteProjectService} from '../src/projectService.js'
import {projectDiscoveryRequest} from '../server/projectDiscovery.js'
import {projectLifecycleRequest,projectLifecycleErrorResponse} from '../server/projectLifecycle.js'
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
  for(const file of ['20261013_voice_profiles.sql','20261013_project_tracks.sql','20261013_project_participation.sql','20261013_profile_source_history.sql','20261013_catalog_reads.sql','20261013_project_discovery.sql'])
    await db.exec(await readFile(new URL(`../server/migrations/${file}`,import.meta.url),'utf8'))
  await db.exec('set role anon')
  assert.deepEqual((await db.query('select public.ieum_list_catalog_arrangements() as result')).rows[0].result,{items:[],nextCursor:null})
  assert.deepEqual((await db.query('select public.ieum_list_discovery_projects() as result')).rows[0].result,{items:[],nextCursor:null})
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
  const discover=async(song=null,after=null,limit=20)=>(await db.query('select public.ieum_list_discovery_projects($1,$2,$3) as result',[song,after,limit])).rows[0].result
  const projectPage=await discover('qa-song')
  assert.equal(projectPage.items.length,3)
  assert.ok(projectPage.items.every(item=>item.parts.length===item.partCount))
  const publicMixing=projectPage.items.find(item=>item.id===originalCreated.id)
  assert.equal(publicMixing.lifecycle,'mixing');assert.equal(publicMixing.submittedTrackCount,2)
  assert.ok(publicMixing.parts.every(part=>part.status==='submitted'))
  assert.ok(!JSON.stringify(projectPage).includes(users[0]));assert.ok(!JSON.stringify(projectPage).includes(users[1]))
  assert.deepEqual(await discover('missing-song'),{items:[],nextCursor:null})
  const pageOne=await discover(null,null,1),pageTwo=await discover(null,pageOne.nextCursor,1)
  assert.equal(pageOne.items.length,1);assert.notEqual(pageTwo.items[0].id,pageOne.items[0].id)
  await assert.rejects(db.exec('select * from public.ieum_projects'),error=>error.code==='42501')
  // Existing Profile/Part Fit gate remains mandatory for creation, but not reads.
  await asUser(users[3]);assert.deepEqual(await discover('qa-song'),projectPage)
  await assert.rejects(create('a-4','vocal-0','discovery-profile-required'),error=>error.code==='PT403')
  await db.exec('reset role')
  await db.query("update public.ieum_mix_jobs set status='failed' where project_id=$1",[originalCreated.id])
  await db.exec('set role anon')
  assert.equal((await discover()).items.find(item=>item.id===originalCreated.id).lifecycle,'mixing')
  await db.exec('reset role')
  // Corrupted trusted writes must not publish a completed item without success.
  await db.query("update public.ieum_projects set lifecycle='completed' where id=$1",[originalCreated.id])
  await db.exec('set role anon')
  assert.ok(!(await discover()).items.some(item=>item.id===originalCreated.id))
  await db.exec('reset role')
  await db.query("update public.ieum_projects set lifecycle='mixing' where id=$1",[originalCreated.id])
  const job=(await db.query('select id from public.ieum_mix_jobs where project_id=$1',[originalCreated.id])).rows[0].id
  await db.query('select public.ieum_complete_verified_mix($1,gen_random_uuid(),$2,20)',[job,'f'.repeat(64)])
  await db.exec('set role anon')
  assert.equal((await discover()).items.find(item=>item.id===originalCreated.id).lifecycle,'completed')
  let discoveryCalls=0,invalidDiscovery=false,failDiscovery=false
  const discoveryFetch=async(url,options)=>{
    discoveryCalls++;assert.ok(url.endsWith('/ieum_list_discovery_projects'));assert.equal(options.headers.Authorization,undefined)
    assert.equal(options.headers.apikey,'qa-public');assert.equal(options.redirect,'error');assert.equal(options.referrerPolicy,'no-referrer');assert.equal(options.credentials,'omit')
    if(failDiscovery)throw new Error('private diagnostic token')
    const body=JSON.parse(options.body),value=await discover(body.p_song_id,body.p_after_id,body.p_limit)
    if(invalidDiscovery)value.items[0].submittedTrackCount=99
    return Response.json(value)
  }
  const projectRead=query=>projectDiscoveryRequest(new Request('https://ieum.example/api/project-discovery'+query,{headers:{Authorization:'Bearer must-not-forward'}}),{env,fetchImpl:discoveryFetch})
  assert.deepEqual(await(await projectRead('?songId=qa-song')).json(),await discover('qa-song'))
  for(const query of ['?songId=','?songId=qa-song&songId=another','?limit=51','?owner=private']){
    const before=discoveryCalls;await assert.rejects(projectRead(query),error=>error.code==='INVALID_CATALOG_REQUEST');assert.equal(discoveryCalls,before)
  }
  invalidDiscovery=true;await assert.rejects(projectRead(''),error=>error.code==='INVALID_CATALOG_RESPONSE');invalidDiscovery=false
  failDiscovery=true;assert.deepEqual(await(await projectRead('').catch(catalogReadErrorResponse)).json(),{error:{code:'CATALOG_UNAVAILABLE'}});failDiscovery=false
  const discoveryClient=createRemoteProjectService({baseUrl:'https://ieum.example/api',getAccessToken:()=>{assert.fail('Discovery must not read personal bearer')},
    fetchImpl:(url,options)=>projectDiscoveryRequest(new Request(url,options),{env,fetchImpl:discoveryFetch})})
  assert.deepEqual(await discoveryClient.discoverProjects({songId:'qa-song',limit:1}),await discover('qa-song',null,1))
  await asUser(users[0])
  const privateMetadataProject=await create('zz-private','one','private-metadata-discovery')
  await db.exec('reset role;set role anon')
  const sanitized=(await discover()).items.find(item=>item.id===privateMetadataProject.id)
  assert.ok(sanitized)
  assert.ok(!JSON.stringify(sanitized).includes('secret'))
  assert.ok(!JSON.stringify(sanitized).includes(users[0]))
  assert.deepEqual(sanitized.parts.find(part=>part.id==='one').requiredRange,{lowMidi:50,highMidi:65,tessitura:{lowMidi:53,highMidi:61}})
  await db.exec('reset role')
  await db.exec(await readFile(new URL('../server/migrations/20261013_project_key_adjustment.sql',import.meta.url),'utf8'))
  await db.exec('reset role')
  await db.query('update public.ieum_profile_voice_sources set range_data=$1,source_revision=$2 where user_id=$3',[JSON.stringify(measured),'qa-key-source-revision',users[0]])
  await db.exec('reset role')
  await db.query('update public.ieum_profile_voice_sources set range_data=$1,source_revision=$2 where user_id=$3',[JSON.stringify(measured),'qa-key-source-revision',users[0]])
  const setKey=async(project,arrangement,revision,key)=>(await db.query('select public.ieum_set_project_key($1,$2,$3,$4) as result',[project,arrangement,revision,key])).rows[0].result
  for(const count of [2,3,4]) {
    await db.exec('reset role')
    const parts=Array.from({length:count},(_,index)=>({id:`vocal-${index}`,requiredRange:{lowMidi:51,highMidi:66,tessitura:{lowMidi:53,highMidi:62}}}))
    await db.query('insert into public.ieum_catalog_arrangements values($1,$2,$3,$4,$5)',
      [`key-${count}`,'qa-song','+1',JSON.stringify({...source,key:'+1',revision:'key-v1',sourceSha256:'f'.repeat(64)}),JSON.stringify(parts)])
    await insertArrangement(`unfit-${count}`,parts.map(part=>({...part,requiredRange:{lowMidi:50,highMidi:80}})))
    await insertArrangement(`other-parts-${count}`,parts.map(part=>({...part,id:`different-${part.id}`})))
    await asUser(users[0])
    const initial=await create(`a-${count}`,'vocal-0',`key-project-${count}`)
    await asUser(users[1]);const before=await joinPart(initial.id,'vocal-1',`key-join-${count}`)
    await assert.rejects(setKey(initial.id,`key-${count}`,before.revision,`not-owner-${count}`),error=>error.code==='PT403')
    await asUser(users[0])
    for(const [arrangement,revision,code] of [[`key-${count}`,0,'PT409'],[`unfit-${count}`,before.revision,'PT403'],
      [`other-parts-${count}`,before.revision,'PT409'],['missing',before.revision,'PT404']]) {
      await assert.rejects(setKey(initial.id,arrangement,revision,`reject-${count}-${arrangement}`),error=>error.code===code)
      assert.deepEqual(await get(initial.id),before)
    }
    const client=createRemoteProjectService({baseUrl:'https://ieum.example/api',getAccessToken:()=> 'qa-key-token',fetchImpl:(url,options)=>
      projectLifecycleRequest(new Request(url,options),{env,fetchImpl:async(upstream,init)=>{
        assert.equal(init.headers.Authorization,'Bearer qa-key-token');assert.equal(init.headers.apikey,'qa-public')
        if(upstream.endsWith('/auth/v1/user'))return Response.json({id:users[0]})
        assert.ok(upstream.endsWith('/ieum_set_project_key'))
        const input=JSON.parse(init.body)
        return Response.json(await setKey(input.p_project_id,input.p_arrangement_id,input.p_expected_revision,input.p_request_key))
      }}).catch(projectLifecycleErrorResponse)})
    const changed=await client.setProjectKey(initial.id,{arrangementId:`key-${count}`,expectedRevision:before.revision},`key-${count}`)
    assert.equal(changed.key,'+1');assert.equal(changed.seed,before.seed);assert.equal(changed.revision,before.revision+1)
    assert.equal(changed.audioSourceRef.revision,'key-v1');assert.equal(changed.submittedTrackCount,0);assert.equal(changed.keyLockedAt,null)
    assert.deepEqual(changed.parts.map(part=>part.participantId),before.parts.map(part=>part.participantId))
    assert.deepEqual(changed.parts[0].requiredRange,parts[0].requiredRange)
    assert.deepEqual(await setKey(initial.id,`key-${count}`,before.revision,`key-${count}`),changed)
    await assert.rejects(setKey(initial.id,`a-${count}`,before.revision,`key-${count}`),error=>error.code==='PT409')
    assert.equal((await setKey(initial.id,`key-${count}`,changed.revision,`same-key-${count}`)).revision,changed.revision)
    const locked=(await db.query('select public.ieum_start_project_recording($1,$2) as result',[initial.id,'vocal-0'])).rows[0].result
    await assert.rejects(setKey(initial.id,`a-${count}`,locked.revision,`locked-${count}`),error=>error.code==='PT409')
    assert.deepEqual(await get(initial.id),locked)
    // Lost-response replay returns the first receipt without changing the now-locked Project.
    assert.deepEqual(await setKey(initial.id,`key-${count}`,before.revision,`key-${count}`),changed)
    assert.deepEqual(await get(initial.id),locked)
  }
  await asUser(null)
  await assert.rejects(setKey('missing','a-2',0,'anonymous-key'),error=>error.code==='PT401')
  await db.exec('reset role;set role anon')
  await assert.rejects(setKey('missing','a-2',0,'anon-key'),error=>error.code==='42501')
  console.log('PASS Key adjustment: Owner/pre-recording only, catalog-backed 2–4 Parts/current assigned fit, revision conflict, stable seed/assignments, unchanged originals on failure, stored replay/no-op, recording locks before any submission. Isolated SQL, not live users/concurrent connections/App UI.')
  console.log('PASS public Project discovery SQL→HTTP→client: same Song/bounded pages, actual 2–4 Part/submission states, no participant IDs/originals, missing Profile can browse but not create, failed Mix stays mixing and successful receipt required for completed. Isolated fixtures, not live Mix/rights/App integration.')
  console.log('PASS public catalog SQL→HTTP→client: no Profile/login dependency, 2–4 actual Part metadata, deterministic bounded pages, no private extra fields/personal bearer, request/upstream failures, direct table access denied. Trusted fixtures only; no real approved songs/rights/App discovery activation.')
  console.log('PASS actual PostgreSQL Project creation/join: catalog-backed 2/3/4 Parts, creator assignment/others OPEN/0 Tracks, immutable sources, stored-profile range+tessitura parity, missing Profile denial, repeated-operation results, occupied-seat denial, no duplicate participation or direct source edits. Isolated fixtures, not live users/catalog/audio/cross-connection concurrency.')
} finally {await db.close()}
