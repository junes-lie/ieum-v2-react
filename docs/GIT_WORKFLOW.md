# Git / GitHub / Vercel 작업 규칙

GitHub main은 영구 기록이며, 제품 코드의 기본 검증 경로는 작업 브랜치의 Git Integration 자동 Preview다. 로컬의 미배포 코드·실제 Preview·기존 Production을 구분한다.

## 배포 중복 방지 · 사용자 지시 2026-10-22 (기존 배포 순서보다 우선)

- 기본 경로는 **로컬 코드 변경 → 관련 QA → GitHub 작업 브랜치 Push → Git Integration 자동 Preview 확인**이다. React는 `feature/figma-v2-integration` → `ieum-v2-react`, 공명은 `feature/resonance-standalone` → `ieum-resonance-preview`에서만 검증한다. Preview를 생략하고 main부터 갱신하지 않는다. 문서만 정리하는 작업은 화면 Preview 완료로 보고하지 않는다.
- 배포 확인 키는 팀·프로젝트·브랜치·정확한 SHA·환경이다. Push 후 Git 상태/Checks와 해당 프로젝트의 배포 목록을 조회하고 기존 배포 ID·상태·URL을 재사용한다. READY 또는 QUEUED/INITIALIZING/BUILDING/업로드 중인 동일 SHA가 있으면 새 배포를 생성하지 않는다. main과 Preview의 정상적인 환경 차이는 같은 환경의 중복 배포와 구분한다.
- Git 자동 배포가 시작된 커밋에는 Vercel API/CLI, Deploy Hook, 별도 CI 배포, Redeploy로 두 번째 배포를 만들지 않는다. 상태가 늦게 표시되거나 목록이 잠시 비어도 별도 생성으로 보충하지 않는다. Git Integration 장애를 먼저 진단한다. 자동 배포용과 수동 배포용 경로를 동시에 운영하지 않는다.
- 문서·체크포인트·QA 기록·작업 잠금의 추가/해제는 가능한 한 관련 코드 커밋과 한 번의 Push로 합친다. 여러 로컬 커밋도 QA 완료 뒤 묶어 Push한다. 배포를 유발하려는 빈 커밋, SHA만 바꾸는 커밋, 확인 기록만을 위한 연속 Push를 금지한다. 필수 공유 잠금 획득이 별도 원격 기록을 요구하면 그 예외만 허용하고 main에 잠금 전용 Push를 하지 않으며, 종료 기록·자기 잠금 해제는 한 커밋으로 합친다. 문서만 요청된 작업은 관련 없는 코드 변경이나 빌드를 추가하지 않는다.
- 정상 Production과 공명 기준 배포를 삭제·취소·덮어쓰기·승격하지 않는다. 새 Preview가 해당 코드/QA를 통과하기 전 main에 제품 변경을 반영하지 않는다. Production 갱신은 승인된 범위의 검증된 변경만 expected-HEAD/비강제로 반영하고 기존 Git Integration을 사용한다. 공명 브랜치 수정·병합 금지 등 기존 범위 제한은 배포 정리만을 이유로 해제하지 않는다.
- 제한 응답은 실제 오류 코드/시각, Retry-After 또는 제공자 재시도 안내를 기록하고 **같은 실행에서 재배포·반복 재시도하지 않는다**. 재조회로 재시도 시각을 갱신하거나 실패 시각마다 무조건 24시간을 더하지 않는다. 절대 해제 시각을 확인하지 못하면 확인 불가로 적는다. 제한 해제를 명분으로 프로젝트를 추가하거나 API/CLI 수동 배포로 우회하지 않는다.
- 화면·모션을 변경하면 사용자가 열 수 있는 **실제 해당 SHA의 Preview URL**을 반드시 제공한다. 로컬 캡처, Production URL, 브랜치 별칭, 과거 READY URL을 새 Preview처럼 제시하지 않는다. 상태·환경·코드 SHA와 함께 URL을 확인한다. 제한/실패로 새 Preview가 없으면 링크를 지어내지 않고 “새 Preview 미생성, 시각 검증/완료 차단”을 명시한다.
- Ignored Build Step은 배포 생성 전 차단과 다르다. Vercel 공식 문서상 이 단계에서 취소된 빌드도 배포/동시 빌드 한도에 포함된다. 이 설정만으로 배포 횟수가 0이 된다고 보고하지 않는다. 교차 프로젝트 차단이 필요하면 실제 Root Directory와 각 브랜치의 `git.deploymentEnabled` 적용 위치를 확인한 뒤, 허용된 범위의 배포 설정만 변경한다.

