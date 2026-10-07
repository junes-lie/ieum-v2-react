# 단계 0 읽기 전용 감사

2026-10-07. 판정: **부분 확인, 단계 0 완료 보류**. 단계 1 AI/데이터 신규 구현에 착수하지 않았다. 코드 수정 없이 실제 파일·현재 diff·저장 경로를 읽었다.

## 현재 보정 작업의 분리

높이·하단 내비게이션 보정은 별도 요청으로 처리됐으며 root가 production 배포 READY를 확인했다. 배포 ID `dpl_FwE5HGnfTy8K8RB8JUtHbYKrzgdG`, alias `https://ieum-v2-react.vercel.app/`, 고유 URL `https://ieum-v2-react-abfpz5hug-junes-lie.vercel.app/`. HTTP 200과 배포 JS/CSS, 높이 및 내비게이션 CSS 문자열이 확인됐고 최종 build 31 modules와 Node 렌더 테스트가 통과했다. 이는 실제 브라우저의 시각·터치·마이크 검증이 아니다. 기능 단계 gate의 완료로 계산하지 않는다.

## 보존 기준과 실제 연결

| 대상 | 실제 코드 근거 | 확인 및 한계 |
|---|---|---|
| 앱 진입 | `src/main.jsx:3`, `:6` | 기존 App만 createRoot 렌더. 별도 Figma 앱 분기 없음 |
| Project/Part | `src/projectModel.js:1`, `src/App.jsx:40`, `:1160` 부근 | id/seed/partIds/parts/totalParts, 2–4개·중복 검증. 생성 프로젝트 state와 주 프로젝트 state는 아직 분리 |
| Participant | `src/catalog.js:1`, `src/App.jsx:1294` | 현재 userId `jisun`, Track participantId/participant. 실제 인증 사용자 자료 아님 |
| Track/Mix | `src/App.jsx:1290`, `:1315`, `:1390`, `:1410` | projectId/seed/partId/index/participant/blob/duration/offset/features/layer 저장. Mix는 별도 kind/id. 제출 후 UI 갱신 |
| Profile | `src/App.jsx:69–72`, `:1255–1261`, `:1462` | Range, Sample, preferences 별도 IndexedDB 레코드. Profile 재구성. AI identity는 blocked |
| SavedObject | `src/App.jsx:78–97`, `:1327` 부근, `:1371` | projectLikes/vocalSaves/songSaves 별도 배열. `ieum-v2:user-state:v7` localStorage 유지 |
| Invitation | `src/App.jsx:1267` | Part 내부 invitations(vocalId/name/status/sentAt), 주 프로젝트 invited 상태. invitationId/수신자 실제 응답/공유 revision은 미구현 |
| returnContext | `src/App.jsx:1222–1240`, `:1352` | browser history에 화면/song/project/activeCreatedProject/finderPart/scrollTop 저장·복귀. 초대 ID·Collection 탭·Finder 필터 전체 계약과 상호작용 검증은 없음 |
| 녹음·임시본 | `src/App.jsx:894–943`, `src/trackStore.js:1` | DB `ieum-v2-records`, 버전 1, tracks 유지. user/project/part draft 키와 이전 키 읽기. 실제 브라우저 녹음 내용·복원은 접근/실행하지 않음 |
| Record 계보 | `src/App.jsx:423–469`, `:1297`, `src/voiceAnalysis.js`, `src/resonanceWebGL.js` | 기존 분석 layer/seed/live WebGL 연결 유지. renderer의 기존 작업 diff 106 additions/72 deletions가 남아 있으며 일괄 되돌리지 않음 |

현재 renderer SHA256: `A36F8C761D80A10A3BABFE5D818ACF688F959E46AA98524717777D06B12C3ADB`. voiceAnalysis SHA256: `C1FF378A0BED842DCE67B5F54495DB95528EBE6D0E2FFBA0364B9F30AF1893FC`. 이는 현재 기준점이며 이전 요청 전과 byte 동일하다는 증거가 아니다.

이번 감사에서 데이터 삭제 함수를 실행하지 않았다. 실제 코드에는 사용자 확인 resetDemo→clearProjectTracks, 다시 녹음→draft delete, 제출 성공→draft cleanup 경로가 존재하므로 삭제 기능 자체가 없다고 주장하지 않는다. bootstrap은 기존 레코드를 읽고 필요 시 분석 metadata/fixture를 저장한다. 사용자 브라우저 IndexedDB의 실제 내용을 조회하거나 자동 정리하지 않았다.

## 디자인·문서 기준

구현 계획 `docs/IMPLEMENTATION_PLAN_2026-10-07.md:34`의 Desktop MCP 원본 기준은 `IEUM · 3화면 · 편집용 프레임`, 653:46, 하위 작업실 653:47·녹음 653:48·완성곡 653:49다. root가 이번 보정 작업에서 figma-desktop MCP의 get_design_context/get_screenshot을 다시 성공 호출하고 653:46 원본을 확인했다. 응답 저장물 이름은 ieum_mobile_fix_*다. 감사 담당자는 원본을 새로 조회하지 않았으며 root의 실제 호출 결과를 최신 출처로 반영한다. `src/figmaAssets.json`와 `public/figma/653-46` 28개 자산이 남아 있다. 이는 명시적 653:46 조회의 증거이며 Figma Desktop의 현재 선택이 같은 프레임이라는 증거는 아니다.

사용자가 제공한 IA/PRD/PROJECT/DESIGN_SYSTEM/화면명세/유저플로우 Markdown 6개가 프로젝트 루트에 존재한다. 이전 Computer Use Notion 결과를 근거로 사용하지 않는다. 추가로 같은 이름의 구버전 PROJECT.MD/DESIGN_SYSTEM.md가 있으므로 구현 기준은 사용자가 명시한 ID 포함 첨부 파일이다.

## 완료 보류 근거

단계 0의 완료 조건은 보존 목록·연결표뿐 아니라 **기존 앱의 실제 상태 재현**이다. Node 렌더링은 세 화면의 데이터 전달을 확인하지만 사용자의 실제 녹음·임시본·제출·Mix 상태 복원, 실제 seed/layer의 UI 기준 캡처, 모바일/물리 기기 재현을 증명하지 못한다. returnContext와 Invitation 모델도 필요한 전체 계약이 확정되지 않았다.

따라서 단계 0을 완료로 표시하지 않는다. 다음 할 일은 허용된 방법으로 현재 원본 기준/실제 사용자 데이터 복원·화면 상태를 검증하고 미확정 계약을 명시하는 것이다. 단계 0의 gate 통과 전 단계 1이나 이후 신규 기능 구현을 시작하지 않는다. Computer Use·브라우저 UI 조작·원격 Figma·설정 변경은 수행하지 않았다.
