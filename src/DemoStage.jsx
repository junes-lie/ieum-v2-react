import React, {useEffect,useRef,useState} from 'react'
import {DEMO_SCENARIOS,demoTrackDatabaseName} from './demoSession.js'
import './demo-stage.css'

const demoHref = id => `?demo=${id}`
export function DemoLauncher() {
  return <aside className="demo-launcher" aria-label="화면 시연 바로가기">
    <span>IEUM · PRESENTATION</span><p>화면을 바로 확인하세요.</p>
    <a href={demoHref('workspace')}>작업실 바로 보기 <span>↗</span></a>
    <a href={demoHref('recording')}>녹음 화면 바로 보기 <span>↗</span></a>
    <a href={demoHref('first-visit')}>전체 시연 메뉴 <span>↗</span></a>
  </aside>
}
export default function DemoStage({initialScenario}) {
  const [selected,setSelected]=useState(()=>DEMO_SCENARIOS.find(item=>item.id===initialScenario)||DEMO_SCENARIOS[0])
  const [width,setWidth]=useState(430)
  const [revision,setRevision]=useState(0)
  const [resetting,setResetting]=useState(false)
  const [error,setError]=useState('')
  const frameRef=useRef(null)
  useEffect(()=>{
    const restore=()=>setSelected(DEMO_SCENARIOS.find(item=>item.id===new URLSearchParams(location.search).get('demo'))||DEMO_SCENARIOS[0])
    window.addEventListener('popstate',restore)
    return()=>window.removeEventListener('popstate',restore)
  },[])
  const choose = item => {setSelected(item);setError('');window.history.pushState({},'',demoHref(item.id))}
  // Only presentation databases/keys are affected by this explicit reset.
  const reset = async () => {
    setResetting(true);setError('')
    try {
      const frame=frameRef.current
      if(frame)frame.src='about:blank'
      await new Promise(resolve=>setTimeout(resolve,100))
      await new Promise((resolve,reject)=>{
        const request=indexedDB.deleteDatabase(demoTrackDatabaseName(selected.id))
        request.onsuccess=resolve;request.onerror=()=>reject(request.error)
        request.onblocked=()=>reject(Error('화면을 닫고 다시 시도해 주세요.'))
      })
      for(const storage of [localStorage,sessionStorage]){
        for(const key of Object.keys(storage))if((selected.music?['music-a','music-b']:[selected.id]).some(id=>key.startsWith(`ieum-demo:${id}:`)))storage.removeItem(key)
      }
    } catch {setError('시연 초기화에 실패했어요. 다시 시도해 주세요.')}
    finally {setRevision(value=>value+1);setResetting(false)}
  }
  return <main className="demo-stage">
    <aside className="demo-menu">
      <a className="demo-brand" href="./">IEUM<span>이음</span></a>
      <p className="demo-eyebrow">VOICE TOGETHER</p>
      <h1>시연할 순간을<br/>선택하세요.</h1>
      <nav aria-label="시연 상황 선택">{DEMO_SCENARIOS.map((item,index)=><a key={item.id} href={demoHref(item.id)} aria-current={selected.id===item.id?'page':undefined} onClick={event=>{event.preventDefault();choose(item)}}><span>{String(index+1).padStart(2,'0')}</span><span><strong>{item.label}</strong><small>{item.detail}</small></span><b aria-hidden="true">↗</b></a>)}</nav>
      <a className="demo-exit" href="./">일반 앱으로 돌아가기 ↗</a>
    </aside>
    <section className="demo-preview" aria-label={`${selected.label} 모바일 시연`}>
      <div className="demo-preview-caption"><span>{selected.label}</span><div aria-label="모바일 화면 폭">{[390,430].map(size=><button key={size} aria-pressed={width===size} onClick={()=>setWidth(size)}>{size}</button>)}</div></div>
      <div className="demo-phone" style={{'--demo-width':`${width}px`}}><iframe ref={frameRef} key={`${selected.id}:${revision}`} title={`IEUM ${selected.label}`} src={`?scene=${selected.id}`} allow="microphone; autoplay" /></div>
      <p className="demo-size">{width} × 932 · MOBILE WEB</p>
    </section>
    <aside className="demo-notes"><p className="demo-eyebrow">NOW SHOWING</p><h2>{selected.label}</h2><p>{selected.detail}</p><hr/>{selected.music&&<p>① 음악 녹음 A를 끝내고 제출해 주세요.<br/>② 음악 녹음 B에서 다시 노래하고 제출하면 완성됩니다.<br/>같은 기기의 두 시연 역할이며 두 Track 모두 직접 녹음합니다. 화음 편곡이 아닌 유니즌입니다.</p>}<p>프레임 안에서 실제 버튼을 눌러<br/>다음 화면까지 이어갈 수 있어요.</p><p>녹음은 시작 버튼을 눌렀을 때<br/>마이크 권한을 요청합니다.</p><hr/><p>예시 프로필과 시연 음원을 사용합니다.<br/>기존 프로필·녹음과 별도로 보관됩니다.</p><button className="demo-reset-scene" onClick={reset} disabled={resetting}>{resetting?'초기화 중…':'이 상황 처음부터 다시 보기'}</button>{error&&<p role="alert">{error}</p>}<a href={`?scene=${selected.id}`} target="_blank" rel="noreferrer">현재 화면만 새 탭에서 열기 ↗</a></aside>
  </main>
}
