import assert from 'node:assert/strict'
import {readFile,writeFile,unlink} from 'node:fs/promises'
import {transformWithOxc} from 'vite'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
globalThis.window={AudioContext:class{},location:{search:''}}
globalThis.location=window.location
globalThis.localStorage={getItem:()=>null}
const files=['Icons.jsx','VoicePreferenceChoices.jsx','IntegratedViews.jsx','App.jsx']
const output=name=>'.qa-recording-'+name.replace('.jsx','.mjs')
try{
 for(const name of files){
  let code=(await transformWithOxc(await readFile(new URL('../src/'+name,import.meta.url),'utf8'),name,{jsx:{runtime:'classic'}})).code
  for(const dependency of files)code=code.replaceAll('./'+dependency,'./'+output(dependency))
  if(name==='App.jsx')code+='\nexport {VoiceSetup as VoiceSetupQA}\n'
  await writeFile(new URL('../src/'+output(name),import.meta.url),code)
 }
 const {Recorder,VoiceSetupQA}=await import('../src/'+output('App.jsx'))
 const {WARM_PROJECT}=await import('../src/projectMusic.js')
 const noop=()=>{}
 for(const tracks of [{},{'voice-a':{partId:'voice-a',projectId:WARM_PROJECT.id,kind:'temporary-recording',blob:new Blob(['take']),duration:4}}]){
  const html=renderToStaticMarkup(React.createElement(Recorder,{project:WARM_PROJECT,parts:WARM_PROJECT.parts,projectTracks:tracks,layers:[],partId:'voice-b',go:noop,submit:noop}))
  assert.ok(html.includes('가이드 보컬 볼륨'))
  assert.ok(!html.includes('v2-monitoring-row'),'No independent participant playback controls')
  assert.ok(html.includes('aria-orientation="vertical"'))
 }
 for(const existing of [null,{name:'Registered',rangeData:{lowMidi:48,highMidi:72},roles:[],genres:[],taste:[]}]){
  const html=renderToStaticMarkup(React.createElement(VoiceSetupQA,{existing,complete:noop,go:noop,back:noop,songSaves:[]}))
  assert.ok(html.length>0)
 }
 console.log('PASS actual Recorder/VoiceSetup Node render: registered/unregistered setup, project with/without draft, shared slider, no independent participant controls')
}finally{await Promise.all(files.map(name=>unlink(new URL('../src/'+output(name),import.meta.url)).catch(()=>{})))}
