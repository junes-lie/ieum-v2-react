# AGENTS.md — IEUM / 이음

## 0. 역할

이 파일은 IEUM 프로젝트에서 Codex가 새 작업을 시작할 때마다 따라야 하는 영구 작업 규칙이다.

이 파일은 IA/PRD/디자인 명세를 복제하지 않는다.

제품 내용은 Notion,
시각 디자인은 Figma,
구현 상태는 현재 Git repository를 기준으로 한다.

이전 Codex 채팅의 기억에 의존하지 않는다.


# 1. Source of Truth

## 제품 / UX / 정책

Notion이 제품 기획의 Single Source of Truth다.

구현 전에 작업과 관련된 최신 문서를 Notion 전용 Connector/Plugin으로 확인한다.

예:
- IA
- PRD
- Project
- Screen Spec 또는 현재 화면 명세
- Design Decisions
- 기타 해당 기능에 직접 관련된 최신 문서

오래된 로컬 문서나 이전 채팅 내용을
현재 Notion보다 우선하지 않는다.


## Visual Design

Figma가 Visual Source of Truth다.

Figma 읽기는 반드시:

figma-desktop
http://127.0.0.1:3845/mcp

를 사용한다.

주요 도구:
- get_design_context
- get_screenshot
- get_metadata
- get_variable_defs
- get_motion_context (필요한 경우)

Visual fidelity가 필요한 구현에서는
get_design_context와 get_screenshot을 함께 사용한다.


## Code

현재 Git repository가 구현 상태의 Source of Truth다.

기존 구현을 먼저 읽은 뒤 수정한다.

작동하는 기능을 이유 없이 다시 구현하거나
별도 버전을 중복 생성하지 않는다.


## Git

변경 이력의 영구 Source of Truth는 GitHub main이다.

로컬 작업 중에는 로컬이 일시적으로 더 최신일 수 있다.


## Deployment

Vercel은 배포 결과물이다.

Vercel을 코드 Source of Truth로 사용하지 않는다.


## Repository Document Roles

### Active project documents

현재 구현 작업에서 우선 사용하는 repository 문서:

- `AGENTS.md`
  - Codex 영구 작업 규칙

- `CURRENT_IMPLEMENTATION_STATUS.md`
  - 현재 구현 상태

- `docs/IMPLEMENTATION_PLAN_2026-10-07.md`
  - 현재 단계 구현 계획

- `docs/GIT_WORKFLOW.md`
  - Git / GitHub / Vercel 작업 규칙

- `docs/SERVICE_CONNECTION.md`
  - 외부 서비스 연결 및 도구 정책

### Historical / reference documents

다음 자료는 현재 제품 요구사항의 Source of Truth가 아니다.

- `REQUIREMENTS_LEDGER_ATOMIC.csv`
- `REQUIREMENTS_TRACEABILITY.md`
- 날짜가 지난 execution report
- verification report
- audit report
- 이전 prototype 기준 문서

Historical/reference 문서의 내용이
현재 Notion, Figma 또는 Active project documents와 충돌하면
이를 근거로 현재 구현을 변경하지 않는다.


# 2. 구현 전 필수 확인

기능 또는 화면 구현 요청을 받으면
바로 코드를 수정하지 않는다.

관련 범위에 대해 먼저:

1. Notion 최신 기획 확인
2. Figma 최신 디자인 확인
3. 현재 React 구현 확인
4. git status 확인

후 다음 세 가지를 비교한다.

- Intended Product Behavior
- Intended Visual Design
- Current Implementation

그 후 필요한 최소 범위만 수정한다.

사용자가 이미 Source of Truth에 저장한 정보를
다시 설명하도록 요구하지 않는다.


# 3. Computer Use — 전면 금지

이 프로젝트에서는 Computer Use를 사용하지 않는다.

금지:

- Computer Use로 Notion 읽기
- Computer Use로 Notion 수정
- Computer Use로 Figma 읽기
- Computer Use로 Figma 수정
- 브라우저 화면을 직접 조작해서 Source of Truth 확인
- MCP/Connector 실패 시 Computer Use로 우회
- 화면을 눈으로 읽은 결과를 구조화된 원본 데이터처럼 취급

전용 도구가 실패하면
Computer Use로 우회하지 말고 실제 실패를 보고한다.


# 4. Notion Tool Policy

