"""Bounded exact disk tensor comparison; never map or load a full music weight file."""
import json, math, struct
from pathlib import Path
import numpy as np

def tensor_header(path):
    path = Path(path)
    with path.open('rb') as f:
        length = struct.unpack('<Q', f.read(8))[0]
        assert 0 < length < 16 * 1024 * 1024
        header = json.loads(f.read(length))
    return header, length + 8

def assert_cache_tensor_bytes(cache_path, cache_entry, cache_start, source_path, source_entry, source_start):
    assert cache_entry['dtype'] == 'F32' and source_entry['dtype'] in ('F32', 'BF16')
    assert cache_entry['shape'] == source_entry['shape']
    elements = math.prod(source_entry['shape'])
    width = 4 if source_entry['dtype'] == 'F32' else 2
    for path, entry, start, item_width in [(cache_path, cache_entry, cache_start, 4),
                                         (source_path, source_entry, source_start, width)]:
        left, right = entry['data_offsets']
        assert 0 <= left <= right and right-left == elements*item_width
        assert start+right <= Path(path).stat().st_size
    with Path(cache_path).open('rb') as cached, Path(source_path).open('rb') as source:
        cached.seek(cache_start + cache_entry['data_offsets'][0])
        source.seek(source_start + source_entry['data_offsets'][0])
        remaining = elements
        while remaining:
            count = min(remaining, 262144)
            raw = source.read(count*width); actual = cached.read(count*4)
            assert len(raw) == count*width and len(actual) == count*4
            if width == 2:
                # BF16 -> F32 is exact bit extension, matching the existing
                # checkpoint's .float() conversion, without whole tensor copies.
                expected = (np.frombuffer(raw, dtype='<u2').astype('<u4') << 16).tobytes()
            else:
                expected = raw
            assert np.isfinite(np.frombuffer(expected, dtype='<f4')).all(), 'Non-finite source weight'
            assert actual == expected, 'Cached weight bytes differ from exact source FP32 values'
            remaining -= count
