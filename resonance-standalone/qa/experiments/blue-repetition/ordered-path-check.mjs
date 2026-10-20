import assert from 'node:assert/strict';
import {orderedSegments,orderedContour,orderedPoint} from './ordered-path.js';
let reverseSteps=0,maxPairError=0;
for(let i=0;i<orderedSegments.length;i++)assert.deepEqual(orderedSegments[i].to,orderedSegments[(i+1)%orderedSegments.length].from);
for(const phase of [.35,1.2])for(let j=0;j<12;j++)for(let i=0;i<720;i++){
 const t=i/720*Math.PI*2,p={phase},a=orderedContour(p,t,j/23),b=orderedContour(p,t,(j+12)/23);
 const error=Math.abs(Math.hypot(a[0],a[2])-Math.hypot(b[0],b[2])-190/240);maxPairError=Math.max(maxPairError,error);
 assert.ok(error<1e-12);assert.equal(a[1],b[1]);assert.deepEqual(a,orderedContour(p,t,j/23));
}
for(let i=0;i<720;i++){const a=orderedPoint(i/720*Math.PI*2),b=orderedPoint((i+1)/720*Math.PI*2);const cross=(a[0]-625)*(b[1]-617)-(a[1]-617)*(b[0]-625);if(cross<0)reverseSteps++;}
assert.ok(reverseSteps>0);
console.log(JSON.stringify({closed:true,reverseSteps,maxPairError,sourceFidelityApproved:false,visualDecision:'rejected: inferred remainder simplifies silhouette; narrow bundled lines'}));
