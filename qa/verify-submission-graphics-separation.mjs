import assert from 'node:assert/strict'
import {submittedProjectTracks,allProjectTracksSubmitted} from '../src/projectModel.js'
for (const count of [2,3,4]) {
  const project = {id:`project-${count}`,seed:'preserved-seed',partIds:Array.from({length:count},(_,index)=>`part-${index}`)}
  const tracks = Object.fromEntries(project.partIds.map(partId=>[partId,{id:`${project.id}:${partId}`,projectId:project.id,partId,blob:new Blob(['actual persisted record fixture']),features:null,layer:null,layerStatus:'error'}]))
  assert.equal(allProjectTracksSubmitted(project,tracks),true,'Graphics failure blocks submitted audio')
  assert.equal(submittedProjectTracks(project,tracks).length,count)
  for (const change of [{kind:'temporary-recording'},{kind:'voice-sample'},{submissionStatus:'pending'},{submissionStatus:'error'},{blob:null},{projectId:'other'},{id:'draft-id'}]) {
    const changed={...tracks,[project.partIds[0]]:{...tracks[project.partIds[0]],...change,layer:{signature:'successful-graphic'}}}
    assert.equal(allProjectTracksSubmitted(project,changed),false,'Graphics or temporary audio falsely confirms submission')
    assert.equal(submittedProjectTracks(project,changed).length,count-1)
  }
  assert.equal(allProjectTracksSubmitted(project,{...tracks,unrelated:{blob:new Blob(['extra']),layer:{}}}),true)
}
console.log('PASS 2–4 persisted Tracks complete independently of graphics; Review/Profile/failed submission/foreign records do not count')
