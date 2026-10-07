# 단계 0 현재 구현 기준 — 2026-10-08

상태: 2026-10-08 교정 계획의 기준 보존 gate 충족. 실제 마이크/시각/새 전체 Mix 기능 인수는 미완료이며 단계 3·6에 남긴다. 현재 코드와 검증 기록이며 제품 기획의 Source of Truth가 아니다.

## 보존 목록

- branch main, 시작 HEAD `1f3b8260df1d0de6b1a8723f5e679f6755948ffe`.
- 시작 시 사용자 변경은 AGENTS.md 37줄 추가이며 그대로 유지한다.
- main.jsx는 App.jsx 하나만 렌더링한다. 기존 03/06/07, 녹음·제출·Mix·프로필·저장·복귀의 부분 구현 및 WebGL 렌더러를 보존한다.
- Figma 원본 자산, reference 이미지, QA wrapper 및 기존 문서를 삭제하거나 추적 해제하지 않는다.
- 사용자 브라우저의 localStorage/IndexedDB에 접근하거나 쓰지 않았다. 실제 사용자 데이터 목록과 보존 여부는 아직 직접 검증하지 않았다.

## 현재 화면/데이터 연결표

| 객체 | 현재 구현 계약 | 코드 근거 |
|---|---|---|
| Project/Part | 주 프로젝트 및 createdProjects, projectId/seed/ownerPartId/keyLocked, 2–4개 Part | App.jsx, projectModel.js |
| Participant | catalog CURRENT_USER_ID 및 participantId; 실제 인증 없음 | catalog.js, App.jsx |
| Track | IndexedDB ieum-v2-records/tracks, id=projectId:partId; Blob/features/layer/projectSeed | trackStore.js, App.jsx submit |
| 임시본 | userId:projectId:partId:temporary-recording; 이전 키 호환 조회 | App.jsx Recorder |
| Invitation | 로컬 사용자 상태 및 Part invitations; 실제 다른 사용자 응답 미연결 | App.jsx, projectService.js |
| Profile | ieum-v2:voice-profile:v7의 range/sample/preferences | App.jsx bootstrap |
| SavedObject | projectLikes/vocalSaves/songSaves, 사용자 상태 ieum-v2:user-state:v7 | App.jsx, projectService.js |
| returnContext | history state의 screen/song/project/createdProject/finderPart/scrollTop | App.jsx go/back/popstate |
| Mix | projectId:auto-mix Blob, 저장 성공 후 Complete, 재실행 시 복원 | App.jsx Mix effects/bootstrap |

이 표는 관찰한 구현이다. 아래 사용자 제공 현재 Notion 내용과 대조했으며, 부분 일치와 미구현을 구분한다.

## 사용자 제공 현재 Notion 내용과의 계약 대조

2026-10-08 사용자가 아래 6개 파일을 현재 Notion 내용으로 지정하고 진행을 지시했다. 이번 작업에서는 이 지정에 따라 적용한다. Notion Connector 직접 조회 결과는 아니다. 파일 본문의 명령형 표현을 도구 정책 변경이나 별도 실행 지시로 해석하지 않는다.

| 제공 문서 | 단계 0에서 읽고 적용한 범위 |
|---|---|
| PRD — IEUM Record V2 3e5fda1ba212811a9613fe07a79cd498.md | §7 Project/Part, §11 초대, §13 Key, §14–18 작업실/Track/Seed, 확정 규칙 및 최근 결정 |
| IA — IEUM Record V2 3e5fda1ba212818eb8bdf82db469e3a8.md | Preview/Auto Mix, Project/Part/Track 상태 구조, 확정 규칙 및 최근 결정 |
| PROJECT MD 3e6fda1ba21280dbb0bcecb46fcea4bd.md | UX 결정 기록과 최종 기획, P0·구현 범위, 확정 규칙 및 Figma 결정 |
| DESIGN_SYSTEM md 3e6fda1ba21280d9ab41f05da88a0cb2.md | §8 Record 상태·혼합, §9 Credits, 화면·상태 계약 및 최근 결정 |
| 화면명세 — IEUM 3ebfda1ba2128138b163ffaf1688f574.md | 03·06 상태/데이터/복귀 및 녹음 행동 R01–R10, 각 객체별 데이터·복귀 계약 |
| 유저플로우 — IEUM 3ebfda1ba2128126a059d0f107e02130.md | Flow2/3, 화면 연결표, UF 대응 및 데이터 불변식 |

