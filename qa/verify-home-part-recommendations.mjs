import assert from 'node:assert/strict'
import React, {act} from 'react'
import {createRoot} from 'react-dom/client'
import {Window} from 'happy-dom'
import {createServer} from 'vite'
import {recommendOpenParts} from '../src/matching.js'

const profile={rangeData:{lowMidi:48,highMidi:60}}
const song={id:'high-song',title:'높은 멜로디가 있는 곡',artist:'QA',range:'C5–C6'}
const project={id:'lower-project',songId:song.id,key:'원키',parts:[
  {id:'lead',name:'Lead',range:'C5–C6',status:'open'},
  {id:'lower',name:'Lower Harmony',range:'C3–C4',status:'open'},
  {id:'taken',name:'Taken',range:'C3–C4',status:'open',participantId:'other'},
  {id:'unknown',name:'Unknown',status:'open'}
]}
const before=structuredClone(project)
assert.deepEqual(recommendOpenParts(profile.rangeData,[project]).map(row=>[row.projectId,row.partId]),[['lower-project','lower']])
assert.equal(recommendOpenParts(null,[project]).length,0)
assert.equal(recommendOpenParts({lowMidi:70,highMidi:60},[project]).length,0)
assert.deepEqual(project,before)

// DOM render and click contract only; no browser, microphone or listening claim.
const window=new Window()
globalThis.window=window;globalThis.document=window.document
globalThis.IS_REACT_ACT_ENVIRONMENT=true
const server=await createServer({server:{middlewareMode:true},appType:'custom'})
const host=document.createElement('div');document.body.append(host)
const root=createRoot(host)
try {
  const {HomeView}=await server.ssrLoadModule('/src/IntegratedViews.jsx')
  const clicks=[]
  const props={profile,entries:[{project,song,complete:false,openParts:project.parts.filter(p=>p.status==='open')}],songs:[song],
    renderRecord:()=>null,renderPreview:()=>null,openSong:(...args)=>clicks.push(args),openSearch:()=>{},formatDuration:()=>'',openCreateProject:()=>{},openProject:()=>{}}
  await act(()=>root.render(React.createElement(HomeView,props)))
  const section=host.querySelector('.v2-recommended')
  assert.ok(section.textContent.includes('내 음역에 맞는 Part'))
  assert.ok(section.textContent.includes('Lower Harmony · OPEN 1'))
  assert.ok(!section.textContent.includes('Lead ·'))
  await act(()=>section.querySelector('.v2-song-card').click())
  assert.deepEqual(clicks,[[song.id,project.id,'lower']],'Open the recommended Project and Part, without joining')
  await act(()=>root.render(React.createElement(HomeView,{...props,profile:null})))
  assert.equal(host.querySelector('.v2-recommended').dataset.recommendationMode,'general')
  assert.ok(!host.querySelector('.v2-song-count').textContent.includes('Lower Harmony'))
  console.log('PASS whole-Song range ignored; OPEN Part eligibility, missing/occupied exclusion, Home Part label and targeted navigation; DOM only')
} finally {
  await act(()=>root.unmount());await server.close();window.happyDOM.abort()
}
