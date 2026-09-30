# IEUM V2 현재 구현 판정

기준일: 2026-09-30

이 문서는 Notion `단계별 구현`의 0–12단계를 그대로 사용한다. 화면 존재나 자동 테스트 통과만으로 단계를 완료 처리하지 않는다. 원자 요구사항 1,967개를 코드·화면·저장 데이터·검증 결과와 연결하기 전까지 0단계는 완료가 아니다.

## 정정

- 이전의 “6단계까지 완료” 보고는 무효다.
- 실제 현재 위치는 **0단계 진행 중**이다.
- 후속 단계에는 이미 작성된 코드가 있지만, 선행 원장과 각 단계 통과 조건이 충족되지 않아 모두 `부분 구현` 또는 `미착수/검증 필요`다.

## 단계별 판정

| 단계 | 판정 | 확인된 구현 | 통과하지 못한 핵심 조건 |
|---|---|---|---|
| 0. 전 문서 요구사항 원장 | 진행 중 | IA 611, PRD 770, PROJECT 161, DESIGN 420, 이미지 5개를 원자 행으로 추출 | 각 행의 코드 위치·화면 경로·저장 데이터·검증 결과 판정이 아직 비어 있음 |
| 1. 데이터 모델과 앱 상태 | 부분 구현 | Song/Project/Part/Person/Invitation/Track/Mix 일부, 저장 객체 분리, 제출 기준 진행률 | 상태가 `App.jsx`에 집중, 모든 Project가 독립 동작하지 않음, 생성 Project의 외부 Track·Mix·Complete 영속 모델 없음, navigation history 전수 검증 없음 |
| 2. Design System 앱 셸 | 부분 구현 | 지정 폰트, Vinyl Noir 토큰, Row/Tab/CTA, 하단 내비게이션, 일부 반응형 | Opening/Completion Signature 없음, 화면 전수 Primary CTA·44px·focus·safe area 미판정, 실제 기기 반응형 미검증, 기준 이미지 비교 캡처 없음 |
| 3. Home·곡·프로젝트 계층 | 부분 구현 | 검색, 곡 목록, Song Save, Project Carousel, 2–4 Part 생성 | Opening 없음, 다수 Project 데이터가 정적 샘플, 모든 Project 참여·진행·Track 저장이 독립 동작하지 않음, Song Skin 분리 미확인 |
| 4. Voice Profile | 부분 구현/차단 | Range와 Sample 별도 저장, 수동 측정 종료, Sample Review | 실제 휴대폰 발성 검증 없음, 정보별 수정 경로가 같은 Setup으로 합쳐짐, 실제 생성형 AI Voice Identity 없음, 모델·Seed·결과 저장·메모리/시간 측정 없음 |
| 5. Part Fit·보컬 탐색·초대 | 부분 구현 | Match Detail/Profile 분리, 후보 목록, 일부 Sort, 다중 초대와 최초 수락 | Complete Gate와 Key Shift가 실제 곡 음역 데이터 기반이 아님, Filter 대부분 미구현, Match 값이 샘플 데이터, Declined 상태 없음, Recommended Assignment 없음, 프로필 Back 전수 불일치 가능 |
| 6. Workspace·시연 | 부분 구현/자료 차단 | 2/4→사용자 제출 3/4→초대→수락→데모 도착 4/4 상태 연결 | 데모 Stem은 사람 노래가 아닌 formant fixture, 라이선스 확인 사람 보컬 자료 없음, 생성 Project별 동일 시나리오 없음, 확정 멤버 완주 가능 정보 부족 |
| 7. 녹음·Guide·동기화 | 부분 구현 | 마이크 녹음, Guide 토글, Count-in, Meter, pause/resume UI, Review, 독립 원본 Blob | 실제 Backing 파일이 아니라 합성 backing, 공통 Timeline 정밀 검증 없음, pause/resume 동기 오차 측정 없음, 실제 가사/가사 없음 상태 부족, 기본 노이즈 정리 결과 검증 없음 |
| 8. 실제 음성 기반 Record | 부분 구현/AI 차단 | 오디오 특징 분석, deterministic Layer, Seed 재현, 녹음 입력 반응 | 사람 음성 실기기 검증 없음, 생성형 AI Voice Layer 없음, mobile FPS/memory 측정 없음, complete 1회 motion·전체 상태 motion 불완전, 기준 이미지와 시각 격차 큼 |
| 9. Multitrack·Auto Mix | 부분 구현 | Track 개별 재생, 포함 토글, Preview, main demo Project Auto Mix WAV | 생성 Project별 Mix 없음, 1/2/3 Track 실제 사람 보컬 Preview 검증 없음, include/exclude 결과 파일 검증 부족, loudness·sync 품질과 모바일 처리시간 미검증 |
| 10. 완성곡·개인 영역 | 부분 구현 | main Project 완성곡, Credits, Share, 3종 Collection, MY, 7일 fallback 배지/배너 | Complete가 main Project에 하드코딩, Completion Motion 없음, Credits/Project 카드 요구 Metadata 일부 누락, 실제 Web Push 없음, 모바일 공유 시트 미검증 |
| 11. 전체 사용자 여정 재검증 | 미통과 | Edge fake-media 자동 클릭 여정 존재 | Opening·실제 AI 단계가 없고 데스크톱 실제 마이크/Android/iPhone 검증 없음, 첨부 이미지 비교 없음 |
| 12. 배포 검증 | 미통과 | Production build, manifest, Vercel 설정 파일 존재 | GitHub/Vercel 실제 배포 URL, HTTPS 마이크, SPA 새로고침, iOS/Android MediaRecorder·autoplay·IndexedDB 검증 없음 |

## 즉시 수정 순서

1. 0단계 원장 1,967개 행을 코드·화면·저장·검증 근거와 연결한다.
2. 1단계에서 main demo Project와 생성 Project가 다른 코드 경로를 쓰는 이중 상태 모델을 통합한다.
3. 모든 Project에 Track/Mix/Complete가 Project ID 기준으로 독립 저장되게 만든다.
4. 3–10단계를 원장 순서대로 구현하고 단계별 통과 조건을 각각 검증한다.
5. 11단계 실환경 검증과 12단계 실제 배포 검증 전에는 전체 완료를 선언하지 않는다.

## 차단 항목

- Voice Identity 생성형 AI: 무료·로컬 모델의 실제 모바일 추론 미확보.
- Resonance Record 생성형 AI Layer: deterministic fallback만 존재.
- 사람 보컬 데모 Stem: 라이선스가 확인된 같은 곡의 3개 독립 보컬 Track이 제공되지 않음.
- 실제 Web Push: Service Worker와 서버 측 7일 스케줄러/Push 구독 저장 인프라 없음.
- 실제 Android/iPhone 검증: 물리 기기 실행 필요.
