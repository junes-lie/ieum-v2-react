# IEUM V2 통합 체크포인트 · 2026-10-23

## 완료
- 최신 기준 원격 cc85176. 〈오늘 같은 날〉·기존 Song/Project/4-Part/참여자/원본 Track·AI 3곡·저장 데이터·공명을 보존한다. 프로필 등록 완료 데모의 음역/음색/선호와 Part Fit 96%·조화 92% 예시는 유지하며 실제 직접 등록 Profile과 분리한다.
- 이전 검수: Search 결과 종류별 표현·상세 carousel 공명·불필요 조작 제거·Workspace 토글의 실제 Current Mix 반영·OPEN 진입·탭 문맥·최상단/Back/검색 복귀·직접 Profile 등록/복원 통과. Review 최초 저장과 디코딩 중첩 및 저장 후 Back은 7ef54cb에서 수정했다. 회귀 근거 없이 반복 구현하지 않는다.
- cc85176에서 Workspace 1571:41074/1623:41443의 기존 금속 Player를 원위치로 복구. 48px 버튼·24+8+48=80px 그룹·seek inset64·clock30을 유지한다. Pages Actions39877531721 build/deploy success, 공개 build-info와 실제 번들 SHA256 b4cdd42dd43a 일치를 확인했다.
- 이번 수정: native seek 44px 전체의 포커스 테두리가 clock을 덮는 것을 390 브라우저의 focus/blur clock PNG 불일치로 재현했다. 44px 터치 영역은 유지하고, 포커스 테두리만 Figma 28px seek 영역 안에 그린다. 390/430에서 clock PNG가 focus/blur 간 byte 동일, 테두리 표시/해제·80px 그룹/44px target·키보드 재생/탐색·직접 Tenor 제출·Mix 토글·원본 bytes/hash 불변·200% 텍스트 검사 및 Node 전체 QA/build 통과. 원래 Quartet은 1/4 미완성이다.
- 기존 22초 음악 A/B/가사/pause/resume/Review/제출/브라우저 Auto Mix/완성곡은 격리 2-Part QA다. 서로 다른 native 원본의 2/3/4 Track DSP 검사도 믹싱 엔진 범위이며 실제 네 사람의 협업 완료가 아니다. 부하 readback의 390/430 원본은 각22.019977초였으나 간헐 편차 해결 근거가 아니다.

## 미완료
- overallProductAcceptance=false. 기존 네 참여자의 실제 전체 직접 녹음·제출→4/4 Auto Mix→완성곡, 장시간 부하·MediaRecorder/오디오 시계와 원본 길이의 간헐 편차는 미완료다. 가짜 제출/Track/완성곡을 주입하지 않는다.
- 2026-10-23 10:04 KST 기존 cc85176 Vercel 자동 Preview의 GET /api/capabilities는 HTTP200이지만 mode=preparation, sharedProjects=false, authenticated=false, aiVoiceLayers=false였다. api/capabilities.js도 이 준비 상태를 명시한다. App은 기존 local 모드이며 실제 인증·공유 세션·전체 remote source 바인딩 인수가 남았다. 표시만 remote/true로 바꾸지 않으며 Production·환경·Notion/Figma는 변경하지 않았다.
- Figma 전체 픽셀·공명 조형/모션, 물리 마이크·기기·이어폰 청취·서버·실제 다중 사용자 인수는 미완료. Figma 전용 Remote inline screenshot으로 원본 비교가 가능하다. 실제 종합 매칭 % 산식/가중치는 Notion 미확정이므로 사용자 승인 데모 %와 구분한다.
- 기존 qa:drafts의 Windows 전용 Playwright 경로는 Linux 시작 차단이다. 이를 통과로 표시하지 않으며 관련 저장/Review 복구는 휴대 가능한 별도 브라우저 QA로 검증했다.

## 다음 시작점
- 최신 원격 HEAD·소유 잠금·실행 프로세스를 먼저 대조한다. 이번 포커스 수정의 기존 Pages 자동 build/deploy·공개 build-info/실제 번들 해시·390/430 focus/blur PNG 및 제출/토글 결과는 종료 기록과 대조한다. 자기 잠금만 해제한다.
- 다음 미완료는 준비 상태 서버와 App의 실제 인증/공유 연결 경계 진단, 간헐 길이 편차 재현, 전체 Figma/공명 및 물리/실사용 인수다. 기존 원본·사용자 데이터와 데모를 유지하고 기능 성공을 실제 네 사용자 완료로 확대하지 않는다.
- 기존 작업 폴더의 공통 Git 디렉터리가 사라져 파일은 보존했다. 현재 최신 원격의 독립 체크아웃은 /workspace/scratch/cad8a99a0a38/ieum-focus, 소유 잠금은 그 .git/ieum-integration-owner다. QA 근거는 /tmp/ieum-focus-*와 qa/captures/2026-10-23-seek-focus에 둔다. 기존 브랜치만 expected-HEAD로 한 번 Push하며 main·공명 브랜치·Vercel Production은 보존한다.
