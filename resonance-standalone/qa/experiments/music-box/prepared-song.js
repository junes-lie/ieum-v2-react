// One audible mix; aligned singer and backing stems are analysis-only.
const clamp=x=>Math.max(0,Math.min(1,x));
export function chanceResponse(index,source,backing,playing){
 const own=clamp(source?.energy||0),bg=clamp(backing?.energy||0);
 // Keep independent vocal dynamics below the existing flow kernel's .18 cap.
 const energy=playing?(index<2?.012+.018*bg+.15*own:index===2?.018+.07*bg:0):0;
 const bands={};for(const key of ['low','mid','high','onset'])bands[key]=playing?(index<2?clamp((source?.bands?.[key]||0)*own+.10*(backing?.bands?.[key]||0)*bg):index===2?(backing?.bands?.[key]||0)*.45:0):0;
 return {energy,bands,vocalEnergy:own};
}
export function installPreparedSong({transport,voices,note,updatePlay,format}) {
 const $=s=>document.querySelector(s);
 let shared=false,pending=null,generation=0,initial=true,selected='chance',loadedKey=null;
 const cache=new Map(),mix={energy:0,referenceRms:.2,playbackGain:1};
 const stems=Array.from({length:3},()=>({energy:0,referenceRms:.12,playbackGain:0}));
 const configs={chance:{title:'Chance',dir:'chance',names:['reference','steven','kara','backing']},slowly:{title:'천천히 물드는 우리',dir:'slowly-coloring-us',names:['reference','vocals']},today:{title:'오늘 같은 날',dir:'today-like-this',names:['reference']}};
 let original=null;
 const button=document.createElement('button');button.id='prepared-song';button.textContent='선택한 음원 불러오기';$('#play').parentElement.before(button);
 const selector=document.createElement('select');selector.id='prepared-choice';selector.setAttribute('aria-label','준비된 음원');selector.innerHTML='<option value="chance">Chance · 개별 보컬</option><option value="slowly">천천히 물드는 우리 · 합쳐진 보컬</option><option value="today">오늘 같은 날 · 전체 믹스</option>';selector.value='chance';button.before(selector);
 const credit=document.createElement('p');credit.id='song-credit';credit.style.cssText='font-size:12px;line-height:1.6;overflow-wrap:anywhere';credit.hidden=true;button.after(credit);
 const cues=document.createElement('div');cues.id='chance-cues';cues.hidden=true;credit.after(cues);
 for(const [title,time] of [['전주',3],['Steven 독창',13],['Kara 독창',25],['함께 부르기',82]]){const b=document.createElement('button');b.textContent=title;b.onclick=async()=>{try{if(await select('chance')){await transport.seek(time);await transport.play();updatePlay();}}catch(e){note(e.message);}};cues.append(b);}
 const setItems=transport.setItems.bind(transport),tick=transport.tick.bind(transport);
 transport.setItems=(items,demo=false)=>setItems(shared?[mix,...stems.filter(s=>s.buffer)]:items,demo);
 transport.tick=dt=>{tick(dt);if(shared)voices.forEach((v,i)=>{
  if(selected==='chance'){const response=chanceResponse(i,stems[i],stems[2],transport.playing);v.energy=v.active?response.energy:0;v.bands=response.bands;v.vocalEnergy=response.vocalEnergy;v.data=stems[i]?.data;}
  else{const source=selected==='slowly'?stems[0]:mix;v.energy=v.active?source.energy:0;v.bands={...source.bands};v.data=source.data;}
 });};
 function label(){if(!shared)return;$('#source-label').textContent=selected==='chance'?'Chance · 파랑 Steven / 코랄 Kara / 크림 반주':configs[selected].title+(selected==='slowly'?' · 합쳐진 보컬 반응 · 사람별 분리 없음':' · 전체 믹스 반응');}
 function leave(){generation++;shared=false;initial=false;credit.hidden=true;cues.hidden=true;voices.forEach((v,i)=>{v.card.querySelector('.mute').disabled=false;if(original){v.card.querySelector('.file-name').textContent=original[i].file;v.card.querySelector('.descriptor').textContent=original[i].descriptor;v.referenceRms=original[i].referenceRms;}v.buffer=v.realBuffer||null;v.energy=0;v.bands={};v.data=null;});original=null;transport.setItems(voices.filter(v=>v.active),false);}
 async function select(key=selector.value){
  if(pending)return pending;
  if(shared&&loadedKey===key)return true;
  const gen=++generation,config=configs[key];
  pending=(async()=>{
   button.disabled=true;selector.disabled=true;$('#play').disabled=true;$('#demo').disabled=true;
   transport.pause();updatePlay();note(config.title+' 불러오는 중…');
   try{
    await transport.ready();let loaded=cache.get(key);
    if(!loaded){loaded=await Promise.all(config.names.map(async name=>{const response=await fetch(`./audio/${config.dir}/${name}.mp3`);if(!response.ok)throw Error('음원 응답 '+response.status);return transport.ctx.decodeAudioData(await response.arrayBuffer());}));cache.set(key,loaded);}
    if(gen!==generation)return false;
    if(!shared)original=voices.map(v=>({referenceRms:v.referenceRms,file:v.card.querySelector('.file-name').textContent,descriptor:v.card.querySelector('.descriptor').textContent}));
    selected=key;selector.value=key;loadedKey=key;mix.buffer=loaded[0];mix.energy=0;mix.bands={};
    stems.forEach((s,i)=>{s.buffer=loaded[i+1]||null;s.energy=0;s.bands={};s.previousRms=0;});
    shared=true;initial=false;
    voices.forEach((v,i)=>{v.buffer=null;v.energy=0;v.bands={};v.muted=false;v.referenceRms=.12;v.card.querySelector('.mute').disabled=true;v.card.querySelector('.mute').setAttribute('aria-pressed','false');v.card.querySelector('.file-name').textContent=key==='chance'?['Steven M Bryant · 독립 보컬','Kara Square · 독립 보컬','반주 · 5개 악기 스템','연결된 스템 없음'][i]:config.title;v.card.querySelector('.descriptor').textContent=key==='chance'?['파랑 · Steven의 목소리에 반응','코랄 · Kara의 목소리에 반응','크림 · 반주에 잔잔하게 반응','비교용 매듭 · 음원 미연결'][i]:'공유 음원 분석';});
    transport.setItems(voices.filter(v=>v.active),false);
    $('#seek').max=transport.duration;$('#duration').textContent=format(transport.duration);label();cues.hidden=key!=='chance';credit.hidden=key!=='chance';
    credit.innerHTML='“Chance” — <a href="https://ccmixter.org/files/mindmapthat/31735" target="_blank" rel="noopener">Kara Square, Steven M Bryant, The3amAssociation</a> · <a href="https://creativecommons.org/licenses/by-nc/3.0/" target="_blank" rel="noopener">CC BY-NC 3.0</a> · 원곡 재생 / MP3 변환 및 스템 분석';
    note(key==='chance'?'Chance · 두 보컬의 독립 스템으로 반응합니다. 전주에는 반주에 맞춰 잔잔하게 움직입니다.':$('#source-label').textContent);return true;
   }catch(e){selector.value=selected;note('음원을 불러오지 못했습니다: '+e.message);return false;}
   finally{button.disabled=false;selector.disabled=false;$('#play').disabled=voices.some(v=>v.busy);$('#demo').disabled=voices.some(v=>v.busy);pending=null;}
  })();return pending;
 }
 const play=$('#play').onclick;
 $('#play').onclick=async()=>{if(initial&&!voices.some(v=>v.realBuffer)){if(!await select())return;}await play();if(shared){label();note(configs[selected].title+(transport.playing?' 재생 중':' 일시정지'));}};
 button.onclick=()=>select();selector.onchange=()=>select();
 const demo=$('#demo').onclick;$('#demo').onclick=()=>{leave();return demo();};
 for(const v of voices){const input=v.card.querySelector('.file'),change=input.onchange;input.onchange=e=>{if(e.target.files[0])leave();return change(e);};}
 const count=$('#voice-count').onchange;$('#voice-count').onchange=e=>{count(e);label();};
 $('#source-label').textContent='Chance · 재생하면 개별 보컬 스템을 불러옵니다';
 return {select,get shared(){return shared;},get stems(){return stems;},get selected(){return selected;}};
}
