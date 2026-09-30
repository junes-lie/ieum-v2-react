# IEUM V2 React

현재 `ieum-v2-react`를 최신 IA·PRD·PROJECT.MD·DESIGN_SYSTEM.md와 승인 이미지에 맞춰 수정한 단일 React 모바일웹입니다.

## 실행

```powershell
cd "C:\Users\LEE\Documents\Claude\J영 새 프로젝트\레코드판\ieum-v2-react"
npm install
npm run dev
```

`http://127.0.0.1:4187`을 엽니다. 마이크는 localhost 또는 HTTPS에서만 작동합니다.

```powershell
npm run build
npm run qa
```

## 직접 시연 경로

`HOME 2/4 → OPEN Part 찾기 → 내 목소리 알아보기 → Voice Range 수동 종료 → 별도 Voice Sample 녹음·Review·저장 → Tenor 참여 확정 → 내 Tenor Part 녹음 → Review → 제출 3/4 → Bass 보컬 찾기·프로필·초대 → Accepted → 별도 Track 도착 4/4 → Auto Mix → 완성곡 듣기`

초기 프로젝트에는 Soprano·Alto 시연 Track 2개만 들어 있습니다. Bass는 사용자가 초대한 뒤 `Accepted`와 구분된 Track 도착 이벤트로 추가됩니다. 이 파일들은 `scripts/generate-demo-stems.mjs`가 만든 **비보컬 합성 fixture**이며 실제 사람 녹음·TTS 보컬·협업 결과가 아닙니다. 화면과 Credits에서 `LOCAL DEMO`로 표시합니다. 사용자는 자기 Tenor만 녹음할 수 있습니다.

## 데이터 구분

- Voice Range: 실제 마이크의 음정 표본. 자동 통과하지 않으며 Part Fit에 사용합니다.
- Voice Sample: 별도 Sample Song 단계의 프로필 음성 Blob입니다.
- Voice Identity: Voice Sample을 입력으로 하는 생성형 AI 대상입니다. 현재 무료·로컬 모델이 연결되지 않아 `미검증`으로 표시합니다.
- Resonance Record: 해당 프로젝트에 제출된 Track의 분석 Layer만 누적합니다.
- Invitation Accepted: Part 배정 상태일 뿐 Track이나 진행률을 만들지 않습니다.
- Track Submitted: Review에서 직접 제출한 뒤에만 진행률과 Record를 갱신합니다.

## AI와 유료 API

유료 OpenAI Image API와 관련 환경변수·Vercel Function은 제거했습니다. 현재 저장소에는 ONNX/TensorFlow 추론 런타임이나 생성 모델 가중치가 없으므로 Voice Identity와 Resonance Record를 생성형 AI 완료로 표시하지 않습니다. 현재 Record는 실제 오디오 FFT 특징에 조건화된 결정적 절차 시각화입니다.

## 검증 범위

`npm run qa`는 390×844 Edge Chromium에서 화면 버튼 순서대로 전체 여정을 실행합니다. 내부 함수로 화면을 건너뛰지 않습니다. 다만 브라우저의 fake media device를 사용하므로 다음 항목은 별도 미검증입니다.

다시 검증하려면 앱 하단 `MY`에서 `시연 상태 초기화`를 누릅니다. 확인 후 개인 Voice Profile, 참여·초대 상태, 사용자 Tenor Track, Mix와 Collection을 지우고 출처가 표시된 fixture 2개만 남은 `2/4` 홈으로 돌아갑니다.

컬렉션은 Project Like, Vocal Save, Song Save를 별도 객체로 보존합니다. My Projects는 모집·녹음·믹싱·완성 수명주기를 구분합니다. 완료된 Auto Mix도 IndexedDB에 함께 저장되어 새로고침 뒤 완성곡으로 다시 열 수 있습니다.

- 실제 휴대폰 물리 마이크
- 사람 발성의 음역 정확도와 녹음 음질
- iPhone Safari·Android Chrome의 latency와 장시간 성능
- 무료·로컬 생성형 AI 모델의 모바일 추론 성능과 결과 품질

결과는 `qa/user-journey-results.json`, 완성 화면 캡처는 `qa/user-journey-complete.png`에 저장됩니다.