## 실행 순서

1. 최신 원격 HEAD, 유효한 작업 잠금/소유 기록, 로컬 변경과 대상 프로젝트를 확인한다. 다른 실행의 잠금은 시간만으로 해제하지 않는다.
2. 기존 기능과 원본 데이터·에셋을 보존하며 최소 수정하고 관련 QA를 완료한다. UI 변경은 실제 렌더/상호작용도 검증한다. 브라우저를 사용하지 않은 검사를 실기기/시각/청취 완료로 표시하지 않는다.
3. A/B 코드·에셋·설정·유지 문서/QA만 명시적으로 검토·stage한다. 산출물은 자동 포함하지 않는다. 사용자 변경을 삭제하거나 reset/clean/force push하지 않는다.
4. 코드와 종료 문서/가능한 잠금 해제를 함께 commit하고 해당 작업 브랜치에 expected-HEAD로 Push한다. 같은 실행에서 Push/배포를 반복해 진척을 만들지 않는다.
5. Git 상태와 지정 프로젝트의 SHA별 자동 배포를 조회한다. 진행 중이면 그 배포를 관찰하고, READY면 그 URL에서 관련 QA를 수행한다. ERROR/제한이면 실제 근거와 남은 작업을 기록한다.
6. 화면/모션 변경은 실제 Preview URL·SHA·상태·검증 범위를 사용자에게 제공한다. 새 Preview가 없으면 화면 변경 완료로 보고하지 않는다.
7. 승인된 검증 변경만 main에 비강제 반영한다. Production 갱신도 Git Integration의 해당 SHA/READY/실제 에셋과 핵심 기능을 확인한다. 같은 SHA/환경의 기존 배포를 다시 만들지 않는다.

## 지정 프로젝트와 보존 기준

| 코드 | Git 작업 브랜치 | Vercel 검증 프로젝트 | 보존할 정상 기준 |
| --- | --- | --- | --- |
| React 통합 | feature/figma-v2-integration | ieum-v2-react · prj_eowHNSo22vKNulK4a2LFYzQnAYj1 | Production dpl_9sGWvYNzFnb22ZRhGkdVG59RaWET · a6d67991ec6791ae7414625c06ccb85b57768207 · https://ieum-v2-react.vercel.app |
| 공명 독립 실행본 | feature/resonance-standalone | ieum-resonance-preview · prj_pnjQh8vGC6lBamfOlLlXlfXz8AzS | dpl_2uY9VpVd2G2u2VuQ2k3quUHRNN1d · b33cff0ef987a876ff2e47e032ea9ce169f1f7d0 · https://ieum-resonance-preview-7n6w4bedx-junes-lie.vercel.app |

Team: team_9FqAIbX8fzhbTX2t9mLWiGDr. 위 배포는 2026-10-22 실제 READY 조회 기준이며 새 코드의 검증 URL이 아니다. 공명 프로젝트 이름의 “preview”와 Vercel 환경 필드(target)는 다르다. 보존 기준 공명 배포의 실제 target은 production이며 이를 새 Preview로 부르거나 환경을 임의 전환하지 않는다.

## 현재 설정의 확인된 한계

두 프로젝트 모두 같은 GitHub 저장소에 연결돼 있다. React e1812f0 커밋이 공명 프로젝트에도 Git 자동 배포 dpl_3FsaekVvi6Gun7foEkn9vSFmeBW7를 만들었으며, main/통합 브랜치에 resonance-standalone Root Directory가 없어 NOW_SANDBOX_WORKER_ROOTDIR_NOT_EXIST로 실패했다. 이는 API 수동 중복 생성과 다른 “교차 프로젝트 자동 트리거”다.

