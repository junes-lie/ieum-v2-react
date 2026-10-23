# 화면 캡처 확인

## 실제 음악 녹음 복구 검증

`npm run build` 후 `npm run qa:project-music-recovery`를 실행합니다. 자체 Vite preview와 격리된 시연 DB에서 390/430px 합성 마이크로 권한 거부·연속 시작/정지·Review 후 마이크 해제·임시녹음 재진입/새로고침·제출 저장 실패·재녹음 이전 콜백·임시저장 실패 시 이탈 방지·Auto Mix 저장 실패와 단일 재시도를 검사합니다. 녹음 원본의 해시는 반주가 합성된 Review 재생 파일과 구분해서 비교합니다.

아래 표의 `PLAYWRIGHT_MODULE_PATH`, `CHROMIUM_EXECUTABLE_PATH`, `IEUM_QA_WIDTHS`, `IEUM_QA_OUTPUT`을 지원합니다. `IEUM_BASE_URL`을 주면 외부 서버 실행 없이 해당 주소를 검사합니다. 일반 사용자 DB를 초기화하지 않으며 실제 기기·청취·실시간 다중 사용자 검증을 대신하지 않습니다. 특정 Windows 설치 경로를 고정한 이전 개별 QA와 별개로 실행할 수 있습니다.

`node qa/verify-submission-return-browser.mjs`는 실제 반주를 들으며 짧게 녹음한 두 Take를 직접 제출합니다. React 효과 갱신 전의 낡은 presentation bridge를 재현해, 제출 완료 후 Back이 `forward()`로 거절되지 않는지, 원본 해시·작업실 복귀·Auto Mix·재생·reload를 확인합니다. 마이크는 Chromium 합성 입력이며, 이 검사는 **22초 연속 녹음 인수 검사를 대체하지 않습니다.**

`node qa/verify-project-music-browser.mjs`는 기존 22초 길이·가사 대기·Review 시간 기준을 유지합니다. 루트와 Pages 하위 경로를 모두 지원하며 실패 JSON에 벽시계/Web Audio 시계, native recorder chunk timecode, History 이동을 기록합니다. Linux CPU quota/소프트웨어 GPU 진단은 해당 머신의 허용 CPU 목록을 확인한 후 `taskset -c 0-3 node qa/verify-project-music-browser.mjs`처럼 실행 범위를 제한할 수 있습니다. 자원 제한 실행 결과와 일반 실행 실패는 각각 기록하며, 한 번의 통과로 간헐 지연 해결을 주장하지 않습니다.

## 전체 화면 캡처

`npm run qa:record-visibility`는 일반 모션에서 390/430px의 실제 레코드가 화면 밖에서 GPU 렌더링을 멈추고, 다시 들어오면 같은 그래픽·제출 Track을 유지하며 움직이는지 검사합니다. 기존 조형·입자·shader의 시각적 승인 여부를 대신하지 않습니다.

`npm run qa:capture`로 현재 실행 중인 앱의 전체 화면 갤러리를 만듭니다.
기본 주소는 `http://127.0.0.1:4187`이며 먼저 `npm run dev`를 실행합니다.

- 저장 위치: `qa/captures/<실행 시각>/` — 운영체제 임시 폴더를 사용하지 않습니다.
- `index.html`: 이미지가 내장된 독립 HTML. 브라우저에서 열면 화면별 확인·PNG 저장이 가능합니다.
- `<화면>-390.png`, `<화면>-430.png`: 스크롤 끝까지 보이는 전체 내용. 고정 하단 탭은 내용 가림을 막기 위해 캡처에 한해서 숨깁니다.
- `*-viewport.png`: 932px 높이의 실제 화면. 원래 고정 하단 탭·레이아웃을 유지합니다.
- `manifest.json`: 대상 주소의 origin, 지정 버전, 실제 화면, 성공·실패 기록. 인증 쿼리는 저장하지 않습니다.

대상: 홈, 검색, 곡·프로젝트 상세, 작업실, 보컬 찾기, 후보 상세, 다른 보컬 프로필, 녹음 준비, 완성곡, 내 프로젝트, 컬렉션, 내 목소리, 새 프로젝트, 목소리 등록 시작 — 14개 진입 화면입니다. 녹음·일시정지·Review·Voice Setup 후속 단계 등 모든 상태를 검증하는 기능 QA를 대체하지 않습니다.

