import {planar} from './profiles.js';
// Sweep the existing planar family into tilted arches; keep each strand's identity.
export function spatialPose(p,t,lane,out=[0,0,0]){
 const s=lane*2-1,spacing=.82+.45*(.5+.5*Math.sin(3*t+p.phase));
 const u=.5+.5*Math.sign(s)*Math.pow(Math.abs(s),spacing);
 planar(p,t,.5,out);const cx=out[0],cz=out[2],c=Math.cos(t),sn=Math.sin(t);
 const arch=Math.pow(.5+.5*Math.cos(t-p.phase),1.35+.6*p.pitch);
 const echo=Math.pow(.5+.5*Math.cos(2*t+p.phase+.5),2.2);
 const folds=3+Math.round(p.brightness*5);
 const ripples=(.06+.25*p.brightness)*(1-.5*p.air)*Math.pow(.5+.5*Math.sin(folds*t-p.phase),2);
 const h=.07+(.82+.55*p.pitch)*arch+(.18+.22*p.brightness)*echo+ripples;
 const gather=.25+.75*Math.pow(.5+.5*Math.cos(2*t-p.phase+.7),1.2);
 const width=.045+(.15+.09*p.brightness)*gather;
 const radial=(u*2-1)*width;
 const roll=1.05*Math.sin(t+p.phase+.45)+.35*Math.sin(3*t-p.phase);
 const r=radial*Math.cos(roll),lean=.14*h*Math.sin(t-p.phase),sway=.08*h*Math.cos(2*t+p.phase);
 out[0]=cx+(r+lean)*c-sway*sn;
 out[2]=cz+(r+lean)*sn+sway*c;
 const raw=h+radial*Math.sin(roll)*.85-.025;
 out[1]=.025+.5*(raw+Math.sqrt(raw*raw+.0016));return out;
}
