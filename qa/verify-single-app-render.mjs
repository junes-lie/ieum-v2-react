import assert from 'node:assert/strict'
import {discoveryProjects} from '../src/discovery.js'
import {readFile,writeFile,unlink} from 'node:fs/promises'
import {transformWithOxc} from 'vite'
import React,{act} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createRoot} from 'react-dom/client'
import {Window} from 'happy-dom'

// Node rendering only: no browser, Computer Use, microphone, or network.
globalThis.window={AudioContext:class{},location:{search:''}}
globalThis.location=window.location
globalThis.localStorage={getItem:()=>null}
const temp=new URL('../src/.qa-single-app-render.mjs',import.meta.url)
const iconsTemp=new URL('../src/.qa-single-app-icons.mjs',import.meta.url)
const viewsTemp=new URL('../src/.qa-single-app-views.mjs',import.meta.url)
const preferencesTemp=new URL('../src/.qa-single-app-preferences.mjs',import.meta.url)
const controlsTemp=new URL('../src/.qa-detail-listening.mjs',import.meta.url)
try {
  const source=await readFile(new URL('../src/App.jsx',import.meta.url),'utf8')
  const iconsSource=await readFile(new URL('../src/Icons.jsx',import.meta.url),'utf8')
  const iconsTransformed=await transformWithOxc(iconsSource,'Icons.jsx',{jsx:{runtime:'classic'}})
  await writeFile(iconsTemp,iconsTransformed.code)
  const preferencesSource=await readFile(new URL('../src/VoicePreferenceChoices.jsx',import.meta.url),'utf8')
  await writeFile(preferencesTemp,(await transformWithOxc(preferencesSource,'VoicePreferenceChoices.jsx',{jsx:{runtime:'classic'}})).code.replace('./Icons.jsx','./.qa-single-app-icons.mjs'))
 await writeFile(viewsTemp,(await transformWithOxc(await readFile(new URL('../src/IntegratedViews.jsx',import.meta.url),'utf8'),'IntegratedViews.jsx',{jsx:{runtime:'classic'}})).code.replace('./Icons.jsx','./.qa-single-app-icons.mjs'))
  const transformed=await transformWithOxc(source,'App.jsx',{jsx:{runtime:'classic'}})
  await writeFile(temp,transformed.code.replace('./IntegratedViews.jsx','./.qa-single-app-views.mjs').replace('./Icons.jsx','./.qa-single-app-icons.mjs').replace('./VoicePreferenceChoices.jsx','./.qa-single-app-preferences.mjs')+'\nexport {OtherVocalProfile as OtherVocalProfileQA,resolveVocalProfile,initialVocalProfileId}\n')
  const {default:App,Workspace,Recorder,Complete,Home,Detail,PersonalArea,OtherVocalProfileQA,resolveVocalProfile,initialVocalProfileId}=await import(temp.href)
  const noop=()=>{}
  assert.equal(initialVocalProfileId({ieumScreen:'vocal-profile',selectedVocalId:'min'}),'min','Reload retains the selected person')
  assert.equal(initialVocalProfileId({ieumScreen:'vocal-profile',selectedVocalId:'unknown-person'}),'unknown-person','Unknown targets must not silently become another person')
  assert.equal(initialVocalProfileId({ieumScreen:'vocal-profile',selectedVocalId:null}),null)
  assert.equal(initialVocalProfileId(undefined),'luna','Existing initial demo selection is unchanged without a target')
  const known=resolveVocalProfile('min')
  assert.equal(known.id,'min')
  for(const id of ['unknown-person','constructor','__proto__',null]){
    assert.equal(resolveVocalProfile(id),null)
    const unavailable=renderToStaticMarkup(React.createElement(OtherVocalProfileQA,{vocal:resolveVocalProfile(id),back:noop}))
    assert.ok(unavailable.includes('선택한 보컬 프로필을 확인할 수 없어요.'))
    assert.ok(!unavailable.includes('voice-identity') && !unavailable.includes('voice-sample-block') && !unavailable.includes('toggle-vocal-save'))
  }
  const selected=renderToStaticMarkup(React.createElement(OtherVocalProfileQA,{vocal:known,back:noop,toggleSave:noop,setupVoice:noop}))
  assert.ok(selected.includes(known.name) && selected.includes('toggle-vocal-save'))
  console.log('PASS Other Vocal target: selected history ID retained, unknown/inherited IDs show unavailable inside existing 05A, known profile/save action preserved. Node render, not actual browser refresh.')
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
  const fullTracks=Object.fromEntries(homeProject.parts.map(part=>[part.id,{id:`${homeProject.id}:${part.id}`,projectId:homeProject.id,partId:part.id,
    kind:'project-track',submissionStatus:'success',blob:new Blob(['saved original'],{type:'audio/wav'})}]))
  const readDiscovery=extra=>discoveryProjects({songs:[{...song,id:homeProject.songId,projects:[]}],mainProject:{id:'other-main'},createdProjects:[homeProject],...extra})[0]
  assert.equal(readDiscovery().openParts.length,2)
  assert.equal(readDiscovery().complete,false)
  assert.equal(readDiscovery({createdTracks:{[homeProject.id]:fullTracks}}).submitted,3)
  assert.equal(readDiscovery({createdTracks:{[homeProject.id]:fullTracks}}).complete,false)
  assert.equal(readDiscovery({createdTracks:{[homeProject.id]:fullTracks},createdMixes:{[homeProject.id]:{url:'blob:mix'}}}).complete,true)
  const reviewOnly={...fullTracks.harmony,kind:'temporary-recording',submissionStatus:'review'}
  assert.equal(readDiscovery({createdTracks:{[homeProject.id]:{harmony:reviewOnly}}}).submitted,0)
  assert.equal(readDiscovery({createdMixes:{[homeProject.id]:{url:'blob:stale'}}}).complete,false)
  const opened=[],buttons=[],originalCreateElement=React.createElement
  try{
    React.createElement=(type,props,...children)=>{
      if(type==='button' && props?.['data-project-id']===homeProject.id)buttons.push(props)
      return originalCreateElement(type,props,...children)
    }
    renderHome({openSong:(songId,id)=>opened.push({songId,id}),openCreatedProject:()=>assert.fail('Recruiting Project must open Detail')})
  }finally{React.createElement=originalCreateElement}
  assert.equal(buttons.length,1,'Created Project appears in recent rows; carousel exposes one project at a time')
  buttons[0].onClick()
  assert.deepEqual(opened,[{songId:homeProject.songId,id:homeProject.id}])
  console.log('PASS Discovery uses committed Track/Mix state; Review and stale Mix excluded; actual recent-row callback opens the exact Song/Project')
  for(const count of [2,3,4]){
    const workspaceProject={...homeProject,id:'qa-workspace-'+count,parts:Array.from({length:count},(_,index)=>({id:'ws-'+index,name:'Part '+index,
      participantId:index?'person-'+index:'jisun',participant:index?'Person '+index:'나',status:'submitted'})),partCount:count,totalParts:count}
    const finals=Object.fromEntries(workspaceProject.parts.map(part=>[part.id,{id:workspaceProject.id+':'+part.id,projectId:workspaceProject.id,partId:part.id,
      kind:'project-track',submissionStatus:'success',blob:new Blob(['saved final']),participantId:part.participantId,participant:part.participant,duration:1,
      layer:{qaMarker:'submitted-'+part.id}}]))
    const review={...finals['ws-0'],kind:'temporary-recording',submissionStatus:'review'}
    const invalid={'ws-0':review,'ws-1':{...finals['ws-1'],projectId:'other-project'}}
    const recordInputs=[],mixInputs=[],actions=[],destinations=[]
    const props={...common,project:workspaceProject,isCreated:true,ownerPartId:'ws-0',findVocal:noop,recordPart:noop,go:target=>destinations.push(target)}
    const renderWorkspace=extra=>renderToStaticMarkup(React.createElement(Workspace,{...props,...extra}))
    try{
      React.createElement=(type,props,...children)=>{
        if(typeof type==='function' && type.name==='ResonanceRecord')recordInputs.push(props)
        if(typeof type==='function' && type.name==='CurrentMixPanel')mixInputs.push(props)
        if(type==='button' && props?.['data-action'])actions.push(props)
        return originalCreateElement(type,props,...children)
      }
      const stale=renderWorkspace({projectTracks:invalid,layers:workspaceProject.parts.map(()=>review.layer),mix:{url:'blob:stale'},mixStatus:'processing',hasDraft:true})
      assert.ok(stale.includes('0/'+count+' 제출됨'),'Review/stale Part labels cannot create Workspace submissions')
      assert.ok(stale.includes('녹음 이어서 확인하기'),'Own unsubmitted Part remains available for Review')
      assert.ok(!stale.includes('완성곡 듣기') && !stale.includes('곡을 완성하고 있어요.'))
      assert.deepEqual(recordInputs[0].tracks,{})
      assert.deepEqual(recordInputs[0].layers,workspaceProject.parts.map(()=>null),'Unsubmitted graphics cannot become finalized Record layers')
      assert.equal(mixInputs[0].mix,null)
      assert.deepEqual(mixInputs[0].projectTracks,{})
      const partial=renderWorkspace({projectTracks:{'ws-0':finals['ws-0']},mix:{url:'blob:stale'},mixStatus:'processing'})
      assert.ok(partial.includes('1/'+count+' 제출됨'))
      assert.ok(partial.includes('현재 Mix') && !partial.includes('완성곡 듣기'))
      assert.ok(!partial.includes('곡을 완성하고 있어요.'))
      assert.ok(renderWorkspace({projectTracks:finals,mixStatus:'processing'}).includes('곡을 완성하고 있어요.'))
      const completed=renderWorkspace({projectTracks:finals,mix:{url:'blob:confirmed'},mixStatus:'success'})
      assert.ok(completed.includes(count+'/'+count+' 제출됨') && completed.includes('완성곡 듣기'))
      actions.find(button=>button['data-action']==='open-complete').onClick()
      assert.deepEqual(destinations,['complete'])
      assert.equal(invalid['ws-0'],review,'Rendering does not mutate Review/original records')
    }finally{React.createElement=originalCreateElement}
  }
  console.log('PASS Workspace: actual final Tracks only, Review/wrong Project/stale Part labels and incomplete Mix excluded; 2–4 Part progress/Record/listening/record CTA/complete action agree. Node render only.')
  const detailSong={...song,id:homeProject.songId,projects:[{id:'qa-static-project',name:'Other Project',partCount:2,progress:0,status:'RECRUITING',seed:'other',key:'C major'}]}
  const detailProps={...homeProps,song:detailSong,go:noop,back:noop,join:noop,toggleSongSave:noop,openVocalProfile:noop,
    onCreateProject:noop,onOpenCreatedProject:noop,onSelectProject:noop,initialProjectId:homeProject.id}
  const renderDetail=extra=>renderToStaticMarkup(React.createElement(Detail,{...detailProps,...extra}))
  const initialDetail=renderDetail({createdProjects:[{...homeProject,progress:3,status:'COMPLETE'}]})
  assert.ok(initialDetail.includes('00/03 · RECRUITING'),'Stored display labels cannot substitute real submitted Tracks in Detail')
  assert.ok(initialDetail.includes('첫 녹음 시작 전 조정 가능'))
  const lockedEmptyDetail=renderDetail({createdProjects:[{...homeProject,keyLocked:true}]})
  assert.ok(lockedEmptyDetail.includes('첫 녹음 시작 후 Key 고정'),'Recording locks Key before any Track submission')
  assert.ok(lockedEmptyDetail.includes('00/03 · RECRUITING'),'Key lock cannot create a submitted Track')
  assert.ok(!lockedEmptyDetail.includes('첫 녹음 시작 전 조정 가능'))
  assert.ok(initialDetail.includes('작업실로 이동'))
  assert.ok(!initialDetail.includes('완성곡 듣기'))
  const finalDetail=renderDetail({createdProjectTracks:{[homeProject.id]:fullTracks}})
  assert.ok(finalDetail.includes('03/03 · MIXING'))
  assert.ok(finalDetail.includes('첫 녹음 시작 후 Key 고정'),'Existing submitted Track also prevents misleading unlocked guidance')
  assert.ok(!finalDetail.includes('완성곡 듣기'),'Final Tracks without a saved Mix are not completed')
  const completedDetail=renderDetail({createdProjectTracks:{[homeProject.id]:fullTracks},createdMixes:{[homeProject.id]:{url:'blob:qa-home-mix'}}})
  assert.ok(completedDetail.includes('03/03 · COMPLETE'))
  assert.ok(completedDetail.includes('완성곡 듣기'))
  assert.ok(!renderDetail({createdMixes:{[homeProject.id]:{url:'blob:stale'}}}).includes('완성곡 듣기'))
  assert.ok(renderDetail({createdProjectTracks:{[homeProject.id]:{harmony:reviewOnly}}}).includes('00/03 · RECRUITING'))
  const finalLower={...fullTracks.lower,participant:'QA FINAL LOWER',participantId:'qa-final-lower',duration:9.5,layer:{qaMarker:'lower-layer'}}
  const detailButtons=[],selectedIds=[],workspaceIds=[],recordProps=[]
  try{
    React.createElement=(type,props,...children)=>{
      if(type==='button' && (props?.['data-project-id'] || props?.['data-action']==='open-selected-created-project'))detailButtons.push(props)
      if(typeof type==='function' && type.name==='ResonanceRecord')recordProps.push(props)
      return originalCreateElement(type,props,...children)
    }
    const actualDetail=renderDetail({createdProjectTracks:{[homeProject.id]:{lower:finalLower}},onSelectProject:id=>selectedIds.push(id),onOpenCreatedProject:id=>workspaceIds.push(id)})
    assert.ok(actualDetail.includes('01/03 · RECORDING'))
    assert.ok(actualDetail.includes('QA FINAL LOWER'))
    assert.ok(actualDetail.includes('00:09'))
  }finally{React.createElement=originalCreateElement}
  detailButtons.find(button=>button['data-project-id']===homeProject.id).onClick()
  detailButtons.find(button=>button['data-project-id']==='qa-static-project').onClick()
  assert.deepEqual(selectedIds,[homeProject.id,'qa-static-project'],'Carousel changes selected Project inside Detail')
  assert.deepEqual(workspaceIds,[],'Carousel does not leave comparison for Workspace')
  detailButtons.find(button=>button['data-action']==='open-selected-created-project').onClick()
  assert.deepEqual(workspaceIds,[homeProject.id],'Explicit action opens the same selected Project')
  const selectedRecord=recordProps.find(props=>props.projectId===homeProject.id && props.parts.length===homeProject.parts.length && props.layers?.[2]===finalLower.layer)
  assert.ok(selectedRecord,'Selected Record retains the actual submitted layer')
  assert.equal(selectedRecord.projectId,homeProject.id)
  assert.equal(selectedRecord.seed,homeProject.seed)
  assert.deepEqual(selectedRecord.parts.map(part=>part.id),homeProject.parts.map(part=>part.id))
  assert.deepEqual(selectedRecord.layers,[null,null,finalLower.layer],'Record preserves actual Part order and final layer reference')
  const otherSelected=renderDetail({initialProjectId:'qa-static-project',createdProjectTracks:{[homeProject.id]:fullTracks}})
  assert.ok(otherSelected.includes('00/02 · RECRUITING'))
  assert.ok(!otherSelected.includes('open-selected-created-project'),'Another selected Project must not expose this owner Workspace action')
  console.log('PASS Detail: actual submitted state/Part/layer lineage, Review and stale Mix excluded, same-song carousel selection, explicit selected Project navigation. Node render/callbacks only.')
  const mainId='ieum-thousand-years-v7'
  const mainSong={...song,id:'a-thousand-years',projects:[{id:mainId,name:'Original C · Quartet',partCount:4,progress:2,status:'RECORDING',seed:'main-seed',key:'C major'}]}
  const mainFinals=Object.fromEntries(['soprano','alto','tenor','bass'].map(partId=>[partId,{id:`${mainId}:${partId}`,projectId:mainId,partId,blob:new Blob(['final']),kind:'project-track',submissionStatus:'success',duration:7,participant:`QA ${partId}`}]))
  const partialMainWorkspace=renderToStaticMarkup(React.createElement(Workspace,{...common,project:undefined,projectTracks:{bass:mainFinals.bass},
    ownerPartId:'tenor',joined:true,invited:true,candidateAccepted:true,invitedPerson:{id:'luna',name:'Luna'},findVocal:noop,recordPart:noop}))
  assert.ok(partialMainWorkspace.includes('SUBMITTED · 1/4'),'Invitation arrival badge uses actual submitted count instead of fixed 4/4')
  assert.ok(!partialMainWorkspace.includes('SUBMITTED · 4/4'))
  const existingTwo={soprano:mainFinals.soprano,alto:mainFinals.alto}
  const renderMainDetail=extra=>renderDetail({song:mainSong,initialProjectId:mainId,createdProjects:[],projectTracks:existingTwo,...extra})
  assert.ok(renderMainDetail({projectTracks:{},mainKeyLocked:true}).includes('첫 녹음 시작 후 Key 고정'),'Main Project uses its persisted recording lock even before submission')
  assert.ok(renderMainDetail({projectTracks:{},mainKeyLocked:false}).includes('첫 녹음 시작 전 조정 가능'))
  const mainRows=[],mainActions=[],mainDestinations=[]
  try{
    React.createElement=(type,props,...children)=>{
      if(typeof type==='function' && type.name==='PartRow')mainRows.push(props)
      if(typeof type==='function' && type.name==='CurrentMixPanel' && props.detailMode)mainRows.push(...props.parts.map(part=>({part,onPlay:props.projectTracks[part.id]?()=>{}:undefined})))
      if(type==='button' && props?.['data-action']==='open-selected-main-project')mainActions.push(props)
      return originalCreateElement(type,props,...children)
    }
    const assigned=renderMainDetail({joined:true,joinedPart:'tenor',candidateAccepted:true,invitedPerson:{id:'luna',name:'Luna'},openMainWorkspace:target=>mainDestinations.push(target)})
    assert.ok(assigned.includes('02/04 · RECORDING'))
    assert.ok(!assigned.includes('data-testid="part-fit"'),'Assigned Tenor is no longer an OPEN Part Fit action')
    assert.equal(mainRows.find(row=>row.part.id==='tenor').part.status,'ready')
    assert.equal(mainRows.find(row=>row.part.id==='tenor').part.participantId,'jisun')
    assert.equal(mainRows.find(row=>row.part.id==='bass').part.status,'accepted')
    assert.equal(mainRows.find(row=>row.part.id==='bass').part.participantId,'luna')
    assert.equal(mainRows.find(row=>row.part.id==='bass').onPlay,undefined,'Acceptance is not a submitted Track')
    mainActions[0].onClick()
    assert.deepEqual(mainDestinations,['workspace'])
    mainActions.length=0
    const done=renderMainDetail({projectTracks:mainFinals,mainMix:{url:'blob:main-final'},openMainWorkspace:target=>mainDestinations.push(target)})
    assert.ok(done.includes('04/04 · COMPLETE'))
    mainActions[0].onClick()
    assert.deepEqual(mainDestinations,['workspace','complete'])
  }finally{React.createElement=originalCreateElement}
  assert.ok(!renderMainDetail({mainMix:{url:'blob:incomplete'}}).includes('완성곡 듣기'))
  assert.ok(renderMainDetail({projectTracks:{...existingTwo,tenor:{...mainFinals.tenor,kind:'temporary-recording',submissionStatus:'review'}}}).includes('02/04 · RECORDING'))
  console.log('PASS existing Quartet Detail: actual own/accepted Part assignment, acceptance/Review does not submit, verified complete state and explicit Workspace/Complete navigation.')
  let personalFilter='all',collectionTab='projects'
  globalThis.sessionStorage={getItem:key=>key==='ieum:project-filter'?personalFilter:key==='ieum:collection-tab'?collectionTab:null}
  const personalProps={...homeProps,createdMixes:{},joined:false,projectLikes:[{projectId:homeProject.id}],vocalSaves:[],songSaves:[],
    go:noop,openMainWorkspace:noop,toggleProjectLike:noop,toggleProjectById:noop,trackCount:0,toggleVocalSave:noop,toggleSongSave:noop,openVocalProfile:noop}
  const renderPersonal=(type,extra)=>renderToStaticMarkup(React.createElement(PersonalArea,{...personalProps,type,...extra}))
  for(const candidate of [{...homeProject,status:'COMPLETE'},{...homeProject,status:'MIXING'}]){
    const extra={createdProjects:[candidate],createdMixes:{[candidate.id]:{url:'blob:stale'}}}
    assert.ok(renderPersonal('collection',extra).includes('RECRUITING · 0/3'),'Collection must reject stale labels and incomplete Mix')
    assert.ok(renderPersonal('projects',extra).includes('QA Created Trio · RECRUITING'))
    personalFilter='complete'
    assert.ok(!renderPersonal('projects',extra).includes('created-project-card'),'Stale Mix cannot enter completed filter')
    assert.ok(renderPersonal('projects',extra).includes('필터 초기화'))
    personalFilter='all'
  }
  const allSaved={createdProjectTracks:{[homeProject.id]:fullTracks}}
  assert.ok(renderPersonal('collection',allSaved).includes('MIXING · 3/3'))
  assert.ok(renderPersonal('projects',allSaved).includes('QA Created Trio · MIXING'))
  const savedMix={...allSaved,createdMixes:{[homeProject.id]:{url:'blob:qa-final'}}}
  assert.ok(renderPersonal('collection',savedMix).includes('COMPLETE · 3/3'))
  assert.ok(renderPersonal('projects',savedMix).includes('완성곡 열기'))
  personalFilter='complete'
  assert.ok(renderPersonal('projects',savedMix).includes('created-project-card'))
  personalFilter='all'
  const started={createdProjects:[{...homeProject,status:'RECORDING'}]}
  assert.ok(renderPersonal('collection',started).includes('RECORDING · 0/3'),'Recording starts before the first submission')
  assert.ok(section(renderHome(started),'최근 열린 프로젝트').includes('0/3 제출'))
  assert.ok(renderDetail(started).includes('00/03 · RECORDING'))
  const collectionRecords=[]
  try{
    React.createElement=(type,props,...children)=>{
      if(typeof type==='function' && type.name==='ResonanceRecord')collectionRecords.push(props)
      return originalCreateElement(type,props,...children)
    }
    renderPersonal('collection',{createdProjectTracks:{[homeProject.id]:{lower:finalLower,harmony:{...reviewOnly,layer:{qaMarker:'review-not-final'}}}}})
  }finally{React.createElement=originalCreateElement}
  assert.equal(collectionRecords[0].projectId,homeProject.id)
  assert.equal(collectionRecords[0].seed,homeProject.seed)
  assert.deepEqual(collectionRecords[0].layers,[null,null,finalLower.layer],'Collection uses the same final layer ancestry, never Review')
  collectionTab='songs'
  assert.ok(renderPersonal('collection',{songSaves:[{songId:'ocean-eyes'}]}).includes('프로젝트 3개'),'Saved Song count includes actual same-song created Project')
  collectionTab='projects'
  console.log('PASS My Projects/Collection: consistent final state/filters, incomplete Mix rejected, pre-submission recording retained, same Record lineage, actual saved Song Project count.')
  for (const count of [2,4]) {
    const dynamicParts=Array.from({length:count},(_,index)=>({id:`free-${count}-${index}`,name:`Voice ${index+1}`,color:'#3b82f6',status:index?'open':'ready'}))
    const dynamicProject={id:`qa-project-${count}`,seed:`qa-seed-${count}`,parts:dynamicParts,totalParts:count,partCount:count,key:'F minor'}
    const dynamicHomeProject={...dynamicProject,title:`HOME ${count}`,name:`${count} voices`,songId:'ocean-eyes',status:'RECRUITING'}
    const dynamicHome=renderHome({createdProjects:[dynamicHomeProject]})
    assert.ok(section(dynamicHome,'최근 열린 프로젝트').includes(`0/${count} 제출`))
    const dynamicDetail=renderDetail({createdProjects:[dynamicHomeProject],initialProjectId:dynamicHomeProject.id})
    assert.ok(dynamicDetail.includes(`00/0${count} · RECRUITING`))
    for(const part of dynamicParts)assert.ok(dynamicDetail.includes(`data-part="${part.id}"`),'Detail retains the actual dynamic Part IDs')
    const dynamicFinals=Object.fromEntries(dynamicParts.map(part=>[part.id,{id:`${dynamicProject.id}:${part.id}`,projectId:dynamicProject.id,partId:part.id,blob:new Blob(['final']),kind:'project-track',submissionStatus:'success'}]))
    const dynamicSaved={createdProjects:[dynamicHomeProject],createdProjectTracks:{[dynamicProject.id]:dynamicFinals},projectLikes:[{projectId:dynamicProject.id}]}
    assert.ok(renderPersonal('collection',dynamicSaved).includes(`MIXING · ${count}/${count}`))
    assert.ok(renderPersonal('collection',{...dynamicSaved,createdMixes:{[dynamicProject.id]:{url:'blob:dynamic-final'}}}).includes(`COMPLETE · ${count}/${count}`))
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
  // Actual React effects/controls in isolated Node DOM; preview DSP and GPU are
  // injected boundaries. No browser, device microphone, or listening claim.
  const controlsSource=source.replace(/import \{ createRecordingInflowRenderer, createResonanceRenderer \} from ['"]\.\/resonanceWebGL\.js['"]/,'const createRecordingInflowRenderer=()=>()=>{}; const createResonanceRenderer=()=>({dispose(){}})')
    .replace('  createPreviewMix,','  createPreviewMix as unusedPreviewMix,')
    + '\nconst createPreviewMix=async options=>{globalThis.__qaDetailPreviewCalls.push(options);return {url:"blob:qa-detail-preview",duration:12}};'
  await writeFile(controlsTemp,(await transformWithOxc(controlsSource,'App.jsx',{jsx:{runtime:'classic'}})).code.replace('./IntegratedViews.jsx','./.qa-single-app-views.mjs').replace('./Icons.jsx','./.qa-single-app-icons.mjs').replace('./VoicePreferenceChoices.jsx','./.qa-single-app-preferences.mjs'))
  const dom=new Window({url:'http://localhost/'})
  for(const key of ['window','document','navigator','location','localStorage','sessionStorage','HTMLElement','Event','Image','ResizeObserver'])Object.defineProperty(globalThis,key,{value:key==='window'?dom:dom[key],configurable:true,writable:true})
  globalThis.IS_REACT_ACT_ENVIRONMENT=true
  globalThis.__qaDetailPreviewCalls=[]
  dom.AudioContext=class{}
  dom.HTMLMediaElement.prototype.play=async function(){this.qaPlaying=true}
  dom.HTMLMediaElement.prototype.pause=function(){this.qaPlaying=false}
  const {Detail:InteractiveDetail}=await import(controlsTemp.href)
  const container=document.createElement('div');document.body.append(container)
  const root=createRoot(container)
  const settle=async()=>act(async()=>{await new Promise(resolve=>setTimeout(resolve,30))})
  const click=async selector=>{const button=container.querySelector(selector);assert.ok(button,selector);await act(async()=>button.click());await settle()}
  const controlTracks=Object.fromEntries(Object.entries(fullTracks).map(([id,track])=>[id,{...track,url:`blob:qa-${id}`,duration:12,participant:`QA ${id}`}]))
  const beforeOriginals=await Promise.all(Object.values(controlTracks).map(track=>track.blob.text()))
  try{
    await act(async()=>root.render(React.createElement(InteractiveDetail,{...detailProps,createdProjectTracks:{[homeProject.id]:controlTracks}})))
    await settle()
    assert.equal(container.querySelectorAll('.include-toggle').length,3)
    assert.equal(globalThis.__qaDetailPreviewCalls.at(-1).tracks.length,3)
    await click('.include-toggle')
    assert.equal(globalThis.__qaDetailPreviewCalls.at(-1).tracks.length,2)
    assert.deepEqual(globalThis.__qaDetailPreviewCalls.at(-1).tracks.map(track=>track.partId),['harmony','lower'])
    await click('.row-track-play')
    assert.equal(container.querySelector('audio').getAttribute('src'),'blob:qa-lead','Individual Track uses its persisted audio URL')
    assert.equal(container.querySelector('audio').qaPlaying,true)
    await click('.listening-context button')
    await click('[data-part="harmony"] .include-toggle')
    await click('[data-part="lower"] .include-toggle')
    assert.equal(container.querySelector('.play-btn').disabled,true,'Zero selected Mix Tracks cannot play')
    assert.ok(container.textContent.includes('들을 트랙을 하나 이상 선택해 주세요.'))
    await click('[data-part="lead"] .include-toggle')
    assert.equal(container.querySelector('audio').getAttribute('src'),'blob:qa-detail-preview','One selected Track uses the same aligned preview path as a combination')
    assert.deepEqual(globalThis.__qaDetailPreviewCalls.at(-1).tracks.map(track=>track.partId),['lead'])
    await click('.play-btn')
    const previousAudio=container.querySelector('audio')
    assert.equal(previousAudio.qaPlaying,true)
    await click('[data-project-id="qa-static-project"]')
    assert.equal(previousAudio.qaPlaying,false,'Changing Project pauses the old audio')
    assert.equal(container.querySelector('#current-mix'),null,'Another Project cannot retain previous Project Track controls')
    assert.deepEqual(await Promise.all(Object.values(controlTracks).map(track=>track.blob.text())),beforeOriginals)
    console.log('PASS Detail isolated Node controls/effects: individual URL, selected Mix inputs, zero-selection disabled, Project switch pauses old media, original Blobs unchanged. Preview DSP/media hardware/GPU are not verified here.')
  }finally{await act(async()=>root.unmount());await dom.happyDOM.close()}
} finally { await Promise.all([unlink(temp).catch(()=>{}),unlink(iconsTemp).catch(()=>{}),unlink(preferencesTemp).catch(()=>{}),unlink(viewsTemp).catch(()=>{}),unlink(controlsTemp).catch(()=>{})]) }

