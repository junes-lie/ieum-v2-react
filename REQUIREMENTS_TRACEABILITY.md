# IEUM V2 요구사항 추적 원장 — 폐기된 요약본

> 이 파일의 과거 `DONE` 판정은 단계별 구현 문서의 0단계 통과 조건을 충족하지 못했다. 수십 개 기능 묶음만 사용해 네 문서의 문장·표·목록을 누락했으므로 완료 근거로 사용하지 않는다. 원자 요구사항 원본은 [REQUIREMENTS_LEDGER_ATOMIC.csv](./REQUIREMENTS_LEDGER_ATOMIC.csv), 현재 단계 판정은 [CURRENT_IMPLEMENTATION_STATUS.md](./CURRENT_IMPLEMENTATION_STATUS.md)를 기준으로 한다.

Source of Truth는 2026-09-27에 수정된 Notion `IA — IEUM Record V2`, `PRD — IEUM Record V2`, `PROJECT.MD`, `DESIGN_SYSTEM.md`와 기준 이미지다. 이 파일은 자동 테스트 개수를 완료 근거로 사용하지 않는다.

## 판정

- `DONE`: 코드, 화면, 저장 데이터와 실제 클릭 검증이 모두 존재
- `PARTIAL`: 일부 구현 또는 자동 환경에서만 확인
- `MISSING`: 구현 없음
- `BLOCKED`: 외부 자산·기기·기술 조건이 필요
- `OUT`: 문서가 명시한 V2 제외 범위

## 문서 전수 범위

| 문서 | 전수 대조 단위 | 현재 상태 |
|---|---|---|
| IA | 1–15장, Primary Navigation, Core/Supporting Flow, 모든 Project/Part/Track 상태와 Scope Boundary | 진행 중 |
| PRD | 1–32장, 모든 기능·정책·상태·오디오·Resonance·개인 영역·V2 범위 | 진행 중 |
| PROJECT.MD | 결정 1–6, 최종 UX 기획안, P0·필수·제외·남은 검증 | 진행 중 |
| DESIGN_SYSTEM.md | Foundation, Token, Type, Layout, Component, Record, Motion, Responsive, Accessibility | 진행 중 |
| 기준 이미지 | 세 화면의 구성·비율·밀도·Record 물성·Row·CTA·Sleeve | 진행 중 |

## 구현 묶음

