// Compare observed open arcs with actual candidate geometry; never pair occluded ends.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {referenceContour} from './referenceContours.js';
const root=new URL('../../../',import.meta.url);
const source=fs.readFileSync(new URL('qa/renders/approved-repetition-reference.png',root));
const audit=JSON.parse(fs.readFileSync(new URL('public/blue-cluster-audit.json',root)));
assert.equal(createHash('sha256').update(source).digest('hex'),audit.sourceSHA256);
const profile={phase:.35,brightness:.22};
const count=8192;
const curves=Array.from({length:12},(_,strand)=>Array.from({length:count},(_,i)=>{
 const q=referenceContour(profile,i/count*2*Math.PI,strand/23);
 return [625+240*q[0],615+240*q[2]];
}));
const arcs=audit.results.find(r=>r.threshold===30).exits.filter(e=>e.stableAcrossThresholds);
function score(points,curve){
 const distances=[],indices=[];
 for(const p of points){let best=Infinity,at=0;curve.forEach((q,i)=>{const d=(p[0]-q[0])**2+(p[1]-q[1])**2;if(d<best){best=d;at=i}});distances.push(Math.sqrt(best));indices.push(at);}
 const sorted=[...distances].sort((a,b)=>a-b);
 return {rmsPx:Math.sqrt(distances.reduce((s,d)=>s+d*d,0)/distances.length),maxPx:sorted.at(-1),indices};
}
const results=arcs.map((arc,id)=>{
 const candidates=curves.map((curve,strand)=>({strand,...score(arc.points,curve)})).sort((a,b)=>a.rmsPx-b.rmsPx);
 const best=candidates[0],curve=curves[best.strand];
 const angles=arc.points.map((p,i)=>{const a=arc.points[Math.max(0,i-4)],b=arc.points[Math.min(arc.points.length-1,i+4)],j=best.indices[i],c=curve[(j-8+count)%count],d=curve[(j+8)%count];const dot=(b[0]-a[0])*(d[0]-c[0])+(b[1]-a[1])*(d[1]-c[1]);return Math.acos(Math.min(1,Math.abs(dot)/(Math.hypot(b[0]-a[0],b[1]-a[1])*Math.hypot(d[0]-c[0],d[1]-c[1]))))*180/Math.PI;});
 return {id:id+1,observed:arc.points,lengthPx:arc.lengthPx,strand:best.strand,rmsPx:+best.rmsPx.toFixed(2),maxPx:+best.maxPx.toFixed(2),meanTangentErrorDegrees:+(angles.reduce((a,b)=>a+b,0)/angles.length).toFixed(2),nearestCandidate:best.indices.map(i=>curve[i].map(x=>+x.toFixed(3))),identityConfirmed:false};
});
assert.equal(results.length,8);
assert.ok(results.every(r=>Number.isFinite(r.meanTangentErrorDegrees)));
const report={sourceSHA256:audit.sourceSHA256,profile,samplesPerStrand:count,scope:'Eight threshold-stable open arcs only; no inferred connections, no full silhouette score. Nearest points on one candidate strand per arc; spatial distance does not prove matching filament identity.',results};
fs.writeFileSync(new URL('public/blue-parent-comparison.json',root),JSON.stringify(report)+'\n');
console.log(JSON.stringify(results.map(({observed,nearestCandidate,...r})=>r),null,2));
