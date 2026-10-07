# IEUM 단일 앱 실행 검증 기록

날짜: 2026-10-07 (Asia/Seoul). 이번 작업은 기존 앱 통합과 기능 기반 보완이다. 실제 서버 연결 및 전체 제품 완료로 판정하지 않는다. 최초 기능 작업 검증 뒤, 별도로 요청된 높이·내비게이션 보정은 production에 배포했다.

## 실행 순서 정정

단계 1 실제 AI 기술 검증이 미완료인데 단계 2–4의 디자인·녹음·일부 프로필 구현을 병행했다. 이는 계획의 선행 완료 조건을 지키지 않은 실행이다. 아래 테스트 성공은 작성된 부분 코드의 근거이며 단계 0/1 완료나 후속 단계 착수 승인의 근거가 아니다.

사용자가 요청한 화면 높이·하단 내비게이션 보정과 해당 보정의 배포는 현재 코드·Node 검증 및 배포 완료(실제 시각·실기기 미검증)다. 기존 실행 기록의 새 배포 미수행은 이 문서의 앞선 검증 시점을 뜻하며, 이번 보정 요청의 완료를 뜻하지 않는다. 보정은 별도 작업으로 추적하고 기능 단계 진전으로 보고하지 않는다.

보정 완료 후 단계 0 확인부터 다시 시작하여 단계 1 데이터 기반·실제 AI 검증, 단계 2, 이후 단계 순서로 진행한다. 단계별 gate의 완료 조건과 실제 검증 근거를 충족하기 전 다음 단계의 신규 구현에 착수하지 않는다. 기존 후속 부분 코드는 보존하되 단계 완료로 판정하지 않는다.

## 직접 실행한 검증

| 명령 | 결과 | 실제 확인한 범위 |
|---|---|---|
| `npm run build` | 성공, Vite 8.3.1, 30 modules | 기존 App 엔트리의 production bundle 생성 |
| `node qa/verify-single-app-render.mjs` | 성공 | Node React 렌더링: 기본 App 초기 상태, 다른 곡/Key/3 Part 작업실·녹음·완성곡, 동적 Credits와 실제 audio source |
| `node qa/verify-audio-foundation.mjs` | 성공 | 측정 음역/전조 Gate, 메타데이터 없음 상태, 2/3/4개 합산 피크 상한, pause/resume 경과, Guide offset·Paused Guide 변경 |
| `node qa/verify-track-store.mjs` | 성공 | IndexedDB success/error/abort/동기 transaction 오류 시 DB 정리, cleanup abort 원래 오류 전달 |
| `node qa/verify-project-service.mjs` | 성공 | 로컬 상태, URL 검증, 인증 누락 요청 차단, idempotency header, 409 충돌 처리 |
| `node qa/verify-pitch-detector.mjs` | 성공 | 8개 합성 음성 유사 입력 35 cents 이내, 무음 거절 |
| `node qa/verify-resonance-record.mjs` | 성공 | 같은 Track 결정성, 다른 Track 구별, 2→3→4 Layer 계보 유지, 복원 재현성 |

HTTP adapter 테스트는 stub 응답이다. 실제 서버 접속 성공, 인증, 동시 초대 수락, 타인 제출, 공개 공유, Push는 검증하지 않았다. 피크 테스트는 수치 처리의 근거이며 실제 보컬 음질의 근거가 아니다.

Node JSX 변환/ReactDOM server 렌더링은 브라우저 화면이나 클릭 동작을 검증하지 않는다. 한글 Windows 경로에서 Vite SSR module runner가 CJS `require is not defined` 오류를 내므로 시험 스크립트는 Vite Oxc로 로컬 JSX를 변환해 Node에서 렌더링한다. 임시 변환 파일은 finally에서 삭제한다. 앱 설정을 바꾸거나 브라우저로 우회하지 않는다.

## 검토에서 수정 요청한 결함

