## 2026-10-12 R3 인증·직접 업로드·서버 원본 검증 묶음

api/capabilities.js와 api/me/session.js를 기존 Vite/Vercel 프로젝트에 추가했다. capabilities는 준비 단계/기능false를 명시한다. session은 Bearer 누락/잘못된 형식을401로 거부하고, 선택한 Supabase의 Auth /user 검증 결과에만 사용자 ID를 부여한다. 설정 없으면503이며 사용자 ID/JWT 내용만으로 로그인 성공을 만들지 않는다. private/no-store·Authorization Vary를 적용하고 upstream 본문/키/이메일은 응답에 노출하지 않는다. 로그인 UI·방식/현재 App 사용자·새 화면은 변경하지 않았다.

src/signedAudioUpload.js는 선택적으로 설정한 Storage origin의 서명 URL로 원본 Blob만PUT하고 API Bearer/cookie/referrer/redirect 전달을 막는다. server/audioStorage.js는 server-only 최신 secret(apikey header)으로 실제 비공개 bucket을 확인한 뒤 opaque object 경로의 서명 업로드를 준비하고 원본을 스트림으로 읽어 크기·MIME essence·SHA256을 검증한다. 공개/다른/상태불명 bucket, 원본 불일치/404/끊긴 스트림을 거부한다. 외부 계정·bucket·RLS·DB transaction은 만들지 않았고 이 adapter를 무제한 업로드 API로 노출하지 않았다.

transferAndSubmitTrack은 준비 응답에 같은 원본의 서버검증 receipt가 있는 경우에만 재업로드를 생략한다. 제출 실패 뒤 immutable object 재업로드409 문제를 방지하고 안정된 두 idempotency 키를 보존한다. codec 매개변수가 있는 Blob도 MIME essence로 검증하며 원본 bytes는 유지한다. .env.example에는 빈 server-only 선택 설정만 추가했고 secrets/환경 설정을 변경하지 않았다.

검증: production build34modules, 기본QA13 suites exit0, server-only secret/Storage marker의 client bundle 미포함 확인. qa:service-http의 실제 loopback HTTP5,242,880bytes 전송에서 API payload<1KB/업로드·제출 실패/검증 receipt 재시도·원본hash/Storage에 APItoken 미전송을 통과했다. 실제 API Web handler도 fixtureHTTP에서 capabilitiesfalse/미인증401/설정없음503/POST405를 통과했다. 외부 Supabase/실제사용자/공유DB/실기기 인수 증거가 아니다. RAM9.83GiB 여유/Python 없음/VRAM515MiB를 확인했으며 대형 AI를 실행하지 않았다. Git Integration 및 실제 production API 결과는 확인 후 보고한다. R3 전체는 미완료다.

## 2026-10-11 R3 파일 전송→제출 순서와 원본 보존

src/trackTransfer.js에 transferAndSubmitTrack을 추가했다. 기존 projectService의 업로드 준비/JSON 확정 제출을 재사용하고 제공자 uploadOriginal adapter는 주입받는다. 원본 Blob의 실제 SHA256·크기/MIME을 준비 요청에 보내며, 파일 전송이 uploaded=true로 확인된 뒤에만 제출을 요청한다. 제출 메타데이터와 intent ID를 await 이전/전송 이전 snapshot으로 보존하고 업로드/제출 재시도 키는 호출자가 동일하게 유지한다. 임시본 삭제·Track수·Layer·Mix·App UI·capabilities는 변경하지 않았다. 실제 provider adapter/서버 연결은 미구현이다.

build34modules와 npm run qa10 suites exit0. 새 QA는 업로드 실패/잘못된 intent/제출 충돌/잘못된 입력·원본 hash/진행 중 메타데이터 변경을 확인했다. 기존 remote transport와 결합한 injected HTTP + 격리 IndexedDB에서409 뒤 원본 Draft 보존, 동일 키 재시도와 제출 응답 뒤에도 전송 모듈 자체는 Draft를 제거하지 않음을 통과했다. 첫 QA assertion의 잘못된 호출 인덱스 TypeError는 submit 호출 검색으로 정정 후 통과. 실제 Storage·두 사용자 서버·물리 마이크 완료로 표시하지 않는다. 현재 R3 실제 연결에는 제공자 계정 접근 및 미확정 로그인 방식이 필요하며, 독립 기술 보완만 수행했다.

## 2026-10-11 R3 업로드/제출 transport 선행 계약

기존 projectService에 prepareTrackUpload와 submitUploadedTrack을 추가했다. 파일 크기·audio MIME·SHA256 검증 후 업로드 intent 준비를 요청하고, 확정 제출에서는 intent ID/길이/offset/분석/seed JSON만 보낸다. 원본 Blob은 Function 제출 payload에서 제외한다. 기존 multipart 제출·로컬 Draft·App 동작은 유지한다. 실제 Storage 업로드, intent 소유자/hash 서버 검증, DB 제출 transaction, UI 연결은 아직 없다. 준비 응답을 Track/Layer/Mix 성공으로 처리하는 코드는 추가하지 않았다.

QA는9MB 원본 메타데이터 준비·별도 idempotency 키·JSON 제출/Blob 미전송·잘못된 파일/길이/offset 사전 거부·무인증 거부·409 conflict 전파를 통과했다. 모두 stub HTTP이고 실제 서버 성공 증거가 아니다. build34modules와 npm run qa9 suites exit0. 기존 Profile/임시본/2–4 Mix 회귀 유지. 제공자/계정/로그인 방식이 필요한 실제 R3 연결은 계속 미완료다. Notion 도구 metadata는 발견했으나 실행 전 세션에서 제거되어 원문 호출을 하지 못했고, 이번 작업은 기존 SERVICE_CONNECTION의 기술 계약만 보완했다. 디자인·음원·대형 AI 작업은 변경하지 않았다.

## 2026-10-11 R6 실제 SFT GPU 생성·품질 검사

사용자의 대형 AI 실행 지시 후 실제 RAM7.98GiB 여유/CPU6%/GTX1660SUPER VRAM525MiB 사용/Python 없음 확인. 기존 CPU 환경과 원곡 보존, GPU worker 하나씩 실행했다. SFT FP32+host cache 시험은 실제 worker RAM9.00GiB/시스템 여유0.47GiB에서 명령줄·PID10196 확인 후 그 worker만 중단했다. monitor exit4294967295, 정상 생성 성공 아님. 결과/모델/원본은 삭제하지 않았다.

같은 SFT revision/seed65359/50step/19초/가사/13.4–19초 Repaint를 host cache 없이 CUDA disk offload로 재실행했다. 실제 정상 exit0, 추론396.569초/전체453.874초, GPU 할당 peak2354080256bytes/예약3214934016bytes, NVIDIA 전체VRAM peak3655MiB·최고util84%. 초기 RAM여유1.50GiB 관측, 이후98개 RAM 관측은 여유1.904–4.810GiB/worker working-set 최고8.514GiB이며 완전한 RAM peak 측정은 아니다. 3초 간격 감시와0.75GiB 연속3회 시 해당worker만 중단 조건을 사용했고 재실행에서는 발동하지 않았다. 정상 종료 후 Python 없음/RAM10.46GiB 여유 확인. CPU 작업과 Windows 설정 변경 없음.

새 원본은 부모 .ieum-gpu-ssd-runtime/results/sft-50step-last-phrase-20261011-disk/에 보존. WAV SHA256655468bee3b8db4731cdebb65fa5ca24592c5cbec2af5d251b2ad66cbddab427. 실제 UVR50.625초·stem 합 residual0. Small ASR0.731707/Turbo0.697674, 둘 다 lyricAcceptance=false/normalizedLyricsExact=false. 마지막 줄 오인식으로 품질 실패다. 기준 가사·QA 문턱을 변경하거나 앱 음원에 등록하지 않았다. native mask 밖 PCM 보존false도 유지한다.

qa/compare-ai-vocal-part.py에 --parent-song을 추가했다. 실제 중간 WAV·보고서 해시와 원곡 보고서/ancestry 해시·창 일치를 확인한 뒤 실제 원곡31.7–50.7초로 비교한다. 원곡→중간 후보→Repaint 구분을 보존하고 직접 parent PCM 경로는 그대로다. 실제 root pitch/envelope 및 기존 PCM 회귀 exit0. 동시 voiced407frames/중앙값−2반음/유니슨38.57%/원곡반주 pitch-class share0.078717은 화성 승인 증거가 아니다. entryTimingAccepted/arrangement/catalog 승인 모두false. 틀린 중간 parent를 주면 결과 생성 전 AssertionError로 거부했다.

기존 미커밋 SFT registry/생성기/변환 검증을 검토했다. Base 기본 변환 회귀 실제677tensor+silence/hash parity exit0로 기존 Lego 경로 보존 확인. SFT의 이전677tensor 변환 증거와 이번 실제 CUDA Repaint를 분리한다. 공식 모델 표의 SFT Repaint 지원/Lego 미지원 범위만 등록했다: https://huggingface.co/ACE-Step/acestep-v15-sft . 모델 로딩 성공은 가사·화음·박자 완료가 아니다. R6/전체 단계3 완료로 표시하지 않는다.

## 2026-10-11 R2 Collection 탭별 스크롤 보존

화면명세 B01의 탭별 목록/스크롤 복원 조건을 기존 App/Collection에 연결했다. App 수명 동안 프로젝트·보컬·곡별 위치를 독립 보관하고 탭 전환 및 전역 탭 왕복에서 복원한다. 저장 객체·참여·Track·Mix·스타일·디자인 worktree는 변경하지 않았다. 새로고침 후 스크롤 보존은 이번 완료 범위가 아니다.

production build 및 npm run qa 9 suites exit0. Node journey에서 탭별121px/73px와 전역 왕복·제출3개 유지 통과. Headless Edge 430×320의 실제 window scroll40px/60px·독립 탭 복원·전역 왕복, 저장취소 시 참여/Track 보존·Song/05A native Back 및 pageerror 없음 통과. 격리 데이터 검증이며 실기기 청취/마이크/디자인/서버 인수가 아니다.

첫 브라우저 접속은 sandbox preview와 escalated Edge 사이 ERR_CONNECTION_TIMED_OUT으로 실패해 해당 QA preview만 같은 실행 환경으로 재시작했다. Project 생성 QA 첫 추가 실행은 작업실 query URL에서 Home selector Timeout30000ms였고 Home URL에서2–4 Part 생성/중복확정 방지/재접속 검증을 통과했다. 실패를 앱 성공이나 새 정책으로 대체하지 않았다.

RAM 여유7.67GiB/GPU492MiB를 확인했다. 기존 모델 변환8.3GB·검증6.3GB 관측과 다른 작업 여유를 고려해 대형 AI를 실행하지 않았다. 브라우저는 하나씩 실행한다. 기존 미검증 SFT3파일은 보존하고 기능 commit에서 제외한다. Git Integration/production 결과는 실제 확인 후 보고한다. R2 전체·R3 실제 서비스·R5 그래픽·R6 음악 품질·R7 실기기 완료로 확대하지 않는다.

## 2026-10-11 R2 후속 및 R3 구성 준비

02의 선택 비교 Project를 기존 App selectedProjectId에 연결했다. 05A 왕복 후 첫 Project로 돌아가던 것을 막고 기존 history의 Song/Project/스크롤 복원을 재사용한다. Node journey에서 Warm Duet→참여자05A→기록된 popstate 복귀의 동일Project/214px스크롤/제출3개/신규Project0개 보존을 통과했다. 08 전체Empty의 OPEN Part 찾기는 화면명세/유저플로우 J05 기준대로 Home 탐색에 복귀하며 고정 Project 상세로 직행하지 않는다. 미참여/Project0개 유지 QA도 통과했다. 물리 입력/native history/시각 인수와 구분한다.

이전 R2 묶음 a285933a41190ebc89d065536359fe47955e994c는 origin/main 일치·GitHub Production deployment6995894058 success·HTTP200·JS index-C67bCfJS.js/CSS index-DtsPXy24.css의 local build SHA256 exact 일치를 확인했다. Node HTTPS의 UNABLE_TO_VERIFY_LEAF_SIGNATURE는 Windows 정상 인증서 검증으로 같은 asset 검사를 통과했으며 TLS 검증을 끄지 않았다.

R3 확인: .env.example에는 설정 키가 없고 api/에는 파일이 없다. 설치 vercel CLI 및 현재 세션 Notion/Vercel 전용 도구도 확인되지 않았다. 사용자가 기존 서비스 없음/구성안 준비라고 답했다. docs/SERVICE_CONNECTION.md에 현재 Vercel + Supabase Auth/Postgres/private Storage 추천, 권한/atomic transaction/직접 upload/비용·scheduler 제한과 실제 연결 순서를 작성했다. 제공자·로그인 방식·유료 자원을 확정/생성하거나 실제 서버 완료로 표시하지 않는다. 계정 접근 수단이 없는 실제 연결은 blocker이며 독립 기능 검증은 계속한다.

후속 R2 마감 검증: production build34modules(JS index-CJLJ8d-3.js), npm run qa의9개 suite 전체 exit0. Node old-space256MiB로 순차 실행했고 대형 AI·추가 브라우저를 실행하지 않았다. 미검증 SFT3파일은 이 기능/구성안 commit에서 제외한다.

## 2026-10-11 재계획 실행 — R2 탐색 복귀 및 필터 Empty

현재 실행 기준은 기존 구현계획 상단의 R0–R7이다. 사용자의 재계획/지속 실행 지시에 따라 단계3 전체 완료를 주장하지 않고 독립적인 단계4 기능 묶음 R2를 실행한다. AI 품질·Identity·디자인·실기기·실제 서버 gate는 남아 있다. 과거의 단계3 전체 완료까지 단계4/5 신규 구현 정지 지시는 이번 의존관계 재정렬로 대체한다.

사용자가 지정한 Notion 내용의 실제 파일은 부모 노션/ 폴더에 있다. 유저플로우 — IEUM_261009.md의 실제 진입 화면·목록 필터/탭/스크롤 복귀 및 08 필터Empty J04 초기화 계약, 화면명세/PRD/IA 관련 항목을 현재 React 코드와 대조했다. 현재 세션 Notion 전용 도구는 노출되지 않았고 Connector 직접 조회를 주장하지 않는다. 시각/스타일/디자인 worktree는 변경하지 않았다.

Finder→Match→05A→Match→Finder에서 필터/정렬을 프로젝트·Part별 App 상태로 보존한다. 후보 진입 전 목록 스크롤을 보관하고 Match Back에서 복원한다. Finder Back은 고정 작업실 이동 대신 실제 history 진입 문맥을 따른다. 08 상태 필터 결과가 비어 있으면 기존 Empty 스타일로 안내·초기화를 제공한다. 저장·참여·초대·제출수·음원은 변경하지 않는다.

검증: build34modules, Node journey의 Profile 왕복 필터/정렬/스크롤 및 제출수 보존, 프로젝트 filter Empty/초기화/Mix 보존 회귀 통과. Project service 계약 QA(stub), Profile transaction 실패/rollback QA, 단일 React 2–4 화면 렌더 QA 통과. Node DOM의 history traversal은 popstate 주입이며 실제 브라우저/실기기 성공으로 확장하지 않는다. 첫 QA selector 오류는 실제 .text-action selector로 정정하고 동일 QA를 통과했다.

