import React, {useEffect,useRef,useState} from 'react'
import {DEMO_SCENARIOS} from './demoSession.js'
import './demo-stage.css'

const savedEntry={id:'saved',label:'저장한 상태로 재방문',detail:'내 프로필·참여·임시 녹음·저장 목록 이어보기',flow:'Flow 3 · UF06 / UF10 / UF12'}
const entries=[...DEMO_SCENARIOS.filter(item=>item.entry),savedEntry]
// Phones present only the registered-profile entry; desktop keeps every scenario.
const resolveEntry=id=>window.matchMedia('(max-width: 600px)').matches
  ? DEMO_SCENARIOS.find(item=>item.id==='profile-ready')
  : id==='saved'?savedEntry:DEMO_SCENARIOS.find(item=>item.id===id)||entries[0]
const href=(id,run)=>`?demo=${id}${run?'&run='+run:''}`
const safeRun=value=>/^[a-zA-Z0-9-]{1,80}$/.test(value||'')?value:null
const newRun=item=>item.entry?crypto.randomUUID():null
export default function DemoStage({initialScenario}) {
  const [selected,setSelected]=useState(()=>resolveEntry(initialScenario))
  const [run,setRun]=useState(()=>safeRun(new URLSearchParams(location.search).get('run'))||newRun(resolveEntry(initialScenario)))
  const [width,setWidth]=useState(430)
  const [error,setError]=useState('')
  const [switching,setSwitching]=useState(false)
  const [snapshot,setSnapshot]=useState(null)
  const frameRef=useRef(null)
  const initialHash=useRef(location.hash)
  useEffect(()=>{window.history.replaceState(window.history.state,'',href(selected.id,run))},[])
  useEffect(()=>{
    const receive=event=>{
      if(event.origin!==location.origin||event.source!==frameRef.current?.contentWindow||event.data?.type!=='ieum-demo-profile-state'||event.data.scene!==selected.id)return
      setSnapshot(event.data)
    }
    window.addEventListener('message',receive)
    return()=>window.removeEventListener('message',receive)
  },[selected.id,run])
  useEffect(()=>{
    const restore=()=>{const params=new URLSearchParams(location.search);setSnapshot(null);setSelected(resolveEntry(params.get('demo')));setRun(safeRun(params.get('run')))}
    window.addEventListener('popstate',restore)
    return()=>window.removeEventListener('popstate',restore)
  },[])
  const choose=async item=>{
    if(switching)return
    setSwitching(true);setError('')
    try{
      const prepare=frameRef.current?.contentWindow?.__IEUM_PREPARE_PRESENTATION_SWITCH__
      if(prepare&&!await prepare()){setError('현재 녹음을 보관한 뒤 다시 선택해 주세요.');return}
      const nextRun=newRun(item)
      setSnapshot(null);setSelected(item);setRun(nextRun)
      window.history.pushState({},'',href(item.id,nextRun))
    }catch{setError('현재 작업을 보관하지 못했어요. 지금 화면을 유지합니다.')}
    finally{setSwitching(false)}
  }
  const current=snapshot?.scene===selected.id?snapshot:null
  const status=current?.status==='error'?'저장 상태를 확인하지 못했어요.':current?.status!=='ready'?'시작 상태 준비 중…':`${current.hasProfile?'프로필 있음':'프로필 없음'} · ${current.joined?'참여 확정':current.pendingInvitations?'받은 초대 대기':'미참여'}`
  const screenNames={home:'홈',detail:'곡·프로젝트 상세',projects:'내 프로젝트',workspace:'작업실',record:'녹음·Review',voice:'목소리 등록',finder:'보컬 찾기',search:'검색',my:'내 목소리',collection:'컬렉션',complete:'완성곡','vocal-profile':'보컬 프로필','create-project':'새 프로젝트'}
  const src=selected.id==='saved'?`?embedded=1${initialHash.current}`:`?scene=${selected.id}${run?'&run='+run:''}`
  return <main className="demo-stage" style={{'--demo-width':`${width}px`}}>
    <aside className="demo-menu" aria-label="유저플로우 진입점">
      <a className="demo-brand" href="./">IEUM · PRESENTATION</a>
      <h1>시작 상황을 선택하세요.</h1>
      <nav aria-label="사용자 시작 상황">{entries.map((item,index)=><a key={item.id} href={href(item.id,null)} aria-current={selected.id===item.id?'page':undefined} aria-disabled={switching} onClick={event=>{event.preventDefault();choose(item)}}><span>{String(index+1).padStart(2,'0')}</span><span><strong>{item.label}</strong><small>{item.detail}</small></span></a>)}</nav>
      <p className="demo-entry-note">상황을 선택하면 해당 시작 상태로 열려요.<br/>화면을 이동해도 이 메뉴는 유지됩니다.</p>
      <div className="demo-preview-caption"><div aria-label="모바일 화면 폭">{[390,430].map(size=><button key={size} aria-pressed={width===size} onClick={()=>setWidth(size)}>{size}</button>)}</div></div>

      <p className="demo-profile-status" role="status" data-demo-profile-state={current?.status==='ready'?(current.hasProfile?'present':'absent'):current?.status||'loading'}>{status}</p>
      {error&&<p role="alert">{error}</p>}
      <details className="demo-notes"><summary>현재 상태</summary><p>{selected.detail}</p>{current?.status==='ready'&&<p data-demo-current-screen>현재 화면 · {screenNames[current.screen]||current.screen}</p>}
      {selected.id==='saved'?<p>기존에 보관한 내 데이터를 그대로 이어갑니다. 임시 녹음과 제출 Track은 현재 저장 상태를 따릅니다.</p>:selected.music?<p>A와 B는 같은 기기의 두 시연 역할입니다. 각각 직접 녹음하고 제출해야 완성됩니다. A/B 전환은 같은 음악 프로젝트를 이어갑니다.</p>:<p>상황별 예시 데이터로 시작합니다. 다시 선택하면 새로 시작하며, 이전 시연과 기존 내 데이터는 지우지 않습니다.</p>}
      <p>마이크는 녹음 시작을 누를 때만 열립니다.</p>
      </details>
    </aside>
    <section className="demo-preview" aria-label={`${selected.label} 모바일 시연`}>
      <div className="demo-phone"><iframe ref={frameRef} key={`${selected.id}:${run||'saved'}`} title={`IEUM ${selected.label}`} src={src} allow="microphone; autoplay"/></div>
    </section>
  </main>
}
