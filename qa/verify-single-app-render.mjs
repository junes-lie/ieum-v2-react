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
const preferencesTemp=new URL('../src/.qa-single-app-preferences.mjs',import.meta.url)
try {
  const source=await readFile(new URL('../src/App.jsx',import.meta.url),'utf8')
  const iconsSource=await readFile(new URL('../src/Icons.jsx',import.meta.url),'utf8')
  const iconsTransformed=await transformWithOxc(iconsSource,'Icons.jsx',{jsx:{runtime:'classic'}})
  await writeFile(iconsTemp,iconsTransformed.code)
  const preferencesSource=await readFile(new URL('../src/VoicePreferenceChoices.jsx',import.meta.url),'utf8')
  await writeFile(preferencesTemp,(await transformWithOxc(preferencesSource,'VoicePreferenceChoices.jsx',{jsx:{runtime:'classic'}})).code.replace('./Icons.jsx','./.qa-single-app-icons.mjs'))
  const transformed=await transformWithOxc(source,'App.jsx',{jsx:{runtime:'classic'}})
  await writeFile(temp,transformed.code.replace('./Icons.jsx','./.qa-single-app-icons.mjs').replace('./VoicePreferenceChoices.jsx','./.qa-single-app-preferences.mjs'))
  const {default:App,Workspace,Recorder,Complete,Home}=await import(temp.href)
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
  assert.ok(complete.includes('2026.10.07'))
  for(const createdAt of [undefined,'invalid-date']){
    const missingDate=renderToStaticMarkup(React.createElement(Complete,{...common,projectTracks:tracks,mix:{url:'blob:qa',duration:12.25,createdAt}}))
    assert.ok(missingDate.includes('<time>—</time>'),'Missing or invalid completion metadata must not fabricate today')
  }
  assert.ok(!complete.includes('A Thousand Years'))
  const homeProject={...project,title:'QA Home Song',name:'QA Created Trio',songId:'ocean-eyes',status:'RECRUITING',ownerPartId:'lead',
    parts:[{...parts[0],participantId:'jisun'},{...parts[1]},{...parts[2]}]}
  const homeProps={layers:[],projectTracks:{},openSong:noop,openCreateProject:noop,openComplete:noop,openCreatedProject:noop,
    createdProjects:[homeProject],createdProjectTracks:{}}
  const renderHome=extra=>renderToStaticMarkup(React.createElement(Home,{...homeProps,...extra}))
  const section=(html,title)=>html.slice(html.indexOf(`<h2>${title}</h2>`),html.indexOf('</section>',html.indexOf(`<h2>${title}</h2>`)))
  const freshHome=renderHome()
  assert.ok(section(freshHome,'파트 모집 중').includes('4 projects'))
  assert.ok(section(freshHome,'파트 모집 중').includes('QA Created Trio'))
  assert.ok(section(freshHome,'파트 모집 중').includes('00/03 · 2 Parts OPEN'))
  assert.ok(section(freshHome,'최근 열린 프로젝트').includes('QA Created Trio'))
  assert.ok(!section(freshHome,'완성된 곡').includes('QA Created Trio'))
  const fullTracks=Object.fromEntries(homeProject.parts.map(part=>[part.id,{id:`${homeProject.id}:${part.id}`,projectId:homeProject.id,partId:part.id,
    kind:'project-track',submissionStatus:'success',blob:new Blob(['saved original'],{type:'audio/wav'})}]))
  const waitingMix=renderHome({createdProjectTracks:{[homeProject.id]:fullTracks}})
  assert.ok(!section(waitingMix,'파트 모집 중').includes('QA Created Trio'))
  assert.ok(section(waitingMix,'최근 열린 프로젝트').includes('03/03 · MIXING'))
  assert.ok(!section(waitingMix,'완성된 곡').includes('QA Created Trio'))
  const mixedHome=renderHome({createdProjectTracks:{[homeProject.id]:fullTracks},createdMixes:{[homeProject.id]:{url:'blob:qa-home-mix',duration:12}}})
  assert.ok(section(mixedHome,'완성된 곡').includes('QA Created Trio'))
  assert.ok(section(mixedHome,'완성된 곡').includes('03/03 · COMPLETE'))
  assert.ok(!section(mixedHome,'파트 모집 중').includes('QA Created Trio'))
  const reviewOnly={...fullTracks.harmony,kind:'temporary-recording',submissionStatus:'review'}
  const reviewHome=renderHome({createdProjectTracks:{[homeProject.id]:{harmony:reviewOnly}}})
  assert.ok(section(reviewHome,'파트 모집 중').includes('00/03 · 2 Parts OPEN'))
  assert.ok(!section(renderHome({createdMixes:{[homeProject.id]:{url:'blob:stale'}}}),'완성된 곡').includes('QA Created Trio'))
  assert.ok(!section(renderHome({createdProjects:[{...homeProject,status:'COMPLETE'}]}),'최근 열린 프로젝트').includes('COMPLETE'),'Persisted display labels cannot replace a saved Mix')
  const occupiedMain=renderHome({joined:true,joinedPart:'tenor',candidateAccepted:true})
  assert.ok(!section(occupiedMain,'파트 모집 중').includes('A Thousand Years'))
  assert.ok(section(occupiedMain,'파트 모집 중').includes('3 projects'))
  const invitationOnly=renderHome({createdProjects:[{...homeProject,parts:homeProject.parts.map(part=>part.id==='harmony'?{...part,invitations:[{status:'sent'}]}:part)}]})
  assert.ok(section(invitationOnly,'파트 모집 중').includes('00/03 · 2 Parts OPEN'))
  const opened=[],buttons=[],originalCreateElement=React.createElement
  try{
    React.createElement=(type,props,...children)=>{
      if(type==='button' && props?.['data-project-id']===homeProject.id)buttons.push(props)
      return originalCreateElement(type,props,...children)
    }
    renderHome({openCreatedProject:id=>opened.push(id)})
  }finally{React.createElement=originalCreateElement}
  assert.equal(buttons.length,2,'Created Project appears in recruiting and recent lists')
  for(const button of buttons)button.onClick()
  assert.deepEqual(opened,[homeProject.id,homeProject.id],'Both actual handlers preserve the created Project ID')
  console.log('PASS Home rendered local discovery: created Project recruiting/recent/completed lists, real saved Track counts, assigned seats not OPEN, Review/invites do not submit, Mix success plus all Tracks required. Node render, not physical/visual/browser navigation acceptance.')
  for (const count of [2,4]) {
    const dynamicParts=Array.from({length:count},(_,index)=>({id:`free-${count}-${index}`,name:`Voice ${index+1}`,color:'#3b82f6',status:index?'open':'ready'}))
    const dynamicProject={id:`qa-project-${count}`,seed:`qa-seed-${count}`,parts:dynamicParts,totalParts:count,partCount:count,key:'F minor'}
    const dynamicHomeProject={...dynamicProject,title:`HOME ${count}`,name:`${count} voices`,songId:'ocean-eyes',status:'RECRUITING'}
    const dynamicHome=renderHome({createdProjects:[dynamicHomeProject]})
    assert.ok(section(dynamicHome,'파트 모집 중').includes(`00/0${count} · ${count-1} Parts OPEN`))
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
} finally { await Promise.all([unlink(temp).catch(()=>{}),unlink(iconsTemp).catch(()=>{}),unlink(preferencesTemp).catch(()=>{})]) }
