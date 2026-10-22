import assert from 'node:assert/strict'
import {evaluateProjectHarmony,evaluatePartFit} from '../src/matching.js'
const features=(brightness,roughness)=>({version:'ieum-basic-voice-v5',pitchAnalysisVersion:'normalized-difference-v1',pitchFrameLength:4096,brightness,roughness})
const parts=[{id:'a',name:'Lead',participantId:'other',participant:'민'},{id:'b',name:'Harmony',participantId:'self',participant:'나'}]
const tracks={a:{features:features(.4,.6),preferences:{genres:['팝'],taste:['잔잔함']}}}
const profile={sampleFeatures:features(.6,.5),genres:['pop'],taste:['잔잔함']}
const input={profile,parts,tracks,selectedPart:{id:'b',name:'Harmony'},currentUserId:'self'}
const before=structuredClone(input)
const result=evaluateProjectHarmony(input)
assert.equal(result.status,'compared');assert.equal(result.compared,1)
assert.match(result.reasons[0][1],/밝기 차이 20, 거칠기 차이 10/)
assert.match(result.reasons[2][1],/팝.*잔잔함/)
assert.equal('score' in result,false,'Descriptor deltas are not an invented compatibility score')
assert.deepEqual(input,before,'Comparison never changes stored Profile or Track data')
assert.equal(evaluateProjectHarmony({...input,profile:{demo:true}}).status,'insufficient')
assert.match(evaluateProjectHarmony({...input,profile:{demo:true}}).reasons[0][1],/시연 프로필.*실제 녹음 분석값/)
assert.equal(evaluateProjectHarmony({...input,tracks:{}}).compared,0)
assert.match(evaluateProjectHarmony({...input,tracks:{}}).reasons[0][1],/기존 참여자의 제출 Track/)
assert.equal(evaluateProjectHarmony({...input,profile:{sampleFeatures:{...features(.6,.5),brightness:NaN}}}).status,'insufficient')
assert.equal(evaluatePartFit({rangeData:{lowMidi:48,highMidi:72},part:{range:'C3–C5'}}).eligible,true,'Range feasibility remains separate')
console.log('PASS measured descriptors and declared preference comparison; missing/demo/nonfinite inputs have explicit reasons; self excluded; Profile/Tracks preserved; Part Fit independent')
