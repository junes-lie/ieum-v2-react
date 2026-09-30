const PALETTE = [
  [0.24, 0.55, 1.0],
  [1.0, 0.42, 0.35],
  [0.95, 0.80, 0.62],
  [0.25, 0.78, 0.74]
]

// Each Part owns several deliberately asymmetric streams. They cross and peel
// away around the label instead of dividing the record into four territories.
const PATHS = [
  [
    [[0.91,-0.57],[0.25,-0.97],[-0.67,-0.78],[-0.91,-0.08]],
    [[-0.92,-0.04],[-0.82,0.58],[-0.13,0.93],[0.70,0.68]],
    [[0.78,-0.44],[0.33,-0.24],[-0.12,-0.42],[-0.70,-0.20]],
    [[-0.75,0.18],[-0.39,0.31],[0.09,0.17],[0.60,0.43]]
  ],
  [
    [[-0.88,-0.62],[-0.25,-0.97],[0.57,-0.76],[0.90,-0.22]],
    [[0.91,-0.18],[0.79,0.48],[0.22,0.78],[-0.60,0.88]],
    [[-0.76,-0.40],[-0.31,-0.22],[0.12,-0.43],[0.70,-0.18]],
    [[0.75,0.17],[0.38,0.32],[-0.06,0.18],[-0.60,0.46]]
  ],
  [
    [[-0.90,0.55],[-0.28,0.97],[0.60,0.82],[0.91,0.23]],
    [[0.76,-0.75],[0.16,-0.95],[-0.58,-0.75],[-0.89,-0.22]],
    [[0.78,0.44],[0.38,0.52],[0.05,0.28],[-0.48,0.54]],
    [[0.61,-0.76],[0.20,-0.62],[-0.14,-0.34],[-0.65,-0.48]]
  ],
  [
    [[0.50,0.91],[0.95,0.43],[0.82,-0.43],[0.18,-0.90]],
    [[-0.91,-0.17],[-0.79,0.55],[-0.05,0.93],[0.66,0.72]],
    [[0.78,-0.44],[0.41,-0.58],[0.09,-0.33],[-0.50,-0.60]],
    [[-0.73,0.30],[-0.35,0.13],[0.02,0.43],[0.55,0.76]]
  ]
]

const FLOATS_PER_VERTEX = 11
const FLOW_PATH_COUNT = 2

function hashSeed(value) {
  let hash = 2166136261
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function randomFrom(seed) {
  let value = seed || 1
  return () => {
    value += 0x6D2B79F5
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function compile(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(message)
  }
  return shader
}

function createProgram(gl, vertex, fragment) {
  const program = gl.createProgram()
  const vertexShader = compile(gl, gl.VERTEX_SHADER, vertex)
  const fragmentShader = compile(gl, gl.FRAGMENT_SHADER, fragment)
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program)
    gl.deleteProgram(program)
    throw new Error(message)
  }
  return program
}

function layerValue(layer, key, fallback) {
  const value = Number(layer?.[key])
  return Number.isFinite(value) ? value : fallback
}

