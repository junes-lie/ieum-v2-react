## 2026-10-08 단계 2 — 기존 녹음 화면의 오류 문맥

현재 사용자 지정 화면명세 R07/R08/R10의 기존 오류 동작을 적용했다. Review의 저장/제출 실패에도 마이크 권한 안내·재시작 버튼을 제공하던 오류를 실제 기존 production에서 주입한 저장 실패로 재현했다(권한 재시작 버튼 1개로 검사 실패). Review는 실제 오류 문구만 표시하며 기존 Take/Review와 녹음 제출 재시도 버튼을 유지한다. 마이크 시작의 권한 거부와 장치 시작 실패도 실제 예외 유형으로 분리해 장치 오류에 권한 설정 안내를 표시하지 않는다. 신규 실패 화면·정책을 추가하지 않는다.

build/기존 QA, Node 실패 원본 보존·재제출 검사 및 격리 브라우저의 NotAllowedError/NotReadableError가 통과했다. 2/3/4 Part 각각 실제 IndexedDB 제출 실패를 주입해 원본 음성 SHA256·제출 수 보존·Review 유지·불필요한 마이크 재시작 없음→재제출 성공→실제 합성 WAV→Complete→프로필 복귀→재접속을 검증했다. 유지 명령은 qa:record-errors와 기존 qa:continuity이다. 합성 음원/API 오류 주입 검사이며 실기기·실제 서버 인수가 아니다. 단계 2 전체 완료 또는 단계 3 진입을 선언하지 않는다.

## 2026-10-08 단계 2 — 실제 Pretendard 가변 굵기

사용자 교정과 실제 Desktop Figma Credits의 Pretendard SemiBold를 적용한다. 기존 Pretendard-Regular.ttf의 sfnt metadata는 static/weight400인데 CSS가 100–900으로 선언해 브라우저에서 400/500/600/700 한글·영문 글리프의 픽셀이 모두 동일했다. 공식 고정 commit의 실제 가변 WOFF2를 로컬 번들로 연결하고 공식 45–920 범위를 선언했다. 중앙 Credits 이름의 첫 폰트도 Inter가 아닌 Pretendard IEUM으로 직접 지정했다. 03/06/07 내부의 기본 폰트 변수도 Pretendard 우선으로 지정해 기존 변수 참조가 Inter로 되돌아가지 않도록 했다. 범위 밖 화면의 변수와 Instrument Serif/JetBrains Mono는 보존한다. 원본 Regular 파일은 보존하고 공식 라이선스·출처·해시를 함께 보관한다.

유지 QA verify-pretendard-font는 수정 전 distinct-weight 검사 실패(1/4), 수정 후 실제 글리프 픽셀 4/4를 확인했다. build 및 360/390/430px 세 화면·가사·긴 Credits·확인창 200%·44px 터치·desktop 430×932 검사가 통과했다. 회전·공명·저장 데이터는 변경하지 않았다. 배포된 폰트와 production 결과는 자동배포 뒤 확인한다. 실기기 인수는 미검증이다.

## 2026-10-08 단계 2 — 중앙 Credits 완성일의 실제 데이터

현재 화면명세의 Final Mix/완성시각 참조와 Desktop Figma 653:49의 날짜 표기를 대조했다. 완성일이 없을 때 오늘 날짜를 넣던 fallback을 제거하고 실제 Mix.createdAt만 YYYY.MM.DD로 표시한다. 누락/유효하지 않은 날짜는 —로 남긴다. time 요소에 실제 ISO datetime을 제공한다. 저장된 원본·Mix.createdAt·완성 상태는 수정하지 않는다.

build/기존 QA 7개, 완성일 유효/누락/잘못된 값의 Node 렌더 검사가 통과했다. 360/390/430px 기존 세 화면·Credits 날짜/datetime·긴 이름·44px 터치와 desktop 430×932 검사도 통과했다. 자동 검사만으로 전체 Figma/실기기 인수를 완료했다고 표시하지 않는다.

## 2026-10-08 단계 2 — 가는 공명 결의 밝기 보정

