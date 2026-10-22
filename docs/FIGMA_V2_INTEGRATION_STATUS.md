# IEUM V2 통합 체크포인트 · 2026-10-23

## 현재 기준
- 저장소 `junes-lie/ieum-v2-react`, 원격 작업 브랜치 `feature/figma-v2-integration`. 이번 시작 원격 `5887527dbca25792c2e1f56d13e4466f64d513be`, 로컬 tree `94029d2b27b07e0171b01133113e33f74b55298d` 일치.
- 이전 로컬 `5e48c3b`/`53d9d0b`의 레코드 재질 캐시·진단을 보존했다. 원본/입자 렌더의 동일성 검증 기록은 해당 Git 이력에 있다. 과거 장문 로그는 Git 이력으로 보존하고 이 문서는 현재 상태만 기록한다.
- Pages 우선 Preview와 통합 브랜치 Push가 승인됐다. 과거 NO Push 문구는 폐기한다. main·Vercel Production·공명 독립 브랜치·Notion/Figma 원본은 수정하지 않는다.
- 실제 AI 제공 음악은 `src/projectMusic.js`의 원키 22초 `천천히 함께` 반주·가사·멜로디 참조다. 일반 카탈로그 곡에 다른 반주나 가짜 가사를 붙이지 않는다. 시연은 Pages의 `?demo=music-a` → `?demo=music-b`에서 각자 실제로 녹음·제출한다. 같은 브라우저의 격리된 시연 DB를 공유하며 원래 사용자 DB는 보존한다.

## 이번 완료
- 제출 복귀 경합 수정: Track 저장 성공 후 browser Back보다 먼저 현재 화면 ref를 작업실로 확정하고, popstate가 효과 갱신 전의 presentation bridge 대신 현재 화면 ref로 녹음 이탈을 판단한다. 제출 중 guard가 Back을 거절해 `history.forward()`로 새 Recorder에 돌아가던 오류를 막았다.
- 회귀 증거: 동일한 낡은 bridge를 재현한 `qa/verify-submission-return-browser.mjs`는 원본 5887527에서 forward 1회로 FAIL, 수정본은 390/430 모두 forward 0회 PASS. 실제 반주와 짧은 합성 마이크 Take 두 개의 원본 해시·작업실 복귀·Auto Mix·완성곡 재생·reload를 확인했다. **22초 연속 녹음 인수 통과가 아니다.** 원본/입자/오디오 엔진은 유지했다.
- 관련 production build·Node QA 13개 PASS. 기존 `verify-integration-recovery-browser.mjs`도 390/430에서 녹음 중 native Back 취소/보관/Review 복원·Search 복귀·명시적 PCM fixture Mix 선택 변경을 통과했다. Pages 게시 및 hosted 검수 결과는 이번 커밋의 Actions와 최종 보고로 확인한다.
- 소유자 이름만 남은 로컬 잠금을 프로세스/예약 기록·깨끗한 작업 트리·원격 HEAD와 대조했다. 앱/QA/Git 작업 프로세스와 활성 예약 실행 근거가 없음을 확인하고 이전 표시를 `.git/ieum-integration-owner-recovered-*`에 보존해 소유권을 인계했다. 시간 경과만으로 해제한 것이 아니다. 종료 시 이번 소유 잠금을 해제한다.
- Pages: 경로 변환 뒤 반주 URL 검증식이 루트 `/audio/`만 허용하던 불일치 수정. `scripts/prepare-github-pages.mjs`에서 배포 산출물의 검증 경로도 같은 하위 경로로 변환하고 정확히 1회 적용을 검사한다. React 원본·Vite 설정·Vercel 설정은 유지한다.
- Recording: `100dvh`, 하단 Safe Area, 조작부를 남은 높이 안에 배치. 390×844/430×932/390×740에서 버튼 잘림·세로 스크롤 없음. Figma의 모니터링/가사/오른쪽 Guide 볼륨/하단 조작 묶음과 원본 에셋을 유지한다. 반주 토글 제거, 저장된 과거 Guide 설정도 반주 기본 ON으로 복원한다.
- Detail: 멤버별 재생/포함 UI 제거, 현재 Mix와 참여자 프로필 진입 유지. Workspace: 제출 Track에는 공통 토글만 표시하고 선택 변경 시 이전 재생·개별 선택을 해제한 뒤 기존 Preview Mix 경로로 갱신한다. 정적 Stage를 기존 transport 콜백으로 연결해 턴테이블 버튼도 같은 Mix를 재생한다. 원본 Track/완성 Mix는 변경하지 않는다.
- Profile: 저장된 `sampleFeatures`와 참여자 제출 Track 분석을 연결. 음색 특징 차이·역할 구성·등록된 공통 취향을 실제 입력에서 비교한다. 데모 프로필/내 샘플/참여자 Track/취향 정보 부족은 해당 항목을 구체적으로 표시한다. 특징 차이는 궁합 점수로 표시하지 않는다.
- Navigation: 즉시 스크롤 초기화, History에 진입 경로 저장, 실제 Workspace/Recording Back, Search 검색어·탭 복원. 브라우저 Back 중 녹음은 확인 후 정지·임시 보관하며 취소하면 현재 녹음을 유지한다.
- Search: 프로젝트는 슬리브+레코드, 완성곡은 레코드, 곡은 기존 커버. 기존 그래픽/커버/시연 그래픽 표기를 재사용한다.
- 검증: production build, Node QA 13개 및 `qa/verify-project-harmony.mjs` 통과. 실제 신규 등록(합성 마이크) 390/430에서 원래 Bass 선택 복귀·자동 참여 없음·아이콘 전환·reload·2명 음색 비교 통과. `qa/verify-integration-recovery-browser.mjs` 390/430에서 Search 표시/검색어 복원·앱/브라우저 Back·녹음 중 Back 취소/보관/Review 복원 통과.
- 실제 음악 A/B 연속 녹음·가사·pause/resume·Review·원본 해시·제출·Auto Mix·22초 완성곡 재생·reload는 390/430에서 각각 통과했다. 합성 마이크/브라우저 로컬 Mix 검증이며 물리 마이크/서버 AI Mix 성공을 의미하지 않는다.

