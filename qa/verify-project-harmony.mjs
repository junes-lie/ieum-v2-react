import assert from 'node:assert/strict'
import {evaluateProjectHarmony,evaluatePartFit,PROJECT_HARMONY_METHOD} from '../src/matching.js'
const features=(brightness,roughness)=>({version:'ieum-basic-voice-v5',pitchAnalysisVersion:'normalized-difference-v1',pitchFrameLength:4096,fingerprint:`${brightness}-${roughness}`,brightness,roughness})
const hash=letter=>letter.repeat(64)
const parts=[{id:'a',name:'Lead',participantId:'one',participant:'민'},{id:'b',name:'Harmony',participantId:'two',participant:'윤'},{id:'c',name:'Tenor',participantId:'self',participant:'나'}]
const project={id:'project',songId:'song',key:'원키',audioSource:{kind:'project-arrangement',songId:'song',key:'원키',sourceSha256:hash('d'),backingSha256:hash('e'),duration:22,revision:'registered-v1',vocalGuideFile:'/audio/registered-vocal.mp3',vocalGuideSha256:hash('f'),musicalRole:'메인 멜로디'}}
const song={id:'song',genre:'Pop ballad'}
const track=(partId,participantId,voice,audioSha256)=>({id:`project:${partId}`,projectId:'project',partId,participantId,origin:'live-microphone-recording',kind:'project-track',submissionStatus:'success',features:voice,audioSourceRef:{songId:'song',key:'원키',revision:'registered-v1',sourceSha256:hash('d'),backingSha256:hash('e'),duration:22},sourceProvenance:{audioSha256}})
const tracks={a:track('a','one',features(.2,.8),hash('a')),b:track('b','two',features(.8,.2),hash('b')),c:track('c','self',features(1,1),hash('c'))}
const profile={sampleFeatures:features(.6,.5),roles:['Main'],genres:['팝'],preferredSongIds:[]}
const input={profile,parts,tracks,project,song,selectedPart:parts[2],currentUserId:'self'}
const before=structuredClone(input)
const result=evaluateProjectHarmony(input)
assert.equal(result.method,PROJECT_HARMONY_METHOD)
assert.equal(result.status,'compared');assert.equal(result.compared,2)
assert.deepEqual(result.metrics.timbre.target,{brightness:.5,roughness:.5},'Compare against the PROJECT aggregate, not independent person pairs')
assert.equal(result.metrics.timbre.score,95)
assert.equal(result.metrics.role.score,100,'Registered unison arrangement declares melody; no pitch-register inference')
assert.equal(result.metrics.taste.score,50,'One of the two project genre tags matches')
assert.equal(result.score,82,'Equal mean of the three available reference indices, rounded only for display')
assert.deepEqual(result.coverage,{available:3,total:3,keys:['timbre','role','taste']})
assert.equal(result.provenance.target.kind,'submitted-track-aggregate')
assert.ok(!result.reasons[0][1].includes('민')&&!result.reasons[0][1].includes('윤'),'Project-level explanation does not turn into a person comparison')
assert.deepEqual(input,before,'Profile, Project, Tracks and registration metadata stay immutable')

const changedDistribution={...tracks,a:track('a','one',features(.4,.6),hash('a')),b:track('b','two',features(.6,.4),hash('b'))}
assert.equal(evaluateProjectHarmony({...input,tracks:changedDistribution}).metrics.timbre.score,95,'Same project centroid gives the same project comparison')
const opposite=evaluateProjectHarmony({...input,profile:{...profile,sampleFeatures:features(0,0)},tracks:{a:track('a','one',features(1,1),hash('a'))}})
assert.equal(opposite.metrics.timbre.score,0,'Descriptor distance covers the full declared 0–100 scale')
const same=evaluateProjectHarmony({...input,profile:{...profile,sampleFeatures:features(.5,.5)}})
assert.equal(same.metrics.timbre.score,100)
const dedup=evaluateProjectHarmony({...input,tracks:{...tracks,b:{...tracks.a,id:'project:b',partId:'b',participantId:'two'}}})
assert.equal(dedup.compared,1,'Identical audio bytes copied to two Parts count as one source')
assert.deepEqual(dedup.metrics.timbre.target,{brightness:.2,roughness:.8})
assert.deepEqual(result.provenance.target.audioSha256,[hash('a'),hash('b')],'The current user does not compare their own submitted Track to their sample')