환경변수:

| 변수 | 용도 |
| --- | --- |
| `IEUM_BASE_URL` | 캡처할 실행/배포 주소 |
| `IEUM_QA_OUTPUT` | 출력 폴더 명시 |
| `IEUM_QA_WIDTHS` | 기본 `390,430`; 예: `430` |
| `IEUM_CAPTURE_LABEL` | 변경 전/현재/미배포 통합본 등 구분 |
| `IEUM_CAPTURE_REVISION` | 실제 대상 commit/build 식별자 |
| `PLAYWRIGHT_MODULE_PATH` | 기존 Playwright 설치 경로 |
| `CHROMIUM_EXECUTABLE_PATH` | 사용할 Chromium/Edge 실행 파일 |
| `IEUM_BROWSER_PROXY` | 필요한 경우 브라우저 프록시 |
| `IEUM_QA_STORAGE_STATE` | QA 전용 인증 상태 파일; 실제 개인 브라우저 상태 사용 금지 |

Playwright와 Chromium이 필요합니다. 실행 환경의 기존 설치를 재사용할 수 있습니다.
캡처는 독립 브라우저 컨텍스트에서 수행하며, 기존 레이아웃 QA와 같은 로컬 참여 시연값을 사용합니다. 녹음·Track 제출·초대·실제 계정 수정은 하지 않습니다. 실행한 버전에 화면이나 필요한 시연 데이터가 없으면 실패를 명시하고 종료 코드 1을 반환합니다. 실패를 다른 화면 캡처로 대체하지 않습니다.

UI QA 완료 시 `npm run qa:capture`를 실행하고, 실제 대상 버전을 명시한 `index.html`과 PNG/manifest가 포함된 ZIP을 사용자에게 전달합니다. 기존의 개별 검증 스크립트 산출물은 기능·상태 검증 근거로 유지합니다. 캡처만으로 기능·오디오·물리 마이크·시각적 승인 완료를 주장하지 않습니다. 이미지 산출물은 Git에 자동 추가하지 않습니다.

`node qa/verify-review-save-order-browser.mjs`는 기존 4-Part 프로젝트의 22초 반주와 합성 마이크 녹음으로 임시 저장 완료를 지연시킨다. 저장 대기 중 Review 디코딩이 시작되지 않는지, 완료 후 미리듣기·내 Tenor 제출·새로고침 원본 해시가 유지되는지 390/430에서 검사한다. `PLAYWRIGHT_MODULE_PATH`, `CHROMIUM_EXECUTABLE_PATH`, `IEUM_BASE_URL`, `IEUM_QA_OUTPUT`, `IEUM_QA_WIDTHS`를 지원한다. 실제 사람·4인 협업·물리 마이크 검증이 아니며 1/4를 완성으로 바꾸지 않는다.

`node qa/verify-workspace-timeline-browser.mjs`는 최신 Figma 1623:41443의 80px Current Mix 그룹과 48px 금속 재생 버튼·seek/시간 위치를 검사한다. 빈 프로젝트에서는 재생을 비활성화하며, native 합성 마이크로 직접 녹음·제출한 Tenor 하나로 키보드 재생/탐색·Mix 포함 토글·원본 해시·200% 텍스트를 검증한다. 테스트용 제출 Track을 미리 주입하지 않으며 1/4는 미완성이다. 위 휴대용 환경변수와 공개 Pages 하위 경로를 지원한다.

`node qa/verify-recording-load-browser.mjs`는 일반 모션에서 250ms 간격의 실제 screenshot readback을 요청하며 22초 반주·합성 마이크·pause/resume을 수행한다. 실제 완료한 캡처 수, MediaRecorder 이벤트, Web Audio/벽시계, WebGL draw, long task, 원본 bytes/hash/길이를 함께 보존한다. `IEUM_QA_REPEATS`로 폭별 반복 수를 지정할 수 있다. 단일 통과를 장시간 부하 안정성으로 확대하지 않으며 원본을 자르거나 타이밍을 수정하지 않는다.
