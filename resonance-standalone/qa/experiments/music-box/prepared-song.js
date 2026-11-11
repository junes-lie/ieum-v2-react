// One mixed song, one audible source; shared analysis is not separate singers.
export function installPreparedSong({transport,voices,note,updatePlay,format}) {
 const $=s=>document.querySelector(s);
 let shared=false,loaded=null,pending=null,generation=0,initial=true;
 const mix={energy:0,referenceRms:.2,playbackGain:1},vocal={energy:0,referenceRms:.2,playbackGain:0};
 const button=document.createElement('button');button.id='prepared-song';button.textContent='천천히 물드는 우리 · 듀엣';
 $('#play').parentElement.before(button);
 const setItems=transport.setItems.bind(transport),tick=transport.tick.bind(transport);
 transport.setItems=(items,demo=false)=>setItems(shared?[mix,vocal]:items,demo);
 transport.tick=dt=>{tick(dt);if(shared){const source=vocal;for(const v of voices){if(v===source)continue;v.energy=v.active?(source?.energy||0):0;v.bands={...(source?.bands||{})};}}};
 function label(){if(shared)$('#source-label').textContent='천천히 물드는 우리 · 합쳐진 보컬 반응 · 사람별 분리 없음';}
 function leave(){generation++;shared=false;initial=false;voices.forEach(v=>{v.card.querySelector('.mute').disabled=false;v.buffer=v.realBuffer||null;v.energy=0;v.bands={};});transport.setItems(voices.filter(v=>v.active),false);}
 async function select(){
  if(pending)return pending;
  const gen=++generation;
  pending=(async()=>{
   button.disabled=true;$('#play').disabled=true;$('#demo').disabled=true;
   transport.pause();updatePlay();note('천천히 물드는 우리 불러오는 중…');
   try{
    await transport.ready();
    if(!loaded){loaded=await Promise.all(['reference','vocals'].map(async name=>{const response=await fetch(`./audio/slowly-coloring-us/${name}.mp3`);if(!response.ok)throw Error('음원 응답 '+response.status);return transport.ctx.decodeAudioData(await response.arrayBuffer());}));}
    mix.buffer=loaded[0];vocal.buffer=loaded[1];mix.energy=0;vocal.energy=0;
    if(gen!==generation)return false;
    shared=true;initial=false;
    voices.forEach(v=>{v.buffer=null;v.energy=0;v.muted=false;v.referenceRms=.2;v.card.querySelector('.mute').disabled=true;v.card.querySelector('.mute').setAttribute('aria-pressed','false');});
    transport.setItems(voices.filter(v=>v.active),false);
    $('#seek').max=transport.duration;$('#duration').textContent=format(transport.duration);label();
    note('천천히 물드는 우리 · 듀엣 · 반주를 제외한 합쳐진 보컬에 반응합니다. 사람별 보컬은 아직 분리되지 않았습니다.');return true;
   }catch(e){note('음원을 불러오지 못했습니다: '+e.message);return false;}
   finally{button.disabled=false;$('#play').disabled=voices.some(v=>v.busy);$('#demo').disabled=voices.some(v=>v.busy);pending=null;}
  })();return pending;
 }
 const play=$('#play').onclick;
 $('#play').onclick=async()=>{if(initial&&!voices.some(v=>v.realBuffer)){if(!await select())return;}await play();if(shared){label();note(transport.playing?'천천히 물드는 우리 재생 중 · 합쳐진 보컬에 반응':'천천히 물드는 우리 일시정지');}};
 button.onclick=()=>select();
 const demo=$('#demo').onclick;$('#demo').onclick=()=>{leave();return demo();};
 for(const v of voices){const input=v.card.querySelector('.file'),change=input.onchange;input.onchange=e=>{if(e.target.files[0])leave();return change(e);};}
 const count=$('#voice-count').onchange;$('#voice-count').onchange=e=>{count(e);label();};
 $('#source-label').textContent='천천히 물드는 우리 · 재생하면 음원을 불러옵니다';
 return {select,get shared(){return shared;}};
}