const reference={kind:'project-vocal-reference',features:features(.6,.5),projectId:'project',songId:'song',key:'원키',revision:'registered-v1',audioSha256:hash('f'),sourceFile:'/audio/registered-vocal.mp3'}
const referenceResult=evaluateProjectHarmony({...input,tracks:{},projectReference:reference})
assert.equal(referenceResult.metrics.timbre.score,100)
assert.equal(referenceResult.provenance.target.kind,'project-vocal-reference')
assert.match(referenceResult.reasons[0][1],/등록된 보컬 가이드/)
assert.equal(evaluateProjectHarmony({...input,projectReference:reference}).metrics.timbre.score,95,'Actual project Track aggregate takes precedence over a guide')
for(const patch of [{projectId:'other'},{songId:'other'},{key:'D'},{revision:'old'},{audioSha256:hash('e')},{sourceFile:'/wrong.mp3'},{kind:'mix'},{features:features(NaN,.5)}]){
 assert.equal(evaluateProjectHarmony({...input,tracks:{},projectReference:{...reference,...patch}}).metrics.timbre.score,null,'Foreign/stale/invalid reference cannot supply a real timbre index')
}
assert.equal(evaluateProjectHarmony({...input,tracks:{},projectReference:reference,song:{...song,id:'other'}}).metrics.timbre.score,null)
assert.equal(evaluateProjectHarmony({...input,tracks:{},projectReference:reference,project:{...project,audioSource:undefined}}).metrics.timbre.score,null)
for(const patch of [{kind:'voice-sample'},{songId:'other'},{key:'D'}])assert.equal(evaluateProjectHarmony({...input,tracks:{},projectReference:reference,project:{...project,audioSource:{...project.audioSource,...patch}}}).metrics.timbre.score,null,'Registered arrangement must match the active project and cannot be a Profile excerpt')
for(const patch of [{demo:true},{origin:'presentation-provided-vocal-fixture'},{projectId:'other'},{partId:'wrong'},{id:'wrong'},{participantId:'wrong'},{submissionStatus:'pending'},{kind:'recording-draft'},{features:features(Infinity,.2)},{sourceProvenance:{audioSha256:'not-a-hash'}},{audioSourceRef:null},{audioSourceRef:{...tracks.a.audioSourceRef,key:'D'}},{audioSourceRef:{...tracks.a.audioSourceRef,revision:'stale'}},{audioSourceRef:{...tracks.a.audioSourceRef,sourceSha256:hash('f')}}]){
 assert.equal(evaluateProjectHarmony({...input,tracks:{a:{...tracks.a,...patch}}}).compared,0,'Only identity-bound, real submitted analysis contributes to the project')
}
assert.equal(evaluateProjectHarmony({...input,tracks:{a:{...tracks.a,demo:true}},projectReference:reference}).metrics.timbre.score,100,'Presentation fixtures never masquerade as independent measured people; declared guide fallback is explicit')

