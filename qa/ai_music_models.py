"""Pinned, independently verified checkpoints and allowed diagnostic tasks.

Official capability reference: https://huggingface.co/ACE-Step/acestep-v15-sft
SFT is not a replacement for Base Lego/independent Track generation.
"""
PINNED_AUDIO_MODELS = {
    'base': {
        'model': 'ACE-Step/acestep-v15-base',
        'revision': 'e432212fec32b8965a14ffa57ae653438d6abd14',
        'weightsSha256': '4177f600501a6d4bd81cadaa0abac557ffd15c54e5c8cb52053cdb24a0844d6b',
        'tasks': ('text2music', 'lego', 'repaint'),
    },
    'sft': {
        'model': 'ACE-Step/acestep-v15-sft',
        'revision': 'c410d249e71ea9385a7b586865e65b1473e1098d',
        'weightsSha256': 'd4dd3a93870f06720027965b90771f529ab02094b3d29e2518f1d5e097e1af7e',
        'tasks': ('text2music', 'repaint'),
    },
}
