// Ordered source-pixel cubic segments, not an angle-sorted radius table.
// Upper blue return is a visual hypothesis. Occluded connections are explicit;
// this is NOT an exact filament reconstruction or an approved replacement.
export const sourceCenter=[625,617];
export const orderedSegments=[
 {from:[425,165],c1:[485,112],c2:[558,100],to:[625,210],observed:true},
 {from:[625,210],c1:[635,165],c2:[650,75],to:[610,77],observed:true},
 {from:[610,77],c1:[540,78],c2:[530,125],to:[625,210],observed:true},
 {from:[625,210],c1:[685,135],c2:[750,120],to:[820,165],observed:true},
 {from:[820,165],c1:[898,220],c2:[890,300],to:[940,365],observed:false},
 {from:[940,365],c1:[1010,445],c2:[1012,505],to:[1030,560],observed:false},
 {from:[1030,560],c1:[1102,670],c2:[1140,780],to:[1080,860],observed:false},
 {from:[1080,860],c1:[1012,995],c2:[896,1048],to:[790,1015],observed:false},
 {from:[790,1015],c1:[691,982],c2:[550,1040],to:[420,1030],observed:false},
 {from:[420,1030],c1:[270,1030],c2:[150,956],to:[130,815],observed:false},
 {from:[130,815],c1:[105,710],c2:[118,606],to:[210,480],observed:false},
 {from:[210,480],c1:[245,432],c2:[315,398],to:[340,360],observed:false},
 {from:[340,360],c1:[376,294],c2:[365,218],to:[425,165],observed:false}
];
export function orderedPoint(t){
 const u=((t/(Math.PI*2)%1)+1)%1*orderedSegments.length;
 const s=orderedSegments[Math.floor(u)],v=u-Math.floor(u),w=1-v;
 return [0,1].map(k=>w*w*w*s.from[k]+3*w*w*v*s.c1[k]+3*w*v*v*s.c2[k]+v*v*v*s.to[k]);
}
export function orderedContour(p,t,lane,out=[0,0,0]){
 const index=Math.round(Math.max(0,Math.min(1,lane))*23),strand=index%12,repeat=index<12?0:1;
 const xy=orderedPoint(t),x=xy[0]-625,z=xy[1]-617,r=Math.hypot(x,z);
 // One parent and one local strand rule, reused for both repetitions.
 const a=Math.atan2(z,x)+(p.phase-.35)*.15;
 const rr=(r+(strand-6)*1.3-repeat*190)/240;
 out[0]=Math.cos(a)*rr;out[2]=Math.sin(a)*rr;
 out[1]=.031+.004*Math.sin(t*3+strand*.2);return out;
}
