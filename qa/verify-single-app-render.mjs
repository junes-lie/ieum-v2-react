import assert from 'node:assert/strict'
import {readFile,writeFile,unlink} from 'node:fs/promises'
import {transformWithOxc} from 'vite'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'

// Node rendering only: no browser, Computer Use, microphone, or network.
globalThis.window={AudioContext:class{},location:{search:''}}
globalThis.location=window.location
globalThis.localStorage={getItem:()=>null}
const temp=new URL('../src/.qa-single-app-render.mjs',import.meta.url)
const iconsTemp=new URL('../src/.qa-single-app-icons.mjs',import.meta.url)
try {
  const source=await readFile(new URL('../src/App.jsx',import.meta.url),'utf8')
  const iconsSource=await readFile(new URL('../src/Icons.jsx',import.meta.url),'utf8')
  const iconsTransformed=await transformWithOxc(iconsSource,'Icons.jsx',{jsx:{runtime:'classic'}})
  await writeFile(iconsTemp,iconsTransformed.code)
  const transformed=await transformWithOxc(source,'App.jsx',{jsx:{runtime:'classic'}})
  await writeFile(temp,transformed.code.replace('./Icons.jsx','./.qa-single-app-icons.mjs'))
  const {default:App,Workspace,Recorder,Complete}=await import(temp.href)
  const noop=()=>{}
  const parts=[{id:'lead',name:'Lead',color:'#3b82f6',status:'ready',participantId:'jisun',participant:'나'},{id:'harmony',name:'Harmony',color:'#f16f61',status:'open'},{id:'lower',name:'Lower',color:'#2eb6ad',status:'open'}]
  const project={id:'qa-custom-trio',seed:'qa-trio-seed',parts,partCount:3,totalParts:3,key:'E minor',title:'QA Trio'}
  const song={id:'qa-song',title:'QA Song',artist:'QA Artist'}
  const common={go:noop,project,song,parts,layers:[null,null,null],projectTracks:{},openVocalProfile:noop,toggleProjectLike:noop}
  assert.ok(renderToStaticMarkup(React.createElement(App)).includes('TRACKS LOADING'))
  const workspace=renderToStaticMarkup(React.createElement(Workspace,{...common,isCreated:true,ownerPartId:'lead',findVocal:noop,recordPart:noop}))
  assert.ok(workspace.includes('QA Song'))
  assert.ok(workspace.includes('0/3'))
  assert.ok(!workspace.includes('3/4'))
  const recorder=renderToStaticMarkup(React.createElement(Recorder,{...common,partId:'lead',submit:noop}))
  assert.ok(recorder.includes('Lead 녹음'))
  assert.ok(!recorder.includes('COUNT IN'))
  const tracks=Object.fromEntries(parts.map((part,index)=>[part.id,{id:part.id,partId:part.id,participantId:index?'person-'+index:'jisun',participant:'PERSON-'+index,layer:null}]))
  const complete=renderToStaticMarkup(React.createElement(Complete,{...common,projectTracks:tracks,mix:{url:'blob:qa',duration:12.25,createdAt:'2026-10-07T00:00:00Z'}}))
  assert.ok(complete.includes('QA Song'))
  assert.ok(complete.includes('PERSON-2'))
  assert.ok(complete.includes('E minor'))
  assert.ok(complete.includes('blob:qa'))
  assert.ok(!complete.includes('A Thousand Years'))
  for (const count of [2,4]) {
    const dynamicParts=Array.from({length:count},(_,index)=>({id:`free-${count}-${index}`,name:`Voice ${index+1}`,color:'#3b82f6',status:index?'open':'ready'}))
    const dynamicProject={id:`qa-project-${count}`,seed:`qa-seed-${count}`,parts:dynamicParts,totalParts:count,partCount:count,key:'F minor'}
    const dynamicCommon={...common,project:dynamicProject,parts:dynamicParts,layers:dynamicParts.map(()=>null)}
    const workspaceMarkup=renderToStaticMarkup(React.createElement(Workspace,{...dynamicCommon,isCreated:true,ownerPartId:dynamicParts[0].id,findVocal:noop,recordPart:noop}))
    assert.ok(workspaceMarkup.includes(`0/${count}`))
    const recorderMarkup=renderToStaticMarkup(React.createElement(Recorder,{...dynamicCommon,partId:dynamicParts[count-1].id,submit:noop}))
    assert.ok(recorderMarkup.includes(`Voice ${count} 녹음`))
    const dynamicTracks=Object.fromEntries(dynamicParts.map((part,index)=>[part.id,{id:`${dynamicProject.id}:${part.id}`,projectId:dynamicProject.id,partId:part.id,participantId:`qa-user-${index}`,participant:`QA-SINGER-${count}-${index}`}]))
    const completeMarkup=renderToStaticMarkup(React.createElement(Complete,{...dynamicCommon,projectTracks:dynamicTracks,mix:{url:`blob:qa-${count}`,duration:10,createdAt:'2026-10-08T00:00:00Z'}}))
    assert.ok(completeMarkup.includes(`QA-SINGER-${count}-${count-1}`))
    assert.ok(completeMarkup.includes('F minor'))
    assert.ok(completeMarkup.includes(`blob:qa-${count}`))
  }
  const main=await readFile(new URL('../src/main.jsx',import.meta.url),'utf8')
  assert.ok(!main.includes('FigmaProject'))
  assert.equal((main.match(/createRoot/g)||[]).length,2)
  console.log('Single App Node rendering: entry, custom 2/3/4-Part Workspace/Recorder/Complete, dynamic credits/key/song, native final audio passed. No visual or interactive browser claim.')
} finally { await Promise.all([unlink(temp).catch(()=>{}),unlink(iconsTemp).catch(()=>{})]) }