## 미완료와 다음 시작점
- **22초 전체 음악 회귀는 미통과.** 기존 390A 10초 가사 대기 실패에 더해 이번 390B는 마지막 가사 뒤 12초 Review 버튼 대기 실패. 실패 후 진단에서는 REVIEW·원본 21.95998초·버튼 x201/y791/148×48의 visible/disabled 상태였다. 이를 숨김 버튼이나 녹음 권한 오류로 단정하지 않는다. 증거 `/tmp/ieum-clock-fixed/failure-390.json` 및 `/tmp/ieum-clock-fixed.log`; 성공한 짧은 Take로 대체하지 않는다.
- 다음 시작: Review Mix의 OfflineAudioContext decode/render·저장 완료와 버튼 활성화 시점을 분리 추적한다. `verify-project-music-browser.mjs`에 두 AudioContext의 decode, Offline render, recorder chunk timecode, 벽/오디오 시계와 History 진단을 추가했고 Pages 하위 경로도 지원한다. 원래 길이·시간·원본 해시 기준은 유지한다.
- 소프트웨어 GPU 진단: 그리기를 제외한 구간은 정상 시계, 복원 구간은 14.09초 벽시간에 오디오 6.08초 진행. 30fps 후보도 실패해 원복했으며 renderer 파일은 시작 SHA 그대로다. CPU affinity 4개 제한에서 원본 두 Take 22.02초가 통과한 경우도 있었지만 다음 회귀가 실패했으므로 환경 제한을 해결책/전체 통과로 취급하지 않는다. 원본 자르기·벽시계 대체·대기 완화는 하지 않았다.
- `프로젝트 조화 %`/종합 매칭 %는 최신 Notion 화면명세의 정량 표시 결정과 별개로 산식·가중치가 아직 미확정이다. 생성용 밝기·거칠기를 궁합 %로 전환하지 않았다. 실제 특징 비교 연결을 검증된 궁합 산식 완성으로 보고하지 않는다.
- 과거 430px 녹음 지연·길이 오차는 간헐 재현 이력이 있다. 이번 성공만으로 영구 해결을 주장하지 않는다. 실패 시 `qa/verify-project-music-browser.mjs`의 원래 시간/길이 기준·진단을 유지하고 재현 경계를 먼저 조사한다. 원본 자르기·길이 재표기·대기 기준 완화 금지.
- 전체 Figma 5화면의 최종 픽셀 검수, 물리 기기/이어폰/청취, 실제 다중 사용자·서버 AI Mix는 미완료. Pages는 정적/브라우저 기능 Preview이며 서버 검증이 아니다.
- 원격 최신 HEAD·로컬 tree·진행 중 프로세스를 확인한 뒤 미완료만 이어간다. 다른 소유 표시가 있다는 사실만으로 영구 중단하지 말고 실제 활성 실행 근거를 확인한다. 새 예약/중복 Push/빈 배포 커밋을 만들지 않는다.
