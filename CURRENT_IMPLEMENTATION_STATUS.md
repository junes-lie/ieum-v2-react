## 2026-10-12 R2 VP03 음역 추천·Match 대상/Team 연결

앞선8fe0345 main/origin push 및 Vercel Git Integration Production7011339105 success. HTTP200/index-xGqs2nRY.js SHA256 D40FDBD79B6352998752831EA2705B4AFBBCEDCAC36D5F63CF2FEDDF9FAD2D41 local exact. 배포된 commit의 Finder QA 원본을 TEMP에 read-only 추출해 Production에서 실행했고 취향/필터/이력·Collection/05A Setup 취소/저장 복귀 모두 통과했다. 임시 QA 파일은 repository에 포함하지 않았다.

후속 앱 변경: VP03의 실제 저장/측정 음역→기존 제공곡 참고 음역 비교→맞는 구간 우선·초기 preview 연결. manual 선택 유지·맞는 구간 없음 안내.05 Match에 선택된 곡/Project/Part/Key/요구 음역과 현재 배정·제출 참여자를 연결하고 현재 Gate의 이유를 표시한다. 후보 대표 Sample 없으면 빈 상태이며 다른 Track을 대체하지 않는다. 현재 Team 음역/역할은 등록 정보 비교이고 음색 조화 분석은 준비되지 않음으로 유지한다.

로컬 native 추천 QA는 좁은 범위의1개 추천·correct preview·다른곡 직접 선택·미추천 범위·Profile/제출2개/미참여 보존 통과. 기존 provided QA는3곡 asset hash/실제 Guide·15–20초 구간·가사/Guide toggle·권한 지연/파일 실패·원본 보존 통과. 새 Match target/Team/대표 Sample 없음·기존 Finder 정렬/이력 통과. build39modules/516.18KB 및 기존 Node 여정 통과,기존500KB 경고 유지. 음원 신규 등록·음악 품질 승인·로컬 대형 AI/비용 지출 없음. 실제 마이크/청취/협업·음색 분석과R5/R6는 미완료다. 관련 묶음만 검토/stage→main→Git Integration→Production QA로 마감한다.

## 2026-10-12 R2 최신 로컬 Notion 대조와 Finder/05A 기능 연결

사용자 승인 fallback으로 `레코드판/노션/*_261009.md`5개를 최신 파일 집합으로 확인했다. Notion 도구0개·온라인 미확인 상태는 유지한다. 관련 PRD8–10/화면명세04·05·05A·09·10·VP/유저플로우2D·3·Identity/IA 경로를 읽고 실제 React와 대조했다. 화면명세는 이전 export와 동일 SHA이고 IA/PRD/PROJECT/유저플로우는 다르다. 미정 Identity 정책은 최신 로컬본에서도 미정이며 임의 확정하지 않는다.

앱 변경: Finder의4개 누락 필터와 전체 초기화, 저장된 내 장르·취향에 따른 취향 정렬·편집 즉시 반영. 기존 음역 Gate/역할 정렬 유지. 실제 음색 비교가 없으면 음색 조화순을 비활성하고 내 Profile이 없으면 취향 정렬을 비활성한다.05A는 등록 전 허구의 궁합을 표시하지 않고 기존 Setup 진입을 제공한다. 완료·취소·브라우저 이력에서 같은 보컬로 복귀하고 등록 후 실제 저장 음역/역할/공통 취향을 보여준다. 별도 화면/디자인/그래픽 생성 정책은 추가하지 않았다.

로컬 검증: native Finder의 실제 범위/역할 순서·취향 비교·저장 편집 반영·필터 조합/Empty/전체 초기화/후보 이력,Collection 기존 저장·스크롤·05A Setup 취소 및 Back/Forward,synthetic microphone의05A→측정/Sample 저장→같은 Luna/저장 보컬 탭 복귀 모두 통과. 참여=false·초대=false·기존 제출2개 유지·Profile에 저장된 음역/장르 비교 확인. 기존 Node 사용자 여정과 build39modules/513.79KB 통과, 기존500KB 경고 유지. sandbox Edge 실행은 `Target page, context or browser has been closed`/파이프 오류로 종료했으며 동일 headless QA를 정상 host 환경에서 실행했다. Computer Use/Notion UI/Figma UI 우회 없음. 물리 마이크·청취·온라인 협업·실측 음색·R5 Identity는 미검증이다. 사용자 서버3파일 보존/commit 제외, 관련 묶음만 Git Integration→Production QA로 마감한다.

## 2026-10-12 사용자 결정 — deAPI 진행 제외

사용자는 무료 크레딧 안에서 확정적으로 완료할 수 없으면 진행하지 말라고 답했다. 필요한 음악 품질·재시도 횟수를 보장할 근거가 없어 deAPI 가입/연결/시험을 진행 대상에서 제외했다. 기존 구현계획을 직접 수정하고 계정 연결 대기 문구를 닫았다. 조사 이력·실제 음악 요구·기존 완료 증거는 보존한다. 앱/사용자 변경3파일 수정, 계정 생성, API 요청, 비용 지출, 로컬 AI 실행 없음. R6 실제 음악은 미완료이며 무료 크레딧 후보 조사로 완료 처리하지 않는다.

## 2026-10-12 R6 무료 시험의 실제 입력 오류 확인

직전 단순 call의 null 오류를 공식 Gradio queue 경로에서 좁혔다. 공개 config의 실제 fn77/54입력(49공개 + 5내부 State)을 대조하고 상세 이벤트를 읽었다. event938e52e9e6f84305b6d2e81a182a4f0c는 success=false, 실제 오류 `Value: wav is not in the list of choices: ['mp3', 'flac']`다. 앞선 요청에서 출력 형식 enum을 검증하지 않은 실행 오류이며 인증/무료 할당량 문제로 단정하지 않는다.

공식 지원 flac로만 교정한 event95e02866a1d04d70a8a6cf76ffdcdec8은 실제 CoT metadata→audio codes 생성에 진입했지만 duration 초과 경고 뒤 `GPU task aborted`/success=false로 종료했다. 18:16:58 KST 요청/18:21:55 이전 terminal 관측이며 정확한 GPU 사용시간은 제공되지 않았다. 실제 진행 증거와 음악 생성 실패를 구분한다. 관측 session84761 exit0는 HTTP 조회 성공이며 생성 성공이 아니다. 추가 observer3023도 종료 확인, live 생성 요청 없음.

공식 Thinking/CoT 네 옵션만 끄고 다른 입력을 유지한 대조 event92ee9605ea3f4ce79926ec179d399666은 `You have exceeded your ZeroGPU quota (180s requested vs. 0s left). Try again in 23:53:04. Authenticate with a Hugging Face token for more quota - https://huggingface.co/settings/tokens`/success=false로 종료했다. 이 요청 전 숫자 ID의 형식 차이를 preflight에서 거부한 Unknown LM control 오류를 교정했으며 해당 preflight에는 API 요청이 없었다. 실제 quota 차단 뒤 추가 요청 없음. 결제/계정 생성/모델 설치/로컬 AI 실행/출력 음원/후보 등록 없음. 기존 오류와 요청·terminal SSE는 TEMP에 각각 보존한다. 익명 무료 경로는 현재0초로 미완료이며 quota 우회 없이 실제 할당량 확보 후에만 다음 음악 검증을 진행한다.

## 2026-10-12 R6 예산 0원 / 무료 공개 API 실제 시험

사용자가 외부 AI 예산0원을 확정했다. 기존 구현계획에 유료 GPU/API/구독·크레딧·자동 결제 시험 제외와 무료 실행 gate를 직접 반영했다. 과거 유료 후보 비교는 이력이며 현재 실행 추천이 아니다. 앱/사용자 서버3파일/기존 CPU·GPU 환경 변경 없음.

공식 Hugging Face REST 조회에서 ACE-Step/Ace-Step-v1.5 runtime RUNNING/zero-a10g·공개/비gated·revision7403460e9b34972f760317b56048f6cb9d4a3a11, 공개 generation_wrapper49입력을 확인했다. 비로그인/결제 없이 XL Turbo에 직접 작성한 한국어 한 줄/12초/80 BPM/G major/seed6534626/batch1을 실제 요청했다. event04debbb63afb4331bf2727076eb9db40 반환 이후 결과 스트림이 `event: error`, `data: null`로 실패했다. 상세 원인/출력 음원은 제공되지 않아 인증·할당량·모델 실패를 추측하지 않는다. 요청과 SSE는 TEMP의 ieum-free-space-trial-6534626.json/.sse에 보존한다. 로컬 AI 실행0회/실제 비용0원/앱 후보 등록 없음.

최초 sandbox HTTP는 '알려진 호스트가 없습니다'였고 허용된 네트워크 조회에서 API에 연결했다. Computer Use/Notion·Figma 웹 접근/결제/계정 생성 없음. 무료 공개 데모의 접근 성공과 실제 생성 실패를 구분하며 R6 음악 gate·전체 일정은 미완료/조건부다. 코드 변경이 없으므로 직전 ab12ca1의 build/Production 증거를 재사용하고 동일 QA·실패 생성은 반복하지 않는다.

## 2026-10-12 승인 일정 반영 / R1 Auto Mix 재시도 마감

기존 구현계획의 상위 실행 절에 승인된88–144h/11–18작업일 잠정 예산·10/14 선행 판정·10/30 조건부 목표/10/27–11/5 예상 창, 탐색2h/AI 가설2h·경로 선정4h·관련 검증/배포 묶음·실제 시간/외부 대기 분리 표를 직접 반영했다. 과거 단계/증거/미정 정책과 사용자 서버3파일을 보존한다. 이전15–27일과 범위가 달라 확정 단축량을 주장하지 않는다. 과거 실제 공수/대기 시간은 측정하지 않아 임의 값을 쓰지 않는다.

R1: Mix 저장 실패를 재현하고 workspace의 기존 오류 영역에 explicit retry를 연결했다. 제출이 모두 성공하고 Mix가 없으며 error 상태일 때만 재시도한다. 프로젝트별 동기 요청 guard로 같은 tick2click도1job, 자동 무한 retry 없음. 재실패 시 원본/미완성 보존, 실제 저장 성공 이후만 완성. 기존 jobs/믹서/식별자를 재사용하며 legacy Multitrack wrapper·디자인·사용자 서버 변경은 그대로다.

직전 실행 handle80220의 terminal exit0를 확인했다. native2/3/4 및main에서 최초 실패→실패 retry→성공 retry(각 double click1job)→실제 Mix1개 저장·완성/reload, 원본 SHA/제출수 불변·실패 URL 해제 QA 통과. current build39modules/index-DdMAPXaO.js SHA0D96CED02F06AA6EC9F54B670FBB3710163BB1BF29C9ABFA51DFBB1AD23A0C14, audio foundation/원자적 제출 QA exit0. 기존511.69KB chunk 경고 별도. 합성/fixture 입력이며 물리 입력·청취·실제 협업/전체 R1 완료가 아니다. 관련5파일만 commit/main 자동배포→Production 재시도로 마감한다.

R6는 공식fal/Eleven Music/Runpod 문서에서 외부 후보·비용/제어 한계를 비교해 기존 계획에 기록했다. 실제 요청·계정/지출/업로드·원격 generation 없음. 경로 선정 전체 gate는 접근/비용 한도·권리·실제 짧은 시험 전 미완료. 구간 가사·duration 제어를 정확한 성부/MIDI로 확대하지 않는다. Notion/figma 노출 도구0개이며 정책/시각 원본 확인을 주장하지 않는다. 다음은 R1 Production 마감→R2 제한 대조, 접근 가능한 경우만 R6 실제 시험이다. R3→R4/R5/R7 미완료 유지.

이번 승인 후 첫 관측 구간10/12 17:45:49–17:50:18 KST는269초이며 계획/자료 조사/로컬 확인의 합산 wall time이다. 묶음별 실효 공수로 중복 배분하지 않는다. build/audio foundation/atomic submission 명령5.160초·exit0; 기존 native QA 결과 재사용. 실제 지출/모델 실행0이며 계정/정책/물리 인수 대기 시작 시각은 미측정으로 유지한다.

## 2026-10-12 R1 Draft 나가기 저장 경쟁 마감

기존 승인 계획의 R1/R2 우선을 적용했다. native IndexedDB completion 지연 후 My로 이동했을 때 이전 Recorder의 save callback이 Workspace로 되돌리는 실제 실패(workspace != my)를 재현했다. 현재 Recorder에서만 나가기 완료를 처리하고, 동기 ref로 중복 저장 및 저장 중 제출을 막는다. 제출 중 Back도 무시하며 저장 실패는 Review 원본을 유지하고 버튼을 다시 활성화한다. 기존 확인 후 종료·직접 제출 계약/화면/디자인은 유지한다.

신규 qa/verify-draft-leave-race.mjs: 저장 거부 후 Review 유지·중복 Back 1회 저장·저장 중 제출 차단·오래된 완료의 현재 화면 보존·복귀 Draft SHA exact/제출수2 불변·정상 나가기·합성 녹음 종료 후 저장 실패/재시도 통과. 기존 Review URL/실패 제출/성공 제출 및 reload hash·retake3상태/중복/지연 삭제 QA, atomic submission·draft cleanup 및39module build 통과. pageerror0. 물리 마이크·청취·전체 R1 완료 증거가 아니다. bundle511.16KB의 기존500KB 경고는 별도 유지한다.

Notion/figma 이름의 노출 도구0개를 확인했다. 전용 원본을 읽었다고 주장하지 않으며 사용자 확정 범위의 기존 기술 결함만 수정했다. 사용자 서버3파일은 그대로 제외한다. 관련4파일만 diff 검토→commit/main push→Git Integration→Production 동일 QA로 마감하고 R2/R5/R6/실제 서비스/종합 인수의 미완료 gate를 유지한다.

## 2026-10-12 R6 고정 원본 APG/Euler 계산 대조

직전604ee21과 기존 사용자 서버3파일만 남은 Git 상태를 확인했다. 모델·새 음원 없이 원본 ca1e85fe9430179831e6bc6be790c332190a3866의 APG/Momentum/project 선언 및 Euler branch AST를 설치된 Diffusers APG/FlowMatchEulerDiscreteScheduler와 비교했다. Base apg_guidance.py는 common 경로의 re-export이므로 공식 고정 common/apg_guidance.py 작은 파일만 기존 private source 폴더에 보존했다. source SHA89ecdc4686e174225d6e6d304939d75892297dc3c19fbb11e04345dc3d4685db/native SHAf3edaa0f86ce174c0c6703a8d80442673783ba96515a0fa84126a9b605b0919d을 검사한다. 원본 전체 module/main 또는 모델은 실행하지 않는다.

CPU FP32의2×200×64 controlled prediction으로32/50/64steps×shift1/2/3의9조건을 대조했다. schedule/terminal sigma exact, momentum exact, APG velocity와 매 step Euler latent의 최대 absolute 차이0이었다. 기존 실제 실패 candidate의50steps/shift1 APG/Euler 핵심 수학 차이를 이 controlled 시험에서 관측하지 못했다. actual DiT forward·음향 조건·VAE/decoder·전체 sampler parity나 음악 품질을 통과한 것이 아니다. 결과는 기존 private runtime의 sampler-math-86199ed98f9747849dddb0985c87c39a.json에 보존했다.

같은 고정 source AST로 partial CFG interval의 원본 t_curr 기준 vs현재1-t_curr 기준 차이를 확인했다(.2–.7 구간에서 timestep.2는 native true/현재false). 기본 전체0–1 구간은 양쪽 일치하므로 현재 기본 후보 실패의 원인으로 단정하지 않는다. 원본 generate_audio는 DCW default enabled/scaler.05/high.02지만 현재 pipeline의 APG/Euler 범위에는 해당 후처리가 없고 이번 시험에서도 제외했다. 원본 cover switching/repaint injection/기타 sampler 옵션도 제외한다. 이 차이를 이유로 기본 실행 환경/새 정책을 임의 수정하거나 동일 후보를 재생성하지 않았다.

다음 원인 대조는 actual DiT의 projection/attention·조건 mask 및 native 후처리의 적용 범위다. 코드에서 current Transformer가 cross-attention mask를 받지 않는 것을 확인했으나 actual1사용자 packed condition의 영향은 측정 전이라 원인/수정 완료로 기록하지 않는다. 정책/형상/기술 환경 변경·모델 설치·대형 AI 실행 없음. source/기존 결과·CPU 환경·사용자 서버3파일을 보존하며 유지 대조 도구와 현재 문서만 main 자동배포→Production 동일 앱 보존으로 마감한다. 전체 R1–R7 미완료 gate 유지.

## 2026-10-12 R6 저메모리 실행 경로 마감 / 음악 품질 미통과

직전c46c548/4caf550의 R1 마감 코드와 사용자/AI 미커밋 상태를 확인했다. 기존 단계·Goal·앱은 보존하고 아직 미커밋이던 실제 실행 검증 경로를 검토했다. opt-in low-ram-base-cache는 기존13개 FP32 disk group을 변환 원본476tensor의 exact F32/BF16 bytes와 bounded 비교한 뒤 meta DiT/eval·native2block offload로 재사용한다. cache/원본을 새로 만들거나 바꾸지 않는다. native prompt 출력은 유지하고 text 모델과 bound-method 순환 참조를 반환한다. bounded-condition-cuda는 실제142개 FP32 checkpoint를 tensor별로 CUDA에 직접 로드하고 원본/전송 bytes·shape/finite를 검사한다. 완전한 CPU condition 모델을 먼저 만들지 않으며 각각의 CPU staging tensor 상한64MiB와 CUDA2GiB headroom을 유지한다. 전체 staging 메모리가64MiB라는 뜻은 아니다. 기본 CPU 환경/기존 생성 경로는 유지한다.

보존된 actual 실행 증거: condition checkpoint2437318656bytes·largest50331648bytes·142tensor exact, standalone loader wall21.21095초/exit0/guard 중단false/free최소7.969GiB/worker최대.754GiB. 전체8초/50step CUDA FP32 생성은 finite latents 및 WAV SHAe5115769aee201c71088245fcccc12772a67c663ab60658742ecc0f8ccb9b05b을 저장했다. inference390.81864초/전체wall545.65474초/free최소4.37174GiB/worker최대4.33031GiB·guard 중단false다. 종료는 마지막 stdout의 cp949 UnicodeEncodeError로 exit1이므로 CLI 성공으로 표시하지 않는다. inference 속도 해결이나 native 전체 sampler/decoder parity 승인도 아니다.

두 실행 report의 UTF-8 파일은 유지하고 JSON stdout만 ASCII escape하도록 보완했다. 보존된 실제 generation/ASR report의 마지막 print AST를 cp949 콘솔로 실행해 JSON roundtrip exact와 실패 가사 판정 불변을 확인했다. 이 로그 수정 때문에 동일 대형 생성을 반복하지 않았다. explicit timestep shift는 진단 옵션이며 기본값을 바꾸지 않는다. 같은 seed만으로 source posterior를 포함한 전체 PCM 재현을 보장하지 않는다.

ASR은 명시 asr-device cuda에서 같은 FP32/native 모델 계산·실제 weight SHA·2GiB GPU headroom을 검사한다. CPU 기본/자동 fallback 없음. 보존된 실제 Turbo CUDA 실행 wall15.04709초/exit2/guard 중단false/free최소6.96393GiB/worker최대1.64240GiB이며 가사 유사도0.0/등록false다. CPU Turbo의 RAM 중단과 실제 GPU 인식의 품질 실패는 구분한다. CPU 기본 경로를 바꾸지 않았으나 이번 마감에서 실제 CPU 모델을 다시 로드하지 않았다.

작은 CPU/CUDA48byte checkpoint fixtures의 exact F32/signed-zero·params/buffers/eval·잘못된SHA/shape/dtype/NaN/누락/잘림 거부, 모델 없는 pre-denoise 강제 중단·native 실패/기존 method/hook 복원,9파일 AST syntax 검증 통과. 현재 PC15.95GiB/free6.05GiB·GPU830MiB/12%로 대형 모델 시작 기준8GiB 미달이라 재생성하지 않았다. 런타임의 'Failed to find real location of C:\\Python313\\python.exe' 경고와 QA exit0를 구분한다.

보존된 초기 source/condition·일괄 condition.to(cuda)의 RAM 중단, headroom 실패, prompt 순환 참조와 실패 결과도 유지한다. resident-condition-cuda 진단은 실패한 경로이며 기본/성공 경로가 아니다. 모델/checkpoint/음원/trace/result는 기존 private runtime에 보존하고 유지 실행/QA9파일만 이번 묶음에 포함한다. 사용자 서버3파일은 제외한다. 앱 변경 없는 묶음이므로 검증된 동일 build/Production bundle을 재사용한다. 다음 R6는 실제 sampler/decoder 이식 정확성 또는 실제 음절/음표 제어 근거이며 같은 실패 seed/guidance 반복·QA 문턱 완화·후보 등록은 하지 않는다. R5 형상·서비스·물리 인수와 전체 음악 gate는 미완료다.

### R1 배포 마감 / R6 보존된 독립 인식 결과 확인 — 2026-10-12

R1 수정4caf55077d785d1856c186950e44f8c0dae017e1은 origin/main push/동기화0/0·동일 commit Vercel success를 확인했다. Production HTTP200/index-CmugzJuL.js SHA7D1119CC141D9DC490A6AE3CEBA7EE8868AC08A66D0EBD878EF320AD2C342207은 검증 build와 exact다. Production retake QA에서 실패3상태 원본 보존·중복 확인1transaction·지연 삭제 완료 이후 새 recording/타이머·pageerror0 통과. QA의 개발 전용 /src/audio.js import를 기존 공개 진단 audioRuntime.recorder.state 조회로 바꿔 Production에서도 같은 검증을 재사용한다. 실제 마이크·청취/전체 R1 완료는 아니다.

미커밋 R6의 보존된 실제 Turbo CUDA FP32 인식 report를 읽었다. 입력 WAV SHAe5115769aee201c71088245fcccc12772a67c663ab60658742ecc0f8ccb9b05b·8초/48kHz·원본 hash 검증 true, 모델 인식은 '아 아 아 아', 기대 '오늘도 함께해요'와 textSimilarity0.0/lyricAcceptance=false/catalogRegistrationApproved=false다. 새 모델/음원 생성은 하지 않았다. GPU 실행 결과 존재가 음악 품질 성공이 아니므로 후보는 앱에 등록하지 않는다. 기존 CPU Small 실패·Turbo CPU RAM 중단과 CUDA의 실제 인식 완료를 구분한다. 다음 R6는 같은 실패 후보 재생성이 아닌 실제 sampler/decoder 및 제어 경로의 근거 확보다. 미커밋 AI 코드/결과는 보존하고 이 R1 묶음에 stage하지 않는다.

## 2026-10-12 R1 삭제 확인 중복·지연 응답의 새 녹음 보호

직전87629f1의 확정 계획 적용/관련 QA 마감을 현재 Git main에서 확인하고 완료된 범위를 재구현하지 않았다. 기존 Recorder에서 Review의 삭제 확인을 같은 tick에 두 번 누르면 readwrite transaction이2개 실행되는 실제 assertion2!==1을 재현했다. 삭제 요청 ref와 기존 busy 상태를 연결해 하나만 진행하며 modal 취소/확인·기존 leave를 처리 중 잠근다. 삭제 실패는 기존 녹음/Review·URL을 유지하고 finally에서 잠금을 해제해 다시 시도할 수 있다. 컴포넌트 종료 후 삭제 완료는 전역 cancelRecording/새 Recorder 상태에 손대지 않는다. 화면/문구/삭제 정책·다른 참여자 Track·디자인 변경 없음.

기존 qa:record-errors의 retake QA를 확장했다. recording/paused/review 삭제 실패 원본·Review URL 보존, 같은 tick 확인2회→transaction1회, 정상 삭제 URL 해제/타이머 정리, IndexedDB completion 보류→popstate 이탈→새 Recorder 시작→오래된 완료 후 새 recording/타이머 보존과 pageerror0을 통과했다. 최초 지연 사례는 recordPart가 history를 push하지 않는 기존 경로에서 page.goBack으로 workspace를 가정해 timeout이었다. 기존 popstate handler에 명시 workspace history state를 주입하는 격리 시험으로 교정했다. 물리 브라우저 Back 정책 검증이나 물리 마이크/청취 인수로 확대하지 않는다.

build39modules/510.88KB(기존500KB 경고 유지), atomic Draft cleanup/소유자 경계, single App Node2–4Part 렌더 통과. 관련 변경만 diff/staged diff 검토 후 main Git Integration→Production retake QA로 마감한다. 기존 미커밋 AI9파일/사용자 서버3파일은 보존·제외한다. Notion/figma-desktop 노출0개로 원본을 읽지 않았고, 사용자 확정 R1 코드 결함 범위만 수정했다. 전체 R1 물리 인수/R2 최신 요구 대조/R5 형상/R6 음악·실제 서비스 gate는 미완료다.

## 2026-10-12 확정 계획 적용 / R1·R2 마감 기준 확인

사용자가 확정한 검토 계획을 기존 docs/IMPLEMENTATION_PLAN_2026-10-07.md의 최상단 실행 기준으로 반영했다. 기존 단계 0 완료, 1–4 부분 완료(2 디자인 보류), 5 서비스 미연결, 6 종합 인수 미완료를 유지한다. 기존 단계와 R1–R7 대응표·잔여 유형·완료 조건을 명시하고 과거 엄격한 전체 단계 대기/배포 금지/미구현 목록 해석의 충돌을 정리했다. 새 문서·앱·제품 정책·디자인 변경 없음.

현재 R1/R2 입력·저장·복귀 경계를 재사용하여 관련 범위만 확인했다. production build39modules/510.63KB 성공(기존500KB 경고 유지). 제출 원자성/경쟁·실패/retry 및 Node 사용자 여정(2/3/4 Part 원본/계보 재로드 포함), Profile 원본/atomic 저장 QA 통과. 실제 기존 React headless QA에서 Profile range/Sample 편집 History·취소/기존값 보존, Setup 취소/저장 후 원래 Bass Part와 Fit 재검사·자동 참여/Track 없음, 2/3/4 Part Mix 저장 실패 시 원본 hash/미완성 보존 및 정상 reload 후 하나의 Mix 저장을 통과했다. 확인한 경로에서 새 코드 결함을 발견하지 않아 기존 앱을 다시 구현하지 않았다. 물리 마이크·청취·다양한 사용자 신뢰도 인수는 아니다.

최초 npm 개발 서버 인자 전달은 의도한 포트가 적용되지 않아 해당 소유 서버를 종료했다. 명시 Vite 실행의4207포트 충돌 뒤 기존 서버는 보존하고4261 전용 포트를 사용했다. sandbox Edge launch는 Target page, context or browser has been closed로 앱 QA 이전에 실패했으며 동일 headless QA와 소유 임시 서버를 허용된 실행 환경에서 재실행해 통과했다. GitHub 조회의 sandbox 연결 오류도 허용된 읽기 조회에서 main0b132f8을 확인했다. Computer Use/Remote Figma/직접 deploy 없음.

현재 노출 Notion/figma-desktop 도구0개로 최신 원본을 읽지 않았다. 사용자 확정 실행 규칙 및 정책 판단 없는 기존 코드 검증만 수행했다. 다음은 최신 요구 확인 후 R2 잔여 누락 대조, R1 물리 입력/진입/음량 인수, R5 정책 독립 선행과 R6 실제 제어 검증이다. 서버 접근·개인 형상 승인·음악 품질을 임의 확정하지 않는다. 기존 사용자 서버3파일과 미커밋 AI 실행/진단 변경은 보존·이번 문서 commit 제외. 앱 build JS SHA39509AA129CA1D0F39DED94EB1C660BF021700509F272D748B7278E7715DAB1B 유지. 배포 완료 증거는 실제 자동배포 확인 후 별도 기록한다.

### R5 제출된 Track → 개인 Layer 입력 선행 연결 — 2026-10-12

