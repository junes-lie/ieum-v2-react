"""Fetch a small evaluation subset from the official VocalSet archive.

Never downloads the full archive or writes samples into the application/repository.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
import re
import urllib.request
import zipfile
import truststore

truststore.inject_into_ssl()
parser = argparse.ArgumentParser()
parser.add_argument('--runtime', required=True)
args = parser.parse_args()
output = Path(args.runtime).resolve() / 'results' / 'vocalset'
output.mkdir(parents=True, exist_ok=True)
url = 'https://zenodo.org/records/1442513/files/VocalSet11.zip'
with urllib.request.urlopen('https://zenodo.org/api/records/1442513', timeout=45) as response:
    record = json.load(response)
license_info = record['metadata'].get('license')
assert license_info, 'Official dataset license must be present before fetching audio'
print(json.dumps({'phase':'official-metadata','license':license_info}), flush=True)

class RangeArchive(io.RawIOBase):
    def __init__(self):
        self.position = 0
        with urllib.request.urlopen(urllib.request.Request(url, headers={'Range':'bytes=0-0'}), timeout=45) as response:
            assert response.status == 206, 'Server did not honor byte ranges; full download refused'
            match = re.fullmatch(r'bytes 0-0/(\d+)', response.headers['Content-Range'])
            assert match, 'Invalid range metadata'
            self.size = int(match[1])
    def seekable(self): return True
    def tell(self): return self.position
    def seek(self, offset, whence=0):
        self.position = offset if whence == 0 else self.position + offset if whence == 1 else self.size + offset
        if self.position < 0: raise ValueError('Negative archive position')
        return self.position
    def read(self, size=-1):
        size = min(self.size-self.position, size if size >= 0 else self.size-self.position)
        if size <= 0: return b''
        assert size <= 2_000_000, 'Oversized range refused'
        request = urllib.request.Request(url, headers={'Range':f'bytes={self.position}-{self.position+size-1}'})
        with urllib.request.urlopen(request, timeout=45) as response:
            assert response.status == 206, 'Full archive download refused'
            data = response.read(size+1)
        assert len(data) == size, 'Unexpected range response size'
        self.position += size
        return data

manifest = {'dataset':'VocalSet','doi':'10.5281/zenodo.1442513',
    'archive':url,'license':license_info,'files':[],'purpose':'isolated local P0 evaluation only'}
with zipfile.ZipFile(RangeArchive()) as archive:
    for singer in ['female1','female2','male1','male2']:
        entries = [item for item in archive.infolist() if
            item.filename.startswith(f'FULL/{singer}/arpeggios/straight/') and item.filename.endswith('.wav')]
        entries.sort(key=lambda item:item.filename)
        assert len(entries) >= 2, f'Missing independent vowel recordings for {singer}'
        for entry in entries[:2]:
            assert entry.file_size <= 2_000_000
            data = archive.read(entry)
            destination = output / Path(entry.filename).name
            destination.write_bytes(data)
            manifest['files'].append({'singer':singer,'member':entry.filename,'path':str(destination),
                'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
            print(json.dumps(manifest['files'][-1]), flush=True)
(output/'source-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print('PASS official VocalSet subset downloaded without full archive', flush=True)
