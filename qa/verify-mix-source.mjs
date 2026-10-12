import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {prepareProjectMix} from '../src/mixSource.js'

for(const count of [2,3,4]) {
  const project={id:`project-${count}`,seed:'preserved-seed',partIds:Array.from({length:count},(_,i)=>`part-${i}`)}
  const records=Object.fromEntries(project.partIds.map((partId,i)=>[partId,{id:`${project.id}:${partId}`,projectId:project.id,partId,blob:new Blob([`actual audio ${i}`]),duration:2,syncOffsetMs:0,features:{version:'analysis-test'},layer:i?null:{version:'layer-test',shape:[.2,.8]},sourceProvenance:{revision:`source-${i}`}}]))
  const first=await prepareProjectMix(project,records),second=await prepareProjectMix(project,records)
  assert.deepEqual(first.inputManifest,second.inputManifest)
  assert.deepEqual(first.inputManifest.partIds,project.partIds)
  assert.equal(first.inputManifest.tracks.length,count)
  for(const [i,track] of first.inputManifest.tracks.entries()) {
    assert.equal(track.audioSha256,createHash('sha256').update(`actual audio ${i}`).digest('hex'))
    assert.equal(track.sourceRevision,`source-${i}`)
    assert.equal(track.layerCaptureStatus,i?'missing':'captured')
  }
  const pending=prepareProjectMix(project,records)
  records[project.partIds[0]].layer.shape[0]=.9
  records[project.partIds[0]].features.version='changed'
  const snapshot=await pending
  assert.deepEqual(snapshot.inputManifest,first.inputManifest)
  records[project.partIds[0]].blob=new Blob(['different original'])
  assert.notEqual((await prepareProjectMix(project,records)).inputManifest.inputDigest,first.inputManifest.inputDigest)
  records[project.partIds[0]].layer={version:'invalid',value:NaN}
  delete records[project.partIds[0]].sourceProvenance
  const invalid=await prepareProjectMix(project,records)
  assert.equal(invalid.inputManifest.tracks[0].layerCaptureStatus,'invalid')
  assert.equal(invalid.inputManifest.tracks[0].layerSnapshot,null)
  assert.equal(invalid.inputManifest.tracks[0].sourceRevision,null)
  records[project.partIds[0]].submissionStatus='review'
  await assert.rejects(prepareProjectMix(project,records))
  console.log(`PASS ${count} Parts: exact input reproduction, original hashes/order, immutable version/Layer snapshots; absent graphics do not block audio; Review is not submitted`)
}
