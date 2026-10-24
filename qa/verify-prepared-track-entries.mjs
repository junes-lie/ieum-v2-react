import assert from 'node:assert/strict'
globalThis.window={}
const {ensureFinaleTracks,isFinaleFixture}=await import('../src/presentationFinale.js')
const {submittedProjectTracks}=await import('../src/projectModel.js')
const {DEMO_SCENARIOS,demoProfile}=await import('../src/demoSession.js')
const {WARM_ARRANGEMENT}=await import('../src/projectMusic.js')
const project={id:'ieum-thousand-years-v7',presentationFinale:true,songId:WARM_ARRANGEMENT.songId,key:WARM_ARRANGEMENT.key,seed:'main',audioSource:WARM_ARRANGEMENT,partIds:['soprano','alto','tenor','bass'],parts:['soprano','alto','tenor','bass'].map(id=>({id,participantId:id==='tenor'?null:'person-'+id,participant:id}))}
const count=records=>submittedProjectTracks(project,Object.fromEntries(records.filter(track=>track.origin==='live-microphone-recording'||isFinaleFixture(track)).map(track=>[track.partId,track]))).length
for(const entry of [...DEMO_SCENARIOS.map(s=>s.id),'saved','direct']){
 let reads=0,writes=0
 const io={loadProvidedAudio:async()=>{reads++;return new Blob(['provided vocal'])},analyzeBlob:async()=>({features:demoProfile().sampleFeatures,duration:22}),saveTracks:async rows=>{writes+=rows.length}}
 const prepared=await ensureFinaleTracks(project,[],io)
 assert.equal(count(prepared),3,entry)
 assert.ok(!prepared.some(t=>t.partId==='tenor'))
 assert.equal(await ensureFinaleTracks(project,prepared,io),prepared,'Reload keeps exact existing records')
 assert.equal(writes,3);assert.equal(reads,1)
 const userTrack={id:project.id+':tenor',projectId:project.id,partId:'tenor',blob:new Blob(['my original voice']),origin:'live-microphone-recording',kind:'project-track',submissionStatus:'success'}
 const draft={id:project.id+':tenor:temporary-recording',projectId:project.id,partId:'tenor',kind:'temporary-recording',blob:new Blob(['my draft'])}
 const restored=await ensureFinaleTracks(project,[userTrack,draft],io)
 assert.equal(count(restored),4,entry+' existing own submission is preserved and missing three are filled')
 assert.equal(restored[0],userTrack);assert.equal(restored[1],draft)
 const existingOther={...userTrack,id:project.id+':alto',partId:'alto'}
 const partial=await ensureFinaleTracks(project,[existingOther,draft],io)
 assert.equal(count(partial),3);assert.equal(partial[0],existingOther);assert.equal(partial[1],draft)
}
const legacy={id:project.id+':soprano',projectId:project.id,partId:'soprano',origin:'local-formant-singing-demo',blob:new Blob(['legacy original'])}
let saved=[]
const repaired=await ensureFinaleTracks(project,[legacy],{loadProvidedAudio:async()=>new Blob(['voice']),analyzeBlob:async()=>({features:demoProfile().sampleFeatures,duration:22}),saveTracks:async records=>{saved=records}})
assert.equal(count(repaired),3,'Legacy synthetic rows cannot suppress preparation')
const archive=saved.find(record=>record.archivedOriginalId===legacy.id)
assert.equal(archive.blob,legacy.blob,'Legacy original Blob is archived, never deleted')
let called=false
await ensureFinaleTracks({...project,presentationFinale:false},[],{loadProvidedAudio:()=>{called=true}})
assert.equal(called,false,'Unrelated projects are not seeded')
console.log('PASS all entry stores: initial 3/4, repeated load idempotent, existing own 1/4 becomes 4/4 without overwrite, partial preparation repaired, drafts and unrelated projects preserved')