| ID | 요구사항 묶음 | 판정 | 증거/남은 일 |
|---|---|---|---|
| IA-01 | Opening Signature → Home | MISSING | Brand Motion 구현 필요 |
| IA-02 | Home Embedded Demo·검색·For You·모집·최근·완성 | PARTIAL | 검색·섹션·완성 상태 연결, Opening Signature 남음 |
| IA-03 | Song → 여러 Project → 2–4 Part | PARTIAL | 계층 UI 있음, 비대표 Project 실제 상태 필요 |
| IA-04 | New Project 01C→01D→03A | DONE | 곡→2–4 Part/Key→0/N 생성, My Projects 저장을 실제 클릭 확인 |
| IA-05 | Voice Setup VP01–VP06 후 Part Fit 복귀 | PARTIAL | A/B/C 선택·완료 요약 구현 중 |
| IA-06 | Complete Gate·Filter·Sort·Explainable Match | PARTIAL | 실제 계산/동작 구현 중 |
| IA-07 | Match Detail와 Other Vocal Profile 분리 | DONE | Project Match와 1:1 Profile을 별도 화면·데이터로 분리 |
| IA-08 | 모든 타인 프로필·이름 옆 저장·history Back | PARTIAL | 후보/참여자/Multitrack/Credits 연결, 브라우저 Back 확인; 전체 복귀 위치 추가 확인 필요 |
| IA-09 | Multi-invite Single-seat 상태 | PARTIAL | 단일 시연 상태만 존재, 다중 상태 필요 |
| IA-10 | Workspace의 Key·완주 가능·초대·다음 행동 | DONE | 현재 Key·완주 가능·Track 상태·다음 CTA 연결 |
| IA-11 | Recording Guide·Lyrics·Count-in·Meter·Noise·Review | PARTIAL | 공통 Timeline·소음 경고·실제 backing 필요 |
| IA-12 | 독립 Track·Sync·처리 상태 | PARTIAL | 원본 저장됨, 실제 정렬 알고리즘 필요 |
| IA-13 | 첫 Track부터 Multitrack·개별/복수/전체 듣기 | DONE | Track 개별 재생, 포함/제외, Current Mix 연결 |
| IA-14 | 마지막 제출 즉시 Auto Mix | PARTIAL | 자동 Trigger와 offset·gate·RMS·EQ·compressor·limiter 구현, 실기기 입력 미검증 |
| IA-15 | Complete Motion·Player·Credits·Profile·Share | PARTIAL | 전체 프로필·Signature 필요 |
| IA-16 | My Projects lifecycle·내 Part·Key·배지 | PARTIAL | 카드 Metadata·7일 배지 필요 |
| IA-17 | Collection 프로젝트/보컬/곡 객체 분리 | DONE | 각 저장 상태 분리, 결과/Empty 제공 |
| IA-18 | My Voice 전체 정보와 개별 수정 | PARTIAL | 성향/수정 경로 보강 필요 |
| IA-19 | 7일 Push·미허용 배지·Workspace 배너 | MISSING | 알림 예약/권한 처리 필요 |
| RR-01 | 실제 입력 반응·Track 특징 분석 | PARTIAL | 브라우저 입력 구현, 실기기 미검증 |
| RR-02 | 분석 기반 생성형 AI Voice Layer | BLOCKED | 현재 deterministic fallback, 로컬 모델 검증 필요 |
| RR-03 | 동일 Seed·입력 재현과 서로 다른 Track 구분 | PARTIAL | 자동 검증 있음, 사람 음성 실기기 검증 필요 |
| RR-04 | 2/4→3/4→4/4 동일 Record 성장 | PARTIAL | 상태 연결됨, inactive field·시각 품질 보강 필요 |
| RR-05 | 기준 이미지 수준의 연속 혼합·물성 | PARTIAL | 입자/결은 있으나 밀도·깊이 차이 큼 |
| DS-01 | 지정 색상·Part 색은 데이터 전용 | PARTIAL | 토큰 사용, 일부 용도 재검토 필요 |
| DS-02 | Instrument Serif·Inter·JetBrains Mono | DONE | OFL font asset을 앱에 번들하고 한글은 Pretendard fallback 적용 |
| DS-03 | 모바일·태블릿·데스크톱 Responsive | PARTIAL | 430px 고정 제거·760px 2열 규칙 구현, 실기기 회전/키보드 미검증 |
| DS-04 | CTA·Row·Tab·Touch·Focus·Reduced Motion | PARTIAL | 기본 구현, 화면 전수 확인 필요 |
| DS-05 | Idle/Playback/Breath/Recording/Pause/Processing/Complete | PARTIAL | playing·recording·complete 일부만 존재 |
| VERIFY-01 | 처음부터 끝까지 사용자 클릭 여정 | PARTIAL | 초기→상세→Voice Range와 권한 타임아웃·브라우저 Back 실제 클릭 확인; 실제 마이크 이후 여정 미검증 |
| VERIFY-02 | GitHub/Vercel HTTPS 모바일 실행 | MISSING | 배포 후 권한·라우팅·PWA 검증 필요 |

## V2 제외 보호

실시간 채팅, 결제, 소셜 피드, 팔로워·랭킹, 5명 이상 합창, 리더 승인, Draft 보관, 정밀 Pitch Score/MIDI/악보 동기화, 외부 유료 Mixing API, 음정 보정, 보컬 분리, 고급 공간감 자동 조정, 전문 DAW, 별도 알림센터, 공유 이미지·영상 자동 생성은 구현 완료 조건에 넣지 않는다.