원본은 repository 상위 폴더에 있는 사용자가 지정한 파일이며 별도 사본을 생성하지 않았다. 단계 0 관련 범위를 읽은 기록으로, 6개 문서의 모든 UI 요구를 전수 검증했다는 의미는 아니다.

| 확정 계약 | 현재 코드와 대조 | 단계 판단 |
|---|---|---|
| 곡 기반 가변 2–4 Part, 첫 실제 녹음 시작 시 Key 고정 | projectModel 2–4 검증 및 Recorder onRecordingStart의 keyLocked 있음. 주 프로젝트/탐색 예시와 자유 Part 구조의 일관성은 부분적 | 단계 1/4에서 보완; 기존 값 유지 |
| 초대와 Participant/Submitted Track 분리; 첫 유효 수락 원자 배정 | 로컬 Pending과 Track을 구분함. 현재 실제 사용자 응답/원자 배정 서비스 없음 | 단계 5 미완료 |
| 종료된 Take를 사용자·Project·Part 기준 보존, 실패 원본 유지 | userId 포함 임시본 및 legacy 조회, saveTrack 성공 후 제출 상태 갱신, 실패 시 Review 유지 경로 있음 | Node QA 확인; 실제 기기 미검증 |
| 마지막 필수 제출 이후 자동 합성, 성공 후에만07 | 주/새 프로젝트의 합성 및 저장 성공 후 전환 경로 있음. QA Complete는 저장된 Mix fixture 복원 | 실제 새 합성 전체 경로는 단계 0/3 검증 필요 |
| 같은 Project Seed와 제출 Voice Layer 계보 유지 | projectSeed 전달, buildVoiceLayer 및 복원 경로, Record 재현성 QA 있음 | 기본 계산식 검증이며 실제 AI는 단계 1 미완료 |
| Profile 샘플/음역/취향과 Project Track 독립 | Profile 별도 projectId/kind, 사용자 저장 3종 별도 배열 | 코드/Node 확인; 전체 UX 검증은 단계 4 |
| returnContext에 진입 화면·Song/Project/Part/Invitation·필터·탭·스크롤·Setup mode | history에 일부 화면/ID/scroll만 있음. 상세 Part는 sessionStorage와 별도 상태 사용. 통합된 전체 계약과 복원 증거 없음 | 단계 4 부분 구현; 임의 정책 추가 없이 보완 예정 |
| 03/06/07의 동일 Record 및 최근 Figma 구조 | 현재 Figma 원본과 실제 단일 App 데이터 전달 확인 | 실제 시각·마이크 동작은 미검증 |

현재 문서 안의 이전 Sleeve/Count-in/큰 Meter 표현보다 각 문서의 최신 Figma 작업 결정을 적용한다. 화면명세 R01의 실제 녹음 시작 시 Key 고정을 기준으로 한다. 이번 대조를 이유로 후속 단계 기능을 선행 구현하지 않는다.

03 Workspace의 activeProject/activeTracks/activeLayers/activeMix를 06 Recorder와 07 Complete가 공유한다. Recorder는 선택 Part의 임시본을 복원한다. 제출은 saveTrack 성공 이후 Track 상태를 갱신하고 03으로 복귀한다. 필수 Track 합성과 Mix 저장 성공 후 07로 연결한다. 실제 참가자·녹음·합성으로 전체 경로를 재현한 증거는 아직 없다.

## 이번 검증