로컬 대형 AI는 최신 사용자 지시에 따라 실행 전/중 PC 작업·RAM·VRAM·부하를 확인해 결정한다. 이번 RAM 여유0.95GiB/GPU0%에서는 실행하지 않았다. build/Node QA를 순차 실행했고 Node old-space256MiB 옵션은 전체 RAM hard limit가 아니다. 이전 미검증 SFT QA 수정/원본은 유지하고 이 기능 commit에서 제외한다. Git Integration/production은 실제 확인 후 기록한다. 다음은 R2 잔여 분기와 R3 실제 서비스 환경 확인이며 실제 서버 없는 상태를 완료 처리하지 않는다.

## 2026-10-11 단계3 — 원곡 mix 조건 실제 생성과 GPU 캐시 반환

단계3 실제 Part 기술 작업을 이어갔다. 동일 Base revision/FP32/seed65359/50-step/19초/세 줄 가사·caption에서 조건 입력을 원곡31.7–50.7초의 분리 반주에서 원곡 mix로 바꾼 시험이다. WAV SHA2569327cc0176f0153637d8925576ffd6ff941fd67a8d5cc420b096847297a7724c, 실제 UVR47.302초/합 residual0이다. Small/Turbo 모두0.976744이며 ‘오늘도 함께해요 우리 함께 걸어요 자 작은 노래 모아서’로 인식해 normalizedLyricsExact=false다. 실제 Small 줄 시작0/8.14/14.90초와 같은 원곡 창 대비0/−0.16/+0.90초를 관측했으나 첫 경계검열true/entryTimingAccepted=false를 유지한다. 실제 동시 voiced530frames/음높이 차이 중앙값−3반음/유니슨31.32%/낮은 frame63.58%/PCM상관0.039758과 실제 반주 chroma share0.078190은 화성 승인 근거가 아니다. 별도 energy 비교의 전체 최고 상관0.227589/lag+0.009977초와 구간별 최고lag0/+1.736054/−1.057596초도 음절 동기화나 고정 offset을 승인하지 않는다.

첫 생성은395.054초 뒤 WAV/latent/report를 저장했으나 마지막 출력 후 프로세스가 RAM약6GB를 유지하며 종료 지연을 보였다. WAV hash와 고유 명령줄/결과 경로를 확인한 이번 생성 PID39620만 종료했고 wrapper의 실제 오류는 GPU generation failed: -1이었다. 기존 CPU 작업/모델/원본은 보존했다. 이 실행을 정상 종료 성공으로 표시하지 않는다. RAM 약1GB 관측과 GPU host cache3150917760bytes 보관을 분리하며, 종료 지연의 단일 원인으로 단정하지 않는다.

cuda_disk_offload.py에 native offload 완료를 확인한 뒤 host cache만 반환하는 release_cuda_lossless_cache를 구현했다. weak reference로 cache group을 추적하고 전부 검증한 뒤 반환한다. native disk 가중치와 CPU 경로는 보존한다. generator는 GPU opt-in cache의 성공 저장 직전 반환 결과를 별도 gpuCacheRelease에 기록한다. 유지 QA의 실제 CUDA7회 출력/반환 후 GPU exact parity·disk byte 보존·반복 반환·정밀도 fallback·오류 후 재시도와 기존 CPU cache4회 exact 출력 검증을 통과했다. 같은 입력 재생성226.657초/전체312.601초/exit0/monitorErrors0/264samples에서 WAV SHA가 첫 결과와 exact 일치했고13groups/3150917760host bytes를 반환했다. 전체 GPU 사용량 최대5515MiB/75%는 다른 앱 포함이며 own peak2354321920bytes와 구분한다. 서로 다른 부하/준비 상태의 시간은 통제 속도 비교가 아니다.

확인된 추가 ‘자’를 줄이기 위한 native Repaint13.4–19초/선택 가사줄2 시험도 동일seed/50-step으로 실제 수행했다. mask[1,475,64]/335–475exclusive/hash ca53af3324fad10fe4f05f472fec6b844726cba14ec8b542ddc880eb3ac9d558, 출력 SHA2569f06c1ac8980862dc4983577a92b98c197afba23709235fb88215b21fd5c0948이다.173.665초/전체304.747초/exit0/monitorErrors0/host cache 반환을 확인했다. Small/Turbo 모두0.8/‘작은 도울에’로 마지막 줄을 인식해 정확한 가사는 실패다. 구간 밖 PCM도 rmsDifference0.024612/pcmExact=false였다. 자동0.8 통과를 품질 승인으로 올리지 않고 수동 splicing/가사 변경/임의 shift/transpose/catalog 등록하지 않는다.

새 결과/로그/spec는 repository 밖 .ieum-gpu-ssd-runtime에 보존한다. React·앱 음원·사용자 Track·디자인 worktree는 변경하지 않았다. Python3파일 문법/build34modules/Project audio contract/atomic submission QA 통과다. 이번 의미 있는 실행 환경 보완은 QA3파일과 현재 상태/계획 문서로 마감한다. 실제 정확한 가사·원곡 화음·진입·실기기 인수 및 개인 Identity 통합은 여전히 미완료이며 단계4/5 신규 구현으로 넘어가지 않는다.

## 2026-10-11 단계3 — 실제 보컬 에너지와 시간차 독립 대조

단계3을 유지한다. compare-ai-vocal-part.py의 opt-in acoustic-envelope-only는 기존 원곡/Part/분리 보컬 SHA256을 검증한 동일31.7–50.7초 창에서 실제 log RMS 변화의 상관을 측정한다(22050Hz, frame660/hop220, ±3초). ASR 텍스트를 입력하지 않으며 양의 lag는 후보가 원곡보다 늦다는 뜻이다. 기존 pitch/PCM/mask 분석 경로는 유지한다. 실제 baseline GPU50-step 후보의 전체 최고 상관0.207052/lag−1.915646초, 앞0–6초0.418015/−1.915646초, 중간6–12초0.299392/−1.945578초, 끝12–19초0.222550/+2.394558초다. 이 값은 활동 에너지의 관측이며 동일 음절이나 진입 승인·화음 적합성·고정 offset의 근거가 아니다. entryTimingAccepted=false/approvedEntryTime=null/catalogRegistrationApproved=false를 유지한다. 원곡·Part·Guide·앱 음원·디자인을 변경하지 않았다.

결과는 repository 밖 .ieum-gpu-ssd-runtime/results/baseline-acoustic-envelope에 보존했다. 별도 합성 검증 입력의 정확한 +0.498866초 지연을 상관1.0/동일 lag로 관측했다. 기존 결과 덮어쓰기 거부와 상충 모드 거부, Python 문법/build/Project audio contract QA를 통과했다. 첫 fixture 검사의 subprocess stderr는 Windows 비UTF8 오류 출력으로 UnicodeDecodeError/TypeError가 났다. 실제 결과를 보존한 채 UTF8 자식 프로세스와 byte 캡처로 동일 덮어쓰기/모드 거부 검사를 재실행해 통과했다. CPU 실행기의 기존 'Failed to find real location of C:\Python313\python.exe' 경고는 출력됐지만 실제 분석/검사는 exit0으로 완료됐다.

다음 잔여는 실제 가사·음절에 맞는 독립 Part 생성과 원곡 화성 검증이다. 독립 파형 분석에서도 현재 후보의 시간차를 하나로 승인할 수 없으므로 임의 shift/transpose나 QA 기준 완화로 앱 연결하지 않는다. 단계4/5 신규 구현은 진행하지 않는다. 실기기 마이크·청취 및 개인 Identity 최종 연결은 여전히 미완료다. 이번 묶음은 검증 도구/상태 문서만의 변경이며 앱 기능 추가나 단계3 전체 완료가 아니다.

## 2026-10-11 단계3 — 동시 직접 제출의 원자적 원본 보존

현재 실행은 단계3이다. 단계0 기준 보존 완료, 단계1 AI/개인 Identity는 기술 검증 범위만 통과, 단계2 기존3화면 통합은 있고 디자인은 별도 worktree에서 병렬 진행한다. 단계3 로컬 녹음·일시정지/재개·Draft·Review 직접 제출·2–4 Track Auto Mix/실패 원본 보존은 구현/자동 검증됐으나 실제 AI 가사/화음/진입·Identity 연결·실기기 인수는 미완료다. 단계4의 기존 탐색/저장/프로필 편집·복귀 부분 구현은 보존하며 잔여 통합/전수 검증, 단계5의 실제 인증·공유 저장·원자적 초대/배정·결과 공유·7일 Push, 단계6의 종합/실기기 인수가 남았다. 단계3 전체 gate를 축소하거나 다음 단계 신규 구현으로 넘어가지 않는다.

기존 제출 경로는 loadTrack 확인과 saveTrack 쓰기가 별도 transaction이므로 두 탭의 동시 최초 제출이 먼저 저장한 원본을 덮을 수 있었다. trackStore.js의 saveSubmittedTrack는 같은 readwrite transaction에서 조회/최초 저장을 수행한다. 이미 live-microphone-recording 원본이 있으면 그 결과를 반환하며 Part/프로젝트/원본 Blob을 확인한다. 일반 saveTrack와 Profile 편집/범용 저장은 변경하지 않는다. App.jsx는 제출 저장 호출과 반환된 원본의 재생 URL만 변경한다. 제출 상태와 재생 음원이 같은 committed Track을 참조하며 상대 탭의 성공 원본을 새 Draft URL로 잘못 표시하지 않는다.

새 qa:submission 검증은 동시/반복 제출 원본 보존, Part 독립, 실제 첫 제출의 기존 demo 교체, 쓰기 실패 rollback/재시도/다른 원본 보존, 잘못된 ID/빈 원본 거부를 통과했다. IEUM_QA_SOURCE_URL=http://127.0.0.1:4201/에서 두 실제 브라우저 탭/각각의 native IndexedDB 연결이 같은 먼저 저장된 원본을 반환했고 반복 제출·기존 Draft 보존을 확인했다. 이 URL은 소스 모듈을 읽을 수 있는 dev 전용 native QA 옵션이며 production에 /src 모듈이 있다고 간주하지 않는다. 같은 기기의 로컬 원자성 검증이며 단계5의 다중 사용자 서버 완료가 아니다.

build34modules, Track store/프로필 transaction QA, 정상 실제2–4 Track/19초 등록 반주 Mix·재로드, recorder session/마이크 오류/실패한 retake 원본 유지/프로젝트 화면 연속성 QA를 통과했다. Draft QA 첫 실행은 작업실 진입 매개변수가 없는 URL에서 record-part selector timeout으로 실패했다. 기존 작업실 진입을 요구하는 동일 QA를 ?design=figma URL에서 재실행해 소유자 없음/본인/다른 사용자 원본 보존·폐기·재진입 모두 통과했다. synthetic microphone/격리 DB 결과를 실기기 녹음/청취/시각 인수로 표시하지 않는다.

디자인 worktree와 assets/styles/Record renderer는 변경하지 않았다. src/App.jsx의 기능 hunk는 제출부에만 제한했으며 별도 디자인 branch 통합 시 이를 보존해야 한다. CPU/GPU 모델과 실제 음원 원본·실패 결과는 유지한다. 이 기술/기능 보완 묶음은 검증 후 main Git Integration으로 배포하며 단계3 전체 완료와 구분한다.

## 2026-10-11 단계3 — 손상된 Track 정렬 값의 실패·원본 보존

현재 단계3이다. 디자인은 별도 codex/ieum-design worktree에서 진행하며 이번 기능 작업은 main의 src/audio.js와 유지 QA만 수정했다. 새 IA/화면/스타일·Identity 형상·AI 음원은 변경하지 않았다.

실제 Track의 syncOffsetMs가 음수/NaN/Infinity/문자열/실제 디코딩 길이 이상이면 녹음 Guide·Current Mix·Preview Mix·Auto Mix를 성공 처리하지 않는다. null/누락은 기존0초 호환을 유지한다. 이전 Auto Mix는 과도한 offset을 마지막0.01초로 조용히 clamp했고 다른 경로는 native 재생 오류/잘못된 길이를 만들 수 있었다. 실제 decoded duration 기준 공통 검사를 추가하고 검증된 값으로만 offline source를 예약한다. Guide 오류는 기존 startRecording 오류 정리 경로에서 마이크를 종료하며 Take/Track 원본을 변경하지 않는다.

qa/verify-audio-lengths.mjs의 실제 Web Audio 실행에서6종 잘못된 offset × Current/Preview/Auto의18건 거부, 잘못된 Guide의 마이크 정리/Take 미생성, source hash 보존을 통과했다. 정상35초 Track/2초 Track 재생, 실제19초 AI 반주 전체와 끝부분 유지, 짧은 preview2초도 통과했다. recorder session 동시Start/Resume/Stop·Review 보존, audio foundation pause/resume·peak 검증 및 build34modules 통과다. synthetic microphone/격리 DB 검증이며 실기기 음질·지연을 확인한 것이 아니다.

이 묶음은 단계3 원본 보존 보완이다. 정확한 AI 가사/화음/진입·실기기 인수와 개인→Track→Project 통합은 미완료이며 단계4/5 신규 구현으로 넘어가지 않는다. 모델·CPU/GPU 환경·실패 결과와 디자인 worktree를 보존한다. QA 서버는 npm port 인자 누락/4196 점유를 확인한 뒤 기존 서버를 건드리지 않고4201의 직접 Vite CLI에서 실행했다.

## 2026-10-10 기능 잔여 판정과 동일 구간 정렬

현재 단계3을 유지한다. 단계0 기준 보존 완료, 단계1 P0 기술 검증/데이터 계약은 통과 범위만 보존하며 개인 Identity 최종 통합은 미완료, 단계2 기존3화면 통합은 있고 디자인 인수는 보류다. 단계3 로컬 녹음·임시본·직접 제출·실제2–4 Track Auto Mix/실패 보존은 자동 검증됐지만 실제 AI Part/화음/진입과 실기기 청취는 미완료다. 단계4 탐색·저장·Profile 편집·복귀의 기존 부분 구현을 보존하며 전체 경로/Identity 통합은 미완료다. 단계5 인증·공유 서버·원자적 초대 배정·결과 공유·7일 Push는 미구현이며 단계6 종합/실기기 인수는 미완료다. 단계를 통째로 완료 처리하거나4/5 신규 구현을 앞당기지 않는다.

실제 src/matching.js의 measured range/tessitura Gate, App.jsx의 Finder/Match/OtherProfile/Collection/편집/공유 진입, src/projectService.js의 local capabilities와 명시 HTTP transport를 확인했다. api/ 구현은 없으며 stub service QA와 Voice Identity 입력 계약 QA는 통과했다. 이는 실제 서버 연결이나 생성된 개인 형상 승인 증거가 아니다. 기존 구현을 다시 만드는 범위는 제외한다.

일정은 잠정 작업 규모 추정이다. 디자인·Profile 이미지 보류를 제외하고 실제 서버 환경이 제공될 때 기능 구현/통합/검증에 약2–4주를 예상한다. AI 가사·화음 제어 가능성, 인증/저장/Push 환경과 실제 기기 피드백에 따라 달라지며 완료 보장/확정 납기/진척률이 아니다. 보류된 그래픽 정책과 서버 준비가 해결되지 않은 전체 제품 출시일은 산정하지 않는다.

