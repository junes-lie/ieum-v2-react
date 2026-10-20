"""Compare exits of a short-edge junction cluster; never infer filament pairing."""
import hashlib
import importlib.util
import json
from pathlib import Path
import numpy as np
from PIL import Image

BASE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('junction_audit', BASE / 'audit-junctions.py')
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


def measure(rgb, threshold):
    chains = audit.trace.extract(rgb, threshold, min_points=2)
    nodes = {(618, 193)}
    while True:
        previous = len(nodes)
        for chain in chains:
            ends = {tuple(chain['points'][0]), tuple(chain['points'][-1])}
            if chain['lengthPx'] < 8 and ends & nodes:
                nodes |= ends
        if len(nodes) == previous:
            break
    exits = []
    internal = []
    for chain in chains:
        pts = chain['points']
        inside = [tuple(pts[0]) in nodes, tuple(pts[-1]) in nodes]
        if all(inside):
            internal.append(pts)
        elif any(inside):
            pts = pts if inside[0] else pts[::-1]
            direction, sufficient = audit.direction(pts)
            exits.append({'points': pts, 'lengthPx': chain['lengthPx'],
                          'has8pxBaseline': sufficient, 'direction': direction.tolist()})
    return {'threshold': threshold, 'nodes': sorted(nodes), 'internal': internal,
            'bounds': [min(p[0] for p in nodes), min(p[1] for p in nodes),
                       max(p[0] for p in nodes), max(p[1] for p in nodes)],
            'exits': exits, 'connectionAccepted': False}


def main():
    assert hashlib.sha256(audit.trace.SOURCE.read_bytes()).hexdigest() == audit.trace.EXPECTED
    rgb = np.array(Image.open(audit.trace.SOURCE).convert('RGB'))[65:225, 450:800]
    results = [measure(rgb, t) for t in (25, 30, 35)]
    assert results == [measure(rgb, t) for t in (25, 30, 35)]
    signatures = [{tuple(map(tuple, e['points'])) for e in r['exits'] if e['has8pxBaseline']} for r in results]
    common = set.intersection(*signatures)
    report = {'sourceSHA256': audit.trace.EXPECTED,
              'method': 'Connected component of junction edges shorter than 8px; compare all external chains.',
              'limitation': 'ROI-boundary chains are omitted by the source extractor. This is not a complete crossing topology.',
              'status': 'Threshold-sensitive cluster membership; no same-filament pairing accepted.',
              'stableExitCount': len(common), 'results': results}
    for r in results:
        for e in r['exits']:
            e['stableAcrossThresholds'] = tuple(map(tuple, e['points'])) in common
    (BASE.parents[2] / 'public/blue-cluster-audit.json').write_text(json.dumps(report, separators=(',', ':'))+'\n')
    print(json.dumps({'stableExits': len(common), 'results': [
        {'threshold': r['threshold'], 'junctions': len(r['nodes']), 'bounds': r['bounds'],
         'exits': len(r['exits']), 'sufficientBaseline': sum(e['has8pxBaseline'] for e in r['exits'])}
        for r in results]}))


if __name__ == '__main__':
    main()
