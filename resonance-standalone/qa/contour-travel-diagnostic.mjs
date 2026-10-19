// Diagnose rejected local-parameter travel, without changing runtime geometry.
import fs from 'node:fs';
import crypto from 'node:crypto';
const source=fs.readFileSync(new URL('../src/contourStudy.js',import.meta.url),'utf8');
const widths=source.match(/const widths=\[([^;]+)\];/)[1].split(',').map(Number);
const TAU=2*Math.PI;
function spread(t){
 const u=((t/TAU%1)+1)%1*widths.length,i=Math.floor(u),f=u-i,b=f*f*(3-2*f);
 return widths[i]*(1-b)+widths[(i+1)%widths.length]*b;
}
const results=[];
for(const amplitude of [.18,.40,.85]){
 let minimum=Infinity,negative=0,total=0,worst=null;
 for(const phase of [0,2.65,5.25])for(let line=0;line<24;line++){
  const lane=line/23,group=Math.min(2,Math.floor(lane*3)),fine=lane*3-group;
  const q=t=>t+amplitude*spread(t)**2*Math.sin(TAU*fine)*Math.sin(t+phase);
  for(let i=0;i<3600;i++){
   const t=i*TAU/3600,h=1e-5,derivative=(q(t+h)-q(t-h))/(2*h);
   total++;if(derivative<0)negative++;
   if(derivative<minimum){minimum=derivative;worst={phase,line,t};}
  }
 }
 results.push({amplitude,minParameterDerivative:minimum,negativeSamples:negative,totalSamples:total,worst});
}
console.log(JSON.stringify({date:new Date().toISOString(),sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),results,
 interpretation:'Negative derivative means local travel reverses along the trace. This is an objective cause of the pointed returns in the large-travel render, not a visual-quality metric. Monotone reparameterization alone leaves a complete closed curve unchanged. Here only the mismatch between travelled trace and untravelled radial envelope changes geometry.',
 next:'Do not increase local travel to obtain weave. Trace an individual visible full inner filament against the outer filament and preserve its landmark correspondence; do not substitute colour-envelope boundaries or rotate the whole path.',visualApproval:false},null,2));
