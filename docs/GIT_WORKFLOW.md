# Git / GitHub / Vercel 작업 규칙

초기 동기화에서는 최신 로컬 구현을 보존하며 GitHub main에 기록한다. 동기화 이후 코드의 Source of Truth는 GitHub main이다. 로컬은 작업 공간, Vercel은 배포 결과물이다.

1. 기존 앱에서 단계별 구현을 진행한다.
2. dependency 상태, production build, 현재 요구사항에 맞는 유지 QA, asset/import 누락과 오류를 확인한다. 브라우저를 사용하지 않은 테스트는 실제 모바일/마이크/시각 검증으로 보고하지 않는다.
3. branch, local HEAD, origin/main, ahead/behind, status/diff와 ignore 목록을 확인한다.
4. A/B 코드·asset·설정·문서·유지 QA와 필요한 .gitignore만 명시적으로 stage하고 staged diff를 검토한다. 일회성 이미지/결과 JSON과 폐기 후보 스크립트는 제외한다.
5. 검증된 변경을 의미 있는 commit으로 기록한 뒤 force 없이 main을 push한다.
6. local main HEAD와 origin/main HEAD가 같은지 확인한다.
7. Vercel Git Integration이 GitHub main push로 자동배포를 시작했는지, 배포 commit hash가 방금 push한 hash인지, production build가 성공했는지 확인한다.
8. production URL 응답과 가능한 핵심 흐름을 검증한다. 실제 기기에서 확인하지 못한 항목은 미검증으로 남긴다.

GitHub push 전 Vercel production을 직접 갱신하지 않는다. 자동배포 실패 시 Git Integration 설정을 조사하며 수동 production deploy로 우회하지 않는다.

reset, 로컬 변경을 덮는 checkout/restore, clean, force push, 작업물 삭제, origin/main 또는 Vercel 상태로 로컬을 되돌리는 행위를 금지한다.

## QA 산출물 보존

.gitignore는 C 이미지 26개, 결과 JSON 3개와 현재 앱/유지 QA가 사용하지 않는 로컬 스크립트 2개의 정확한 경로만 제외한다. public/figma/ 또는 qa/ 전체는 제외하지 않는다.

이미 추적 중인 산출물은 ignore만으로 추적이 해제되지 않는다. 필요한 경우 `git rm --cached -- <개별 경로>`로 index에서만 제외하고 로컬 파일은 보존한다. 해당 제거 역시 staged diff에서 확인한다.

`qa/create-resonance-comparison.mjs`는 과거 로컬 비교 이미지 생성기이고 `qa/verify-figma-design.mjs`는 제거된 별도 Figma 시연 화면을 대상으로 한다. 두 파일은 삭제하지 않고 로컬 참고 자료로 보관한다. `qa/verify-user-journey.mjs`는 유지 대상으로, 현재 Flow에 맞게 검토해야 한다.

## 완료 보고

검증 결과, 주요 commit 내용, 제외 산출물, commit hash/message, push 성공 여부, main 동기화, Vercel 자동배포 여부/commit hash, production 검증, 남은 문제를 실제 결과로만 보고한다. 하나라도 확인하지 못하면 전체 완료로 보고하지 않는다.
