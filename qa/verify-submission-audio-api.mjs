import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp,readFile,rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join,resolve,sep } from 'node:path'
import { createHash } from 'node:crypto'
import { projectLifecycleRequest,projectLifecycleErrorResponse } from '../server/projectLifecycle.js'

assert.ok(process.env.IEUM_QA_FFMPEG_PATH,'An existing real decoder is required; no model/installation')
const directory=await mkdtemp(join(tmpdir(),'ieum-submission-audio-')),file=join(directory,'original.mp4')
try{
  await new Promise((resolve,reject)=>{
    const child=spawn(process.env.IEUM_QA_FFMPEG_PATH,['-nostdin','-loglevel','error','-threads','1','-filter_threads','1',
      '-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=0.5','-threads','1','-c:a','aac',file],
    {shell:false,windowsHide:true,stdio:['ignore','ignore','ignore']})
    child.on('error',reject);child.on('close',code=>code===0?resolve():reject(new Error('Fixture generation failed')))
  })
  const bytes=await readFile(file),sha256=createHash('sha256').update(bytes).digest('hex')
  const user='11111111-1111-4111-8111-111111111111',intent='33333333-3333-4333-8333-333333333333'
  const env={IEUM_AUTH_PROVIDER:'supabase',IEUM_DB_PROVIDER:'supabase',IEUM_STORAGE_PROVIDER:'supabase',IEUM_SUPABASE_URL:'https://example.supabase.co',
    IEUM_SUPABASE_PUBLISHABLE_KEY:'qa-public',IEUM_SUPABASE_SECRET_KEY:'sb_secret_qa_only',IEUM_AUDIO_BUCKET:'private-audio',
    IEUM_AUDIO_DECODER_PATH:process.env.IEUM_QA_FFMPEG_PATH,IEUM_AUDIO_MAX_DECODE_SECONDS:'2'}
  const context={projectId:'p',partId:'lead',userId:user,uploadIntentId:intent,objectId:'22222222-2222-4222-8222-222222222222',
    size:bytes.length,sha256,contentType:'audio/mp4',receipt:null}
  let receipt=null,calls=[],wrongOwner=false,storageMode='present',lookupDenied=false,confirmationFails=false
  const fetchImpl=async(url,init)=>{
    calls.push(url)
    assert.equal(init.redirect,'error');assert.equal(init.credentials,'omit')
    if(url.endsWith('/auth/v1/user'))return Response.json({id:user})
    if(url.endsWith('/ieum_confirm_original_audio')){
      assert.equal(init.headers.apikey,'sb_secret_qa_only');assert.equal(init.headers.Authorization,undefined)
      if(confirmationFails)return new Response('private token detail',{status:500})
      const value=JSON.parse(init.body)
      assert.equal(value.p_user_id,user);assert.equal(value.p_object_id,context.objectId)
      receipt=value.p_receipt
      return Response.json({uploadIntentId:intent,verificationStatus:'verified',receipt})
    }
    if(url.includes('/storage/v1/')){
      assert.equal(init.headers.apikey,'sb_secret_qa_only');assert.equal(init.headers.Authorization,undefined)
      if(url.includes('/bucket/'))return Response.json({id:'private-audio',public:false})
      if(storageMode==='missing')return new Response('private',{status:404})
      return new Response(storageMode==='mismatch'?Buffer.alloc(bytes.length):bytes,{headers:{'Content-Type':'audio/mp4'}})
    }
    assert.equal(init.headers.apikey,'qa-public');assert.equal(init.headers.Authorization,'Bearer qa-token')
    if(url.endsWith('/ieum_get_owned_upload'))return lookupDenied?new Response('private',{status:403}):
      Response.json({...context,userId:wrongOwner?'44444444-4444-4444-8444-444444444444':user,receipt})
    assert.ok(url.endsWith('/ieum_submit_verified_track'))
    const value=JSON.parse(init.body)
    assert.equal(value.p_duration,0.512,'Client 0.5s is replaced with the actual confirmed PCM length')
    assert.equal(value.p_request_key,'submit-1');assert.equal(value.p_upload_intent_id,intent)
    return Response.json({trackId:'p:lead',submissionStatus:'success',project:{id:'p',seed:'seed',songId:'song',key:'original',
      audioSourceRef:{songId:'song',key:'original',revision:'v1',duration:2,sourceSha256:'a'.repeat(64),backingSha256:'b'.repeat(64)},
      partCount:2,submittedTrackCount:1,revision:2,lifecycle:'recruiting',keyLockedAt:'2026-10-13T00:00:00Z',
      parts:[{id:'lead',participantId:user,requiredRange:{},status:'submitted',trackId:'p:lead'},
        {id:'harmony',participantId:null,requiredRange:{},status:'open',trackId:null}]}})
  }
  const request=()=>new Request('https://ieum.example/api/projects/p/parts/lead/tracks',{method:'POST',
    headers:{Authorization:'Bearer qa-token','Content-Type':'application/json','Idempotency-Key':'submit-1'},
    body:JSON.stringify({uploadIntentId:intent,duration:0.5,syncOffsetMs:0,projectSeed:'seed'})})
  const run=(configuration=env)=>projectLifecycleRequest(request(),{env:configuration,fetchImpl})
  const first=await run();assert.equal((await first.json()).duration,0.512)
  assert.ok(calls.findIndex(url=>url.includes('/storage/'))>calls.findIndex(url=>url.endsWith('/ieum_get_owned_upload')))
  assert.ok(calls.findIndex(url=>url.endsWith('/ieum_submit_verified_track'))>calls.findIndex(url=>url.endsWith('/ieum_confirm_original_audio')))
  calls=[]
  assert.equal((await(await run({...env,IEUM_AUDIO_DECODER_PATH:''})).json()).duration,0.512)
  assert.ok(calls.some(url=>url.includes('/storage/')));assert.ok(!calls.some(url=>url.endsWith('/ieum_confirm_original_audio')))
  for(const mode of ['missing','mismatch']){
    calls=[];storageMode=mode
    await assert.rejects(run(),e=>e.code===(mode==='missing'?'UPLOAD_OBJECT_MISSING':'UPLOAD_OBJECT_MISMATCH'))
    assert.ok(!calls.some(url=>url.endsWith('/ieum_submit_verified_track')))
  }
  storageMode='present';calls=[];wrongOwner=true
  await assert.rejects(run(),e=>e.code==='INVALID_PROJECT_RESPONSE');assert.ok(!calls.some(url=>url.includes('/storage/')))
  wrongOwner=false;lookupDenied=true;calls=[]
  assert.equal((await run().catch(projectLifecycleErrorResponse)).status,403)
  assert.ok(!calls.some(url=>url.includes('/storage/')))
  lookupDenied=false;receipt=null;calls=[]
  await assert.rejects(run({...env,IEUM_AUDIO_DECODER_PATH:''}),e=>e.code==='AUDIO_DECODER_NOT_CONFIGURED')
  assert.ok(!calls.some(url=>url.endsWith('/ieum_submit_verified_track')))
  calls=[];confirmationFails=true
  const failed=await run().catch(projectLifecycleErrorResponse)
  assert.equal(failed.status,503);assert.deepEqual(await failed.json(),{error:{code:'PROJECT_UNAVAILABLE'}})
  assert.ok(!calls.some(url=>url.endsWith('/ieum_submit_verified_track')))
  assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'),sha256)
  console.log('PASS submission API + real AAC decode: verified user/owned intent before Storage, canonical duration, secret-only receipt write, user-only submission, version-preserving retry with byte recheck, missing/mismatched/foreign/unconfigured/DB failure blocks submit. Injected remote HTTP, not live collaboration.')
}finally{
  const target=resolve(directory)
  assert.ok(target.startsWith(resolve(tmpdir())+sep) && target.split(sep).at(-1).startsWith('ieum-submission-audio-'))
  await rm(target,{recursive:true,force:true})
}