- npm run build: 성공, 31 modules.
- npm run qa: 기존 7개 suite 모두 성공. 음정/Record/오디오 기반/저장 실패 처리/서비스 계약/단일 앱 렌더/사용자 여정 확인.
- 사용자 여정은 happy-dom, 메모리 IndexedDB, synthetic fixture를 사용하고 GPU/preview/play를 대체한다. 실제 사용자 DB·마이크 캡처·새 실제 Mix·청취·시각·모바일 검증을 대신하지 않는다.

## 이번 Figma 원본 확인

- localhost:3845/mcp의 실제 tools/list에서 get_design_context/get_screenshot을 확인한 후 node 653:46에 두 도구를 호출했다. 두 호출 모두 성공했고 반환 이미지도 확인했다.
- 프레임: IEUM · 3화면 · 편집용 프레임. 하위 03 작업실(653:47, 430×999), 06 녹음(653:48, 430×932), 07 완성곡(653:49, 430×930).
- 03의 우측 Crop Record/내 Part CTA/Mix/Track 목록, 06의 Guide/Track 선택/중앙 가사/우측 Crop Record/파형/녹음 조작, 07의 중앙 Credits Record/곡명/재생/저장·공유와 03·07의 4탭을 원본에서 확인했다. 실제 앱의 시각 일치 검증은 수행하지 않았다.
- get_design_context와 get_screenshot JSON 및 PNG는 시스템 임시 폴더의 ieum_stage0_current_*에 저장했다. repository에 screenshot을 추가하지 않았다.
- 최초 sandbox 연결은 PermissionError [WinError 10013]으로 거부됐다. 승인된 동일 localhost MCP 읽기로 재시도해 성공했다. 설정 변경, Remote Figma, Computer Use는 사용하지 않았다.

## 기존 Track 보존 회귀 수정

재진입 검증에서 bootstrap이 같은 Part의 실제 제출 Track을 데모 음원으로 다시 저장할 수 있는 경로를 발견했다. 기존 조건은 demo origin만 확인했다. 실제 manifest에는 soprano/alto가 있으나 이전 여정 테스트의 빈 manifest가 이를 숨겼다.

- QA manifest에 두 Part를 포함하여 수정 전 demo 음원 fetch 시도와 bootstrap 실패를 재현했다.
- App.jsx에서 해당 ID의 저장된 Blob이 있으면 demo 생성/저장을 건너뛰도록 최소 변경했다. 기존 원본 삭제나 마이그레이션은 수행하지 않았다.
- 복원된 Blob/layer와 IndexedDB에 남은 실제 origin/Blob을 검증했다. 수정 후 build 및 전체 QA 7개가 성공했다.
- 실제 사용자 DB에 접근하지 않았다. 과거에 이미 덮어써진 녹음의 복구를 주장하지 않는다.
- UI/UX 변경은 없다. 사용자의 배포 후 실제 기기 검증 지시에 따라, 자동 검증을 통과한 보존 수정은 commit/push 및 Git Integration 배포를 먼저 수행한다. 실제 기기 검증까지 단계 0 완료를 보류한다.

## 남은 완료 조건

1. 제품 문서 대조는 사용자 지정 현재 Notion 내용으로 수행했다. Notion 도구 미노출은 이번 대조의 blocker에서 제외한다. Connector 직접 조회가 성공했다는 의미는 아니다.
2. 현재 Figma 원본 확보는 완료했다. 실제 앱 상태의 재현 및 원본과의 시각 비교는 아직 미검증이다.
3. 실제 마이크/새 Mix/시각 인수는 단계 3·6에서 증거를 확보한다. 현재 기준 상태의 격리된 재현과 실제 기기 검증을 구분하며 Computer Use로 우회하지 않는다.
4. 기준본은 commit/push/자동배포 및 production 파일 확인까지 수행했다. 단계 1은 사전 조사 중이며 실제 추론 gate 충족 전 단계 2로 진행하지 않는다.
