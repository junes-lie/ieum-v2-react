"""Protect the diagnostic boundary without importing Torch or loading models."""
import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location('preparation_probe', Path(__file__).with_name('verify-music-pre-denoise.py'))
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)


class Condition:
    def forward(self):
        return 'native condition output'


class Transformer:
    hook = None

    def register_forward_pre_hook(self, hook):
        self.hook = hook
        owner = self

        class Handle:
            def remove(self):
                owner.hook = None

        return Handle()

    def forward(self):
        if self.hook:
            self.hook(self, ())
        raise AssertionError('Diffusion body must never execute in this probe')


class Pipeline:
    def __init__(self):
        self.condition_encoder = Condition()
        self.transformer = Transformer()
        self.fail = False

    def encode_prompt(self):
        return 'native prompt output'

    def prepare_src_latents(self):
        if self.fail:
            raise ValueError('native source rejected')
        return 'native source output'

    def __call__(self):
        self.encode_prompt()
        self.prepare_src_latents()
        self.condition_encoder.forward()
        self.transformer.forward()


for stop, expected in [
    ('source', ['native-call-start', 'prompt-start', 'prompt-complete', 'source-start', 'source-complete']),
    ('condition', ['native-call-start', 'prompt-start', 'prompt-complete', 'source-start', 'source-complete', 'condition-start', 'condition-complete']),
    # Even if a stop phase is absent/mismatched, the hard pre-forward guard holds.
    ('missing', ['native-call-start', 'prompt-start', 'prompt-complete', 'source-start', 'source-complete', 'condition-start', 'condition-complete', 'diffusion-forward-prevented']),
]:
    events = []
    original = probe.observe_preparation(Pipeline, lambda phase, *_: events.append(phase), stop)
    pipeline = Pipeline()
    # Preserve an existing instance method such as the generator's one-shot wrapper.
    native_condition = pipeline.condition_encoder.forward
    pipeline.condition_encoder.forward = lambda: native_condition()
    existing_condition = pipeline.condition_encoder.forward
    try:
        try:
            pipeline()
        except probe.PreparationObserved as complete:
            assert str(complete) == ('before-diffusion' if stop == 'missing' else stop)
        else:
            raise AssertionError('Missing intentional stop')
        assert events == expected and pipeline.transformer.hook is None
        assert 'prepare_src_latents' not in vars(pipeline)
        assert pipeline.condition_encoder.forward is existing_condition
        pipeline.fail = True
        try:
            pipeline()
        except ValueError as error:
            assert str(error) == 'native source rejected'
        else:
            raise AssertionError('Native error swallowed')
        assert pipeline.transformer.hook is None and 'encode_prompt' not in vars(pipeline)
        assert pipeline.condition_encoder.forward is existing_condition
    finally:
        Pipeline.__call__ = original

print('PASS diagnostic stops before diffusion and restores native methods/hooks on stop and native failure; no models loaded')
