"""Extract open blue pixel chains. Never choose a continuation at a junction.

No gap filling, spline fitting or closure. Results are local pixel evidence only.
Requires numpy and Pillow; output is reproducible from the approved reference.
"""
import hashlib
import json
from pathlib import Path
import numpy as np
from PIL import Image

BASE = Path(__file__).resolve().parent
SOURCE = BASE.parents[1] / 'renders/approved-repetition-reference.png'
EXPECTED = 'be889493982f41b186426f42266b8107bdaa8b1c072f943fb0232502edc32e4b'


def thin(mask):
    """Zhang–Suen thinning; foreground is only removed, never added."""
    a = np.pad(mask.astype(np.uint8), 1)
    while True:
        changed = False
        for phase in (0, 1):
            p = [a[:-2,1:-1], a[:-2,2:], a[1:-1,2:], a[2:,2:],
                 a[2:,1:-1], a[2:,:-2], a[1:-1,:-2], a[:-2,:-2]]
            count = sum(p)
            transitions = sum(((p[i] == 0) & (p[(i+1)%8] == 1)).astype(np.uint8) for i in range(8))
            if phase == 0:
                corner = (p[0]*p[2]*p[4] == 0) & (p[2]*p[4]*p[6] == 0)
            else:
                corner = (p[0]*p[2]*p[6] == 0) & (p[0]*p[4]*p[6] == 0)
            remove = (a[1:-1,1:-1] == 1) & (count >= 2) & (count <= 6) & (transitions == 1) & corner
            changed |= bool(remove.any())
            a[1:-1,1:-1][remove] = 0
        if not changed:
            return a[1:-1,1:-1].astype(bool)


def extract(rgb, threshold):
    r, g, b = rgb.astype(float).transpose(2,0,1)
    mask = (b-r > threshold) & (g-r > 20) & (b > 90)
    skeleton = thin(mask)
    points = set(map(tuple, np.argwhere(skeleton)))

    def neighbors(p):
        y, x = p
        result = []
        for dy, dx in ((-1,0),(1,0),(0,-1),(0,1),(-1,-1),(-1,1),(1,-1),(1,1)):
            q = (y+dy,x+dx)
            # A diagonal across an occupied orthogonal corner is redundant.
            if q in points and not (dy and dx and ((y+dy,x) in points or (y,x+dx) in points)):
                result.append(q)
        return sorted(result)

    graph = {p: neighbors(p) for p in sorted(points)}
    visited = set()
    chains = []
    for start in sorted(graph):
        if len(graph[start]) == 2:
            continue
        for nxt in graph[start]:
            edge = tuple(sorted((start,nxt)))
            if edge in visited:
                continue
            visited.add(edge)
            chain = [start,nxt]
            previous, current = start,nxt
            while len(graph[current]) == 2:
                follow = next(q for q in graph[current] if q != previous)
                edge = tuple(sorted((current,follow)))
                if edge in visited:
                    break
                visited.add(edge)
                chain.append(follow)
                previous,current = current,follow
            if len(chain) >= 25 and all(2 < y < rgb.shape[0]-3 and 2 < x < rgb.shape[1]-3 for y,x in chain):
                chains.append({'points': [[int(x)+450,int(y)+65] for y,x in chain],
                               'endpointDegrees': [len(graph[start]),len(graph[current])],
                               'lengthPx': round(sum(np.hypot(b[0]-a[0],b[1]-a[1]) for a,b in zip(chain,chain[1:])),2)})
    chains.sort(key=lambda c:(-c['lengthPx'],c['points'][0]))
    return chains


def main():
    digest = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    assert digest == EXPECTED, 'Reference changed; stop before tracing'
    rgb = np.array(Image.open(SOURCE).convert('RGB'))[65:225,450:800]
    traces = extract(rgb,30)
    assert traces == extract(rgb,30), 'Non-deterministic extraction'
    report = {'sourceSHA256':digest, 'roi':[450,65,800,225],
              'method':'blue mask, topology-preserving thinning, stop at every graph junction/end',
              'status':'open pixel chains only; no same-filament claim across crossings',
              'gapFilling':False, 'closedPathInference':False,
              'thresholdSensitivity': {str(t):len(extract(rgb,t)) for t in (25,30,35)},
              'traces':traces}
    out = BASE.parents[2] / 'public/visible-blue-traces.json'
    out.write_text(json.dumps(report,ensure_ascii=False,separators=(',',':'))+'\n')
    print(json.dumps({'traces':len(traces),'longest':traces[0], 'thresholdSensitivity':report['thresholdSensitivity']},ensure_ascii=False))


if __name__ == '__main__':
    main()