qa/align-ai-provided-song.py에 별도 output-dir에서 원본 가사 줄의 정렬된 고유 index를 선택하는 진단을 추가했다. 가사를 ASR 입력으로 강제하지 않고 원본/기존 검증 hash를 확인하며 subset/full와 분석 창을 기록한다. 실제 원곡31.7–50.7초/원래 index2·3·4/Whisper-small 결과는 가사1.0·모든 줄7/7, 원곡 절대 시작31.7·40.0·45.7초다. SHA256b776f0ddb68b5ca412daaeacf1b4bf9ee4731c20d136b1999ae319b82000fafe의 별도 정렬 결과를 기존 GPU 후보와 대조했다. 같은 창에서 원곡 상대0·8.3·14.0초 / 후보0·6.9·12.02초이며 뒤 두 줄 차이는−1.40/−1.98초다. 첫 단어는 양쪽 모두 분석 경계에 붙어 실제 첫 진입을 판정할 수 없다. 기존 긴 창의−2.12초를 확정 오디오 offset으로 사용하지 않는다. 근사 정렬·낮고 다른 pitch는 화성/음절 동기화 승인이 아니며 Guide/음원을 shift하지 않았다. 앞 문맥29.0–50.7초 추가 정렬도 실제 실행했다. 이전 줄 끝까지 인식돼 유사도0.857143이며 선택3줄은모두7/7, 시작33.56·40.58·47.28초, 첫 경계검열false/후보33.56초다. 같은 원곡도 창 문맥에 따라 줄 후보가 달라지므로 이는 acoustic onset 승인이나 정확한 시간축 shift 근거가 아니다. entryTimingAccepted=false를 유지한다. 기존 결과 덮어쓰기 거부/hash 보존과 역순 index의 모델 로딩 전 거부, Python 문법/build/계약 QA를 통과했다.

현재 독립 작업은 분석 문맥 차이를 분리하는 실제 검증까지 진행했다. 앞 문맥 추가의 ASR 진단까지 완료했으며 다음 기술 검증은 첫 진입의 독립적인 음향 대조와 실제 원곡 화성/음절에 맞는 Part 제어다. 모델이 이 조건을 동시에 충족하는지는 미검증이며 seed 반복이나 QA 문턱 변경으로 완료를 대체하지 않는다. 이번에는 앱/asset/디자인을 변경하지 않았고 원본 CPU/GPU 결과를 보존했다.

## 2026-10-10 단계3 후속 — 구간 가사와 원곡 시간차 진단

현재 단계3이다. GPU/SSD 실행 및 구간 복원 진단 묶음은 검증했지만 제출 가능한 새 Part는 미완료다. 이번 작업은 QA 도구와 현재 계획/상태 기록만 수정했다. React 화면, 제공곡, 사용자 Track, Guide, catalog는 유지하며 단계4/5·디자인·Profile 이미지는 시작하지 않았다.

### 실제 GPU 비교 결과

모든 시험은 같은 Base revision e432212fec32b8965a14ffa57ae653438d6abd14, FP32 계산, seed65359, 19초, 50-step, 기존 세 줄 가사를 유지했다. Small/Turbo 유사도는 기존 자동 QA 경계0.8과 정확한 가사를 구분한다. 아래 후보의 normalizedLyricsExact는 모두 false이며 등록하지 않았다.

| 시험 | 추론 / 전체 초 | Small / Turbo | 판정 |
| --- | --- | --- | --- |
| 종결음절 발음 지시 추가 | 374.311 / 1039.069 | 0.900 / 0.900 | ‘요’ 누락, ‘노래’ 오인식 |
| 원곡 ASR 추정 시간 배치 지시 | 132.787 / 338.668 | 0.900 / 0.900 | 같은 가사 오류, 시간 지시만으로 해결되지 않음 |
| 후보 mix의 native Lego 6–11.7초 mask | 157.942 / 241.074 | 0.975610 / 0.975610 | ‘걸어’로 인식, 마지막 ‘요’ 미확인 |
| 동일 mask의 native Repaint | 122.578 / 190.481 | 0.790698 / 0.809524 | ‘요’는 인식하나 ‘우리 함께’가 다른 가사로 바뀜; Small 자동 QA 실패 |
| Repaint의 선택 줄만 modelLyrics 입력 | 141.456 / 245.772 | 0.952381 / 0.837209 | Small ‘걸어로’ / Turbo ‘가려놓은’; 정확한 가사 미확인 |

원곡 반주 조건 시험은 실제 원곡31.7–50.7초를 사용했다. 구간 복원 세 시험의 직접 부모는 기존 GPU50-step 후보 WAV SHA2568b7104554f057d68936c31459fce726702cb6b37dce2bfa2b57e36ae315bb0df/report SHA256d76ad5c4c5f4b7b0b8c0f60cf46b85a74fe1f00fdc9190635c5f8b81449b6a84다. 원곡과 중간 후보의 계보·입력 창·부모 report hash를 구분했다. 결과 SHA256은 순서대로 80205ff8950af5869914b2997a599f67b4cb0752624ba35ae3fcb1040f903141 / 0391c300fb33537a4438bd02fc1c3bea6a7af59c9ccf091da6d4e208077e5161 / 2196a74fa465caa230b263f23265e0214cac10dd93020ea6130957018a0b23df / 2cedee630403a1a89ea9fd9dc98ce436d488a7366455c8139f4af0388fbca6ca / b2fa2414b671562ff16c85c2d487d078b710dec59a4ee54428acf88091fe6b96다. 생성 monitorErrors는 모두0이며 원본/실패/자동 QA 근사 통과 결과를 전부 보존했다.

실제 native mask는 [1,475,64], 25latent/s, active150–292 exclusive, SHA256cd9167becf439080b6abe45c0ac2e1b3b5d9c4bd81b0907c867e18b3c8392544다. 요청6–11.7초의 latent 양자화 끝은11.68초다. native Lego는 선택 구간의 source latent를 유지하고 Repaint는 그 구간을 학습된 silence latent로 조건화한다. 실제 디코딩 PCM은 세 시험 모두 구간 밖도 달랐다. 앞/뒤 RMS 차이는 Lego0.029509/0.030803, Repaint0.037951/0.038646, 선택 줄 Repaint0.028155/0.029896이다. outsideGenerationWindowPcmPreserved=false이며 수동 splicing으로 보존됐다고 처리하지 않았다. 구간 밖 비교 대상이 없는 전체 mask는 이 값을 null로 기록한다.

마지막 후보 실제 UVR49.051초/합 residual0, vocal SHA256b6402e6cca45d429de04a2738ac2ed6f9e00388253402f3760346509b14604ef다. Small 단어 정렬0.952381, 각 줄7/7·6/7·7/7, 시작0·6.20·12.10초이며 firstWordBoundaryCensored=true, entryTimingAccepted=false다. pYIN439 confident frames, 관측44.6–62.4 MIDI/tessitura54–60이며 요청 Key/BPM을 확정하지 않았다. 두 ASR의 정확도와 음역 관측만으로 화음·실제 진입·catalog를 승인하지 않는다.

### 실행 환경과 검증 도구

실제 저장장치는 C Samsung970EVO SSD / D ToshibaHDWD120 HDD다. 사용자 확보 공간에 별도 .ieum-gpu-ssd-runtime/base-diffusers를 복사했으며20파일12652685939bytes의 SHA256이 D 원본/기존 변환 계보와 모두 exact 일치했다. 복사276.956초/해시 검증130.320초다. CPU 환경·D 모델·결과·다른 작업은 보존하고 C 모델/cache/result도 repository 밖에 둔다. GPU 계산은 FP32이며 BF16은 정확히 왕복 가능한 host weight 저장에만 사용한다. 서로 다른 prompt/시스템 부하의 시간을 SSD 통제 benchmark로 표현하지 않는다.

실제 tokenizer 감사: 기존/발음 추가/시간 배치 caption170/218/214 tokens, lyrics34 tokens, native 제한256/2048 내로 모두 잘리지 않았다. 가사 오류를 truncation으로 단정하지 않는다. 기존 후보6.0–11.7초 구간 ASR도 ‘우리 함께 걸어’/0.923077로 인식했다. ASR 결과만으로 실제 음절 부재를 단정하지 않는다.

qa/verify-ai-provided-song.py에 별도 output-dir·실제 구간·원래 가사 줄 선택·정확 일치 여부·기존 결과 덮어쓰기 거부를 추가했다. 저장 경로/model output 변수 충돌 AttributeError는 이름을 분리해 수정했고 실제 재실행/overwrite 거부와 기존 결과 hash 보존을 확인했다. qa/compare-ai-vocal-part.py는 실제 반주 hash/F0 시점 chroma, 두 실제 정렬의 줄 시간차, native mask와 구간 안팎 PCM 차이를 각각 기록한다. 기존 후보의 원곡 줄 시간차−2.12/−1.70/−2.28초와 median chroma share0.171344는 관측이며 확정 acoustic onset·화음/Key·자동 shift/Guide 타임코드가 아니다. 원곡 전체와19초 창의 ASR 문맥 차이도 남아 있다.

generator는 native Repaint를 Base CUDA FP32/명시적 mask의 진단용 opt-in으로 제한한다. CPU 기본 경로와 CPU 전용 cache를 유지한다. 선택 줄 modelLyrics와 전체 기대 lyrics를 구분하며 부모와 전체 가사가 같은지 검증한다. 실제 세 가지 잘못된 입력(한쪽 mask, mask 없는 선택 줄, CPU Repaint)을 모델 로딩 전에 거부했고 output을 생성하지 않았다. 기존 ASR0.8 기준, seed, 원곡 음높이, 제출/Auto Mix 성공 조건을 변경하지 않았다.

유지 QA: production build, Python4파일 문법, Project audio contract, 실제 제공3곡 asset/hash·Guide·합성 Take·입력 오류/재시도, 반주 gain3곡, microphone session/timer·동시Stop Review 보존 통과. 초기 localhost EACCES4195/Edge temporary path permission 실패는 승인된 실행 환경과4197 preview로 동일 QA를 재실행하여 통과했다. synthetic microphone/native audio 결과를 실제 마이크·청취로 확장하지 않는다.

### 남은 완료 조건과 다음 작업

정확한 세 줄 가사, 실제 원곡 화성/음절 동기화, 첫 진입과 count-in 승인, 실기기 녹음/청취 검증이 남았다. 현재 원곡/Part/Guide를 승인하거나 완료된 단계로 변경하지 않는다. 반복 seed나 임의 transpose·QA 문턱 완화로 우회하지 않는다. 다음 독립 기술 작업은 같은 원곡 창에서 ASR 문맥과 실제 가창 진입을 대조하고, 원곡 화성에 맞는 Part 제어 가능성을 검증하는 것이다. 검증된 음원만 기존 catalog/Guide 흐름에 연결한다. 공유 서비스와 비용·성능 정책은 기존 미결 상태를 유지한다.

이번 변경은 QA/문서6파일의 의미 있는 기술 검증 묶음으로 diff/staged diff 검토 → commit → main push → Git Integration 배포 commit 일치 → Production QA 순서로 마감한다. 이 기록은 단계3 전체나 실사용 Part 완료를 뜻하지 않는다.

## 2026-10-10 단계3 후속 — 별도 GPU 실행 환경 검증

최종 GPU 선행 검증: 같은19초50-step/기존가사완료spec/seed65359도GPU FP32 생성 성공(SHA2568b7104554f057d68936c31459fce726702cb6b37dce2bfa2b57e36ae315bb0df). 추론253.996초/전체527.117초, 이전 같은50-step CPU618.159초 대비 관측 추론 시간 약2.43배다. own allocated peak2354321920bytes/reserved3214934016bytes, NVIDIA전체 VRAM5566MiB·최대사용률63%/462samples/monitorErrors0. 초기 model/hash/disk/cache 준비 비용은 추론과 구분하며90초/batch/production 추론 service를 검증한 것으로 확장하지 않는다. CPU 환경/모델/결과·현재 앱과 음원을 보존한다.

실제50-step UVR50.190초/합 residual0, vocal SHA256069ac7e8dbdc397e790a73e5f6768008490a7c51597d4e57b7620f6aa3b4b06f/RMS0.131006·잔여 RMS0.002513. Small/Turbo 모두가사0.975610/자동 QA 통과지만 둘 다‘걸어요’를‘걸어’로 인식했다. 실제 Small 단어 정렬0.975610/각줄7/7·6/7·7/7/시작0·6.9·12.02초/범위·순서 검증 통과. firstWordBoundaryCensored=true/entryTimingAccepted=false/catalogRegistrationApproved=false 유지. 관측49.5–62.4 MIDI/tessitura51–60. 실제 동일 원곡31.7–50.7초 vocal과181개 voiced pair는 중앙값-6.9반음/96.13% 낮음/near-unison1.10%/PCM상관0.002509다. 실제 낮고 다른 Part의 증거이며 syllable/chord/Key 검증이나 최종 화음 승인으로 바꾸지 않는다. qa/compare-ai-vocal-part.py는 원본·stem 해시와 actual source window를 확인하고 원본 transpose/가짜곡Key/제출 수 변경 없이 측정한다. 결과/실패/정렬 원본은 D runtime에 보존한다.

GPU 환경 연결·짧은 실제 생성/메모리/속도·수치보존 기술 묶음은 완료했다. 단계3 전체/제출 가능한 완성 Part는 미완료다. 다음 구현 선행 조건은 누락된 종결음절·실제 첫 진입·원곡 화성의 확정이며, 서로 다른 seed를 반복하거나 QA 문턱을 낮추어 완료하지 않는다. 다음 단계4/5·앱 catalog/Guide 연결·디자인 변경은 시작하지 않았다. GPU 사용은 검증용 opt-in이며 CPU 기본 경로를 유지한다. 현재50-step 실행·분리·ASR·정렬·source 비교는 모두 종료됐다.

선행32-step 결과: GPU FP3219초32/32 실제 생성 성공, SHA2567233bcab808265ccb9e1182684ebd3f6d60aee0c1e6f9fae643651492a335276. 추론215.497초/전체493.163초이며 기존 같은19초32-step CPU402.183초 대비 관측 추론 시간 약1.87배다. 다른 torch/CUDA random stream·환경 부하는 통제 benchmark나 음원 동일성으로 주장하지 않는다. own allocated peak2354076160bytes/reserved3206545408bytes, NVIDIA 전체 VRAM5575MiB·사용률83% 최대/426samples/monitorErrors0다. GPU cache13groups/476tensor는 원래6301835520bytes를 정확히 왕복 가능한3150917760bytes로 보관하며 계산은FP32다. 실제 GPU forward6회·원래 형식 fallback·잘못된 training 거부 후 재시도·one-shot 출력 exact/CFG null parameter와 buffer 보존·기존 파일 보존 QA 통과. 실제 저장된 text encoder/tokenizer의 가사 embedding CPU/GPU exact, contextual hidden state 최대차9.5367431640625e-05로 tolerance 검사를 통과했다.

UVR 실제 분리49.641초/합 residual0, vocal SHA2566ef7c797f98b9c91e5c7f79e28374476510aa14547be0de3eb0539718ccd7444/RMS0.176135, 잔여 RMS0.005359다. Small robust 가사 인식은 빈 결과/유사도0/미통과, Turbo robust0.857143/자동 경계 통과이나 첫 줄 ‘우리 함께 해요’와 마지막 줄 ‘작은 노래 모 모아서’로 요청 가사와 다르다. pYIN 관측65.3–71.3 MIDI/tessitura66–71이며 요청 낮은 화음·정확한 가사·진입/catalog 승인은 없다. GPU 생성 성공을 실사용 Part 성공으로 바꾸지 않는다. 이후 기존50-step 가사 완료 지시 spec/seed65359의19초 GPU 교차 시험을 수행했으며, 앱/음원/사용자 원본은 변경하지 않았다.

아래는 각 시점의 실패·중단·수정 이력이며 최신 판정은 위 결과를 따른다.