기존 voiceIdentitySources/Track 계약에 read-only loadSubmittedTrackIdentityInput을 추가했다. canonical Project/Part 제출 키로 실제 저장 record를 읽고 개인 결과 소유자와 participantId·live 제출 origin·원본 SHA/크기·source revision/analysis version을 확인한다. 명시적으로 전달받은 개인 결과 참조는 비동기 read 전 snapshot이며 기존 buildTrackIdentityInput에 실제 분석/지원 한계와 목적을 전달한다. 개인 user ID 원문은 반환 입력에 넣지 않는다. Review/Sample·legacy provenance·미지원 분석/불일치 원본·소유자 불일치를 거부하며 BPM/호흡 등 미지원 후보null을 유지한다. 기존 Profile/Track revision·동일 입력 digest·read-only/변조 거부 및 QA identity 회귀 통과. fixture 개인 참조를 사용한 데이터 준비 검증이며 개인 결과 승인/형상 생성·Track 변형/Record 결합 성공 또는 자동 갱신 정책이 아니다. 그래픽/제출/Mix 상태·기존 앱·디자인/원본은 변경하지 않는다. qa:identity에 유지 검사 연결, build/기존 제출 회귀→main 자동배포→Production 앱 보존으로 마감한다.

직전17633a4 Git Integration success·Production HTTP200/기존 index-DlRbC8xD.js SHA39509AA129CA1D0F39DED94EB1C660BF021700509F272D748B7278E7715DAB1B exact 마감. 사용자 서버3파일과 미검증 low-RAM generator는 별도 보존한다.

### R6 guard 실패 exit 전파와 중단 단계 교정 — 2026-10-12

모델을 import하지 않는 Python SystemExit(7)에서 guard summary ExitCode7인데 호출 명령 exit0인 실제 실패 전달 누락을 확인했다. summary 보존 뒤 worker exit를 반환하도록 보완해 같은 짧은 실패의 호출 명령이 nonzero이며, native normal/pressure 자손 QA에서 LASTEXITCODE와 summary exact·무관 sentinel 보존이 통과했다. 기존8GiB 시작/4GiB3회 중단·소유 트리만 종료·CPU 환경/실패 원본은 유지하며 대형 AI는 실행하지 않았다.

Base low-RAM v2 stdout를 재확인해 캐시 검증/실제 CUDA prompt·VAE74 module 정규화 parity·pipeline 준비가 끝나 Generating original song 호출에 진입한 사실을 확인했다. 첫 diffusion step 및 condition one-shot 완료 로그/완성 PCM은 없고 guard wall177.687초/resourceStopped=true로 종료했다. 마지막 worker working set5.565GiB·PC free3.170GiB다. 초기화 도중만 실패했다는 이전 표현은 이 근거로 좁혀 교정한다. source latent/condition 처리 중 어느 연산이 증분 메모리 원인인지는 단계별 실제 측정 없이 확정하지 않는다. 가사/화음·속도·전체 RAM 해결 성공으로 등록하지 않고 미검증 generator 경로는 로컬 보존한다.

직전79c7729 main0·0/Git Integration success·Production Profile 재진입·취소/이력 QA/HTTP200·index-DlRbC8xD.js SHA39509AA129CA1D0F39DED94EB1C660BF021700509F272D748B7278E7715DAB1B exact 마감. 이번 자원도구/현재 기록만 main 자동배포→Production 기존 앱 보존 확인하며 사용자 서버3파일/디자인/음원은 보존한다.

### R2 저장된 Profile의 편집 재진입 — 2026-10-12

역할 저장에서 빈 항목/공백이 제거된 실제 Profile과 재진입 편집기의 이전 입력 문자열 불일치를 native assertion으로 재현했다. 편집 시작 때 현재 Profile의 역할/장르/취향을 다시 읽는다. 저장 형식/정책·음역/대표 Sample/Track·디자인 변경 없음. 재진입 입력 exact·취소/Back/Forward와 기존 전체 Profile 취향 실패/retry/reload·음역만 변경·Sample 교체/기존 URL·최초 Setup 복귀/자동 참여 없음·중복 저장 QA, profile store 원자성/build39modules/510.63KB 통과(기존500KB 경고 유지). 관련 묶음만 main 자동배포→Production으로 전달하며 최신 정책/형상 결정·실기기/전체 R2 완료는 미검증이다. 현재 Notion/figma-desktop 노출 도구0개 확인, 새 정책/시각 구현은 하지 않는다.

직전809b6cf main0·0/Git Integration success·Production main Collection 실패/MIXING→성공/COMPLETE·원본4 SHA/완성곡 QA 통과, HTTP200/index-DnYmEX2x.js SHA9FCF6F61ADA986C43A156862797F96EDCB9FF465975EF734053739EBCEAA069E exact 확인. 사용자 서버3파일/미검증 AI 초기화·원본 보존.

### R2 기본 Project Collection Mix 상태 — 2026-10-12

새 Project와 달리 기본 Project의 Collection에서 실제4 Track/Mix 저장 실패가 RECORDING · 04/04로 표시되는 native assertion 실패를 재현했다. 기존 readyForMix를 카드에 전달해 저장된 Mix 전 MIXING, 성공 후 COMPLETE를 표시한다. 기존 생성/제출/오디오/정책은 변경하지 않는다. 실제 native Mix 저장 실패→작업실 오류/완성곡 없음→정상 reload/Mix 저장→완성곡 연결과4 원본 Blob SHA exact, 기존 Collection 저장 해제/탭별 scroll/프로필·곡 이력/Home focus 회귀, build39modules/510.53KB 통과. 첫 fixture는 bootstrap에서 거부하는 임의 origin으로 timeout이었고 명시된 local-formant-singing-demo origin으로 교정했다. 사람 녹음/실기기 인수가 아니며 기존 전체 R2/음악/Identity gate 유지. 관련 묶음만 main 자동배포→Production 동일 QA로 마감한다.

직전6f1b9e3 Git Integration success·Production Project/Sample Guide 오류·재시도/Review/Profile 보존 두 QA 통과·HTTP200·index-DmaVsSxO.js SHA4367FCAB70CEEBC7B07AB765FE8E2530DB9ABAD75C1CA5C47EC05311A02A542C exact 확인. 사용자 서버3파일·디자인/미검증 AI 초기화는 보존한다.

### R1 녹음 중 Guide 전환 오류 복구 — 2026-10-12

기존 Project Guide 재선택의 노드 생성 거부가 React 화면을 종료시키는 pageerror를 재현했다. Project effect와 Sample 체크박스에서 기존 오류 영역으로 처리하고 updateRecordingGuides의 실패 시 부분 생성된 Guide 노드를 정리한다. MediaRecorder·활성 구간·원본은 계속 유지하고 Guide 재선택 성공 후 오류를 지운다. native Project의 오류/재선택/Review와 Sample의 같은 경로·기존 Profile 보존/stop retry, audio foundation/build39modules/510.49KB 통과(기존500KB 경고 유지). 신규 정책/디자인·음원/서버 변경 없음. 관련 묶음만 main Git Integration→Production 두 QA로 마감하며 물리 마이크/음질/전체 R1은 미완료다. 직전2f56846 기록/자원도구 자동배포 success·Production HTTP200/기존 JS SHA exact 확인.

### R1 재개 Guide 실패의 녹음 상태 보존 — 2026-10-12

8285787 main push/Vercel Git Integration success·Production 동일 Guide 실패/재시도 QA 통과·HTTP200·index-DxyvU9pA.js SHAFEE1DA9AA36D5D43D5924A90D6A82954555DF0EE6B5BB1B2E17AD443C2451C24 exact 확인.

실제 Guide 노드 생성 거부에서 화면은 paused인데 MediaRecorder는 recording인 assertion 실패를 재현했다. 기존 resumeRecording에서 Guide 준비 성공 후에만 recorder.resume/활성 구간을 시작하고 실패 시 소유 Guide를 정리한다. 기존 같은 버튼 오류·재시도 처리와 결합해 실제 paused/segment=false·Guide0·재시도/Review, 기존 중복 제어·audio foundation/build39modules/510.25KB 통과. 실제 청취/물리 마이크/전체 R1은 미완료이며 디자인·서버3파일·음원/모델 원본 보존. 기능 묶음만 main 자동배포→Production 동일 QA로 마감한다.

### R1 일시정지·재개 거부의 Take 보존 — 2026-10-12

기존 Project Recorder의 pause 거부에서 처리되지 않은 QA pause refused를 실제 재현했다. 기존 오류 영역에서 pause/resume 거부를 처리하고 현재 녹음·구간·Guide 상태를 유지하며 같은 버튼 재시도 성공 때 오류를 지운다. 새 정책/화면/디자인 변경 없음. native 합성 마이크의 두 거부→재시도→재생 가능한 Review, 기존 중복 시작/재개/정지 및 Sample/Project stop retry, audio foundation·build39modules/510.22KB 통과(기존500KB 경고 유지). 5f3c2cd main push 완료, Vercel 자동배포 success·Production 동일 pause/resume QA 통과·HTTP200·index-BEl5YOXJ.js SHAA2E6C44343D453E57B91312A7001E4B959F8EA50B93B505FA1BD4FE19B2FEFD6 exact 확인. 물리 마이크/음질·전체 R1 완료는 미검증이다.

R6 low-RAM 초기화 시험 v1/v2는 기존 live guard가 ResourceStopped=true/ExitCode=-1로 종료했다. v2 wall177.687초이며 음악 결과 성공으로 등록하지 않는다. 기존 모델/실패 증거·CPU 환경을 보존하고 추가 대형 시험 대신 독립 기능 마감을 우선한다. 관련 연구 코드/문서 및 사용자 서버3파일은 이번 기능 commit에서 제외했다.

### R6 RAM guard의 중첩 worker 보호 — 2026-10-12

run-ai-resource-guard는 소유한 launcher의 전체 자손을 실제 CIM으로 탐색해 monitor wrapper 뒤 실제 생성 worker까지 표본/중단한다. root→child→grandchild의 실제 실행에서 정상 종료와 가상 RAM 압력(물리 메모리 부하 없음)의 4GiB/3회 중단, 별도 sentinel 보존을 검증했다. 기존 guard-descendant-tree-v2의 normal exit0/4.875초와 pressure resourceStopped=true/3.690초를 보존한다. 기존 임계값은 유지하고 무관한 사용자 앱을 종료하지 않는다. guard parent exit0과 worker summary ExitCode는 구분한다. bounded cache bytes QA는 F32/BF16의 정확한 byte·signed zero·끝 chunk 변조·비유한 값/잘못된 길이 거부를 통과했다. 전체 음악 초기화/품질 성공은 아니며 미검증 low-RAM generator 변경은 별도 로컬에 보존한다.

### R6 실제 한국어 입력의 Base 조건 forward 대조 — 2026-10-12

