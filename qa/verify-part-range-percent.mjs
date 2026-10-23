import assert from 'node:assert/strict'
import {evaluatePartFit,rangeGate} from '../src/matching.js'

const part={range:'C3–C4'} // 48..60 inclusive: 13 semitone notes.
const compare=(lowMidi,highMidi,patch={})=>evaluatePartFit({rangeData:{lowMidi,highMidi},part,...patch})
assert.equal(compare(48,60).coveragePercent,100)
assert.equal(evaluatePartFit({rangeData:{lowMidi:54,highMidi:74},part:{range:'C3–G4'}}).coveragePercent,70,'User capture F#3–D5 covers fourteen of twenty Tenor C3–G4 notes')
assert.equal(compare(36,72).coveragePercent,100,'A wider own range does not dilute coverage of the actual Part')
assert.equal(compare(48,54).coveragePercent,54,'Seven of thirteen required semitone notes are covered')
assert.equal(compare(54,66).coveragePercent,54,'High-side extension cannot compensate for missing lower required notes')
assert.equal(compare(52,56).coveragePercent,38,'A contained five-note measured range covers five of thirteen notes')
assert.equal(compare(48,48).coveragePercent,8,'A valid one-note measurement counts exactly one required note')
assert.equal(compare(60,60).coveragePercent,8,'The highest required endpoint is inclusive too')
assert.equal(compare(36,47).coveragePercent,0)
assert.equal(compare(61,72).coveragePercent,0)
assert.equal(compare(36,48).coveragePercent,8,'Touching an endpoint covers one note rather than no overlap')
assert.equal(compare(36,72).eligible,true)
assert.equal(compare(48,54).eligible,false)
assert.equal(compare(48,54).status,'ineligible','Adding the percentage does not change the existing feasibility result')

const shifted=compare(50,62,{transposeSemitones:2})
assert.equal(shifted.coveragePercent,100)
assert.deepEqual(shifted.requiredRange,{lowMidi:50,highMidi:62})
assert.equal(compare(48,60,{transposeSemitones:2}).coveragePercent,85,'Shift the Part first: eleven of thirteen notes overlap')
assert.equal(compare(48,60,{transposeSemitones:-2}).coveragePercent,85)
const fractional=compare(48.5,60,{transposeSemitones:.5})
assert.equal(fractional.coveragePercent,96,'Do not silently round stored measured or transposed endpoints')
assert.deepEqual(fractional.requiredRange,{lowMidi:48.5,highMidi:60.5})
const singleRequired=compare(60,60,{part:{lowMidi:60,highMidi:60}})
assert.equal(singleRequired.coveragePercent,100,'A valid one-note requirement has a nonzero denominator')

const source={rangeData:{lowMidi:48,highMidi:60,comfortableRange:{lowMidi:52,highMidi:56}},part:{...part,tessitura:{lowMidi:50,highMidi:58}},transposeSemitones:0}
const snapshot=structuredClone(source)
const withTessitura=evaluatePartFit(source)
assert.equal(withTessitura.coveragePercent,100,'Requirement coverage stays distinct from comfortable tessitura fit')
assert.equal(withTessitura.tessituraFit,false)
assert.equal(withTessitura.eligible,false)
assert.match(withTessitura.reasons.at(-1),/주로 부르는 구간/)
assert.deepEqual(source,snapshot,'Computing a display percentage never edits saved measurements or the Part')
assert.deepEqual(rangeGate(source),withTessitura,'The existing alias receives the same additive result')

for(const rangeData of [null,undefined,{}, {lowMidi:NaN,highMidi:60},{lowMidi:48,highMidi:Infinity},{lowMidi:61,highMidi:48}]){
 const result=evaluatePartFit({rangeData,part})
 assert.equal(result.status,'profile-required')
 assert.equal(result.coveragePercent,null,'Unavailable own range is not presented as a real 0%')
}
for(const missingPart of [null,undefined,{}, {lowMidi:NaN,highMidi:60},{lowMidi:48,highMidi:Infinity},{lowMidi:61,highMidi:48}]){
 const result=compare(48,60,{part:missingPart})
 assert.equal(result.status,'unavailable')
 assert.equal(result.coveragePercent,null,'Unknown Part requirement is not replaced with a default requirement')
}
for(const transposeSemitones of [NaN,Infinity,-Infinity])assert.equal(compare(48,60,{transposeSemitones}).coveragePercent,null)
assert.equal(compare(48,60,{part:{lowMidi:1e308,highMidi:1e308},transposeSemitones:1e308}).coveragePercent,null,'Overflowed required endpoints cannot produce NaN/Infinity percentages')
assert.equal(compare(48,60,{part:{lowMidi:-1e308,highMidi:1e308}}).coveragePercent,null,'Overflowed required span is unavailable')
console.log('PASS actual inclusive Part range coverage percent; full/partial/none/single-note/transposition; missing and nonfinite inputs stay null; eligibility, tessitura and original input preserved')