Notion은 Notion 전용 Connector / Plugin 도구만 사용한다.

Notion tool이 현재 Codex task에 로드되지 않았거나
codex_apps MCP가 실패한 경우:

1. Computer Use 금지
2. Notion 웹 UI 직접 접근 금지
3. Notion을 읽었다고 주장 금지
4. 실제 Connector/MCP 오류를 보고
5. 확인하지 못한 최신 정책을 추측하지 않음

Notion 연결 실패를 이유로
과거 문서나 이전 채팅 내용을 최신 기획으로 간주하지 않는다.


# 5. Figma Tool Policy

Figma 읽기는 figma-desktop MCP만 사용한다.

사용:

figma-desktop
http://127.0.0.1:3845/mcp

사용하지 않음:

Remote Figma MCP
https://mcp.figma.com/mcp

사용 우선순위:

1. get_design_context
2. get_screenshot
3. get_metadata
4. get_variable_defs
5. get_motion_context

Figma Desktop MCP가 실패하면
Computer Use 또는 Remote Figma로 임의 우회하지 않는다.

실패 사실을 보고한다.


# 6. 제품 변경 금지

Codex의 역할은 확정된 제품을 구현하는 것이다.

사용자 승인 없이 다음을 하지 않는다.

- 기능 추가
- 기능 삭제
- IA 변경
- 핵심 User Flow 변경
- 정책 변경
- 폐기된 UX 복구
- 화면 임의 추가/분리
- 서비스 성격 재해석

구현 과정에서 제품 정책 변경이 필요해 보이면
코드를 먼저 바꾸지 말고 충돌을 보고한다.


# 7. Visual Fidelity

Figma 디자인 구현 요청에서는
Codex 방식으로 디자인을 재해석하지 않는다.

가능한 한 정확히 유지:

- 전체 silhouette
- 콘텐츠 폭
- x/y 위치 관계
- spacing
- vertical rhythm
- typography hierarchy
- font family
- weight
- size
- line-height
- tracking
- component dimensions
- alignment
- border/divider
- surface hierarchy
- background
- opacity
- graphic size/position
- image crop
- navigation state
- interaction/motion intent

Figma에 없는:

- generic AI UI
- 과도한 glow
- neon
- 임의 gradient
- 과도한 radius
- 임의 decorative card

를 추가하지 않는다.


# 7.1 관계별 묶음과 간격 — 구현 필수

- Auto Layout을 켜거나 Flex/Grid를 선언하는 것 자체를 레이아웃 정리로 간주하지 않는다. 먼저 요소의 의미, 함께 움직일 범위, 정렬 대상과 각 간격을 제어할 부모를 정한다.
- 같은 부모의 gap은 그 부모의 직접 자식 사이에만 적용한다. 묶음 내부와 묶음 사이에 다른 간격이 필요하면 의도적인 중첩 Frame/DOM을 유지한다. 중첩이라는 이유, 자식 수가 적다는 이유, 한 겹 줄일 수 있다는 이유만으로 평탄화하지 않는다.
- 예: 녹음 패널의 상태 표시와 조작 묶음 사이 간격은 바깥 부모가, 볼륨과 녹음 버튼 사이 간격은 안쪽 부모가 따로 관리한다. 실제 값은 최신 승인 디자인과 기존 간격 토큰에서 선택한다. 모든 화면에 같은 수치나 같은 gap을 강제하지 않는다.
- 프레임을 제거하기 전에 독립적인 간격·패딩·정렬·배경·스크롤·좌표계·반응형 역할이 있는지 확인한다. 이 역할을 잃지 않고 시각적 관계가 유지됨을 확인할 수 있을 때만 불필요한 래퍼로 판단한다.
- Auto Layout/Flex/Grid는 콘텐츠의 순서·줄바꿈·동반 이동을 제어할 때 사용한다. 레코드·장면의 겹침, 진행 바 위 핸들, 고정 규격 조작부 내부 등 좌표와 겹침이 의미를 갖는 영역에는 필요한 범위만 자유 배치/position을 사용한다. 반대로 일반 텍스트와 목록을 절대좌표로 고정하지 않는다.
- Hug/자동 높이는 내용 묶음에, Fill/유동 폭은 남은 공간을 사용하는 요소에, Fixed/고정 크기는 버튼·핸들·미디어 비율·검수 뷰포트 등 규격에 근거가 있는 곳에 사용한다. 일괄 Hug/Fill/Fixed 변환을 금지한다.
- 버튼과 재생 바의 중심 정렬은 두 요소 자체의 중심을 비교한다. 바와 시간 문구 전체의 중심을 버튼에 맞추지 않는다. 위치를 맞추기 위한 빈 프레임·큰 패딩·최소 높이·Space Between으로 구조 문제를 숨기지 않는다.
- 사용자 수동 변경은 먼저 읽고 유지한다. 별도 간격을 제어하려고 만든 묶음을 임의로 삭제하거나 승인된 공간의 리듬을 동일 간격으로 덮어쓰지 않는다.
- React/CSS 구현은 승인된 의미 묶음을 컴포넌트와 DOM 구조로 옮긴다. 필요한 중첩은 유지하고, 모든 div를 flex로 만들거나 전역 gap/space-y/자식 margin 선택자로 서로 다른 관계를 한꺼번에 통일하지 않는다. 이미지·캔버스·핸들의 position은 해당 영역의 좌표계 안으로 제한한다.
- 제출 전 수정 전후의 간격·정렬·전체 높이를 확인한다. 내용 증가·폭 변경은 해당 변경에 위험이 있을 때 확인하고, 고정 조작의 중심과 스크롤/하단 고정도 관련 범위에서 검수한다. Auto Layout/Hug 적용 여부나 인스턴스 연결 확인만으로 전체 검수 완료라고 보고하지 않는다.

