# 단계 1 P0 사전 조사 — 2026-10-08

## 최종 P0 기술 검증 범위

공식 [VocalSet](https://zenodo.org/records/1442513)에서 CC BY 4.0의 4명×2개 모음 녹음을 byte range로 읽었다. 전체 아카이브는 다운로드하지 않았다. dataset 음성은 Git 밖에 유지한다. [공식 singer-identity 모델](https://huggingface.co/BernardoTorres/singer-identity)의 MIT BYOL weight revision 55e09cdfcd733b1c01f2b94f316a0280995a909e를 44.1kHz 실제 가창에 실행하여 1000차원 embedding을 추출했다. 같은 입력의 재추론과 저장 embedding 일치, 네 입력의 구분을 qa/verify-ai-conditioning.py로 검증했다.

qa/verify-ai-voice-layer.py --singer-conditioning이 실제 embedding을 고정 seed Gaussian projection으로 초기 diffusion noise에 연결하고 실제 SD-Turbo로 생성했다. 음성은 외부에 업로드하지 않았다. 동일 가창/seed 반복 pixel SHA256 86333d96030365688728ebda89d949d8b3553e884571acde8568bf0760052943이 일치했다. 다른 가창 세 출력은 서로 달랐다. 2/3/4 latent 결합의 실제 VAE 출력 SHA256은 c34c2dc00cd0a491df208888328e036a98deea06bb47d59bf0cdfddfb9de67ef, a21f49fd1226c8cc784331f4a2bbac1d36537842a722580465b2589bfc06d485, 897824209945dd57231d319d9d43055a822df1f15935d637305fba1f333068dc다. 원본 latent 보존 및 실제 파일/입력/모델/출력 계보 QA가 통과했고 4개 결합 이미지를 직접 확인했다. 생성 약10.6–11.2초/회, CPU 실험이다.

실험 연결은 학습된 audio-image adapter가 아니다. 해당 생성물을 앱/Figma 자산으로 사용하거나 기존 motion을 정적 이미지로 교체하지 않았다. 상업적 SD-Turbo 이용 등록·실제 서비스 추론 위치·모바일 성능·사용자 자기 인식에 맞는 음색 표현·실제 AI 결과와 motion renderer 연결은 후속 구현/인수 대상이다.

### 실패한 별도 robustness 검사

서로 다른 모음에도 동일 가수의 nearest embedding을 찾는 검사는 WavLM 4/8, BYOL 3/8, contrastive 3/8으로 실패했다. 실제 오류는 AssertionError: Independent-vowel nearest-singer test failed on this sample이다. 성공으로 바꾸거나 검사 기준을 낮추지 않았다. 이 결과를 정확한 가수 식별/궁합 점수로 사용하지 않는다. 현재 PRD는 ‘동일 음원 입력 시 일관된 결과’를 요구하므로 이 추가 분류기 검사는 별도 한계이며 필수 P0 gate를 대체하지 않는다.

TorchScript filename 로더의 한글 Windows 경로 오류는 같은 체크포인트를 지원되는 binary file-object API로 읽어 해결했다. 결과 JSON의 cp949 UnicodeDecodeError는 UTF-8을 명시하여 해결했다. 인증서 검증을 끄거나 모델 파일을 바꾸지 않았다.

### 데이터 및 기존 renderer 검증

재정렬 Part의 녹음 반응이 다른 고정 색상 슬롯을 선택하고, null Part가 기존 mapped Layer를 지우는 문제를 실제 QA로 재현하고 src/App.jsx와 src/projectModel.js에서 최소 수정했다. 기존 색상/renderer/shader/Record signature는 보존한다. 재정렬·free Part·null Part 회귀와 2/3/4 Part의 owned draft→제출→재로드에서 projectId/partId/participantId/seed/Blob/Layer/keyLocked 보존 검사가 통과했다.

유지 대상 qa:motion을 현재 동일 App 진입 query에 맞췄다. 자체 앱의 격리 headless 테스트에서 실제 WebGL context, 24061 particles, 0/2.5/5/7.5/10초 프레임 차이, console error 0을 확인했다. Figma/Notion 웹 UI 또는 Computer Use 도구를 사용한 검증이 아니며 실제 모바일/마이크 결과도 아니다. sandbox 서버→headless 연결의 ERR_CONNECTION_TIMED_OUT은 승인된 loopback 범위의 같은 QA 서버로 실행하여 해결했다.

아래 항목은 이 최종 실행 이전의 조사/부분 실행 기록이다. 단계 1의 P0 기술 검증과 production AI 기능 완료를 구분한다.

상태: 로컬 실제 모델 추론 및 반복 재현/다른 입력 결과 차이 검증 성공. 단계 1 전체 완료 및 production AI 연결은 아님. 제품 범위 변경이나 production 모델 채택 결정이 아니다.

## 실행 완료 증거

- 격리 runtime: repository 상위 .ieum-p0-runtime. React 의존성과 시스템 Python 설정은 변경하지 않았다.
- nvidia-smi에서 NVIDIA GTX 1660 SUPER, 6144 MiB를 확인했다. 이번 추론은 CPU PyTorch 2.14.1+cpu로 실행했다.
- maintained QA: qa/verify-ai-voice-layer.py, 직접 의존성 버전 qa/p0-ai-requirements.txt. model/cache/audio/PNG/JSON은 Git 밖의 runtime에 보관한다.
- 실제 모델: stabilityai/sd-turbo, revision b261bac6fd2cf515557d5d0707481eafa0485ec2, safetensors fp16 weight를 CPU float32로 로드, 512×512, 1 inference step, seed 65346.
- 공식 공개 음성 두 개를 내려받아 기존 src/voiceAnalysis.js의 analyzeAudioBuffer/buildVoiceLayer를 실제 실행했다. 특징값으로 생성 prompt를 구성하고 같은 noise seed로 비교했다. 사용자의 개인 음성은 사용하거나 외부에 전송하지 않았다.
- 동일 입력 2회 pixel SHA256: d90f6e2a890dc6562d75b0376d733bf97292dabc5604cc5b8b651028e2f40601 (일치). 다른 음성 입력: 3155eef9f718633a010c82dad90a8d1cb413a77a20b84c3cfaa469c117187584 (다름).
- CPU 생성 시간: 11.585초 / 10.753초 / 11.300초. 모델 첫 다운로드/로드 시간과 구분한다. 모바일 처리시간을 뜻하지 않는다.
- 모델 조회의 SSL CERTIFICATE_VERIFY_FAILED는 truststore로 Windows 신뢰 인증서 저장소를 사용하여 해결했다. TLS 검증을 끄지 않았다. pip check 성공, Python 문법 컴파일 성공.
- 원본 입력/특징/기존 Layer/모델 revision/prompt/출력 hash/시간은 runtime/results/ai-voice-layer-report.json에 기록했다. 첫 결과 이미지도 직접 확인했다.

### 범위와 사용 근거

[SD-Turbo LICENSE.md](https://huggingface.co/stabilityai/sd-turbo/blob/main/LICENSE.md)의 평가·시험 범위로 로컬에서 검증했다. 실제 서비스 채택/상업적 이용 등록·배포 조건은 별도 확인 대상으로 남긴다. 생성 결과를 앱 자산이나 Figma 결과로 사용하지 않았다.

입력 A는 [PyTorch 음성 특징 추출 예제](https://docs.pytorch.org/audio/stable/tutorials/audio_feature_extractions_tutorial.html)의 Lab41-SRI-VOiCES-src-sp0307-ch127535-sg0042.wav, 입력 B는 [PyTorch CTC 예제](https://docs.pytorch.org/audio/2.8.0/tutorials/asr_inference_with_ctc_decoder_tutorial.html)의 ctc-decoding/1688-142285-0007.wav다. B의 LibriSpeech 출처와 CC BY 4.0은 [OpenSLR](https://us.openslr.org/12/)에 명시되어 있다. 두 입력은 실제 말소리이며 가창 검증 자료가 아니다.

### 실제 speaker 모델 추가 검증

qa/verify-ai-speaker.py로 microsoft/wavlm-base-plus-sv revision feb593a6c23c1cc3d9510425c29b0a14d2b07b1e를 CPU에서 실제 실행했다. 동일 입력의 512차원 embedding은 반복 실행 시 일치했다. 같은 녹음 두 구간 cosine 0.872301, 다른 녹음 cosine 0.473524였고 검사에 통과했다. 추론은 2.694초였다. 결과는 runtime/results/speaker-probe-report.json이다.

공식 [model card](https://huggingface.co/microsoft/wavlm-base-plus-sv)는 speaker verification 용도 및 16kHz 입력을 명시한다. 연결된 [공식 라이선스](https://github.com/microsoft/UniSpeech/blob/main/LICENSE)는 CC BY-SA 3.0이다. MIT라고 간주하지 않는다. 모델은 로컬 시험용이고 weight를 앱/Git/production에 배포하지 않았다. 음성 embedding을 이미지 생성기에 직접 conditioning하는 production 경로는 구현하지 않았다.

시험은 두 공개 말소리와 같은 녹음의 구간 분할에 한정된다. 동일 인물의 독립적인 다른 Take, 실제 가창, 다수 사용자 데이터에서의 정확도를 검증한 결과가 아니다. 내부 cosine을 UI 궁합/능력 점수로 노출하지 않는다.

### 2–4 실제 모델 Layer 결합 시험

공개 말소리 A/B와 A의 앞/뒤 구간으로 실제 생성 입력 4개를 시험했다. 네 사람의 가창 데이터가 아니다. 같은 입력 반복 픽셀은 유지되고 네 입력 출력은 서로 달랐다. 모델이 생성한 latent를 전체 면에서 평균 결합한 뒤 실제 VAE로 디코딩하여 2/3/4개 결합 결과를 생성했다. 결과 SHA256은 각각 0699289e6584ff8f66cac7614ad78a09d60112b7b31d13781e1216baa91a9189, ccaeeb23c439c9c053afc1e925523fc02c1ac2165f6ba23c1dff33d8f9f7b273, b5f21f5da630e39e00cb2f3f96eaad537b45470053a67cb9ed7daa9f559b90e3이다. 4개 결합 결과도 직접 확인했다.

qa/verify-ai-lineage.mjs가 실제 입력 SHA/분석 fingerprint/모델 revision/출력 파일/2–4개 결합 입력 목록을 검사했다. 기존 buildVoiceLayer/projectRecordSignature에 실제 입력 분석값을 전달하여 추가 후 기존 Layer 보존과 JSON 재로드 계약도 검사했다. 모두 통과했다. 모델 latent 결합과 기존 계산식 계보를 각각 검증한 결과이며 AI 출력이 기존 렌더러에 연결됐다는 증거는 아니다. 원본 WebGL 렌더러는 AI 이미지/latent 입력을 받지 않는다. 정적 출력으로 기존 motion을 교체하지 않았다.

기존 단일 앱 Node 렌더 QA를 자유 Part ID의 2/3/4 Part 프로젝트로 확장했다. Workspace 진행률, 선택 Part Recorder, Complete 참여자/곡/Key/Mix URL 전달 검사가 통과했다. 실제 녹음/서버 권한/시각 검증은 아니다. build 및 기존 7개 QA도 통과했다. 이번 QA 변경은 단계 1 전체 gate 미완료 상태의 로컬 작업이며 production 배포에 포함하지 않았다.

### 남은 단계 1 gate

가창 음색의 의미 있는 구별/동일 인물 독립 Take 일관성, AI 출력과 기존 Record 실시간 움직임의 실제 연결, 전체 Project/Part/User 전달 계약, 서비스에서 사용할 추론 실행 위치는 아직 미검증이다. 서로 다른 PNG만으로 개인 음색을 정확히 표현한다고 주장하지 않는다. 단계 2 신규 구현은 진행하지 않는다.

## 실제 확인

- src/voiceAnalysis.js의 buildVoiceLayer는 음성 분석 특징을 그래픽 파라미터에 매핑하는 계산식이다. 학습 모델 추론이 아니다.
- projectService 로컬 capabilities.aiVoiceLayers=false, App의 Voice Identity는 모델 미연결로 표시한다.
- .env.example에는 모델/API 설정이 없다.
- 현재 python의 torch/diffusers/transformers/onnxruntime 설치 여부 조회는 모두 false였다. 다른 Python 환경이 없다는 의미는 아니다.
- public의 오디오는 demo-stems의 합성 WAV 3개다. 이 범위에서 실제 사람 보컬 및 모델 weight 파일은 발견하지 못했다. 사용자 브라우저의 개인 녹음은 조사/전송하지 않았다.
- Win32_VideoController 조회는 ‘클라이언트에서 CIM 리소스에 대한 액세스를 사용할 수 없습니다.’로 실패했다. GPU 종류나 가용 메모리는 미확인이다.

## 공식 자료로 확인한 후보 경로

- [Transformers CLAP](https://huggingface.co/docs/transformers/model_doc/clap): 오디오 embedding을 제공한다. 사람 음색의 구별이나 AI Voice Layer 생성 품질이 이 앱에 적합하다는 증거는 아직 없다. embedding만 생성해 그림을 계산식으로 그리는 것은 확정된 생성형 요구 전체를 충족했다고 볼 수 없다.
- [Diffusers 재현성](https://huggingface.co/docs/diffusers/v0.41.0/using-diffusers/reusing_seeds): seed/generator 제어를 지원하지만 실행 환경에 따른 차이가 있으므로 동일 환경 반복 추론과 결과 저장 계약이 필요하다. 단순 seed 설정만으로 모든 기기에서 동일 결과를 보장하지 않는다.

두 문서는 조사 후보의 기능 근거이며 모델을 선택하거나 라이선스를 승인한 기록이 아니다. 실제 weight의 model card/라이선스/입력 방식/메모리/시간/비용을 확인하기 전 설치·대용량 weight 다운로드·외부 음성 전송은 수행하지 않았다.

## 다음 gate

1. 실제 사용 가능한 생성 모델과 실행 환경을 선정하고 해당 weight 라이선스·비용을 확인한다. 실제 입력에 연결되는 conditioning을 설명해야 한다.
2. 사용 가능한 실제 보컬 입력을 확보한다. 합성 demo를 사람 음성으로 표시하지 않는다.
3. 실제 추론을 실행하여 같은 음성/seed 반복, 다른 음성 비교, 2–4 Layer 합성·기존 계보를 검증한다. 기존 실시간 WebGL을 정적 결과로 교체하지 않는다.
4. 모델/입력/설정/출력 lineage와 project/part/user 계약을 검증한다. 성공 전 단계 2 신규 구현으로 넘어가지 않는다.

최초 환경 조사 이후 위 실행 환경과 결과를 확보했다. 아래 미설치/자료 미확보 기록은 조사 시작 당시 기준이다. 계산식 축소나 production AI 서비스 채택을 임의로 확정하지 않는다.

## 실제 생성 파일의 앱 표시 경로 — 2026-10-08

`src/aiVoiceLayer.js`는 추론 엔진이 아니라 받은 파일의 계약·해시·크기를 검사하는 경계다. 메타데이터만으로 모델 실행 사실을 인증하지 않는다. production 서버는 실제 추론과 사용자 권한을 별도로 보장해야 한다. `track.aiVoiceLayer`는 원본 `blob` 및 기존 `layer`와 분리해 저장하며 재분석에도 보존한다.

실행: `node qa/verify-ai-artifact.mjs ../.ieum-p0-runtime/results/ai-singing-voice-layer-report.json`, `node qa/verify-ai-motion.mjs ../.ieum-p0-runtime/results/ai-singing-voice-layer-report.json`. 입력 경로는 실제 P0 보고서가 있는 위치로 지정한다. 후자는 기존 로컬 앱 4191과 번들 Playwright/Edge를 사용해 격리된 DB에 실제 모델 파일을 제공한다. 임의 생성 fixture나 Figma 이미지로 AI를 대신하지 않는다. 2/3/4 전체 생성 평면의 luminance로 기존 입자 밝기를 조절하며 정적 Record 이미지를 표시하지 않는다. 생성형 AI 자체의 production 연결이나 Figma pixel equivalence 검증은 아니다.