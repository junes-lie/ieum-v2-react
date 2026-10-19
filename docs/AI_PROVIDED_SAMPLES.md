# 실제 AI 제공 샘플

단계3의 기존 Voice Setup용 실제 제공 구간이다. Project 제출 Track이나 사용자의 대표 Sample을 대신하지 않는다. catalog는 `src/providedSamples.json`, 실제 사용 MP3/분리 반주는 `public/audio/`에 있다. 각 asset의 SHA256과 실제 모델 revision/seed/source 계보를 기록한다.

## 현재 검증 범위

| 제공 구간 | 길이 | 실제 구간 가사 검증 | 실제 word cue | pYIN 관측 추정 |
|---|---|---|---|---|
| 서로의 빛 |16초|Turbo0.893617 통과/small0.782609 실패|0/3.84/9.86초|G3–B4|
| 천천히 함께 |19초|small1.0 통과|0/8.2/13.96초|F♯3–E♭4|
| 비가 그친 뒤 |18초|small0.878049/Turbo0.926829 통과|0/5.76/13.28초|E3–C♯5|

「서로의 빛」은 실제90초 출력의31.5–47.5초다. 전곡 small0.8/word alignment 통과, 전곡 Turbo0.791 실패를 보존한다. 「천천히 함께」는 실제 text2music90초 출력의31.7–50.7초다. 전곡 small0.933333/word alignment0.924370와 구간 word alignment1.0을 통과했다.

「비가 그친 뒤」는 실제 원곡 SHA256 `91c8a06a8569b84b829f04ab131029729ec23097fbb7c6a11dcb8f22866b8d07`의30.5–48.5초 구간만 검증/채택했다. 전곡 small0.75/Turbo0.678899는 실패다. 전곡 성공으로 주장하지 않으며 `excerptLineage`, `acceptanceScope`, `originalFullSongValidation`에 이 구분을 보존한다. 실제18초 WAV SHA256 `fc52c21aa198c4f5b16b617f137cf01ca5594975638ef76c1387da66b61303a1`, 보컬 SHA256 `a8e536e1573d4f3cf803aa52cf7ec8ec0ce8d3aab54984dc4a7f36630809d023`가 실제 export와 동일하다. 구간 small word alignment0.878049가 통과했다.

자동 ASR/word time은 발음·청취 인수 완료가 아니다. 표시 음역은 실제 보컬 pYIN 추정이며 사용자 능력 점수가 아니다. 요청 Key/BPM은 실측/확정 음악학 데이터와 구분한다. Key 미확정은 원키로 표시하며 임의 SATB/Part 자료를 만들지 않는다. 실제 반주 분리도 완벽한 vocal isolation을 뜻하지 않는다. 전체 단계3와 Project용 실제 곡/Part/Guide 검증은 별도 미완료다.

## 재현 및 보존

모델/latent/전체 원곡/WAV/ASR 보고서는 repository 밖 `.ieum-p0-runtime` 및 `D:/IEUM-AI-runtime`에 보존한다. D는 C 디스크 부족 이후 사용한 격리 저장소이며 앱 production 의존성이 아니다. 실패 원본/보고서는 삭제하지 않는다. 모델은 ACE-Step/Ace-Step1.5 MIT/revision19671f406d603126926c1b7e2adc169acbcade22, 실제 runtime은 CPU PyTorch2.14.1/Transformers5.19.0/Diffusers0.41.0/ONNX Runtime1.30.0/librosa0.11.0/imageio-ffmpeg0.6.0이다.

실제 음악 LM은 `qa/generate-ai-music-codes.py`, 음악 추론은 `qa/generate-ai-provided-song.py`, 보컬/반주 분리는 `qa/separate-ai-provided-song.py`를 사용한다. audio_codes 전달 시 실제 pipeline이 cover/강도1.0으로 전환하는 점을 기록한다. 직접 text2music에는 해당 조건을 전달하지 않는다. text encoder는 직접 lyric embedding 호출 때문에 resident로 유지하고 DiT만 offload한다. 원인 재현은 `qa/verify-ai-text-embedding-offload.py`, native/converted 수치 검사는 `qa/verify-ai-model-parity.py`에 있다.

`qa/cpu_disk_offload.py`는 실제 디스크 저장/재로딩을 유지하면서 CPU 빈 placeholder 저장소만 해제한다. `qa/verify-cpu-disk-offload.py --cache-dir <격리 폴더>`의 작은 실제 모델3회 reload는 원본과 exact match/저장소0 elements다. 이는 음악 품질 증거가 아니다. 같은 revision의 완성 cache만 재사용하고 생성 결과는 덮어쓰지 않는다.

`qa/verify-ai-provided-song.py`는 실제 파일 해시와 ASR/time gate(유사도≥0.8 및 실제 길이 내 순차 시간)를 검사한다. `qa/align-ai-provided-song.py`는 실제 보컬의 word time을 측정하며 지정 가사를 ASR 입력으로 강제하지 않는다. `qa/analyze-ai-provided-song.py`는 실제 음역/beat/key 추정을 기록한다. `qa/prepare-ai-sample-candidate.py`는 원곡/stem 해시와 구간 계보를 보존한다. 후보 준비 자체는 통과가 아니다. `qa/export-ai-sample.py`는 실제 가사 경계의16–20초를 압축하며 원본/기존 edition을 덮어쓰지 않는다. `qa/register-ai-sample.py`는 export WAV/보컬 해시가 실제 독립 구간 ASR 및 word alignment 입력과 모두 동일하고 가사/시간 gate가 통과한 구간만 등록한다. 전곡과 구간의 실패/교차 검증 결과를 함께 보존한다.

세 번째 곡의 추가90초 seed65354(small0.52),30초 verse seed65355(small0),성공 입력 조건 대조90초(small0.632653)는 모두 실패 기록을 보존하며 앱에 채택하지 않았다. 제공 구간 판정은 실제 앱에서 사용하는18초를 독립 검증한 결과에 한정한다.

## 앱 QA

`IEUM_QA_URL`을 실행 중인 기존 앱 주소로 지정해 `npm run qa:provided`를 실행한다. 세 곡의 서버/로컬 MP3 해시·미리듣기·실제 Guide/가사/지정 길이 Take/기존 Profile 보존과 다운로드 실패/변조 차단/재시도/이탈/재진입 후 늦은 권한 응답의 새 Take 보호를 격리 DB와 합성 마이크로 검사한다. `qa/verify-real-backing.mjs <실제 backing WAV>`는 실제 Web Audio pause/resume/토글/offline mix와 decode 실패 마이크 해제를 검사한다. 물리 마이크·청취·Guide 누출·지연은 별도 인수 항목이다.
