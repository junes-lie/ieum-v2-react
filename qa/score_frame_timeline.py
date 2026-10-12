"""Exact pinned converter frame layout; never an output/alignment approval."""
import math

def score_frame_timeline(syllables,notes,seconds,converted,sample_rate,frame_shift):
    if not (len(syllables)==len(notes)==len(seconds)) or not syllables:
        raise ValueError('Score segment counts must agree')
    if not isinstance(sample_rate,int) or sample_rate<=0 or not isinstance(frame_shift,int) or frame_shift<=0:
        raise ValueError('Positive native sample rate and frame shift required')
    tokens,token_notes,durations=converted
    expected_tokens=sum(1 if syllable=='<X>' else 3 for syllable in syllables)
    if len(tokens)!=expected_tokens or len(token_notes)!=expected_tokens or len(durations)!=expected_tokens:
        raise ValueError('Converted phoneme/token count does not match score')
    if any(not isinstance(value,int) or isinstance(value,bool) or value<=0 for value in durations):
        raise ValueError('Each sung phoneme and rest must retain at least one native frame')
    result=[];token_start=0;frame_start=0;requested_start=0.0
    for index,(syllable,note,duration) in enumerate(zip(syllables,notes,seconds)):
        if not isinstance(duration,(int,float)) or isinstance(duration,bool) or not math.isfinite(duration) or duration<=0:
            raise ValueError('Positive finite segment duration required')
        if not isinstance(note,int) or isinstance(note,bool) or not 0<=note<128 or (syllable=='<X>')!=(note==0):
            raise ValueError('Rest must use note zero and sung syllables a nonzero note')
        count=1 if syllable=='<X>' else 3
        span=durations[token_start:token_start+count]
        if token_notes[token_start:token_start+count]!=[note]*count:
            raise ValueError('Converted segment note differs from score')
        frame_end=frame_start+sum(span)
        result.append({'syllableIndex':index,'syllable':syllable,'modelNoteIndex':note,'startFrame':frame_start,'endFrame':frame_end,
            'nativeStartSeconds':frame_start*frame_shift/sample_rate,'nativeEndSeconds':frame_end*frame_shift/sample_rate,
            'requestedStartSeconds':requested_start,'requestedEndSeconds':requested_start+duration,
            'phonemeFrames':list(span)})
        token_start+=count;frame_start=frame_end;requested_start+=duration
    return result