현재 React ignoreCommand의 공명 프로젝트 guard는 해당 폴더 검증보다 늦게 실행될 수 있어 이 문제의 완전한 예방책이 아니다. 브랜치별 Git 트리거 설정 수정은 아직 적용하지 않았다. 공명 브랜치 수정 금지 지시를 유지하며, 해당 브랜치의 배포 설정 파일 변경 범위는 사용자에게 확인한 뒤 수행한다. 연결을 끊거나 Preview 전체를 비활성화하거나 기준 배포를 삭제하는 방식으로 우회하지 않는다.

## 교차 트리거 차단 변경안 · 아직 미적용

사용자 확인이 필요한 변경은 앱/공명 소스가 아니라 아래 배포 설정 3곳뿐이다. Root Directory·기존 buildCommand/outputDirectory·도메인·기준 배포는 유지한다.

| 브랜치 | 경로 | 제안 설정 |
| --- | --- | --- |
| main / 통합 | resonance-standalone/vercel.json (배포 메타데이터만) | git.deploymentEnabled=false. React Push가 공명 프로젝트의 새 배포를 시작하지 않도록 함. 공명 소스/렌더러를 main에 가져오지 않음. |
| feature/resonance-standalone | vercel.json | git.deploymentEnabled=false 추가. 이 브랜치가 루트 React 프로젝트로 자동 배포되지 않게 함. |
| feature/resonance-standalone | resonance-standalone/vercel.json | 기존 빌드 설정 유지, git.deploymentEnabled={"**":false,"feature/resonance-standalone":true} 추가. 지정 공명 브랜치 자동 배포만 허용. |

설정 적용 뒤 기존 SHA의 배포를 테스트 목적으로 새로 만들지 않는다. 다음 승인된 실제 코드 Push의 Git 상태와 두 프로젝트 배포 목록으로 라우팅 효과를 확인한다. 허용된 프로젝트의 자동 Preview는 계속 유지한다.

## 공식 근거

- https://vercel.com/docs/git/vercel-for-github — 작업 브랜치 Git 자동 Preview.
- https://vercel.com/docs/project-configuration/git-configuration — git.deploymentEnabled의 브랜치별 배포 트리거 설정.
- https://vercel.com/docs/monorepos#ignoring-the-build-step — Ignored Build Step 취소도 배포/동시 빌드 한도에 포함.

## QA 산출물 보존

.gitignore는 C 이미지 26개, 결과 JSON 3개와 현재 앱/유지 QA가 사용하지 않는 로컬 스크립트 2개의 정확한 경로만 제외한다. public/figma/ 또는 qa/ 전체는 제외하지 않는다.

이미 추적 중인 산출물은 ignore만으로 추적이 해제되지 않는다. 필요한 경우 `git rm --cached -- <개별 경로>`로 index에서만 제외하고 로컬 파일은 보존한다. 해당 제거 역시 staged diff에서 확인한다.

`qa/create-resonance-comparison.mjs`는 과거 로컬 비교 이미지 생성기이고 `qa/verify-figma-design.mjs`는 제거된 별도 Figma 시연 화면을 대상으로 한다. 두 파일은 삭제하지 않고 로컬 참고 자료로 보관한다. `qa/verify-user-journey.mjs`는 유지 대상으로, 현재 Flow에 맞게 검토해야 한다.

## 완료 보고

변경/QA/Push, 프로젝트·환경·정확한 SHA·실제 배포 상태·Preview URL, 기존 Production/공명 기준 보존 여부, 남은 차단을 실제 결과로만 보고한다. 문서/설정만 변경했다면 그렇게 명시하고 화면이나 모션 개발 진척으로 보고하지 않는다. 새 기능/레이아웃/정책을 임의로 만들지 않으며 불명확한 개념은 변경 전에 질문한다.
