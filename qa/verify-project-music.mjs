import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFile} from 'node:fs/promises'
import {WARM_SONG,WARM_PROJECT,WARM_ARRANGEMENT,WARM_LYRICS,PRESENTATION_PROJECT,PRESENTATION_VOCAL,musicDemoProject} from '../src/projectMusic.js'
const samples=JSON.parse(await readFile(new URL('../src/providedSamples.json',import.meta.url),'utf8'))
for(const sample of samples){
 for(const [file,hash] of [[sample.audioFile,sample.provenance.audioSha256],[sample.backingFile,sample.provenance.backingSha256]]){
  const b=await readFile(new URL('../public'+file,import.meta.url));assert.equal(createHash('sha256').update(b).digest('hex'),hash)
 }
 assert.ok(sample.lyrics.every((line,i)=>line.time>=0&&line.time<sample.duration&&(!i||line.time>sample.lyrics[i-1].time)))
}
for(const [file,hash] of [[WARM_ARRANGEMENT.backingFile,WARM_ARRANGEMENT.backingSha256],[WARM_ARRANGEMENT.referenceFile,WARM_ARRANGEMENT.referenceSha256]]){
 const b=await readFile(new URL('../public'+file,import.meta.url));assert.equal(createHash('sha256').update(b).digest('hex'),hash)
}
const warm=samples.find(s=>s.id===WARM_ARRANGEMENT.lineage.sampleId)
assert.equal(warm.duration+warm.leadInDuration,WARM_ARRANGEMENT.duration)
assert.equal(warm.provenance.sourceSha256,WARM_ARRANGEMENT.sourceSha256)
assert.equal(warm.provenance.leadIn.sha256,WARM_ARRANGEMENT.lineage.leadInSha256)
assert.deepEqual(WARM_LYRICS,warm.lyrics.map(line=>({...line,time:line.time+3})))
assert.equal(WARM_SONG.id,WARM_ARRANGEMENT.songId);assert.equal(WARM_PROJECT.key,WARM_ARRANGEMENT.key)
assert.equal(WARM_PROJECT.parts.length,2);assert.ok(WARM_PROJECT.parts.every(p=>!p.participantId&&p.status==='open'))
assert.equal(musicDemoProject({music:true,musicPartId:'voice-b'}).ownerPartId,'voice-b')
assert.equal(musicDemoProject({}),null)
console.log('PASS all three existing sample/backing SHA256s and timed lyrics; explicit original-key 22s Project arrangement lineage, shifted lyrics, separate melody reference, open two-part unison; no prefilled music Tracks')

const providedVocal=await readFile(new URL('../public'+PRESENTATION_VOCAL.file,import.meta.url))
assert.equal(createHash('sha256').update(providedVocal).digest('hex'),PRESENTATION_VOCAL.sha256)
assert.equal(PRESENTATION_VOCAL.referenceSha256,WARM_ARRANGEMENT.referenceSha256)
assert.equal(PRESENTATION_VOCAL.backingSha256,WARM_ARRANGEMENT.backingSha256)
assert.equal(WARM_SONG.title,'오늘 같은 날')
assert.equal(samples.find(s=>s.id===WARM_ARRANGEMENT.lineage.sampleId).title,WARM_SONG.title)
assert.equal(PRESENTATION_PROJECT.parts.filter(p=>p.status==='submitted').length,1)
assert.equal(PRESENTATION_PROJECT.parts.filter(p=>p.status==='open').length,1)
assert.equal(PRESENTATION_PROJECT.parts[0].participantId,'provided-vocal')
assert.ok(PRESENTATION_PROJECT.parts[0].demo)
console.log('PASS presentation uses same registered song/key/backing and actual original residual vocal; demo disclosure, one populated role and one open role; no duplicate fabricated member vocals')