# 8. Resonance Record

Resonance Record 관련 작업에서는
항상 현재 Notion/Figma의 최신 결정을 우선한다.

별도 변경 지시가 없다면:

- 4분할/pie-slice 표현 금지
- 자연스럽게 섞이는 구조 유지
- 곡선 기반 흐름 유지
- 연속적인 flow 유지
- 입자/공명 표현 유지
- motion 요구가 있는 경우 static image로 대체 금지

과거 Resonance 구현이 최신 Figma와 충돌하면
최신 Figma를 우선한다.


# 9. Scope Control

수정 전에 기존 관련 코드를 읽는다.

가능하면 기존 동작을 유지하면서
필요한 최소 변경만 한다.

금지:

- 관련 없는 대규모 refactor
- 같은 화면의 중복 구현
- 별도 임시 앱 생성
- 불필요한 prototype 폴더 생성
- 기존 production component와 경쟁하는 새 버전 생성

진단용 산출물을 production 구조에 남기지 않는다.


# 10. Git Safety

작업 시작 시 확인:

- current branch
- git status
- tracked modifications
- untracked files
- 필요 시 local ↔ origin/main ahead/behind

사용자 작업을 절대 임의 삭제하지 않는다.

사용자 명시 승인 없이 금지:

- git reset --hard
- 변경사항을 없애는 checkout
- 변경사항을 없애는 restore
- git clean
- force push

Untracked 파일도 임의로 불필요하다고 판단하지 않는다.


# 11. Git Staging

working tree에 QA 산출물이 섞여 있을 경우
무조건 git add . 을 먼저 실행하지 않는다.

먼저 구분:

A. 앱 코드 / asset / config
B. 유지할 문서 / 자동 QA
C. 일회성 screenshot / comparison / result

현재 코드에서 참조되지 않는다는 사실만으로
Figma 원본 자산, 디자인 reference, 향후 구현 예정 asset을
불필요하거나 삭제 가능한 파일로 판단하지 않는다.

특히 `public/figma/`의 자산은 현재 화면의 runtime reference 여부와 별개로
향후 Figma 디자인 구현에 필요한 원본 자산일 수 있으므로,
사용자의 명시적 승인 없이 삭제하거나 Git tracking에서 제거하지 않는다.

일회성 QA 결과는 필요하면
좁은 .gitignore 규칙으로 제외한다.

다음 전체 폴더를 무작정 ignore하지 않는다:

qa/
public/figma/

필수 테스트와 asset이 존재할 수 있기 때문이다.


# 12. 표준 구현 → 배포 프로세스

기본 순서는 반드시:

Notion 확인
↓
Figma 확인
↓
현재 코드 + Git 상태 확인
↓
코드 수정
↓
로컬 테스트
↓
UI 변경이면 실제 렌더 결과 확인
↓
Figma와 비교
↓
git diff 검토
↓
commit
↓
push origin/main
↓
Vercel Git Integration 자동배포
↓
Production QA


