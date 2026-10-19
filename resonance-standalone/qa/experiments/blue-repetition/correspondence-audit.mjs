// Diagnose radial ordering; these metrics do not judge visual fidelity.
import fs from 'node:fs';
const here=new URL('./',import.meta.url);
const data=JSON.parse(fs.readFileSync(new URL('paths.json',here),'utf8'));
const result={sourceSha256:data.sourceSha256,visualApproval:false,groups:[]};
for(const group of [0,1]){
 const rows=data.curves.filter(c=>c.group===group).map(c=>c.radius);
 let orderExchanges=0,minAdjacentGap=Infinity;
 for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
  for(let t=0;t<rows[i].length;t++){
   const next=(t+1)%rows[i].length;
   const d=rows[i][t]-rows[j][t],e=rows[i][next]-rows[j][next];
   if(d*e<0)orderExchanges++;
   if(j===i+1)minAdjacentGap=Math.min(minAdjacentGap,-d);
  }
 }
 result.groups.push({group,strands:rows.length,orderExchanges,minAdjacentGap});
}
result.limitation='Fixed quantile rank and positive smoothing preserve radial order. Zero exchanges cannot reproduce the source inter-strand weave. A positive exchange count alone is not visual approval.';
console.log(JSON.stringify(result,null,2));
