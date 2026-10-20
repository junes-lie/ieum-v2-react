const TAU=Math.PI*2;
export function motionParams(p){return [1.25+(1-p.air)*.7+p.brightness*.3,.09+p.brightness*.16+p.pitch*.03,p.phase,.18*(1-p.air)];}
export function motionPulse(t,lane,time,p){const z=t*2/TAU-time*p[0]/TAU+p[2]/TAU+lane*.07,q=z-Math.floor(z),x=Math.pow(Math.min(1,Math.max(0,q/.34)),.72);return Math.sin(Math.PI*x)**2*(1+p[3]*Math.sin(4*Math.PI*x)*Math.exp(-3*x));}
export function motionLift(t,lane,time,p,play,energy,onset){return p[1]*(.16+play*(.65+energy*1.2+onset*.5))*motionPulse(t,lane,time,p);}
// Scale the existing height over time, never spread strand lanes into a sheet.
export function motionGain(t,lane,time,p,play,energy,onset){const wave=.5+.5*Math.sin(t*2-time*p[0]+p[2]+lane*.07);const shape=Math.pow(Math.max(0,Math.min(1,wave)),.9+.2*Math.min(1,energy)+.1*Math.min(1,onset));return 1-(.08+.92*Math.max(0,Math.min(1,play)))*(1-shape);}
export const motionGLSL=`
uniform vec4 uDance;
uniform float uDanceOn,uPlay;
float motionPulse(float t,float lane,float time){float q=fract(t*2./6.28318530718-time*uDance.x/6.28318530718+uDance.z/6.28318530718+lane*.07);float x=pow(clamp(q/.34,0.,1.),.72);return pow(sin(3.14159265359*x),2.)*(1.+uDance.w*sin(12.56637061436*x)*exp(-3.*x));}
float motionLift(float t,float lane,float time){return uDance.y*(.16+uPlay*(.65+uEnergy*1.2+uBands.w*.5))*motionPulse(t,lane,time);}
float motionGain(float t,float lane,float time){float wave=.5+.5*sin(t*2.-time*uDance.x+uDance.z+lane*.07);float shape=pow(clamp(wave,0.,1.),.9+.2*min(1.,uEnergy)+.1*min(1.,uBands.w));return 1.-(.08+.92*clamp(uPlay,0.,1.))*(1.-shape);}
`;
