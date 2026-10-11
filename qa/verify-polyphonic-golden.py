"""Pinned computed golden parity only; these are not hand annotated notes."""
import argparse, hashlib, io, json, pickle, runpy, sys, zipfile
from pathlib import Path

p=argparse.ArgumentParser();p.add_argument('--runtime-dir',type=Path,required=True);p.add_argument('--golden-dir',type=Path,required=True);p.add_argument('--output-dir',type=Path,required=True);args=p.parse_args()
root=args.runtime_dir.resolve();golden=args.golden_dir.resolve();out=args.output_dir/'compatibility.json'
assert not args.output_dir.exists(),'Preserve prior golden evidence'
pinned = {'vocadito_10.wav':'0978bde1c130ae26a9cfcd90012f12fdaf9877bbe45cf21c5237ba7ac9b8703b',
          'model_output.npz':'45bf29f260cd37db50a198fb9897e6c6c1b21454f22424a3b527345422260a1b',
          'note_events.npz':'1766c000d40c6f1bf6230200ba83a07ce41bef46a0aacfdd2fb8bb141946447a'}
for name, digest in pinned.items():
    assert hashlib.sha256((golden/name).read_bytes()).hexdigest() == digest

import numpy as np

class NumericOnlyUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if module == 'numpy' and name in {'ndarray','dtype'}:
            return getattr(np, name)
        if module in {'numpy.core.multiarray','numpy._core.multiarray'} and name in {'_reconstruct','scalar'}:
            return getattr(np._core.multiarray, name)
        raise pickle.UnpicklingError(f'Unsupported golden object: {module}.{name}')

def read_golden(path):
    with zipfile.ZipFile(path) as archive:
        assert archive.namelist() == ['arr_0.npy']
        assert archive.getinfo('arr_0.npy').file_size < 64*1024*1024
        stream = io.BytesIO(archive.read('arr_0.npy'))
    version = np.lib.format.read_magic(stream)
    shape, fortran, dtype = (np.lib.format.read_array_header_1_0(stream) if version == (1,0)
                            else np.lib.format.read_array_header_2_0(stream))
    if dtype.hasobject:
        return NumericOnlyUnpickler(stream).load()
    return np.frombuffer(stream.read(), dtype=dtype).reshape(shape, order='F' if fortran else 'C')

expected = read_golden(golden/'model_output.npz').item()
expected_events = read_golden(golden/'note_events.npz')
assert set(expected) == {'note','onset','contour'}
assert all(isinstance(value,np.ndarray) and value.dtype.kind == 'f' and np.isfinite(value).all() for value in expected.values())
args.output_dir.mkdir(parents=True)
sys.argv = ['probe-polyphonic-notes-onnx.py','--runtime-dir',str(root),
            '--audio',str(golden/'vocadito_10.wav'),'--duration','10',
            '--output',str(args.output_dir/'native-notes.json')]
observed = runpy.run_path(str(Path(__file__).with_name('probe-polyphonic-notes-onnx.py')),run_name='__main__')
comparisons = {}
for name in expected:
    actual = observed['outputs'][name]
    same_shape = list(actual.shape) == list(expected[name].shape)
    max_difference = float(np.max(np.abs(actual-expected[name]))) if same_shape else None
    comparisons[name] = {'sameShape':same_shape,'maxAbsoluteDifference':max_difference,
                          'withinOfficialTolerance':same_shape and max_difference<=1e-4}
native = sorted((note['start'],note['end'],note['midi'],note['meanActivation']) for note in observed['report']['nativeNotes'])
reference = sorted(tuple(float(value) for value in event[:4]) for event in expected_events)
event_shape = len(native)==len(reference)
event_diff = float(np.max(np.abs(np.asarray(native)-np.asarray(reference)))) if event_shape else None
report = {'computedGoldenOnly':True,'sourceHashes':pinned,'duration':observed['report']['window']['duration'],
          'tensorComparisons':comparisons,'noteComparisons':{'nativeCount':len(native),'goldenCount':len(reference),
          'sameCount':event_shape,'maxAbsoluteDifference':event_diff,'withinOfficialTolerance':event_shape and event_diff<=1e-4,
          'fieldsCompared':['start','end','midi','meanActivation'],'sortOrderNormalized':True,'pitchBendsNotCompared':True},
          'scope':'Direct ONNX and preserved official functions compared with official computed golden; not music accuracy or Korean support',
          'musicalHarmonyApproved':False,'catalogRegistrationApproved':False,
          'scriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
report['passed']=all(item['withinOfficialTolerance'] for item in comparisons.values()) and report['noteComparisons']['withinOfficialTolerance']
out.write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)

raise SystemExit(0 if report['passed'] else 1)
