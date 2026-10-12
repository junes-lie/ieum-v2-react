import assert from 'node:assert/strict'
globalThis.window={AudioContext:class{}}
const {loadProjectBacking,projectAudioReference,assertProjectTrackAudio,recordingEntryPrompt}=await import('../src/projectAudio.js')
const source={kind:'project-arrangement',songId:'original',key:'original-key',revision:'v1',duration:19,sourceSha256:'a'.repeat(64),backingSha256:'b'.repeat(64),backingFile:'/audio/original/backing.mp3'}
let requests=0
const blob=new Blob(['actual loader boundary'])
const load=async(file,hash)=>{requests++;assert.equal(file,source.backingFile);assert.equal(hash,source.backingSha256);return blob}
assert.equal(await loadProjectBacking({id:'legacy'},load),null)
assert.equal(requests,0)
const project={id:'project',songId:'original',key:'original-key',audioSource:source}
assert.equal(await loadProjectBacking(project,load),blob)
for(const change of [{kind:'voice-profile-sample'},{songId:'other'},{key:'other'},{revision:''},{duration:0},{duration:NaN},{sourceSha256:'bad'},{backingSha256:'bad'},{backingFile:'https://example.com/backing'},{backingFile:'/audio/../sample.wav'}]) {
  await assert.rejects(loadProjectBacking({...project,audioSource:{...source,...change}},load))
}
assert.equal(requests,1,'Invalid song/key/source must never request audio')
await assert.rejects(loadProjectBacking(project,async()=>{throw new Error('actual fetch/hash failure')}),/actual fetch\/hash failure/)
console.log('Project backing: legacy no-fetch, explicit arrangement/song/key/revision/hash/path validation and actual loader failure propagation passed.')

const reference=projectAudioReference(project),track={audioSourceRef:reference}
assertProjectTrackAudio(project,[track])
assertProjectTrackAudio({id:'legacy'},[{}])
for(const key of Object.keys(reference))assert.throws(()=>assertProjectTrackAudio(project,[{audioSourceRef:{...reference,[key]:'changed'}}]))
assert.throws(()=>assertProjectTrackAudio(project,[{}]))
assert.deepEqual(projectAudioReference(project),reference)
console.log('Project/Track recording input snapshots reject changed song/key/revision/source/backing; legacy originals preserved.')

const timed={lyrics:[{time:3.5,text:'first lyric'}]}
assert.equal(recordingEntryPrompt(timed,0,'ready'),'첫 가사 · 시작 후 3.5초')
assert.equal(recordingEntryPrompt(timed,1.5,'recording'),'첫 가사까지 2.0초')
assert.equal(recordingEntryPrompt(timed,1.5,'paused'),'첫 가사까지 2.0초 · 일시정지')
assert.equal(recordingEntryPrompt(timed,3.5,'recording'),'지금 첫 가사를 부르세요')
assert.equal(recordingEntryPrompt(timed,4.5,'recording'),'')
assert.equal(recordingEntryPrompt(timed,3.5,'paused'),'')
assert.equal(recordingEntryPrompt(timed,0,'review'),'')
for(const time of [undefined,null,'3',NaN,-1])assert.equal(recordingEntryPrompt({lyrics:[{time}]},0,'recording'),'')
assert.equal(recordingEntryPrompt({},0,'ready'),'')
assert.equal(recordingEntryPrompt({lyrics:[{time:0}]},0,'recording'),'지금 첫 가사를 부르세요')
console.log('First lyric entry: actual timestamp only, paused timeline, exact boundary, absent/invalid data and Review exclusions passed.')