const noPrefs=evaluateProjectHarmony({...input,profile:{sampleFeatures:features(.6,.5)}})
assert.equal(noPrefs.score,95,'Unconfigured optional preferences do not penalize the profile')
assert.equal(noPrefs.status,'partial')
assert.deepEqual(noPrefs.coverage,{available:1,total:3,keys:['timbre']})
assert.equal(noPrefs.metrics.role.score,null);assert.equal(noPrefs.metrics.taste.score,null)
assert.equal(noPrefs.metrics.role.status,'unconfigured')
const noTarget=evaluateProjectHarmony({...input,tracks:{},project:{...project,audioSource:undefined}})
assert.equal(noTarget.metrics.timbre.score,null)
assert.equal(noTarget.metrics.role.score,null,'SATB register alone cannot decide Main vs Harmony')
assert.equal(noTarget.metrics.taste.score,50,'Project-song preference remains independently available')
assert.equal(noTarget.coverage.available,1)
assert.equal(noTarget.score,null,'Role or taste alone cannot masquerade as an acoustic project harmony index')
assert.equal(noTarget.status,'insufficient')
assert.equal(evaluateProjectHarmony({...input,profile:{...profile,roles:['화음·코러스']}}).metrics.role.score,0)
assert.equal(evaluateProjectHarmony({...input,selectedPart:{...parts[2],musicalRole:'Harmony'},profile:{...profile,roles:['화음·코러스']}}).metrics.role.score,100,'Part-specific role overrides the arrangement default')
assert.equal(evaluateProjectHarmony({...input,selectedPart:null}).metrics.role.score,null)
assert.equal(evaluateProjectHarmony({...input,profile:{...profile,genres:[],preferredSongIds:['song']}}).metrics.taste.score,100,'Explicitly selected project song is a direct positive preference')
assert.equal(evaluateProjectHarmony({...input,profile:{...profile,genres:[],preferredSongIds:['other-song']}}).metrics.taste.score,null,'A song omitted from an optional list is not a dislike')
assert.equal(evaluateProjectHarmony({...input,song:{...song,genre:'Dream pop'}}).metrics.taste.score,100,'Catalogue compound genres match saved Korean selectable genres')
assert.equal(evaluateProjectHarmony({...input,song:{...song,genre:'Jazz'}}).metrics.taste.score,0,'Declared non-overlap is observable and does not block participation')
assert.equal(evaluateProjectHarmony({...input,profile:{...profile,genres:[],taste:['Acoustic']},project:{...project,taste:['acoustic']}}).metrics.taste.score,100)
for(const invalid of [{demo:true,sampleFeatures:features(.6,.5)}, {sampleFeatures:features(NaN,.5)}, {sampleFeatures:{...features(.6,.5),fingerprint:'demo-profile-registered-v1'}}, {sampleFeatures:{...features(.6,.5),brightness:1.1}}, {}]){
 const value=evaluateProjectHarmony({...input,profile:invalid,projectReference:reference})
 assert.equal(value.status,'insufficient');assert.equal(value.score,null);assert.equal(value.coverage.available,0)
 for(const metric of Object.values(value.metrics))assert.equal(metric.score,null,'No real matching index before an actual usable sample')
}
// The analyser still returns normalized spectral fields for silent PCM; those
// fields must never manufacture a real harmony index.
const {analyzeAudioBuffer}=await import('../src/voiceAnalysis.js')
const silence=new Float32Array(32000)
const silentFeatures=analyzeAudioBuffer({duration:4,length:silence.length,sampleRate:8000,numberOfChannels:1,getChannelData:()=>silence})
assert.equal(silentFeatures.rms,0)
const silentProfile=evaluateProjectHarmony({...input,profile:{...profile,sampleFeatures:silentFeatures},projectReference:reference})
assert.equal(silentProfile.score,null)
assert.equal(silentProfile.coverage.available,0)
assert.match(silentProfile.reasons[0][1],/무음/)
for(const patch of [{rms:.0005},{peak:.001},{rms:NaN},{peak:Infinity},{durationSec:2.99},{durationSec:NaN}]){
 const value=evaluateProjectHarmony({...input,profile:{...profile,sampleFeatures:{...features(.6,.5),...patch}},projectReference:reference})
 assert.equal(value.score,null,'Explicit inaudible levels or a too-short own sample cannot produce an index')
 assert.equal(value.coverage.available,0)
}
assert.equal(evaluateProjectHarmony({...input,profile:{...profile,sampleFeatures:{...features(.6,.5),rms:.001,peak:.01,durationSec:3}}}).score,82,'A three-second audible own sample is usable')
assert.equal(evaluateProjectHarmony({...input,tracks:{a:track('a','one',{...features(.2,.8),durationSec:.5,rms:.005,peak:.02},hash('a'))}}).compared,1,'The own-sample minimum does not incorrectly reject a shorter real submitted Track')
assert.equal(evaluateProjectHarmony({...input,tracks:{a:track('a','one',silentFeatures,hash('a'))}}).metrics.timbre.score,null,'Silent project Tracks do not become a reference')
assert.equal(evaluateProjectHarmony({...input,tracks:{},projectReference:{...reference,features:silentFeatures}}).score,null,'Silent registered guide analysis is unusable too')
assert.equal(evaluateProjectHarmony({profile:null}).score,null,'Missing empty inputs do not crash the Detail render')
assert.equal(evaluatePartFit({rangeData:{lowMidi:48,highMidi:72},part:{range:'C3–C5'}}).eligible,true,'Part range feasibility remains independent from project harmony')
console.log('PASS project aggregate timbre/reference provenance, declared musical roles and project-song taste; missing/demo data excluded; optional preferences unpenalized; deterministic 0–100 reference indices and immutable input data')

// Keep approved, explicit demo examples separate from real registration.
const {demoProfile,demoMatchPreview}=await import('../src/demoSession.js')
const demo=demoProfile(),snapshot=structuredClone(demo)
assert.equal(demo.matchingPreview.parts.tenor,96)
assert.equal(demoMatchPreview(demo).overall,92)
assert.equal(demoMatchPreview(demo,'luna').overall,94)
assert.equal(demoMatchPreview({...demo,demo:false}),null)
assert.equal(demoMatchPreview({sampleFeatures:demo.sampleFeatures,rangeData:demo.rangeData}),null)
assert.equal(evaluateProjectHarmony({...input,profile:demo}).score,null)
assert.deepEqual(demo,snapshot)
for(const score of Object.values(demoMatchPreview(demo)))assert.ok(score>=0&&score<=100)
assert.ok(demo.roles.length&&demo.genres.length&&demo.taste.length&&demo.sampleUrl&&demo.sampleFeatures)
console.log('PASS registered demo96/92 remains an explicit example; copied demo descriptors cannot produce a real-project index')
