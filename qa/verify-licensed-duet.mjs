import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFile} from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
import {LICENSED_DUET_SONG as song,LICENSED_DUET_PROJECT as project,LICENSED_DUET_ARRANGEMENT as audio} from '../src/licensedMusic.js'
import {recommendOpenParts} from '../src/matching.js'
globalThis.window={AudioContext:class{},location:{search:''}}
const {loadProjectBacking,projectAudioReference,assertProjectTrackAudio}=await import('../src/projectAudio.js')
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createServer} from 'vite'

const blobs=new Map()
for(const [file,hash] of [[audio.referenceFile,audio.referenceSha256],[audio.backingFile,audio.backingSha256],[audio.combinedVocalFile,audio.combinedVocalSha256]]){
  const path=new URL('../public'+file,import.meta.url)
  const bytes=await readFile(path)
  assert.equal(createHash('sha256').update(bytes).digest('hex'),hash)
  const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration:stream=channels,sample_rate','-of','json',path.pathname],{encoding:'utf8'}))
  assert.ok(Math.abs(Number(probe.format.duration)-audio.duration)<.1)
  assert.equal(probe.streams[0].channels,2)
  blobs.set(file,new Blob([bytes],{type:'audio/mpeg'}))
}
assert.equal(audio.provenance.license,'CC0-1.0')
assert.equal(audio.provenance.listeningAcceptance,'pending')
assert.notEqual(audio.backingSha256,audio.referenceSha256)
assert.notEqual(audio.backingSha256,audio.combinedVocalSha256)
assert.equal(await loadProjectBacking(project,async(file,hash)=>{
  assert.equal(hash,audio.backingSha256);return blobs.get(file)
}),blobs.get(audio.backingFile))
assertProjectTrackAudio(project,[{audioSourceRef:projectAudioReference(project)}])
assert.throws(()=>assertProjectTrackAudio(project,[{}]))
assert.equal(recommendOpenParts({lowMidi:0,highMidi:127},[project]).length,0,'Unknown Part ranges must not become recommendations')
assert.ok(project.parts.every(part=>!part.participantId&&!part.trackId))
assert.equal(audio.vocalGuideFile,undefined,'Combined vocal stack is not a Part guide')

globalThis.window={AudioContext:class{},location:{search:''}}
globalThis.location=window.location
globalThis.localStorage={getItem:()=>null}
const server=await createServer({server:{middlewareMode:true},appType:'custom'})
try {
  const {Detail,Recorder}=await server.ssrLoadModule('/src/App.jsx')
  const noop=()=>{}
  const detail=renderToStaticMarkup(React.createElement(Detail,{
    song,profile:{name:'QA',rangeData:{lowMidi:48,highMidi:60}},
    layers:[],projectTracks:{},createdProjects:[],initialProjectId:project.id,
    detailContext:{current:{[project.id]:'vocal-a'}},joinRegistered:noop,
    go:noop,back:noop,toggleSongSave:noop,onSelectProject:noop,openVocalProfile:noop
  }))
  assert.ok(detail.includes('Vocal A 파트 참여하기'))
  assert.ok(detail.includes(audio.listeningNote))
  assert.ok(!detail.includes('data-harmony-score="100"'))
  const recorder=renderToStaticMarkup(React.createElement(Recorder,{
    project,parts:project.parts,partId:'vocal-a',projectTracks:{},layers:[],go:noop,submit:noop
  }))
  assert.ok(recorder.includes(audio.referenceFile))
  assert.ok(recorder.includes('시간별 가사는 아직 등록되지 않았어요.'))
  console.log('PASS licensed source/stem hashes and decoded durations, original-key backing contract, independent empty Parts, Detail participation and Recorder reference; no listening/browser claim')
} finally {await server.close()}
