# IEUM V2 통합 체크포인트 · 2026-10-23

## 완료
- 최신 원격 6316800에서 재개했다. 사용자 정정에 따라 P0 Figma 충실도·간격·정렬을 서버/인증 진단보다 우선한다. 전용 Remote 도구로 Home1349:21126·Detail1713:43254·Workspace1571:41074·Recording1754:45723·Search1396:30802 및1377:23033 원본 코드/구조/스크린샷을 읽었다. Figma/Notion은 수정하지 않았다.
- Home 헤더62→72, 로고 y25·프로필44px y14, 비대칭 Intro x=59.07%·280px 묶음과80+12+44 간격을 복구했다. Search 제목 x24/y24·입력 y74·탭142·요약260·결과296을 복구했다(390은20px gutter).
- Detail 공명 제목+시각화 / 해석+근거를 별도 부모로 묶어 내부0/16·그룹 사이24px을 구분했다. 데모96%/92%를 유지하면서36/40 Cormorant로 복구했다. 실제 Profile의 비교 문구에는 예시 숫자 스타일을 적용하지 않는다. 같은 곡 카드84px·내용 기준 폭·마지막 생성 카드를 보존한다.
- Workspace152.2px 파트 카드·104.2px 내 Part 패널은 Figma의0.6px 내부 선이 브라우저 border 반올림으로 레이아웃을 늘리지 않도록 처리했다. 레코드 장면378px과 기존80px Current Mix를 분리했다. 390 소수점 위치에서 seek 포커스 마지막 한 줄이 clock 캡처에 닿는 회귀를 재현해 28px 시각 seek 안쪽27px에만 표시했다.44px hit target·48px Player·inset64/clock30은 유지한다.
- Recording 가이드 볼륨을 가사 부모에서 분리해 화면 중간·오른쪽16px, 원본 아트 좌표(0,232)/430×700과350px 녹음 패널·하단20px/Safe Area를 복구했다. Review 폭과 기존 녹음 상태·가사·반주·가이드 동작은 보존한다.
- Node 전체 QA/build 통과. qa/verify-figma-spacing-browser.mjs로390/430 다섯 화면10개 좌표·원본 그룹·줄 높이·스크린샷을 검수했다. 기존 native 합성 마이크 짧은 녹음→Tenor 직접 제출→재생/탐색/토글→원본 bytes/hash 불변 및 focus/blur clock PNG 동일도 두 폭에서 통과했다. 기존 Quartet은1/4이며 실제 네 사람의 완료가 아니다.
- 오늘 같은 날·기존4Part/참여자·원본 Track·AI3곡·저장 데이터·공명·프로필 등록 완료 데모96%/92% 및 실제 Profile 분기를 보존했다. main·공명 독립 브랜치·Vercel Production·원본 에셋/데이터는 변경하지 않았다.

## 미완료
- overallProductAcceptance=false. 다섯 화면의 이번 좌표/그룹 검증을 전체 상태·모든 에셋·공명 조형/모션의 완전한 픽셀 일치로 확대하지 않는다. Figma430 원본과 실제 한국어 곡명/미제출 상태는 내용과 높이가 다르며390은 반응형 검수다. 기존 승인 하단 내비게이션을 Search의 과거 단순 아이콘으로 교체하지 않는다.
- 이 커밋의 Pages 자동 build/deploy·공개 build-info·실제 JS/CSS 해시·390/430 화면 재검증은 Push 뒤 종료 근거와 대조한다. 수동/중복 배포하지 않는다.
- 기존430 녹음 시작20초 대기 실패·길이 편차·장시간 부하, 실제 인증/공유 세션/App remote 바인딩, 기존4인 실제 전체 제출/완성, 물리 마이크/기기/이어폰·서버AI·다중사용자 인수는 미완료다. 준비 상태 capability를 true로 바꾸거나 가짜 Track/4/4/완성곡을 만들지 않는다.

## 다음 시작점
- 최신 원격 HEAD·소유 잠금·활성 프로세스·종료 근거를 대조한다. P0의 나머지 화면 상태별 이미지 크롭/에셋·타이포·공명 비교를 이어가며 이번에 통과한 그룹/좌표를 회귀 근거 없이 다시 구현하지 않는다.
- 작업 /workspace/scratch/cad8a99a0a38/ieum-focus, 근거 /tmp/ieum-fidelity-* 및 qa/verify-figma-spacing-browser.mjs. 관련 코드와 이 체크포인트를 한 번 expected-HEAD Push한다. 다른 소유 잠금은 건드리지 않으며 자기 interactive-fidelity-cad8a99a0a38만 완료 기록으로 보존·해제한다.