figma-desktop MCP의 653:49 `07 · 완성곡 · Editable`에서 get_design_context와 get_screenshot을 실제 성공 호출하고 구조·원본 screenshot·기존 React 전후 렌더를 대조했다. 기존 filament의 RGB 밝기 계수만 1.0에서 1.55로 보정했다. 입자 밝기/수, 경로/색상/분포/투명도, 저장 Layer, AI 필드, 회전/내부 흐름/반사광 각도는 변경하지 않았다. 새 발광 레이어나 정적 Record를 추가하지 않았다. 원본 Credits 구조에 따라 Part는 12/16px Mono 대문자·0.48px 자간, 참여자 이름은 Pretendard SemiBold로 보정했다. 기존 Part 색상·이름 데이터·44px 터치 및 긴 이름 줄바꿈은 유지한다.

production build/기존 QA 7개 및 360/390/430px 세 화면·desktop 430×932 렌더 검사가 통과했다. 실제 P0 출력의 0/2/3/4 AI 필드 표시, 고정 시간 재로드 픽셀 재현, 움직임, Complete 진입/안정화와 손상된 출력 거부·음성 원본 보존도 통과했다. 입자 수 45086 유지·console/page error 0이다. 이는 production AI 추론 서비스 연결이나 전체 Figma pixel 일치를 의미하지 않는다. 물리 기기/마이크/청취는 미검증이고 단계 2 전체 완료를 선언하지 않는다.

## 2026-10-08 단계 2 — 실제 재생 경계 회귀 검증

`qa/verify-player-lifecycle.mjs`는 격리 브라우저에서 실제 기존 demo Stem 재생·seek 후 개별 Track/현재 Mix 소스 전환, 모든 Track 제외 시 재생·seek 비활성 및 시간 초기화, 다시 포함하여 재생한 뒤 Recorder 진입 시 이전 audio 정지를 검사한다. 기존 production에서도 통과했으므로 처음 의심한 소스 전환 오류는 재현되지 않았고 앱 코드를 불필요하게 수정하지 않았다. 기존 2/3/4 Part continuity 검증과 함께 실행한다. 자동 QA는 실제 청취/물리 마이크/공유 서버/실기기 인수를 대체하지 않는다. 단계 2 전체 완료 또는 단계 3 진입을 선언하지 않는다.

## 2026-10-08 단계 2 — 03/06 실제 조작·가사·접근성 보정

현재 사용자 지정 Notion 화면명세와 Desktop MCP 653:47/653:48의 get_design_context/get_screenshot을 실제 확인했다. 녹음 가사는 현재 구간을 가운데 두고 이전/다음 3칸만 표시하며 과거의 숨김 스타일을 보정했다. 연습 안내를 실제 가사로 표시하지 않는다. 현재 Mix 안내는 Sans로 시간과 같은 줄에 배치하며 처리 중 상태는 유지한다. Track 행의 Track ID가 Part ID를 덮던 실제 개별 재생 오류를 수정했다. 기존 원본·저장 키·seed는 변경하지 않는다.

44px seek/Track 터치 영역, 보이는 Track 재생 원 32px·원본 SVG native size, Part 순서 표시, 반주 Guide 키보드 포커스를 검증했다. Paused도 왼쪽 다시 녹음/가운데 정지/오른쪽 이어서 녹음과 라벨을 유지한다. Paused의 즉시 Take 폐기를 확인 후 폐기로 보정했다. 기존 확인창은 native dialog로 배경 조작 차단, Tab 순환, Escape, 포커스 복귀를 제공하며 명세의 유지 Primary/폐기 Secondary 문구·340px/10px 기준을 적용했다.

build/기존 QA 7개, 360/390/430px 세 화면·원본 asset·44px 조작·현재 Mix 개별 Track/복귀·가사 3줄·Paused·확인창 취소/녹음 유지·확인창 200% 텍스트 검사와 2/3/4 Part Review 제출→실제 합성 WAV→Complete→Credits 프로필/복귀→재로드 QA가 통과했다. 실제 렌더도 확인했다. 회전·내부 흐름·반사광 각도는 보존한다. production 결과는 실제 자동배포 후 별도 확인한다. 확인창 200% 검사만으로 모든 화면의 확대·실제 기기 인수를 완료라고 표시하지 않는다.

단계 2 전체 Figma pixel 일치·실기기 인수와 실제 곡 Guide/서버 추론은 미검증이다. 실제 곡 자료가 없는 상태를 다른 진행 가능한 구현/검증의 중단 사유로 사용하지 않는다.

