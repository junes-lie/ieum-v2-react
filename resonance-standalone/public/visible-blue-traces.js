// Open source-pixel chains; this diagnostic never closes or joins them.
const box=document.createElement('section');
box.innerHTML=`<h2>연속 픽셀 구간 — 교차에서 정지</h2><p>색 마스크에서 얻은 열린 구간입니다. 교차·가림 너머의 동일 선 연결을 의미하지 않습니다. 자른 이미지의 경계에 닿는 구간은 제외했습니다. 선 선택 후 원본과 번갈아 비교할 수 있습니다.</p><label>구간 <select id="trace-choice"></select></label> <button id="trace-toggle" aria-pressed="true">추적선 숨기기</button><p id="trace-info" aria-live="polite">추적 자료 읽는 중</p><svg viewBox="450 65 350 160" role="img" aria-label="열린 파랑 픽셀 추적과 양끝 정지점"><image href="repetition-reference.png" width="1254" height="1254"/><g id="pixel-trace"><path style="stroke:#ffed73;stroke-width:1;stroke-dasharray:none"/><circle r="2.5"/><circle r="2.5"/></g></svg><p>기본 색 임계값에서 47구간. 임계값을 바꾸면 46–48구간으로 달라집니다. 픽셀 연결은 추출 조건에 의존하므로 부모 폐곡선으로 채택하지 않았습니다. <a href="visible-blue-traces.json">좌표·조건 원본</a></p>`;
document.querySelector('main').append(box);
const select=box.querySelector('select'),group=box.querySelector('g'),button=box.querySelector('button'),info=box.querySelector('#trace-info');
fetch('visible-blue-traces.json').then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(data=>{
 data.traces.forEach((t,i)=>{const o=document.createElement('option');o.value=i;o.textContent=`${i+1} · ${t.lengthPx}px`;select.append(o)});
 function draw(){const t=data.traces[Number(select.value)];group.querySelector('path').setAttribute('d','M'+t.points.map(p=>p.join(',')).join(' L'));[...group.querySelectorAll('circle')].forEach((c,i)=>{const p=t.points[i?t.points.length-1:0];c.setAttribute('cx',p[0]);c.setAttribute('cy',p[1])});info.textContent=`${t.points[0].join(', ')} → ${t.points.at(-1).join(', ')} · ${t.lengthPx}px · 양끝 연결 수 ${t.endpointDegrees.join(' / ')}. 갈림길의 다음 선은 선택하지 않았습니다.`}
 select.value='10';select.onchange=draw;draw();
 button.onclick=()=>{const show=group.style.display==='none';group.style.display=show?'':'none';button.setAttribute('aria-pressed',String(show));button.textContent=show?'추적선 숨기기':'추적선 보기'};
}).catch(e=>{info.textContent='추적 자료를 불러오지 못했습니다: '+e.message;button.disabled=true});

// Show all immediate alternatives, including short edges omitted by the long-chain view.
const junctionBox=document.createElement('section');
junctionBox.innerHTML=`<h2>양끝의 짧은 갈림길</h2><p>세 임계값에서 같은 갈림길이 나오지만, 어느 가지도 8px 방향 측정 길이에 도달하지 못합니다. 아래쪽 두 가지는 약 1.5° 차이로 방향만으로 선택할 수 없습니다. 연결은 채택하지 않았습니다.</p><button id="junction-toggle" aria-pressed="true">갈림길 표시 숨기기</button><div id="junction-views"></div><p><a href="blue-junction-audit.json">모든 가지 좌표·임계값별 검사</a></p>`;
document.querySelector('main').append(junctionBox);
fetch('blue-junction-audit.json').then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(data=>{
 const result=data.results.find(r=>r.threshold===30);
 result.endpoints.forEach(endpoint=>{
  const [x,y]=endpoint.point, section=document.createElement('div');
  const summary=endpoint.alternatives.map(a=>`${a.lengthPx}px / ${a.turnDegrees}° / 측정 길이 부족`).join(' · ');
  section.innerHTML=`<h3>(${x}, ${y}) — 연결 미확정</h3><p>${summary}</p><svg viewBox="${x-15} ${y-15} 30 30" role="img" aria-label="갈림길 ${x}, ${y} 원본 확대"><image href="repetition-reference.png" width="1254" height="1254"/><g class="junction-overlay"></g></svg>`;
  const overlay=section.querySelector('g');
  endpoint.alternatives.forEach((branch,i)=>{const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M'+branch.points.map(p=>p.join(',')).join(' L'));path.style.cssText=`stroke:${i?'#ff9797':'#fff49a'};stroke-width:.18;stroke-dasharray:none`;overlay.append(path)});
  junctionBox.querySelector('#junction-views').append(section);
 });
 const button=junctionBox.querySelector('button');
 button.onclick=()=>{const show=button.getAttribute('aria-pressed')!=='true';junctionBox.querySelectorAll('.junction-overlay').forEach(g=>g.style.display=show?'':'none');button.setAttribute('aria-pressed',String(show));button.textContent=show?'갈림길 표시 숨기기':'갈림길 표시 보기'};
}).catch(e=>{junctionBox.querySelector('#junction-views').textContent='검사 자료 읽기 실패: '+e.message});