function buildParticles({ slots, projectSeed, mobile }) {
  const filaments = []
  const grains = []
  const activeCount = slots.filter(Boolean).length
  const layerBlend = activeCount >= 4 ? .54 : activeCount === 3 ? .68 : .84
  const pushLine = (start, end) => filaments.push(...start, 0, ...end, 0)
  slots.forEach((layer, partIndex) => {
    if (!layer) return
    const energy = Math.max(0.08, Math.min(1, layerValue(layer, 'opacity', 0.32) * 2.25))
    const countWidth = activeCount >= 4 ? .82 : activeCount === 3 ? .92 : 1
    const sourceSpread = Math.max(.075, Math.min(.25, layerValue(layer, 'spread', 0.10)))
    const spread = (.060 + ((sourceSpread - .075) / .175) * .220) * countWidth
    const turbulence = Math.max(0.2, Math.min(1.5, layerValue(layer, 'turbulence', 0.65)))
    const drift = Math.max(0.08, Math.min(0.65, layerValue(layer, 'drift', 0.24)))
    const continuity = Math.max(0, Math.min(1, layerValue(layer, 'continuity', .68)))
    const articulation = Math.max(0, Math.min(1, layerValue(layer, 'articulation', .28)))
    const pitchWobble = Math.max(0, Math.min(1, layerValue(layer, 'pitchWobble', .24)))
    const particleDensity = Math.max(.72, Math.min(1.28, .72 + (layerValue(layer, 'particleCount', 78) - 42) / 83 * .56))
    const layerPhase = layerValue(layer, 'phase', partIndex * 1.47)
    const layerSeed = hashSeed(`${projectSeed}:${layer.signature || layer.seed || partIndex}`)
    const random = randomFrom(layerSeed)
    // Continuous micro-filaments establish the ribbon first. Their lanes,
    // phases and spacing are persistent, but never perfectly parallel.
    const strandCount = mobile ? 7 : 9
    const segmentCount = mobile ? 168 : 216
    const layerStrandCount = Math.max(4, Math.round(strandCount * (.72 + continuity * .35)))
    for (let pathIndex=0; pathIndex<FLOW_PATH_COUNT; pathIndex++) {
      for (let strand=0; strand<layerStrandCount; strand++) {
        const laneUnit=strand/(layerStrandCount-1)*2-1
        const irregular=(random()-.5)*.10
        const normal=(Math.sign(laneUnit)*Math.pow(Math.abs(laneUnit),1.18)+irregular)*spread*1.08
        const phase=layerPhase+pathIndex*.74+(random()-.5)*.12
        const speed=.0038+drift*.004+random()*.0018
        const core=1-Math.min(1,Math.abs(laneUnit))
        const highlight=random()<.12?1.55:1
        const alpha=(.020+core*.048+random()*.012)*layerBlend*(.96-articulation*.58)
        const brightness=(.92+core*.38)*highlight
        const micro=(.28+random()*.42)*turbulence+pitchWobble*(.48+random()*.44)
        for(let segment=0;segment<segmentCount;segment++){
          const t0=segment/segmentCount
          const t1=(segment+1)/segmentCount
          const base=[pathIndex,t0,normal,speed,phase,1,alpha,brightness,partIndex,micro]
          const next=[pathIndex,t1,normal,speed,phase,1,alpha,brightness,partIndex,micro]
          pushLine(base,next)
        }
      }
    }

    // Freely travelling grains sit above the filaments and keep the ribbon
    // from reading as vector outlines or topographic contour copies.
    const density = mobile ? 5200 : 7600
    const count = Math.round(density * particleDensity * (0.82 + energy * 0.30))
    for (let index = 0; index < count; index++) {
      const pathIndex = index % FLOW_PATH_COUNT
      // Stable, slightly irregular lanes create a readable grain along the
      // tangent. Sparse particles are allowed beyond the ribbon edge.
      const laneCount = 41
      const laneIndex = Math.floor(index / FLOW_PATH_COUNT) % laneCount
      const laneUnit = laneIndex / (laneCount - 1) * 2 - 1
      const laneCurve = Math.sign(laneUnit) * Math.pow(Math.abs(laneUnit), 1.22)
      const laneJitter = (random() - .5) * .065
      const edge = random() < 0.065 ? (random() - .5) * 1.82 : (laneCurve + laneJitter) * .52
      const rawPhase = random()
      const groupCount = 4 + Math.floor(random() * 3)
      const groupCenter = (Math.floor(rawPhase * groupCount) + .5) / groupCount
      const clusteredPhase = groupCenter + (random() - .5) * (.025 + continuity * .11)
      const pathPhase = ((rawPhase * (1 - articulation) + clusteredPhase * articulation) % 1 + 1) % 1
      const normal = edge * spread * (1.65 + random() * 0.8)
      const speed = 0.0048 + drift * 0.006 + random() * 0.0038
      const phase = layerPhase + (random() - .5) * .24
      const size = 0.44 + random() * 0.58 + energy * 0.10
      const core = 1 - Math.min(1, Math.abs(edge) * 1.45)
      const highlight = random() < .055 ? 1.65 : 1
      const alpha = (0.038 + random() * 0.14) * (0.74 + energy * 0.24) * (0.72 + core * .48) * layerBlend
      const brightness = (0.82 + random() * 0.70 + core * .22) * highlight
      const micro = (0.35 + random() * 0.55) * turbulence + pitchWobble * (0.45 + random() * 0.55)
      const particle = [pathIndex, pathPhase, normal, speed, phase, size, alpha, brightness, partIndex, micro]
      grains.push(...particle, 0)
    }
  })
  return {
    data: new Float32Array([...filaments, ...grains]),
    filamentVertexCount: filaments.length / FLOATS_PER_VERTEX,
    grainVertexCount: grains.length / FLOATS_PER_VERTEX
  }
}