## 2026-10-08 단계 2 — 프로젝트별 화면 연속성 검증

유지 QA `npm run qa:continuity`를 추가했다. 실제 기존 앱의 격리 브라우저에서 2/3/4 자유 Part 프로젝트 각각 임시본 Review→직접 제출→기존 자동 Mix→Complete, 프로젝트/Key/Track 유지, 실제 합성 WAV metadata 로드, Credits→타인 프로필→Complete 복귀, 재로드→작업실의 완성곡 듣기로 재진입을 검증했다. 각 프로젝트는 360/390/430px에서 가로 overflow가 없다. 로컬 및 production 모두 통과했고 console/page error 0이다. 새로 합성한 2초 QA WAV로 기존 엔진을 검증했으며, 물리 마이크/청취·실제 협업 검증은 아니다. 앱 화면/제품 정책/회전/흐름을 변경하지 않았다.

Codex의 자동 검증 범위는 통과했지만 Figma 공명 곡선/발광의 차이 및 사용자 실제 기기 인수는 남아 있다. 단계 2 전체 완료와 단계 3 신규 구현을 임의 선언하지 않는다. 서비스 준비 조사에서 Vercel GitHub main 연결과 환경변수 0개를 실제 API로 확인했다. 상세 제한은 SERVICE_CONNECTION에 기록한다.

## 2026-10-08 단계 2 — 중앙 Credits 긴 이름

기존 중앙 라벨 안에서 긴 참여자 이름이 해당 Part 폭에 맞게 줄바꿈되도록 보정했다. 텍스트를 자르거나 외부 Credits 목록을 추가하지 않는다. 기존 명세의 모든 이름 표시/최소12px/44px 터치 기준을 유지 QA에 추가했고 360/390/430px 세 화면 및 desktop frame QA가 통과했다. build 성공. Record 각도·회전·내부 흐름은 변경하지 않았다. 이 검증은 물리 기기 인수를 대체하지 않는다.

## 2026-10-08 단계 2 — 바이닐 표면 반사 보정

figma-desktop MCP의 653:49 `07 · 완성곡 · Editable`에서 get_design_context/get_screenshot을 실제 호출하고 현재 React 렌더와 비교했다. 전체 Record 이미지를 붙이지 않고 기존 Canvas 재질에 좁은 방향성 반사광을 보정했다. 후속 사용자 지시에 따라 홈/표면 반사의 축을 중앙 크레딧 라벨 자산의 좌상단↔우하단 방향에 고정해 각도를 맞췄다. 프로젝트/Track/AI 필드·입자·회전 및 내부 흐름 속도는 유지한다.

build, 360/390/430px 세 화면 layout QA 및 430×932 desktop frame, 실제 timeline QA가 통과했다. 보정 후 실제 렌더를 확인했다. Figma와 공명 곡선/발광의 차이 및 물리 기기 인수는 남아 있으므로 단계 2 전체 완료 또는 단계 3 진입으로 기록하지 않는다.

## 2026-10-08 단계 2 — Record 시간축과 표면 반사

사용자의 “너무 빠른데” 피드백을 반영해 회전 속도를 기존의 1/3로 낮췄다. 후속 사용자 지시에 따라 내부 흐름은 속도 보정 전 수준으로 복원했으며 600ms 감속·Pause/Resume 위상 보존·호흡·Complete 진입 효과는 유지한다. 이 속도 결정은 이전 문서의 회전 주기보다 최신 사용자 지시를 우선한다.

사용자가 현재 Notion 내용으로 지정한 DESIGN_SYSTEM의 8.1/8.4와 현재 Desktop Figma 653:46 구조·스크린샷을 대조했다. 기존 WebGL Record에 Rest 90초·Playing 72초·Recording 90초·Complete 108초 회전, 600ms 상태 전환 감속/가속, 5초의 약한 호흡을 연결했다. 프로젝트/seed별 시간축을 React ref로 유지해 같은 컴포넌트의 Pause/Resume·AI 필드 로드 때 각도가 초기화되지 않는다. Processing은 회전 없이 기존 위상 이동을 유지하고 reduced-motion은 정적인 표시를 유지한다. 표면 홈에 낮은 대비의 방향성 반사를 추가했다. Complete 진입은 1.2초 동안 Voice field가 한 번 넓어졌다가 안정되며, 같은 컴포넌트의 AI 로드·재생 상태 전환 때 반복하지 않는다. Record 전체를 정적 이미지로 대체하지 않았다.

