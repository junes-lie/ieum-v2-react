import assert from 'node:assert/strict';
if(process.env.IEUM_SOURCE_FOLD==='1')globalThis.location={search:'?sourceFold=1'};
const {referenceContour}=await import('./referenceContours.js');
// Placement can differ; one voice must retain angular fold correspondence,
// radial derivatives and strand height across inward repetitions.
const profiles=[{phase:.35,brightness:.22},{phase:1.2,brightness:.6}];
let samples=0,maxPlacementError=0,maxDirectionError=0,maxHeightError=0;
for(const p of profiles)for(let strand=0;strand<12;strand++)for(let i=0;i<=720;i++){
 const t=i/720*2*Math.PI;
 const a=referenceContour(p,t,strand/23),b=referenceContour(p,t,(strand+12)/23);
 const ra=Math.hypot(a[0],a[2]),rb=Math.hypot(b[0],b[2]);
 maxPlacementError=Math.max(maxPlacementError,Math.abs(ra-rb-190/240));
 maxDirectionError=Math.max(maxDirectionError,Math.abs(a[0]/ra-b[0]/rb),Math.abs(a[2]/ra-b[2]/rb));
 maxHeightError=Math.max(maxHeightError,Math.abs(a[1]-b[1]));
 assert.deepEqual(a,referenceContour(p,t,strand/23));
 if(i===720)for(let k=0;k<3;k++)assert.ok(Math.abs(a[k]-referenceContour(p,0,strand/23)[k])<1e-9);
 samples++;
}
assert.ok(maxPlacementError<1e-9&&maxDirectionError<1e-9&&maxHeightError===0);
console.log(JSON.stringify({samples,maxPlacementError,maxDirectionError,maxHeightError,visualApproval:false}));