function cubicPoint(controls, t) {
  const u=1-t,u2=u*u,t2=t*t
  return [
    u2*u*controls[0][0]+3*u2*t*controls[1][0]+3*u*t2*controls[2][0]+t2*t*controls[3][0],
    -(u2*u*controls[0][1]+3*u2*t*controls[1][1]+3*u*t2*controls[2][1]+t2*t*controls[3][1])
  ]
}

function cubicTangent(controls, t) {
  const u=1-t
  const dx=3*u*u*(controls[1][0]-controls[0][0])+6*u*t*(controls[2][0]-controls[1][0])+3*t*t*(controls[3][0]-controls[2][0])
  const dy=-(3*u*u*(controls[1][1]-controls[0][1])+6*u*t*(controls[2][1]-controls[1][1])+3*t*t*(controls[3][1]-controls[2][1]))
  const length=Math.max(.0001,Math.hypot(dx,dy))
  return [dx/length,dy/length]
}

const VERTEX_SHADER = `
precision highp float;
attribute float aPath;
attribute float aT;
attribute float aNormal;
attribute float aSpeed;
attribute float aPhase;
attribute float aSize;
attribute float aAlpha;
attribute float aBrightness;
attribute float aPart;
attribute float aMicro;
attribute float aHead;
uniform float uTime;
uniform float uMotion;
uniform float uLevel;
uniform float uActivePart;
uniform float uPixelRatio;
varying float vAlpha;
varying float vBrightness;
varying float vAngle;
varying float vPart;

vec2 flowBase(float part,float path,float t){
  float angle=fract(t)*6.28318530718;
  float warpedAngle=angle;
  float radius=.65;
  if(part<.5){
    warpedAngle+=.100*sin(angle-.35)+.045*sin(angle*2.+1.15);
    radius=.625
      +.115*sin(angle*2.+.35+path*.12)
      +.060*sin(angle*3.-1.05)
      +.025*sin(angle+1.00);
  }else if(part<1.5){
    warpedAngle+=.115*sin(angle+1.15)-.050*sin(angle*2.-.55);
    radius=.615
      +.125*sin(angle*2.+2.00+path*.14)
      +.070*sin(angle*3.+.45)
      -.028*sin(angle-.65);
  }else if(part<2.5){
    warpedAngle+=.090*sin(angle-1.62)+.055*sin(angle*2.+.28);
    radius=.630
      +.108*sin(angle*2.-.72+path*.11)
      +.064*sin(angle*3.+1.18)
      +.026*cos(angle+.42);
  }else{
    warpedAngle+=.108*sin(angle+2.28)-.048*sin(angle*2.+.76);
    radius=.620
      +.120*sin(angle*2.+2.52+path*.13)
      +.066*sin(angle*3.-.52)
      -.024*cos(angle-.84);
  }
  radius+=(path-.5)*.030;
  return vec2(cos(warpedAngle),sin(warpedAngle))*radius;
}
vec2 pointAt(float part,float path,float t){
  return flowBase(part,path,t);
}
vec2 tangentAt(float part,float path,float t){
  vec2 before=pointAt(part,path,fract(t-.001));
  vec2 after=pointAt(part,path,fract(t+.001));
  return normalize(after-before);
}
void main(){
  float t=fract(aT+uTime*aSpeed*uMotion+aHead*(0.0042+aSize*0.0015));
  vec2 center=pointAt(aPart,aPath,t);
  vec2 tangent=tangentAt(aPart,aPath,t);
  vec2 normal=vec2(-tangent.y,tangent.x);
  float focusDrift=.010*sin(uTime*.18+aPhase*1.37+aPath*.61);
  float focusT=fract(t+aPhase*.052+aPath*.033+focusDrift);
  float focusA=pow(.5+.5*cos((focusT-.13)*6.28318530718),10.);
  float focusB=pow(.5+.5*cos((focusT-.47)*6.28318530718),14.);
  float focusC=pow(.5+.5*cos((focusT-.78)*6.28318530718),9.);
  float focus=clamp(max(focusA,max(focusB,focusC)),0.,1.);
  float opening=.5+.5*sin(t*6.28318530718+aPhase*.70);
  float widthShape=(.10+1.28*pow(opening,1.65))
    *(.86+.14*sin(t*12.56637061436+aPhase*.23))
    *(.48+.92*focus)
    *(1.+focus*.12*sin(uTime*.42+aPart*1.19+aPath*.73));
  float lanePhase=aNormal*118.;
  float braid=(
    sin(t*18.8495559215+lanePhase+aPhase)*.0105
    +sin(t*31.4159265359-lanePhase*.58+aPhase*.43)*.0065
  )*(.30+.95*focus);
  float grain=(sin(t*49.0+aPhase)+0.45*sin(t*91.0-aPhase*1.7))*0.0065*aMicro;
  float live=1.0-step(0.25,abs(aPart-uActivePart));
  float liveWave=live*uLevel*sin(t*34.0+uTime*6.0+aPhase)*0.010;
  vec2 position=center+normal*(aNormal*widthShape+braid+grain+liveWave);
  float radius=length(position);
  float hubFade=smoothstep(0.245,0.305,radius);
  float rimFade=1.0-smoothstep(0.91,0.985,radius);
  vAlpha=aAlpha*(.16+focus*2.12)*hubFade*rimFade;
  vBrightness=aBrightness*(.78+focus*.72)*(1.0+live*uLevel*0.28);
  vAngle=atan(tangent.y,tangent.x);
  vPart=aPart;
  gl_PointSize=(aSize*2.55+live*uLevel*0.45)*uPixelRatio;
  gl_Position=vec4(position,0.0,1.0);
}`