- Recorder의 비동기 입력을 수집하기 전에 ambient 배열을 읽어 noiseFloor가 항상 0이 되던 경로: 실제 녹음 프레임을 누적해 Stop 때 낮은 percentile을 평가하도록 보완.
- 제출 저장 성공 후 임시본 삭제 실패를 제출 실패로 취급하던 경로: 제출 성공과 cleanup 실패를 구분. 성공한 Track은 보존.
- 개인 Current Mix와 완성 Auto Mix가 같은 API에 묶여 있던 경로: Preview와 필수 2–4 Part 완성 합성을 분리.
- IndexedDB 읽기/프로젝트 cleanup의 abort 누락과 오류 시 연결 미정리: abort/error/throw 경로와 정리 테스트 추가.

Guide offset은 별도 검토 후 현재 일정 scheduling latency에서 맞는 계산임을 확인했다. Guide Track 자체의 encoded lead-in을 현 녹음 scheduling lead-in과 혼동한 최초 의심은 철회했다. 명시적인 offset 테스트가 추가됐다.

## 남은 범위

- 실제 생성형 AI Voice Layer 모델/추론은 없다. 현재 FFT 기반 결정적 절차 Record를 AI 완료로 표시하지 않는다.
- 공유 서버, 인증, 원격 파일 저장, 수신 초대/원자적 자리 배정, 공개 결과 URL, 서버 7일 Push는 미연결이다.
- 후보 catalog의 정적 match 수치와 설명, 모든 탐색 프로젝트 참여/완주, 정보별 Profile 편집과 실제 취향 입력의 상호작용, navigation scroll/filter 전수 복원은 최종 요구사항 전수 검증이 필요하다.
- 실제 곡 반주/가사 타임코드와 사람 보컬 자료, 실기기 음역/녹음/Guide 누출/지연/음질은 별도 검증이 필요하다.
- 공식 Font Awesome 기능 아이콘은 Icons.jsx로 교체했고 최종 Node 렌더/빌드에 포함됐다. 터치 크기/대비/safe area, 360/390/430px의 실제 시각 일치는 완료 근거가 없다.
- 독립 FigmaProject.jsx와 전용 CSS는 정리했으며 이전 시연 QA 잔여물은 통합 앱의 완료 근거로 사용하지 않는다. 사용자 데이터의 일괄 삭제나 다른 변경의 되돌리기를 하지 않았다.

## 기존 배포 확인과 도구 정책

root가 확인한 origin remote는 `https://github.com/junes-lie/ieum-v2-react`, 기존 프런트엔드 URL은 `https://ieum-v2-react.vercel.app/`이며 읽기 요청 HTTP 200이었다. GitHub 인증 없는 요청 HTTP 404는 저장소 부재의 증거가 아니다. 새 코드가 그 URL에 배포됐거나 서버가 연결됐다는 의미가 아니다.

Computer Use, 브라우저 UI 조작, Remote Figma, Notion UI 우회, 설정 재설치, 임의 배포는 사용하지 않았다. 이후 사용자가 명시한 보정 배포만 수행했다. Figma 디자인 근거는 Desktop MCP로 받은 원본이고 문서 근거는 사용자가 제공한 여섯 Markdown이다.


추가 독립 검증: terminal Node Mock WebAudio로 `createPreviewMix` 1 Track 성공, 0 Track+반주없음 거절, 1/2 Track Preview에서 oscillator 반주 생성 없음, 2 Track `createAutoMix`에서 반주 생성 및 1 Track 완성 거절을 확인했다. 이는 최소 Track 조건과 Preview/Final 분리 계약의 근거이며 실제 오디오 품질 증거가 아니다.

최종 공식 아이콘 추가 후 JSX 테스트 harness가 Icons.jsx도 로컬 Oxc 변환하도록 수정했다. 최종 production build 30 modules 및 Node 3 Part 렌더 테스트 재통과. 두 임시 변환 파일은 finally에서 삭제한다.


높이·하단 내비게이션 보정 배포는 READY(dpl_FwE5HGnfTy8K8RB8JUtHbYKrzgdG), 기존 production alias HTTP 200으로 확인했다. 최종 build 31 modules와 Node 렌더 테스트 성공은 root가 확인했다. 단계 0 감사 판정은 부분 확인·완료 보류이며 docs/STAGE_0_AUDIT.md를 따른다. 단계 1에 착수하지 않는다.