앱 화면·음원·catalog는 변경하지 않았다. NVIDIA GeForce GTX 1660 SUPER의 실제 VRAM은 nvidia-smi 기준6144MiB, driver572.16, compute capability7.5다. WMI AdapterRAM의4GB 값은 VRAM 판정에 사용하지 않는다. 기존 CPU Python의torch2.14.1+cpu/CUDA 불가 상태를 보존했다. D:/IEUM-model-runtime/gpu-2026-10-10의 별도 venv에torch2.8.0+cu126을 설치하고 실제 CUDA FP32 행렬 계산·ACE-Step import를 확인했다. GPU torch가 자체 site-packages에서 로드되고 기존 CPU 의존성은 읽기 전용 참조한다. 원본 CPU 모델·결과는 유지한다.

첫 설치는 C 임시 공간 부족 OSError[Errno28]로 실패했고 D의 프로세스 한정 TEMP/TMP로 재실행하여 설치를 완료했다. 이후 사용자가 C 공간을 확보했으며 실제 여유83GB를 확인했다. CUDA 지원 확인은 음악 생성 성공이나 가사·화음 승인과 구분한다.

GPU 생성의 첫 VAE 오류는 CUDA 입력/CPU weight 불일치였다. legacy weight_norm의 사전 hook과 native Diffusers onload 순서를 확인했다. from_pretrained 후 cached weight가 Meta인 두 번째 검증 오류는 실제 loaded weight_g/weight_v의 native compute_weight를 기준으로 정정했다. native remove_weight_norm 전후74개 실제 normalized weight exact 일치를 확인했으며 모델 디스크 파일은 변경하지 않았다.

FP32 native leaf RAM 및 disk offload19초 시험은 첫 단계 지연과 RAM 여유383/834MB를 확인하여 해당 GPU PID만 종료했다. 각 monitor JSON/캐시/원본을 보존했으며 생성 성공으로 처리하지 않는다. FP16 leaf disk4초 시험도 첫 단계 지연으로 보존 종료했다. 현재 native CUDA block offload FP16의 별도4초/32-step 시험을 진행한다. 실제 출력·속도·own VRAM peak·가사/음역/화음 검증은 아직 미완료다. CPU 전용 monkeypatch/cache를 GPU에서 호출하지 않으며 CPU float32 기본 경로를 유지한다.

production build, CPU lossless cache exact 출력4회·fallback·재시도·기존 파일 보존, 별도4197 build 서버의2–4 Track Auto Mix/reload·반주 오류·변경된 입력 제출 거부·Draft 보존 QA를 통과했다. 샌드박스 임시 파일 권한 오류/Edge 종료,4196 QA timeout, npm preview 인자 오류 및4196 사용 중 오류는 최초 실패와 구분해 기록한다. 동일 QA를 승인된 환경/기존 포트를 보존하는4197에서 통과했다. 실제 모바일/마이크·새 음악 품질·새 commit 배포 증거를 대체하지 않는다.

FP16 block4초 시험은32/32 계산을112.6초까지 완료했으나 출력 finite 검사에서 실패했다. 저장된 latent[1,100,64] 전체6400개가NaN으로 실제 확인되어 디코딩만의 오류나 성공 음원으로 처리하지 않는다. monitor wall965.678초에는 모델 계보 검사·FP16 변환 로딩이 포함된다. FP16 적용은 미승인이다. 이후 native disk offload가 CPU에 full-size empty placeholder를 남기는 코드를 확인했다. 별도 qa/cuda_disk_offload.py는 CUDA onload 그룹의 persisted tensor만0-element CPU storage로 해제하며 CPU inference hook/cache는 사용하지 않는다. qa/verify-cuda-disk-offload.py의 실제 CUDA forward3회/CPU 기준1e-5·1e-6 tolerance 일치/빈 CPU placeholder/기존 sentinel 보존을 통과했다. 이 경로로FP3219초/32-step 실제 재시험 중이다. step별 finite 검사로 유효하지 않은 latent를 즉시 거부한다.

## 2026-10-10 단계3 후속 — 실제 Part 지원 모델과 원본 검증

현재 실행 위치는 단계3이다. 새 45초 오리지널 후보를 실제 ACE-Step Turbo로 생성(253.268초)하고 UVR 분리·Whisper-small 검증을 수행했다. 원본 SHA256 d9b56c90da12e6ef177dce7d851095155250a870b09dca338b3f2cbbcb46a374, 문자 유사도0.645833/lyricAcceptance=false다. 요청하지 않은 가사와 누락을 확인했으므로 앱 곡으로 등록하지 않았다. 실패 결과와 이전 원본은 보존한다.

같은 후보의 Turbo audio-conditioned Part 시험(434.409초)은 원곡 보컬과 PCM 상관0.977955, 반주0.948430, 같은 관측 음역54.7–62.2 MIDI로 독립 Part 증거를 확보하지 못했다. API 인자 존재를 모델 지원으로 간주한 판단을 정정했다. 공식 pinned 모델 카드와 실제 config를 대조하여 Turbo의 Lego 미지원을 확인했고, generator가 Turbo Lego와 검증되지 않은 Base 실행을 모델 로딩 전에 거부하도록 보완했다. 이 실패 후보는 Part/Track 제출·catalog 성공으로 취급하지 않는다.

공식 Base revision e432212fec32b8965a14ffa57ae653438d6abd14를 별도 D:/IEUM-model-runtime/base-2026-10-09 런타임에 보존했다. raw weights SHA256 4177f600501a6d4bd81cadaa0abac557ffd15c54e5c8cb52053cdb24a0844d6b와 변환한677개 tensor 및 silence buffer의 float32 exact 일치를 실제 검사했다. qa/verify-ai-music-conversion.py로 변환 계보·component hash를 검증하며 기존 Turbo/앱 asset은 유지한다. 첫 검증의 buffer 위치 가정 오류는 실제 converter를 확인하여 condition_encoder로 정정한 뒤 전체 검사를 통과했다.

실제19초 Base 시험은 disk offload에서 단계당296.8/275.5/306.4초를 관측했다. 해당 생성 프로세스만 종료하고 원본·시험 산출물을 보존했다. opt-in lossless CPU cache는 BF16 왕복 후 원래 FP32 tensor와 정확히 같은 값만 작은 형식으로 RAM에 보존하며 나머지는 원래 형식을 유지한다. native Diffusers offload forward4회 exact 출력, 정밀도 민감 tensor fallback, 잘못된 training 호출 거부 후 재시도 및 기존 파일 보존 QA를 통과했다. CPU 캐시는 기본 생성 경로에 자동 적용하지 않는다. 실제 Base 재시험은 기존 AI 곡의31.7–50.7초 원본을 조건으로32-step Lego를 사용한다. 요청 음역/Key/BPM을 측정값이나 확정 편곡으로 취급하지 않는다.

Part 분석에서는 분리 잔여 반주로 곡 Key/BPM을 확정하지 않도록 null로 구분한다. 실제45초 원곡 분석 재실행은 기존 JSON과 exact 일치했다. 다음 검증은 지원되는 Base 실제 출력의 가사·음역·원곡 중복/Part 차이 확인이며, 통과 전 새 catalog/asset 등록을 하지 않는다. 개인 형상·디자인 보류, 실제 가창/청취·서버·단계1/3 잔여 조건을 유지한다.

실제 Base19초 첫 시험은32/32 계산과442.723초 추론을 완료했다. 원본 SHA2567ccfc78540fc140c8b4062012355e6e39048b6c6c2deb07eac0bcb515cbbe982, UVR vocal RMS0.130078/잔여 RMS0.002589, Whisper-small 가사3줄 유사도1.0·시간 범위 통과다. 관측 음역53.9–62.2 MIDI, 원곡 같은 구간 보컬 PCM 상관0.923408(저해상도 지연 대조 최대0.955311)로 새 화음 Part는 미승인이다. 실제 캐시13그룹/476tensor는 원래6301835520bytes에서3150917760bytes로 정확 복원 가능한 저장량을 줄였다. 지원 모델 실행·가사·보컬 분리는 검증됐지만 독립 화음은 검증되지 않았다. 원곡 보컬 포함의 영향을 확인하기 위해 실제 분리 반주만 조건으로 사용하는 시험을 이어가며 원곡/반주 각각의 해시와 source window를 구분하여 보존한다.

반주만 조건으로 한 두 번째 Base19초 시험도32/32·402.183초 추론 완료(원본 SHA25679d7b77669ce6fbb09059b43615e880e64f734ba40fd5bb949e32d3140433c81)했다. 실제 반주 입력 SHA256e4a4f50f40b178d53c491b77aa6ebcd8533d74367bc28f6b02f67dc1431dbbfe를 별도로 검증했다. 원곡 대비 보컬 PCM 상관0.002871, 동시 confident296frame의 pitch 차이 중앙값−2.2반음·반음 이내13.18%로 반복 멜로디와 구분되는 결과다. 그러나 Small 가사 유사도0.555556/exit1, 독립 Turbo0.685714/exit1이며 모두 마지막 요청 가사를 인식하지 못했다. 실제 음역49.1–60.5 MIDI, UVR 잔여 RMS0.001551이다. 차이는 화성 적합성/가사 타이밍 승인과 다르며 두 ASR 실패를 보존하고 Part/catalog 등록은 하지 않았다. 지원 모델·입력 분리·변환 정확도·실행 성능의 기술 묶음은 검증했지만, 새 화음과 동일 가사/진입을 동시에 충족한 실사용 Part는 아직 없다. 다음 실제 생성 검증은 가사 시간 배치와 모델 조건/step을 함께 검토하며, 임의 transpose·곡명/Key 승인·QA 임계값 변경으로 이 조건을 대체하지 않는다. 앱 화면/음원/사용자 원본은 변경하지 않았다. build·전체 유지 Node QA·Python5파일 문법·native cache 재검증 통과다.

세 번째 시험은 반주 조건과 가사 완료 지시를 유지하며 Base50/50·618.159초 추론을 완료했다(원본 SHA256d9d63511d1ec0c333e42f13a3059169ff95ac936445ad51d0cc4a7fb6d4c4c87). Small/Turbo 전체 가사 유사도는 모두0.800/exit0으로 자동 경계를 통과했으나 마지막 줄을 각각 ‘작은 뭐했어’/‘작은 모에서’로 인식했다. 실제 Small 단어 정렬 유사도0.85/alignmentAccepted=true이며 앞 두 줄7/7·마지막 줄3/7문자만 일치한다. 줄 후보0/6.14/13.68초, firstWordBoundaryCensored=true·entryTimingAccepted=false·catalogRegistrationApproved=false다. 음역49.9–62.2 MIDI/tessitura53–58, UVR 잔여 RMS0.003741이다. 자동 전체 유사도/근사 정렬 성공은 마지막 가사의 정확성·화성·실제 첫 진입 승인과 구분한다. 실제 제출 가능한 Part나 곡 등록은 미완료로 유지한다. 여러 seed 반복만으로 성공을 보장할 수 없으므로 다음 작업은 실제 가사/선율 시간 배치의 조건 표현과 화음 제어 가능성 검증이며, 승인 없이 임의 음높이 이동/Key 지정으로 완료하지 않는다. 이번 실제 생성·분리·ASR·단어 정렬 과정은 모두 종료했고 원본/실패/근사 통과 결과를 보존했다.

## 2026-10-09 단계3 후속 — 실제 가사 구간 대조와 진입 승인 분리

현재 단계3을 유지한다. qa/align-ai-provided-song.py에 별도 output-dir, 실제 분석 구간과 원곡 절대 타임코드 보존, 기존 결과 덮어쓰기 거부, 단어 시간 범위/순서 검사를 추가했다. 문자 정렬과 첫 진입·catalog 승인을 구분한다. 분석 시작 경계에 첫 단어가 붙으면 firstWordBoundaryCensored=true, entryTimingCandidate=null이다. 모든 자동 결과의 entryTimingAccepted=false/approvedEntryTime=null/catalogRegistrationApproved=false를 유지하여 문자 유사도만으로 실제 가사 진입을 승인하지 않는다.

기존 실제 천천히 함께90초 원본 SHA256 7ef11d5e7d574134154c7fddc3022654feec474ac5cba70ed24c606232ca0eb9와 vocal SHA256 b2f4d47811276a4254fa17c694395e7ddb10b30df853c6c31070ac229b9dcd25를 검증했다. 기존 관측의 지속 voiced 후보17.949초와 전체 가사 종료72.34초를 포함하는16–78초를 실제 Whisper로 분석했다. Small 구간 문자 유사도0.941176·8줄 매칭·단어 시간 범위 통과, 같은 구간 재실행의 실제 단어/가사 결과 exact 일치. 첫 단어16–18.92초가 분석 경계에 붙으므로 실제 진입은 미승인이다. 기존 보고서를 다시 쓰려는 실행은 FileExistsError: Preserve existing alignment evidence로 거부됐다.

Turbo 대조 첫 실행은 선행 전체 보고서 vocal-validation-report-turbo-robust-seek.json 부재의 FileNotFoundError로 실패했다. 우회하지 않고 실제 전체90초 Turbo를 먼저 실행하여 문자 유사도0.903226/timestampsWithinAudio=true/lyricAcceptance=true를 확인했다. 이어 실제16–78초 Turbo 단어 정렬은 요청하지 않은 자막 문장 인식으로 유사도0.741722/alignmentAccepted=false/exit1이다. 첫 단어도16초 경계이고 첫 진입은 미승인이다. Small 결과와 Turbo 실패를 runtime/results의 서로 다른 경로에 보존하며 모델 입력 가사를 주입하거나 임계값을 낮추지 않았다.

앱 build와 전체 유지 Node QA 및 Python 문법 검사 통과. 앱 코드·음원·디자인·사용자 Track/Profile은 변경하지 않았다. 다음 잔여는 실제 곡의 신뢰 가능한 가사 진입/Part별 실제 편곡·음역·Key 검증 및 기존 catalog 등록이며, 신규 단계4/5로 건너뛰지 않는다. 실제 마이크/청취·개인 형상·서비스 조건은 유지한다. 이 작업은 검증 도구 보완이며 새로운 사용 가능 곡 등록 완료가 아니다.

## 2026-10-09 단계3 — Project 반주 연결과 녹음 입력 계보

현재 실행 위치는 단계3이다. 단계0 보존 기준과 이전 검증 범위는 유지한다. 단계1 개인 식별/Track 변형/Project 결합 및 단계2 디자인 인수는 미완료/보류다. 신규 디자인·프로필 이미지·별도 앱은 만들지 않는다.

기존 앱의 Project별 `audioSource`를 검증해 Recorder Guide, Workspace Current Mix, 제출 성공 뒤 Auto Mix에 실제 backing Blob을 전달한다. source kind=project-arrangement, songId, 현재 Key, revision, 실제 duration, 원본/반주 SHA256과 허용 asset 경로를 검사한다. Profile 제공 Sample을 Project로 자동 전환하지 않는다. 반주 없는 기존 Project는 기존 경로를 유지한다. 녹음 시작 시 입력 참조를 snapshot으로 잡아 Draft→직접 제출 Track→최종 Mix에 보존한다. 변경된 곡/Key/revision/hash/길이의 Track을 현재 반주와 합성하지 않고 원본을 보존한다. 반주 fetch/hash 실패는 마이크 권한 오류로 표시하지 않고 실제 오류를 노출한다. 로딩 중 이탈 뒤 늦은 녹음 시작을 막는다.