기존 tensor 변환/랜덤 lyric 부분 비교와 구분해 공식 ACE-Step 저장소 ca1e85fe9430179831e6bc6be790c332190a3866의 Base 조건 처리 선언을 실제 입력으로 대조했다. Hugging Face의 추정 Base Python URL은 web 도구에서 is not accessible via this tool이었고, 공식 GitHub tree API로 실제 acestep/models/base 경로와 revision을 확인했다. 작은 원본 코드/config만 기존 격리 runtime의 새 경로에 보존했으며 모델 설치/환경 변경/전체 생성 없음. [원본 Base 코드](https://github.com/ace-step/ACE-Step-1.5/blob/ca1e85fe9430179831e6bc6be790c332190a3866/acestep/models/base/modeling_acestep_v15_base.py)의 선택된 선언은 AST로 그대로 실행하고 native sampler/decoder/main/import side effect는 실행하지 않았다.

qa/verify-ace-condition-forward.py는 고정 코드 SHA·기존 Base raw weights SHA4177f600...·한정된 컴포넌트 크기를 확인한다. 실제 기존 한국어 spec의 caption108/lyric91 tokens와 기존 local Qwen caption forward/lyric token lookup, 실제 silence latent750frames를 사용했다. text model은 조건 컴포넌트 로딩 전에 반환했고 원본/변환 클래스는 같은 raw weights를 공유해 두 전체 모델의 중복 RAM 점유를 피했다. 현재 변환 파일을 새로 변환/저장한 것이 아니며 같은 weight의 두 조건 알고리즘 대조다.

padding0/17의 valid200 tokens·mask exact, 상대 RMSE3.0011e-8/2.6316e-8로 두 사례가 통과했다. 이는 이 입력에서 조건 처리 차이를 관측하지 못했다는 근거이며 전체 decoder/sampler·가사 타이밍·화음·원곡 score·발성/휴지·서비스 사용 권한/전체2–4Part 품질 승인이 아니다. 다음 R6 계산 대조는 아직 비교하지 않은 decoder/sampler와 실제 음절/음표 제어이며 같은 실패 seed/guidance 생성 반복으로 대체하지 않는다.

실행 직전 PC 여유8.41GiB/GPU559MiB, 조건 FP32 크기2.266GiB. live guard wall67.825초/exit0/resourceStopped=false·PC 여유최소5.040GiB/owned최대3.255GiB, Python 종료 확인. 음악 추론/GPU 생성은 없었다. 실제 source/report/guard logs는 기존 runtime에 보존한다. 재사용 QA/현재 문서만 main Git Integration→Production 기존 앱 보존으로 마감한다. 직전47b3427은 main 일치/Vercel success, Production Collection2–4Part QA 성공·index-BYxT9p9X.js SHA337F06A6282F3CF86328C4B0C9A0BE7D4502355133ACD709A43D50019D7239C1 exact/HTTP200으로 마감했다. Node fetch의 UNABLE_TO_VERIFY_LEAF_SIGNATURE는 Windows 인증서 검증 HTTP로 확인했으며 TLS 검증을 끄지 않았다. 사용자 서버3파일/디자인/음원은 보존한다.

### R1/R2 Collection의 실제 제출·Mix 상태 — 2026-10-12

저장한 새 Project의 Collection 카드가 모든 필수 Track 제출 뒤에도 RECORDING · 0/2로 표시되는 native assertion 실패를 재현했다. 기존 submittedProjectTracks/allProjectTracksSubmitted와 저장된 createdMixes를 표시식에 연결해 My Projects와 같은 제출 수·MIXING/COMPLETE 판정을 사용한다. Mix 저장 실패를 완료로 바꾸지 않으며 Project 저장값·원본·그래픽·화면 구조·서버 정책은 변경하지 않는다.

기존 native Mix 저장 실패 QA를 확장해 2/3/4 Part의 원본 hash 보존, 실패 시 Collection 실제 제출 수/MIXING 및 작업실 오류 복귀, 성공·reload 뒤 COMPLETE/같은 완성곡 연결을 통과했다. 기존 Collection 저장 객체·해제·탭별 scroll/복귀 QA와 Node 사용자 여정·2–4 Part 제출/복원, build39modules/510.03KB 성공(기존500KB 경고 유지). 첫 sandbox Edge launch는 Target page, context or browser has been closed, sandbox 개발 서버에 대한 외부 QA는 ERR_CONNECTION_TIMED_OUT였다. 소유 서버만 종료하고 허용된 동일 terminal/headless QA 실행으로 바로잡았으며 Computer Use는 사용하지 않았다.

관련 변경만 main Git Integration→Production 동일 QA로 마감한다. 실제 마이크/청취·전체 R1/R2·음악/Identity·서버 gate는 미완료다. 사용자 서버3파일과 디자인/모델 원본은 보존한다.

### R1/R2 이전 종료 응답과 새 Take 소유권 — 2026-10-12

실제 Sample 종료의 stop callback을 보류→My로 이탈→새 Sample 녹음→이전 callback 해제 시 새 Take chunks 배열이 지워지는 actual assertion 실패를 재현했다. stopRecording은 시작 시 recorder/chunks/sync offset을 캡처하고 stop 완료 시 같은 recorder와 collector를 소유하는지 확인한다. 취소/교체된 종료 응답은 새 timeline/Guide/RAF/collector·분석/URL을 변경하지 않고 null로 반환한다. 반환 offset도 이전 녹음의 snapshot을 유지한다. 기존 UI의 이탈/저장 정책이나 데이터 원본을 변경하지 않는다.

새 native QA는 실제 새 recorder/chunks/활성 segment/Guide 보존, Review의 encoded bytes SHA exact·기존 Profile 유지·pageerror0을 확인한다. 기존 늦은 dataavailable·collector release/실제 bytes, stop 거부 재시도, 중복 stop/pause/resume, 정상·decode failure·paused 종료의 hash/길이/복원, audio foundation 회귀 통과. build38modules/505.06KB 기존500KB 경고 유지. synthetic microphone의 callback 지연 시험이며 물리 마이크·음질/실기기 완료로 표시하지 않는다. qa:delayed-stop과 기능 변경 묶음만 main Git Integration→Production으로 마감하며 사용자 서버3파일/디자인/모델 원본은 보존한다.

직전7c3998a main0·0/Vercel success/Production index-fPouIHL3.js SHAA9D15EDD906B5B18C26171DE143980AB773924814C12B08A4A0B5C2354648CA5 exact, Production 곡 기반 생성 history→최종 확인1개/0Track QA를 확인했다. 전체 R1/R2·서버·Identity·음악/시각·실기기 gate는 미완료 유지한다.

### R2 곡 기반 Project 생성의 실제 이력 — 2026-10-12

Collection의 A Thousand Years→곡 기반 생성 방문, 이후 Ocean Eyes→생성 방문 뒤 Back에서 이전 생성 Review가 Ocean Eyes4 Parts를 표시하는 실제 오류를 재현했다. 생성 진입 songId(null의 Home 곡 선택 포함)를 현재 history/go/popstate에 보존하고 곡 기반 CreateProject를 해당 입력별로 분리해 기존 local state가 다른 곡의 초기 입력을 유지하지 않도록 했다. Back/Forward의 서로 다른 곡·확인 전0개/최종 확인1개·실제 ocean-eyes ID·0 Track과 기존2–4 Part/Key/검토 Back/중복 confirm/재로드·Song Detail 이력·단일 App Node 렌더 통과. 새 생성/임시본 보존 정책·화면·디자인 변경 없음. build38modules/505.01KB 기존500KB 경고 유지. 관련 QA/build→main Git Integration→Production QA로 마감하며 서버 사용자3파일은 제외한다.

R6 공식 출처 확인: [DiffSingerKR 원본](https://github.com/CODEJIN/DiffSingerKR)은 MIT 코드와 공유 checkpoint의 CSD 학습을 명시한다. 저자가 직접 링크한 [CSD 원본 License](https://github.com/emotiontts/emotiontts_open_db/tree/master/Dataset/CSD#6-license)는 CC BY-NC-SA4.0 및 비상업 목적 조건을 명시한다. 코드 MIT를 checkpoint/가수/서비스 배포 허가로 해석하지 않는다. 지금까지의 실제 생성/측정 원본은 연구 증거로 보존하고 서비스 음원으로 등록하지 않는다. 모델 결과물에 대한 별도 권한은 미확정이며 승인 없이 서비스 사용 가능으로 변경하지 않는다. 재학습·추가 대형 모델 설치/반복 추론은 하지 않았다. 원곡의 음표/화성·전체2–4 Part·실기기/청취 gate도 유지한다.

직전744ac3c main0·0/Vercel success 및 Production index--qFi5bF8.js SHA4DE028F0F811C3D178FB4B56DDDE6B134116694AB32F37145962811118EE272E exact, Production Setup cancel/save→원래 Bass fit·자동참여/Track 증가 없음 native QA 통과를 확인했다.

### R2 참여 Setup의 실제 Part 복귀 — 2026-10-12

기존 Detail은 빈 recruiting Part에 선택 action을 전달하지만 label을 누락해 Bass 선택 버튼이 없었다. 기존 open/recruiting 선택 분기를 같은 버튼에 연결했다. 이후 sessionStorage read/write 차단 상태에서 Bass 선택→Setup 취소→Tenor로 잘못 복귀하는 actual assertion을 재현했다. Project별 앱 메모리 문맥에 선택 Part를 보존하고 비교 Project의 빈 Part 값이 기존 live Project 선택을 덮어쓰지 않도록 했다. 새 화면/배정/자동 참여/추천 정책·디자인 변경 없음.

qa:setup-return은 취소와 실제 synthetic 측정/Sample 저장 완료 모두 같은 Bass fit 재검사 화면 복귀, Profile 저장만으로 참여하지 않음/제출2개 불변을 검증한다. 기존 Song/Project Back/Forward, cache read/write/invalid 회귀, Node 사용자 흐름·2–4 Project 제출/복원 통과. build38modules/504.82KB 기존500KB 경고 유지. 수정 묶음만 main 자동배포→Production 확인하고 사용자 서버3파일은 제외한다. 실제 다중 사용자 초대/수락·물리 마이크와 전체 R2 gate는 미완료다.

직전bfdfddf Git Integration success/main0·0, Production index-B4GZDrbS.js SHA3893B480D632E49B2DA611393A98609C630CFA4A030DAE2D20702CA678378DBE exact와 Production Profile 저장 실패/재시도·최초 Setup·Sample 교체/재로드 QA 통과를 확인했다.

### R5 개인 입력 선행 — 음역 측정 출처 보존 — 2026-10-12

기존 대표 Sample의 원본 SHA/revision과 구분해 음역 측정 데이터의 canonical measurementSha256·분석 version·개별 source revision을 기존 range record에 저장한다. 최초 Profile 저장과 음역만 재측정하는 동일 경로에 연결하고 메모리 Profile/재로드에 rangeProvenance를 복원한다. 저장 성공 전 새 revision을 게시하지 않으며 Sample 교체는 range revision을 변경하지 않는다. 음역을 오디오 파일로 가장하지 않아 audioSha256은 사용하지 않고 기존 legacy record에는 null을 유지한다. 개인 형상 갱신/사진/버전/fallback 정책이나 그래픽 생성 완료를 확정하지 않는다.

실제 Node immutable snapshot/hash/동일 데이터 digest/독립 revision/저장 재읽기/누락 version null/용도·잘못된 값 거부, 기존 Profile transaction rollback과 Identity 계약 통과. 실제 React의 range 저장 실패→이전 Profile/legacy provenance 유지→재시도, Sample 저장 실패/교체·재로드에도 같은 range provenance 유지, 최초 Setup/자동 참여 없음·선호값 보존 검증 통과. synthetic microphone 범위이며 실기기/음질/전체 Identity G1–G5는 미완료. build38modules/504.69KB, 기존500KB 경고 유지. 앱/관련 QA·현재 계획만 main Git Integration→Production 검증하며 사용자 서버3파일/디자인/모델 원본 보존.

직전aa30184 main 일치·Vercel success 및 Production index-DaRN9b5z.js SHA3195CA1703C8368DF08B11ABC5908D9CCE0B08EB56D6FF8B788FF8D7EEDE4561 exact, 배포된 Sample/Project stop retry native QA 통과를 확인했다. 다음은 미정 정책/보류 형상을 임의 승인하지 않는 독립 기능·입력 연결 보완이다.

### R1/R2 브라우저 녹음 정지 거부의 재시도 — 2026-10-12

실제 React/격리 마이크에서 MediaRecorder.stop의 첫 InvalidStateError를 주입했을 때 대표 Sample 종료의 unhandled `QA stop refused`를 재현했다. Sample과 Project 종료에 오류 처리를 추가하고, 실패하면 현재 Take/기존 Profile을 유지하며 경과시간 갱신을 복원한다. 공통 stopRecording은 브라우저 정지 성공 전 activeElapsed/segment를 확정하지 않고 실패한 stop listener를 제거한다. 정지를 다시 눌러 기존 Review로 복귀하며 실패 자체로 Sample 저장/Track 제출을 성공 처리하지 않는다. 새 정책·디자인·서버 사용자3파일 변경 없음. 유지 QA는 qa:stop-retry로 실행한다. 자동 검증은 synthetic microphone의 오류/정상 재시도이며 실기기·음질·전체 R1/R2 완료 증거는 아니다.

검증: Sample/Project stop 거부→재시도 Review, 기존 Sample lifecycle·중복/pause/resume session, 정상/분석 실패/paused 입력 종료 원본 hash·Draft 복원, audio foundation/단일 App Node 렌더 통과. 첫 Project QA는 참여 fixture 누락으로 record-part timeout이었고 기존 joined/tenor를 명시해 재실행 통과했다. build38modules/503.89KB의 기존500KB 경고는 남는다. 직전84704dd Production index-qsyOOu7f.js SHA18500D0C0A3FEB68E35D27E60D0BB871BB105E26DBA2E075582D70305A5CBAE4 exact를 확인했다. 이번 기능 수정은 diff 검토 뒤 main Git Integration→Production 검증으로 마감한다. 음악 연구/Identity 형상 보류와 실제 서버 gate는 별도로 유지한다.

### R6 reference sampler fresh-process 재현성 — 2026-10-12

현재 free8.80GiB 확인 후 새 sampler의 같은 실제 base 입력/seed/고정 runtime을 새로운 프로세스에서1회 실행했다. 모델/code/source hashes·score/spec·generator/sampler hash·duration/peak/RMS와 실제 PCM SHA2efa01ddbb8b17dc63b037601a6cbd6a27a5bc9b4b5e20ba8f445b6e1118a0ca가 이전 결과와 exact였다. 이 입력의 current GPU/runtime fresh-process 재현만 증명하며 다른 기기·모든 입력·개인 Identity·음악 품질 보장으로 확대하지 않는다. 후보 품질을 찾는 seed/guidance 반복이나 native sampler 기본 변경 없음. guard wall7.295초/exit0/resourceStopped=false, 원본/별도재현/검증hash/모니터를 기존 runtime에 보존한다.

기존 실제 backing CQT/Basic Pitch 원문 결과를 재확인했으나 첫 두 음절의 낮은 major/minor margin과 note candidate overlap은 sourceScore/화음 승인 근거가 아니다. native/reference 음정 개선과 화음 입력의 정확성을 구분하며 불확실 score를 실제 Part로 등록하지 않는다. 다음 R6은 실제 원곡 음표/화성 근거와 음절/휴지 제어의 불확실성 해결이고, 독립 앱 기능 진행을 막는 전체 blocker로 사용하지 않는다. 전체 음악·2–4Part/권리/청취·서비스/Identity·실기기 gate는 유지한다.

직전6dd91aa는 자동배포 success/main일치/Production18500D0C0A3FEB68E35D27E60D0BB871BB105E26DBA2E075582D70305A5CBAE4 exact로 마감했다. 이번 실제 재현 증거는 기존 계획/상태만 수정해 main 자동배포→Production 앱 보존을 확인한다. 사용자 서버3파일/원본/디자인은 변경하지 않는다.
### R6 지속음 F0 지지 프레임과 음소 경계 분리 — 2026-10-12

기존 고정 pYIN 측정의 fullInterval에 첫/마지막 유효 frame timestamp·최장 연속 유효 frame 수·hop/window를 추가했다. 기존.75/80ms 조건·median/min/max/frames/RMS와 PCM·gate는 변경하지 않는다. 같은 새 reference base/upper PCM의 별도 측정 경로에서 모든 기존 관측 exact를 확인하고 empty null/disjoint run을 실제 함수에 대조했다. 측정2회 wall7.310/7.240초·exit0/resourceStopped=false이며 신규 모델 생성 없음.

마지막 요 요청end4.468182초에서 base F0 first3.959002/last4.400181초·34/44frames·최장31연속, upper first3.970612/last4.458231초·38/44frames·최장35연속을 관측했다. median54.7/59.1. 앞선 MMS phonetic end4.112624/4.072501 이후에도 유효 F0가 남으므로 그 end를 지속음 길이로 쓰지 않는다. hop11.610ms/window92.880ms·centered frame/confidence filtering/공백은 실제 음표 경계 오차와 다르다. 첫/마지막 frame 사이가 모두 지속음이라는 의미도 아니며 예상 음표와 다른 F0도 따로 판단해야 한다. 정확한 지속음·휴지·진입/원곡 score/harmony·청취/2–4Part/catalog gate는 계속 미완료다.

유지 측정 코드/기존 계획 기록만 main 자동배포→Production 앱 bundle 보존으로 마감한다. 앱/새 정책·디자인·원본/사용자 서버3파일 변경 없음. ea0d1e2 Git Integration success/main 일치/Production18500D0C0A3FEB68E35D27E60D0BB871BB105E26DBA2E075582D70305A5CBAE4 exact를 확인했다. 다음은 측정 frame 지지와 실제 입력 구간의 차이를 유지한 채 원곡 음표/화성 근거에 대조하고, 승인되지 않은 입력을 성공 Part로 등록하지 않는 것이다.
### R6 reference DDIM 저음/음절 대조 — 2026-10-12

기존 original-opening의7음절/음표/길이 exact를 확인한 같은 seed/checkpoint/vocoder 입력의 reference DDIM1회를 actual 실행했다. SHA2efa01ddbb8b17dc63b037601a6cbd6a27a5bc9b4b5e20ba8f445b6e1118a0ca,5.456708333초/peak.53586352/RMS.11087490/inference1.1006초. pYIN 같은.75/80ms의7음절 median54.9/59.2/62.1/57/56.8/54.85/54.7, 유효13/14/53/29/28/16/29frames/최대.3반음. native의 가0frames/요53MIDI(요청55) 사례와 비교해 이 입력의 저음 제어 개선을 관측했으나 다른 입력/voice/style·전체 음악/청취 품질 승인으로 확대하지 않는다. Whisper-small 가사 exact/similarity1. 생성/측정/ASR wall7.295/7.256/19.500초·모두exit0/resourceStopped=false·free최소7.450/8.537/7.089GiB·owned최대1.155/.230/1.681GiB.

같은 새 base/upper의 MMS 고정 경계 대조는 평균 절대onset42.620/41.650ms·최대77.167/57.106ms였고 마지막 phonetic end4.112624/4.072501초 vs요청note end4.468182초다. 음소 경계≠지속음 길이와 강제 정렬 입력≠독립 인식·path probability≠정확도는 유지한다. 이 모델의 비상업 연구 제약/실제 원곡 음표·화성 불확실성/휴지/2–4Part/catalog·청취 gate를 승인하지 않는다. 첫 정렬은 잘못된 CPU runtime의 libtorchaudio.pyd OSError(exit1)였으며 도구의 명시 torch2.8.0+cu126/torchaudio 요구에 맞는 기존 GPU runtime으로 바로잡아 새경로에서 base/upper12.009/11.961초 exit0를 확인했다. 설치/환경 변경·원본/실패 삭제 없음.

실제 output/ASR/측정/경계/자원 증거는 repository 밖 기존 runtime에 보존했다. 기본 native/앱/음원/threshold·목소리/디자인/서버3파일은 변경하지 않는다. 다음 R6 선행은 지속음의 실제 F0 지지 구간을 음소 경계와 분리하고 원래 음절/note/rest/화음 자료의 불확실성을 대조하는 것이다. e3faba5 자동배포 success/main 일치 및 Production18500D0C0A3FEB68E35D27E60D0BB871BB105E26DBA2E075582D70305A5CBAE4 exact 증거를 유지한다. 이번 연구 기록만 main 자동배포→Production 앱 보존으로 마감하며 전체 단계 완료로 기록하지 않는다.
### R6 reference DDIM 실제 가창 대조 — 2026-10-12

선택 sampler4d63697의 실제 휴지 대조 뒤 원래 upper 가사/음표/길이 입력을 exact 대조해 같은7음절 score의 reference DDIM을1회 실행했다. 기본 native·seed·checkpoint·vocoder·출력 shift/gain·gate는 유지한다. 신규 PCM SHAcd56b33cbb42e498302363e4c0335c43bc13a6d0ca68eade793970e55320847e,5.456708333초/peak.82087505/RMS.17424379/inference1.2275초. pYIN 같은.75/80ms 조건의7음절 median58.8/61.8/65.9/62.1/62/58.7/59.1·유효23/14/53/31/26/17/30frames, 최대.3반음이었다. native의 최대.1반음보다 개선됐다고 표시하지 않는다. rest RMS.02090355/.01359291·유효0frames는 기존 native .035009/.034862보다 낮으나 휴지 무음/품질 통과가 아니다.

고정 Whisper-small 가사는 천천히걸어가요 exact/similarity1로 관측했다. ASR만으로 진입/지속음/화음/권리·청취와 Part 등록을 승인하지 않는다. 생성/측정/ASR 순차 wall7.291/7.318/19.529초, 모두exit0/resourceStopped=false. free RAM최소7.475/8.541/7.179GiB·owned최대1.262/.238/1.683GiB로 guard조건을 유지했다. 실제 입력·원본/측정/ASR/자원 기록은 기존 runtime의 별도 경로에 보존한다. 앱/디자인/기존 음원은 변경하지 않는다.

다음은 이 계산 차이가 기존 저음 실패와 음절/휴지 길이에 미치는 영향을 고정 원래 입력으로 대조하는 기술 검증이며, 단계 R6 전체 gate를 축소하거나 이 후보를 catalog에 넣지 않는다. 동일 입력/버전 재현·Part별 전체 음악/2–4결합·실기기/서비스/Identity gate도 남는다. 직전4d63697은 Git Integration success/main기록/Production bundle18500D0C0A3FEB68E35D27E60D0BB871BB105E26DBA2E075582D70305A5CBAE4 exact로 마감했다. 이번 실제 연구 기록만 기존 문서에 남겨 main 자동배포하고 Production 앱 보존을 확인한다. 사용자 서버3파일 제외.
### R6 선택적 reference DDIM 진단 — 2026-10-12

고정 DiffSingerKR DDIM은 denoiser에 실제 schedule timestep 대신0–49 index를 넘기고 방향 항 sqrt가 없으며 alpha_prev도 이전 선택 schedule이 아닌 인접 training step을 사용한다. [CompVis 원본 DDIM](https://github.com/CompVis/latent-diffusion/blob/main/ldm/models/diffusion/ddim.py)의 실제 timestep/방향 sqrt/선택 schedule 이전 alpha를 보존하는 선택적 eta0 진단을 유지 QA에 추가했다. 기본 native와 runtime의 고정 모델 파일은 수정하지 않으며 default/linear 경로를 그대로 둔다. 독립 scalar equation/실제 timestep 순서/previous alpha 수치 QA 통과. 실제 단독 rest input/seed/checkpoint/vocoder를 유지한 신규 경로1회로 비교했다.

첫 actual 실행은 conditioning384 vs464채널 RuntimeError(exit1)였으며 모델 forward의 encoder+linear80 concatenation을 적용해 새 경로에서 재시험했다. 최종 SHA710c8e785e54c39cad52d76a278ad5a9933caa8f47bb2c96cded47201f1fc368/duration2.995375초/RMS.00965685/peak.09216812, inference1.1741초/GPU peak353900544bytes. wall7.4277초/exit0/resourceStopped=false/free최소7.353GiB/owned최대1.251GiB. 기존 native rest RMS.01883837보다 낮으나 잔여 에너지가 남아 휴지 해결·음질·model compatibility 승인으로 기록하지 않는다. source/input/output·generator와 sampler hash를 실제 report에 저장하고 실패 로그/원본은 기존 runtime에 보존했다.

음원/앱·gate/threshold·output shift/crop/mask 변경 없음. 다음은 이 선택 경로가 실제 짧은 가사의 음정·음절/휴지 길이에 미치는 영향을 원래 score/기존 native 결과에 대조하는 기술 검증이다. 같은 seed/guidance 후보 탐색으로 대체하지 않으며 음악·화음·2–4Part/권한/청취·catalog는 미완료다. 이 유지 도구/현재 계획 기록만 main 자동배포→Production 기존 앱 bundle 보존으로 마감한다. 기존a21dd11 자동배포 success/main동기화/Production18500D0C0A3FEB68E35D27E60D0BB871BB105E26DBA2E075582D70305A5CBAE4 exact와 Profile QA 증거는 유지한다. 사용자 서버3파일은 제외한다.
### R6 휴지 토큰만의 acoustic stage 대조 — 2026-10-12

현재 free8.84GiB 확인 후 기존 live RAM guard(시작8GiB/여유4GiB 연속3회 해당worker 중단) 아래 한 <X>/note0/3초 입력의 기본50step diffusion과 linear 진단을 각각1회 실행했다. 같은 pinned checkpoint/vocoder/seed65359/input SHA146ec12fb0df5b88548ddd6bd94738f82f86c692b7eb33a7fe3b651ed713e065이고 노래 후보 seed 반복이 아니다. 실제 PCM16 diffusion SHA6c07b9ec4359db9ca05763f4e82e4eda76c4108146efdd64b844c3fea1f241d5·RMS.01883837/peak.08554077, linear SHA09d7264fb35c1ca5e463aa4da335b8edd277f20be6cb0a6cc0e7be579f2ee8b4·RMS.00008995를 관측했다. 양쪽 길이2.995375초(요청3초), exit0/resourceStopped=false. wall7.2917/6.1041초, free최소7.568/7.792GiB·owned working최대1.282/1.173GiB. 실행/모니터/원본은 repository 밖 기존 runtime에 보존한다.

기존 upper diffusion의 앞/뒤 rest RMS.035009/.034862와 linear 기존 candidate의.010728/.001900도 원본 SHA 검증 후 비교했다. 단독 rest에서도 diffusion 잔여 에너지가 크다는 단계 차이 근거이며 vocoder 단독 문제/휴지 음질/linear 대체 승인으로 단정하지 않는다. 음원 gate/threshold 변경·silence masking/crop/새 앱 음원 등록 없음. 다음 R6 선행은 diffusion의 실제 휴지 frame 입력·denoising을 확인하여 원래 가사/음표/휴지 조건을 유지하는 제어 가능성을 검증한다. 음악·화음·권리/청취와2–4Part/catalog는 계속 미완료다.

첫 비교 helper는 legacy report에 inputPurpose가 없어 KeyError였고 명시한 기존 scoreCalibration purpose로 읽는 경로만 보완해 재실행했다. 실제 가사 metadata 오류는 없었다: 전체 저장 경로가 실제 음절로 갱신함을 확인하고 불필요한 임시 소스 변경을 원상 복구했다. 이전76f2788 Profile은 자동배포 success/Production 편집 이력 및 기존 저장 실패/retry/reload QA 통과, main 일치/bundle18500D0C0A3FEB68E35D27E60D0BB871BB105E26DBA2E075582D70305A5CBAE4 exact로 마감했다. 이번 변경은 연구 기록/기존 계획 다음 작업 갱신만이며 앱/디자인/사용자 서버3파일은 유지한다.
### R2 Profile 편집 목적/복귀 이력 — 2026-10-12

native 기존 Profile의 음역 재측정→My→Sample 재등록→Back에서 이전 음역 화면에 Sample 모드가 남는 결함을 재현했다. 첫 QA는 잘못된 selector로 timeout이었고 실제 .sample-select-stage로 교정한 뒤 assertion 실패를 확인했다. history effect만 보완한 첫 수정도 실패가 남아, go의 떠나는 entry 저장에 voiceEditMode/voiceReturnScreen을 함께 포함했다. 유효한 null/range/sample 및 기존 my/detail 복귀만 popstate 복원한다. 미저장 Take/측정 결과의 영구 복원을 새로 만들지 않는다.

최종 native 편집 모드 Back/Forward/취소 My 복귀 및 기존 Profile range/Sample exact 보존 통과. 기존 Profile 편집·실패/중복 저장/retry/reload·원본 URL/Project Track 보존 QA도 통과, build38modules/기존500KB 경고 유지. 관련 묶음만 main 자동배포→Production 같은 편집 이력과 정상 저장 QA로 마감한다. 실제 발성/청취·서비스·Identity 생성 정책/전체 R2 인수는 미완료다. 사용자 서버3파일 보존/제외.

직전7a3857c 곡 상세는 Git Integration success/main 일치/Production 곡·비교 Project QA 및 bundle1B5F0AF115C76C82D7690539A3538A3D30B589AE670D00220B11CC296304B471 exact로 마감했다.
### R2 곡 상세의 곡/비교 Project 이력 복원 — 2026-10-12

native 두 곡 방문 QA에서 최신 Ocean Eyes 상세에 Forward했는데 이전 A Thousand Years가 남는 assertion 실패를 재현했다. 기존 history 동기화 effect에 selectedSongId/selectedProjectId를 보존한다. A Thousand Years/Warm Duet↔Ocean Eyes/Low-key Duet의 실제 Back/Forward 곡과 비교 Project exact, 저장곡2/미참여 유지·기존 Finder Part/Project 및 Collection 복귀 회귀/build38modules를 통과했다. 기존500KB chunk 경고 유지. 새 IA/시작화면 정책/서버·디자인 변경 없음. 관련 묶음만 main 자동배포→Production 같은 곡 QA로 마감하며 전체 R2/실기기·실제 협업 인수로 확대하지 않는다.

직전 a702433 Part/Project 이력은 main/origin 일치·Git Integration success/Production 같은·다른 Project Part 및 후보 QA 통과, bundle E12F6CCD1242F317226C380692ABA553330E7B2BD95D28EB9D16E08D74BBCFDB exact로 마감했다. 사용자 서버3파일/보류 정책과 기존 R3–R7 gate는 유지한다.
### R2 Finder Part/Project 이력 복원 — 2026-10-12

현재 방문을 떠나기 전에 브라우저 Back→Forward하면 최신 Alto Finder에 이전 Tenor Part가 남는 native assertion 실패를 재현했다. 기존 history 동기화 effect에 finderPartId/activeCreatedProjectId를 보존한다. 새 IA/시작화면/참여·초대/제출 정책을 추가하지 않는다. 같은 Project의 두 Part와 서로 다른 Project의 두 Part에서 Back/Forward의 제목·Project ID exact/제출 Track0을 확인했다. 기존 후보/목록 이력과 Collection 프로필·저장/복귀 회귀 및 build38modules 통과. 기존500KB chunk 경고는 남는다. 관련 묶음만 main 자동배포→Production 같은 Part QA로 마감한다. 실제 협업/측정 추천/실기기·전체 R2 인수로 확대하지 않는다.

직전 dfc3148 후보 이력 수정은 main/origin 동기화, Git Integration success, Production Finder/Collection 이력 QA 통과와 bundle SHA256 E20914C5C644ECBF29FC5C0A817468A0536862D6B400FBA683B97F75698A91C9 exact로 마감했다. 사용자 서버3파일/디자인 보류와 기존 R3–R7 gate는 보존한다.
### R2 Finder 방문별 후보 이력 복원 — 2026-10-12

실제 native QA에서 첫 방문 Joon→다른 화면→새 Finder 방문 Luna 뒤 브라우저 Back으로 첫 방문에 돌아오면 Luna가 남는 결함을 재현했다. 기존 history entry에 selectedMatchVocalId를 보존하고 유효한 후보 또는 명시 null만 복원한다. 같은 screen 안의 후보 선택/목록 복귀도 현재 entry를 갱신한다. 서로 다른 방문의 Back/Forward 후보 exact와 후보 없는 목록 복원을 검증했다. 기존 Part/Project·정렬/필터·초대/제출수·저장 원본/시작화면 정책은 변경하지 않는다.

build38modules 및 native Finder 재현→수정 성공/Collection 다른 보컬 Back·Forward 회귀 통과. 관련 묶음만 main 자동배포→Production 같은 이력 QA로 마감하며 전체 R2 인수/실제 서비스·측정 추천·실기기 완료로 확대하지 않는다. 사용자 서버3파일은 제외한다. 직전 fd9f0fe Mix 입력 보존은 Git Integration success/Production 2–4/main 저장·재접속 및 저장 실패 원본 보존 QA 통과, bundle SHA256 7A5797ABA84379E96031A2BB6E620CCDAB84BA34DF99D23CEB4DA5ADB57707D5 exact로 마감했다.
### R5 선행 — 실제 Project Mix 입력 계보 — 2026-10-12

기존 Auto Mix 저장 record에 private inputManifest를 연결했다. Project ID/기존 Seed/정해진 Part 순서·실제 원본 Blob SHA256/크기·source revision·정렬 값·분석 version·유효한 Layer 파라미터 snapshot과 전체 입력 digest를 보존한다. Mix에 전달하는 Track도 같은 snapshot을 사용한다. 그래픽 미생성/유효하지 않은 그래픽은 별도 capture 상태로 기록하며 오디오 제출/Mix를 그래픽 성공으로 판단하지 않는다. 이것은 개인 Identity나 확정 Record artifact 생성 완료가 아니며 기존 backing 참조는 별도 audioSourceRef로 유지한다. legacy 원본의 revision은 임의 생성하지 않는다.

Node 2–4 Part 동일 입력 재현/원본 변경 digest 차이/분석·Layer snapshot 불변/Review 거부 통과. native Edge에서 그래픽0 및 실제 PCM 분석 복원 각각 2/3/4/main Mix 저장·reload 입력 exact/원본 hash를 확인했다. 2–4 Part Mix 저장 실패/원본 보존/기존 reload 성공, 기존 사용자 여정/single App/build38modules 통과. 기존500KB chunk 경고는 남는다. 격리 음원 QA이며 실제 청취·협업·개인 형상 인수가 아니다. 관련 묶음만 main 자동배포→Production 동일 QA로 마감한다. R5 전체 G1–G5와 R6 음악 품질·실제 서비스/실기기 gate는 유지한다.

직전 ac23576은 Git Integration success/Production 제출 원본 QA와 bundle 9EBDB21AA297D1E9D64C5BD5EB4A35936FB09A715426F7717E89A577119FCC17 exact로 마감했다.
### R5 선행 — 제출 Track의 실제 원본 snapshot — 2026-10-12

Review 직접 제출 후보에 private sourceProvenance를 연결했다. 원본 Blob SHA256/크기·opaque source revision·purpose project-track·제출 당시 analysis version/Layer generator version을 같은 원자적 제출 record에 저장한다. hash 전에 입력/분석/Layer를 snapshot으로 복제하며 다른 탭의 확정 제출 원본이 이미 있으면 그 원본과 provenance를 반환하는 기존 계약을 유지한다. 미측정 분석/미생성 Layer는null이며 대표 Sample hash를 Track hash로 사용하지 않는다. 이 snapshot 준비 성공은 제출 성공이 아니고 saveSubmittedTrack 성공 전 제출수/완성 상태를 늘리지 않는다. 개인 Identity ref가 없는 상태에서 가짜 참조는 만들지 않는다.

Node actual Blob hash/snapshot·동시 제출의 최초 원본 revision/hash 보존·잘못된 Part/voice-sample 거부·atomic 실패/재시도 통과. native Review 복원/제출 실패/재시도/원본 URL·SHA 보존 및 reload 후 제출 당시null/version/revision exact, 같은 기기 다른 탭 승자 원본 재생/reload를 통과했다. build36modules/single App/기존 사용자 여정 통과. legacy Track은 원본 provenance를 임의 backfill하지 않으며 reload의 추가 분석은 제출 snapshot을 덮어쓰지 않는다. 화면/형상/믹싱/서버 정책 변경 없이 main 자동배포 후 Production 같은 QA로 마감한다. 전체 개인 생성→Track 변형→Project Record 연결과 R5 G1–G5는 여전히 미완료다.

직전 Sample fea5769는 Vercel commit success/Production Profile 최초 등록·교체·실패/retry/reload hash/revision·기존 기능 QA/pageerror0 및 bundle C1FE83BFA7DD284D58B2C6FF7A8F674F8742D5265DAEB4D66B9B55702D2CF5D5 exact/main 동기화로 마감했다.

### R5 선행 — 대표 Sample 원본 출처와 revision 저장 — 2026-10-12

기존 Profile 최초 등록/대표 Sample 교체의 저장 경로에 private sourceProvenance를 연결했다. 새 실제 Sample Blob의 SHA256·byteLength, 저장된 분석 version(없으면null), purpose voice-sample, opaque source revision을 같은 record에 보존하고 Profile reload에서도 같은 값을 읽는다. hash 계산 전 분석/record snapshot을 복제한다. 기존 Sample은 재분석·가짜 hash/revision backfill 없이 null로 읽는다. 사용자의 공개 ID/그래픽 URL은 추가하지 않는다. Range 측정 원본 오디오를 보관했다고 주장하거나 이 Sample revision을 전체 Profile/Identity revision으로 혼동하지 않는다.

Node 실제 Blob hash/immutable 분석 snapshot·purpose 검증·미분석null·별도 DB read 및 기존 Profile atomic 실패/재시도 통과. native Profile 최초 Setup/교체/실패/중복 저장/retry/reload에서 실제 재생 Blob의 hash/bytes와 저장 revision exact를 검증했고 기존 Sample URL/음역/취향/Project Track 보존도 통과했다. Review 이탈/늦은 저장 실패 원본 보존 회귀도 확인한다. build35modules·single App/기존 사용자 여정 통과, 기존500KB chunk 경고는 유지한다. 앱 UI/형상/재측정 시 Identity 갱신/기존 Track 재생성 정책은 변경하지 않는다. 이 선행 묶음만 자동배포→Production 같은 Profile QA로 마감하며 R5 전체 생성·개인 구분/Track 특징 유지·2–4 AI 결합은 미완료다.

직전 Mix 보존 QA35ad7c5는 Vercel commit success/Production2–4Part 실제 Mix 저장 실패·원본 SHA·기존reload 저장 검증 통과. 앱 동작 변경 없이 해당 실패 gate의 증거만 보완했다.

### R1 확정 Mix 저장 실패의 실제 원본 보존 — 2026-10-12

유지 QA qa:mix-errors에 2/3/4 제출 Part의 native OfflineAudioContext 생성→IndexedDB auto-mix put 실패를 추가했다. 실제 오류 문구와 완성 화면 미이동, DB에 Mix 미저장, 모든 제출 Blob SHA exact/Project RECORDING 유지, 실패한 job의 자동 반복 없음, 저장 가능해진 뒤 기존 reload 경로에서 하나의 실제 Mix 저장/원본 SHA 유지까지 통과했다. 격리된 시연 오디오 입력이며 실제 협업·물리 청취·원곡 Part 품질 증거는 아니다. 앱의 새 retry UI/정책은 추가하지 않았다.

초기 QA는 선택하지 않은 Project 및 갱신되지 않은 optional __IEUM_V2__ getter의 activeMixStatus를 기다려 timeout이었다. 기존 My Projects로 대상에 진입하고 실제 렌더된 .mix-error/IndexedDB 상태를 확인하도록 정정했다. 진단 getter는 createdMixStates 변경마다 갱신되지 않으므로 그 값만으로 실제 앱 상태를 판정하지 않는다. 앱의 저장 실패 보존은 이번 검증에서 추가 수정 없이 통과했다.

이전 12e9d2c는 자동배포 commit status success/Production Collection Back·Forward/저장·스크롤 QA/pageerror0, bundle6A4DF2F5F34FF69D5419C7DF92B3722B0A5060753ADBC9626DD1282B0B63F7F1 exact/main 동기화로 마감했다. 이 유지 QA 묶음도 main 자동배포 후 Production 같은 실패 조건을 확인한다. 전체 R1/R2 인수 및 서버·Identity·AI 음악 완료로 확대하지 않는다.

### R2 보컬 프로필의 브라우저 이력 문맥 — 2026-10-12

저장 보컬 Luna→Collection→Min을 방문하고 실제 Back으로 Luna 이력에 돌아가도 Min 이름이 남는 native assertion 실패를 재현했다. 기존 history entry에 selectedVocalId를 보존하고 등록된 ID에 한해 popstate 복원한다. 기존 screen effect가 현재 entry를 갱신해 Forward도 해당 보컬을 유지한다. 앱 시작화면/새 IA/대표 Sample·Project Track 구분/Identity 디자인/서버 상태는 변경하지 않는다.

기존 Collection native QA에 두 보컬 Back/Forward 조건을 추가해 통과했다. 저장 해제는 참여/Track을 유지하고 곡/보컬 탭·탭별/전역 스크롤·저장 Project 문맥과 Home OPEN Part 이동도 통과했다. 초기에 새로고침 프로필 화면 유지 조건을 추가했으나 현재 앱은 기존 시작화면 정책으로 이동하므로 timeout이었다. 정책 변경 없이 해당 assertion/초기 ID 복원 제안을 제외했고 Back/Forward 범위만 검증한다. build34modules 통과, JS500.07KB/152.73KB gzip으로 Vite500KB chunk 경고가 발생했다. 경고를 숨기거나 관련 없는 분할 refactor를 수행하지 않는다. 기존 Node 사용자 여정 통과 및 single App 회귀를 확인하고 관련 묶음만 main 자동배포→Production 같은 Collection QA로 전달한다. 실기기·전체 R2 인수는 별도다.

직전 Player 수정 cca382c는 Vercel commit status success, Production native 재생 소유권 QA 통과/bundle AE3020B5FDA466D7402A8B39D534A5441ABBAE96F41E608EE84D7DF5E5D732BC exact/main 동기화 확인. Profile Sample 편집·실패/재시도·교체·재로드도 통과했다.

### R2 재생 요청의 늦은 실패 소유권 — 2026-10-12

Current Mix의 재생→정지→재생 뒤 이전 play Promise를 늦게 거부하면 현재 native 재생까지 멈추는 assertion 실패를 재현했다. 공통 Player effect cleanup에서 이전 요청을 비활성화하고 현재 요청의 거부만 setPlaying(false)에 반영하도록 수정했다. 새 화면·오디오 gain·저장/Track/Identity 데이터 변경은 없다. 유지 QA qa:playback은 지연된 취소 요청이 새 실제 재생을 유지하는 조건과 현재 요청 실패가 제어/오디오를 정지하는 조건을 함께 확인한다. 초기 QA는 hidden audio를 visible로 기다려 timeout했고 attached 대기 및 기존 My Projects→Workspace 진입으로 수정한 뒤 실제 앱 결함을 재현했다.

build34modules, single App/기존 사용자 여정, native 재생 소유권 QA 통과. 공유 Player의 Profile Sample 편집/교체·실패·재시도/재로드 QA도 실행한다. 관련 변경만 main 자동배포 후 Production 같은 소유권 QA로 마감한다. 물리 청취/모바일·서버·음악 품질 완료로 확대하지 않는다. 앞선 첫 lyric 안내04af003은 Git Integration7004881368 success, Production HTTP200/bundle5D6044FB62C2B3114F44D509CF2C223CF51FB80A358606EF8E3B6A313E8A06CE exact 및 같은 native 반주/진입/2–4Mix QA를 통과했다.

### R1 Project 녹음 첫 가사 진입 안내 — 2026-10-12

Sample에는 준비 반주/카운트다운이 있지만 Project Recorder에는 첫 가사 시각이 있어도 REC 시간만 표시됐다. 기존 recording-clock에 실제 첫 lyric.time 기준의 시작 후 시각·남은 초·첫 진입 안내를 연결했다. 일시정지에서는 Take 시간과 안내를 함께 유지한다. Review/미등록·잘못된 timestamp에는 안내를 만들지 않는다. 임의 BPM/박자·새 화면·디자인·오디오 gain·녹음 원본은 변경하지 않았다.

build34modules, Project audio 계약·backing gain·audio foundation 통과. native Edge/격리 IndexedDB에서 실제19초 반주와 등록된3.5초 lyric fixture의 ready/countdown/pause freeze/resume/첫 진입·직접 제출/원본 참조를 검증했고 2–4 Track Mix/잘못된 반주 HTTP·hash·key/변경된 snapshot 거부·원본 보존도 통과했다. 가짜 마이크 및 합성 Track 입력이며 실제 모바일/청취·원곡 timing 정확도·박자 인수를 대신하지 않는다. 관련 묶음은 main push→Git Integration→Production 동일 QA로 마감한다. R3/R4 외부 연결과 R5/R6/R7 완료 조건은 유지한다.

### R3 Google 로그인 우선 결정 — 2026-10-12

사용자가 `Google 로그인 우선`으로 답했다. SERVICE_CONNECTION과 기존 구현계획에 반영했다. 확정 범위는 우선 로그인 방식이며 실제 Supabase/Google OAuth 자원·로그인 UI·계정 연결·공유 DB/Storage 성공은 아니다. 기존 서버 session/Auth 준비 코드를 재사용할 계획이고 현재 서비스 미연결/capabilities false를 유지한다. 앱 코드와 보류된 서버3파일은 변경하지 않았다. 과거 로그인 미정 기록은 당시 상태로 보존하며 이 결정이 현재 우선 방식을 대체한다.

### R1 MediaRecorder callback의 encoded collector 해제 — 2026-10-12

e2036a5f89b9d5f6c59921b634e25565eb057f29 Git Integration7003072099 success/production HTTP200/index-9LEKbVCu.js local/remote SHA8CE231966C9459244639B1D9F34315A6A17745C01ACDE6E1348E62F9C9A651CE exact를 확인했다. production Sample Review 이탈/지연 저장 실패/기존 Profile bytes exact 및 정상 Profile 편집 실패·재시도/성공 handoff/reload/pageerror0 모두 통과했다.

현재 stop/cancel은 runtime.chunks 배열 포인터만 교체했으나 MediaRecorder.ondataavailable closure는 기존 collector를 계속 보유했다. 기존 유지 chunk ownership QA에서 실제 collector 배열을 캡처하자 취소 후 길이1이라는 native assertion 실패가 발생했다. 취소 및 정상 Blob 구성 후 collector 자체의 length를0으로 지우고 런타임 포인터를 교체하도록 최소 수정했다. 완성 Blob은 이미 구성된 독립 원본으로 보존하며 늦은 폐기 recorder event는 기존 소유권 guard로 계속 무시한다.

보강된 기존 qa/verify-recording-chunk-ownership.mjs에서 cancelled/finalized collector length0, 늦은 prior callback 새 Take 미혼입, 실제 새 Review Blob과 별도 native chunk snapshot SHA exact/pageerror0을 통과했다. build34modules/index-BUSjwhHm.js, 독립 Take bytes/URL 보존을 포함한 audio foundation Node QA를 통과했다. collector 참조 해제와 실제 PC 전체 RAM 감소량/GC 시점은 구분한다. 추가 관련 마이크 종료/decode 실패/paused decode 실패3조건의 원본 SHA/Draft 복원 및 single App 회귀도 통과했다. 이 묶음만 자동배포→production 동일 ownership QA로 마감한다. 기존 사용자의 서버3파일·디자인·음악/서비스/실기기 gate는 유지한다.

### R2 저장하지 않은 Sample Review 이탈 수명 — 2026-10-12

43693b528d606bd21c7d9466186bd5c7a896f95e Git Integration7003016406 success/production HTTP200/index-DxPQ6ex0.js local/remote SHA87C0813CC48AA1508FF8A44DC445CFDA028685FECE59182E35ACF8FEC748AC70 exact를 확인했다. production 기존 Profile 편집/저장 실패/재시도/이전 URL 해제/새 URL 재생/reload/Project 보존/pageerror0을 통과했다.

후속 native에서 새 Sample Review를 저장하지 않고 My로 이탈하면 임시 URL 미해제라는 assertion 실패를 재현했다. VoiceSetup이 Sample draft URL을 소유하며 이탈/변경 때 해제하되, Profile 저장 요청의 URL은 명시 handoff ref로 유지한다. 저장 실패는 handoff를 취소한다. 화면이 이미 종료된 뒤 저장 실패가 도착하면 해당 URL을 해제하고 종료된 화면 상태를 갱신하지 않는다. 성공 저장 URL은 현재 Profile 플레이어로 전달한다. 기존 Sample/Track/IndexedDB 원본·Profile 정책은 바꾸지 않는다.

새 유지 qa/verify-sample-review-navigation.mjs는 unsaved Review 이탈 및 IndexedDB open success 전달 지연→My 이탈→voice-sample put 오류의 실제 두 조건에서 URL 해제/기존 Protected Profile/reload 원본 오디오 SHA256 exact/stream·분석 참조 해제/pageerror0을 확인한다. qa:profile에 연결했다. build34modules/index-9LEKbVCu.js, 기존 native Profile 편집 성공·실패/재시도·새 URL 재생/초기복귀/reload와 늦은 Stop decode/navigation QA, atomic Profile 저장 rollback/retry 및 audio foundation Node 회귀를 통과했다. 여유 RAM9.085GiB였고 대형 모델을 새로 실행하지 않았다. 실제 전체 PC RAM 감소량·물리 발성/청취는 검증하지 않았다.

이번 최소 앱/QA/package/active docs 묶음만 main 자동배포→production 동일 이탈/실패 및 정상 저장 QA로 확인한다. 보류 서버3파일/디자인/실제 서비스·음악·미정 생성 정책/실기기 완료 gate는 유지한다.

### R2 대표 Sample 교체 후 이전 URL 해제 — 2026-10-12

641a4fe14848212b8594d9d0f5ff8d9e265bb919 main/origin 일치 및 Git Integration7002981955 success/production HTTP200/index--srv8LMR.js SHA C7BBC09EA9B967C45108E1FDCE7C42CDC314243091180A9E4FDBD5637B1D0D22 local/remote exact를 확인했다. production 반복 Draft3회 URL 해제/제출 실패 Review 재생/재시도 성공 URL 전달/원본 hash/reload exact/pageerror0도 통과했다.

다음 native 대표 Sample 편집 QA에서 저장 성공 후 기존 Profile Sample URL이 미해제라는 assertion 실패를 재현했다. App의 현재 profile.sampleUrl 소유권 effect를 추가하여 실제 Sample URL 교체 또는 App 종료 때만 이전 URL을 해제한다. 범위/취향 편집은 같은 URL을 유지하고 저장 실패·취소에서도 기존 원본을 해제하지 않는다. IndexedDB Sample 삭제·형상 재생성·Profile 정책 변경 없음.

보강한 기존 qa/verify-profile-editing.mjs에서 범위/취향 편집·취소·Sample 저장 실패/중복 요청1회·재시도 성공·이전 URL 해제·새 URL 미해제 및 fetch 재생·분석 버전/reload·Project Track 수/원본 유지·초기 Setup 복귀/pageerror0을 통과했다. build34modules/index-DxPQ6ex0.js, atomic Profile 저장 rollback/retry 및 single App Node 회귀도 통과했다. 물리 발성/청취·PC 전체 RAM 감소량은 별도 미검증이다. 수정된 앱·QA와 active docs만 검토/commit/main 자동배포→production 같은 QA로 마감하며 사용자 서버3파일과 디자인/음악/서비스 gate를 유지한다.

### R1 반복 Draft 복원 Review URL 해제 — 2026-10-12

직전8dc45a8c80dc40e7fb283d02ac00badbf6005dca Git Integration7002932392 success/production HTTP200/index-DpeDJVz-.js를 확인했다. 현재 앱에서 저장 Draft를3회 복원→Review→작업실로 나가면 생성된 URL3개 모두 미해제인 native assertion 실패를 재현했다. 최초 probe의 home/작업실 진입 조건 오류는 기존 단일 App의 ?design=figma workspace 초기 조건으로 교정한 뒤 실제 누적을 확인했다.

Recorder의 draft URL effect cleanup을 추가해 종료된 Review 소유 URL만 해제한다. submittingRef가 true인 성공 제출은 Project Track 플레이어로 URL 소유권을 넘기므로 해제하지 않는다. 제출 실패는 false로 되돌아오며 기존 Review·재시도 원본을 유지한다. Blob/IndexedDB 원본은 삭제하지 않는다. 새 UI/기획/디자인/서비스 변경은 없다.

새 유지 qa/verify-draft-review-url-lifecycle.mjs에서 native 격리 IndexedDB3회 복원/이탈 URL 해제, 제출 오류 주입 후 URL/재생/원본 hash 보존, 재시도 성공 URL 그대로 전달/재생 가능/Track hash exact 및 reload 원본 hash exact/pageerror0을 통과했다. qa:drafts에 연결했다. build34modules/index--srv8LMR.js, audio foundation·track store·single App Node 회귀 및 native retake recording/paused/review 실패 보존·ended normal/decode failure/paused decode failure3조건 원본/임시본/elapsed/참조 해제 모두 통과했다. 실제 PC RAM 절감량·물리 입력/청취 승인으로 확대하지 않는다.

이 검증 묶음만 main push→Git Integration→production 동일 QA로 마감한다. 보류 서버3파일·R5 디자인/미정 정책·R6 실제 음악/권리·R3/R4 실제 서비스·R7 물리 인수는 보존하며 전체 단계 완료로 표시하지 않는다.

### R6 두 실제 생성 성부의 합산/기존 믹서 관측 — 2026-10-12

79c970563a97b1b8c453e1f9629694d477b7e8d8 main/origin 일치 및 Git Integration7002892571 success를 확인했다. production HTTP200/index-DpeDJVz-.js local/remote SHA84CBF8692F280E5D18B581D03EEE46FDBE09F7D4BE246AEA405F67E3967E0A44 exact다. 보류 서버3파일은 보존했다.

기존 MLP base/upper native FLOAT22050 원본 두 개를 같은 진단 타임라인에서 실제 합산했다. gain1/peak.207052/duration5.468299초/output SHA38c6be35d9196ee06a6551bf3c1b4bb30f5e8e8cb403ce698bc351d23adf4389. 시작1초 합산 RMS.011157/peak.092047/성부 파형 correlation.719656, 끝 rest RMS.000800/correlation.846824다. voiced 구간 correlation−.015~.042는 화음 정답/청취 품질 지표가 아니다. 동일 singer/vocoder의 잔여 소리가 합산될 수 있는 관측이며 원본을 gate/repair하지 않았다.

이어 실제 repository src/audio.js SHA d45aa5e0344115d7b4483eefdac28b085906c57915d589654e62c31512a44f26의 createPreviewMix를 격리 native Edge/OfflineAudioContext에서 동일 원본 두 개·backing=false·offset0으로 호출했다. 새 앱/곡 등록/제출/DB 변경 없음. 실제 출력 WAV44100/stereo/duration5.668299초/output SHA1d65a59fce10b0ddd852ab548f799e241c0b429949e91d709dc3a8b5e334dd6e, wall512.6ms/pageerror0. 기존 cleanup/normalization/EQ/compressor 처리 후 master peakBefore.925792/gain.764692/peakAfter.707946, 저장 PCM peak.707916으로 기존−3dBFS ceiling 내였다.

첫 probe는 AudioContext decode가 장치48000으로 변환하는 것을 WAV 출력44100과 혼동해 assertion 실패했다. 이를 header/저장 PCM/재생 decoded rate로 분리했다. 다음 probe의 재생 피크 ceiling 검사는 실패했으며 마지막 보고서에 그대로 playbackDecodedCeilingExceeded=true로 보존한다. 실제48000 decode peak.710779/전체 RMS.163356/첫1초 RMS.057104다. 저장 PCM ceiling 성공을 재생 true-peak 보장으로 확대하지 않는다. 새 limiter 목표/반주 gain/임의 휴지 제거 정책을 도입하지 않는다. UTF-8 JSON 재조회도 명시 encoding으로 확인했으며 console glyph 깨짐을 실제 음절 데이터 손상으로 오인하지 않았다.

결과는 기존 runtime의 two-generated-parts-observation 및 two-native-app-mix-observation에 보존한다. 이 두 성부의 실제 결합 관측은 확보했으나 전체 곡/독립2–4Part·반주 화성·sourceScore·권리/청취·물리 성능·catalog 승인은 미완료다. 실제 서비스는 preparation/503 SERVICE_NOT_CONFIGURED이며 미정 로그인/제공자를 임의 확정하지 않는다. 현재 앱/사용자 파일·디자인은 변경하지 않았다.

### R6 실제 파형의 앱 추출기 교차 관측 — 2026-10-12

직전 aeaaa9cb8ba74e1736ec17fbd18bb86c5795c887 Git Integration7002801786 success/production HTTP200 및 index-DpeDJVz-.js SHA84CBF8692F280E5D18B581D03EEE46FDBE09F7D4BE246AEA405F67E3967E0A44 일치를 확인했다. 현재 production /api/capabilities는 preparation/모든 공유 capability false, 진단용 비밀이 아닌 invalid token의 /api/me/session은 HTTP503 SERVICE_NOT_CONFIGURED였다. 인증·협업 연결 성공으로 처리하지 않는다.

MLP의 기존 파생48k PCM16 두 WAV를 변경 없이 mono float32로 내보내 기존 src/pitch.js normalized-difference-v1을 직접 적용했다. frame4096/hop1024/80ms interior, threshold 변경 없이 모든 frame/reason을 보존했다. PCM SHA base46dcacccd17ba3afe9d6797f538f1680ad9258069581ac325cf22fc192f5751c, upper487b5717706649e73302a03cad0f91057866fd2f1aafb1c0da88106668d94a9c. 기존 native/derived 원본 hash와 score 입력 목적은 유지했다. 결과 mlp-app-pitch-cross-observation.json은 기존 runtime에 보존한다.

base interior7 median54.812/58.982/62.060/56.941/57.045/54.750/54.997, 검출14/7/24/17/15/11/17frames. pYIN .75 조건에서 누락했던 '가'가 이 추출기에서는11frames 검출됐다. 따라서 pYIN confident interior0을 실제 파형의 발성/음정 자체가 없다는 판정으로 확대하지 않는다. 두 분석기의 주기 점수와 확률은 같은 지표가 아니다. upper interior59.173/62.092/65.530/61.944/61.987/59.477/59.579로 '히'−.470/마지막+.579반음 차이가 남는다. 시작 rest interior도 base3frames MIDI40.759/upper9frames MIDI57.247 검출됐고 마지막 rest interior는 양쪽0이었다. 초기 잔여 파형/추출기 반응과 pYIN rest0의 차이를 보존하며 silence/음질 승인으로 바꾸지 않는다.

이는 모델 추가 실행 없는 독립 진단이며 앱 코드/음원/분석 threshold를 변경하지 않았다. 실제 sourceScore·음향 지속음/화성·전체2–4Part·권리/청취 gate는 유지한다. 기존 생성 결과를 등록하거나 무작위 seed/threshold로 통과시키지 않는다.

### R6 다른 한국어 score 구조의 실제 검증 — 2026-10-12

c734679725be43150a6df9309332e7cf4d110c21 Git Integration7002616427 success/production HTTP200/index-DpeDJVz-.js remote/local SHA84CBF8692F280E5D18B581D03EEE46FDBE09F7D4BE246AEA405F67E3967E0A44 exact, native 늦은 Sample URL·buffer 해제/기존 Profile reload와 정상 Recorder bytes exact/pageerror0을 확인했다. receipt는 기존 runtime에 보존했다. 현재 서버 보류3파일은 유지한다.

[MLP Singer 공식 코드](https://github.com/neosapience/mlp-singer/tree/7f4621ca04ee5e35c0e0a80b1fed785a55a51891)의 한국어 G2P/align·MIDI-minus52/26index·192frame MLP 구조를 검토했다. pinned 원문13파일 byte/Git blob/SHA 대조, checkpoint94151441bytes Git blobc67d75c084566f4307ad25df7342f7fc288ada7c/SHA1914d74820b554d566c5607afdb76f70c3885b043457a12e6c81f1ef242ae895를 보존했다. MIT 코드와 CSD 학습 자료의 실제 서비스 권리 확인은 구분하며 새 제공자를 확정하지 않는다. SoulX 공식 README는 Mandarin/English/Cantonese 학습을 명시하고 Korean SVS 지원 근거는 확인하지 못해 새 설치/추론 후보로 선정하지 않았다. 최신 정책 확인에 필요한 Notion/figma-desktop 도구는 현재 노출0개였으며 읽었다고 주장하지 않는다.

첫 MLP load는 weights_only가 utils.EarlyStopMonitor를 거부해 실패했다. unsafe globals가 해당 클래스 하나뿐인지 검사하고 pinned 원문에서 확인한 클래스만 safe_globals로 허용했다. unrestricted pickle/환경 재설치 없음. 같은 음절·시간과 base MIDI55/59/62/57/57/55/55, upper59/62/66/62/62/59/59를 원문 align/model에 입력했다. 두 독립 프로세스의 mel80×471 hash가 각 exact였고 다른 MIDI의 mel 차이는 관측됐지만 음높이·음원 품질로 간주하지 않았다.

공식 MLP README 링크의 HiFi-GAN config799bytes SHA c1bd98e99062ddbced38729a5252dc2aa772328d16d70097ac139dab2f269dc9와 native55788858bytes SHA771eaf4876485a35e25577563d390c262e23c2421e4a8c929eacfde34a5b7a60를 크기 상한 stream으로 받았다. submodule4769534d45265d52a904b850da5a622601885777 코드3파일/License Git blob 대조 및 mel80/22050Hz/hop256/FFT1024/fmin0/fmax8000 호환을 확인했다. zip-only globals scanner는 legacy torch.save라 실패했으나 weights_only 제한 로더와 strict state dict는 통과했다. 검토한 Generator/align 원문 body만 실행하고 기존48k vocoder로 대신하지 않았다.

실제 두 native FLOAT22050 WAV를 보존하고 ASR/기존 측정용 polyphase320/147→stereo PCM16 파생을 분리했다. normalization/output shift/rest gate/repair 없음. base nativeSHA97c346658ddc5c22efd3d03fa7a290e74153042f2d5b3d24871964e1345f1162→derivedSHA12f6d5823009ee0e62d8d091524b9ec9238b3315bc2c897da7720ffe1e1d44e0, upper78686a4ecc341fb53fe98a4191cc991b598164fe576aad8ccbd0c50872ab4e68→bc7d6340bb23ecde691398dbf6a062763eb84a0bac2bd94d880075018a6ca4dd. duration5.4683125초, base peak.134429/RMS.019358·upper.131969/.028983. waveform 실행 wall6.0856초/GPU peak173651968bytes/owned최대.9075GiB/free최소8.268GiB. mel만 .10486초를 전체 vocoder 추론 속도로 표시하지 않는다.

기존 pYIN .75/80ms interior의 base7음절 median54.9/59/62/56.9/57.05/null/55.1, upper59.2/62.15/65.5/61.9/62/59.1/59.6. base '가'는 interior0frames/full8frames median54.7이고 upper 마지막+.6반음·'히'−.5반음도 보존했다. legacy notesMidi 경로는 명시한 실제 MIDI 입력을 비교하며 report의 legacy encoding 라벨을 새 pinned 모델 지원 승인으로 쓰지 않는다. Small 가사는 양쪽 천천히걸어가요 exact/similarity1. MMS base/upper mean absolute onset37.313/42.858ms·max79.249/78.599ms, phonetic end4.126272/4.066181은 요청 note end4.468182와 다르다. wrong transcript 일부 score가 더 높다. CTC end≠지속음 길이·path score≠정확도와 missing/sparse frames를 유지하며 sourceScore/화음·2–4Part/catalog/청취는 미완료다.

base/upper pYIN wall7.329/7.314초·free8.941/8.948GiB/owned.238/.234GiB, Small17.220/17.227초·free7.595/7.583GiB/owned1.577/1.564GiB, MMS12.175/12.150초·free8.321/8.307GiB/owned.855/.855GiB, 최종 모든 실행 exit0/resourceStopped=false. source/probe/실패와 성공 결과·음원은 기존 runtime의 Git 제외 경로에 보존하며 repository 앱/asset/환경을 바꾸지 않았다. 다른 architecture가 정확한 가사·저음 일부를 생성한다는 근거는 얻었지만 기존 DiffSinger 실패나 전체 음악 gate를 해결했다고 표시하지 않는다.

### R1 늦은 분석의 전역 버퍼 재부착 방지 — 2026-10-12

0d078fc6a949138638df4e870e4d464610a976b1 Git Integration7002597560 success 및 production index-Blysb9GK.js를 확인했다. 해당 local/native Sample lifecycle·거부/Review URL/폐기취소·Profile 보존 회귀는 통과했다. 후속 delayed Stop QA에서 이탈 후 URL은 해제됐으나 decoded AudioBuffer와 lastAnalysis가 cleanup 이후 다시 붙는 실제 assertion 실패를 확인했다. 현재 recorder와 URL의 소유권이 유지된 경우에만 전역 분석 참조를 갱신하도록 제한했다. 반환되는 종료 Take의 blob/url/features/duration은 독립 결과로 유지한다.

최종 native late decode/navigation/reload에서 임시 URL 해제·decoded/lastAnalysis null 유지·기존 Profile·stream 해제/pageerror0을 통과했다. 정상 Recorder late discarded callback/new Take bytes exact 및 build34modules/audio foundation·cleanup Node 회귀 통과. 후속 수정만 main push→Git Integration→production 동일 QA로 확인하며 물리 마이크/청취·R6 음악/서비스 gate를 확대하지 않는다. 사용자 서버3파일과 모든 원본은 보존한다.

### R1 Sample 종료 분석 중 이탈의 URL 소유권 — 2026-10-12

4ad53c3734188735aec34f1717aa40567eec2785 Git Integration7002503941 success를 확인했다. 후속 native fake microphone에서 Sample Stop의 실제 decode 결과 전달을 지연하고 My로 이탈한 뒤 완료하면 새 임시 Blob URL이 미해제였다. 기존 Profile/stream 종료는 유지되었다. 초기 QA가 여러 decode를 지연해 release callback을 덮는 문제를 one-shot으로 수정하고 실제 컴포넌트 이탈 완료 조건을 명시했다. 교정된 QA에서도 이전 production 및 local 첫 최소 수정은 URL 해제 timeout으로 실패했다. 별도 Sample 회귀의 기본4193 연결 실패는 실제 preview4207을 지정해 해결했다.

stopRecording은 URL 생성 후 분석 await 동안 cleanup이 전역 recordingUrl을 비우면 빈 주소를 반환했다. 해당 종료 Take의 URL을 local 변수로 반환하고 VoiceSetup.stopSample의 lifecycle이 끝난 늦은 결과만 revoke한다. 정상 Review/기존 Profile URL은 유지하고 새 Draft/정책/디자인을 추가하지 않는다. 최종 native delayed stop/navigation/reload에서 URL 해제·Protected sample 유지·stream 종료/pageerror0 통과. build34modules·Profile atomic save rollback/retry·single app render·audio foundation 및 late discarded callback/new Take bytes exact 회귀 통과. 기존 Sample lifecycle은 같은4207에서 순차 검증한다. 변경한 App/audio/유지 QA와 active docs만 배포하며 서버3파일을 포함하지 않는다.

R6 독립 후속으로 동일 backing16–23.5초를 기존 공식 Basic Pitch230KB/기본 threshold에서 분석해51note candidates/inference.1890073초를 보존했다. 7음절 모두 G/B/D overlap 후보가 있으나 첫 B의 activation-weighted overlap.03055초와 CQT의 낮은 장·단 margin 차이는 불확실하다. 음표 후보/weighted overlap은 확률·협화도·악보 승인이 아니다. opening-backing-cross-method-observations.json을 기존 runtime에 보존하고 source/audio를 변경하지 않았다. wall4.8365초/free RAM최소8.933GiB/owned최대.190GiB/exit0/resourceStopped=false. 기존 R6 화음·휴지·2–4AI Part/권리·청취 gate와 디자인/서비스 보류를 유지한다.

### R6 기본 diffusion 상성부 및 실제 반주 대조 — 2026-10-12

98c92f0675d1d8bc58153e93d824a337cf7ba3ec Git Integration7002454053 success/production HTTP200 및 index-BuphXm9v.js SHA055D5EACB4845416A24FD3E56F72BDC5D47B34B4016D100C29CA6942326533D1 exact를 확인했다. 앱 변경 없는 QA metadata 묶음으로 native/build 전체를 반복하지 않았다.

같은 상성부 가설 입력을 기본50step diffusion/seed65359에서 한 번 실제 생성했다. output SHA8116d68c7794a813f1de9c00ceda48f8f7c588721fc6482caf75896fcd63348a,5.456708333초/inference1.5425859초/GPU395500032bytes/peak.8466043/RMS.1721535. 고정 pYIN의7음절 median58.9/61.9/65.9/61.9/62/59/59.1, 유효25/14/51/17/16/10/27frames/최대.1반음과 Whisper 가사 exact/similarity1을 관측했다. MMS onset mean absolute39.754ms/max64.107ms였으나 마지막 phonetic end4.0725009는 요청 지속음 끝과 다르고 첫 rest에는4유효frames/MIDI40.8·RMS.0350092, 마지막 rest RMS.0348616이 남았다. 휴지·가사 진입/지속음·청취 통과를 선언하지 않는다. sourceScore/harmony/Part arrangement/catalog는 false로 보존한다.

실제 원곡 backing의16–23.5초 HPSS/CQT를 같은 source/alignment hash와24triad template로 관측했다. 첫 두 음절 top margin.003022/.006704로 G minor vs major/Em이 불명확하고 이후5구간의 G major 후보 margin.184657/.117949/.111374/.159812/.067123을 기록했다. chroma rank/triad similarity는 화음 정답/협화도 확률이 아니다. 상성부 입력의 원래 후보 대비 간격4/3/4/5/5/4/4반음도 명시해 자동 추출된 harmony로 오인하지 않는다. 첫 upper B pitch-class rank10과 낮은 margin, 원래 A 후보 rank7 등의 불일치도 숨기지 않는다. source-opening-backing-harmony-cqt-candidate.json 및 opening-upper-backing-evidence-comparison.json을 기존 runtime에 보존하며 앱 음원으로 등록하지 않았다.

backing 관측/generation/pYIN/ASR/MMS 순차 wall4.843/7.315/7.328/17.154/12.169초, 최소 free RAM8.888/7.817/8.846/7.598/8.273GiB·최대 owned working set.215/1.261/.234/1.520/.855GiB, 모두 exit0/resourceStopped=false. 모델/threshold/input 반복 탐색·output shift·기존 파일 교체 없음. 기존 lower 실패/원곡 timing ambiguity와 R1–R7 완료 gate, 실제 서비스3파일/디자인 보류를 유지한다.

### R6 상성부 입력 제어와 출처 보존 — 2026-10-12

직전 516037f49e72e18580adcd9f0887364e0a2fe90b는 Git Integration7002279909 success, production HTTP200/index-BuphXm9v.js remote/local SHA256055D5EACB4845416A24FD3E56F72BDC5D47B34B4016D100C29CA6942326533D1 exact를 확인했다. production 새 Sample v5/window4096 저장·reload 및 mixed v3/v4/v5의 native2/3/4Part exact Layer/제출 실패·재시도/Mix/Credits/reload/pageerror0을 통과했다.

기존 원곡 연결 opening 후보의 가사·길이·출처를 보존한 별도 상성부 가설 입력을 기존 runtime에 생성했다. 실제 MIDI59/62/66/62/62/59/59를 모델 입력 index71/74/78/74/74/71/71로 전달했다. 추출·승인된 원곡 음표/화음이 아니며 output pitch shift를 사용하지 않았다. 같은 고정 DiffSingerKR/seed65359의 native linear 진단 경로에서 실제5.456708333초 WAV SHA297bd4d3985343837625c2e1294541ec83ff47b7e13a26ee5be3ed8c90276132, inference.5568459초/GPU396221952bytes/peak.8712179/RMS.1848184를 관측했다. linear 결과를 diffusion 품질 대체나 완성 Part로 채택하지 않는다.

기존 pYIN .75/80ms interior 조건에서 7음절 median58.9/61.75/65.9/61.9/62/58.9/59, 유효 표본20/8/53/24/28/9/31, 최대 중앙값 오차.25반음이었다. full interval/min/max와 rest 잔여 RMS도 보존했다. 기존 CPU WhisperSmall의 가사 천천히걸어가요 exact/similarity1을 확인했다. MMS forced alignment의 요청 onset 대비 mean absolute42.62ms/max64.11ms지만 마지막 음절 phonetic end4.0725009는 요청 note end4.4681818과 다르다. CTC 음절 끝을 지속음 길이로 쓰지 않으며 잘못된 transcript 일부 path score가 더 높아 score를 신뢰도/음악 승인으로 사용하지 않는다. 원곡 화음·음절/휴지 score, 청취, 실제2–4AI Part 및 권리/등록은 미완료다.

유지 QA report에 입력의 목적(inputPurpose)을 따로 보존하고 generic diagnostic 목적과 승인 여부를 구분했다. 기존 scoreCalibration 출처와 성공/실패 결과는 유지한다. metadata-aware 재측정에서 기존 observations/noteEventObservations numeric exact, 잘못된 boolean purpose는 모델 import 전에 거부하고 output 미생성을 확인했다. 분석 창/threshold/모델/math/앱 코드는 변경하지 않았다.

한 번에 한 모델을 RAM guard로 순차 실행했다. 생성/측정/ASR/MMS의 최소 free RAM8.108/8.929/7.599/8.297GiB, 해당 Python 최대 working set.753/.234/1.578/.854GiB, wall7.300/7.305/20.802/12.158초, 모두 exit0/resourceStopped=false였다. GPU peak와 process working set은 별도 지표다. 결과/오디오/입력은 repository 밖 기존 runtime에 보존하며 서버3파일·디자인·기존 실패 기록을 유지한다. 이번 QA metadata/docs 묶음은 main 자동배포 후 동일 앱 asset을 확인하고 변경 없는 native/build 전체를 반복하지 않는다.

### R5 Track/Sample 저음 주기 창 — 2026-10-12

00bb5d015f0359e0b522b3dec8388161355cb256 Git Integration7002148063 success, production index-Du-vkZ30.js remote/local SHA25622433135801A50839F2DFC91D3E0E8FD2AA8532DEB22494264152F2F72D11368 exact. production Sample 분석 버전 저장/reload·범위/Sample 유지·실패/재시도, mixed v3/v4의 native2/3/4Part exact Layer signature/Review 제출/Mix/Credits 복귀/reload/pageerror0을 통과했다. native Current Mix 화면 이탈 시 paused=true·재생 시간 정지도 확인하여 재생기에 추가 수정하지 않았다.

후속 synthetic82.41Hz를 실제 analyzeAudioBuffer에 넣으면44.1/48kHz 모두 pitchFrameCount=0이었던 원인을 확인했다. spectral1024 FFT와 같은 길이를 pitch에 넘겨 저음의 lag를 충분히 담지 못했다. spectral/level1024 경로는 유지하고 pitch만 중심 근처4096 샘플에서 독립 RMS로 측정한다. 짧아4096 샘플이 없으면 pitch를 생성하지 않는다. 새 결과는 ieum-basic-voice-v5, normalized-difference-v1, pitchFrameLength4096을 fingerprint 입력에 기록하며 기존v3/v4와 정확한v5를 모두 보존한다. 기존 확정 결과를 다시 계산하거나 이미지/renderer/개인 생성 정책을 변경하지 않는다.

65.41/73.42/82.41/110/146.83/220/440Hz×44.1/48kHz14조건 모두 실제36periodic frames·안정 음정 motion<.01/동일 feature exact를 통과했다. 저음82.41→110 변화의 pitchVariation> .02도 검증했다. 실제 CSD 연구 PCM에서 이전v4와 모든 spectral/level/envelope 필드는 exact, pitch24frames→24frames/variation.23261→.2024로 관측했다. archive 비교의 첫 cwd URL decoding 오류를 fileURLToPath로 수정한 뒤 실행했으며 audio/결과는 기존 runtime에 보존한다. 값의 차이는 정확도·음색 신뢰도나 실제 음역 승인과 다르다.

build34modules·Identity 계약의 legacy/new 버전 및 잘못된v5 window 거부,2–4 결합/서로 다른 Track/기존 Layer 재현·audio foundation/단일 앱 Node 렌더 통과. native 새 Sample v5/window 저장/reload와 mixed v3/v4/v5의2/3/4Part exact signature/제출 실패·재시도/Mix/Credits/reload 회귀 통과. desktop Node3tracks 분석254.5ms 관측으로 기존110ms대보다 증가하며 mobile 지연은 미측정이다. 전체 R5 생성/개인 형상·미지원 음역/호흡량/비브라토 후보와 R6 음악·화성/AI Part·서비스/물리 인수는 완료로 확대하지 않는다. 실제 서버3파일·디자인·원본 파일 보존.

### R5 공유 분석기의 버전·기존 결과 호환 — 2026-10-12

aa363fbbdaf54ca71a709a52829f13a77d871f48 Git Integration7002045989 success 및 production index-DGShlvLH.js에서 음역4조건을 확인했다: 무음0/거부, 실제 가창double tap1요청·126표본/B3–G♯4, tone-noise120→120/A3–A3, 준비 실패 후 retry127표본/B3–G♯4·stream 해제/미등록/pageerror0. R1 start/tracked 수정은 production에서도 통과했으며 물리 입력 검증은 아니다.

기존 analyzeAudioBuffer도 estimatePitch를 공유하므로 새 Sample/Track 분석은 ieum-basic-voice-v4 및 pitchAnalysisVersion=normalized-difference-v1로 구분했다. fingerprint에도 이 메타데이터가 포함된다. 기존 v3 분석과 저장 Layer를 계속 인정하고, 정확한 v4/extractor 조합을 함께 읽도록 refreshTrackAnalysis·proxy assessment의 공통 검사만 보완했다. 기존 Profile/Track/완성 Record의 강제 재분석·재생성, renderer/형상/Generator 버전 변경은 없다. 버전 누락/불일치를 새 지원 결과로 위장하지 않으며 미지원 평균 음역/호흡량/비브라토/BPM/리듬 복잡도는 null로 유지한다.

첫 v4 계약 시험은 v3 전용 검사 때문에 unsupported!=estimated로 실패했으며 해당 검사 범위를 보완한 뒤 통과했다. 동일 입력/버전 feature/fingerprint exact·legacy proxy 지원·잘못된 extractor 거부, 기존2–4 결합/서로 다른 Track/계보/제출-그래픽 상태 분리 회귀 통과. 실제 native Sample 저장/reload에서 v4와 extractor version을 보존했고 원래 Sample/범위·저장 실패/재시도도 유지했다. mixed v3/v4 Track의 exact Layer signature를 Node bootstrap과 native2/3/4Part Review→제출 실패/재시도→Mix→Credits 복귀→reload에서 확인했다. 첫 native assertion은 초기 debug snapshot의 createdTracks 갱신 전 대기로 timeout했고 실제 Review 진입 후 확인하도록 QA만 정정했다. 앱을 QA에 맞춰 바꾸지 않았다.

build 및 관련 Node/native QA 검증 묶음이며 전체 R5 이미지/개인 생성·신뢰도 정책과 R6 실제 곡/화성·2–4AI Part, 실제 서버3파일·디자인/물리 인수는 남는다. 이 버전 구분은 이미 구현된 분석 결과의 출처 보존이고 미정 개인 Identicon 알고리즘 갱신 정책을 결정하지 않는다.

### R1 음역 측정 시작 중복 보호 — 2026-10-12

마이크 준비150ms 동안 측정 시작을 double tap하면 getUserMedia2회가 발생하는 native 재현을 확인했다. VoiceSetup.startRange에 기존 녹음 시작과 같은 단일 진행 ref를 적용해 중복 요청을1회로 제한하고 finally에서 해제하여 준비 실패 후 재시도를 유지했다. 기존 source/session 취소·측정 절차/버튼·화면과 저장 정책 변경 없음.

최종 native 4조건: 무음0/거부, 실제 가창double tap1요청·126표본/B3–G♯4, tone-noise tracked119→119/A3–A3, NotReadableError 최초 실패 뒤 retry2번째 요청·128표본/B3–G♯4를 통과했다. 성공 종료 stream 해제/미등록/pageerror0, build34modules 및 Node pitch16/16·Profile atomic save failure/rollback/retry 회귀도 통과했다. user PC free RAM9666160KiB·Python worker 없음. 모델을 켜거나 서버3파일/디자인/미정 정책을 변경하지 않았다.

직전 f0e1028c37dd2e00bcbc38ed72bc2c7627cb3868 Git Integration7002003291 success를 확인했다. 이번 중복 보호 묶음의 자동배포 후 production에서도 4조건과 빌드 hash를 확인하여 이전 tracking 교정까지 함께 검증하며, 물리 입력·청취/전체 단계 완료로 표시하지 않는다.

### R1/R5 추적 표시와 측정 표본 분리 — 2026-10-12

18e48a4c15a39ff29210826a80b9e93c70a32988 Git Integration7001957166 success, production index-COo5wZ9E.js remote/local SHA256A023C8FE1FFB8F96FF9B1B1CEFE5D05B1D80F6D6487740464EBB09D827E52435 exact. production 무음 거부/실제 짧은 가창145표본·B3–G♯4·stream 종료/미등록, Profile 편집/analysisVersion 보존·저장 실패·재시도·복귀 회귀/pageerror0 통과.

후속 native tone→큰 비주기 noise 입력에서 pitchReason=tracked인100ms 동안 accepted121→126을 재현했다. monitorInput은 표시 연속성을 위해 이전 음정을350ms 유지하지만, 이를 새 측정으로 수집하는 것은 실제 추출 표본과 다르다. VoiceSetup의 accepted 및 pitchSamples는 fresh이면서 reason=detected이고 기존36–84 범위에 든 값만 수집하도록 최소 교정했다. 표시 tracking/진단 reason·표본6개/percentile·녹음·Profile 정책은 유지한다.

최종 local native 무음0/거부, 같은 실제 자료126표본·B3–G♯4, tone-noise119→119/상한A3·stream 해제·미등록/pageerror0을 통과했다. accepted/check count는 browser scheduling에 따라 달라질 수 있으며 그 수치 자체를 과학적 신뢰도나 음역 정확도로 승인하지 않는다. build34modules/Node pitch16fixture 및 Profile 저장·분석 버전 보존 회귀를 검증한다. 실제 기기/다양한 목소리·전체 R5/R6 완료 조건과 서비스3파일 보류는 그대로다.

### R1/R5 음역 상한 오검출 교정 — 2026-10-12

4cae0daef744ce9db0ae2199b837ede2f92c8a47 Git Integration7001850558 success 및 production index-Bl8Ph6NX.js SHA256D3BE03C218574646E032A5E51738720FA46554FF5982685E702A019D30EF8FC5 local exact를 확인했다. 뒤이어 실제 CSD3.9초 PCM을 native MediaStream→WebAudio→monitorInput→VoiceSetup에 넣었더니 기존 측정 상한이 G♯5로 부풀었다. 직접 함수 전체 구간에서도 MIDI75 초과11frames, 일부는 첫 음표 전·일부는 annotation59/68 구간에 나타났다. 따라서 이전 음절별 interior 대조만으로 live 음역 측정 정확성을 승인하지 않는다.

기존 earliest relative correlation peak를 cumulative normalized difference의 절대 periodicity 판정·첫 최소점/보간으로 교체했다. [YIN 원 논문](https://pubmed.ncbi.nlm.nih.gov/12002874/)을 알고리즘 참고로 사용하며 이 구현을 전체 YIN 논문 재현 또는 과학적 음색 판정으로 주장하지 않는다. microphone 요청/처리 설정·3frame 측정·350ms tracking·6표본 요구·8/92 percentile·화면/IA·기존 저장 Profile/대표 Sample은 그대로다. 새 저장 rangeData만 normalized-difference-v1 analysisVersion을 포함하고 이전 데이터를 재측정하지 않는다. confidence는 normalized periodicity 지표이며 과거 correlation 수치와 직접 비교하거나 정확도 확률로 사용하지 않는다.

순수 Node16/16 합성 가창 fixture(44.1/48kHz)35cents 이내·무음/큰 비주기 noise/DC 거부·voiced DC offset 회귀 통과. 실제 CSD 직접 관측은 같은 PCM에서 높은 오검출0frames, 나머지 음절의 근접 관측을 유지하고 첫 lower onset57.9646과 sparse3/2frames를 숨기지 않았다. 격리 후보의 Vocadito9.1초와 기존 실제 AI vocal7.5초 대조에서는 유효 수집이 감소했고 changing-pitch 차이가 남아 정확도 승인으로 확대하지 않는다. 새 probe/hash 결과와 모든 이전 실패·후보 결과는 기존 runtime에 보존하며 오디오·모델·결과 JSON은 앱/Git에 넣지 않았다. 대형 AI는 실행하지 않았고 여유 RAM 약9GiB를 확인했다.

최종 native QA에서 무음0표본/거부, 같은 실제 가창144표본·B3–G♯4·stream 종료·Profile 미등록/pageerror0을 통과했다. Profile 재측정 저장의 analysisVersion 보존, 대표 Sample 유지, 취소/저장 실패·재시도/복귀 회귀도 통과. build34modules 및 Node audio foundation/single app render/user journey 통과. 이는 8음절의 가창 자료를 공급한 입력 경로 검증이며 실제 사용자의 전체 편한 음역·장치/다양한 목소리·청취·모바일 인수를 대신하지 않는다. R5 미정 형태/정책과 R3/R4 실제 서비스·R6 AI/화성/2–4Part gate, 서버3파일 제외는 유지한다.

### R5 분석 가능성 — 기존 pitch 함수의 실제 가창 관측 / 2026-10-12

이미지·정책 변경 없이 src/pitch.js의 estimatePitch를 고정 실제 CSD3.9초 원본 rate44100Hz/mono·4096frame/hop1024에 적용했다. SF mono export687960bytes SHA1f787f4781ffa4ad31739f25b57761bdf1385e4aa8a2b78dd02103eb019741bb, waveform/source hash와 수동 annotation JSON SHA8064227cd1b597ca9081c36cc5bd068948e8f432ef635ad09eb13a94c596e4a5를 고정했다. amplitude normalization/output shift/새 합성/모델 설치 없음. 자료의 CC-BY-NC-SA4.0 연구 범위는 유지하며 오디오·annotation·결과는 repository 밖 기존 runtime에 보존한다.

8음절 interior 진단 .30 correlation 조건에서 첫 표기59는3frames·median58.0668로 실제 lower onset을 관측했고, 나머지7음절 median59.1656/58.9420/65.9038/65.9498/67.8399/67.9627/67.8569였다. sample 수는3/3/10/13/13/13/3/3이며 sparse/max 값과 null을 그대로 보존했다. 고정 임계값은 진단 그룹화에만 사용했다. live Range UI에는 이 .30 필터가 없으므로 처음 붙인 existingAppConfidenceThreshold 라벨을 diagnosticConfidenceThreshold로 정정하고 최종 결과5ab9b91629fb1f58176a04b5d3995e62924e5d246a465ab9dbd1faf70c213485를 별도 보존했다. 기존 app 수집 정책은 바꾸지 않았다.

qa/probe-annotated-voice-pitch.mjs를 재사용 도구로 추가했고 같은 actual PCM의 rows/frames exact를 확인했다. 최종 실행 순수Node 단일 CPU 약0.138초; 기존 pitch detector8/8 voice-like 수치 fixture·quiet rejection도 통과. 이는 함수 직접 관측이며 monitorInput의3frame throttling/350ms tracking·microphone processing·실제 Range collection/과학적 정확도/사용자 Profile 측정/개인 이미지 승인을 입증하지 않는다. measurementApproved/profileEnrolled/liveProfilePipelineVerified=false. 개인별 형태/정책·미지원 breathiness/vibrato 등의 검증된 추출값 부재는 그대로 남는다.

c72b326b8279cd6dfc5b6128c6c6cb4bfc8fb4d9 Git Integration7001722951 success, production HTTP200/index-Bl8Ph6NX.js SHA256D3BE03C218574646E032A5E51738720FA46554FF5982685E702A019D30EF8FC5 local exact. 앱 변경 없는 측정 도구 묶음에서 동일 native 인수는 반복하지 않았다. 실제 서버3파일·디자인 보류/Notion 미정 정책·AI 화성/2–4Part·청취 gate 유지.
### R6 짧은 음절 측정 구간의 편향 / R1 production — 2026-10-12

c65bcead911e84895447a2d2eaf8d372f59a4000 Git Integration7001631905 success, production HTTP200/index-Bl8Ph6NX.js remote/local SHA256D3BE03C218574646E032A5E51738720FA46554FF5982685E702A019D30EF8FC5 exact. production actual native fake Take 저장1.26초·WebM metadata nonfinite에서 slider1.26초 일치, rendered Mix11.978571초 복귀/pageerror0을 통과했다. 물리 입력·지연/청취 인수를 대신하지 않는다.

고정 실제 CSD 첫0.2307초 음절의 기존 pYIN .75조건/frame1024·1536/hop128을 유지해 관측 궤적을 읽었다. 양끝80ms 제외 interior는4/5confident frames·median57.7/57.8이었지만 full annotation span은12/18frames·median59.15/58.85, min57.7/57.8~max59.3이었다. 1.05초 이전 lower onset와 이후59근처가 함께 관측됐다. 따라서 trimmed sparse median이나 Basic Pitch58/59 분할을 전체 note target59가 잘못됐다는 정답으로 바꾸지 않는다. GAME merged59·Basic Pitch분할·음절 annotation·실제 F0는 서로 다른 의미다. trajectory JSON SHA8dac88600fbcc6889bd1fa10be0d9031a63b09bd3a9b8d80c06e4be1c9b0665d, guard exit0/wall8.621초/free최소9.184GiB/owned0.235GiB.

유지 qa/measure-korean-score-output.py에 기존 interior 관측을 그대로 둔 fullInterval의 전체/유효 frame 수·median/min/max와 interiorWindowSeconds를 추가했다. 음절과 noteCurves event 양쪽에 적용하고 어떤 값을 대신 통과 기준으로 선택하지 않는다. 같은 opening linear waveform의 prior interior observations와 같은 melisma waveform의 prior observations/events가 exact 유지됐다. 원곡 첫 구절 마지막 음절은 interior54.5/16frames, full54.6/23frames·min52.8/max54.9로 남는다. 임의 목표55로 보정하지 않는다. synthetic64→66 events는 full23/20frames·median64.1/65.9, 기존interior13/13frames 유지. 새 waveform/ASR·seed/threshold 반복 없음.

새 측정2회 guard exit0/중단false·wall7.274/7.305초·free최소9.156/9.137GiB·owned0.245/0.248GiB. 단계 전체·원곡 화성·2–4Part·권한/청취 및 보류 형상/실제 서버 gate는 그대로 남는다. 이번 변경은 재사용 측정/불확실성 기록만이며 앱 build·native 인수를 다시 반복하지 않는다. 보류 서버3파일 stage 제외.
### R1 native Take로 전환할 때 재생 길이 — 2026-10-12

production에서 실제 fake microphone Take를 녹음·제출한 뒤 Current Mix→개별 Tenor로 전환했다. rendered WAV preview11.978571초를 표시하던 Player가 native WebM의 duration이 nonfinite인 경우 Take의 저장 길이1.2초 대신 이전11.978571초 slider max를 유지하는 결함을 재현했다. 첫 QA는 Home에서 작업실 버튼을 기다려 timeout이었고 기존 단일 앱의 workspace query를 명시하자 실제 길이 assertion이 실패했다. 테스트 조건 문제와 앱 결함을 분리한다.

기존 Player가 source/알려진 길이 변경 시 표시 time과 fallback duration을 현재 원본 기준으로 초기화하도록4줄만 보완했다. 자동 play/pause, native audio·녹음 타임라인·음원·시각/UX 정책은 유지한다. qa/verify-native-track-player-duration.mjs에서 실제 WebM duration unavailable·저장1.2초·slider1.2초 일치 및 rendered Mix11.978571초 복귀를 통과했다. build34modules, Node single-app render/user journey 및 native Sample 소유권·정상2–4/main Mix 생성/저장/reload 회귀 통과. 물리 지연/청취·실기기 인수와 구분한다.

c106f4d064f7b1079c70dba0c4791af782685d7b Git Integration7001566287 success, production HTTP200/index-CmEtuFQt.js SHA2566CB43DBC6253A935F9D9CB8F974DA89A9258C1EBC9027545A0A98287CC684F28은 직전10f3e78 검증 앱과 같은 asset이다. 이번 Player build로 local asset은 바뀌었으므로 새 commit 자동배포/production의 실제 길이 전환을 이어서 검증한다. 보류 서버3파일·디자인/실제 AI 품질 gate 유지.
### R6 공식 계산 출력 호환성 / R1·R2 production — 2026-10-12

10f3e78579f6ab773b7e5a477bb374bf35ebb695 Git Integration7001466306 success. production HTTP200/index-CmEtuFQt.js remote/local SHA2566CB43DBC6253A935F9D9CB8F974DA89A9258C1EBC9027545A0A98287CC684F28 exact. production Sample 짧은 거부/정상 Review/폐기 취소·확인·기존 Profile 보존과 Recorder recording/paused/review 삭제 실패 원본 보존·폐기 성공 URL 해제·timer 회귀 모두 passed/pageerror0. 실제 물리 입력/모바일/청취 인수와 구분한다.

Basic Pitch 고정 공식 tests/resources의 단일9.097823초 Vocadito WAV802472bytes와 계산된 model_output1385749bytes/note_events19044bytes만 받아 size/Git blob/SHA 대조했다. 원문 NOTICE의 Vocadito CC-BY4.0 및 코드Apache2.0 범위를 구분했다. 공식 test_inference.py는 허용오차1e-4/rtol0로 golden 결과를 비교한다. 이 파일은 수동 악보 정답이 아닌 공식 계산 출력이므로 음악 정확도·Korean 지원 근거로 쓰지 않는다. waveform SHA0978bde1c130ae26a9cfcd90012f12fdaf9877bbe45cf21c5237ba7ac9b8703b/model output45bf29f260cd37db50a198fb9897e6c6c1b21454f22424a3b527345422260a1b/events1766c000d40c6f1bf6230200ba83a07ce41bef46a0aacfdd2fb8bb141946447a.

기존 유지 경량 도구의 실제 ONNX tensor note/onset/contour shape가 공식 golden과 같고 max abs차9.06e-6/3.39e-5/2.14e-5로 공식 tolerance 안이었다. 28events의 start/end/midi/meanActivation도 정렬 순서를 맞춰 최대6.32e-6이며 pitch bends는 비교하지 않았다. qa/verify-polyphonic-golden.py로 고정3fixture hash/new output/제한된 NumPy 숫자 재구성만 허용하는 읽기·실제 probe 실행/비교를 재사용한다. 새 디렉터리별 결과를 보존하고 실패 결과도 기록 후 nonzero 종료한다. 모델/fixture/계산된 JSON은 기존 repository 밖 runtime 보존.

최종 유지 golden 실제 실행 passed=true·guard exit0/중단false/wall3.635초/free최소9.109GiB/owned peak0.203GiB. 앞선 runtime 비교도 동일수치로 exit0/wall4.844초/free9.103/owned0.202GiB. 유지 반주8초 별도 process의68nativeNotes도 이전결과 exact·추론0.191초/guard4.830초/free9.154/owned0.199GiB. waveform/threshold를 반복 조정한 결과가 아니다. system Python에는 NumPy가 없어 첫 --help가 ModuleNotFoundError였으며 argparse/help·hash validation 뒤 import하도록 수정했다. 실제 추론은 기존 검증된 환경만 사용한다. 원곡의6/9 수동 matching과 화성/전이 차이는 여전히 남으며, 이 호환성 통과로 sourceScore/2–4Part/catalog·권한/청취 gate를 완료하지 않는다.
### R1/R2 채택하지 않은 Take의 자원 해제 — 2026-10-12

기존 최소3초 규칙에 따라 Review에 채택되지 않는 Sample에서 URL 미해제를 production assertion으로 재현했다. 기존 확인 후 Sample 폐기와 Recorder 재녹음의 성공 경로에서도 URL 미해제를 local native assertion으로 재현했다. 짧은 Sample의 새 URL/임시 runtime 참조만 해제하고, 확인된 Sample 폐기 및 임시본 삭제 성공 후 Review URL을 해제한다. 삭제 실패/취소·기존 Profile·제출 Track·정상 Review/성공 저장의 URL은 유지한다. 길이·저장·재시도·UX 정책 변경 없음. 실제 RAM 절약량 측정으로 주장하지 않는다.

build34modules·Node audio foundation/user journey/single-app 렌더 통과. 기존 유지 Sample QA에 짧은 거부 결과 해제/기존 Profile·원곡 preview 보존/정상 Take URL 유지/확인 폐기 해제를 연결했다. 기존 재녹음 QA는 recording/paused/review 삭제 실패 보존과 Review URL 미해제, 성공 폐기의 URL 해제·한 timer를 통과했다. Profile 편집 저장 실패·중복 방지·재시도/reload, legacy draft 본인/ownerless 복원·확인 폐기/타인 보존, discarded late chunk와 새 Take bytes exact도 통과했다. 물리 마이크/모바일·청취/서버 인수는 미완료다.

660821627b3fa0d2537136973aaf911e06bd3ae8 Git Integration7001401490 success, production HTTP200/index-pA0BuH4D.js SHA25637FE92A53A289DBB7E60DFF0F0FA5FFB4A8B9FBEFF6C00FAED8E7C7F9FA06F2D 관측. production native 실패2/main4는 미게시 Mix URL revoke 및 제출 원본 SHA exact, 정상2/3/4/main Mix 생성·저장·reload 통과. 새 Sample build로 local asset이 교체된 뒤 관측이므로 현재 local hash exact와 구분한다. 현재 PC free9.28GiB/total15.95GiB·Python 모델 프로세스0을 확인했다. 한 native browser씩 실행하고 사용자 앱/Windows 설정은 변경하지 않았다.
### R1 게시되지 않은 Auto Mix URL 해제 — 2026-10-12

production native Auto Mix 저장에 IndexedDB 오류를 주입해 결과 Blob URL이 revoke되지 않는 결함을 재현했다. 첫 QA는 created-project debug snapshot이 이전 idle 상태여서 timeout이었다. 실제 생성/실패 URL을 기준으로 기다리고 작업실 진입 후 현재 제출 상태를 검사하도록 시험을 수정하자 unpublished URL release assertion=false로 결함이 확인됐다. 임의 원본 삭제나 저장 실패 성공 처리 없음.

기존 App.jsx의 main/created Auto Mix 경로에 생성 결과 URL의 미게시 소유권만 추가했다. 저장 실패와 main job 취소 후 결과는 finally에서 revoke하며, 성공하여 상태에 전달한 URL은 해제하지 않는다. 기존 제출 Track/Draft/Profile/완성 결과와 mix 실패·재시도 정책은 유지한다. RAM 전체 감소량을 측정한 것으로 주장하지 않는다.

build34modules 통과. 유지 qa/verify-failed-mix-release.mjs의 created2/main4 native 실패는 URL revoke/제출2·4개 보존/완성 Mix 미게시를 통과했다. 정상 native2/3/4/main Mix 생성·저장·reload/원본·seed 검증과 제출/그래픽 분리, Node audio foundation/single-app render/user journey 통과. 실제 기기·청취/시각/서버 인수 미완료, 보류 서버3파일 stage 제외.

R6 실제 반주0.5초16구간 CQT를 Basic Pitch 기존68note와 대조했다. 34.2–36.7초의 G 후보는 일부G/D/B 근거와 겹치지만37.7–39.7초 CQT top은 B minor이며 polyphonic D/F#/A와 달랐다. 전이·제3음/배음·bass 맥락의 불확실성을 더 분리해야 한다. 첫 연구 스크립트는 CRLF 문자열 치환 실패로 기존7음절 구간이 실행됐고 그 결과를 보존했다. 실제16구간으로 수정한 별도 v2 결과만 이 관측에 썼다. guard v2 exit0/중단false/wall4.792초, 화음/score/catalog approval=false, 새 음원 연결 없음.

f0766b7fcf43339779753dd45353934f09c0b8e1 Git Integration7001304172 success/production HTTP200/index-6DXQCBbY.js SHA2568D5429B8A6F9259D1AF6E656AABF7860A9EB4D0B2D3CB985008F017D2A2B2D7A은 당시 앱 build와 일치했다. 이번 변경 build로 로컬 asset이 교체됐으므로 새 commit의 자동배포/production 실패·정상 경로 검증을 이어서 확인한다.
### R6 경량 polyphonic ONNX 교차 관측 / R1 production 확인 — 2026-10-12

R1 a6d1161c5293cd2b2d01c018658ce32a29bbf272은 Git Integration7001154692 success이며 production HTTP200/index-6DXQCBbY.js remote/local SHA2568D5429B8A6F9259D1AF6E656AABF7860A9EB4D0B2D3CB985008F017D2A2B2D7A 일치. production 정상 종료·decoder failure·paused decoder failure3조건에서 원본 Review/Draft hash/길이 보존과 pageerror0을 확인했다. 실제 물리 마이크·모바일 인수와 구분한다.

[Spotify Basic Pitch](https://github.com/spotify/basic-pitch)의 fa5997af0a8210982619003269994a1be25eddf3 원문6파일만 bytes/Git blob/SHA 대조했다. ONNX230444bytes SHA2562c3c1d144bfa61ad236e92e169c13535c880469a12a047d4e73451f2c059a0ec이며 Apache2.0 LICENSE/NOTICE 보존. 기존 ONNXRuntime1.30 CPU2threads에서 공식 window/unwrap/postprocessing 함수와 기본 threshold를 사용했다. 공식 Python package는 설치하지 않았고 Python3.13 SDK 지원을 주장하지 않는다. 모델/원문/결과는 repository 밖 기존 runtime에 보존하고, 유지 도구 qa/probe-polyphonic-notes-onnx.py만 추가한다. 코드에 원문6개 hash를 고정하고 최대10초·새 output만 허용한다. thresholds/time correction 변경·실제 음원 shift/transpose 없음.

CSD 수동9note/실제3.9초는8predictions 중6개만 onset50ms/pitch0.5semitone 일대일 matching에 맞았다. annotation0/1/6과 prediction0/1은 불일치, 마지막 annotation은 crop 밖까지 이어져 offset matching에 쓰지 않았다. 첫 pitch58 vs annotated59, 두 번째 onset 약97ms 차이 및 같은 pitch가 합쳐진 구간을 그대로 보존한다. 유지 도구의 별도 fresh process8nativeNotes는 이전 시험과 exact였다. 해당 diagnostic tolerance는 음악 승인 기준이 아니다.

원곡 반주 SHA256e4a4f50f40b178d53c491b77aa6ebcd8533d74367bc28f6b02f67dc1431dbbfe의31.7–39.7초에서68note candidates를 관측했다. 기존 CQT와 동일7음절 spans로 대조하면 ‘도/함’은 G/D/B 관측이 G major 후보와 겹쳤으나 마지막 ‘요’는 D/F#가 두드러지는 반면 기존 CQT top은 G major였다. duration×activation은 확률/화음 정확도가 아니다. 공식 모델은 단일 악기에서 가장 잘 동작하므로 혼합 반주·전이 구간에서 전체 chord/key나2–4Part를 확정하지 않는다. comparison SHA2567122b7ef773f184e00e5a8ea0f45c84f482987ebbe347e723b01396010c3211c, score/harmony/catalog approval=false.

처음 official source 읽기의 cp949 UnicodeDecodeError는 모델 추론 전에 발생/로그 보존했고 실제 UTF-8 명시 후 동일 입력은 성공했다. 비교 스크립트도 한글 JSON 읽기에서 같은 인코딩 오류가 발생하여 UTF-8 명시로 수정했다. CSD/backing/maintained guard는 exit0/중단false, wall3.608/3.657/3.636초·free최소9.258/9.295/9.297GiB·owned peak0.199/0.202/0.201GiB. 현재 background model 없음. 가사·진입 시각·실제 음역·화성·2–4Part·권한/청취 gate, 디자인 보류 및 실제 서버3파일 제외 유지.
### R1 마이크 종료와 분석 실패의 길이 보존 / R6 구간 대조 — 2026-10-12

production에서 native 마이크 종료 뒤 decoder 실패를 함께 주입하면 실제 녹음 약1.36초의 Draft duration이0으로 저장되는 결함을 재현했다. 현재 recorder/수집 배열이 소유 일치하는 native stop에서 활성 구간 시간을 누적하고 pause/수동 Stop/cancel에서는 이미 마친 시간을 중복 누적하지 않는다. 종료 후 분석의 fallback 길이를 미리 보존한다. 원본 Blob/분석값·제출 정책/UX/디자인 변경 없음. 분석 실패를 실제 특징 수치로 채우지 않는다.

build34modules와 Node audio foundation 통과. 기존 유지 ended-recording QA를 정상·decoder failure·paused decoder failure3조건으로 확대해 원본/Review/Draft 복원 hash exact·chunks 반환·종료 후700ms 기다림/paused700ms 제외 및 저장 길이 확인/pageerror0을 통과했다. 기존 native recorder session의 중복 시작/정지·timer, discarded chunk 소유권, Voice Sample 정상/취소·원본 보존 회귀도 통과. 가짜 마이크/주입한 decoder 오류이며 물리 종료/모바일/청취 인수는 미완료다. 보류 서버3파일은 이번 stage에서 제외한다.

R6 linear noteCurves는 기존 synthetic 입력 ‘도’64→66의 실제13/13confident frames에서64.1→65.9를 관측, Whisper Small exact1.0. output81915e9716101e671b0c66964ebc5bbb745d3aa80bf28c92efc75f90e7dd6fc4·추론0.605초/GPU422625280bytes. guard 순차 exit0/중단false, 생성/측정/ASR free 최소8.549/9.265/6.998GiB·owned0.980/0.244/2.568GiB. synthetic 제어 검증을 원곡 score로 간주하지 않는다.

동일 원곡·동일 구간의 실제 MMS token span과 seed0 GAME 후보를 대조했다(derived JSON SHA256613f48fe1cd0eb6e90f802fc7a42d148d4b4bc9cb818cf3faaf9cecac9287bbe). 7음절씩 opening/middle에서 다음 음절 시작까지의 구간은4/5개가 복수 note segment와 겹치며4/3개는 휴지도 포함했다. 같은 pitch의 별도 segment도 있으므로 이 수를 실제 melisma 수로 표시하지 않는다. 예를 들어 middle ‘도’ phonetic end 이후 다음 onset까지1.3233초가 있으나 약0.6403초 rest가 포함된다. 한 음절의 CTC 끝→다음 시작 전체를 sung-note 길이로 쓰지 않는다. assignedNote=null/durationApproved=false, 임의 단일 MIDI·가사 Guide 등록 없음. sourceWindow 끝까지의 마지막2.7072/2.4261초 gap도 다음 음절 간 gap과 구분한다. GAME middle seed0 guard exit0·4.844초/free9.272GiB/owned0.296GiB. 원곡 화성/실제2–4Part·상업권한/청취 gate 유지.

앞선0484488d0781aa109a8156065cb04f6432649758 Git Integration7001037815 success, production HTTP200/index-U1LmFjMk.js SHA2563416E3B50EC85C012FC8DE8447A793BB516BFEB42BEA95D856DF2ED09A89FED0은 앞서 검증된 동일 앱 build hash와 일치. 새 R1 build로 이전 local 파일이 대체된 뒤의 원격 관측이며 현재 local asset exact 주장과 구분한다.

### R6 저음 실패의 단계 분리 — 2026-10-12

고정9beec10 공식 meldataset/Pattern_Generator 원문을 읽고 기존 vocoder에 실제 원곡16–23.5초 mel을 입력했다. 공식 source peak0.95 전처리 gain2.781017을 연구 입력에만 적용/기록했다. 원곡/vocoder hash는 유지하고 output aae6d437a267d47977510d1e4cd540455e387bd1bff37272ad0de1f5ee37cdb7·7.488435초를 별도 보존했다. 실제7voiced 구간 source-vocoder F0 중앙값 차이0~0.2반음, 첫 MIDI55.3→55.35로 저음 복원이 관측됐다. vocoder만의 저음 지원 실패라는 설명은 이 사례에서 지지되지 않지만 전체 음질·화음 승인은 아니다.

첫 로딩은 한글 filename의 RuntimeError: open file failed because of errno42 on fopen: Illegal byte sequence로 exit1이었다. 실패 로그를 유지하고 기존 유지 generator와 같은 binary stream torch.jit.load로 수정한 동일 시험은 exit0·추론0.866초/GPU193399296bytes였다. guard free 최소8.625GiB/owned0.954GiB, pitch 검사 exit0·12.170초/free9.315GiB/owned0.245GiB. 공식 mel STFT의 deprecated return_complex=False 경고도 보존한다. 새 환경/모델 설치·원곡 교체 없음.

기존 실패 score/seed/input을 변경하지 않고 linear/diffusion mel[1,80,470]을 관찰했다. 최종 실패 PCM6d88ec9f…는 exact 재현됐다. 중간 linear-only32defb58c9dc5a56660aab75b0ca4334ea0bfb7a0f236cc4824f1988fac0701a는 실제7음절 F0 모두13/14/26/14/24/12/16 frames를 관측(마지막−0.5반음, 나머지−0.1~+0.05반음), Whisper Small exact1.0이었다. 중간 관찰 보고서의 일부 inference/peak 필드는 부모 diffusion metadata를 상속했으므로 해당 수치로 linear 성능을 판단하지 않는다.

유지 probe-korean-score-synthesis에 선택적 --generation-stage linear 진단을 추가했다. 기본 diffusion/50step은 기존6d88ec9f… exact 유지, linear는 실제 native encoder 예측+같은 vocoder이고 steps=null/diffusionExecuted=false로 구분한다. 유지 결과 bf8abd154c19d27dde9bff87a44989a615cee988c21b64d9afb199585907aa5b·5.456708초/추론0.610초/GPU396221952bytes. 중간 관찰본과523844 PCM sample 중566개가 최대1int16 단위 달라 hash exact는 실패했다. 새 PCM을 다시 F0/ASR 측정해 같은7음절 관측과 exact1.0을 확인했으며 이전 결과 재사용으로 대체하지 않았다. generation-stage invalid는 import 전 거부. guard exit0/중단false, linear free8.623GiB/owned0.963GiB·ASR free6.907GiB/owned2.568GiB. 물리 청취·원곡 실제 timing/score·화성/2–4Part·권한 검증 전 intermediate를 최종 품질 대체로 승인하거나 catalog에 등록하지 않는다.

앞선34255b9f23f387cc6d5839679a7d6582a724e794 main/origin 일치, Git Integration7000903157 success. production HTTP200/index-U1LmFjMk.js SHA2563416E3B50EC85C012FC8DE8447A793BB516BFEB42BEA95D856DF2ED09A89FED0 local exact. 앱 변경 없이 음악 연구 도구/문서만 추가하는 범위다.

### R6 분석 난수 원인과 실행 seed 검증 — 2026-10-12

기존 pinned ONNX graph를 [공식 protobuf schema](https://raw.githubusercontent.com/onnx/onnx/main/onnx/onnx.proto)의 Model.graph/Graph.node/Node.op_type·attribute로 읽었다. segmenter의 /RandomUniformLike는 dtype1만 있고 명시 seed가 없었다. 나머지4개 graph에는 조사한 random op가 없었다. 원본 model/hash를 변경하거나 새 onnx 패키지를 설치하지 않았다. 관측 원인 후보를 실제 graph로 확인한 것이며 모든 변동 원인을 배제한 것은 아니다.

유지 도구에 선택적 --seed를 추가해 [공식 ONNX Runtime set_seed](https://onnxruntime.ai/docs/api/python/api_summary.html)를 session 생성 전에 적용하고 결과에 seed/scope를 기록한다. 미지정 경로는 기존대로 유지한다. 음질에 맞는 seed를 탐색하지 않고 첫 검증값0 하나만 사용했다. 동일 원곡16–23.5초·모델/버전/threshold를 두 별도 프로세스에서 실행한10segments/notes 전체가 exact 일치했다. 추론1.307/1.284초, guard exit0/중단false·wall4.852/4.849초·free 최소9.316/9.315GiB·owned peak0.282GiB. 음수seed는 numpy/모델 import 전에 거부하며 output 생성 없음. 새 환경/대형 GPU/원본 변경 없음. 재현성 사례가 가사 경계/화음/청취 정확도를 뜻하지 않으며 이전 seed 없는 실패와 모든 sourceScore/Part/catalog 승인false를 유지한다.

앞선084ffab2756794025e0cf0f27b92231ccf1260d6 main/origin 일치, Git Integration7000854712 success. production HTTP200/index-U1LmFjMk.js SHA2563416E3B50EC85C012FC8DE8447A793BB516BFEB42BEA95D856DF2ED09A89FED0 local exact. Python 연구 도구/문서만 변경되어 앱 asset은 그대로였다.

### R6 경량 가창 음표 추출 / R1 Production 확인 — 2026-10-12

R1 845d37dcb373f63cc6286f837259b8af58b72805 main/origin 일치, Git Integration Production7000665875 success. production HTTP200/index-U1LmFjMk.js SHA2563416E3B50EC85C012FC8DE8447A793BB516BFEB42BEA95D856DF2ED09A89FED0 local exact. 실제 production 이전 recorder 지연 chunk 분리·새 Review 원본 exact 및 ended-mic 원본/Draft 복원 모두 통과.

[GAME 공식 release](https://github.com/openvpi/GAME/releases/tag/v1.0.3)의 small ONNX45676364bytes만 스트리밍/공식 digest 확인했다. SHA25600ba0c64115b6b874d9ea4afd3e6cf822abda2a04e52569233b0a044fd40e4e8. [weight1.0 release](https://github.com/openvpi/GAME/releases/tag/v1.0.0)는 CC-BY-NC-SA4.0이며 code MIT와 구분한다. 공개 native map에 Korean은 없으므로 공식 unset/universal language0 연구로만 실행했다. poralis/copycat 및 svsv3 원본 HF는 실제401 Unauthorized라 weights/현재 조건을 확인하지 못했고 채택하지 않았다. 공식 GitHub Copycat 코드는 비상업/별도 vocoder 조건을 안내한다. 새로운 상업 AI/서비스 선택 없음.

유지 qa/probe-singing-notes-onnx.py는 고정6파일 SHA/config·실제 입력10초·새 output 경로를 확인한다. 기존 ONNXRuntime1.30.0 CPUExecutionProvider/2intra·1inter threads, 공식 ONNX 추천 boundary0.2(별도 PyTorch schema 기본0.3과 구분)/presence0.2/radius2/8step t0=0을 명시했고 결과에 맞춰 조정하지 않았다. 실제 source/config/pinned 원문 f4239345f0fed21890d362c74a35fd857724aa82·WAV/JSON/모델은 repo 밖 runtime에 보존한다. numpy/모델 import 전11초/NaN 입력 거부도 확인.

실제 CSD3.9초 수동 annotation은 끝의 partial note까지9개, 모델 voiced8개였다. 원문 schema의50ms/0.5반음 matching 허용 범위로8개를1대1 대응했고 첫 두 동일 pitch 음절을1note로 합쳐 한 경계가 누락됐다. 나머지 대응 onset 차이 절대값 최대20.8ms, pitch 차이 약−0.123~+0.150반음이며 첫 merged end 차이246.2ms는 보존한다. 이후 최종 도구에서 CSD 관측 notes exact 반복을 확인했지만 전체 정확도/모든 입력 재현성을 보장한 것은 아니다.

원곡31.7–39.7초의 실제 음표 후보는 첫55·59·60.35→62와 중간 휴지/57→59·58.57→60·57을 구분했다. 첫16–23.5초는7voiced notes/55.13·58.99·62.03·57.03·57.02·54.98·55.05를 관측했다. 언어0·원곡 분리 오차/가사 consonant onset와 sung-note onset 차이·모델 누락은 미확정이며 확정 score/가사 Guide로 등록하지 않는다. inference CSD0.594초/원곡1.527·1.472초. guard exit0·중단false,3.655/4.863/4.840초, free 최소9.380/9.299/9.302GiB·owned peak0.209/0.307/0.295GiB. 대형 GPU/새 환경 설치 없음. 원곡 음역55의 기존 생성 실패/화음/2–4Part·청취·상업권한 gate는 유지한다.

원곡 opening 최종 도구 재실행에서는 전체 segment9→10, voiced7은 유지됐지만19.19–19.39초의200ms 휴지가 추가되고 앞선62note 끝이200ms 빨라졌다. 동일 voiced onset 대응 MIDI 차이 최대0.00855반음도 관측됐다. 동일 입력/버전의 exact 결과 재현은 실패이며 CSD의 exact 관측을 전체 입력으로 확대하지 않는다. 최종 실행1.365초·guard free 최소9.305GiB/owned peak0.292GiB. 두 결과를 보존하고 원인 확인 전 확정 악보/Guide로 사용하지 않는다.

### R1 이전 녹음기의 지연 chunk 소유권 — 2026-10-12

production에서 첫 Take를 취소/다시 시작한 뒤 이전 recorder의 실제 첫 chunk를 늦은 callback으로 전달했을 때 새 Take chunks가1→2로 증가하는 결함을 재현했다. recorder별 수집 배열을 보존하고 현재 recorder와 현재 배열이 모두 소유 일치할 때만 dataavailable bytes를 추가한다. 취소/확정 뒤 배열을 반환한 이전 요청은 새 Take에 쓸 수 없다. 원본/임시본/녹음·제출 UX와 디자인 변경 없음.

build34modules/Node audio foundation 및 새 native chunk-ownership QA의 이전 이벤트 무시·새 Take Review bytes SHA256 exact·pageerror0 통과. 기존 ended-mic 원본 Review/Draft 복원, recorder-session 중복 시작/정지·타이머, Profile sample-lifecycle 취소/메타데이터·원본 보존도 통과. 주입한 지연 callback/fake mic 경계이며 물리 기기 event latency·청취는 미검증이다. 검증된 묶음만 main push→Git Integration→production을 수행하며 서버 보류3파일 유지/제외.

R2 앞선 a9570af03f2265ace4c812d3733e93f8cfedb68a main/origin 일치, Production7000594872 success. production HTTP200/JS index-Dpc0XI7d.js SHA256ABA58CBF04E5C69D2927D8284B9177FB09D3C147346C16A5A5005DAD54EF1E00 및 실제 캐시 read/write/invalid3조건·Collection scroll/복귀 회귀 통과. 다음 build 생성으로 이전 local asset은 대체되어 이번 기록은 remote 관측/검증 build 파일명 일치이며 SHA256 local exact 주장이 아니다.

### R2 선택적 탐색 캐시 실패 보호 — 2026-10-12

production의 격리 sessionStorage.getItem 실패에서 Collection 진입 pageerror 'QA session cache read blocked'를 재현했다. Detail Part/Collection 탭/My Projects 필터의 선택적 hint 읽기·쓰기를 보호하고 잘못된 탭/필터 값은 기존 기본값으로 처리한다. React의 현재 선택/원본 DB·참여·저장 상태는 유지한다. 영구 저장 실패를 숨기거나 새 정책/화면/디자인을 추가하지 않는다.

build34modules 및 native read/write/invalid3조건에서 Collection→곡 상세→Back→Projects 필터/초기화, 참여/Track수/저장수 보존/pageerror0 통과. 기존 Collection의 탭별 scroll/복귀·저장 해제 독립성, 2/3/4 Part 생성·0Track/reload도 통과했다. 처음 QA는 기존 버튼 식별자가 folder인데 projects로 작성해 Timeout30000ms였으며 QA만 교정했다. 초기 npm preview 인자 전달/격리 호스트 연결 오류도 같은 Vite preview 인자/호스트로 교정했고 앱을 변경하지 않았다. main/Git Integration/production은 해당 묶음 push 후 확인한다. 보류 서버3파일 유지/제외.

앞선5390ed18ebf7c0398d4c86208ec0fa0939b84155 main/origin 일치, Production7000476012 success. production HTTP200/index-BjQow-cq.js SHA25681E7A7781CF70D02D7C4E7BF7C3A29AAF293981DDC30217B9A8F9F158D3FA972 local exact. production 종료 원본 Review/Draft/hash·chunks 반환 및 시작 실패4조건 통과.

R6 수동 annotation 교정: 공식 CSD1.1 kr001a WAV/CSV/MIDI를 HTTP206 제한 Range로 총6247488bytes만 읽고 CRC/SHA를 보존했다(전체1851131390bytes 미수신). WAV ff301c73beb65da32a623a5c9628567c001e862f4ff954f821182a61d685254a, CSV dbfb596abc5ceeddac0f054ad769a427329335aa4465f0ccb0869b120feee508. 원본 lyric108자=CSV108행; 첫8음절은 원본 파일에서 직접 읽었다. 첫 수동 입력의 7번째 문자 오타는 별도 결과로 보존/비교에서 제외했다. 정확한 annotation 입력의 MMS onset 절대차 평균0.057591/최대0.137437초. phonetic end는 note offset보다 최대약0.378초 이르므로 지속 음표 길이로 사용하지 않는다.

실제3.9초 가창 pYIN1024/1536 비교에서 대부분 note 중앙값은 annotation 대비−0.2~+0.2반음이지만 첫 짧은 음절은−1.3/−1.2반음(4/5frames), 7번째는0/null 및2frames다. 수동 score target과 실제 발성/추정의 차이를 구분하며 관측을 채우거나 전체 도구 정확도로 일반화하지 않는다. 정렬/F0 guard exit0·중단false,12.104/8.617초·free 최소8.772/9.257GiB·owned peak0.864/0.235GiB. 데이터·출력은 연구 runtime/Git 밖, 비상업 데이터·model license 유지, 앱 등록/원곡 timing·화음 승인false.

### R1 마이크 종료 뒤 원본 Review/Draft 보존 — 2026-10-12

production의 격리 native recorder에서 마이크 track 종료 후 inactive/chunks 보유 상태를 확인했다. 기존 Stop은 null을 반환하여 Review 진입 Timeout5000ms가 발생했다. 수집 원본이 있으면 기존 Stop으로 확정하고 inactive recorder에 stop을 다시 호출하지 않는다. Blob 확정 뒤 중복 encoded chunk 참조만 반환한다. 제품/시각/자동 제출 정책 변경 없음.

build34modules, Node audio foundation, 기존 native recorder-session/sample-lifecycle 통과. 유지 verify-ended-recording-preservation에서 수집 SHA256=Review bytes=Workspace 이탈/재진입 Draft bytes, chunks0/pageerror0 확인. 시작 오류 QA는 Guide schedule까지4조건의 track ended/stream null/Guide 정리/새 마이크 재시도/Review를 확인했다. fake stream 오류 주입이며 물리 단선·청취 인수가 아니다. 이번 Git Integration/production은 push 후 기록한다. 서버 보류3파일 유지/제외.

직전 df6160b11281132c98b0e367d315f8a7e6cb13a5 main/origin 일치, Production7000222988 success. production HTTP200/index-xzCShQmC.js SHA2563FDC1CEDEEBFD3AF6053AD45B6B8A515D334336C1A2A34A1B35D717F7A246419 local exact 및 시작 오류4조건 통과.

R6 첫 원곡 구절: MMS crop16–23.5/17–22.5초 “천천히 걸어가요” onset 후보 최대 차이0.020132초. 실제 인접 onset F0 중앙값 약55/59/62/57/57/55/55. 미승인 후보의 DiffSinger 진단은 ASR exact1.0이나 ‘가’pitch0/null, ‘요’55요청→53관측으로 실패/미채택이다. WAV SHA2566d88ec9ffbe4b0e4dac1095ec075af7cc6a8bfddad0cdd91b0ff721846c4e43b, inference1.154초/GPU395500032bytes. 생성/측정/ASR guard exit0·중단false/free 최소8.351/9.379/7.001GiB. 원본/실패 evidence 보존, sourceScore/harmony/catalog 승인false.

[공식 CSD1.1](https://zenodo.org/records/4916302)은 수동 미세 조정 note/음절 onset·offset CSV/WAV/MIDI와 CC-BY-NC-SA4.0 안내를 제공한다. [DiffSingerKR 저자 코드](https://github.com/CODEJIN/DiffSingerKR) MIT를 학습 데이터/weight 상업 사용 승인으로 확대하지 않는다. 다음 독립 검증은 공개 수동 annotation 대비 정렬 오차 측정이다. 합성 요청 시각을 acoustic ground truth로 사용하지 않는다. 전체1.9GB corpus 다운로드/앱 등록 없음.

### R1 녹음 시작 실패의 마이크 소유권 반환 — 2026-10-12

production에서 MediaRecorder constructor 실패 뒤 실제 획득 stream의 track.readyState가 live인 것을 재현했다(false != true). start 실패와 새 requestMicrophone의 AudioContext.resume 실패도 확인했으며 후자는 첫 수정 전 같은 assertion 실패였다. 기존 stream/세션 소유권과 generation을 검사하여 실패한 시작 요청의 recorder/RAF/Guide/마이크만 정리하고 최초 오류를 그대로 반환한다. 다른 시작 요청·기존 Take/URL/DB는 삭제하지 않는다. 제품/시각/권한 UX는 기존 경로를 유지한다.

build34modules/Node audio foundation 통과. 새 유지 verify-recorder-start-failure.mjs의 native constructor/start/context-resume3조건 모두 획득 track ended·runtime.stream null·허위 Review 없음·새 microphone2번째 요청·재시도 Review URL/pageerror0 확인. 기존 native recorder-session의 중복 시작/정지·mic1·타이머1·Review와 sample-lifecycle의 취소/Take/metadata 보존·타이머 정리도 통과했다. qa:record-errors에 유지 검증 연결. 격리 fake microphone/주입 오류이며 실기기 마이크/전체PC RAM 절감/청취 인수는 미검증이다. 서버 보류3파일 유지/제외, Git Integration/production은 push 후 확인한다.

R6 앞선 c454bc2de759838d526c4f5ae1409fd9427514bd main 자동배포 Production7000164817 success/production HTTP200/앱 asset index-P4gBmfM9.js 유지 확인. 선택적인 noteCurves는 기술 진단에만 있고 앱 음원/catalog에 등록하지 않았다.

### R6 한 음절 내 음표 변화 제어 — 2026-10-12

실제 source의 한 음절 내 F0 변화를 중앙값 한 음으로 축소하지 않기 위해 기존 pinned DiffSingerKR encoder의 프레임별 note embedding 입력을 사용한 선택 noteCurves 진단을 추가했다. 저자 token/phoneme/duration 변환을 유지하고 모델에 전달하는 expanded note만 명시한 사건으로 바꾼다. 출력 transpose/splicing/가사 반복 없음. offset0·순서·유한값·정수/index·segment 범위·프레임 양자화 중복을 모델 생성 전 검사하며 잘못된 first-offset/unordered/NaN/bool-note4건은 system Python에서 numerical/model import 전 거부했다. 기존 기본 input/seed와 output은 보존한다.

실제7초 synthetic score의 '도'에 index76→78 / expected MIDI64→66을 요청했다. 실제 frame189–215·215–241,2.19429–2.49615·2.49615–2.79800초로 양자화됐다. 실제 pYIN>=.75/각구간 양끝80ms 제외에서13/13frames·MIDI64.2/66.0·오차+0.2/0반음을 관측했다. 측정기는 변화 음절 전체의 단일 expectedMidi/difference를null로 분리하고 음표 사건별 실제 관측을 기록한다. WAV SHA256cd597da95de36d139dc44e85ac877b44e0fa6feafd5c308e2ea59f9da68a93a6, 추론1.30905초/GPU421700608bytes, Small ASR normalizedLyricsExact=true/textSimilarity1.0이다. independent diagnostic이며 원곡 score·화음·듣기·checkpoint 사용 권한을 승인하지 않는다.

생성/측정/ASR guard exit0·중단false·7.291/7.323/21.834초, free minimum8.50680/9.45198/7.08207GiB 및 child peak1.23540/0.24309/2.56416GiB. 새 선택 입력 미지정 default 실제 재생성은 이전 WAV SHA25674b7053a89a8c9bcd4ec03954c0dddacf9361c6eb6463bc44afe147141fb1e5f와exact이며 free8.51788GiB/child1.24060GiB/guard7.335초·exit0. 기존 default의 새 측정도 별도 경로에서 구간·null/입력 의미를 보존한다. 원곡 두 번째8.5초 인접 onset F0도 두 해상도로 실제 측정했으며 미승인 시작/휴지/여러 음 조건을 유지한다(guard13.526초/free9.41016GiB/child0.25035GiB). 모든 원본·WAV·JSON·monitor는 repo 밖 runtime 보존. 앱 음원/catalog/Track·그래픽 변경 없음.

R1 직전8a5c6e1d2b96d3dcfdca71640dde34e31edf9075 main/origin 일치, Git Integration Production7000070959 success. production HTTP200/JS index-P4gBmfM9.js SHA256513F0F3D7F39D0E0894EF0BB37C1BD12D0772BCAC67E6F2A3DABD9870B310586 local exact. 실제 production Review 경쟁 원본 hash/제출수3/reload 및 missing-analysis2/3/4/main Mix/native PCM 복원 모두 통과. 보류 서버3파일 유지.

### R1 경쟁 제출 및 분석 없는 원본 복원 — 2026-10-12

Review에 진입한 뒤 다른 탭에서 같은 Part 원본을 먼저 확정하면 현재 화면이 workspace로만 돌아가 제출수/Track을 반영하지 않던 경로를 실제 production에서 Timeout5000ms로 재현했다. 별도 사전 조회/조기 반환을 없애고 기존 원자적 saveSubmittedTrack이 반환한 최초 원본을 공통 상태 반영/재생 경로에 연결한다. 이어 null features 원본이 재접속 목록에서 제외되어 Timeout30000ms였던 실제 경로를 확인하고 메인/새 Project의 features 필터만 제거했다. 기존 refreshTrackAnalysis가 실제 저장 PCM을 분석하며 원본을 임의 수치로 채우지 않는다. 새 UX/디자인/서비스 정책 변경 없음.

build34modules 및 제출 계약/graphics 분리/재녹음 보존 통과. 유지 verify-submission-atomic의 native React Review 경쟁에서 최초 원본 SHA256 재생 동일/제출수3/재접속3/pageerror0 확인. 기존 zero-graphics 2/3/4/main Auto Mix QA와 새 missing-analysis 모드의 같은4조건도 실제 PCM 분석→제출수/seed/저장 Mix/reload 통과. 격리 fixture/합성 음성 검사이며 다중 사용자 서버·물리 마이크·청취 인수는 아니다. 보류 서버3파일은 이 묶음에서 제외한다. Git Integration/production은 push 후 확인한다.

### R6 음절·음표·반주 근거 분리 — 2026-10-12

실제 원곡 vocal/backing hash를 보존하며 별도 runtime에서 pYIN1024/128·1536/128 분석을 순차 실행했다. 기존 짧은 phonetic span의 첫 '오'는 두 조건 모두0/null 그대로다. 인접 음절 onset까지의 별도 후보 구간에서는7/11 confident frames 및 MIDI55를 관측했다. '도'는 MIDI60 약0.070/0.087초와 MIDI62 약0.598/0.615초의 연속 frame support가 있어 음절 중앙값 하나를 악보로 사용할 수 없다. '함/께'에서도 변화가 관측됐다. frame support·반올림 pitch run·40ms 표시 필터는 실제 음표 onset/end/지속 승인으로 간주하지 않는다. 이전 null/실패 결과를 수정하지 않았다.

반주는 같은 실제8초 PCM을 STFT chroma24triad 및 HPSS harmonic CQT36bins/octave로 대조했다. 대체로 D/G root 후보가 같지만 '늘'은 STFT Eminor/Cmajor/Gmajor와 CQT Gmajor/Gminor가 근접하며, major/minor 구분 여유도 일부 작다. 일곱째/sus/전위·보이스리딩을 커버하지 않는 간단 후보라 화음 확정/Part 생성 입력으로 채택하지 않는다. 각 순차 child exit0/resourceStopped=false: F0해상도13.443초·STFT3.636초·CQT9.694초·인접구간F013.416초. 앞3작업 freeRAM 표본9.497/9.599/9.556GiB, child 표본 약0.24GiB 이하. 마지막 확인 PCfree9.78GiB였다. 원본/JSON/scripts/guard 로그는 repo 밖 runtime에 보존하며 sourceScore/harmony/catalog 승인false 유지.

선행 alignment 도구 aef843746c75944fe1726a3638b14a4a96e46906: main/origin 일치, Git Integration6999876147 success, production HTTP200/JS index-CgOHNiJG.js SHA256D979022C12D178073060E2822695CF990F24B41B91362D371D6CACEDF145CDFC local exact 확인. 다음 R6은 지속/다음 음절 구간을 구분한 실제 melody 근거와 원곡 화성 검증이며 중앙값/장르 preset/임의 transpose로 gate를 대체하지 않는다.

추가 실제 구절: 같은 원곡50.0–58.5초의 “우리 함께 불러요”7음절 후보는55.03184/55.17217/55.37264/55.81368/56.83608/57.29717/58.01887초, 정답/오답 평균 path score0.32430/0.10871이다. ‘러’는0.02907로 낮아 미확정이며 원곡 전체로 일반화하지 않는다. child exit0/resourceStopped=false/13.305초, GPU allocation1433041920bytes. script의 expected score/hash 검사는 모델 생성 전으로 옮겼으며 최종 script로 실제 두 번째 원곡 구절을 검증했다. 새 생성·Part/catalog 연결은 수행하지 않았다.

### R6 다국어 음절 강제 정렬 후보 실제 검증 — 2026-10-12

기존 Whisper BPE/한국어 speech CTC 실패를 반복하지 않고 [PyTorch MMS_FA 공식 정렬](https://docs.pytorch.org/audio/2.8/tutorials/forced_alignment_for_multilingual_data_tutorial.html)의 uroman/CTC 경로를 별도 진단했다. 기존 GPU torch2.8.0+cu126/Python3.13.5를 보존하고 runtime/mms-deps에 공식 torchaudio2.8.0+cu126·uroman1.3.1만 target 설치했다. pip는 uroman1.3.1이 문서 업데이트 이유로 yanked임을 경고했으며 기존 설치·로그를 보존했다. 공식 checkpoint1262047414bytes/SHA25620ef12963ab4924bef49ac4fc7f58ad5da2ee43b2c11bc8c853c9b90ecdbc680를 스트리밍 받아 별도 runtime에 보존했다. CC-BY-NC4.0이며 상업적 앱 연결은 승인되지 않았다. 새 UI/전체 라이브러리/기존 환경 변경 없음.

유지 qa/probe-korean-syllable-alignment.py: 입력10초 제한·고정 checksum/버전·weights_only+mmap/meta load·저자 normalize/log_softmax·한국어 음절별 uroman·정답/오답 동일 emission 정렬·출처 hash/nullable 결과·승인false를 기록한다. 라이브러리의 forced_align은2.8 deprecated/2.9 제거 경고가 있어 버전을 pin하며 앱 의존성으로 넣지 않는다. 각 실행은 기존 live RAM guard로 순차 진행했다.

기존7초 “오늘도 함께해요”의 시작 후보는 요청 score 대비−0.0756~+0.0814초, 정답/오답 평균 path score0.20420/0.04197. 다른7초 “우리 함께 불러요”는−0.11645~+0.06140초 및0.38904/0.12504다. 요청 score는 실제 acoustic ground truth가 아니며 path score는 보정된 정확도 확률이 아니다. 틀린 가사도 결과가 나오는 것을 명시적으로 확인했다.

실제 기존 원곡 vocal hash b2f4d47811276a4254fa17c694395e7ddb10b30df853c6c31070ac229b9dcd25의31.7–39.7초에서7음절 시작 후보34.0258/34.1662/34.3667/35.8103/36.0709/36.7927/37.1536초, 정답/오답0.57590/0.05042다.33.3–38.5초 crop 비교의 최대 시작 차이0.01704초였다. 기존 confident pYIN frames와 대조한 ‘오’는0/null, 나머지는11/6/10/11/4/11frames 및58.9/60.25/57.0/58.9/57.0/57.1 MIDI다. 짧은 phonetic span을 완전한 음표 길이로 사용하지 않으며 null을 채우지 않는다.

4실행 실제 child exit0/resourceStopped=false, guard free minimum9.04476/8.04559/8.40606/8.08153GiB, child RAM peak0.85509/1.24717/1.08636/1.71706GiB. inference/관측 wall3.8–5.8초대·GPU allocation 약1.4GB. JSON/오답/monitor/원본은 repo 밖 runtime에 보존한다. 음절 onset 후보의 좁은 진전이며 sourceScoreVerified/syllableTimingApproved/harmonyApproved/catalogRegistrationApproved=false 유지. 다음은 다른 실제 구절·crop 안정성·원곡 음표 지속 길이/화성 근거를 확보하는 검증이며 지금 자료를 확정 Part나 승인된 가사 Guide로 연결하지 않는다.

최종 배포 기록: 118b9933b9f42bf446955f21eac74f0e31a9d9ad main/origin 일치, Git Integration6999701358 success. production HTTP200/JS index-CgOHNiJG.js SHA256D979022C12D178073060E2822695CF990F24B41B91362D371D6CACEDF145CDFC local exact. 수정된 recorder-session/legacy draft owner3종 QA 모두 production 통과. 작업 후 free RAM9.82GiB/Python worker 없음. 작은 증거 전용 commit은 만들지 않고 다음 의미 있는 묶음까지 기록 보존.

R6 추가 원본 조사: PyTorch 공식 다국어 강제 정렬 문서(https://docs.pytorch.org/audio/2.8/tutorials/forced_alignment_for_multilingual_data_tutorial.html)는 비라틴 문자의 romanization/segmentation을 전제로 한다. MMS_FA 모델의 공식 라이선스 안내는 CC-BY-NC4.0(https://docs.pytorch.org/audio/2.4.0/generated/torchaudio.pipelines.MMS_FA.html). LyricsSync 저자 README(https://github.com/elecpure2/LyricsSync)는 MMS/uroman 및 수동 교정을 사용한다. 문서 설명을 가창 성능 검증이나 상업 사용 승인으로 간주하지 않는다. 기존 GPU Python metadata 조회는 torchaudio PackageNotFoundError, 해당 pipeline source 경로도 없음으로 확인했다. 환경 변경/새 대형 모델 다운로드/원문 강제 정렬의 자동 승인은 실행하지 않았다. 다음 후보를 사용할 경우 기존 정확한 synthetic score의 알려진 경계와 틀린 transcript 대조에서 실패 감지/경계 오차부터 검증해야 하며, 원곡의 확정 음절 타이밍이나 화음 승인으로 바꾸지 않는다. 현재 노출된 Notion/figma-desktop 도구는 없으며 Source of Truth 웹 UI 우회 없음.

Production: f77b337ef9250eb57dedfc67fec4b3d6aa1987bd/Git Integration6999654843, JS index-CgOHNiJG.js SHA256D979022C12D178073060E2822695CF990F24B41B91362D371D6CACEDF145CDFC local exact. Recorder QA의 async Draft 준비 전 click/legacy QA의 환경 URL에서 workspace query 누락으로 각각 record-pause/record-part timeout이 발생했다. 준비 완료 대기와 명시 workspace query만 테스트에 반영했으며 동일 production recorder session/legacy owner3종 모두 통과했다. 앱을 QA에 맞춰 되돌리지 않았다. 다음 묶음에 유지 QA 수정과 실제 증거를 포함한다.

### R6 잘못된 score 입력의 모델 로딩 전 거부 — 2026-10-12

유지 probe-korean-score-synthesis.py의 가사·음표·길이·10초 제한 및 새 output 경로 검사를 numpy/torch import와 모델 생성/weights/CUDA 전에 이동했다. 공식 config의 Notes 한도 및 변환 token/frame 검증도 모델 생성 전에 확인한다. 기존 모델 수식·음원·seed/step·PCM 처리·환경은 유지한다. preflight의 진단 길이는 실제 입력 합계를 기록한다.

시스템 Python(음악 deps 없는 환경)에서11초/bool 음표/비한글 음절/NaN 길이4종 모두 AssertionError로 거부했고 dependency import/출력 생성 없음. Python 문법 통과. 기존 GPU 환경에서 live resource guard로7초 정상 score를 실제 생성: child exit0/resourceStopped=false,14.527초, inference1.233초, WAV SHA25674b7053a89a8c9bcd4ec03954c0dddacf9361c6eb6463bc44afe147141fb1e5f 기존 exact, GPU peak421700608bytes, child RAM peak1.20992GiB/free min8.61053GiB. 원본/새 결과·monitor는 repo 밖 기존 runtime에 보존한다. sourceSongConnected/catalogRegistrationApproved=false 유지하며 새로운 가사·화성·실기기/권한 승인으로 계산하지 않는다.

### R1/R2 녹음 세션 잔여 참조 정리 — 2026-10-12

cancelRecording이 세션 소유 decoded/recordingBlob/lastAnalysis/URL 문자열 참조를 반환하도록 보완한다. Review·Profile·저장 Track이 독립적으로 가진 Blob/재생 URL을 revoke하거나 삭제하지 않는다. 다른 사용자 legacy Draft는 소유권 확인 후에만 URL을 만들도록 순서를 고친다. 기존 녹음/Setup/Review/제출 UX와 데이터 스키마는 유지한다.

Node audio foundation에서 세션 정리 후 독립 Take URL fetch/원본 bytes 보존과 분석 참조 반환을 확인했다. 초기 Node fixture에 cancelAnimationFrame이 없어 ReferenceError였으며 테스트의 브라우저 API fixture만 보완했다. build34modules 통과. 전체 PC RAM 절감량이나 실기기 청취 성공으로 확대하지 않는다. native legacy Draft의 소유권/원본 보존(다른 사용자 URL0 포함), sample lifecycle의 취소/Take 보존, recorder session의 mic1/타이머1/Review 유지 QA 모두 통과했다. 자동배포/Production 검증은 배포 후 별도로 기록한다.

배포 검증: 547d0f53d2dbda15071e1e5b0f51b46d04b59189/Git Integration6999522815 success, production 사용자 상태 QA 통과, JS index-BC9oWAHl.js SHA256AD03B3D82B7C4291AAB6E6FEF7C087B0355E2A078F168BECC99259273D8F2CBD local exact. 후속 bc596f8dade199d4718c42c03bc086163cfb599b main/origin 일치, Git Integration6999585441, production HTTP200/index-C8LrTN9X.js SHA2561693F8E5B296AC8CD35910DF591A67A65C92235D3682758840B7FBD54A57AF3F local exact/native bootstrap failure·retry·owned URL 회수 및 원본/재생 보존 QA 통과. 마지막 자원 확인 RAM여유9.83GiB/Python worker없음. production 검증은 격리 browser이며 실기기·청취·전체 단계 완료가 아니다. 증거는 다음 의미 있는 변경 묶음까지 로컬 기록으로 보존한다.

### R1 복구 재시도 Blob URL 소유권 — 2026-10-12

후반 생성 Project 읽기 실패 전에 복구한 Track/Sample/Mix의 Blob URL이 재시도마다 남는 경로를 수정했다. bootstrap별 생성 URL만 추적하고 실패·취소·effect 종료 때 반환한다. 실패 뒤 진행 중인 비동기 분석도 새 URL을 만들지 못한다. 정상 복구 URL은 앱 수명 동안 유지하며 저장 Blob/파일·다른 녹음 URL은 삭제하지 않는다.

build 및 native bootstrap QA: 초기/후반 읽기 실패·반복 재시도에서 owned URL 전부 반환, 성공 뒤2개 live URL 실제 fetch 가능, 원본 hash 동일/write0/mic0 확인. user-state 복구 QA 회귀 통과. 첫 추가 QA는 parts가 빈 불완전 Project fixture로 렌더 id 오류/timeout하여 기존 Project 구조를 사용하도록 수정했다. 앱을 잘못된 fixture에 맞추지 않았다. 전체 PC RAM 절감량/실기기 청취를 측정한 것으로 표시하지 않는다.

## 2026-10-12 R1 사용자 상태 원본 및 진행 중 녹음 보존

src/App.jsx에서 사용자 상태 읽기 실패를 기본값 정상 복구와 구분했다. 실패 원본을 자동 저장으로 덮지 않고 DB 초기화/진입을 차단한다. 저장 quota/권한 실패는 catch로 화면과 녹음을 유지하며 최신 상태 저장 재시도를 제공한다. 기존 화면/스타일을 재사용하고 frame 크기는 유지한다.

build34modules/Node user-journey 통과. qa/verify-user-state-recovery.mjs 실제 실행 passed=true: 손상 JSON/shape 원본 유지, write0/DBopen0, 일시적 읽기 retry 복구, quota retry 중 Recorder 동일 mount/mic1/frame 동일 및 최신 상태 저장 확인. fake microphone/격리 Storage 근거이며 실기기 청취·전체 R1 완료·실제 서버 연결로 확대하지 않는다. 기존 server 미커밋3파일 보존/제외. Git Integration/production 검증은 배포 후 별도로 기록한다.

## 2026-10-12 음악 구성 기준 변경 — 옥상달빛 「수고했어, 오늘도」

사용자 지시에 따라 기존 docs/IMPLEMENTATION_PLAN_2026-10-07.md의 R6에 공동 가창 참고 기준을 반영했다. 구절·호흡·명확한 진입·실제 음역·2–4 Part 역할/결합·보컬/반주 균형을 기존 실제 AI 곡 검증에 연결한다. 기존 단계와 완료 증거는 보존했다. 참고곡의 실제 BPM·조성·화성·파트 분석 및 청취는 미검증이며, 앱 음원 변경·원곡 복제·catalog 등록을 실행한 것으로 기록하지 않는다. 다음 음악 작업은 해당 구성 기준을 적용할 실제 score/음절 타이밍·화성 근거 확보다.

## 2026-10-12 R1 앱 시작 데이터 복구 실패 / 재시도

App bootstrap이 저장 Track/Profile/생성 Project 읽기 또는 초기 asset 로딩 실패를 catch에서 tracksReady=true로 처리하던 경로를 수정했다. 복구 실패는 ready와 구분하고 기존 loading 영역에서 원본 보존 안내·읽기 재시도를 제공한다. 복구 완료 전 녹음·제출·자동 Mix·앱 탐색 진입을 막으며 새 IA/디자인 토큰/서버 정책은 추가하지 않는다. 정상 bootstrap·기존 저장 원본·대표 Sample·전역4탭은 재사용한다.

build34modules/기존 Node user-journey 통과. 유지 qa/verify-bootstrap-recovery.mjs 실제 native IndexedDB getAll 실패·반복 실패·재시도에서 앱 진입 차단, put0/mic0, 원본 record ID/kind/origin/Blob SHA256 exact·복구 후2Tracks 확인. 첫 QA는 참여하지 않은 Home에서 record-part 버튼을 기다려 timeout했으므로 실제 복구 공통 전역 nav를 확인하도록 바로잡았고 재실행 통과했다. 기존 draft-restoration 및 profile-editing native QA도 통과. isolated 렌더/DB 증거이며 실기기·청취·디자인 인수는 미검증이다. npm qa:drafts에 기존 도구와 함께 연결했다. 서버 미커밋3파일은 보존/제외.

f361caddbb1fbf46cf565b5b9333f9e847595e31 main/origin 일치, Git Integration6999154495 success/동일 commit 확인. production HTTP200/index-CplJ26cc.js SHA256700A7584A8FAA6F45044688907E5E263D1934D855A44E3A5CD066E48A6A4E61A 로컬 exact. production의 native bootstrap-recovery와 draft-restoration QA 모두 통과. 해당 QA preview session 종료, 실제 확인 시 Python worker 없음/여유 RAM10.51GiB. 이 배포 확인 기록은 다음 의미 있는 변경 묶음에 포함하기 위해 로컬 문서에 보존하며 추가 작은 commit은 만들지 않는다.


## 2026-10-12 R6 실제 원곡 음절 타이밍 선행 검증 — 미확정

기존 실제 원곡7ef11d5e7d574134154c7fddc3022654feec474ac5cba70ed24c606232ca0eb9/분리 vocal b2f4d47811276a4254fa17c694395e7ddb10b30df853c6c31070ac229b9dcd25의31.7–39.7초 구간에서 실제 ASR token timestamp와 pYIN frame을 추출했다. 첫 진단은 Whisper generate 반환 dict를 속성으로 읽어 AttributeError로 종료해 증거를 보존했다. 반환 형식 수정 후 실제 exit0/20.672초, 가사는 “오늘도 함께해요”지만 token은 “오늘도/함께/해요”로 여러 음절이 묶였다. sourceTime34.36/36.28/37.48초는 token 추정이며 임의 균등 분할하거나 음절 시작으로 승인하지 않는다. 실제 confident pitch frame261개/unknown frame null 보존.

일반 한국어 음성 CTC 후보 kresnik/wav2vec2-large-xlsr-korean을 공식 model card/API로 확인한 뒤 pinned629c9a3501c10ba128bf3fa1eebb12af3be03f61/safetensors1266747952bytes/SHA25629be111b9247cfc2c72f125c1b1f50021ecfded8f0d947bbfb7e31dc7f0ddd07/Apache2로 진단 runtime에만 준비했다. 최초 후보 jonatasgrosman URL API는 Invalid username or password, 부속 tokenizer.config 가정은 Entry not found였다. 기존 파일·실패 로그를 보존하고 실제 metadata의 tokenizer_config.json만 받아 기존 Python 환경을 수정하지 않았다. 8초 unforced CTC 실제 exit0/15.726초이나 “어느선 함께 남다”로 인식해 정확 가사·음절 timing 후보로 미채택. 원문을 강제 입력하거나 실패 posterior를 확정 score로 바꾸지 않았다. 저자 speech-trained model card의 일반 음성 CER/WER를 가창 성능으로 주장하지 않는다.

Whisper/CTC 각 실제 감시 표본 child peak2.70040/1.66047GiB/free min7.91688/8.90389GiB, guard 중단 없음. 다운로드 전 여유 RAM10.58GiB/C111.03GiB/D1352.22GiB 확인. 모델·script·실패/측정 JSON은 부모 runtime 보존, production audio/앱/사용자 Voice Profile에 연결하지 않음. 원곡의 검증 가능한 음절별 timing·melody와 화성·실제2–4 Parts는 아직 미완료다. 새 환경 설치/다른 대형 모델의 반복 다운로드를 성공처럼 보고하지 않는다.

## 2026-10-12 R6 음표 인덱스 교정 / 지원 음역·두 번째 가사 실제 검증

저자 pinned main9beec10의 Pattern_Generator.py 679–692줄 Note_Predictor에서 `440 * 2 ** ((notes - 69 - 12) / 12)` 및 index0=휴지를 실제 확인했다. 따라서 모델 index72는 MIDI60이다. 이전 진단의 notesMidi 필드명과 약−12반음 차이라는 해석은 일반 MIDI와 모델 인덱스를 혼동한 것이었다. WAV나 모델 출력을 transpose하지 않고 메타데이터를 modelNoteIndices/expectedMidi/noteEncoding으로 구분했다. 원본 공식 source는 부모 runtime에 SHA256dc63fa44da989f8ebd994994bfef7bba9bf7948545474359aea6af6ced975a2c로 보존했다. 기존 보고서·WAV는 수정하지 않고 explicit --legacy-model-index/별도 calibrated-analysis로 재측정했다.

기존 정상 출력 expected MIDI60–67의7음절 실제 오차는−0.2~+0.3반음이다. 중간 입력 index66–73(expected MIDI54–61)은7음절 측정, 오차−1.1~+0.5반음이며 일부 confident frame3개에 불과하다. 실제 Small ASR exact1.0/exit0이지만 지원 음역 전체 승인으로 계산하지 않는다. 낮은 index60–67(expected MIDI48–55)은5음절이40.8에 머무르고2음절null로 실패/미채택. 높은 index84–91(expected MIDI72–79)은5음절 오차−0.2~+0.1, 함/께null을 그대로 유지한다. 인덱스 보정만으로 저음 실패·모든 Part 음역이 해결됐다고 주장하지 않는다.

별도 두 번째7초 구절 “우리 함께 불러요”를 기존 실제 원곡 report의 가사에서 참조하고 동일 합성 melody로 생성했다. 가사 원본 report/WAV hash를 spec에 보존했지만 원곡 melody·화음 연결은 false다. 실제 WAV SHA256842fcacbd1966d177f216de88f59d2405d9b4719d289ae5b6ac1ded7386b7415, Small ASR exact1.0/exit0,7음절 오차−0.4~+0.2반음, peak.939880/rms.162076. 생성과 ASR의 실제 자원 표본은 child peak1.25972/1.60000GiB, free min9.34809/9.01279GiB이며 live guard 중단 없음. 중간 음역 생성/ASR도 child peak1.23179/1.58567GiB, free min9.45536/9.08693GiB였다. 모두 순차 실행했고 기존 CPU 작업·Figma·다른 프로세스·환경·음원은 보존했다.

유지 측정 도구는 원본 샘플레이트로 resample 비율을 계산하고 입력 PCM finite/shape·pinned encoding 적용 모델·버전·길이·원본 hash를 확인한다. 새 metadata와 기존 index 명시 재해석을 실제 GPU 생성/4개 기존 출력 재측정으로 검증했다. 원곡 음절별 실제 timing/melody·화음·2–4 Part·실기기 청취·checkpoint 배포 권한은 미완료다. sourceSongConnected/catalogRegistrationApproved/musicalHarmonyApproved=false 유지. 다음 R6은 원곡의 실제 음절 타이밍/멜로디 출처를 확보한 score와 지원 음역을 대조하는 선행 검증이며 낮은 음역 실패를 다른 seed 반복으로 우회하지 않는다.

## 2026-10-12 R6 새 제어 경로 — 한국어 가사/음표/길이 입력의 실제 진단

Base의 같은 조건 반복 대신 [CODEJIN/DiffSingerKR 원본](https://github.com/CODEJIN/DiffSingerKR)과 [저자 checkpoint Space](https://huggingface.co/spaces/codejin/diffsingerkr/tree/26f95ac2554b6a6725706ed2a7991a62f7f714a9)을 확인했다. 코드 main9beec10ffe3dd1068913b0f65827d31134f9460e/MIT, Space26f95ac2554b6a6725706ed2a7991a62f7f714a9로 pin했다. checkpoint682529563bytes/SHA2566482992a43b8a98554e7ef9e487a381c2717c5828d564e6dfc6cac16a0e16092, vocoder55884400bytes/SHA2565b47a5d03d744861f94ee973294317f738ccc6dc6d27bafa5d8db5ed18f95566 실제 확인. 상업적 checkpoint/data 권한·목소리 선택의 제품 승인은 별도 미확정이다.

기존 CPU/GPU 환경을 수정하지 않고 부모 .ieum-diffsinger-runtime에 pinned source/weights/원본 checksum과 진단 deps hgtk0.2.1·six1.17.0만 보존했다. 원본 변환 함수 본문/모델 수식은 유지하고 별도 probe-source에서 사용하지 않는 training/DSP import만 제외했다. 파라미터232502428bytes를 사전 확인했고 weights_only/mmap·safe YAML을 사용했다. 시작 여유8GiB/여유4GiB 미만 연속3회 해당 PID만 중단하는 live guard를 적용했다.

초기 사전 import에서 six 누락, 첫 모델 실행에서 state Model/DiffSinger KeyError가 발생해 실제 배포 로더의 DiffSVS key로 정정했다. 한글 경로 TorchScript fopen Illegal byte sequence는 같은 로더의 파일 스트림 인자로 수정했다. 감시 없는 재실행은 자동 승인 검토가 RAM 보호 조건 미충족으로 거부하여 실행되지 않았고 live guard를 복구한 새 실행만 승인됐다. v3은 int16 PCM 단위 누락으로 clipping되어 가사 실패했으므로 폐기 승인 없이 원본 보존/미채택. vocoder 실제 반환 코드에서 int16을 확인해32768로 정상 PCM 변환 후 resample했다. peak>1을 조용히 clip하지 않고 거부한다.

v4의 독립7초 가사·음표·길이 진단: 실제 duration6.989208초/추론1.190540초/전체7.255072초/exit0/WAV SHA25674b7053a89a8c9bcd4ec03954c0dddacf9361c6eb6463bc44afe147141fb1e5f. own CUDA allocation peak421700608bytes.6표본 child RAM peak1.22GiB/free min9.64GiB. Small/Turbo 모두 “오늘도 함께해요” exact1.0/exit0. 검사별 실제 RAM peak1.69/3.92GiB/free min9.17/6.63GiB. 낮은 자동 ASR 경계를 완화하지 않았다. 유지 generator의 새 프로세스 재생성은 같은 WAV SHA256 exact이며 실제 측정 script도 정상 종료했다.

입력은 합성 진단 score로 원곡 분석/화음 승인 자료가 아니다. pYIN probability>=.75/구간 양끝80ms 제외에서7음절의 중앙 pitch는 입력보다 약−12반음(−11.7~−12.2)이었다. 첫 silence/마지막 silence RMS 약.0477/.0411도 관측해 완전한 무음이라고 주장하지 않는다. 독립 octave-control은 입력만+12로 바꾸고 출력 transpose/splicing 없이 재생성해5개 측정 가능한 음절 실제+11.60~+12.20을 관측했다. 함/께는 confident frame 부족/null이며 PowerShell 초기 표시의 null subtraction은 측정치가 아니다. private comparison JSON은 null을 명시한다. absolute pitch mapping/지원 음역·휴지부/원곡 음절 진입·화음·2–4 Part·다른 가사/청취는 미검증이다. 모든 결과 sourceSongConnected/catalogRegistrationApproved/musicalHarmonyApproved=false 유지.

유지 도구: qa/probe-korean-score-synthesis.py(--runtime-dir/--output-dir/선택 --score-spec,10초 이하 진단), qa/measure-korean-score-output.py(--song-dir), qa/run-ai-resource-guard.ps1. 실제 WAV/failed outputs/ASR/자원/비교 JSON/수정 전 source는 repository 밖 runtime에 보존한다. 웹 도구 일부 Cache miss/accessibility 실패 후 정확한 main ref/공식 HTTP metadata를 확인했으며 Notion/Figma UI/Computer Use를 사용하지 않았다. 앱 음원/Track/Identity·디자인에 새 모델 결과를 연결하지 않았다. R6 새 입력 제어의 좁은 가능성 검증이며 전체 기능 완료가 아니다.

## 2026-10-12 R6 RAM 경로 보완 — 선택적인 host cache 예산

기존 cuda_disk_offload의 전체 exact host cache를 보존하고 선택적인 max_cache_bytes 상한을 추가했다. generator --lossless-gpu-cache --gpu-host-cache-mib와 연결하며 기본값은 기존과 같다. 그룹의 원래 tensor bytes가 잔여 예산을 넘으면 host 복사를 만들지 않고 기존 native disk 경로로 유지한다. 이미 cache가 있으면 같은 exact 복원 경로를 사용한다. liveResidentBytes/maxResidentBytes/skippedBudgetLoads를 누적 통계와 구분해 보고한다. active cache의 예산 변경은 release 전 거부하며 zero budget은 디스크 경로다.

새 유지 verify-cuda-cache-budget.py 실제 CUDA 작은 모델에서544bytes 상한/반복 exact 출력/예산 초과 그룹 disk fallback/zero 예산/반환 후 재생성/active 변경 거부/원래 disk file bytes 보존 통과. 기존 verify-cuda-disk-offload.py 실제 CUDA lifecycle 회귀도 통과(정밀도 민감 tensor 보존·packed tensor·release/disk reload exact·one-shot/buffer). Python 문법과 generator negative budget의 모델 로딩/출력 생성 전 거부 확인. 진단 로그는 repository 밖 .ieum-gpu-ssd-runtime에 보존한다.

상한은 유지되는 host tensor cache에만 적용되며 전체 RAM/일시 복사/model 로딩 peak 제한이 아니다. 전체 음악 모델의 캐시 용량/시간 개선이나 가사·화음 품질 승인은 측정하지 않았다. 실패 음악을 반복 생성해 성능 수치를 만들지 않는다. 다음 전체 모델 실행은 실제 PC 여유·임시 복사 여유·지원 제어 경로를 확인한 뒤 resource monitor와 함께 진행한다. 기존 CPU 환경/weights/output/App/디자인 worktree 변경 없음.

## 2026-10-12 R1 녹음 복구 확인 전 새 녹음 차단 / 재시도

Recorder의 기존 Draft 로딩은 비동기 확인 전에도 녹음 시작을 허용하고 로딩 실패를 무시했다. 복구 loading/ready/error를 구분해 로딩 중·실패 후에는 마이크 시작을 막는다. 기존 오류 영역의 “저장한 녹음 다시 불러오기”는 읽기만 재시도하며 원본을 삭제/교체하지 않는다. 정상 복구는 기존 Review/직접 제출 흐름을 그대로 사용한다. 새 화면·디자인 토큰·제품 정책·서비스 연결 변경은 없다.

검증: Node React/격리 DB의 실제 get 실패와 재시도, 제출 실패/정리 실패·원본 보존·2–4 Part 재로드 통합 QA 통과. 새 유지 qa/verify-draft-restoration.mjs에서 실제 렌더/native IndexedDB 읽기 실패 뒤 mic request0, 시작 disabled, 재시도 Review 복원, SHA256 원본 동일, 제출수2 유지·pageerror0 확인. 기존 recorder-session/retake-lifecycle 실제 렌더 QA 통과. build34modules 통과. npm preview 인자 전달 오류(dist 없음) 후 같은 Vite CLI의 명시 인자로 재실행했고, sandbox loopback timeout/refused는 preview와 browser QA를 동일 승인 실행 경계에서4194로 제공해 동일 QA를 통과했다. Computer Use/원본 웹 UI 접근 없음. synthetic/격리 DB 결과이며 실기기 청취·최신 디자인 승인이 아니다.

현재 서버 미커밋3파일은 보존/제외한다. 앞선 실제 R6 실패 증거도 현재 계획/상태에 보존한다. 6b91f11 main 동기화/Git Integration6998516317 success. production draft-restoration native QA 통과 및 JS SHA256 E007051CDC313EA73AB06CA877C1D2E3F7EF5BE07170D6E79B6F0550536B4B2B local exact 확인. 검증용 해당 preview session은 종료했다.

## 2026-10-12 R6 장시간 작업 우선 — 한 구절 실제 제어 시험 결과

사용자가 현재 실기기 검증을 할 수 없어 오래 걸리는 독립 작업을 먼저 실행하라고 지시했다. 기존 전체 곡/가사는 보존하고 별도 진단 spec의 첫 구절 “오늘도 함께해요”만 사용했다. 같은 Base revision/FP32/CUDA/seed65359/50step와 native 기본 guidance7, 원곡31.7–39.7초8초 mix 조건에서 실제 생성했다. 짧은 구절의 제어 가능성을 확인한 것이며 전체 곡 요구를 줄인 것이 아니다.

생성 exit0, 추론396.283초/전체447.813초, WAV SHA256 e8ffa89ac144bcd2aa2705efa7314e4fbc363c13a0015f8f026006f6626cc470. 자체 CUDA allocation peak1153922560bytes. 실행 전 RAM 약10.6GiB 여유/VRAM520MiB 확인, 실제 child 포함140개 감시 표본에서 점유 최고8.26GiB/여유 최저2.42GiB. 여유1.25GiB 미만 연속3회 해당 작업 중단 조건은 미발동. 다른 사용자 프로세스·CPU 환경·기존 결과·디자인 worktree를 변경하지 않았다. 짧은8초 입력에서도 추론 시간이 이전19초 경로와 비슷해 시간 해결 경로로 판단하지 않는다.

분리25.032초/합 residual0. Small 빈 인식/정규화 유사도0, Turbo “2분 후” 반복/유사도0·exit2로 exact 가사false. 원곡대조 source voiced264/Part voiced0/paired0, 음높이 차이는 null이다. 미측정 음높이를 숫자로 채우지 않으며 화음·진입·catalog 승인false 유지. 자동 ASR 결과는 실제 청취 판정이 아니다.

결과/spec/감시/분리/ASR/원곡 pitch 자료는 repository 밖 ../.ieum-gpu-ssd-runtime/results/base-one-phrase-feasibility-20261012와 one-phrase-feasibility-20261012.json에 보존했다. 실패 결과를 앱 Guide/Track/catalog에 등록하지 않았다. R6는 현재 Base 음성 제어 경로의 기술 blocker다. 새 제어 경로의 근거 없이 같은 seed/guidance/구절 반복 시험을 하지 않는다. 실제 AI 요구는 유지하고 독립 앱 기능 마감은 계속 가능하다. 다른 모델/제어 경로는 지원·라이선스·실제 RAM/VRAM을 확인한 뒤 선택하며 사용 가능한 결과를 얻기 전 완료로 기록하지 않는다.

## 2026-10-12 재계획 / R1 제출 후 Draft 정리 실패 분리

기존 구현계획 파일을 직접 수정했다. 앱 기능 마감/배포와 AI 음악 연구의 의존성을 분리하며 기존 단계·완료 증거·AI 요구를 보존한다. 첫 기능 수정은 Recorder의 제출 성공 뒤 Draft 삭제 처리다. IndexedDB 정리가 실제 완료된 뒤에만 Draft 표시를 해제한다. 정리 실패는 확정 Track의 실패로 바꾸지 않고 원본·제출수·Workspace 이동을 유지한다.

검증: React/격리 IndexedDB에 삭제 실패를 주입해 확정 Track과 Draft Blob 보존, 2→3 제출수, 중복 제출 화면 없음, Draft 표시 해제 콜백 미호출, 정리 재시도 후 제출수 불변을 확인했다. 기존 2–4 Part 제출/재로드·탐색/Profile/Collection 복귀 통합 QA와 atomic Draft cleanup QA, production build34modules 통과. 하드웨어 마이크/음질/시각 인수 결과가 아니다. a42be86 Git Integration6998195586 success 및 production JS SHA2561FE70EE50EC2E7724BA3DD7F12E7FD4D34A2093A7AC515FDCEEBAE344D297C5B exact 확인. production recorder-session/profile-editing QA도 통과했다.

실제 협업 계정/환경·최신 정책 확인, AI 정확한 가사/화음/진입, 보류된 Identity 디자인·실기기 검증은 남았다. Notion 전용 도구는 현재 세션에 노출되지 않아 읽었다고 주장하지 않는다. 이번 수정은 저장 결과 분리이며 새 UX/제품 정책/디자인 변경은 없다. 기존 미커밋 서버 HTTP 보완3파일은 보존/commit 제외.

## 2026-10-12 R6 우선 재개 — 실제 GPU guidance 비교와 RAM 감시

사용자의 RAM 확보/AI 우선 지시에 따라 서버 후속 수정은 보류하고 실제 음악 시험을 순차 실행했다. 시작 시 RAM9.72GiB 여유/GTX1660SUPER511MiB/Python 없음 확인. 기존 CPU 환경·원곡·실패 후보·디자인 worktree를 보존했다. generate-ai-provided-song.py에 비Turbo native guidance-scale 진단 인자를 추가했다. 미지정 Base/SFT7.0·Turbo1.0 기존 유효 기본값은 유지하며, 유한1–20만 허용한다. 실제 사용 값을 report에 기록한다. 앱/음원/QA 기준 변경은 없다.

같은 Base revision/FP32/seed65359/50step/19초/가사·caption·원곡mix31.7–50.7초에서 guidance만3과1로 바꿨다. RAM을 많이 점유했던 host cache는 사용하지 않았다. 결과는 각각 부모 .ieum-gpu-ssd-runtime/results/base-guidance3-original-mix-20261012 및 base-guidance1-original-mix-20261012에 보존했다. 3은 추론397.854초/전체456.800초/exit0/WAV SHA25666dbc73b2fa966d326c278014eeb51c5fdb0def4cc26aad4a7bb8a4e66794d90, 1은399.273초/전체460.616초/exit0/SHA2560f073a771335cac474f1652ff7c5b3f4a47040cb56c607229106110a98130c1e이다. 두 경로 모두 own GPU allocation peak2354321920bytes였다. 보정 계산을 끈 것만으로 실제 시간/peak 문제가 해결됐다는 근거는 없다. 통제된 하드웨어 benchmark나 모든 입력의 속도 보장으로 확장하지 않는다.

Windows venv launcher와 실제 Python child를 구분해 감시했다. 첫 trial의 초기 resource-monitor workingGiB는 launcher 값이므로 AI 점유로 사용하지 않는다. 별도 python-resource-monitor125표본에서 실제 child 최고8.330GiB/여유 최저1.622GiB를 관측했다. 두 번째는 처음부터 child를137표본 감시해 최고8.330GiB/여유 최저2.490GiB였다. 3초 간격·여유1.25GiB 미만3회 시 해당 생성 child만 중단하는 조건은 발생하지 않았다. 완전한 peak 보장은 아니며 생성 후 RAM11.2GiB 반환을 확인하고 UVR/ASR를 하나씩 실행했다.

두 UVR 분리의 합 residual0. guidance3은 Small0.888889/Turbo0.933333이며 마지막 줄을 각각 ‘작은 노래멀에 모아놨어’/‘작은 노래 모래 모아놔서’로 인식했다. 자동0.8 경계와 정확한 가사는 다르며 normalizedLyricsExact=false다. guidance1은 Small0/빈 인식, Turbo0.066667/‘다음 영상에서 만나요.’로 둘 다 검증 exit2다. ASR 증거는 실제 청취의 대체가 아니다. 원곡 대응 voiced frame의 pitch 중앙 차이는3에서−4.85반음/유니슨15.38%,1에서−2.10반음/유니슨28.70%였고 실제 화성 승인은false다. 파형 에너지 최고상관은 각각0.147344/lag+0.029932초와0.133852/lag−0.748299초로 음절 진입 승인/원본shift 근거가 아니다.

두 후보는 catalog/Guide/Track에 등록하지 않았다. R6·기존 단계3 전체는 미완료다. 다음 음악 작업은 native 가사/음절·화성 제어 가능성을 확보하는 것이다. 같은 실패 조건의 seed 반복·가사 변경·수동 splicing/transpose·QA 문턱 완화로 완료하지 않는다. R3 미커밋 HTTP 보완3파일은 삭제하지 않고 이번 AI commit에서 제외한다. 직전 e76bf2a 서버 준비는 Git Integration6997587089 success/실제 production401·503·405/JS·CSS exact 확인된 범위만 유지한다.

마감 검증: generator Python 문법, 실제 NaN guidance의 model weight loading/output 생성 전 거부, production build34modules, audio foundation 및 Project audio contract 회귀를 통과했다. 앱 bundle/음원은 기존 결과를 유지한다. Git Integration과 production 확인은 해당 AI 작업 commit 이후 실제 결과로 보고한다.

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

### R1/R2 My Projects 제출·Mix 상태 연결 — 2026-10-12

새로 만든 Project의 My 목록은 저장된 project.status/progress만 읽어 실제 마지막 제출 뒤에도 RECORDING 또는 오래된 개수를 표시했다. 기존 allProjectTracksSubmitted/submittedProjectTracks와 실제 저장 Mix를 목록에 연결했다. 모든 필수 제출은 기존 main 목록과 같은 MIXING 분류, 저장된 Mix가 있을 때 COMPLETE 분류를 사용한다. 모집/녹음 정책·실패 재시도·데이터 저장·디자인은 변경하지 않는다.

유지 native Mix 저장 실패 QA에 2/3/4 Part의 실제 제출 개수·믹싱 필터·실패 시 완성 목록 제외·성공/reload 후 완성 이동을 추가해 모두 통과했다. 기존 사용자 여정/2–4 제출·원본 복원 및 single App Node 렌더, build38modules/505.09KB 통과(기존500KB 경고 유지). 물리 청취/실기기·실제 협업·R5 생성·R6 음악 gate는 미완료다. 사용자 서버3파일은 보존한다. 기능 묶음만 main Git Integration→Production 동일 QA로 마감한다.

### R5 측정 음성 원본 조합 revision — 2026-10-12

기존 range/sample sourceProvenance의 purpose/revision/hash/analysis version을 canonical 순서로 결합한 private voiceSourceRevision을 기존 Profile 저장/재측정/Sample 교체/재로드에 연결했다. 생성 이미지 revision이나 선호 설정을 포함한 전체 Profile revision은 아니며 개인 형상 갱신·기존 Track 재생성 정책을 확정하지 않는다. 두 원본 출처가 준비되지 않은 legacy는 null 유지, 저장 성공 전에 새 값을 게시하지 않는다. 저장된 두 source로 재구성하므로 별도 DB/화면이나 중복 원본을 추가하지 않는다. bootstrap hash await 뒤 lifecycle 확인을 유지한다.

Node 실제 저장 재읽기·같은 입력 재현·원본/분석/revision 차이·immutable hash·legacy null, 기존 Identity 입력 계약/단일 App 렌더 통과. native Profile 편집 QA의 초기 등록·range/Sample 저장 실패/retry·Sample 원본 URL·재접속/선호값 보존 및 실제 저장 source와 조합 revision 일치를 통과했다. build38modules/506.10KB 기존500KB 경고 유지. 이 입력 연결은 전체 G1–G5/실제 형상·음악·서비스·물리 인수 완료가 아니다. 사용자 서버3파일/디자인/모델 원본 보존. 해당 묶음만 main Git Integration→Production Profile QA로 마감한다.

### R5 실제 저장 Profile → 개인 생성 입력 연결 — 2026-10-12

기존 private Identity 계약과 source-set revision을 실제 IndexedDB Profile 읽기에 연결했다. 하나의 range/sample을 같은 read transaction에서 읽고 metadata snapshot을 hash await 전에 고정한다. 측정 canonical hash·실제 Sample Blob SHA/byteLength·purpose/동일 Profile 영역·실제 저장 extractor version을 확인하고 명시 generator version으로 private 입력 manifest를 만든다. 저장된 분석값을 사용하며 이를 독립 재분석/지각 신뢰도 검증으로 주장하지 않는다. 생성 모델을 호출하거나 정책/디자인/제출 상태를 변경하지 않는다. 현재 앱의 기존 진단 경계에서 해당 준비 API를 검증하며 실제 generator는 연결되지 않았다. 원문 사용자 ID는 private manifest 안에만 있고 공개 URL/시각 metadata로 게시하지 않는다.

유지 qa:identity에 실제 persisted-source bridge QA를 포함했다. 실제 파일/hash/version/source purpose 확인·legacy/불일치 거부·입력/revision/사용자/버전 구분·immutable snapshot·read-only를 검증했다. native 기존 Profile 편집/초기 Setup/실패/retry/reload와 실제 저장 원본 manifest 재현 통과. 단일 App Node 렌더/build39modules/509.42KB 통과(기존500KB 경고 유지). 사용자 서버3파일/원본·디자인은 보존. 관련 묶음만 main Git Integration→Production Profile QA로 마감하며 전체 G1–G5/음악/실기기/실제 서비스 gate는 미완료다.

### R6 실제 conditioning frame 경계와 요청 시간 분리 — 2026-10-12

고정 원본 Convert_Feature_Based_Music/Expand_by_Duration의 실제 token duration을 사용해 음절/휴지의 start/end frame·native 초·요청 초·phoneme frame을 generator report에 보존한다. sung note0/rest nonzero 입력과 변환 뒤0-frame 자음/휴지를 모델 로딩 전에 거부한다. sampler/seed/PCM·음표·출력 shift/crop/gate는 바꾸지 않는다. 유지 CPU 검증은 실제 원본 converter의 frame 연속성/전체 expanded count/짧은 입력 거부와 실제 보존된 base generator source hash를 대조했다. 최초 상대 runtime 경로 검사에서 ModuleNotFoundError: No module named 'Pattern_Generator'였으며 Resolve-Path의 절대 경로로 바로잡아 기존 CPU 환경 검증도 통과했다. 새 환경 설치/모델 로딩 없음.

같은 보존 base PCM(SHA2efa01ddbb8b17dc63b037601a6cbd6a27a5bc9b4b5e20ba8f445b6e1118a0ca)의 conditioning interval을 별도 sidecar와 기존 측정기에 연결해1회 실제 측정했다. live guard wall7.327초/exit0/resourceStopped=false·free최소8.386GiB/owned최대.238GiB. 기존 최신 frame-support 측정의 requested observations/fullInterval/noteEvent 및 duration/hash는 exact 유지다. 최초 비교는 더 오래된 fullInterval 키가 적은 report를 골라 assertion observations였고 실제 최신 report로 대조해 exact 확인했다. 원본/실패/별도 sidecar/측정 로그는 기존 runtime에 보존한다.

요청 대비 실제 입력 경계 차이 최대.0099828초, 요 native end4.458231 vs요청4.468182초, actual voiced last4.400181초·35/44frames·최장31. rest RMS.01233684/.00918070로 잔여 에너지는 남는다. conditioning 경계는 실제 음소/발성 진입 판정이 아니며 휴지/지속음 해결·원곡 음표/화음/2–4Part/청취·권한 승인으로 표시하지 않는다. build39modules/509.42KB 기존500KB 경고·앱 bundle exact 유지. 연구 유지 코드/계획만 main Git Integration→Production 기존 앱 보존으로 마감하고 사용자 서버3파일/디자인은 보존한다.

### R6 무거운 runtime 전 실제 입력 검증 — 2026-10-12

generator의 torch/numpy/soundfile/scipy 및 모델 import를 모든 실제 token/frame/curve 검증 뒤로 이동했다. --validate-score-only는 원본 converter 결과와 frame/note events만 반환하고 modelLoaded=false/inferenceExecuted=false로 종료한다. 기존 실제 생성/preflight의 모델·seed/steps/sampler/출력 처리는 유지한다. 이는 잘못된 입력의 불필요한 RAM/GPU 로딩을 제거하는 실행 변경이며 생성 음악 품질 통과가 아니다.

실제 generator runpy 진입에서 무거운 import를 금지한 상태로 정상 rest/음절 및 melisma2개,0-frame sung/rest·잘못된 rest/note·frame충돌 curve5개의7사례를 실행해 통과했다. 최초 QA temp 경로에서 PermissionError: [Errno 13] Permission denied가 발생했으며 저장소 내 고유 전용 temp 경로를 사용해 보완했다. 사용자 파일/원본을 삭제하지 않고 QA가 만든 파일만 자체 정리한다. 추가 모델/추론/환경 설치 없음. build39modules/509.42KB 기존500KB 경고와 현재 앱 bundle 유지. 유지 실행 코드/QA/현재 계획만 main 자동배포→Production 앱 보존으로 마감한다. 실제 가사·음정/휴지·전체2–4Part·권한/청취·Identity·서버 gate는 미완료다.

### R6 휴지 AC/DC와 terminal alpha 대조 — 2026-10-12

기존 실제 PCM16의 raw RMS/DC/AC·windowed 대역 분율·휴지4구간을 read-only로 측정했다. 단독 휴지 raw.0096574/AC.0096505/DC power.001428, base 앞 휴지 raw.01233684/AC.01233674, 뒤.00918070/AC.00917479였다. 단독/가창 이전에도 잔여 에너지가 있으므로 DC 편향 또는 가창 뒤 잔향만으로 설명하지 않는다. spectral 분율은 청취/노이즈 발생원/음질 승인 근거가 아니다. 실제 conditioning sidecar·원본/report SHA를 확인하고 output/필터/마스킹/crop은 변경하지 않았다. 두 read-only 측정은 guard wall1.249/1.229초 exit0였다.

원본 모델 alphas_cumprod_prev[0]=1 및 [공식 DDIM 문서](https://huggingface.co/docs/diffusers/api/schedulers/ddim)의 set_alpha_to_one 종료 조건을 대조했다. 기존 native/reference/default는 유지하고 명시 terminal-one 진단 옵션만 추가했다. 같은 원래 rest score SHA146ec12fb0df5b88548ddd6bd94738f82f86c692b7eb33a7fe3b651ed713e065·checkpoint/code/seed65359/50steps/vocoder·길이2.995375초를 유지한 실제1회 결과 SHA7182b9f53ddbd2800a0ad7c6288e4ac88f65de52cb4e5e68323a7f1b2e57cea7, RMS.00959338/peak.09183519였다. 기존 reference RMS.00965685 대비 소폭 차이이며 휴지 해결/새 기본 sampler/음악 승인으로 표시하지 않는다. guard wall7.327초/exit0/resourceStopped=false/free최소7.371GiB/owned최대1.268GiB/GPUpeak353900544bytes. 같은 실패 조건의 seed/guidance/재실행 후보 탐색은 하지 않는다.

실제 source/PCM/hash/실패 증거/자원 로그는 기존 runtime에 보존했다. 실제 generator 입력 경로7사례 회귀 및 build39modules/509.42KB 통과(기존500KB 경고). 유지 진단 도구/계획만 main Git Integration→Production 기존 앱 보존으로 마감한다. 다음 음악 선행은 이 sampler 종료 옵션을 반복하기보다 실제 음절/휴지 acoustic 제어와 모델/학습자료 제약을 해결하는 것이다. 원곡 음표/화음·전체2–4Part·권리/청취/서비스·Identity gate는 미완료 유지, 사용자 서버3파일/디자인/현재 앱 음원은 보존한다.

### R5 실제 sampled F0 관측 보존 — 2026-10-12

기존 v5 분석의 동일 최대36개4096-frame normalized-difference 추출에서 이미 계산한 F0 최저/최고/중앙값·attempted/valid count·detector confidence·65–1050Hz/.30 조건을 별도 ieum-sampled-pitch-v1 데이터로 보존한다. 새 모델·추론/추가 pitch pass는 없고 기존 v5 base fingerprint/Layer 입력은 변경하지 않는다. 전체 feature input에는 별도 observation version을 포함하며 기존 자료를 재분석/이주했다고 주장하지 않는다. 현재 신호 샘플 관측이며 전체 Track 음역·개인 편한 음역·지각 음색/실력·신뢰도 보장이 아니다.

project-track 후보의 actualRange는 충분한 유효 관측과 지원 version/count/range가 있을 때만 estimated/confidence=null로 연결한다. Sample 관측을 편한 Profile 음역이나 평균 개인 음역으로 대체하지 않는다. averageRange/호흡/비브라토/BPM/리듬은 미지원null 유지, 무음/짧은/legacy·잘못된 관측도 null이다. 미정 형상/사진/갱신/매칭 정책이나 화면을 추가하지 않는다.

3 sample rate·저/중음·두 음정 변화·동일 입력 재현·무음/짧은입력·잘못된값과 synthetic WAV의 제출 원본/관측/Layer 저장 재읽기를 검증했다. 기존 저음 회귀 및 변경 전 Record fixtures의 fingerprint959ec28d/2f3bc4dc·Layer d60d64d4/4082a169·2–4 signature0cb8b1c3/85797d10/35c8f287 exact 유지. native Profile 초기 등록/편집/실패/retry/reload·실제 Sample의 observation/private 생성 입력 보존, 단일 App Node 렌더/build39modules/509.99KB 통과(기존500KB 경고). synthetic 검증이며 실제 사람의 전체 음역/청취/형상 gate를 통과한 것으로 처리하지 않는다. 관련 기능 묶음만 main Git Integration→Production Profile QA로 마감하고 사용자 서버3파일/디자인/AI 원본은 보존한다.
### R6 실제 원본 VAE 인코딩 분리 측정 — 2026-10-12

설치된 AutoencoderOobleck의 use_tiling은 encode 입력이 sampling_rate*30을 넘을 때만 분할 경로에 진입한다. 같은 실제 원곡 SHA7ef11d5e...의31.7–39.7초 입력은384000samples로 30초 threshold보다 작아 분할되지 않는다. 이것만으로 이전 전체 생성 중단의 원인을 단정하지 않는다.

qa/verify-music-source-encode.py로 기존 local VAE만 실제 CUDA FP32/동일 leaf offload·74개 weight normalization exact 조건에서 인코딩했다. Transformer/조건 모델은 로드하지 않았다. 실제 source/weight SHA 검증, posterior mean shape1×64×200·finite 및 SHA b65e572498767decc6928f868ce17308b8a66583dc64c7c3aebd93c9b04158d5를 관측했다. encode1.707906초/GPU peak allocated1143369728bytes/reserved2097152000bytes, guard wall31.061650초/exit0/resourceStopped=false·PC free최소5.543957GiB/최대 worker3.031757GiB. worker 종료 확인. 이는 component 자원 측정이며 native posterior sampling/전체 pipeline RAM 안전/음악·가사·화음/속도 개선 승인은 아니다.

최초 실행은 output 공백 경로가 Start-Process 인자에서 분리되어 argparse unrecognized arguments/exit2였고, 기존 guard와 공백 없는 상대 output 경로로 바로잡았다. 실패/성공 기록 모두 기존 runtime에 보존했다. 첫 성공 측정은 결과 기록 중 weight read_bytes를 포함하므로 최대 worker를 인코딩 자체 peak로 해석하지 않는다. 유지 스크립트는 source/weight 파일 hash를 bounded file_digest로 바꾸고 model import 전에 계산해 후속 진단의 불필요한 전체 파일 RAM 할당을 제거한다. 기존 CPU/GPU 환경·모델·음원·사용자 서버3파일은 변경하지 않는다.

다음 R6 선행은 이 VAE 단독 결과와 기존 조건 모델 단독 결과를 근거로 전체 pipeline의 source encode/condition/denoising 진입별 실제 RAM을 분리하는 것이다. 동일 실패 경로의 무근거 전체 생성 반복과 생성 품질 문턱 완화는 하지 않는다. 일정 재산정 eae2974 main push/Git Integration success·Production HTTP200/index-DlRbC8xD.js SHA39509AA129CA1D0F39DED94EB1C660BF021700509F272D748B7278E7715DAB1B exact 확인.
