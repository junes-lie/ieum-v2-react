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


## P0 Project 편곡 등록 · 2026-10-22

Voice Setup 제공곡 세 항목과 기존 개인 Sample은 그대로 유지한다. 별도 Song `ieum-original-warm-unison-v1` / Project `ieum-project-warm-unison-v1` / arrangement revision `warm-unison-intro3-v1`을 `src/projectMusic.js`에 명시적으로 등록한다. 기존 상용곡의 제목·Key·반주를 이 음원으로 바꾸지 않는다.

선정: 천천히 함께. 실제 MP3를 디코드한 길이는 sample/backing 각각 19.000초이며 SHA256은 기존 제공곡 manifest와 일치한다. 다른 두 곡의 실제 sample/backing은 서로의 빛 16.000초, 비가 그친 뒤 18.000초이며 각각 해시·가사 순서·길이 범위를 확인했다. 천천히 함께는 기존 구간 word alignment 1.0이고 두 유니즌 역할의 같은 멜로디 범위는 기존 pYIN 추정 F♯3–E♭4를 사용한다. SATB 화음·추가 멜로디·BPM·실측 조성은 주장하지 않는다.

Key는 원키 고정이며 음고 변환을 하지 않는다. 원곡 생성 당시 요청 조성이 실측 조성인 것처럼 C major 등으로 표시하지 않는다. 원곡 90초 WAV의 SHA256 계보는 보존된 보고서값이며, 그 WAV는 이 환경/저장소에 없어 이번에 재해시하지 못했다. 저장소의 실제 압축 sample/backing과 직전 3초 PCM은 직접 해시를 확인했다.

원곡 full backing의 28.7–31.7초인 기존 `lead-in.wav` 3.000초와 분리 반주 31.7–50.7초를 순서대로 붙여 22.000초 Project 반주를 만들었다. `public/audio/project-warm-unison-v1/backing.mp3` SHA256 `8120a09591a030c6e04019e6aa7bd5c44c29eac36df20617da489932c311c5e1`. 같은 준비 반주+기존 보컬 포함 sample을 붙인 melody reference SHA256 `b1c604ebffb9acb51ed385a0fbbdc2646db4cc7381c74211fef7d50caf5c73a3`은 녹음 전 미리듣기 전용이며 제출 Track으로 등록하지 않는다. 새 음악 생성·추가 가사 생성·합성 화음 생성은 하지 않았다.

재현 명령: ffmpeg에 lead-in.wav와 backing.mp3(또는 sample.mp3)를 각각 두 입력으로 주고 `[0:a][1:a]concat=n=2:v=0:a=1[a]`, `-map [a] -c:a libmp3lame -q:a 2`로 export. MP3 container 길이 22.047347초에는 encoder delay/padding이 포함되고 실제 디코딩 PCM 길이는 두 결과 모두 22.000초다. 가사 cue는 기존 0/8.2/13.96초에 3초를 더한 3/11.2/16.96초다. 자동 정렬값이며 발음·음악적 진입의 청취 인수는 미완료다.

실제 앱: Search의 곡 탭 → 천천히 함께 → 해당 Project → Voice A 또는 B 선택 → 직접 참여 → 녹음. 새 프로젝트도 등록된 반주·가사·원키·2파트 유니즌을 유지한다. 녹음 시작 전 멜로디를 미리 듣고 3초 원곡 반주 뒤 가사에 맞춰 부른다. Guide와 내 마이크 원본은 분리되며 Review는 내 원본+같은 반주의 정렬된 미리듣기를 제공한다.

발표 시연: `?demo=music-a`에서 첫 Track 직접 녹음·Review·제출, `?demo=music-b`에서 두 번째 Track 직접 녹음·Review·제출. 두 역할은 같은 기기의 격리된 시연 DB를 공유하고 실제 사용자 DB·Profile과 분리한다. 두 Track 모두 초기에는 없으며 AI 음원이나 가짜 참여자 Track을 미리 제출하지 않는다. 최종 제출만 Auto Mix를 시작한다. 이 역할 전환은 실제 다기기/서버 협업을 의미하지 않는다.

## 시연 통합 · 2026-10-23

사용자 확정 표시 제목은 **오늘 같은 날**(이전 제목 천천히 함께)이다. 기존 Song/Sample ID·원본 해시·가사·타이밍은 유지한다. 새로운 곡 페이지를 추가하지 않고 기존 A Thousand Years 시연 목록 자리와 동일 Home/Detail/Workspace/Recorder/Complete 컴포넌트의 데이터를 교체한다. 실제 사용자 데이터와 충돌하지 않도록 새 시연 원본 식별자 `presentation:ieum-project-warm-unison-v1`을 격리된 Demo DB에서만 사용한다. 시연 카탈로그에 두 곡을 중복 노출하지 않는다.

2인 유니즌의 원곡 보컬 예시 1개와 OPEN Voice B로 시작한다. 원곡 보컬은 실제 사람의 제출로 주장하지 않는 `provided-song-demo` fixture이며 화면에도 원곡 보컬로 표시한다. 추가 음성 합성이나 같은 원본을 여러 사람으로 복제하지 않는다. 제공 보컬 파일은 기존 22초 reference PCM에서 시간 정렬된 backing PCM을 빼고 MP3로 내보낸 residual이다. 기존 분리 반주와 손실 압축의 잔향이 있으므로 순수 isolated vocal로 주장하지 않는다. SHA256 `dafd068295ba4c4761f9106ad74891e6c0800ab25d82ccb87eae3f7f66d907b1`, 경로 `public/audio/project-warm-unison-v1/provided-vocal.mp3`. 양 입력 해시는 `PRESENTATION_VOCAL`에 고정한다. 원본 파일·가사·사용자 녹음은 변경하지 않는다.

내 Voice B를 녹음하고 직접 제출하면 실제 제출 Track과 제공 예시가 2/2가 되어 등록된 원곡 반주를 포함한 Auto Mix가 시작된다. 합성 마이크 브라우저 QA는 물리 마이크·청취·서버 협업의 성공을 뜻하지 않는다. 유지 QA: `qa/verify-presentation-song-browser.mjs`.