실제 전체 AI 곡 천천히 함께90초의 원본/분리 stem/가사 정렬 해시를 확인하고 실제 pYIN·backing beat/chroma 분석을 수행했다. 2037개 높은 확률 voiced frame의 관측 음역 MIDI53.8–62.3, 보수적 F3–E♭4, tessitura G3–D4, BPM80.7495 추정이다. Key 후보 D major0.75438/G major0.73435·차이0.02003으로 확정하지 않는다. 최초 ASR 단어0–18.84초 대비 최초0.15초 이상 지속 voiced 후보17.949초를 관측했다. 반주 누출/비가사 발성/옥타브 오류 가능성이 있어 첫 가사 진입·강박 승인으로 사용하지 않는다. 이전 분석을 덮어쓰지 않도록 output-dir 및 기존 output 거부를 추가했다. 실제 보고서는 repository 밖 runtime/results에 보존한다.

`qa:project-backing`은 실제 등록된 천천히 함께19초 반주와 격리된 합성1초 Track으로 2/3/4 필수 제출→19초 native Auto Mix→저장/reload를 확인한다. 끝18.2–18.7초 RMS는 각각0.070322/0.065383/0.063774다. 503/hash/Key 오류에서 마이크 접근0, 제출0을 확인한다. 정상 경로는 actual backing decode→격리 마이크→Review 직접 제출→source snapshot 유지→19초 Current Mix를 검증한다. 이는 production 곡 등록이나 실제 Part 편곡/물리 청취 인수가 아니다. 첫 Current Mix QA의 timeout(30000ms)은 짧은 Take 길이로 backing Preview가 잘리는 오류를 드러냈다. 실제 source duration을 보존하도록 수정한 뒤 정상 녹음→Review 직접 제출→source snapshot 유지→19초 Current Mix 재검증을 통과했다. 변경된 source snapshot의 Review 제출은 거부되고 원본 Draft 바이트가 보존되며 마이크 접근/제출수가0인 native QA도 통과했다.

다음은 실제 Project용 오리지널 곡/Part 편곡·음역/Key 및 가사 진입 검증→검증된 곡만 기존 catalog에 등록하는 작업이다. 이번 연결 엔진 수정으로 곡 등록 전체나 단계3 완료를 표시하지 않는다. 기존90초 곡의 긴 도입과 타임코드 불확실성을 줄이기 위해 실제 ACE-Step 새 후보(seed65354)90초 생성을 별도 runtime에서 수행했다.508.742초 추론·48kHz stereo·원본 SHA2569e1a8bf9d7dc811f05095faac1f3b888d6a95779b84cc91500fe344d36848bb9이며 분리/가사 검증 전 asset으로 교체하지 않는다. 디자인 보류·개인 형상 미정 정책·실제 서버 환경·실기기 인수의 잔여 조건은 유지한다.


Git/Production 검증: 기능 commit a5769814f664db99dc11fcdc2614f2fc6093c2a8을 origin/main에 push하고 remote 동일 hash를 확인했다. Vercel bot Production deployment6959369286/동일 commit/status success와 production HTTP200을 확인했다. JS index-DJ_ejUgn.js SHA256 bd31b7632541652c35a0bae4cb5ad07cb3f895aae8b8439b617f28c45df7b792, CSS index-DtsPXy24.css SHA256 b22ac9187dcf08f34a1dea11517b51e5a85b6602d5a4e844d2084ec6ae748b26는 검증 build와 byte 일치했다. Production qa:project-backing/qa:continuity/verify-recorder-session 통과: 실제19초 backing의2/3/4 Track 합성·저장/reload,503/hash/Key 실패 마이크0·제출0, 변경된 source snapshot 제출 거부/원본 Draft 보존, 정상 Review 제출/19초 Current Mix,360/390/430 연속성·중복 녹음 시작/정지 보호를 확인했다. 격리 합성 마이크/Track을 쓴 기술 검증이며 실제 Project 곡 catalog 등록·Part 편곡·실기기 청취 인수가 아니다. 전체 유지 Node QA/build도 통과했으며 직접 Vercel deploy는 사용하지 않았다. 단계3 전체 완료와 단계4/5 진입으로 기록하지 않는다.

새90초 음악 후보 원본은 기존 파일과 별도로 보존한다. 실제 UVR 분리194.970초·보컬 SHA256d47532f497bd45fdc6dd7e15d23ecea98b5a58856010503be9d51fb469836d7a·반주 SHA25632b941382d0efd614475078a29d350c553923aacd01d9944e1fb936b32a983ee를 검증했다. Whisper-small 전체 가사 검증은 textSimilarity0.785714/lyricAcceptance=false로 실패했다. 첫 요청 가사16.82초, 요청하지 않은 앞부분/반복 가사 인식이 있어 새 후보를 production asset으로 등록하지 않았다. 실패 보고서를 보존하고 별도 실제 Whisper Turbo 텍스트/단어 정렬 대조를 수행했다. 결과는 아래에 기록한다. 실제 Part 편곡/요구 음역·Key·승인된 첫 가사 진입 자료는 계속 생성·검증할 작업이며 외부 자료 대기 완료나 사용자 자료 요청으로 전환하지 않는다.

후속 가사 진입/분석 검증: Recorder가 첫 가사 time 이전에도 Math.max(0)로 첫 줄을 현재 가사로 표시하던 오류를 수정했다. 첫 타임코드 전에는 첫 줄을 다음 가사로 유지하며 실제 시간이 도달한 뒤 현재 줄로 전환한다. 새 native QA는3.5초 첫 가사에서 녹음 전/전주 동안 현재 줄 비어 있음·다음 줄 표시,3.5초 뒤 현재 줄 전환과 Review 직접 제출·원본 참조·19초 Current Mix를 검증했다. qa:project-backing/전체 유지 Node QA/build가 통과했다. CSS/화면/음원/개인 형상을 변경하지 않았다.

새 곡 후보의 Whisper Turbo 텍스트 유사도0.839695는 통과했지만 첫 문장0–20.26초로 Small의16.82초와 다르다. 별도 실제 Turbo 단어 정렬은 유사도0.696203/alignmentAccepted=false로 실패했고 첫 단어0–18.2초다. 실패 보고서를 덮어쓰거나 통과 기준을 낮추지 않았다. 실제 pYIN 첫 지속 voiced 후보17.1015초, 보수적 음역E♭3–E♭4/주 음역G3–C4·2476 confident frames·coverage0.3194와 BPM80.7495, Key 후보G major0.72749/D major0.68552를 측정했다. 이 신호 측정은 가사 진입/Key/Part 편곡 승인과 다르다. `--signal-only`는 가사 실패와 독립적인 오디오 측정만 허용하고 lyricAlignmentVerified=false/catalogRegistrationApproved=false/approvedEntryTime=null을 출력한다. 기본 모드는 기존처럼 실제 승인된 가사 정렬과 원본/보컬 해시를 검증한다. 기존 실제90초 곡을 기본 모드로 재측정하여 이전 report와 원본/stem 해시·분석 window·음역·BPM·beat times·Key 후보·voiced runs가 정확히 일치함을 확인했다. 새 후보의 원본/latent/stems/모델 revision/가사 실패/신호 보고서는 runtime에 보존하며 production 곡으로 등록하지 않는다. 다음 실제 곡/Part 자료 생성·검증 및 개인 형상·서비스/실기기 잔여 조건을 유지한다.

후속 배포 마감: 가사 진입/신호 분석 commit4d230ad99ebc12aef6d16c50d31062a91ce680de를 origin/main에 push하고 remote 동일 hash를 확인했다. Vercel bot Production deployment6960590863/동일 commit/status success, production HTTP200, JS index-B485rNk_.js SHA256f75618bfc804c6920e533408835fc9cfc5268e85f3bd78ccaa3a32ba7e86fae6·CSS index-DtsPXy24.css SHA256b22ac9187dcf08f34a1dea11517b51e5a85b6602d5a4e844d2084ec6ae748b26의 검증 build byte 일치를 확인했다. 최신 Production qa:project-backing은3.5초 첫 가사 전/후의 현재·다음 줄 전환,2/3/4 actual backing 합성/reload,503/hash/Key 실패 마이크0,source snapshot 불일치 제출 거부/Draft 보존,정상 Review 제출/19초 Current Mix 모두 통과했다. main은ahead/behind0/0·작업 트리clean이다. 실제 가창/청취 인수와 실제 AI Project catalog/Part 등록은 미완료다. 이번 새90초 후보의 단어 정렬 실패와 실제 Part 검증 누락 때문에 단계3 전체를 완료하거나 단계4 신규 구현으로 진행하지 않는다. 원본/실패 증거를 보존하며 다음 실제 곡/편곡 생성·검증 작업은 취소하지 않는다.

## 2026-10-09 단계3 — 실제 오디오 길이 보존

현재 실행 위치는 단계3이다. Project 목록은 기존 곡 데이터이고 실제 AI Project용 Part 편곡/요구 음역·Key 자료는 미등록이다. 제공 Sample을 기존 곡의 반주로 연결하거나 미측정 Part 자료를 채우지 않았다. 디자인/프로필 이미지 보류와 개인→Track→Project/서버/실기기 잔여 조건은 유지한다.

Project 음원 연결 선행 검사에서 live `playCurrentMix`의18초 종료 타이머와 Auto Mix의 실제 backing 길이 누락을 확인했다. live Mix는 선택한 실제 decoded Track의 trim 이후 길이와 선택한 실제 반주 길이로 종료 시간을 정한다. 잘못된 duration 메타데이터/선택하지 않은 긴 Track은 사용하지 않는다. synthetic-only 기존 시연은 요청 duration을 유지한다. Auto Mix는 실제 backing이 더 길면 끝까지 렌더한다. 명시적2초 Preview 같은 짧은 청취 범위는 유지한다. 현재 UI의 Project backingBlob 등록/전달은 여전히 미완료이며 이 엔진 수정으로 곡 연결 전체를 완료했다고 표시하지 않는다.

`qa/verify-audio-lengths.mjs`/qa:audio-lengths의 native Web Audio 검증:35초 합성 Track+100ms trim 종료34980ms, 선택한2초 Track 종료2080ms, 실제 등록된 천천히 함께19초 backing 종료19080ms.2/3초 격리 Track+실제19초 backing의 Auto Mix19초/18.2–18.7초 출력 RMS0.067400449로 끝부분을 보존했다.2초 명시적 Preview는2초다. 입력4개 Blob SHA256 전후 일치, runtime 오류0을 확인했다. 실제 AI backing과 격리 합성 Track의 기술 검증이며 실제 Project binding·물리 가창/청취 인수가 아니다.

전체 유지 Node QA/build 및 qa:submission-graphics/qa:continuity 통과:2/3/4·주 프로젝트의 그래픽0 상태 실제 native Mix 저장/reload, 제출 실패/중복·재시도·원본/seed·Credits/프로필 복귀를 확인했다. Git/Production 마감: 기능 commit `8046682fd23fff85f0d13cc26a64bb0292d77a80` push 후 Vercel bot Production deployment6958585196/동일 commit/status success를 확인했다. HTTP200 및 JS `index-CpOHw0aW.js` SHA256 `e88b5ba12cc66a2cf9ea4ced7e47fd30ae74282cf0e3c90d78642ab1e2e1ad9c`, CSS `index-DtsPXy24.css` SHA256 `b22ac9187dcf08f34a1dea11517b51e5a85b6602d5a4e844d2084ec6ae748b26`가 검증 build와 byte 일치했다. Production qa:submission-graphics/qa:continuity 모두 통과했다. qa:audio-lengths의 실제19초 backing/긴 Track API 검증은 로컬 native Web Audio 결과이며 현재 Production UI에 실제 Project backing이 연결됐다는 증거로 사용하지 않는다. 직접 deploy 없이 Git Integration만 사용했다. 단계3 전체를 완료 처리하지 않는다.

## 2026-10-09 단계3 — 실제 앞 반주 준비 구간과 박자 분석

현재 실행 위치는 단계3이며 이전 완료/보류 상태는 유지한다. 실제 Project용 곡·반주·Key/Part 데이터, 개인→Track→Project 연결, 물리 청취·지연·서버 기능은 미완료다. 디자인/프로필 이미지 생성은 보류한다. 세 샘플에 실제 원곡의 지정 구간 바로 앞 반주3초를 연결했다. 현재 감소한 반주 gain을 동일하게 사용하며 Guide OFF에서는 준비 오디오를 재생하지 않는다. 앞 반주와 본 구간을 같은 AudioContext 시계에3초 간격으로 미리 예약하고 준비가 끝난 뒤 MediaRecorder를 시작한다. 준비 시간을 Take에 넣지 않고 가사 타임라인은 본 구간0부터 유지한다. 취소/이탈은 예약 노드와 준비 소유권을 해제해 늦은 녹음을 막는다. 기존 Project 녹음의 기본 동작은 preparationBlob이 없는 경로로 보존한다.

새 production asset은 각 기존 audio 폴더의 `lead-in.wav`3개다. 실제 원곡 분리 반주의 float PCM을 정확히 추출했고 원곡/backing 해시와 sourceStart/End를 catalog provenance에 보존했다. 원본 Sample/반주 MP3/가사/사용자 Profile/Track은 변경하지 않았다. Rain은18초 파생 구간과 원곡 계보가 별개이므로 excerptLineage.originalSourceSha256/30.5초를 참조한다. 최초 기술 script의 단일 sourceSha 가정이 `Full-song source lineage mismatch` 오류를 냈고 이 명시적 파생 계보를 처리해 재실행했다. 입력 데이터/해시를 오류에 맞춰 변경하지 않았다.

`qa/verify-provided-rhythm.py`는 실제 배포 MP3와 해시 검증된 전체 반주의 librosa onset/beat 추정을 비교하고 같은 입력 반복의 정확한 재현을 확인한다. 서로의 빛은 구간120.185/전체79.507BPM·80ms grid 일치24.24%로 불안정, 천천히 함께80.750/79.507BPM·96.15%, 비가 그친 뒤79.507/79.507BPM·96%다. 후자2개도 강박/박자표/첫 음절/청취 승인이 아니며 countInApproved=false다. 실제 앞 반주는 이 추정 박자를 합성한 메트로놈이 아니다. 출력 JSON은 repository 밖 .ieum-p0-runtime/results/rhythm-probe-2026-10-09-v1/v2에 보존한다. 실제 앞 반주 PCM과 원곡의3초 구간이 정확히 같은지 재사용 script에서 검증한다.

단위/native 브라우저 QA는 앞/본 구간 시작시각 차이3초·gain 일치·준비 중 MediaRecorder0회·본 구간 시작 후150ms 이내 Capture·이탈 후 늦은 시작 없음·Review·기존 Profile 보존을 확인했다. 이는 격리 합성 마이크 및 desktop browser 스케줄 검증이며 실제 기기 지연이나 청취 인수가 아니다. 전체 유지 Node QA/build, 실제 제공 샘플 전체 Take/권한·실패 복원, Profile 저장·편집·샘플 lifecycle 회귀가 통과했다. 앞 반주503/hash 불일치 때 마이크 접근0회 및 정상 재시도를 확인했다. 최초 회귀 실행의 권한 오류 표시 대기 timeout(30000ms)이 발생했고 같은 실행 구간의 Vite App HMR 갱신 로그를 확인했다. 앱 변경 없이 고정한 버전으로 전체 제공 샘플·Profile·진입 QA를 재실행하여 모두 통과했다. Production 마감: 기능 commit `8389b9f9ca4af8b8c2a75c736151dbe79aac39de` origin/main push/hash 일치, Vercel bot Production deployment6958368104/동일 commit/status success를 확인했다. HTTP200 및 JS `index-CKnv6e9p.js` SHA256 `c6660c73fa6a2e9b86ed28941015c1f824cf72342bab3fc9007956fa6dd0ffb2`, CSS `index-DtsPXy24.css` SHA256 `b22ac9187dcf08f34a1dea11517b51e5a85b6602d5a4e844d2084ec6ae748b26`가 검증 build와 byte 일치했다. Production qa:backing-level/qa:provided/verify-sample-lifecycle 통과:3곡 앞 반주·연속 예약·준비 미녹음·이탈 정리·앞 반주503/hash 실패 후 재시도·전체 지정 Take·가사·권한/실패 복원·원본 Profile 보존을 확인했다. 직접 deploy 없이 Git Integration만 사용했다. 단계3 전체를 완료 처리하지 않는다.

