import ctypes as C
E=C.CDLL('libEGL.so.1');G=C.CDLL('libGL.so.1')
def fn(lib,n,rest,args):
 f=getattr(lib,n);f.restype=rest;f.argtypes=args;return f
ptr=C.c_void_p;I=C.c_int;U=C.c_uint
get=fn(E,'eglGetPlatformDisplay',ptr,[U,ptr,C.POINTER(I)])
d=get(0x31DD,None,None)
init=fn(E,'eglInitialize',U,[ptr,C.POINTER(I),C.POINTER(I)])
a=I();b=I();assert init(d,C.byref(a),C.byref(b)), 'EGL init failed'
assert fn(E,'eglBindAPI',U,[U])(0x30A2)
attrs=(I*9)(0x3033,1,0x3040,8,0x3024,8,0x3025,8,0x3038)
config=ptr();count=I();assert fn(E,'eglChooseConfig',U,[ptr,C.POINTER(I),C.POINTER(ptr),I,C.POINTER(I)])(d,attrs,C.byref(config),1,C.byref(count)) and count.value
ctx=fn(E,'eglCreateContext',ptr,[ptr,ptr,ptr,C.POINTER(I)])(d,config,None,(I*1)(0x3038))
assert ctx and fn(E,'eglMakeCurrent',U,[ptr,ptr,ptr,ptr])(d,None,None,ctx),'context failed'
create=fn(G,'glCreateShader',U,[U]);source=fn(G,'glShaderSource',None,[U,I,C.POINTER(C.c_char_p),C.POINTER(I)]);compile=fn(G,'glCompileShader',None,[U]);status=fn(G,'glGetShaderiv',None,[U,U,C.POINTER(I)]);log=fn(G,'glGetShaderInfoLog',None,[U,I,C.POINTER(I),C.c_char_p])

from pathlib import Path
import subprocess
root=Path(__file__).resolve().parents[1]
js="""import {flowGLSL} from './qa/experiments/music-box/particle-flow.mjs';
import {motionGLSL} from './qa/experiments/music-box/motion.mjs';
console.log('#version 300 es\\nprecision highp float;\\nuniform float uEnergy,uMorph,uLift;uniform vec4 uBands;\\n'+motionGLSL+flowGLSL+'\\nvoid main(){gl_Position=vec4(flowDeform(vec3(1.),vec3(0.),1.),1.);}')"""
code=subprocess.check_output(['node','--input-type=module','-e',js],cwd=root)
for label,code in [('before',code.replace(b'planarBase',b'flat')),('after',code)]:
 s=create(0x8B31);p=C.c_char_p(code);source(s,1,C.byref(p),None);compile(s);ok=I();status(s,0x8B81,C.byref(ok));buf=C.create_string_buffer(4096);log(s,4096,None,buf);print(label,ok.value,buf.value.decode());assert ok.value==(label=='after')