재사용 QA `node qa/verify-record-timeline.mjs`는 실제 기존 앱에서 회전 속도, 600ms 후 정지, Pause/Resume 각도 연속성, 실제 호흡 픽셀 변화, reduced-motion 픽셀 불변을 검사한다. 격리 합성 마이크 브라우저에서 통과했고 초기 측정 Rest 주기는 약30.10초였다. build/기존 QA 7개/모바일 3화면·원본 SVG/실제 WebGL/실제 AI 0·2·3·4 필드 재현·원본 보존 QA도 통과했다. 새 QA는 `IEUM_QA_URL`로 배포된 동일 앱을 검사할 수 있다.

이번 범위는 2단계의 motion·재질 보정이다. 모든 Figma 픽셀의 일치, 실제 모바일 성능·청취·터치 인수와 서버 AI 연결은 완료로 표시하지 않는다. 다음 단계 신규 기능을 시작하지 않았다. Git 자동배포와 production 결과는 실제 확인 후 docs/GIT_SYNC_VERIFICATION.md에 기록한다.

## 2026-10-08 단계 2 — Figma 컴포넌트와 Record 입자 결 보정

현재 Desktop MCP의 653:46 `IEUM · 3화면 · 편집용 프레임`에서 get_design_context/get_screenshot을 재호출해 성공했다. 기존 React의 03/06/07에 원본 재생·하트·공유·다시 녹음·정지·일시정지·마이크 SVG를 native size로 연결했다. 완성곡 중앙 원형 라벨만 원본 금속 재질 자산을 사용하며, Record 자체는 기존 움직이는 WebGL을 유지한다. 곡명 앞 불필요한 38px 여백을 제거하고 시간/seek를 두 줄로 분리했다. MIC 수치를 한 줄로 유지한다. 입자 크기를 줄여 가는 결을 만들면서 밝기를 보정했다. 기존 Part/seed/AI 파일·음성 계보와 곡선·색상 슬롯·입자 수는 보존했다.

build, 유지 QA 7개, 360/390/430px의 3화면 렌더·원본 SVG 로드/크기·시간과 seek 비겹침 검사, 430×932 desktop frame, 실제 WebGL 5개 시간 프레임 및 실제 P0 AI 출력 0/2/3/4개 재현/움직임/손상 출력 거부·원본 음성 보존 QA가 통과했다. 실제 렌더를 현재 Figma와 비교했다. 데이터에 따른 긴 곡명/참여자 텍스트는 유동 높이를 유지한다.

이번 보정이 Figma Record 전체 pixel match나 실제 모바일 인수를 뜻하지 않는다. Record 곡선/광택/입자 밀도의 시각 차이는 남아 있고, 실제 마이크·터치·청취와 서버 추론 연결도 미검증이다. 단계 2 전체 완료를 선언하거나 다음 단계로 건너뛰지 않는다. 자동배포·production 증거는 실제 확인 후 docs/GIT_SYNC_VERIFICATION.md에 기록한다.

## 2026-10-08 단계 2 — 실제 AI 출력의 기존 Record 연결

03/06/07 기존 화면 통합은 eba083c로 Git Integration production READY까지 확인했다. 이번 변경은 실제 생성 결과를 받아 기존 움직이는 Record에 연결하는 표시 경로다. Track 원본 SHA256, 생성 PNG SHA256, project/part/participant/seed 및 모델 revision 계약을 검사하고, 512×512 생성 필드를 전체 평면에서 결합해 기존 입자의 밝기에 반영한다. 기존 SATB 색상·입자 구조·움직임은 유지한다. 학습된 motion 모델이나 서버 추론 연결은 아니다.