## 2026-10-09 사용자 청취 피드백 — 반주 감소·Sample 녹음 준비

사용자가 이전 배포의 반주가 너무 크고 진입 시점이 불명확하다고 보고했다. 수치 QA 통과를 실제 청취 인수로 간주하지 않는다. 같은 기존 React 경로의 반주 RMS 목표를0.1→0.05(-26dBFS), gain 상한2→1, peak 상한0.85→0.6으로 낮췄다. 실제3곡 gain0.887453/0.436990/0.523675, 예상 출력 RMS0.05이며 직전 배포 대비 약5.79/6.02/6.02dB 감소다. 자동 증폭 없이 곡 내부 강약과 토글/재개 gain 일관성을 유지한다.

Sample 녹음 화면에서 기존 Player를 재사용해 원곡 첫 가사 진입을 미리 들을 수 있게 했다. hash 검증된 반주 로딩과 마이크 권한 준비가 끝난 뒤3·2·1 초 단위 준비 표시를 제공하고 이후 기존 녹음을 시작한다. 준비 시간은 Take에 포함되지 않는다. 시작 직후 첫 가사 안내를 표시한다. 준비 중 이탈은 lifecycle 검사를 통해 이후 반주/녹음을 시작하지 않는다. 실측 BPM/박자 기반 count-in, 새로운 준비 오디오, 새 화면/스타일/그래픽을 추가한 것이 아니다. 실제 박자/첫 음절 타이밍의 음악적 인수는 계속 남는다.

사용자의 직접 피드백 범위가 이번 수정 기준이다. 현재 노출 도구 목록에서 Notion/figma-desktop 도구가0개여서 해당 원본 조회는 수행하지 않았으며 Computer Use/Remote Figma로 우회하지 않았다. 디자인 보류는 유지한다. build/전체 유지 Node QA, 실제3곡 native Guide gain/준비3·2·1 중 Audio/MediaRecorder 시작0회/이탈 후 시작 없음/Review/기존 Profile 보존 QA가 통과했다. 전체 제공 샘플·Profile store/editing/lifecycle 회귀도 통과했다. 기존 lifecycle QA의 폐기 후 audio 요소0개 가정에서 `1 !== 0` 오류가 발생했으며, 새 원곡 미리듣기와 폐기된 Take URL을 구분하는 검사로 수정해 재통과했다. 제품을 오래된 검사에 맞춰 되돌리지 않았다. 배포 검증: 기능 commit `102fae3e4ec02941d5722134c7b80188011b0bdf` origin/main push/hash 일치, Vercel bot Production deployment6957638474/동일 commit/status success를 확인했다. Production HTTP200 및 JS `index-Dsh2bNXh.js` SHA256 `f69b7c17c9e7d850f4c1398f3fbb75dc106b0d124383d42ec31a1ab21eed721b`, CSS `index-DtsPXy24.css` SHA256 `b22ac9187dcf08f34a1dea11517b51e5a85b6602d5a4e844d2084ec6ae748b26` byte가 검증 build와 일치했다. Production qa:backing-level/qa:provided/verify-sample-lifecycle 모두 통과했다. 준비 중 녹음0회·이탈 후 시작 없음·3곡 전체 Take·가사 타임라인·hash·실패/재시도·기존 Profile 보존을 확인했다. 직접 deploy 없이 Git Integration만 사용했다. 실제 기기 청취 인수와 단계3 전체는 미완료다.

## 2026-10-09 단계3 — 실제 제공 샘플 반주 레벨 보완

현재 전체 실행 위치는 단계3이다. 단계0 기준 보존은 완료·검증됐고 재수행하지 않는다. 단계1 개인 입력/버전 계약 및 실제 모델 재현 기술 검증은 확보했지만 개인 식별·Track/Project/앱 연결은 미완료다. 단계2 디자인/Figma 인수와 프로필 이미지 생성은 사용자 지시로 보류한다. 단계3 녹음/실패 보존/Review 직접 제출/2–4 Auto Mix/제출·그래픽 상태 분리는 검증·배포됐다. 실제 프로젝트 곡·반주·Key/Part 데이터와 물리 기기 청취·지연 인수는 남았다. 단계4 Profile/탐색의 기존 구현은 유지하지만 새 Identity 공유 및 전체 흐름 인수는 미완료, 단계5 실제 인증·공유 저장·초대·비동기 서비스는 미연결, 단계6 종합 인수는 선행 조건 충족 후 진행한다. 전체 단계3 완료로 판정하지 않는다.

실제 제공 샘플의 고정 반주 gain0.65를 디코딩된 실제 PCM의 전 채널 RMS/peak에 따른 곡별 고정 gain으로 변경했다. 목표 RMS0.1(-20dBFS), 최대 gain2(+6.02dB), peak0.85 상한을 적용하며 RMS0.0015 미만 무음/미약 입력은 증폭하지 않는다. 곡 내부의 강약은 유지하고 녹음 시작/Guide 토글·재개/Current Mix/offline Mix에 동일 규칙을 적용한다. 원본 오디오/등록 hash/가사/Key/화면/CSS는 변경하지 않았다. 실제 반주가 없는 Project의 기존 합성 반주를 실제 AI 곡 반주로 바꾼 작업은 아니다.

유지 QA/build 통과. `qa/verify-backing-gain.mjs`는 무음·미약 신호·stereo·최대 증폭·peak 상한·비정상 PCM 거부를 검증한다. `qa/verify-provided-backing-level.mjs`는 실제3곡을 native AudioContext로 decode한 Guide gain, 토글 gain/시간 연속성, Review 도달, 기존 Profile 원본 보존 및 runtime 오류0을 확인했다. 서로의 빛 gain1.727898(+8.49dB/이전0.65 대비), 천천히 함께0.873980(+2.57dB), 비가 그친 뒤1.047350(+4.14dB). 실제16초 WAV의 pause/resume/토글/native offline 비무음 합성 및 live node 불변 QA도 통과했다. qa:provided의3곡 전체 Take/asset hash/가사/실패·재시도·오래된 권한 응답 격리도 통과했다. 합성 마이크 격리 QA이며 실제 청취·잔여 보컬·악기 보존·모바일 지연 인수가 아니다.

배포 검증: 기능 commit `e7224f62154843d9cc9cf26e85e27d4a8516193e`를 origin/main에 push하고 원격 hash 일치를 확인했다. Vercel bot의 Production deployment6957232500/해당 commit/status success를 확인했다. Production HTTP200, JS `index-CPX8odlN.js` SHA256 `35e8bafd4ceae390fced0e21dfdaa032447159b5ce96dc8365652d55874b1fd1`와 CSS `index-DtsPXy24.css` SHA256 `b22ac9187dcf08f34a1dea11517b51e5a85b6602d5a4e844d2084ec6ae748b26`가 로컬 검증 build와 byte 일치했다. Production qa:backing-level 및 qa:provided가 통과했다. 실제3곡 Guide gain/토글/Review, 전체 지정 Take, 가사 타임라인, hash, 로딩 이탈·오래된 권한 응답/실패·재시도와 Profile 보존을 확인했다. 직접 production deploy 없이 Git Integration으로 배포했다. 실제 청취·Project 반주 연결 및 전체 단계3는 아직 미완료다.

## 2026-10-09 프로필 이미지 보류 / 단계3 제출·그래픽 상태 분리

배포 마감: `068c83e2854e9a229044d1019778e5c0943e51a9`를 main에 commit/push했고 GitHub origin/main과 일치했다. Vercel bot의 Production deployment6956977210/같은 commit/status success(Deployment has completed)를 확인했다. Production HTTP200 및 검증 build `index-BK9XreAG.js` SHA256 `d7a7a8bcec0adbf0ab840175c9f9c4b39624839dadde58f72a04732d5e8acb3e`, CSS `index-DtsPXy24.css` SHA256 `b22ac9187dcf08f34a1dea11517b51e5a85b6602d5a4e844d2084ec6ae748b26` byte 일치를 확인했다. Production qa:submission-graphics(2/3/4·주 프로젝트4 Track/그래픽0/Mix 저장/reload)와 qa:continuity(제출 실패·재시도·원본/seed/Track 보존·Credits·재접속)가 모두 통과했다. 새 프로필 이미지나 진단 PNG는 배포하지 않았다. 직접 production deploy 없음. 이 기능 묶음의 배포 검증이며 단계1/3 전체·실기기 청취 완료가 아니다. 아래의 배포 전 표현은 당시 검증 기록이다.

사용자가 현재 진단 이미지의 뉴런 같은 형상을 거부하고 프로필 이미지는 추가 검토 후 생성하도록 지시했다. 후보 이미지 채택/추가 생성/Profile 연결을 보류한다. 원본 진단 결과는 삭제하지 않으며 성공적인 모델 추론을 디자인 승인으로 기록하지 않는다. 독립적인 기능 작업은 계속 진행한다.

기존 Home 제출수 및 주/활성 Project의 Auto Mix 준비 조건이 Layer 개수에 의존하던 부분을 `submittedProjectTracks`/`allProjectTracksSubmitted`로 변경했다. 실제 저장된 필수 Part Track ID/project/part/Blob 계약을 기준으로 세고, 임시본·Profile·pending/error 제출·다른 프로젝트 기록을 제외한다. 기존 상태 필드가 없는 정상 final Track은 호환한다. 생성 Layer의 실패/누락이 제출 오디오를 취소하지 않으며 그래픽 성공이 제출을 확정하지 않는다. 기존 Record/프로필/CSS/motion과 저장 원본은 변경하지 않았다.

`qa/verify-submission-graphics-separation.mjs`의2–4 Part 계약과 `qa/verify-mix-without-graphics.mjs`의 실제 브라우저/native offline 합성을 검증했다. 그래픽0개인 신규2/3/4와 기존 주 프로젝트4개 모두 실제 Mix 파일 저장·프로젝트 재진입/reload·seed/Track 수 보존을 통과했다. 격리 합성 음원이며 물리 청취/AI 그래픽 인수는 아니다. 최초 새 QA의 DB 이름 오류(NotFoundError), 재접속의 오래된 QA hook snapshot 및 잘못된 한글 버튼 selector timeout을 실제 DB명/기존 PROJECTS 탭 재진입으로 수정했다. 제품을 테스트의 잘못된 가정에 맞춰 수정하지 않았다. 기존 전체 QA/build와2/3/4 제출 실패/중복·재시도·복원·Credits 연속성 QA도 통과했다. 배포 전이며 전체 단계3 완료는 아니다.

## 2026-10-09 단계1 실제 개인 생성·Track 변형·결합 기술 검증

기존 SD-Turbo pinned revision `b261bac6fd2cf515557d5d0707481eafa0485ec2`와 실제 VocalSet4명/기존 BYOL embedding을 사용해 새 개인 입력 계약의 digest를 모델 seed에 연결했다. 같은 입력 반복과 새 Python 프로세스의 재생성이 실제 동일 PNG/픽셀/윤곽 해시로 일치했다. 다른4명과 같은 Profile 입력의 다른 사용자 조건에서 흑백/윤곽 결과도 달랐다. 이는 특정 사용자를 사람이 인식한다는 보장이나 학습된 audio-image adapter 검증이 아니다. CPU 개인 생성은 case당12–14초였고 모바일/비용 목표는 미확정이다.

같은4명의 별도 실제 `_e.wav` 녹음을 Project Track 평가 입력으로 분석하여 기본 개인 latent를 원본 그대로 보존하고 실제 spectral/envelope 특징으로 변형한 후 실제 VAE로 decode했다. 개인 원형과 변형 결과의 흑백 상관계수0.996206/0.999201/0.998061/0.998386, RMSE0.00658–0.01362, 반복 decode 동일 픽셀을 확인했다. 단순 latent2/3/4 평균의 재현/원본 보존은 통과했으나 실제4개 결과가 흐려졌다. 평균 결합을 최종 개인 흔적 보존 방식으로 승인하지 않는다. 실제 latent 국소 활성에 따른 전면 가중 결합 후보는4개에서 대비 표준편차0.072948→0.100935(약38% 증가), 모든 원본 레이어 보존/반복 픽셀 일치였다. fixed sector/동심원/장르 preset은 쓰지 않았다. 후보의 참여자 인식, Project Seed와 생성 결과 연결, 현재 Record motion/UI 통합은 아직 미검증이다. 디자인 선택으로 기록하지 않는다.

`voiceIdentityContract.js`에2–4 Project 제출/그래픽 상태 독립 계약 및 실제 개인 PNG/입력 계보/버전/해시 검증을 추가했다. 64-bit 추론 seed는 JavaScript 안전정수 범위를 넘으므로 확정 snapshot과 향후 Python 출력은 정확한 decimal string으로 보존하고 number seed는 거부한다. 최초 진단 보고서의 native 정수는 보존하고 QA에서는 입력 digest로 정확한 정수를 재계산한다. 입력 변조/버전 불일치/해시 불일치 거부, 실제 생성 PNG 수락을 확인했다. `qa:identity` 명령을 추가했다. Profile 저장·Track 제출·Mix 성공을 그래픽 검증과 혼동하지 않는다.

재현 script: `qa/verify-personal-identity-model.py`(새 프로세스 반복 옵션 포함), `qa/verify-identity-track-model.py`(기본 Track·2–4결합 및 결합 비교 모드), `qa/verify-voice-identity-contract.mjs`. 실제 PNG/latent/PCM/입력 mapping/보고서는 repository 밖 `D:/IEUM-AI-runtime/results/`의 신규 personal-identity-probe/identity-track-probe/identity-blend-comparison/personal-identity-repeat-2026-10-09-v1 폴더에 보존한다. userId 포함 입력은 private 진단 자료이며 public asset으로 복사하지 않았다. 기존 Profile/Track DB와 시각 코드는 변경하지 않았다.

전체 유지 QA/build 및 실제 입력/생성 artifact 계약 QA 통과. G1 재현/비색상 차이와 G2/G3 수치 기술 검증은 확보했지만 사람의 식별·최종 결합/서비스/실기기 인수와 G4/G5 앱 연결은 미완료다. 다음 단계 완료로 넘기지 않는다. 이번 검증 코드는 아직 commit/push/배포하지 않았다. 기존 반주 문제와 단계3 잔여 작업은 해결했다고 표시하지 않는다.

## 2026-10-09 단계1 선행 보완 — 개인/Track 입력 계약

사용자 기획 변경 후 계속 진행 지시에 따라 `src/voiceIdentityContract.js`에 개인/Track 생성 입력 manifest를 추가했다. 동일 JSON 입력의 key 순서를 정규화하고 user/Profile revision/분석 출처·원본 SHA256/generator version을 private digest에 포함한다. Profile source와 Project Track을 구분하고 Track 입력은 확정 개인 결과의 opaque ID/revision/출력 해시를 요구한다. 원본 입력을 변경하지 않으며 ID-only 기본 형상·갱신·fallback 미정 정책을 적용하지 않았다. 현재 화면/저장/렌더러에는 아직 연결하지 않았다. public manifest나 URL로 private userId/digest를 배포하지 않는다.

