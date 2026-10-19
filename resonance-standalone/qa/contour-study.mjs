import assert from 'node:assert/strict';
import {contourStudy} from '../src/contourStudy.js';
import {defaults,TAU} from '../src/profiles.js';
let min=Infinity,max=0,seam=0,n=0;
for(const pitch of [0,.5,1])for(const brightness of [0,.5,1])for(const air of [0,.5,1])for(const phase of [0,2.65,5.25]){
 const p={pitch,brightness,air,phase};
 for(let l=0;l<24;l++){
  const lane=l/23,a=contourStudy(p,0,lane),b=contourStudy(p,TAU,lane);seam=Math.max(seam,Math.hypot(...a.map((v,i)=>v-b[i])));
  for(let i=0;i<360;i++){const q=contourStudy(p,TAU*i/360,lane);assert(q.every(Number.isFinite));const r=Math.hypot(q[0],q[2]);min=Math.min(min,r);max=Math.max(max,r);}
 }
 for(let i=0;i<360;i++){
  const t=TAU*i/360,points=[1/6,.5,5/6].map(l=>contourStudy(p,t,l));
  const radii=points.map(q=>Math.hypot(q[0],q[2]));assert(radii[0]>radii[1]&&radii[1]>radii[2]);
  // Regression of the CURRENT radial-copy study only, not a reference fidelity requirement.
  // Independent traced reference paths may cross/change angular correspondence.
  // Keep this assertion while runtime is unchanged; do not use it as visual acceptance.
  assert(Math.abs(points[0][0]*points[2][2]-points[0][2]*points[2][0])<1e-8);
 }n++;
}
assert(seam<1e-8);assert(min>.8&&max<2.62);
for(const p of defaults)assert.deepEqual(contourStudy(p,1.2,.36),contourStudy({...p,id:'other',color:'#000'},1.2,.36));
console.log(JSON.stringify({profiles:n,finite:true,closed:true,orderedRadialMacroContours:true,referenceFilamentCorrespondence:false,slotIndependent:true,minRadius:min,maxRadius:max,maxSeam:seam,visualApproval:false},null,2));
