# IEUM V2 재검증 보고서

검증일: 2026-09-29  
대상: `ieum-thousand-years-v7` 단일 4 Part 프로젝트  
판정 원칙: 자동 테스트 개수는 전체 완료 증거로 사용하지 않는다.

## 먼저 재현한 실패

- 과거 녹음이 남아 초기 흐름을 검증할 수 있던 문제: v7 저장 영역으로 분리했고 MY의 `시연 상태 초기화`가 Profile·참여·초대·사용자 Track·Mix·Collection을 지운다.
- Voice Range가 자동 통과하던 문제: 유효 pitch 표본을 모은 뒤 사용자가 `측정 마치기`를 눌러야 한다.
- 권한 요청이 무응답이면 화면이 멈추던 문제: 8초 후 오류와 `다시 시도`를 표시하도록 수정했다. 인앱 브라우저에서 실제 재현·확인했다.
- Voice Range와 Voice Sample 혼동: 음역은 pitch 표본, Sample은 선택한 Sample Song의 별도 Blob/분석 레코드로 저장한다.
- 초대 수락이 Track 제출처럼 처리되던 문제: Accepted 후에도 진행률은 그대로이고, 데모 Track 도착 시점에만 증가한다.
- 다른 사람 Part를 사용자가 녹음할 수 있던 문제: 사용자 소유 Tenor만 Recorder로 진입한다.
- `blob:` 주소가 텍스트처럼 노출되던 문제: 모든 오디오는 커스텀 Player 내부 `<audio>`로만 사용한다.
- Finder Match Detail과 타인 Profile이 섞이던 문제: 프로젝트 적합 정보와 사람 간 Profile을 분리했다.
- 브라우저 Back이 React 내부 화면을 무시하던 문제: History API와 화면 상태를 연결했고 `#voice → #detail` 복귀를 실제 확인했다.

## 사용자가 따라갈 핵심 경로

1. HOME `2/4` — Soprano·Alto는 출처가 표시된 비보컬 합성 fixture다.
2. `OPEN Part 찾기` → 곡 상세 → `Original C · Quartet` → Tenor Part Fit.
3. `내 목소리 알아보기` → 실제 마이크 Voice Range → 사용자가 직접 측정 종료.
4. Sample Song A/B/C 선택 → 별도 Voice Sample 녹음·Review·저장.
5. Voice Identity는 무료·로컬 생성형 모델 미연결 상태를 명시한다. 절차 그래픽을 AI 결과로 대신하지 않는다.
6. Tenor 참여 확정 — `Invitation Accepted`이며 진행률은 아직 `2/4`다.
7. 내 Tenor 녹음 → Guide/가사/카운트인/입력 meter/일시정지/Review → 제출.
8. Tenor 원본 Blob·분석값·Voice Layer가 저장되며 `3/4`가 된다.
9. `Bass 보컬 찾기` → 전체 후보 → Match Detail → 타인 Profile → 초대.
10. 몇 초 뒤 Accepted가 먼저 표시되고, 별도의 시연 Track 도착 뒤에만 `4/4`가 된다.
11. 마지막 필수 Track 도착 즉시 Auto Mix가 시작된다. 수동 믹싱 시작 버튼은 없다.
12. 완성곡 Player → Credits → 타인 Profile → 공유. Home·My Projects·Collection에서 다시 진입한다.

## 데모 오디오의 정확한 성격

`public/demo-stems/*.wav`는 사람 보컬이 아니다. `scripts/generate-demo-stems.mjs`가 만든 상태 전환·오디오 파이프라인 검증용 procedural formant-tone fixture다. 실제 협업 결과나 TTS 보컬로 표시하지 않는다. 동일 곡의 배포 가능한 사람 보컬 3개는 현재 제공되지 않았으므로, 사람 보컬 시연을 완료했다고 판정하지 않는다.

## 검증 상태

| 기능 | 구현 | 실제 입력 검증 | 현재 판정 |
|---|---|---|---|
| 2/4 초기 상태·곡→프로젝트→Part | 예 | 브라우저 실제 클릭 | 확인됨 |
| 새 프로젝트 01C→01D→03A, 2–4 Part | 예 | 3 Part 생성·목록 반영 실제 클릭 | 확인됨 |
| Voice Range 수동 종료 | 예 | 인앱 브라우저는 권한 무응답 | 물리 마이크 미검증 |
| 마이크 무응답 복구 | 예 | 8초 타임아웃 실제 확인 | 확인됨 |
| Voice Sample 별도 저장 | 예 | 자동 fake media만 | 사람 발성 미검증 |
| 사용자 Tenor만 녹음 | 예 | 코드·화면 확인 | 물리 마이크 미검증 |
| Guide와 원본 Track 분리 | 예 | 코드·자동 fake media | 실제 이어폰/누음 미검증 |
| 분석 기반 deterministic Voice Layer | 예 | fixture 차이·재현 자동 검사 | 사람 음성 미검증 |
| 생성형 AI Voice Identity | 아니오 | 아니오 | BLOCKED |
| 생성형 AI Resonance Layer | 아니오 | 아니오 | BLOCKED |
| 2/4→3/4→Accepted→4/4 | 예 | 자동 fake media | 사람 음성 미검증 |
| Auto Mix | offset·gate·RMS normalize·HPF/EQ·compressor·limiter | 자동 오디오 | 실제 휴대폰 청취 미검증 |
| 완성곡·Credits·공유 | 예 | 자동 브라우저 | 휴대폰 공유 시트 미검증 |
| 모바일 반응형·폰트 | 예 | IAB 모바일 viewport | 실제 iOS/Android 미검증 |
| 새로고침 후 Track/Record 재현 | IndexedDB+seed | 자동 검사 | 실제 모바일 재검증 필요 |

## 생성형 AI 기술 상태

유료 OpenAI Image API나 다른 유료 API는 사용하지 않는다. 현재 브라우저 번들에는 무료·로컬 이미지 생성 모델과 가중치가 없다. 조사한 Transformers.js의 브라우저 task 지원에는 text-to-image가 없고, 모바일 WebGPU도 기기별 제약이 있어 Voice Identity와 생성형 Resonance Layer는 아직 완료가 아니다. deterministic Track 분석 시각화는 프로젝트 Record의 기능 프로토타입일 뿐 생성형 AI 결과로 표시하지 않는다.

## 실행

```powershell
npm install
npm run dev
```

`http://127.0.0.1:4187/`에서 실행한다. 휴대폰 배포 검증에는 HTTPS가 필요하다. `npm run build`는 성공했다. `npm run qa`는 회귀 탐지 참고용이며 전체 완료 판정이 아니다.
