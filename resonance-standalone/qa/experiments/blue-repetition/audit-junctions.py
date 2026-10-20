"""Measure alternatives at the selected chain ends; never infer a connection."""
import importlib.util
import hashlib
import json
import math
from pathlib import Path
import numpy as np
from PIL import Image

BASE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('trace_visible', BASE / 'trace-visible.py')
trace = importlib.util.module_from_spec(spec)
spec.loader.exec_module(trace)


def direction(points, span=8):
    origin = np.array(points[0], dtype=float)
    for point in points[1:]:
        delta = np.array(point, dtype=float) - origin
        if np.linalg.norm(delta) >= span:
            return delta, True
    return np.array(points[-1], dtype=float) - origin, False


def audit(rgb, threshold):
    chains = trace.extract(rgb, threshold, min_points=2)
    # Match the observed chain by both ends, allowing only a 3px extraction shift.
    targets = [np.array([597,148]), np.array([618,193])]
    ranked = []
    for chain in chains:
        pts = chain['points']
        for oriented in (pts, pts[::-1]):
            distances = [float(np.linalg.norm(np.array(oriented[i])-target))
                         for i,target in zip((0,-1),targets)]
            ranked.append((sum(distances), max(distances), oriented))
    _, maximum, selected = min(ranked, key=lambda row:row[0])
    if maximum > 3:
        return {'threshold':threshold,'matched':False,'nearestEndpointErrorPx':maximum}
    endpoints = []
    for path in (selected, selected[::-1]):
        anchor = path[0]
        incoming, _ = direction(path)
        incoming = -incoming
        alternatives = []
        for chain in chains:
            pts = chain['points']
            for oriented in (pts, pts[::-1]):
                if oriented[0] != anchor or oriented[1] == path[1]:
                    continue
                outgoing, sufficient = direction(oriented)
                cosine = np.dot(incoming,outgoing)/(np.linalg.norm(incoming)*np.linalg.norm(outgoing))
                angle = math.degrees(math.acos(float(np.clip(cosine,-1,1))))
                alternatives.append({'points':oriented,'turnDegrees':round(angle,2),
                                     'lengthPx':chain['lengthPx'],'has8pxBaseline':sufficient,
                                     'status':'direction evidence only' if sufficient else 'too short before next junction'})
        endpoints.append({'point':anchor,'alternatives':alternatives,'connectionAccepted':False})
    return {'threshold':threshold,'matched':True,'selected':selected,'endpoints':endpoints}


def main():
    assert hashlib.sha256(trace.SOURCE.read_bytes()).hexdigest() == trace.EXPECTED
    rgb = np.array(Image.open(trace.SOURCE).convert('RGB'))[65:225,450:800]
    results = [audit(rgb,t) for t in (25,30,35)]
    assert results == [audit(rgb,t) for t in (25,30,35)]
    report = {'sourceSHA256':trace.EXPECTED,'tangentBaselinePx':8,
              'status':'No crossing continuation accepted. Short junction edges cannot establish a tangent.',
              'results':results}
    (BASE.parents[2]/'public/blue-junction-audit.json').write_text(json.dumps(report,ensure_ascii=False,separators=(',',':'))+'\n')
    for result in results:
        print(json.dumps({k:v for k,v in result.items() if k!='selected'},ensure_ascii=False))


if __name__ == '__main__':
    main()