현재 v3 밝기/거칠기/성량 변화는 신호 proxy 추정으로만 구분하고 confidence는 null이다. 무음/결측/비정상 수치는 유효 값으로 채우지 않는다. 평균 음역·실제 음역·호흡량·비브라토·BPM·리듬 복잡도는 이 계약에서 검증된 extractor 미연결로 명시한다. pitchVariation을 비브라토로, articulation을 BPM/리듬 복잡도로 간주하지 않는다. 기존 분석 출력/Layer signature/사용자 저장 데이터는 변경하지 않았다.

`node qa/verify-voice-identity-contract.mjs`에서 재직렬화·키/소스 순서·revision/버전/원본 변경, 목적 혼용 거부, 결측/무음 처리, 확정 개인 참조 없는 Track 입력 거부를 통과했다. 같은 script에 기존 실제 VocalSet4명 보고서를 전달하여 실제 원본 파일 해시와 입력 manifest 재현을 확인했다. 기존 추론 보고서의 특징을 재사용한 것이며 새 모델 추론/음색 신뢰도/개인 형상 구분 검증이 아니다. 전체 `npm run qa`와 production build 통과. build JS/CSS 이름은 기존과 동일하며 UI 기능은 아직 추가하지 않았다.

G1 전체 및 G2–G5는 미완료다. 다음 작업은 실제 생성 모델 결과에 개인 형상 식별 특징을 연결하고 같은 입력·버전 재현/서로 다른 사용자 형상 구분을 검증하는 것이다. 입력 digest 구분은 형상 구분 통과 근거가 아니다. 기존 단계3 잔여 작업/디자인 보류는 유지한다. 이번 선행 보완은 아직 commit/push/배포하지 않았다.

## 2026-10-08 단계 3 — 세 실제 제공 샘플 및 마이크 세션 보호 배포 검증

기존 React Voice Setup에 실제 AI 오디오 세 구간(서로의 빛16초/천천히 함께19초/비가 그친 뒤18초)을 등록했다. 각 구간의 실제 MP3/분리 반주/해시/가사 word time을 연결했다. 세 곡 모두 미리듣기·Guide decode·가사 전환·지정 전체 길이 Take Review·기존 Profile 원본 보존 QA 통과. 첫 구간의 Guide 토글 시간 연속성, 다운로드503/해시 불일치 시 마이크0회, 재시도, 로딩 중 이탈, 늦은 권한 응답 후 이탈도 통과했다.

세 번째는 원곡30.5–48.5초의 검증된18초 구간만 채택했다. 전곡 small0.75/Turbo0.678899는 실패이며 그대로 보존한다. 실제18초 ASR small0.878049/Turbo0.926829 및 word alignment0.878049 통과, cue0/5.76/13.28초, pYIN 추정E3–C♯5다. 범위와 Key는 확정 음악학 데이터가 아니며 원키로 표시한다. 구간 원본/보컬 해시가 실제 export와 동일한 것을 확인했다. 원곡 전체의 가사 성공으로 보고하지 않는다. Source SHA/구간 계보/전곡 실패 점수는 catalog provenance에 함께 기록한다.

이탈→재진입→새 Take 시작→이전 권한 응답 도착에서 새 recorder가 inactive로 바뀌는 오류를 실제 재현했다. 마이크 요청 세션을 검사해 오래된 stream만 종료하고 새 Take와 stream을 보존하도록 최소 보완했다. 재현 QA에서 새 recorder recording/새 track live/오래된 track ended, 기존 Profile 보존을 확인했다. 기존8초 permission timeout 이후 재시도한 경우에도 늦은 이전 stream이 live로 남는 오류를 재현했다. 종료 handler를 timeout 예외 이전에 등록해 이전 track ended/새 recorder recording을 실제 QA로 확인했다. timeout 기준과 기존 UX는 변경하지 않았다. 전체 유지 QA/build/qa:record-errors/qa:profile 통과. 실제 새18초 backing WAV의 pause/resume 동일 offset·토글·비무음 offline mix(RMS0.032933)·decode 실패 마이크 해제도 통과했다. 모두 격리 합성 마이크 QA이며 물리 청취 인수와 구분한다.

이번 기능 묶음은 `a07c101560bb83859fb3ac91ecde112df734910a`로 main commit/push 및 origin/main 일치를 확인했다. Vercel bot의 Production deployment6928306575/해당 commit/status success/Deployment has completed를 확인했다. Production HTTP200과 검증 build `index-DNhOSGRx.js`/`index-DtsPXy24.css` byte SHA256이 일치한다. Production qa:provided(세 곡 및 timeout/reentry)/qa:profile/qa:record-errors가 모두 통과했고, 미리듣기→녹음 전환에서 이전 원곡 audio.paused=true도 확인했다. 직접 Vercel production deploy는 사용하지 않았다. 앞서 두 곡 배포72fa7bb의 기록은 아래에 보존한다. 전체 단계3 완료 아님: 프로젝트용 실제 Key/Part/Guide 자료와 물리 마이크·발음/청취/반주 누출·지연 인수가 남는다. 디자인은 보류하며 단계4/5 신규 작업은 하지 않는다.