# 13. Vercel Policy

정상 배포 경로:

Codex 수정
→ 테스트
→ commit
→ GitHub push
→ Vercel 자동배포

commit/push하지 않은 로컬 코드를
Vercel production에 직접 배포하는 것을
기본 작업 방식으로 사용하지 않는다.

Vercel 자동배포가 실패하면
먼저 Git Integration 문제를 진단한다.

수동 Production Deploy로 조용히 우회하지 않는다.


# 14. QA

코드를 작성했다는 이유만으로 완료 처리하지 않는다.

관련 작업에 따라 확인:

- production build
- import/runtime error
- 필요한 asset
- 관련 자동 QA
- 핵심 User Flow
- 실제 UI 렌더
- Figma와의 visual difference
- console error

오래된 QA가 현재 기획과 충돌하면
현재 구현을 옛 QA에 맞춰 되돌리지 않는다.

먼저 QA가 stale인지 확인하고
필요하면 현재 요구사항에 맞게 QA를 수정한다.


# 15. Temporary QA Artifacts

일회성:

- screenshots
- comparison crops
- motion captures
- test result JSON
- temporary visual diff files

등을 자동으로 Git에 포함하지 않는다.

재사용 가능한 QA script는 유지할 수 있다.


## 화면 캡처 전달 · 사용자 지시 2026-10-21

UI QA 결과를 전달할 때 `npm run qa:capture`로 전체 진입 화면의 갤러리를 생성한다. 기본 출력 `qa/captures/<실행 시각>/`을 사용하고, 대상 버전을 명시한 독립 `index.html`과 PNG/manifest가 포함된 ZIP을 사용자에게 제공한다. 임시 폴더 경로만 안내하며 종료하지 않는다. 실제 실행 대상과 미배포 코드 버전을 혼동하지 않으며, 캡처하지 못한 화면은 실패로 표시한다. 생성 이미지는 Git에 자동 추가하지 않는다. 자세한 설정은 `qa/README.md`를 따른다.

# 16. 완료 보고 규칙

실제로 확인하지 않은 것을:

- 완료
- 수정됨
- 반영됨
- 동기화됨
- 배포됨

이라고 말하지 않는다.

완료 보고에는 필요한 경우 다음만 간결하게 포함:

- 변경 내용
- 검증 결과
- build/test 결과
- Git commit/push 상태
- Vercel 배포 상태
- 남은 blocker


# 17. Tool Failure

도구 실패는 다른 약한 방법으로 우회할 권한을 의미하지 않는다.

Notion 실패
→ Notion 확인이 필요한 정책을 추측하지 않는다.

Figma 실패
→ 정확한 디자인 구현을 임의 디자인으로 대체하지 않는다.

MCP 실패
→ Computer Use로 대체하지 않는다.

오류를 실제 메시지와 함께 보고하고
해당 의존성이 필요 없는 작업만 계속할 수 있다.


# 18. New Codex Task

새 Codex 작업은 이전 대화 기억에 의존하지 않는다.

새 작업 시작 시:

1. AGENTS.md 확인
2. git status 확인
3. 작업에 필요한 Notion 확인
4. 작업에 필요한 Figma 확인
5. 현재 코드 확인
6. 실제 repo 상태에서 작업 재개

이전 Codex 대화를 사용자가 다시 설명하도록 요구하지 않는다.

중요:

AGENTS.md는 작업 규칙을 유지한다.

MCP/plugin의 실제 runtime 연결을 생성하거나
고장 난 MCP를 복구하는 파일은 아니다.

도구가 로드되지 않았다면
Tool Failure 규칙을 따른다.


# 19. 우선순위

충돌 시 우선순위:

1. 사용자의 현재 명시적 지시
2. 현재 Notion의 확정 제품 요구사항
3. 현재 Figma의 확정 Visual Design
4. AGENTS.md
5. 현재 코드 구현
6. Archive / 과거 로컬 문서
7. 이전 Chat/Codex 대화의 추정

오래된 구현이나 과거 대화가
최신 확정사항을 덮어쓰지 않도록 한다.

# 20. 단계 진행 및 Git 작업 규칙

- 단계별 완료 조건과 검증 근거를 확인한 뒤 다음 단계로 진행한다.
- Git 작업은 [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md)도 함께 준수한다.
