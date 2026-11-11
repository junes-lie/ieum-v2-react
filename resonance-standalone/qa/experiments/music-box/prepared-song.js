// One mixed song, one audible source; shared analysis is not separate singers.
export function installPreparedSong({transport,voices,note,updatePlay,format}) {
 const $=s=>document.querySelector(s);
 let shared=false,loaded=null,pending=null,generation=0,initial=true;
 const button=document.createElement('button');button.id='prepared-song';button.textContent='오늘 같은 날 · 22초';
 $('#play').parentElement.before(button);
 const setItems=transport.setItems.bind(transport),tick=transport.tick.bind(transport);
 transport.setItems=(items,demo=false)=>setItems(shared?items.slice(0,1):items,demo);
 transport.tick=dt=>{tick(dt);if(shared){const source=transport.items[0];for(const v of voices){if(v===source)continue;v.energy=v.active?(source?.energy||0):0;v.bands={...(source?.bands||{})};}}};
 function label(){if(shared)$('#source-label').textContent='오늘 같은 날 · 전체 믹스에 공명 반응';}
 function leave(){generation++;shared=false;initial=false;voices.forEach(v=>v.card.querySelector('.mute').disabled=false);}
 async function select(){
  if(pending)return pending;
  const gen=++generation;
  pending=(async()=>{
   button.disabled=true;$('#play').disabled=true;$('#demo').disabled=true;
   transport.pause();updatePlay();note('오늘 같은 날 불러오는 중…');
   try{
    await transport.ready();
    if(!loaded){const response=await fetch('./audio/today-like-this/reference.mp3');if(!response.ok)throw Error('음원 응답 '+response.status);loaded=await transport.ctx.decodeAudioData(await response.arrayBuffer());}
    if(gen!==generation)return false;
    shared=true;initial=false;
    voices.forEach(v=>{v.buffer=loaded;v.energy=0;v.muted=false;v.referenceRms=.2;v.card.querySelector('.mute').disabled=true;v.card.querySelector('.mute').setAttribute('aria-pressed','false');});
    transport.setItems(voices.filter(v=>v.active),false);
    $('#seek').max=transport.duration;$('#duration').textContent=format(transport.duration);label();
    note('오늘 같은 날 · 22초 전체 믹스. 각 색은 같은 음원에 반응합니다.');return true;
   }catch(e){note('음원을 불러오지 못했습니다: '+e.message);return false;}
   finally{button.disabled=false;$('#play').disabled=voices.some(v=>v.busy);$('#demo').disabled=voices.some(v=>v.busy);pending=null;}
  })();return pending;
 }
 const play=$('#play').onclick;
 $('#play').onclick=async()=>{if(initial&&!voices.some(v=>v.realBuffer)){if(!await select())return;}await play();if(shared){label();note(transport.playing?'오늘 같은 날 재생 중 · 전체 믹스에 반응':'오늘 같은 날 일시정지');}};
 button.onclick=()=>select();
 const demo=$('#demo').onclick;$('#demo').onclick=()=>{leave();return demo();};
 for(const v of voices){const input=v.card.querySelector('.file'),change=input.onchange;input.onchange=e=>{if(e.target.files[0])leave();return change(e);};}
 const count=$('#voice-count').onchange;$('#voice-count').onchange=e=>{count(e);label();};
 $('#source-label').textContent='오늘 같은 날 · 재생하면 음원을 불러옵니다';
 return {select,get shared(){return shared;}};
}
