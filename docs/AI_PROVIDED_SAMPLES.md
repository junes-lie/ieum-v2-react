# 실제 AI 제공 샘플

단계3의 기존 Voice Setup용 실제 제공 구간이다. Project 제출 Track이나 사용자의 대표 Sample을 대신하지 않는다. 제공곡 카탈로그는 `src/providedSamples.json`, 앱에서 사용되는 실제 구간/분리 반주는 `public/audio/`에 있다. 각 asset의 SHA256과 실제 생성 revision/seed/source 시작 시간은 카탈로그에 기록한다.

## 현재 검증과 한계

「서로의 빛」은 실제 ACE-Step/Ace-Step1.5 90초 추론 출력에서31.5–47.5초 구간을 사용한다. Whisper-small의 전체 가사 일치0.8과 실제 word alignment gate는 통과했다. 전곡 Turbo0.791은 실패했다. 실제16초 구간 독립 검증은 Turbo0.893617 및 시간 gate 통과/small0.782609 실패다. 검증 WAV와 실제 export WAV의 해시도 일치한다. 자동 ASR 통과는 발음·청취 인수 완료가 아니다. 실제 반주 분리도 완벽한 vocal isolation을 뜻하지 않는다.

표시 음역은 실제 분리 보컬의 pYIN 관측 추정이며 사용자 능력 판정이 아니다. 생성 요청 Key/BPM은 실제 측정 결과와 구분한다. Key가 확인되지 않은 곡은 원키로 표시하며 임의 SATB/Part 데이터를 만들지 않는다.

「천천히 함께」는 audio_codes를 제외한 실제 text2music 90초 출력에서31.7–50.7초의19초를 사용한다. 전곡 small ASR0.933333/word alignment0.924370, 실제 구간 독립 ASR/word alignment1.0을 통과했다. 실제 구간 cue0/8.2/13.96, pYIN 추정F♯3–E♭4이며 발음 청취와 Key 확인은 미완료다. 현재 실제 제공곡2개다.

이전 두 추가 곡의60초 및 코드 조건90초 후보는 가사 검증에 실패했다. 해당 원본과 보고서는 보존하며 앱 asset으로 채택하지 않는다. 세 곡 목표나 전체 단계3가 완료된 상태가 아니다. 설치된 pipeline은 audio_codes를 전달하면 cover로 자동 전환하고 기본 강도는1.0이다. 생성 보고서에 실제 task/강도를 기록하며, 가사 기반 직접 text2music 비교는 코드 조건을 전달하지 않는다. 모드 확인 자체는 곡 품질 개선 증거가 아니다.

## 재현 도구

모델 weight/latent/전체 원곡/WAV/ASR 보고서는 repository 밖 `.ieum-p0-runtime`에 보존한다. 생성은 사용자 음성을 입력하지 않는 오리지널 가사 기반 모델 추론이다. 실제 music code 생성은 `qa/generate-ai-music-codes.py`, 실제 음악 추론은 `qa/generate-ai-provided-song.py`, 실제 보컬/반주 분리는 `qa/separate-ai-provided-song.py`를 사용한다. 세 도구는 입력 모델 폴더·출력 폴더·spec을 명시적으로 받는다.

`qa/verify-ai-provided-song.py`는 실제 파일 해시 및 ASR 가사/시간 gate를 검사한다. `qa/align-ai-provided-song.py`는 검증 통과한 실제 보컬에서 word time을 측정한다. `qa/analyze-ai-provided-song.py`는 실제 음역/beat/key 추정을 기록한다. `qa/export-ai-sample.py`는 검증된 가사 경계의16–20초 구간을 압축하며 원본/기존 edition을 덮어쓰지 않는다. 구간 후보를 별도로 검증할 때는 `qa/prepare-ai-sample-candidate.py`로 실제 원곡/stem 해시와 source 구간 계보를 기록한다. 후보 준비 자체는 검증 성공이 아니다. `qa/register-ai-sample.py`는 실제 export WAV/보컬의 해시가 독립 구간 ASR 및 word alignment 입력과 모두 같은지 확인하고 가사/시간 gate를 통과한 구간만 기존 catalog에 등록한다.

실제 사용한 runtime: CPU PyTorch2.14.1, Transformers5.19.0, Diffusers0.41.0, ONNX Runtime1.30.0, librosa0.11.0, imageio-ffmpeg0.6.0. 모델 저장 경로는 자동 다운로드나 앱 production 의존성이 아니다. text encoder의 직접 lyric embedding 호출 때문에 text encoder는 resident로 유지하고 DiT만 offload한다. 해당 원인은 `qa/verify-ai-text-embedding-offload.py`로 재현했고 native/converted 수치는 `qa/verify-ai-model-parity.py`로 검증했다.

## 앱 검증

`IEUM_QA_URL`을 실제 실행 중인 기존 앱 주소로 설정한 뒤 `npm run qa:provided`를 실행한다. 실제 제공 MP3 해시/미리듣기/반주 다운로드 실패/변조 파일 차단/재시도/Guide 시간 연속성/가사 전환/지정 구간 Take/기존 Profile 보존을 격리 DB와 합성 마이크에서 검사한다. `qa/verify-real-backing.mjs <실제 backing WAV>`는 실제 Web Audio의 pause/resume/토글/비무음 offline mix와 실패 시 마이크 해제를 검사한다. 물리 기기의 마이크·청취·Guide 누출·지연은 별도 인수 항목이다.

세 번째 직접 생성은 C 디스크 공간 부족(os error112)으로 중단되었다. 기존 파일은 보존하고 D:/IEUM-AI-runtime 신규 폴더에서 같은 모델/가사/seed로 재시도했으나 가용 RAM 약1.1GB 및 모델 로딩10분 이상을 확인해 중지했다. 첫 diffusion step/출력 WAV 완료를 주장하지 않는다. 세 번째 곡은 미완료다. 이 경로는 앱 배포 의존성이 아니다.