실제 P0 VocalSet/BYOL/SD-Turbo 출력으로 0/2/3/4 필드의 WebGL 업로드, 출력 차이, 고정 시간 재로드 픽셀 재현, 실제 움직임을 검증했다. 네 조건 모두 입자 45086개를 유지했고 console/page error는 0이었다. 손상된 출력 해시는 화면에서 거부되며 원본 음성 해시는 보존됐다. build, 유지 QA 7개, 원본/출력 계약 QA, 360/390/430px 3화면 및 430×932 desktop frame QA를 통과했다. 모델·음성·이미지·JSON은 Git 밖에 보존한다.

단계 2 전체 완료는 아니다. 현재 Figma 653:46에 Desktop get_design_context/get_screenshot 성공을 재확인했으나 Record 소재의 시각적 일치와 실제 모바일 인수는 미완료다. 실제 서비스 추론 API·인증·다중 사용자 연결은 단계 5에 남아 있다. 배포 결과는 docs/GIT_SYNC_VERIFICATION.md에 실제 확인 후 기록한다.

## 2026-10-08 단계 1 기술 검증 배포 확인

단계 0 기준 보존 완료. 단계 1 P0 기술 검증 및 project/part/user 계약 수정은 `94b29c6827d803b50340807cf6e27dfc7a8d7a39`로 main에 push했다. GitHub main과 로컬 HEAD가 일치하고 Vercel Git Integration `dpl_4GBV67mFGs5vW196vMwhzBwiaNuC`가 같은 commit으로 production READY다. Production HTTP 200 및 JS `index-Db1cBIdN.js`/CSS `index-BteeLf2-.css` SHA256이 로컬 검증 build와 일치했다. 실제 서비스 AI 연결, 음색 식별 정확도, Figma 시각 완성, 실기기 인수는 완료가 아니다. 다음 실행은 단계 2 기존 03/06/07 시각 통합이다.

# IEUM V2 현재 구현 판정

## 현재 적용 판정 — 2026-10-08 계획 교정

현재 마감 범위: 단계 0 기준 보존 완료. 단계 1은 실제 가창 4명→실제 음색 embedding→실제 생성 모델→2–4 Layer 결합과 기존 앱 데이터 계약의 로컬 기술 검증을 통과했으며 Git 자동배포 검증을 진행한다. 아래의 단계 1 미완료 문구는 이번 최종 P0 실행 이전 기록이다. production AI/서버 연결, Figma 시각 및 실제 마이크·기기 인수는 계속 미완료다.

실제 코드 수정은 Part 순서와 Record 색상 슬롯의 연결 및 null Part에 의한 기존 Layer 소실 방지다. 재정렬/free Part 회귀, 새 2/3/4 Part의 임시본 제출·재로드에서 원본 Blob/user/part/seed/Layer/keyLocked 보존을 확인했다. 실제 WebGL 5개 시간 프레임 변화/console error 0도 확인했다. 자세한 실제 모델·결과·실패 한계는 docs/P0_AI_FEASIBILITY.md에 기록했다.

추가 검증: 실제 SD-Turbo 생성 Layer 4개 및 모델 latent의 2/3/4개 결합→실제 VAE 출력 성공. 입력·모델·출력 계보 QA와 기존 Record signature의 보존/재로드 검사 통과. 자유 Part ID의 2/3/4 Part 화면 데이터 전달 Node QA도 통과했다. 실제 사람은 공개 말소리 두 녹음이며 가창/독립 Take 검증이 아니다. AI 결과를 기존 motion renderer에 연결한 상태는 아니고, 단계 1 전체 gate는 계속 미완료다. 아래의 ‘2–4 AI Layer 합성 미검증’은 이번 latent 시험 이전 기록이다.

추가 P0 실행: 실제 WavLM speaker 모델의 동일 입력 반복 및 같은 녹음 두 구간/다른 녹음 비교 검사도 통과했다. qa/verify-ai-voice-layer.py와 qa/verify-ai-speaker.py가 재사용 가능한 로컬 검증 코드다. 모델 캐시·음성·생성 이미지·JSON은 Git 밖의 격리 환경에 유지한다. 이 부분 검증은 아직 미커밋이며 단계 1 전체 gate 완료 시 검토한다.

단계 0의 기준 보존 gate는 보존/연결표, 현재 제품 문서 대조, 격리된 복원 및 원본 보존 QA, build와 production 배포 확인으로 충족했다. 실제 사용자 DB/마이크/새 전체 Mix/시각 인수는 검증되지 않았고 해당 기능 단계 3 및 종합 단계 6에 남긴다. 전체 제품 또는 녹음 기능 완료를 뜻하지 않는다. 아래 과거 단계 0 보류 문구 대신 구현계획의 2026-10-08 교정 기준을 적용한다.

