import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {createServiceSession} from '../src/serviceSession.js'
import {loadRemoteOwnedVoiceImage,requestOwnedVoiceImageChunk} from '../src/ownedVoiceImages.js'
import {fixturePng} from './png-fixture.mjs'
const png=fixturePng(),hash=bytes=>createHash('sha256').update(bytes).digest('hex'),ref={id:'private-result',revision:'r1',outputSha256:hash(png)}
let mode='normal',calls=0,hold=null,release=null,cancelled=0
const session=createServiceSession({baseUrl:'https://ieum.example/api',fetchImpl:async(url,init)=>{
  if(url.endsWith('/capabilities'))return Response.json({contractVersion:'ieum-service-v1',mode:'remote',authenticated:true,sharedProjects:true})
  if(url.endsWith('/me/session'))return Response.json({authenticated:true,user:{id:'11111111-1111-4111-8111-111111111111'}})
  const q=new URL(url).searchParams,offset=Number(q.get('offset')),length=Number(q.get('length'))
  assert.equal(init.headers.Authorization,'Bearer test-token');assert.equal(q.get('id'),ref.id);assert.equal(q.get('revision'),ref.revision)
  calls++;if(hold)await hold
  let bytes=png.subarray(offset,offset+length)
  if(mode==='tamper' && offset>0){bytes=Buffer.from(bytes);bytes[0]^=1}
  if(mode==='short')bytes=bytes.subarray(0,bytes.length-1)
  const stream=new ReadableStream({start(controller){controller.enqueue(mode==='long'?Buffer.concat([bytes,Buffer.alloc(1)]):bytes);controller.close()},cancel(){cancelled++}})
  return new Response(stream,{status:mode==='status'?200:206,headers:{'Content-Type':'application/octet-stream',
    'Content-Length':String(Math.min(length,png.length-offset)),
    'Content-Range':`bytes ${mode==='range'?offset+1:offset}-${Math.min(offset+length,png.length)-1}/${png.length}`,
    'X-Content-SHA256':mode==='hash' && offset>0?'f'.repeat(64):ref.outputSha256}})
}})
await session.connect('test-token')
const opts=()=>({session,kind:'personal-image',ref, maxBytes:8388608})
const saved=await loadRemoteOwnedVoiceImage(opts());assert.equal(hash(Buffer.from(await saved.blob.arrayBuffer())),ref.outputSha256);assert.equal(calls,2)
for(mode of ['range','status','short','long','tamper','hash'])await assert.rejects(loadRemoteOwnedVoiceImage(opts()))
mode='normal';const before=calls
await assert.rejects(loadRemoteOwnedVoiceImage({...opts(),maxBytes:33}));assert.equal(calls,before+1)
await assert.rejects(requestOwnedVoiceImageChunk({baseUrl:'https://ieum.example/api/',getAccessToken:()=>null,fetchImpl:()=>{throw new Error('must not fetch')},selector:{kind:'personal-image',id:ref.id,revision:ref.revision},offset:0,length:1}),e=>e.code==='AUTH_REQUIRED')
const fixed=opts();hold=new Promise(resolve=>{release=resolve});const waiting=loadRemoteOwnedVoiceImage(fixed)
while(calls===before+1)await new Promise(resolve=>setImmediate(resolve))
fixed.ref={...ref,id:'changed'};release();hold=null
assert.equal(hash(Buffer.from(await (await waiting).blob.arrayBuffer())),ref.outputSha256)
const preceding=calls;hold=new Promise(resolve=>{release=resolve});const logout=loadRemoteOwnedVoiceImage(opts())
while(calls===preceding)await new Promise(resolve=>setImmediate(resolve))
session.disconnect();release();hold=null;await assert.rejects(logout,e=>e.code==='SESSION_CHANGED')
assert.ok(cancelled>0,'Invalid response stream is cancelled')
console.log('PASS bounded authenticated multi-chunk image transport: byte equality/hash, range/body bounds, tamper, caller snapshot, logout and budget rejection. Test PNG only; no AI, approved image or real service.')
