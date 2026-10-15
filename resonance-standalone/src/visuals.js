import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {record,flower,TAU,clamp} from './profiles.js';
const rand=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const contactAt=(field,t)=>{const x=((t/TAU*128)%128+128)%128,i=Math.floor(x);return field[i]*(1-x+i)+field[(i+1)%128]*(x-i);};
export function bloomSVG(p,size=320){
 const pt=[0,0,0],lanes=18,steps=500;let paths='';
 const centers=Array.from({length:steps},(_,i)=>flower(p,i/steps*TAU,.5));
 for(let l=0;l<lanes;l++){
  let d='',pen=false;for(let i=0;i<=steps;i++){
   flower(p,i/steps*TAU,l/(lanes-1),pt);
   let hidden=false;
   for(let j=0;j<steps;j+=2){const gap=Math.min(Math.abs(i%steps-j),steps-Math.abs(i%steps-j));if(gap<38)continue;const c=centers[j];if(c[2]>pt[2]+.08&&Math.hypot(c[0]-pt[0],c[1]-pt[1])<.105){hidden=true;break;}}
   if(hidden){pen=false;continue;}
   d+=(pen?'L':'M')+(160+pt[0]*112).toFixed(2)+','+(156-pt[1]*112).toFixed(2);pen=true;
  }
  paths+=`<path d="${d}" stroke="${p.color}" stroke-width=".85" opacity="${(.72+.25*Math.sin(Math.PI*l/(lanes-1))).toFixed(2)}"/>`;
 }
 let dots='';for(let i=0;i<400+p.air*280;i++){flower(p,rand(i+1)*TAU,rand(i+323),pt);const spread=1+.025+rand(i+88)*p.air*.12;dots+=`<circle cx="${(160+pt[0]*112*spread).toFixed(2)}" cy="${(156-pt[1]*112*spread).toFixed(2)}" r="${(.35+rand(i+12)*.65).toFixed(2)}" opacity="${(.25+rand(i+5)*.5).toFixed(2)}"/>`;}
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 320 320" role="img" aria-label="${p.id} 목소리 매듭"><g fill="none" stroke-linecap="round">${paths}</g><g fill="${p.color}">${dots}</g></svg>`;
}
const vertex=`attribute vec3 aStart,aEnd;attribute float aT,aLane;uniform float uLift,uTime,uEnergy;uniform vec2 uResolution;uniform float uDpr;uniform vec4 uBands;varying float vFade,vEdge,vT,vLane;
vec3 deform(vec3 p){float pulse=sin(aT*7.-uTime*2.);float bend=sin(aT*3.+uTime*.8);p.xz*=1.+uEnergy*.012*pulse+uBands.y*.015*bend;p.y=.018+(p.y-.018)*uLift+uLift*(.008*sin(aT*2.+uTime*.45)+uEnergy*(.07+.09*pulse*pulse)+uBands.x*.12*pow(sin(aT*2.-uTime),2.)+uBands.z*.035*sin(aT*11.-uTime*2.)+uBands.w*.05*bend);return p;}
void main(){vec4 a=projectionMatrix*modelViewMatrix*vec4(deform(aStart),1.);vec4 b=projectionMatrix*modelViewMatrix*vec4(deform(aEnd),1.);vec2 direction=normalize((b.xy/b.w-a.xy/a.w)*uResolution);vec2 normal=vec2(-direction.y,direction.x);vec4 clip=mix(a,b,position.x);clip.xy+=normal*position.y*1.45*uDpr/uResolution*clip.w;gl_Position=clip;vEdge=position.y;vT=aT;vLane=aLane;vFade=(.80+.20*exp(-pow((aLane-.5)*4.,2.)))*(.86+.14*sin(aT*3.+.4));}`;
const fragment=`uniform vec3 uColor;uniform float uOpacity,uAir,uTime;varying float vFade,vEdge,vT,vLane;void main(){float edge=1.-smoothstep(.60,1.,abs(vEdge));if(edge<.02)discard;float flow=.88+.12*sin(vT*8.-uTime*.65+vLane*3.);gl_FragColor=vec4(uColor,uOpacity*vFade*edge*flow);
#include <colorspace_fragment>
}`;
export class ResonanceView{
 constructor(stage,voices){this.stage=stage;this.voices=voices;this.mode=1;this.morph=1;this.height=1;this.particles=true;this.time=0;this.rotation=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.speed=this.reduced?0:1;this.frames=0;this.fps=60;this.transition=false;this.selected=null;
 this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.outputColorSpace=THREE.SRGBColorSpace;stage.append(this.renderer.domElement);
 this.scene=new THREE.Scene();this.group=new THREE.Group();this.scene.add(this.group);this.camera=new THREE.PerspectiveCamera(37,1,.1,40);this.camera.position.set(0,3.4,6.0);this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enablePan=false;this.controls.enableZoom=false;this.controls.minPolarAngle=.25;this.controls.maxPolarAngle=1.36;this.controls.target.set(0,.3,0);this.controls.enableDamping=true;this.controls.dampingFactor=.07;this.controls.addEventListener('start',()=>{this.transition=false;});
 this.makeRecord();this.layers=voices.map(v=>this.makeLayer(v));this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(stage);this.resize();
 this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();stage.dispatchEvent(new CustomEvent('rendererror'));});
 }
 makeRecord(){
 const side=new THREE.Mesh(new THREE.CylinderGeometry(2.62,2.62,.055,160),new THREE.MeshBasicMaterial({color:0x252626}));side.position.y=-.05;this.group.add(side);
 const top=new THREE.Mesh(new THREE.CircleGeometry(2.62,180),new THREE.ShaderMaterial({vertexShader:`varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`precision highp float;varying vec2 vP;void main(){float r=length(vP),a=atan(vP.y,vP.x);float grooves=.5+.5*sin(r*250.)*(1.-smoothstep(.6,2.8,fwidth(r*250.)));float fine=.5+.5*sin(r*425.)*(1.-smoothstep(.6,2.8,fwidth(r*425.)));float shine=pow(abs(cos(a-.65)),18.)*.15+pow(abs(cos(a+1.1)),35.)*.055;float edge=smoothstep(2.53,2.60,r)*.035;float g=.003+grooves*.0015+fine*.0005+shine*(.22+.30*grooves)+edge*.12;gl_FragColor=vec4(vec3(g*.94,g*.97,g),1.);
#include <colorspace_fragment>
}`}));top.rotation.x=-Math.PI/2;top.position.y=-.019;this.group.add(top);
 const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle='#1a1c1d';x.fillRect(0,0,512,512);x.strokeStyle='#4b4941';x.lineWidth=1;for(const r of [240,229,51]){x.beginPath();x.arc(256,256,r,0,TAU);x.stroke();}x.textAlign='center';x.fillStyle='#d8cfbc';x.font='45px Georgia';x.fillText('I E U M',256,204);x.font='14px monospace';x.fillStyle='#8f8c83';x.fillText('VOICES IN RESONANCE',256,332);x.font='12px monospace';x.fillText('SIDE A / RESONANCE',256,365);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
 const label=new THREE.Mesh(new THREE.CircleGeometry(.72,80),new THREE.MeshBasicMaterial({map:tex}));label.rotation.x=-Math.PI/2;label.position.y=-.008;this.group.add(label);
 const hole=new THREE.Mesh(new THREE.CircleGeometry(.047,32),new THREE.MeshBasicMaterial({color:0x030405}));hole.rotation.x=-Math.PI/2;hole.position.y=.002;this.group.add(hole);
 }
 makeLayer(v){const contacts=this.contactField(v);const lanes=24,N=360,positions=new Float32Array(lanes*N*6),params=new Float32Array(lanes*N*2),laneValues=new Float32Array(lanes*N*2);let o=0,q=0;const xyz=[0,0,0];for(let l=0;l<lanes;l++)for(let i=0;i<N;i++)for(let j=0;j<2;j++){const t=(i+j)/N*TAU;const lane=.5+(l/(lanes-1)-.5)*(1-.4*contactAt(contacts,t));record(v.p,t,lane,0,0,1,xyz);positions.set(xyz,o);o+=3;laneValues[q]=l/(lanes-1);params[q++]=t;}
 const geometry=new THREE.BufferGeometry(),vertices=lanes*N*6;
 const corners=[[0,-1],[1,-1],[0,1],[0,1],[1,-1],[1,1]];
 const quad=new Float32Array(vertices*3),starts=new Float32Array(vertices*3),ends=new Float32Array(vertices*3),ts=new Float32Array(vertices),ls=new Float32Array(vertices);
 for(let i=0;i<lanes*N;i++)for(let k=0;k<6;k++){const v=i*6+k;quad[v*3]=corners[k][0];quad[v*3+1]=corners[k][1];starts.set(positions.subarray(i*6,i*6+3),v*3);ends.set(positions.subarray(i*6+3,i*6+6),v*3);ts[v]=params[i*2];ls[v]=laneValues[i*2];}
 geometry.setAttribute('position',new THREE.BufferAttribute(quad,3));geometry.setAttribute('aStart',new THREE.BufferAttribute(starts,3));geometry.setAttribute('aEnd',new THREE.BufferAttribute(ends,3));geometry.setAttribute('aT',new THREE.BufferAttribute(ts,1));geometry.setAttribute('aLane',new THREE.BufferAttribute(ls,1));
 const uniforms={uLift:{value:1},uTime:{value:0},uEnergy:{value:0},uBands:{value:new THREE.Vector4()},uColor:{value:new THREE.Color(v.p.color)},uAir:{value:v.p.air},uOpacity:{value:.95},uResolution:{value:new THREE.Vector2(1,1)},uDpr:{value:this.renderer.getPixelRatio()}};
 const line=new THREE.Mesh(geometry,new THREE.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:true,side:THREE.DoubleSide}));line.frustumCulled=false;this.group.add(line);
 const count=Math.round(1100+v.p.air*700),pos=new Float32Array(count*3),alpha=new Float32Array(count),sizes=new Float32Array(count);for(let i=0;i<count;i++){alpha[i]=.45+rand(i+73)*.5;sizes[i]=1.1+rand(i+22)*1.0;}
 const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pos,3).setUsage(THREE.DynamicDrawUsage));pg.setAttribute('aAlpha',new THREE.BufferAttribute(alpha,1));pg.setAttribute('aSize',new THREE.BufferAttribute(sizes,1));
 const points=new THREE.Points(pg,new THREE.ShaderMaterial({uniforms:{uColor:uniforms.uColor,uOpacity:{value:1},uDpr:{value:this.renderer.getPixelRatio()}},vertexShader:`attribute float aAlpha,aSize;uniform float uDpr;varying float vAlpha;void main(){vAlpha=aAlpha;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=aSize*uDpr;}`,fragmentShader:`uniform vec3 uColor;uniform float uOpacity;varying float vAlpha;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(uColor,vAlpha*uOpacity*smoothstep(.5,.15,d));
#include <colorspace_fragment>
}`,transparent:true,depthWrite:false}));points.frustumCulled=false;this.group.add(points);return {v,line,points,uniforms,pos,count,profileKey:JSON.stringify(v.p),flow:0,contacts,phases:Float64Array.from({length:count},(_,i)=>rand(i+v.p.phase)*TAU)};}
 contactField(v){
 const field=new Float32Array(128);const peers=this.voices.filter(w=>w!==v&&w.active!==false);
 const curves=peers.map(w=>Array.from({length:128},(_,i)=>record(w.p,i/128*TAU,.5)));
 for(let i=0;i<128;i++){const p=record(v.p,i/128*TAU,.5);let closest=9;
  for(const curve of curves)for(const q of curve)closest=Math.min(closest,Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]));
  field[i]=Math.exp(-closest*closest/.075);
 }
 return field;
 }
 refreshContacts(){for(let i=0;i<this.layers.length;i++)this.rebuild(i);}
 rebuild(index){const old=this.layers[index];for(const obj of [old.line,old.points]){this.group.remove(obj);obj.geometry.dispose();obj.material.dispose();}const next=this.makeLayer(this.voices[index]);if(old.profileKey===next.profileKey){next.phases.set(old.phases);next.flow=old.flow;}this.layers[index]=next;}
 setMode(mode){this.mode=mode;this.transition=true;this.transitionAt=performance.now();this.fromMorph=this.morph;this.fromCamera=this.camera.position.clone();this.fromTarget=this.controls.target.clone();this.controls.enabled=false;}
 resize(){const w=this.stage.clientWidth,h=this.stage.clientHeight;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.fov=2*Math.atan(Math.tan(18.5*Math.PI/180)/Math.min(1,this.camera.aspect*.84))*180/Math.PI;this.camera.updateProjectionMatrix();for(const l of this.layers??[])l.uniforms.uResolution.value.set(w*this.renderer.getPixelRatio(),h*this.renderer.getPixelRatio());}
 update(dt,playing,realDt=dt){dt=Math.max(0,dt);this.frames++;this.fpsElapsed=(this.fpsElapsed||0)+realDt;this.fpsFrames=(this.fpsFrames||0)+1;if(this.fpsElapsed>=1){this.fps=this.fpsFrames/this.fpsElapsed;this.fpsElapsed=0;this.fpsFrames=0;}this.time+=dt*this.speed;if(this.transition){const t=this.reduced?1:clamp((performance.now()-this.transitionAt)/900),ease=t*t*(3-2*t);this.morph=this.fromMorph+(this.mode-this.fromMorph)*ease;this.camera.position.lerpVectors(this.fromCamera,new THREE.Vector3(0,this.mode?3.4:8.4,this.mode?6.0:.001),ease);this.controls.target.lerpVectors(this.fromTarget,new THREE.Vector3(0,this.mode?.3:0,0),ease);if(t===1){this.transition=false;this.controls.enabled=!!this.mode;}}this.controls.update();
 // Stable personal layout: no whole-record spin and no random path replacement.
 const xyz=[0,0,0];for(const layer of this.layers){const {v,uniforms}=layer;const focused=this.selected===null||this.selected===v.p.id;
 uniforms.uResolution.value.set(this.renderer.domElement.width,this.renderer.domElement.height);uniforms.uLift.value=this.morph*this.height;uniforms.uTime.value=this.time;uniforms.uEnergy.value=this.reduced||!this.speed?0:v.energy;const bands=this.reduced||!this.speed?{}:(v.bands||{});uniforms.uBands.value.set(bands.low||0,bands.mid||0,bands.high||0,bands.onset||0);uniforms.uOpacity.value=(1-v.p.air*.05)*(focused?1:.12);layer.line.visible=v.visible&&v.active!==false;layer.points.visible=layer.line.visible&&this.particles;layer.points.material.uniforms.uOpacity.value=focused?1:.1;
 if(v.active===false)continue;layer.flow+=dt*this.speed*(.025+v.energy*.12);for(let i=0;i<layer.count;i++){let t=layer.phases[i];const contact=contactAt(layer.contacts,t);t=layer.phases[i]=(t+dt*this.speed*(.025+v.energy*.12)/(1+contact*1.4))%TAU;const lane=.5+(rand(i+239)-.5)*(1-.4*contact);record(v.p,t,lane,0,0,this.morph*this.height,xyz);const e=uniforms.uEnergy.value,pulse=Math.sin(t*7-this.time*2),bend=Math.sin(t*3+this.time*.8),b=uniforms.uBands.value;xyz[0]*=1+e*.012*pulse+b.y*.015*bend;xyz[2]*=1+e*.012*pulse+b.y*.015*bend;xyz[1]+=this.morph*this.height*(.008*Math.sin(t*2+this.time*.45)+e*(.07+.09*pulse*pulse)+b.x*.12*Math.sin(t*2-this.time)**2+b.z*.035*Math.sin(t*11-this.time*2)+b.w*.05*bend);const jitter=(.022+v.p.air*.045)*Math.sin(i*12.98);xyz[0]+=jitter*Math.cos(t);xyz[2]+=jitter*Math.sin(t);xyz[1]+=Math.abs(jitter)*this.morph;layer.pos.set(xyz,i*3);}layer.points.geometry.attributes.position.needsUpdate=true;}
 this.renderer.render(this.scene,this.camera);}

 dispose(){this.observer.disconnect();this.controls.dispose();this.scene.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});this.renderer.dispose();}
}
