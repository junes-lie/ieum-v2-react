// Diagnose what the CURRENT study can represent. This is not a fidelity test.
import {contourStudy} from '../src/contourStudy.js';
import {defaults,TAU} from '../src/profiles.js';
let maxAngularSeparation=0,minMacroGap=Infinity,samples=0;
for(const p of defaults)for(let i=0;i<720;i++){
 const t=TAU*i/720,a=contourStudy(p,t,0);
 for(let j=1;j<24;j++){
  const b=contourStudy(p,t,j/23);
  const angle=Math.abs(Math.atan2(a[0]*b[2]-a[2]*b[0],a[0]*b[0]+a[2]*b[2]));
  maxAngularSeparation=Math.max(maxAngularSeparation,angle);samples++;
 }
 const r=[1/6,.5,5/6].map(l=>{const q=contourStudy(p,t,l);return Math.hypot(q[0],q[2]);});
 minMacroGap=Math.min(minMacroGap,r[0]-r[1],r[1]-r[2]);
}
console.log(JSON.stringify({samples,maxAngularSeparationRadians:maxAngularSeparation,minMacroGap,
 conclusion:'All lanes are radial scalar multiples of one sampled envelope at matched t. Three macro-contour centers stay ordered. This preserves the old study but cannot establish correspondence to independently traced reference filaments.',
 caveat:'Fine-lane radial crossings are not ruled out by this audit. Matched-t collinearity alone is not proof that all geometric crossings are impossible.',
 nextGate:'Two complete candidate reference filaments with observed and inferred portions distinguished, followed by overlay review. Do not replace with more same-ray spacing adjustments.',
 visualApproval:false},null,2));
