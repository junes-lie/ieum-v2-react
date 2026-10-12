import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp,readFile,rm } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join,resolve,sep } from 'node:path'
import { createSupabaseAudioStorage } from '../server/audioStorage.js'
import { verifyOwnedOriginalAudio } from '../server/originalAudioVerification.js'

assert.ok(process.env.IEUM_QA_FFMPEG_PATH && process.env.IEUM_PGLITE_ROOT,'Existing isolated PGlite and FFmpeg runtimes are required; no installation/remote migration')
const require=createRequire(join(process.env.IEUM_PGLITE_ROOT,'package.json'))
const {PGlite}=require('@electric-sql/pglite'),db=new PGlite()
const directory=await mkdtemp(join(tmpdir(),'ieum-audio-receipt-')),file=join(directory,'original.mp4')
const users=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222']
const asUser=async id=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated')}
const callReceipt=async args=>(await db.query('select public.ieum_confirm_original_audio($1,$2,$3::uuid,$4::uuid,$5::uuid,$6::jsonb) as result',
  [args.p_project_id,args.p_part_id,args.p_user_id,args.p_upload_intent_id,args.p_object_id,JSON.stringify(args.p_receipt)])).rows[0].result
try {
  await new Promise((resolve,reject)=>{
    const child=spawn(process.env.IEUM_QA_FFMPEG_PATH,['-nostdin','-loglevel','error','-threads','1','-filter_threads','1',
      '-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=0.5','-threads','1','-c:a','aac',file],
    {shell:false,windowsHide:true,stdio:['ignore','ignore','ignore']})
    child.on('error',reject);child.on('close',code=>code===0?resolve():reject(new Error('Fixture generation failed')))
  })
  const bytes=await readFile(file),sha256=createHash('sha256').update(bytes).digest('hex')
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;
    create table auth.users(id uuid primary key);insert into auth.users values('${users[0]}'),('${users[1]}');
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`)
  for(const name of ['project_tracks','track_uploads','verified_audio_receipts','owned_upload_lookup'])
    await db.exec(await readFile(new URL(`../server/migrations/20261013_${name}.sql`,import.meta.url),'utf8'))
  await db.exec(`insert into public.ieum_projects(id,seed,song_id,project_key,audio_source_ref,part_count) values('p','seed','qa-song','original','{}',2);
    insert into public.ieum_project_parts values('p','lead','${users[0]}','{}'),('p','harmony','${users[1]}','{}');`)
  await asUser(users[0]);await db.query("select public.ieum_start_project_recording('p','lead')")
  const storage=createSupabaseAudioStorage({env:{IEUM_STORAGE_PROVIDER:'supabase',IEUM_SUPABASE_URL:'https://example.supabase.co',
    IEUM_SUPABASE_SECRET_KEY:'sb_secret_qa_only',IEUM_AUDIO_BUCKET:'private-audio'},fetchImpl:async url=>
    url.endsWith('/bucket/private-audio')?Response.json({id:'private-audio',public:false}):
      new Response(bytes,{headers:{'Content-Type':'audio/mp4','Content-Length':String(bytes.length)}})})
  let firstArgs,firstResult
  for(let index=0;index<2;index++){
    const partId=index?'harmony':'lead'
    await asUser(users[index])
    const intent=(await db.query("select public.ieum_prepare_track_upload('p',$1,$2,$3,$4,'audio/mp4') as result",
      [partId,'upload-'+index,bytes.length,sha256])).rows[0].result
    const context={projectId:'p',partId,userId:users[index],uploadIntentId:intent.uploadIntentId,objectId:intent.objectId,size:bytes.length,sha256,contentType:'audio/mp4'}
    const lookedUp=(await db.query("select public.ieum_get_owned_upload('p',$1,$2) as result",[partId,intent.uploadIntentId])).rows[0].result
    assert.deepEqual(lookedUp,{...context,receipt:null})
    await asUser(users[1-index])
    await assert.rejects(db.query("select public.ieum_get_owned_upload('p',$1,$2)",[partId,intent.uploadIntentId]),e=>e.code==='PT403')
    await asUser(users[index])
    await db.exec('reset role;set role service_role')
    let args
    const result=await verifyOwnedOriginalAudio({context,storage,decoderOptions:{executable:process.env.IEUM_QA_FFMPEG_PATH,maxDurationSeconds:2},
      persistReceipt:async value=>{args=value;return callReceipt(value)}})
    assert.equal(result.receipt.duration,0.512)
    assert.match(result.receipt.decoderVersion,/^ffmpeg version /);assert.match(result.receipt.decoderSha256,/^[a-f0-9]{64}$/)
    assert.deepEqual(await callReceipt(args),result)
    await assert.rejects(callReceipt({...args,p_receipt:{...args.p_receipt,decoderSha256:'0'.repeat(64)}}),e=>e.code==='PT409')
    await assert.rejects(callReceipt({...args,p_user_id:users[1-index]}),e=>e.code==='PT409')
    for(const bad of [{...args.p_receipt,duration:0.5},{...args.p_receipt,decodedFrames:1.5},{...args.p_receipt,extra:true},{...args.p_receipt,decoderVersion:null}])
      await assert.rejects(callReceipt({...args,p_receipt:bad}),e=>e.code==='PT400')
    await db.exec('reset role')
    assert.equal((await db.query('select count(*)::int n from public.ieum_submitted_tracks')).rows[0].n,index)
    assert.equal((await db.query('select count(*)::int n from public.ieum_mix_jobs')).rows[0].n,0)
    const row=(await db.query('select verified_duration,audio_receipt from public.ieum_upload_intents where id=$1',[intent.uploadIntentId])).rows[0]
    assert.equal(row.verified_duration,result.receipt.duration);assert.deepEqual(row.audio_receipt,result.receipt)
    await asUser(users[index])
    await assert.rejects(callReceipt(args),e=>e.code==='42501')
    await assert.rejects(db.query("select public.ieum_submit_verified_track('p',$1,$2,$3,0.5,0)",[partId,intent.uploadIntentId,'submit-'+index]),e=>e.code==='PT409')
    const submitted=(await db.query("select public.ieum_submit_verified_track('p',$1,$2,$3,$4,0) as result",
      [partId,intent.uploadIntentId,'submit-'+index,result.receipt.duration])).rows[0].result
    assert.equal(submitted.project.submittedTrackCount,index+1)
    assert.equal(submitted.project.lifecycle,index?'mixing':'recruiting')
    if(index===0){firstArgs=args;firstResult=result}
  }
  await db.exec('reset role;set role service_role')
  assert.deepEqual(await callReceipt(firstArgs),firstResult,'Lost verification response can be retried after submission/Mix queuing')
  await db.exec('reset role')
  assert.equal((await db.query('select count(*)::int n from public.ieum_mix_jobs')).rows[0].n,1)
  assert.equal((await db.query("select lifecycle from public.ieum_projects where id='p'")).rows[0].lifecycle,'mixing')
  await db.exec('set role anon');await assert.rejects(callReceipt(firstArgs),e=>e.code==='42501')
  let writes=0
  await assert.rejects(verifyOwnedOriginalAudio({context:{projectId:'p',partId:'lead',userId:users[0],uploadIntentId:firstArgs.p_upload_intent_id,
    objectId:firstArgs.p_object_id,size:bytes.length,sha256,contentType:'audio/mp4'},storage:{verifyOriginalAudio:async()=>({...firstResult.receipt,sha256:'0'.repeat(64)})},
    persistReceipt:async()=>{writes++}}),e=>e.code==='INVALID_AUDIO_RECEIPT')
  assert.equal(writes,0)
  console.log('PASS real AAC decode + injected private Storage + isolated PostgreSQL receipt: binary/version/hash/frame lineage, service-only immutable confirmation, retries, forged/mismatched rejection, no verification-only Track/Mix, canonical duration submit and final-submit-only Mix. Not live Auth/Storage/hosted runtime.')
}finally{
  await db.close()
  const target=resolve(directory)
  assert.ok(target.startsWith(resolve(tmpdir())+sep) && target.split(sep).at(-1).startsWith('ieum-audio-receipt-'))
  await rm(target,{recursive:true,force:true})
}
