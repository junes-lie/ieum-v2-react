# IEUM V2 통합 체크포인트 · 2026-10-23

## 완료
- 모바일 시연 셸 수정: 600px 이하에서 외부 메뉴·베젤·여백 제거, 앱을 100dvh로 표시하고 프로필 등록 완료(profile-ready) 진입만 사용. 데스크톱 선택지는 유지. Pages 하위 경로 로컬 Chromium 390×844/430×932/390×740 및 데스크톱 1280×1000 통과, build·Node QA 13개 통과. 게시 후 실제 URL 확인은 해당 커밋 Actions와 최종 보고로 확인한다. 녹음/매칭 미완료 상태는 아래 그대로 유지.
- 원격/로컬 통합 브랜치 기준 `39b2fd7d6602d80fed38f493596f726b517ec368`, tree `4ded9f67f5f826a4baa70397d1bed758b7bb4cd4`. 이전 `5e48c3b`/`53d9d0b`/`d99a5a7` 작업 보존. main·Vercel Production·공명 독립 브랜치·Notion/Figma 원본 보존.
- 기존 완료 유지: Recording 100dvh/Safe Area·하단 조작·Back/임시 보관, Detail/Part 개별 재생 UI 제거, Workspace 선택 Track만 Current Mix, Search 결과별 표현, 실제 프로필/Track 분석 전달·부족 데이터 안내, Pages 반주 URL 검증 변환. 제출 후 낡은 bridge 때문에 Recorder로 forward되던 경합은 39b2fd7에서 수정·배포했다. 반복 구현하지 않는다.
- Pages Actions `39839176209`의 정확한 39b2fd7 build/deploy Success 재확인. 실제 https://junes-lie.github.io/ieum-v2-react/ 의 JS `10ac818efe44cc7c25fc0f92ca2199c1992ffa3babaaddf2644a811d7e43ddfb`, CSS `521ec455e0b3ca244b7fa1387af04ab53182dcb60196ef4a9982b4ce78488757` 일치. 이번 로컬 변경은 QA·체크포인트이며 미푸시 상태다.
- 최신 Notion 화면명세의 Recording 저장/Review/원본 보존 계약 및 Figma Home·Detail·Workspace·Recording·Search 원본을 전용 도구로 읽었다. 실제 원키 22초 `천천히 함께`의 반주·가사·참조와 일반 카탈로그 분리를 유지한다.
- 진단 추가: IndexedDB open/put/transaction과 Review 제출/재녹음/Preview 준비 시점을 분리 기록한다. 정상 그래픽 전체 회귀 390B는 REC 00:13에서 마지막 가사 10초 대기 실패. 별도 A 진단도 REC 00:21에서 Review 12초 대기 실패했으며 당시 임시저장 요청이 아직 없었다. 두 실패를 저장 병목으로 단정하지 않는다.
- 그래픽 draw만 제외한 **진단**에서 native 합성 마이크 원본 21.959977초/348690 bytes, SHA256 `bfb8bb3282811a444eea069737a5112e0af49759a2aa588fc1ba83de061d567d`를 자르지 않고 보존. Review 후 DB 완료 약 0.42초, Preview 약 1.85초. 정상 그래픽으로 이 원본을 새 시연 DB에 복원한 검사는 390/430 원본 해시·제출 활성화·22초 반주 Preview 재생·버튼 범위 PASS. 유지 QA 최종 실행은 제출 활성화 402/273ms, Preview 1744/1731ms. 앞선 유지 QA 첫 실행의 Workspace 진입 20초 실패 로그도 보존했다. **복원 성공은 live A/B 전체 인수 통과가 아니다.**
- `qa:project-music`와 Track store Node QA PASS. 앱/오디오/renderer 구현과 기존 길이·대기 인수 기준을 유지했다. 모든 진단/캡처/원본은 로컬 `.git/ieum-integration-evidence-review-phase/`에 보존한다.

## 미완료
- **22초 A/B 전체 음악 회귀 미통과.** 녹음 중 오디오 시계 지연과 기존 Review disabled 지연의 영구 원인/해결은 미확정. 그래픽 제외·짧은 Take·복원 검사·자원 제한 실행 성공으로 대체하지 않는다. 430 간헐 지연도 미해결이다. 30fps 후보는 이전 실패 후 원복됐으므로 근거 없이 반복하지 않는다. 원본 자르기·길이 재표기·벽시계 대체·대기 완화 금지.
- 종합 매칭/프로젝트 조화 %의 확정 산식·가중치 없음. 실제 특징 비교 연결과 별개이며 생성용 밝기·거칠기 차이를 궁합 %로 전환하지 않는다.
- Figma 5화면 최종 픽셀/모션/정적 자산 전체 검수 미완료. 430 비교 캡처에서 Workspace 전체 길이 screenshot 15초 실패(원래 viewport는 보존), 나머지 4화면 전체 내용 캡처. 기기/이어폰 청취·물리 마이크·서버 AI Mix·실제 다중 사용자 검증 미완료.

## 다음 시작점
- 원격 HEAD·로컬 미푸시 QA/체크포인트·활성 프로세스/소유 기록을 대조하고 자기 잠금만 인계/정리한다. 현재 제품 기준은 39b2fd7이며 새 예약·빈 배포·확인만을 위한 Push 금지.
- 보존한 실패의 clockSamples/recorder timecode와 정상 복원 시점을 비교해 녹음 중 그래픽/오디오 자원 경계를 좁힌다. 유지 QA `verify-project-review-restore-browser.mjs`의 입력은 위 evidence 폴더 안 `ieum-native-review-isolation/native-original.json`이다. 실제 녹음 회귀가 Review에 도달하면 `IEUM_QA_ARCHIVE_ORIGINALS=1`로 해당 원본을 함께 남길 수 있다. 복원만 재실행해 전체 PASS를 만들지 않는다.
- 실제 수정의 원인과 범위가 검증된 뒤 관련 Node·정상 Chromium 390/430 → 한 번의 통합 브랜치 Push → 기존 Pages 자동 build/deploy Success → 실제 URL/에셋/SHA 확인 순서를 지킨다. 전체 완료 시 기존 예약 중지.