단계 1은 [P0 실제 추론 검증](docs/P0_AI_FEASIBILITY.md)까지 진행했다. 격리된 CPU 환경에서 실제 SD-Turbo weight를 실행했고 기존 분석 모듈에 연결한 공개 음성 두 개로 동일 입력/seed 픽셀 재현과 다른 입력의 출력 차이를 확인했다. 생성은 약11초/회였다. 실제 가창 음색 정확도, 2–4 AI Layer 합성, 전체 데이터 계약과 production AI 연결은 미검증이다. 단계 1 전체 완료 및 단계 2 신규 구현은 승인하지 않는다. 기존 부분 코드는 보존한다.

배포: 코드 보존 수정 6a3df11 및 작업 흐름 cc9037a는 GitHub main과 일치, Git Integration deployment dpl_9GJorkqbrnHg8CtzTt8zUgAEi3bg READY를 확인했다. production HTTP200 및 JS/CSS SHA256이 검증 build와 일치한다. 이하 과거 ‘이번 자동배포 확인 전’ 문구는 당시 기록이다.

## 2026-10-08 단계 0 재확인

추가 재진입 검증에서 저장된 실제 제출 Track을 데모 bootstrap이 덮어쓸 수 있는 문제를 재현하고 App.jsx의 조건 한 곳을 수정했다. 기존 QA manifest에 실제 두 demo Part를 포함하여 회귀 검증을 보강했다. 제출 실패/재시도, 이전 키 임시본 복원, 다른 사용자 임시본 보호 검증도 성공했다. 수정 후 build 및 QA 7개가 성공했다. 실제 사용자 DB는 조작하지 않았다. 사용자 지시에 따라 실제 기기 검증용 수정본을 먼저 commit/push하여 Git Integration 자동배포하고, 실제 기기 검증 이후 단계 0 완료를 판정한다.

현재 코드의 보존 목록과 화면/데이터 연결을 [단계 0 기준 기록](docs/STAGE_0_BASELINE.md)에 정리했다. 이번 build 및 기존 Node QA 7개가 성공했고, figma-desktop의 현재 653:46 프레임에 get_design_context/get_screenshot을 호출해 모두 성공했다. 사용자 AGENTS.md 변경과 기존 앱 코드는 그대로 유지했다.

사용자가 제공한 6개 Markdown을 현재 Notion 내용으로 지정했으므로 단계 0 관련 제품 계약을 코드와 대조했다. Notion Connector 직접 조회 결과는 아니다. 문서 대조 및 후속 단계별 차이는 위 기준 기록에 정리했다. Notion 도구 미노출은 이번 작업의 blocker에서 제외한다.

단계 0 완료는 보류한다. 실제 사용자 브라우저 데이터·마이크·임시본·새 Mix 전체 경로와 시각 비교가 미검증이다. Node fixture 검증을 이 증거로 대체하지 않는다. 단계 1, commit/push/배포에는 진행하지 않았다.

기준일: 2026-10-07. 단일 앱 통합 및 녹음/저장 기반 보완 작업 진행 중이다. 문서상 요구사항 충족, 코드 작성, 자동 테스트 통과, 물리 기기 및 서버 검증을 구분한다. 전체 제품 완료 또는 서버 연결 완료로 판정하지 않는다.

## 단계 순서 정정과 현재 요청

구현 계획의 단계 1 실제 AI 기술 검증이 완료되지 않았는데 단계 2–4에 해당하는 디자인·녹음·일부 프로필 작업을 병행했다. 사용자에게 단계 순서대로 진행한 것처럼 보고할 수 없는 상태이며, 선행 gate를 건너뛴 실행으로 정정한다. 이미 작성된 후속 단계 코드는 부분 구현으로 보존하고 단계 완료로 승인하지 않는다.

현재 요청된 화면 높이·하단 내비게이션 보정 및 해당 보정의 배포는 **별도의 보정 작업이며 코드·Node 검증 및 배포 완료(실제 시각·실기기 미검증)**다. 이 작업은 기능 구현 단계의 진전이나 단계 1 통과로 계산하지 않는다.

