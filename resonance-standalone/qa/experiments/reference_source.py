"""Resolve the committed repetition reference and reject substitutions.

No image transformation or automatic path inference is performed here.
"""
import hashlib
import json
from pathlib import Path

QA = Path(__file__).resolve().parents[1]
ROOT = QA.parent

def repetition_reference(path=None):
    record = json.loads((QA / 'reference-provenance.json').read_text())['repetitionReference']
    source = Path(path) if path is not None else ROOT / record['file']
    actual = hashlib.sha256(source.read_bytes()).hexdigest()
    if actual != record['sha256']:
        raise ValueError(
            'Wrong repetition reference: expected ' + record['sourceFilename'] +
            ' SHA-256 ' + record['sha256'] + ', received ' + actual)
    return source, actual
