import {orderedSegments} from './ordered-path.js';
import fs from 'node:fs';
const joins=orderedSegments.slice(0,3).map((s,i)=>{const n=orderedSegments[i+1],a=s.to.map((v,k)=>v-s.c2[k]),b=n.c1.map((v,k)=>v-n.from[k]);return {afterSegment:i+1,point:s.to,turnDegrees:Math.acos(Math.max(-1,Math.min(1,(a[0]*b[0]+a[1]*b[1])/Math.hypot(...a)/Math.hypot(...b))))*180/Math.PI};});
const report={status:'unverified-connectivity',segments:orderedSegments.slice(0,4),joins,reason:'Position continuity does not establish filament identity. Two visits to [625,210] have abrupt tangent reversals; do not use these joins as observed evidence.'};
fs.writeFileSync(new URL('./upper-connectivity.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