보정 작업을 끝낸 뒤 **단계 0 확인 → 단계 1 데이터 기반·실제 AI 검증 → 단계 2 → 이후 단계** 순서로 진행한다. 각 단계의 계획상 완료 조건과 검증 근거를 확인하기 전 다음 단계의 신규 구현에 착수하지 않는다. AI 모델 미연결 상태를 계산식·화면 존재·Node 테스트로 대체하여 gate를 통과시키지 않는다.

## 현재 실행 범위

- `src/main.jsx`가 기존 `App.jsx`만 렌더링한다. 독립 `FigmaProject.jsx`와 전용 CSS는 정리했다. `?design=figma`로 별도 앱을 만들지 않는다.
- Figma 03/06/07 구조를 기존 Workspace/Recorder/Complete와 동일 데이터 흐름에 통합하는 중이다.
- 측정 음역 Gate, 녹음 pause/resume 타임라인, Guide 업데이트, 2–4 Track 합산 피크 제한과 IndexedDB 실패 처리 기반을 보완했다.
- 로컬 서비스 경계와 인증이 필요한 HTTP transport 계약을 추가했다. 실제 서버가 없는 상태에서 인증·초대·공유·Push 성공을 만들지 않는다.
- 사용자가 제공한 여섯 Markdown과 Desktop MCP Figma 결과가 이번 구현 기준이다. Computer Use로 읽은 Notion 내용은 검증 근거에 포함하지 않는다.

## 영역별 판정

| 영역 | 판정 | 남은 검증 또는 구현 |
|---|---|---|
| 단일 React 앱 | 코드 통합·Node 렌더 검증 | 모든 01–10 화면의 회귀 검증, 독립 Figma 잔여 파일 정리 범위 확인 |
| Figma 03/06/07 | 코드 통합·Node 렌더 검증 | 실제 렌더링의 시각 일치, 360/390/430px, 터치 크기, 대비와 safe area |
| 프로젝트/Part 모델 | 부분 구현 | 모든 탐색 프로젝트 참여, 실제 타인 제출, 서버 기반 권한/동시성 |
| 음역 Gate | Node 계약 검증 | 실제 곡 요구 음역/Key 자료, tessitura 자료, 실기기 발성 정확도 |
| 녹음/임시본 | 기반 보완 | 실제 마이크, 모바일 pause/resume 지연, 저장 실패/이탈/복원 UI 실측 |
| Current Mix/완성 Mix | 기반 보완 | 개인 선택의 실제 오디오, 기기 처리시간/합산 음질, 모든 프로젝트 완주 |
| Voice Profile/탐색/저장 | 부분 구현 | 정보별 편집·취향 입력 UI의 상호작용 검증, 후보 음성 자료, 필터/복귀 전수 검증 |
| Record | 결정적 분석 시각화 유지 | 생성형 AI Voice Layer와 모바일 성능 검증 |
| 공유 서버/인증/초대 | 미연결 | 실제 서버, 권한, 원자적 자리 배정, 저장소, 수신자 accept/decline |
| 결과 공유/7일 Push | 미연결 | 공개 결과 URL, 서버 스케줄러/구독/클릭 deep link |
| 실기기/배포 | 보정 production 배포 확인·실기기 미검증 | 이전 보정본은 READY/HTTP 200. 이번 Git commit의 자동배포는 아직 확인 전. 물리 기기·마이크 검증은 없음 |

## 검증 범위

Node 테스트 성공은 모듈 계약과 수치 처리의 근거다. HTTP 테스트의 응답은 stub으로 실제 인증이나 서버 처리 성공의 근거가 아니다. 기존 브라우저 자동 여정은 Node DOM/in-memory IndexedDB 시험으로 교체했고 npm run qa의 7개 suite가 성공했다. App 복원·Review 제출·탭/scroll 복귀·저장된 Complete 복원을 확인하지만 renderer/preview/play와 synthetic 녹음·Mix fixture를 사용하므로 실제 캡처·새 합성·GPU·청취·시각·물리 기기 검증을 대체하지 않는다. 이번 작업에서는 Computer Use 및 브라우저 UI 조작을 수행하지 않는다.

