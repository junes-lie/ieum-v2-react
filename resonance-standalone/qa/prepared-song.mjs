import assert from 'node:assert/strict';
import {installPreparedSong} from './experiments/music-box/prepared-song.js';
const nodes=new Map();const node=()=>({disabled:false,textContent:'',value:'',style:{},parentElement:{before(){}},before(){},after(){},append(){},setAttribute(){},onclick(){},onchange(){}});
for(const id of ['#play','#demo','#seek','#duration','#source-label','#voice-count'])nodes.set(id,node());
globalThis.document={querySelector:s=>nodes.get(s),createElement:node};let fetches=0;
globalThis.fetch=async()=>{fetches++;return{ok:true,arrayBuffer:async()=>new ArrayBuffer(4)}};
const voices=Array.from({length:4},(_,i)=>{const children=new Map();return{active:i<3,energy:0,referenceRms:.1,card:{querySelector:s=>{if(!children.has(s))children.set(s,node());return children.get(s);}}}});
const transport={items:[],duration:176.35,playing:false,ready:async()=>{},pause(){this.playing=false;},ctx:{decodeAudioData:async()=>({duration:176.35})},setItems(items){this.items=items;},tick(){this.items.forEach((v,i)=>{v.energy=[.95,.8,0,.3][i];v.bands={low:.3,mid:.4,high:.2};});}};
nodes.get('#play').onclick=()=>{transport.playing=!transport.playing;};
const app=installPreparedSong({transport,voices,note(){},updatePlay(){},format:()=> '2:56'});
await nodes.get('#play').onclick();assert.equal(transport.playing,true);assert.equal(transport.items.length,4);assert.equal(fetches,4);assert.deepEqual(transport.items.map(v=>v.playbackGain),[1,0,0,0]);transport.tick(.016);assert.ok(voices[0].energy>voices[1].energy*5);assert.equal(voices[3].energy,0);
transport.setItems(voices);assert.equal(transport.items.length,4);await app.select();assert.equal(fetches,4);
await app.select('slowly');assert.equal(transport.items.length,2);transport.tick(.016);assert.equal(voices[0].energy,voices[1].energy);
await app.select('today');assert.equal(transport.items.length,1);await app.select('chance');assert.equal(fetches,7);
nodes.get('#demo').onclick();assert.equal(app.shared,false);transport.setItems(voices);assert.equal(voices[0].referenceRms,.1);
// Upload cancels an in-flight selection; stale decode cannot replace user files.
let release;globalThis.fetch=()=>new Promise(r=>release=()=>r({ok:true,arrayBuffer:async()=>new ArrayBuffer(4)}));
// Cached chance is instant, so use a fresh installation/transport for cancellation.
const second=installPreparedSong({transport:{...transport,setItems:()=>{},tick(){}},voices,note(){},updatePlay(){},format(){}});
const pending=second.select('today');await Promise.resolve();voices[0].card.querySelector('.file').onchange({target:{files:[{}]}});release();assert.equal(await pending,false);assert.equal(second.shared,false);
console.log('Prepared song mapping/cache/legacy choices/demo restore/upload cancellation passed (mock transport).');
