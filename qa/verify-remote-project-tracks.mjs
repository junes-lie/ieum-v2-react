import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {loadRemoteProjectTracks} from '../src/remoteProjectTracks.js'
const bytes=new Uint8Array([1,2,3,4]),sha256=createHash('sha256').update(bytes).digest('hex'),person='11111111-1111-4111-8111-111111111111'
const source={songId:'song',key:'original',revision:'v1',duration:20,sourceSha256:'a'.repeat(64),backingSha256:'b'.repeat(64)}
const project={id:'p',songId:'song',key:'original',partCount:2,submittedTrackCount:1,audioSourceRef:source,
  parts:[{id:'lead',status:'submitted',trackId:'p:lead',participantId:person},{id:'harmony',status:'open',trackId:null,participantId:null}]}
const track={id:'p:lead',projectId:'p',partId:'lead',participantId:person,submitted:true,kind:'submitted-track',duration:20,syncOffsetMs:0,
  size:4,sha256,contentType:'audio/webm',audioSourceRef:source,audioUrl:'https://example.supabase.co/storage/v1/object/sign/private-audio/originals/22222222-2222-4222-8222-222222222222?token=qa-read',expiresIn:600}
let manifest={project,tracks:[track]},current=true,calls=0,mode='valid'
const session={run:operation=>operation({service:{loadProjectTracks:async()=>manifest},assertCurrent:()=>{if(!current)throw Object.assign(new Error('changed'),{code:'SESSION_CHANGED'})}})}
const fetchImpl=async(url,options)=>{
  calls++;assert.equal(url,track.audioUrl);assert.equal(options.headers,undefined);assert.equal(options.credentials,'omit')
  assert.equal(options.redirect,'error');assert.equal(options.referrerPolicy,'no-referrer')
  if(mode==='logout')current=false
  const data=mode==='mismatch'?new Uint8Array([9,2,3,4]):mode==='oversize'?new Uint8Array([1,2,3,4,5]):bytes
  return new Response(data,{headers:{'Content-Type':mode==='wrong-mime'?'text/plain':'audio/webm'}})
}
const base={session,projectId:'p',storageOrigin:'https://example.supabase.co',maxTotalBytes:1024,fetchImpl}
const loaded=await loadRemoteProjectTracks(base)
assert.deepEqual(new Uint8Array(await loaded.tracks.lead.blob.arrayBuffer()),bytes)
assert.equal(loaded.tracks.lead.audioUrl,undefined);assert.equal(loaded.tracks.lead.expiresIn,undefined)
for(const next of ['mismatch','oversize','wrong-mime','logout']){
  mode=next;current=true
  await assert.rejects(loadRemoteProjectTracks(base),e=>e.code===(next==='logout'?'SESSION_CHANGED':next==='wrong-mime'?'TRACK_DOWNLOAD_FAILED':'TRACK_SOURCE_MISMATCH'))
}
mode='valid';current=true
for(const patch of [{audioUrl:'https://attacker.invalid/private?token=a'},{audioSourceRef:{...source,key:'other'}},{kind:'temporary-recording'},
  {submitted:false},{audioUrl:track.audioUrl+'&token=b'},{syncOffsetMs:20000}]){
  manifest={project,tracks:[{...track,...patch}]};const before=calls
  await assert.rejects(loadRemoteProjectTracks(base),e=>e.code==='INVALID_TRACK_MANIFEST');assert.equal(calls,before)
}
manifest={project,tracks:[track]};const before=calls
await assert.rejects(loadRemoteProjectTracks({...base,maxTotalBytes:3}),e=>e.code==='TRACK_MEMORY_BUDGET_EXCEEDED')
await assert.rejects(loadRemoteProjectTracks({...base,maxTotalBytes:undefined}),e=>e.code==='TRACK_MEMORY_BUDGET_REQUIRED')
assert.equal(calls,before)
manifest={project:{...project,submittedTrackCount:0,parts:project.parts.map(part=>({...part,status:'open',trackId:null,participantId:null}))},tracks:[]}
assert.deepEqual((await loadRemoteProjectTracks(base)).tracks,{})
assert.equal(calls,before)
console.log('PASS private remote Track load: exact SHA/size/MIME Blob, source/key/submission match, signed-origin/token checks, no bearer/cookie/referrer/redirect, session logout denial, no stale URL cache or local writes, explicit aggregate memory budget. Injected network, not real microphone/Storage/App playback.')
