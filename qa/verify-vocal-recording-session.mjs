import assert from 'node:assert/strict'
globalThis.window={AudioContext:class{}}
const {createVocalRecordingSession}=await import('../src/vocalRecordingSession.js')
for(const route of ['sample','profile-registration-project','registered-project']){
 let volume=.5,state='inactive',release
 const calls=[];const take={blob:new Blob(['captured']),duration:4}
 const engine={
  recordingGuides:({vocalAvailable,parts=[]})=>({backing:true,backingVolume:1,parts:[...parts],vocalVolume:vocalAvailable?volume:0}),
  setGuideVolume:v=>volume=Math.min(1,Math.max(0,v)),getRecordingTimeline:()=>({state}),
  startRecording:async options=>{calls.push(['start',options]);await new Promise(r=>release=r);state='recording'},
  updateRecordingGuides:g=>{engine.lastGuides=g;calls.push(['volume',g.vocalVolume])},
  pauseRecording:()=>{state='paused';calls.push(['pause'])},resumeRecording:()=>{state='recording';calls.push(['resume'])},
  stopRecording:async()=>{state='inactive';calls.push(['stop']);return take},
  cancelRecording:()=>{state='inactive';calls.push(['cancel'])},stopMicrophone:()=>calls.push(['release-mic'])
 }
 const session=createVocalRecordingSession(engine)
 const pending=session.start({vocalGuideBlob:new Blob(['guide']),guideTracks:[{blob:new Blob(['should not play'])}]})
 assert.equal(await session.start({}),false,'Duplicate start ignored')
 assert.deepEqual(calls[0][1].guideTracks,[],route+' must never start an independent participant layer')
 session.setVolume(0);release();assert.equal(await pending,true)
 assert.deepEqual(calls.at(-1),['volume',0],route+' pending zero volume survives startup')
 session.pause();session.setVolume(.25);assert.deepEqual(calls.at(-1),['volume',.25])
 session.resume();session.setVolume(0);assert.deepEqual(calls.at(-1),['volume',0])
 assert.equal(await session.stop(),take,'Original take handed to existing persistence')
 const second=session.start({vocalGuideBlob:new Blob(['guide'])});session.cancel();release();assert.equal(await second,false,'Cancelled startup cannot enter recording')
 assert.equal(state,'inactive')
 const participant={partIndex:0,blob:new Blob(['participant'])}
 const monitored=session.start({vocalGuideBlob:new Blob(['guide']),monitoringTracks:[participant],monitorParts:[true,false]})
 assert.deepEqual(calls.at(-1)[1].guideTracks,[participant])
 assert.deepEqual(calls.at(-1)[1].guides.parts,[true,false])
 release();await monitored
 session.setParts([false,false]);assert.deepEqual(engine.lastGuides.parts,[false,false])
 session.setVolume(.25);assert.deepEqual(engine.lastGuides.parts,[false,false],'Volume does not turn participant switches back on')
 session.pause();session.setParts([true,false]);assert.deepEqual(engine.lastGuides.parts,[true,false])
 session.resume();await session.stop()
 console.log('PASS '+route+': common start guard, no participant overlay, zero during start/live, pause/resume, original stop result, cancellation')
}
