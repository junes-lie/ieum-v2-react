"""Reject changed/non-finite cached tensors with bounded F32/BF16 comparison."""
import json, struct, tempfile
from pathlib import Path
import numpy as np
from music_cache_bytes import tensor_header, assert_cache_tensor_bytes

def write(path, dtype, shape, data):
    header = json.dumps({'weight':{'dtype':dtype,'shape':shape,'data_offsets':[0,len(data)]}}).encode()
    path.write_bytes(struct.pack('<Q',len(header))+header+data)

with tempfile.TemporaryDirectory(prefix='.qa-cache-bytes-', dir=Path(__file__).parent) as folder:
    root=Path(folder); source=root/'source.safetensors'; cached=root/'cached.safetensors'
    count=262144+7
    for dtype in ['F32','BF16']:
        values=np.tile(np.array([0.,-0.,1.,-2.,.5],dtype='<f4'),count//5+1)[:count]
        data=values.tobytes() if dtype=='F32' else (values.view('<u4')>>16).astype('<u2').tobytes()
        write(source,dtype,[count],data);write(cached,'F32',[count],values.tobytes())
        source_header,source_start=tensor_header(source);cache_header,cache_start=tensor_header(cached)
        def compare():assert_cache_tensor_bytes(cached,cache_header['weight'],cache_start,source,source_header['weight'],source_start)
        compare()
        changed=bytearray(cached.read_bytes());changed[-2]^=1;cached.write_bytes(changed)
        try:compare();raise RuntimeError('Changed last-chunk weight accepted')
        except AssertionError:pass
    write(source,'F32',[1],np.array([np.nan],dtype='<f4').tobytes())
    write(cached,'F32',[1],np.array([np.nan],dtype='<f4').tobytes())
    source_header,source_start=tensor_header(source);cache_header,cache_start=tensor_header(cached)
    try:compare();raise RuntimeError('Non-finite source accepted')
    except AssertionError:pass
    cache_header['weight']['data_offsets'][1]+=4
    try:compare();raise RuntimeError('Invalid payload length accepted')
    except AssertionError:pass
print('PASS bounded exact F32/BF16 chunks, signed zero, last-chunk changes, non-finite and invalid length rejection')