실기기 확인은 [Production](https://ieum-v2-react.vercel.app/)의 Voice Setup에서 한 번에 진행한다: 세 곡 미리듣기/가사 발음, Guide 켜기·끄기 후 실제 노래 Take 청취, 녹음·가사 지연과 스피커 반주 누출. 자동 QA의 합성 마이크를 실기기 인수로 대체하지 않는다.

## 2026-10-08 단계 3 — 두 실제 제공곡 배포 검증

`72fa7bb2bad5530aa3377011462c2c93ef1b49a6`을 main에 commit/push했고 origin/main과 일치한다. Vercel Git Integration이 해당 commit의 Production deployment6927478076을 생성했고 GitHub Vercel status가 success/Deployment has completed다. Production HTTP200 및 검증한 build의 `index-CN9MTd-w.js`/`index-DtsPXy24.css` byte SHA256 일치를 확인했다. Production qa:provided/qa:profile/qa:record-errors가 모두 통과했다. 실제 두 곡 MP3 서버 해시/미리듣기/녹음/Guide/가사/실패·원본 보존 및 격리된2·3·4 Part 연속성 증거이며 물리 마이크·청취 인수는 아니다. 디자인 변경 및 직접 production deploy 없음.

전체 단계3는 미완료다. 세 번째 실제 제공곡, 프로젝트용 실제 Key/Part/Guide 데이터와 물리 마이크·청취 인수가 남는다. 생성 도구의 CPU disk offload 메모리 개선은 작은 실제 모델에서 원본과3회 exact match/저장소0 elements를 확인했으며 실제 세 번째 곡 재시도 중이다. 모델 weights와 실패 생성물은 보존한다. 음악 품질 통과로 해석하지 않는다.

아래는 해당 기능 묶음의 구현/진단 기록이다. 과거 미배포·재시도 상태는 당시 기록이며 최신 배포 상태는 위 항목을 우선한다.

## 2026-10-08 단계 3 — 실제 제공 샘플 및 Guide 연결

실행 위치는 단계 3이며 디자인은 보류한다. 기존 React Voice Setup에 실제 AI 오리지널 「서로의 빛」16초와 「천천히 함께」19초 지정 구간을 연결했다. 실제 미리듣기/분리 반주, SHA256 검증 후 녹음 시작, Guide 토글, 같은 녹음 Timeline의 가사 전환이 동작한다. 원본 사용자 Sample/음역/Project Track과 저장 키는 보존한다.

- 원곡 실제 생성: 90초/48kHz/stereo, seed65349, SHA256 `d5d70b20e830f2336140913714327df9b79bfb0f12de6c9d279b2b188445b4cb`. Whisper-small 가사 gate0.8 및 실제 word alignment 통과. 전곡 Turbo0.791 실패. 실제16초 구간 독립 검증은 Turbo0.893617 및 시간 gate 통과/small0.782609 실패이며 검증 WAV와 실제 export WAV/보컬의 해시도 일치한다. 발음·청취 인수는 미완료다.
- 샘플: 원곡31.5초부터16초. 실제 구간 Turbo word alignment 추정 가사 cue0/3.84/9.86초(청취 검토 필요), pYIN 관측 추정G3–B4. 요청한 C major를 실제 Key로 주장하지 않고 원키로 표시한다. 원곡/latent/모델/생성 보고서는 격리 runtime에 보존하고 실제 사용 MP3와 재현 script만 repository에 둔다.
- 앱 QA: 실제 MP3 해시/미리듣기, HTTP503 및 해시 불일치 시 마이크 요청0회, 재시도 후 요청1회, Guide 시간 연속성, 가사 전환, 지정16초 Take Review, 기존 Profile 보존 통과. 로딩 중 이탈 후 마이크 요청1회를 재현해 lifecycle 검사로0회가 되도록 보완했다. 권한 응답 중 이탈한 경우 늦게 열린 QA stream의 모든 track 종료도 확인했다. 전체 유지 QA/build 재통과. 합성 마이크 QA이며 물리 청취·스피커 반주 누출·지연 인수는 아니다.
- 기존 Profile 실패/재시도/재로드와 2·3·4 Part 프로젝트 제출 실패 시 원본 보존/실제 합성 파일/완료 credits/재로드 회귀 통과. 녹음 오류 QA의 URL에서 design mode가 빠지는 테스트 문제만 보완했다.
- 추가 두 곡의60초 원본은 가사 gate 실패(천천히 함께0.719, 비가 그친 뒤0.591), 잘라낸 두 번째 곡 후보도0.581로 실패했다. 두 곡의90초 재생성도 분리 보컬 ASR0으로 실패했으며 두 번째 원곡 직접 ASR도0이었다. 실제 설치 pipeline에서 audio_codes 전달 시 text2music→cover 자동 전환 및 기본 강도1.0을 확인했다. 같은 모델/가사/seed에서 코드 조건을 제외한 실제 text2music으로 두 번째 곡을 생성했다. 전곡 small ASR0.933333/word alignment0.924370 및 실제19초 구간 독립 ASR/word alignment1.0을 통과하여 채택했다. SHA256 `7ef11d5e7d574134154c7fddc3022654feec474ac5cba70ed24c606232ca0eb9`, 원곡31.7초부터19초, 실제 구간 cue0/8.2/13.96, pYIN 추정F♯3–E♭4다. 두 곡 전환/미리듣기/지정16초 Take/원본 보존 QA 통과. 세 번째 직접 생성은 C 디스크 부족(os error112)으로 실패하여 기존 파일을 보존하고 여유 있는 D:/IEUM-AI-runtime의 신규 출력 폴더에서 같은 모델로 재시도했으나 가용 RAM 약1.1GB/모델 component 로딩10분 이상을 확인해 미완성 추론을 중지했다. 기존 생성물/캐시는 보존했다. 실제 검증된 두 곡 연결 묶음부터 배포하며 세 번째 곡은 미완료다. 실패 원본·보고서는 보존하며 채택하지 않았다. 제공 샘플3곡 목표는 아직 미완료다.

전체 단계3 완료 아님: 나머지 실제 제공곡 검증, 프로젝트용 실제 Key/Part/Guide 자료, 물리 마이크·청취 인수가 남는다. 단계4/5 신규 작업과 직접 production deploy는 하지 않는다. 현재 음악 변경은 아직 commit/push/배포하지 않았다.

## 2026-10-08 제공곡 진단 — 이전 시점 기록

아래는 이전 시점의 진단 기록이다. 과거의 ‘실행 중’과 완료 표현은 당시 상태이며, 현재 판정은 문서 최상단의 실제 제공 샘플 및 Guide 연결 항목을 우선한다.

- 실제 실패 원인 재현: ACE-Step가 text encoder forward 이후 lyric embedding을 직접 호출하는데 text encoder disk offload가 해당 storage를 비워 가사 입력을 손상시켰다. 같은 weight/input 진단에서 offload 없음은 exact match, offload 이후는 mismatch(max absolute difference 0.1015625)였다. text encoder는 resident로 유지하고 DiT만 block offload하도록 수정했다. native/converted lyric encoder 수치 비교는 relative RMSE 2.54e-6으로 통과했으며 곡 품질 증거로 해석하지 않는다.
- 수정 후 실제 음악 LM 300 code + ACE-Step 8-step으로 60초/48kHz/stereo WAV를 생성했다. SHA256 `dc43e0725ed2033a0f4a258dd58b8e31028901db4cb8e864bb626c3ef3a55ac5`, RMS0.163286. 전체 ASR 유사도0.155; 실제 분리 보컬의 20초 구간 ASR 유사도0.474, 구간 초과 timestamp로 가사 채택 gate 실패. 실제 한국어 가사 일부는 인식됐으나 전곡 가사/타임코드 완료가 아니다.
- 실제 UVR ONNX 추론으로 60초 vocal/backing을 분리했다. backing SHA256 `a40cc8f378d72bfbd074bf7e41f204e40f6d3aa52144a6e312bcef3ae92d6656`. stem sum residual0은 신호 보존 증거이며 완벽한 분리 품질을 의미하지 않는다.
- 기존 audio engine에 선택적 backingBlob을 연결했다. 실제 생성 반주를 headless Web Audio로 decode하고 녹음 시작/일시정지/동일 offset 재개/토글/비무음 offline preview/no synthetic fallback/no live node 누적을 검증했다. 전체 유지 QA와 production build 통과. 마이크는 합성 QA 입력이며 물리 청취가 아니다.
- 실패곡 원본/latent/분리음/검증 보고서는 repository 밖 격리 runtime에 보존한다. 가사/타임코드/실제 Part 음역 검증 전 commercial demo id나 제공곡 catalog에 등록하지 않았다. App/CSS/사용자 Track 변경 없음.

다음: 보컬 즉시 시작·허밍 제외·90초 조건의 실제 생성 → 보컬/가사 검증 → 실제 타임코드/Part 자료 → 기존 React Guide/가사/Mix 연결 → 단계 관련 QA/build → diff/commit/push → Git 자동배포/production QA. 단계 4/5 신규 작업과 직접 production deploy는 하지 않는다. 현재 음악 변경은 아직 commit/push/배포하지 않았다.

## 2026-10-08 실제 제공곡의 AI 생성 진행 — 과거 시도 기록

45초 재생성도 실제 추론/48kHz 스테레오 WAV 저장에 성공했다(SHA256 `0cb6abb9e324cac785f86b719e61adc4ff103b27343a48bf56d5c46b705af0ca`, RMS0.10627). 그러나 Whisper 인식은 지정 가사와 유사도0.054이며 타임스탬프49.38초가 실제 길이45초를 초과했다. 이 ASR 결과로 가사 정렬을 만들 수 없고 두 출력 모두 아직 제공곡으로 채택하지 않았다. 생성 보고서 절대 경로가 잘못 기록되어 검증이 FileNotFoundError로 실패한 건은 출력 폴더의 실제 WAV를 직접 읽어 동일 해시를 확인하도록 검증 경로를 수정하여 해결했다. 가사 조건의 실제 반영/보컬 품질이 현재 단계3의 미해결 항목이다. 앱 연결·commit/push·배포는 수행하지 않았다.

첫 20초 결과의 Whisper-small 검증에서 WAV 무결성/길이/비무음은 통과했지만 지정 가사와 자동 인식의 유사도가 0.04였다. 인식 문장도 지정 가사가 아니므로 제공곡 채택 gate를 통과하지 못했다. ASR 자체의 오류 가능성과 실제 보컬 품질은 구분한다. 임의 가사 타임코드를 붙이지 않고 원본을 보존하며, 45초/다른 seed의 실제 재생성을 실행한다. 현재 앱 코드/배포는 변경하지 않았다.

실제 ACE-Step 2B Turbo 다운로드·변환 및 원곡 「서로의 빛」 추론이 성공했다. 순차 로딩과 CPU float32 block offload로 8/8 diffusion step을 실행했고, 생성 시간 226.52초, 실제 출력 20초/48kHz/스테레오 WAV, peak 0.89125/RMS 0.08930, SHA256 `2e7c57c8d936c670241a83b18dd5107314eae1b29904fab34c00076f3ff13945`를 생성 보고서에서 확인했다. 출력은 repository 밖 격리 runtime에 보존한다. Whisper-small 실제 가사 검증은 실행 중이다. 가사 일치·실제 타임코드·반주 분리·Part 음역·앱 연결·배포는 아직 완료가 아니다. 아래 다운로드 중/추론 전 표현은 준비 시점 기록이다.

사용자 정정에 따라 실제 곡 자료 요청/외부 자료 대기 판단을 철회했다. 단계 3에서 오리지널 곡과 가사를 조건으로 실제 음악 모델 생성→결과 검증→Guide/가사/Part 데이터 연결을 수행한다. 설치된 CPU PyTorch2.14.1/Diffusers0.41.0에 AceStepPipeline이 존재한다. RAM16GB/조회시가용5.7GB, disk84.1GB를 확인해 공식 2B Turbo 필수 component5.9GB를 선택했다. ACE-Step/Ace-Step1.5의 MIT/revision19671f406d603126926c1b7e2adc169acbcade22를 실제 모델 API로 확인하고 격리 runtime에 다운로드 중이다. 최초 SSL CERTIFICATE_VERIFY_FAILED는 기존 truststore로 OS 인증서를 사용하여 조회 재시도에 성공했다. 생성 script는 준비/구문 확인 상태이며 실제 추론/음질/가사 시간/반주 분리/앱 연결 완료로 표시하지 않는다. 디자인 변경 없음.

## 2026-10-08 실행 위치 교정 — 단계 3 녹음 세션

단계 0부터 기존 완료 조건/현재 코드/검증 근거를 다시 대조했다. 기준 보존 QA/build와 production 임시본/2·3·4 연속성은 통과했고 실제 P0 출력 계보·파일/사용자 계약도 재통과했다. 추론 재실행이나 서버 완료로 보고하지 않는다. 디자인은 보류하며 실행 위치는 단계 3이다. 앞서 단계 4 부분 수정을 섞은 실행을 단계 완료로 승인하지 않고 현재부터 신규 단계 4/5 작업을 추가하지 않는다.

화면명세 R01/R03/R04의 같은 Take/Timeline 조건에 대해 Production 동시 Start가 마이크 요청2회를 발생시키는 누락을 재현했다(2 != 1). 기존 Recorder 시작/정지에 즉시 ref guard와 busy 비활성화를 연결했고 Pause/Resume은 실제 recorder 상태로 중복 요청을 차단한다. 동시 Start 마이크1회/타이머1개, 동시 Resume 타이머1개, 동시 Stop 정상 Review·원본 audio URL·타이머0개를 격리 합성 마이크 QA로 확인했다. CSS/Record/시각 변경 없음. 단계 3 전체 관련 QA와 배포 검증은 마감 확인 후 기록한다. 실제 제공곡 timeline/물리 마이크/Guide 누출·지연/청취는 계속 미검증이며 전체 단계 3 완료가 아니다.

## 2026-10-08 단계 4 후속 — 독립적인 음역 적합순

PRD의 음역 적합순/역할 보완순과 화면명세 F01/F03을 대조했다. production 4d759cd에서 음역 적합순에도 역할 선호100점이 먼저 적용되어 Min이 여유가 더 큰 Joon/Noa보다 먼저 나오는 오류를 격리된 E3–E4 Part로 재현했다. 음역 적합순만 기존 실제 범위 여유값으로 독립 정렬한다. 종합 추천순의 기존 동작과 역할 보완순은 보존했다. 임의 점수·새 음색/취향 모델·실측 데이터는 추가하지 않았다. 같은 후보 상세 Back의 정렬·목록 복원과 참여/Track 불변도 유지 QA로 확인한다. 이는 demo 후보 fixture 계약이며 실제 추천 서비스 완료가 아니다.

## 2026-10-08 단계 4 후속 — Finder Empty와 조건 초기화

사용자 지정 Notion 화면명세 F01–F03의 Empty 문구·조건 초기화·같은 Project 복귀를 확인했다. production 81e7f69에서 역할 필터로 결과0건이 되면 안내/초기화가 없어 QA가 실패했다(0 != 1). 기존 empty-state/secondary 스타일을 재사용해 명세의 안내와 조건 초기화만 연결했다. 초기화는 필터와 정렬만 되돌리고 참여 배정·Track을 변경하지 않는다. CSS/Record/motion/추천 점수는 변경하지 않았다. 격리된 fixture와 실제 서버/실측 추천 검증을 구분한다.

## 2026-10-08 기능 후속 — 샘플 이탈/폐기·단일 프로젝트 생성·Complete Gate

디자인 보류를 유지하고 사용자 지정 Notion 화면명세 VP04/VP05/N03/N04/F01–F03 및 PRD 9 Complete Gate를 확인했다. 실제 production 0a93f1c에서 샘플 녹음 Back에 확인창이 없음(0 != 1), 동시 생성으로 프로젝트2개(2 != 1), 최종 확인 Back이 설정을 유지하지 않음(0 != 1)을 재현했다. 기존 RecordingConfirmation을 VoiceSetup에 연결하여 녹음 이탈 취소는 같은 녹음을 계속하고 확인은 정상 Stop→Review로 연결한다. 다시 부르기와 Take가 있는 다른 곡 선택은 확인 후 후보 Take만 폐기한다. 취소 시 같은 Take/곡 정보를 보존하고 기존 프로필/Project Track은 변경하지 않는다. 샘플 시작/정지에는 즉시 ref guard와 busy 상태를 연결해 중복 시작·정지/타이머 누적을 막았다. CSS/Record renderer/motion은 변경하지 않았다.

CreateProject는 동시 최종 확인을 즉시 차단하고 프로젝트1개만 생성한다. 최종 확인 Back은 입력 설정을 보존하여 수정하게 한다. 생성 전에는 프로젝트/Track을 추가하지 않고 생성 후 나Assigned·나머지OPEN·0/N을 유지한다. Key 안내는 기존 실제 첫 녹음 시작 시 확정 동작과 맞춘다.

Complete Gate는 알려진 tessitura/comfortableRange가 서로 맞지 않아도 eligible=true이던 오류를 실제 Node 계약에서 재현했다(true != false). 알려진 주요 음역의 불가능 조건을 Gate 실패로 반영한다. 메타데이터가 없는 경우의 기존 표시/계약과 음역 여유/설명은 보존하며 임의 곡/음역/추천 점수를 추가하지 않는다.

로컬 qa:profile은 정상 녹음 종료·이탈/폐기/곡변경 취소와 기존 Take/프로필 보존·타이머1개를 확인했다. qa:navigation은 2/3/4 Part의 최종 확인 전 미생성·Back 선택값 보존·동시 클릭 단일 생성·배정/OPEN/0Track·reload를 확인했다. 유지 QA를 확장했으며 실제 마이크/음질/공유 서비스 완료와 구분한다. 전체 단계3/4/5 완료를 선언하지 않는다.

## 2026-10-08 기능 후속 — R07 동시 제출 차단

기존 production db8143e에서 같은 시점 제출 버튼을 두 번 클릭하면 Track 저장 시도가 2회 발생하는 오류를 실제 재현했다(2 != 1). Recorder에 즉시 적용되는 제출 ref guard를 추가해 첫 요청부터 중복 실행을 차단한다. 실패한 경우 잠금을 해제하여 기존 Review/원본에서 재시도하며 성공 이후까지 잠금을 유지한다. UI의 기존 제출 중 비활성화·성공 후 workspace/Mix/Complete 흐름을 보존한다. 디자인은 변경하지 않았다.

유지 qa:continuity는 2/3/4 Part에서 동시 두 클릭→저장 실패1회·원본 SHA256 보존→동시 두 클릭 재시도→저장 성공1회·실제 합성/완성/재접속을 확인한다. 프로필/보관함 기능 commit db8143e는 Git 자동배포 READY(dpl_DDXkeCGPKgKCyj1jD4t9Lwpbnj5t), HTTP200/배포 asset 해시 일치, Production qa:profile/qa:navigation/기존 qa:record-errors 통과를 확인했다. 기능 전체·실기기·실제 서버 완료를 주장하지 않는다.

## 2026-10-08 기능 우선 — 단계 4 프로필 저장·편집·복귀

사용자 지정 화면명세 Y01–Y04/VP03–VP06와 유저플로우 UF03/UF12를 확인했다. 실제 기존 production에서 음역 편집 취소가 detail로 이동하는 오류를 재현했다(detail !== my). 최초 등록과 수정의 실제 진입 화면을 기억하고 기존 history를 이용해 복귀하며 편집 모드가 다른 진입에 남지 않도록 했다. 프로필 저장 실패는 마이크 재시작을 제공하지 않고 기존 프로필/새 Take를 보존한다. 프로필·취향 저장의 동시 클릭은 ref guard로 막고 저장 중 해당 조작을 비활성화한다. 최초 등록의 음역/샘플은 단일 IndexedDB transaction으로 저장하여 한쪽 실패 시 둘 다 rollback한다. 음역만 변경하면 샘플은 보존하고 샘플만 교체하면 음역/Project Track은 보존한다. CSS/시각 디자인/Record motion은 수정하지 않았다.

build/전체 유지 QA 및 qa:profile이 통과했다. 격리 브라우저에서 편집 취소→내 프로필, 실제 합성 입력 음역 재측정→샘플 보존, 샘플 저장 실패→기존 프로필/같은 Take 유지→재시도→reload, 중복 저장 클릭1회 쓰기, 취향 편집 취소/실패/재시도/reload, 최초 Setup→내 프로필 복귀·자동 참여 없음이 확인됐다. 저장 QA는 실패 시 기존 두 레코드 보존과 최초 부분 등록 없음도 확인한다. 합성 마이크 검사이며 실제 발성·제공곡·협업 서버 인수를 의미하지 않는다.

보관함에서 주 프로젝트를 열 때 이전에 활성화한 사용자 프로젝트가 열리는 오류를 실제 production에서 재현했다(qa-other-project != ieum-thousand-years-v7). 기존 openMainWorkspace 경계로 주 프로젝트의 작업실/완성곡을 열도록 연결했다. qa:navigation은 해당 오류 수정, Like 해제 후 참여/Track 보존, 곡/보컬 왕복 후 보관함 탭 유지, 저장에 따른 초대 없음, Home H01의 같은 모집 영역 포커스를 확인했다.

단계 3 임시본 보정 commit 9a4ca88은 Git Integration READY(dpl_BHigsSJLKm2zTzE4c4UnfrnvHwdf)와 production qa:drafts/qa:record-errors 통과를 확인했다. 디자인 인수는 보류다. 단계 3 실기기·실제 곡 timeline, 단계 4 전체 탐색/초대/복귀 전수 검증, 단계 5 인증/공유 저장/원자 배정/7일 Push는 미완료다. 실제 제공곡/타임코드/서비스 연결 정보는 확보하지 못했으며 존재한다고 표시하지 않는다.

## 2026-10-08 기능 우선 — 단계 3 임시본 정리·가사 Empty

사용자 지시에 따라 디자인 수정/인수를 보류하고 기능 단계 3부터 계속한다. 기존 화면/CSS/Record motion은 변경하지 않았다. 사용자 지정 화면명세 R06/R07/R08 및 Lyrics.Empty를 기준으로 이전 키에서 복원한 임시본의 폐기/제출 후 재등장 오류를 수정했다. userId/projectId/partId 기준 현재·이전 키를 단일 IndexedDB transaction에서 정리하며 실패 시 두 원본을 rollback한다. 다른 소유자와 비임시본은 보존한다. 저장·제출 성공 전 원본 삭제를 추가하지 않는다. 가사 미등록 상태는 가상 연습 가사 대신 명세의 ‘가사 없음’을 표시한다.

build/전체 유지 QA, 실제 격리 브라우저의 소유자 없음/본인/다른 사용자 복원·폐기·재진입 및 기존 오류·2/3/4 Part 합성 경로가 통과했다. qa:drafts를 유지한다. 실제 제공곡 가사/타임코드/반주는 미확보이며 실기기 마이크/청취와 단계 3 전체 인수는 미완료다. 단계 4의 독립 기능 검증을 계속하고 서비스 환경이 필요한 단계 5는 실제 연결 정보 확인 후 진행한다.

## 2026-10-08 단계 2 — 다시 녹음 실패와 타이머 보존

기존 다시 녹음은 임시본 삭제 전에 현재 녹음을 취소했고 성공 후 UI 타이머도 정리하지 않았다. 임시본 삭제 성공 이후에만 타이머/현재 녹음을 정리하고 Ready로 전환한다. 삭제 실패는 현재 Recording/Paused/Review·Take를 유지하면서 실제 오류를 표시한다. 마이크 오류 여부를 별도로 기록해 저장/삭제 실패를 마이크 시작 실패로 안내하지 않는다. 녹음 폐기 확인과 성공 후 기존 Ready 흐름, 원본/다른 참여자/Key/Record는 보존한다.

격리 합성 마이크·IndexedDB delete 실패 검사에서 Recording 경과 계속 진행, Paused 유지, Review 오디오 URL 유지와 권한 재시작 버튼 없음이 통과했다. 성공 후 UI 녹음 타이머가 0개로 정리됐고 반복 시작/폐기 후에도 누적되지 않았다. 유지 QA verify-retake-lifecycle을 qa:record-errors에 포함한다. 실기기·실제 서비스 검증과 단계 2 전체 인수는 미완료다.

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
## 2026-10-11 RAM 제약에 따른 AI 실행 보류

이 기록 당시 앱 코드/음원 등록 변경은 없었다. 현재 실행은 위 재계획 기록을 따른다. 단계3 전체는 미완료이며 기존 검증된 녹음·Draft·직접 제출·2–4 Track Mix 구현을 보존한다. 최신 사용자 지시에 따라 PC 자원 확인 후 로컬 AI 실행 여부를 결정한다.

실제 프로세스 확인에서 음악 생성/변환 검증 Python 작업은 없었다. 시스템 RAM은 15.95GiB, 여유는 1.08GiB로 확인됐다. 다른 앱 종료나 Windows/pagefile 설정 변경은 수행하지 않았다. 모델·결과 파일과 미커밋 SFT 지원 QA 수정은 보존하며, SFT의 실제 GPU 생성·품질 및 Base 회귀 검증 완료를 주장하지 않는다.

자원/일정 운영 변경은 기존 구현계획의 2026-10-11 항목을 따른다. 단계4/5 착수 gate는 변경하지 않았다. 외부 추론 기술 검토와 독립적인 잔여 기능 조사는 가능하지만, 유료 환경 생성이나 현재 단계 완료 처리는 하지 않는다.