기존의 1,967개 요구사항 원장에 대한 전수 코드/화면/데이터 연결은 완료되지 않았다. 과거 단계 완료 주장을 이 문서에서 되살리지 않는다. 검증 근거와 한계는 위 검증 범위에 기록하며, 남은 구현 단계는 `docs/IMPLEMENTATION_PLAN_2026-10-07.md`에 기록한다.

## 확인된 기존 배포 정보

프로젝트의 origin remote는 `https://github.com/junes-lie/ieum-v2-react`이다. 기존 `https://ieum-v2-react.vercel.app/`에 대한 읽기 요청은 HTTP 200으로 응답했다. 이는 기존 프런트엔드 접근 증거이며 이번 변경 배포, 실제 서버/인증/저장 연결, 마이크 또는 전체 사용자 여정 검증의 증거가 아니다. GitHub의 인증 없는 읽기 요청은 HTTP 404였으므로 저장소가 없다고 판단하지 않는다. 앞선 감사 시점의 기존 URL 읽기 결과다. 이후 사용자가 요청한 높이·내비게이션 보정 배포는 아래 READY 기록으로 확인됐다. 현재 Git 동기화 작업의 commit 기반 자동배포는 아직 확인 전이다.


높이·하단 내비게이션 보정 배포는 READY(dpl_FwE5HGnfTy8K8RB8JUtHbYKrzgdG), 기존 production alias HTTP 200으로 확인했다. 최종 build 31 modules와 Node 렌더 테스트 성공은 root가 확인했다. 단계 0은 부분 확인·완료 보류 상태다. 실제 마이크 녹음·임시본 복원과 화면/데이터 연결 재현의 검증이 남아 있다. 단계 1에 착수하지 않는다.

## 2026-10-08 단계 2 — 기존 03/06/07 시각 통합 실행

- 실제 Source: figma-desktop MCP에서 653:47 `03 · 작업실 · Editable`, 653:48 `06 · 녹음 · Editable`, 653:49 `07 · 완성곡 · Editable`의 get_design_context/get_screenshot을 각각 성공 호출하고 원본 구조와 screenshot을 확인했다. 초기 짧은 socket timeout과 세션 초기화 오류는 동일 Desktop MCP 재시도로 해소했으며 Remote Figma/Computer Use를 사용하지 않았다.
- 기존 React의 Workspace/Recorder/Complete를 수정했다. 헤더·실제 프로젝트명/Key/진행률·곡명 타이포·Mix 위계·Guide 반주 독립 스위치/복수 Track chip·중앙 가사·다시 녹음/정지/일시정지 라벨·Record crop·중앙 Credits·완성곡 보조 행동을 연결했다. 별도 앱/정적 Record 대체를 만들지 않았다. 430px desktop frame의 932px 높이 제한을 유지한다.
- 입력 그래픽은 기존 analyser의 실제 waveform buffer와 RMS를 전달받는다. 입력 입자는 가로 방향으로 움직이고 MIC dBFS는 실제 RMS로 계산한다. 새 생성형 AI를 브라우저에 연결했다는 의미는 아니다. 기존 Record palette/path/입자 수와 저장 Layer를 보존했다.
- 로컬 검증: production build와 전체 7개 QA 통과. 별도 유지 `qa:layout`에서 360/390/430px 세 화면의 실제 WebGL/가로 overflow/Guide toggle/합성 마이크 pause-resume-Review/저장된 합성 Mix 복원/native audio/탭 표시를 확인했다. desktop 1200×1100에서 frame 430×932 및 내부 scroll을 확인했다. `qa:motion` 실제 10초간 5프레임이 서로 다르고 console error 0이다. QA는 개인 브라우저/DB와 분리됐다. 일회성 결과는 TEMP/기존 ignore에 보관한다.
- 잔여 차이/미검증: 기존 절차 Record는 Figma 원본의 광택·발광·가는 결과 동일하지 않다. 실제 AI 생성 Layer→motion renderer/서비스 연결, 실제 모바일 touch/safe-area·물리 마이크·청취는 미완료다. layout QA는 Figma pixel 일치나 실제 기기 인수를 대체하지 않는다. 전체 단계 2 완료로 표시하지 않는다. 검증된 시각 통합 수정은 Git 자동배포하여 같은 production에서 확인 가능하게 한다.