const FRAGMENT_SHADER = `
precision mediump float;
uniform float uPointMode;
varying float vAlpha;
varying float vBrightness;
varying float vAngle;
varying float vPart;
vec3 colorFor(float part){
  if(part<0.5)return vec3(0.24,0.55,1.0);
  if(part<1.5)return vec3(1.0,0.42,0.35);
  if(part<2.5)return vec3(0.95,0.80,0.62);
  return vec3(0.25,0.78,0.74);
}
void main(){
  float alpha=vAlpha;
  if(uPointMode>.5){
    float radius=length(gl_PointCoord-.5);
    if(radius>.5)discard;
    alpha*=1.-smoothstep(.30,.50,radius);
  }
  if(alpha<0.012)discard;
  gl_FragColor=vec4(colorFor(vPart)*vBrightness*alpha,alpha);
}`

function drawMaterial(canvas) {
  const size = canvas.clientWidth
  if (size < 8) return
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  const pixels = Math.round(size * ratio)
  if (canvas.width !== pixels || canvas.height !== pixels) {
    canvas.width = pixels
    canvas.height = pixels
  }
  const ctx = canvas.getContext('2d')
  const center = pixels / 2
  const radius = center * 0.975
  ctx.clearRect(0, 0, pixels, pixels)
  ctx.save()
  ctx.beginPath()
  ctx.arc(center, center, radius, 0, Math.PI * 2)
  ctx.clip()
  const vinyl = ctx.createRadialGradient(center * .72, center * .68, 0, center, center, radius)
  vinyl.addColorStop(0, '#241c16')
  vinyl.addColorStop(.18, '#15100d')
  vinyl.addColorStop(.70, '#090706')
  vinyl.addColorStop(1, '#020202')
  ctx.fillStyle = vinyl
  ctx.fillRect(0, 0, pixels, pixels)
  for (let groove = 0; groove < 128; groove++) {
    const r = radius * (.225 + groove * .00588)
    ctx.beginPath()
    ctx.arc(center, center, r, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(205,174,139,${groove % 9 === 0 ? .034 : .010})`
    ctx.lineWidth = Math.max(.45, ratio * .28)
    ctx.stroke()
  }
  const sheen = ctx.createLinearGradient(center * .16, center * .14, center * 1.72, center * 1.78)
  sheen.addColorStop(0, 'rgba(255,235,205,.055)')
  sheen.addColorStop(.36, 'rgba(255,235,205,0)')
  sheen.addColorStop(.53, 'rgba(255,235,205,.026)')
  sheen.addColorStop(1, 'rgba(255,235,205,0)')
  ctx.fillStyle = sheen
  ctx.fillRect(0, 0, pixels, pixels)
  const hubRadius = radius * .215
  const hub = ctx.createRadialGradient(center-hubRadius*.28, center-hubRadius*.3, 0, center, center, hubRadius)
  hub.addColorStop(0, '#68503b')
  hub.addColorStop(.34, '#3b2c21')
  hub.addColorStop(1, '#0c0907')
  ctx.beginPath(); ctx.arc(center, center, hubRadius, 0, Math.PI*2); ctx.fillStyle=hub; ctx.fill()
  ctx.strokeStyle='rgba(205,164,116,.42)'; ctx.lineWidth=ratio; ctx.stroke()
  for(let ring=1;ring<10;ring++){
    ctx.beginPath();ctx.arc(center,center,hubRadius*(ring/10),0,Math.PI*2)
    ctx.strokeStyle='rgba(221,183,137,.045)';ctx.lineWidth=Math.max(.45,ratio*.26);ctx.stroke()
  }
  ctx.beginPath();ctx.arc(center,center,radius*.034,0,Math.PI*2);ctx.fillStyle='#020202';ctx.fill()
  ctx.restore()
}

export function createResonanceRenderer({ canvas, materialCanvas, slots, projectSeed, state, activePartIndex, levelRef, reducedMotion }) {
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance'
  })
  if (!gl) throw new Error('WebGL unavailable')
  const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER)
  const buffer = gl.createBuffer()
  const mobile = canvas.clientWidth < 440 || /Android|iPhone|iPad/i.test(navigator.userAgent)
  const particles = buildParticles({ slots, projectSeed, mobile })
  const vertexCount = particles.filamentVertexCount + particles.grainVertexCount
  const particleCount = particles.filamentVertexCount / 2 + particles.grainVertexCount
  gl.useProgram(program)
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, particles.data, gl.STATIC_DRAW)

  const stride = FLOATS_PER_VERTEX * 4
  const attributes = ['aPath','aT','aNormal','aSpeed','aPhase','aSize','aAlpha','aBrightness','aPart','aMicro','aHead']
  const particleLocations=attributes.map((name, index) => {
    const location = gl.getAttribLocation(program, name)
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, 1, gl.FLOAT, false, stride, index * 4)
    return location
  })
  const timeLocation = gl.getUniformLocation(program, 'uTime')
  const motionLocation = gl.getUniformLocation(program, 'uMotion')
  const levelLocation = gl.getUniformLocation(program, 'uLevel')
  const activeLocation = gl.getUniformLocation(program, 'uActivePart')
  const ratioLocation = gl.getUniformLocation(program, 'uPixelRatio')
  const pointModeLocation = gl.getUniformLocation(program, 'uPointMode')
  gl.uniform1f(activeLocation, state === 'recording' ? activePartIndex : -10)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

  let raf = 0
  let disposed = false
  const startedAt = performance.now()
  const motionByState = { rest:.28, recording:1.0, paused:0, processing:.62, playing:.92, complete:.22 }
  const motion = reducedMotion ? 0 : (motionByState[state] ?? .28)
  const resize = () => {
    drawMaterial(materialCanvas)
    const size = canvas.clientWidth
    if (size < 8) return false
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const pixels = Math.round(size * ratio)
    if (canvas.width !== pixels || canvas.height !== pixels) {
      canvas.width = pixels
      canvas.height = pixels
      gl.viewport(0, 0, pixels, pixels)
    }
    return true
  }
  const draw = now => {
    if (disposed || !resize()) return
    const elapsed=(now-startedAt)*.001
    gl.clearColor(0,0,0,0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(program)
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer)
    particleLocations.forEach((location,index)=>{
      gl.enableVertexAttribArray(location)
      gl.vertexAttribPointer(location,1,gl.FLOAT,false,stride,index*4)
    })
    gl.uniform1f(timeLocation, elapsed)
    gl.uniform1f(motionLocation, motion)
    gl.uniform1f(levelLocation, Math.max(0, Math.min(1, levelRef.current || 0)))
    gl.uniform1f(ratioLocation,Math.min(window.devicePixelRatio||1,2))
    gl.uniform1f(pointModeLocation,0)
    gl.drawArrays(gl.LINES,0,particles.filamentVertexCount)
    gl.uniform1f(pointModeLocation,1)
    gl.drawArrays(gl.POINTS,particles.filamentVertexCount,particles.grainVertexCount)
    if (motion > 0 || state === 'recording') raf = requestAnimationFrame(draw)
  }
  const observer = new ResizeObserver(() => draw(performance.now()))
  observer.observe(canvas)
  raf = requestAnimationFrame(draw)
  canvas.dataset.renderer = 'webgl-particles'
  canvas.dataset.particleCount = String(particleCount)

  return {
    particleCount,
    dispose() {
      disposed = true
      observer.disconnect()
      cancelAnimationFrame(raf)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
    }
  }
}

export function createRecordingInflowRenderer({ canvas, partIndex, seed, levelRef, reducedMotion }) {
  const gl = canvas.getContext('webgl', { alpha:true, antialias:true, premultipliedAlpha:true })
  if (!gl) throw new Error('WebGL unavailable')
  const vertex = `
    precision highp float;
    attribute vec3 aParticle;
    uniform float uTime;
    uniform float uLevel;
    uniform float uPixelRatio;
    varying float vAlpha;
    void main(){
      float t=fract(aParticle.x+uTime*(.075+aParticle.z*.035));
      float y=-.98+t*1.70;
      float center=sin(t*5.2+aParticle.z*6.283)*(.025+.035*(1.-t));
      float spread=(1.-t)*(.22+.10*uLevel);
      float x=center+aParticle.y*spread;
      float pulse=.25+.75*uLevel;
      vAlpha=(.12+.66*(1.-abs(aParticle.y)))*pulse*smoothstep(0.,.12,t)*(1.-smoothstep(.88,1.,t));
      gl_PointSize=(1.0+aParticle.z*1.8+uLevel*.6)*uPixelRatio;
      gl_Position=vec4(x,y,0.,1.);
    }`
  const fragment = `
    precision mediump float;
    uniform vec3 uColor;
    varying float vAlpha;
    void main(){
      float dotShape=1.-smoothstep(.16,.5,length(gl_PointCoord-.5));
      float alpha=dotShape*vAlpha;
      if(alpha<.015)discard;
      gl_FragColor=vec4(uColor*alpha,alpha);
    }`
  const program = createProgram(gl, vertex, fragment)
  gl.useProgram(program)
  const random = randomFrom(hashSeed(`${seed}:${partIndex}:inflow`))
  const data = new Float32Array(720 * 3)
  for (let index=0; index<720; index++) {
    data[index*3]=random()
    data[index*3+1]=(random()+random()+random())/1.5-1
    data[index*3+2]=random()
  }
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW)
  const particle=gl.getAttribLocation(program,'aParticle');gl.enableVertexAttribArray(particle);gl.vertexAttribPointer(particle,3,gl.FLOAT,false,0,0)
  const timeLocation=gl.getUniformLocation(program,'uTime'),levelLocation=gl.getUniformLocation(program,'uLevel'),ratioLocation=gl.getUniformLocation(program,'uPixelRatio')
  gl.uniform3fv(gl.getUniformLocation(program,'uColor'),PALETTE[partIndex] || PALETTE[0])
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA)
  let raf=0,disposed=false,started=performance.now()
  const draw=now=>{
    if(disposed)return
    const ratio=Math.min(window.devicePixelRatio||1,2),width=Math.round(canvas.clientWidth*ratio),height=Math.round(canvas.clientHeight*ratio)
    if(width>0&&height>0&&(canvas.width!==width||canvas.height!==height)){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height)}
    gl.uniform1f(timeLocation,reducedMotion?0:(now-started)*.001)
    gl.uniform1f(levelLocation,Math.max(0,Math.min(1,levelRef.current||0)))
    gl.uniform1f(ratioLocation,ratio)
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.POINTS,0,720)
    raf=requestAnimationFrame(draw)
  }
  canvas.dataset.renderer='webgl-inflow'
  raf=requestAnimationFrame(draw)
  return()=>{disposed=true;cancelAnimationFrame(raf);gl.deleteBuffer(buffer);gl.deleteProgram(program)}
}

export { PALETTE, PATHS }
