// Actual inference report validation; no image composition or visual fidelity claim.
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {buildVoiceLayer, projectRecordSignature} from '../src/voiceAnalysis.js'

const reportPath = process.argv[2]
assert.ok(reportPath, 'Pass the actual ai-voice-layer-report.json path')
const report = JSON.parse(await readFile(reportPath, 'utf8'))
assert.equal(report.sameInputSameSeedPixels, true)
assert.equal(report.differentInputDifferentPixels, true)
assert.equal(report.originalModelLatentsPreserved, true)
assert.equal(report.sources.length, 4, 'Four actual source clips are required')
const seed = 'ieum:p0:real-speech'
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const layers = []
const generatedArtifacts = []
for (const [index, source] of report.sources.entries()) {
  const generated = report.results.find(result => result.sourceIndex === index)
  assert.ok(generated, `Missing actual generated output ${index}`)
  assert.equal(generated.sourceSha256, sha(await readFile(source.path)))
  assert.equal(generated.sourceFingerprint, source.analysis.features.fingerprint)
  const artifact = await readFile(generated.path)
  assert.equal(artifact.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  generatedArtifacts.push({sourceIndex:index, sourceSha256:generated.sourceSha256,
    outputFileSha256:sha(artifact), pixelSha256:generated.pixelSha256,
    model:report.model, revision:report.revision, inferenceSeed:report.seed})
  layers.push(buildVoiceLayer(seed, `p0-part-${index}`, source.analysis.features))
}
const originals = structuredClone(layers)
const signatures = [2,3,4].map(count => projectRecordSignature(seed, layers.slice(0,count)))
assert.equal(new Set(signatures).size, 3)
assert.deepEqual(layers, originals, 'Adding layers must preserve existing layer values')
assert.equal(projectRecordSignature(seed, JSON.parse(JSON.stringify(layers))), signatures[2])
assert.notEqual(projectRecordSignature(`${seed}:other`, layers), signatures[2])
assert.equal(new Set(generatedArtifacts.map(item => item.outputFileSha256)).size, 4)
assert.deepEqual(report.blends.map(item => item.count), [2,3,4])
for (const blend of report.blends) {
  assert.deepEqual(blend.sourceIndices, Array.from({length:blend.count},(_,index)=>index))
  assert.equal((await readFile(blend.path)).subarray(0,8).toString('hex'), '89504e470d0a1a0a')
}
assert.equal(new Set(report.blends.map(item => item.pixelSha256)).size,3)
console.log(JSON.stringify({generatedArtifacts, recordSignatures:signatures,
  actualModelLatentBlends:report.blends,
  originalLayersPreserved:true, reloadReproducible:true,
  limitations:[report.speakerConditioning?'four VocalSet singers; general identity accuracy not established':'four clips from two speech recordings, not four independent singers',
    'existing procedural Record signature contract only',
    'AI latent blends are not yet connected to the motion renderer']}, null, 2))
