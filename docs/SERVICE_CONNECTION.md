# 단일 앱 서비스 연결 계약

## 2026-10-13 generated PNG 첫 프레임 실제 검증

trusted worker의 개인/Track received result 저장은 verifyGeneratedPng를 먼저 성공해야 한다. IEUM_IMAGE_DECODER_PATH 또는 기존 IEUM_AUDIO_DECODER_PATH의 설치된 FFmpeg를 명시하며 설치/자동 활성화하지 않는다.512 PNG/8MiB 입력·단일 thread·file,pipe protocol·5초 decode timeout을 사용하고 출력RGBA1048576bytes를 세어 폐기한다. 첫 프레임의 size/SHA/decoder version/SHA receipt를 불변 result_data.imageReceipt에 함께 저장한다. bytes는 바꾸지 않으며 missing decoder/실패 시 기존 결과/원본/제출/Mix는 보존한다. APNG 전체 프레임/실제 모델 실행/시각 승인·OS RSS hard limit을 뜻하지 않는다. 기존 API의 metadata 조회에는 receipt/PNG bytes를 추가하지 않는다.

qa:generated-image와 기존 personal registry/qa:remote-voice-lineage는 기존 IEUM_QA_FFMPEG_PATH를 사용한다. 실제 decoded test PNG·replay/잘림/손상/크기/timeout/child release·SQL에 저장된 imageReceipt/hash 및2–4 Part 입력 계보/상태 독립을 확인한다. 테스트용 raster는 실제 AI 결과/승인 그림이 아니다. 최소 header만 받던 이전 준비 저장 증거는 당시 기록이며 실제 배포 DB migration/계정/model/runtime 승인을 대신하지 않는다.

## 2026-10-13 원격 received Track layer·Project record 입력

Migration 순서: profile_source_registration + personal_identity_results/source_binding/traits + verified_audio_receipts + submitted_track_analysis → track_voice_layers → project_voice_record_inputs. 운영에 적용하지 않았다. 레이어 테이블은 실제 submitted Track/본인 개인 결과 FK 및 immutable PNG/result revision이며 일반 사용자/service_role 직접 접근을 차단하고 trusted context/store RPC만 service_role에 제공한다. storeReceivedTrackVoiceLayer는 저장 분석·개인 traits로 기존 Track input/controls를 재구성하고 private 원본 bytes를 명시 maxOriginalBytes 안에서 취득·검증한다. received output은 저장 계약일 뿐 모델 실행/시각 승인 증명은 아니다.

Project input은 기존4필드 ref 또는 inputDigest가 포함된5필드 ref를 명시적으로 대조하며 최신 결과를 자동 선택하지 않는다. 실제 제출 Track 분석·원본/receipt와 exact 레이어 ref, 같은 Seed/2–4 Part/CAS에 묶어 저장하고 기존 partial input은 유지한다. Project input GET은 owner/현재 배정 참여자의 private 내부 조회이며 공개 공유/비참여 상세용 최종 서비스 정책은 활성화하지 않았다. 기존 /api/me/voice-identity?kind=track-layer&projectId&partId&id&revision은 본인6필드 stored ref metadata, kind=project-record&projectId&inputDigest는3필드 과거 입력 metadata를 반환한다. 기본 개인 결과/traits 조회는 유지하며 배포 함수 수12개를 늘리지 않는다. private no-store/Auth이고 raw user ID/원본/PNG bytes는 조회에 없다. client transport는 기존 session scope에서 getTrackVoiceLayer/getProjectVoiceRecord를 사용한다.

qa:remote-voice-lineage는 기존 isolated SQL/FFmpeg 경로를 명시해야 하며 설치하지 않는다. 실제 짧은 WAV 분석과 SQL2/3/4 Part의 Profile 등록/Track 제출/received 결과/과거·현재 입력/session 조회·CAS/owner/변조/예산/immutable/원본·queued Mix 보존을 확인했다. Auth/Storage 네트워크 및 PNG는 fixture이고 다중 원격 DB session·실제 AI/PNG decode·사용자/서비스 인수는 아니다. App capability/Google/DB/Storage 활성화·새 worker/scheduler·임의 AI/형상·선택/갱신 정책은 없다.

## 2026-10-13 개인 공통 특징의 원격 Track/바이닐 입력 연결

GET /api/me/voice-identity?id=…&revision=…&include=traits는 본인 저장 결과의4필드 metadata/ref/traits를 private no-store로 반환한다. 기본2개 query의3필드 응답은 유지하며 다른 include/추가 query는 거부한다. 새로운 authenticated-only ieum_get_owned_personal_identity_traits RPC는 기존 exact owner ref를 먼저 확인한다. 서버가 traits digest/Profile revision/personal input/generator version을 검증하고 원문 사용자 ID/manifest/PNG bytes는 응답하지 않는다. migration은 personal_identity_results 뒤이며 원격에 적용하지 않았다.

기존 getPersonalIdentity에 명시 includeTraits 옵션을 추가했다. loadRemoteSubmittedVoiceControls는 같은 session에서 저장 traits를 검증하고 기존 본인 result/Track 입력을 연결해 기존 provisional mapping의 두 representation을 만든다. 실제 Track은 vinyl 입력에만 있고 개인 측정 특징은 양쪽 공통이다. model/artwork/selection/Track/Mix 쓰기가 아니다. 실제 격리 SQL/API/session QA의 exact lineage/replay/owner/privacy/tamper/async snapshot 및 build 통과. Auth/HTTP/PCM/PNG fixture·실제 AI/원격/시각 인수는 구분한다.

## 2026-10-13 native renderer 작업 종료 경계

renderProjectMix는 own child의 결과/오류/timeout 뒤 SIGKILL 및 close를 기다린 후 반환한다. fork 생성 실패도 error→close 경로에서 실패를 반환한다. 이전 renderer 프로세스가 살아 있는 동안 다음 upload/retry/job을 시작하는 시간 겹침을 방지하며 native 메모리 peak hard limit은 host 책임으로 유지한다. 실제 승인 runtime2–4 Part/timeout/decode 실패 및 격리 SQL pipeline QA에서 반환 시 live child0·기존 output SHA·원본/완료 상태를 검증했다. 사용자 앱/CPU 작업 종료·runtime 설치·운영 host 활성화는 없다.

## 2026-10-13 R5 등록 원본과 개인 결과의 정확한 분석 연결

loadRemoteMeasuredProfileIdentityInput은 기존 getVoiceSource/인증 session을 사용하고 등록된9필드 metadata의 출처·revision·음역 hash·Sample 분석 hash/version/ID/길이를 확인한다. 개인 manifest의 Sample recordId는 등록 uploadIntentId이며 range recordId는 voice-range:측정 revision이다. 원본 Blob/공개 URL을 반환하거나 사용자별 선택·갱신을 자동 결정하지 않는다. source_metadata가 없는 legacy 원본은 거부한다.

personal_identity_source_binding은 profile_source_registration 및 personal_identity_results 이후 적용하는 추가 migration이다. service-only 등록 RPC의 insert에서 정확히2개 purpose의 registered range/Sample ID·hash·version·분석 data를 검사한다. 결과 received/stored와 생성 실행·시각 승인·Profile 선택·Track 제출·Mix 성공은 계속 별개다. 실제 격리 SQL 등록→인증 GET→manifest→결과 저장→Track 입력과 분석값/ID 변조 거부 QA/build 통과. 운영 migration/서비스 활성화/새 dependency는 실행하지 않았다.

## 2026-10-13 R5 개인 received result 소유권·불변 서버 저장

personal_identity_results migration은 profile_source_history 이후 적용한다. trusted worker의 storeReceivedPersonalIdentity는 기존 입력/결과 계약과 shared traits를 검증하고 Profile history의 owner/revision/range hash·version·data/Sample hash에 연결한다. private manifest·artifact provenance·traits 및 PNG bytes(기존8MiB 계약 상한)를 DB bytea로 함께 보존한다. DB 직접 읽기·쓰기는 service_role도 금지하며 등록 RPC만 service_role에, exact ref 읽기 RPC만 authenticated에 허용한다. 기록된 status stored는 생성 실행 증명·시각 승인·Profile 선택·Track/Mix 성공이 아니다. 실제 PNG decode/실제 AI·운영 저장량/latency·Storage 이동 정책은 별도 기술/인수 항목이며 아직 실제 서버에 적용하지 않았다.

GET /api/me/voice-identity?id=opaque-id&revision=exact-revision은 기존 bearer 검증→본인 RPC를 사용한다. 응답은 resultStatus/profileRevision/ref만 private/no-store로 제공하고 user ID/manifest/Blob URL은 노출하지 않는다. 공개/다른 사용자 결과 읽기와 클라이언트 생성 결과 등록은 제공하지 않는다. remote transport의 getPersonalIdentity와 기존 session.run scope를 사용해 Track 입력을 준비하기 전에 개인 ref owner·digest/version/hash를 대조한다. 실서비스가 미설정이면503이며 가짜 provider/AI 결과를 만들지 않는다. source 변경/다른 revision이 과거 결과를 덮거나 자동 재선택하지 않는다.

검증: qa/verify-personal-identity-registry.mjs는 기존 IEUM_PGLITE_ROOT의 실제 격리 PostgreSQL/RPC와 주입 Auth/HTTP·통제 Track 분석을 사용한다. immutable bytes/hash·owner/source 연결·재시도/충돌·다른 사용자/익명/직접 접근 거부·원본 변경 후 old ref·logout/변조 시 분석 차단·Track/Mix 불변을 확인했다. PNG는 최소 계약 fixture이며 실제 decode/AI/운영 Supabase·사용자 인수가 아니다. 기존 제출 Track real decoder/SQL2–4 Part QA도 통과했고 원격 migration/계정 생성/서비스 설정/운영 활성화는 수행하지 않았다.

## 2026-10-13 R3 자동 Mix job 취득·lease 연결

마지막 실제 제출이 생성하는 기존 queued job을 host iteration runNextProjectMix가 service-only SQL로 취득하고 기존 원본→반주→native DSP→업로드/해독→완료 연결을 실행한다. claim은 FOR UPDATE SKIP LOCKED와 만료 lease/token으로 중복 취득을 차단하며 갱신·중단 worker 재취득 및 오래된 token의 완료/실패 덮어쓰기 방지를 제공한다. 완료 transaction은 Project→job 순서와 기존 제출 snapshot/Source·저장 원본 검증을 유지한다. 실패는 제출 Track/Mix 업로드 원본을 보존하고, failed job의 무제한 자동 재시도 정책/새 UX는 만들지 않고 서버 명시 retry ID만 받는다. import 시 cron/process는 시작하지 않으며 운영 scheduler/runtime/서비스는 활성화하지 않았다. 설정·승인 runtime 확인 후에만 claim한다. 기존 실제 native/SQL2/3/4 Part pipeline에서 마지막 제출 queued→자동 취득→완료 실패 보존→명시 재시도/업로드 재사용→성공을 검증하고 권한·active lease 중복 차단·갱신·만료 재취득·stale 완료/실패 거부·idle을 확인했다. 초기 transaction QA는 의도한 PT409 뒤 savepoint 복구 누락으로25P02(current transaction is aborted)가 발생했고 QA savepoint를 보완한 뒤 통과했다. 기존 결과 저장 QA/build도 통과·기존500KB 경고 유지. SQL/native/decoder는 실제 실행, Auth/Storage 네트워크는 주입이며 다중 원격 DB session/실서비스 검증이 아니다. 실제 host cadence/RSS limit·운영 runtime 승인·migration/곡 ingest·Google/DB/Storage/App·실기기/음악/디자인은 잔여다. 기존 단계/예산/미정 정책·사용자3파일 보존, 실효 공수 미측정.

mix_job_leases migration은 project_tracks 및 mix_completion_context 이후이며 native QA에서는 backing registry 뒤에 적용한다. leaseSeconds30–3600은 host 기술 설정이며 사용자 정책/자동 재시도 횟수를 확정하지 않는다. runNextProjectMix 한 호출은 한 job만 실행하고 외부 host가 호출 주기/총 concurrency·native RSS 상한을 관리해야 한다. 현재 공개 API/capability 및 Vercel cron은 바꾸지 않는다.


## 2026-10-13 R3 실제 catalog 반주 조회 연결

executeProjectMix의 기본 반주 resolver를 서버 private registry 조회에 연결했다. 기존 immutable catalog arrangement 및 Project의 arrangement_id/같은6필드 Source를 service-only RPC로 대조하고 opaque objectId·기존9필드 decode receipt를 받는다. 기존 private Storage hash/MIME/size·남은 byte 예산으로 실제 Blob을 검증한 뒤 기존 native DSP에 전달한다. registry는 비어 있고 service-role trusted ingest만 insert할 수 있으며 공개 사용자 읽기/변경과 revision 덮어쓰기를 차단한다. 승인 없는 demo/곡/원본을 실제 catalog로 승격하지 않았다. 기존 native SQL pipeline QA를 기본 resolver로 변경해2/3/4 Part·반주 미등록/hash conflict/Storage 변조 거부·사용자 RPC/table 권한 차단·immutable 수정 차단·원본 보존/완료 실패 재시도/출력 동일성을 확인했다. QA Storage는 주입이며 native와 SQL/decoder는 실제 실행이다. build 통과·기존500KB 경고 유지. 운영 곡 ingest·서비스/host/runtime/자동 job scheduler·App 연결·실제 음악/청취/디자인은 미완료다. 기존 단계·예산·사용자3파일·미정 정책을 보존하고 실효 공수는 미측정이다.

arrangement_audio migration은 project_participation 및 mix_completion_context 이후다. registry insert는 검증된 반주에 대한 trusted ingest 경계이고 음악 품질/사용 권한 승인이나 자동 업로드 완료가 아니다. 업데이트 대신 승인된 새 arrangement revision을 사용한다. 이 구현은 runtime 운영 설치/계정 생성/실서비스 활성화 허용을 뜻하지 않는다.


## 2026-10-13 R3 제출 원본→native Mix→저장 완료 연결

서버 내부 executeProjectMix(jobId)를 기존 renderProjectMix/persistProjectMix에 연결했다. service-only ieum_get_mix_render_context가 현재 job snapshot·실제 제출 Track/검증 receipt·같은 Project Source·Part 목록을 제공하고, 기존 private Storage 스트림 검증을 재사용한 bounded loadVerifiedOriginal로 원본을 취득한다. 클라이언트 원본/특징/완료 주장은 받지 않으며 반주는 서버의 trusted loadBacking resolver가 실제 Source SHA와 맞는 Blob/receipt를 제공해야 한다. 승인 TEMP runtime에서 기존 DSP만 실행하고 immutable 업로드·실제 해독·최종 제출 snapshot 재검증 성공 뒤에만 완료한다. 기존 qa:native-mix를 확장해 실제 격리 PostgreSQL 제출/권한·FFmpeg receipt·native2/3/4 Part 출력→Storage 응답 주입→결과 decode→완료 transaction 및 원본 변조 차단·완료 DB 실패 시 mixing 유지·동일 출력 재시도/업로드 재사용·원본 불변을 검증했다. 기존 server Storage QA/build 통과·기존500KB 경고 유지. Storage/Auth 네트워크는 주입이며 실제 원격 서비스 완료로 계산하지 않는다. 자동 scheduler/운영 runtime 설치·capability 활성화는 없다. 실제 catalog backing 저장 위치/resolver 및 host 자원 제한·job trigger/스케줄러·Google/DB/Storage·App binding과 실기기/음악/디자인 인수는 미완료다. 기존 단계/예산/미정 정책·사용자 서버3파일은 보존하며 실효 공수는 미측정이다.

Migration 순서: project_tracks → verified_audio_receipts → mix_completion_context → mix_output_intents → mix_render_context. RPC는 service_role만 실행하며 새 endpoint는 열지 않는다. qa:native-mix는 기존 IEUM_PGLITE_ROOT도 필수이며 SQL 시험 heap384MiB·native child heap128MiB를 사용한다. loadBacking은 브라우저 입력이 아니라 서버 catalog adapter이며 아직 운영 구현/음원 ingest는 없다.


## 2026-10-13 R3 native Mix 실행 경계 검증

승인된 TEMP node-web-audio-api2.2.0을 명시한 서버 내부 renderProjectMix를 추가했다. 제출 성공한 실제2–4 Part·같은 Project Source·기존 decoded receipt·원본 SHA와 backing SHA를 검사한 뒤 기존 src/audio.js createAutoMix만 실행한다. 입력/PCM/출력/길이 예산 및 timeout은 필수 설정이다. 처음 worker_threads 시험은 Windows 종료코드 -1073741819(접근 위반)로 부모 Node까지 종료됐으므로 native 실행을 별도 Node process로 격리했다. 새 runtime/앱 dependency 설치나 별도 DSP는 없다. 실제 FFmpeg receipt와 승인 TEMP runtime을 쓰는 qa:native-mix에서2/3/4 Part+backing 주파수·비무음·-3dBFS peak·동일 입력 hash 재현·원본 불변, Review/타 Project/변조/잘못된 receipt 거부·입력/PCM/출력 예산·timeout을 확인했다. 출력은 각각0.65초 stereo44100Hz WAV114704bytes이며 단독 TEMP 시험과 SHA가 같다. 부모 RSS59MiB는 종료 시점 값이며 native child peak/OS RAM 상한 증거가 아니다. V8 heap128MiB와 PCM admission은 native RSS hard limit이 아니므로 운영 host 자원 제한이 별도로 필요하다. HTTP endpoint/운영 capability/DB 성공 상태를 활성화하지 않았다. 실제 job context·private Storage 원본 취득→renderer→기존 persistProjectMix 연결, Linux 운영 runtime 승인/설정·scheduler·원격 서비스·실제 음악/청취는 미완료다. 사용자 서버3파일·기존 단계/예산/미정 정책을 보존하며 실효 공수는 미측정이다.

qa:native-mix는 IEUM_WEB_AUDIO_ROOT(승인 TEMP 설치 경로)와 IEUM_QA_FFMPEG_PATH(기존 decoder)를 명시해야 하며 자동 설치하지 않는다. runtime2.2.0 외 버전/누락은 실패한다. renderer 입력은 인증된 서버 job/Storage 경계에서만 취득해야 하며 클라이언트 JSON으로 receipt/제출 상태를 신뢰하면 안 된다. renderer 자체는 인증·제출·업로드·완료 확정을 하지 않는다. child process에는 비밀키 환경변수를 넘기지 않는다.


## 2026-10-13 승인된 runtime 호환성 시험

사용자가 오디오 runtime 시험 설치만 허용했다. node-web-audio-api2.2.0을 C:/Users/LEE/AppData/Local/Temp/ieum-web-audio-trial-594d411b1c3f40beb11b2de74f954451에 exact/ignore-scripts/no-audit/no-fund로 설치했다. registry metadata unpackedSize42188827bytes와 lock integrity sha512-qM3dW3Z5HIz+O+++Uiia8x0OSNHcfJGUlexpCTdAkw8JlM17Ru1nV9a94wlxNRXqxT0Lr/ewwEnBXUwGMt24AA==를 확인했다. 앱 package/lock/AI 모델/OS 설정은 변경하지 않았다. 최초 npm view는 응답 없는 session80417을 종료하고 공식registry+systemCA+20초 한도로 같은 조회를 성공했다. 실제 기존 src/audio.js createAutoMix를 AudioContext sinkId none·OfflineAudioContext native로 실행했고, 합성0.45초 WAV2/3/4 Part+실제 시험 backing Blob에서 각각0.65초 stereo44100Hz PCM16 WAV114704bytes를 얻었다. 입력별 주파수 성분/비무음·peak -3dBFS 제한·동일 입력 재실행 SHA·원본 hash 불변·잘못된 offset 거부 및 progress18/54/88/100을 확인했다. 두 실행 포함 각142/50/53ms, 종료 RSS74MiB이며 native 전체 peak는 계측하지 않았다. 시험 전 가용 RAM6694948KiB(약6.38GiB), 대형 AI/마이크/실제 재생은 실행하지 않았다. 결과/시험 코드/lock은 해당TEMP에 보존했다. 이 결과는 기존 DSP의 Windows Node 호환성 선행 검증이며 실제 음악 품질/청취·Linux/Vercel 운영runtime·renderer worker/스케줄러·원격Auth/DB/Storage 완료가 아니다. 운영dependency 설치/활성화 허용으로 확대하지 않는다.

## 2026-10-13 기존 Identity 입력과 제출 분석 연결

loadRemoteSubmittedTrackIdentityInput는 기존 session.run 안에서 service.analyzeSubmittedTrack을 호출하고 기존 buildTrackIdentityInput 계약으로 private 입력을 만든다. local Blob/demo의 remote 자동 이관이나 그래픽 성공/제출/Mix 쓰기는 없다. 본인과 identityOwnerId를 대조하고 개인 opaque ref/revision/output hash를 await 전에 snapshot한다. 이는 caller가 이미 보유한 개인 참조를 받는 준비 경계이며 실제 개인 artifact 생성/승인·서버 owner registry 검증은 아직 없다.

source revision은 실제 Track ID·원본 hash/크기·decoded receipt/decoder version·분석 manifest version/features hash를 묶은 private SHA256이다. generator version과 개인 ref는 기존 input digest에 반영한다. 응답의 목적/버전/수치 hash/assessment/receipt를 검사하고 임의 URL/추가 metadata·다른 Track·logout 뒤 결과는 반환하지 않는다. 해당 입력을 completed artwork로 저장/표시하거나 userId를 공개 URL로 변환하지 않는다. 개인→Track→Project의 실제 생성·자연 혼합·G1–G5와 미정 갱신/버전/fallback 정책은 기존 잔여다.

## 2026-10-13 제출 Track 실제 음향 분석 준비

POST /api/projects/:projectId/parts/:partId/analysis는 기존 Auth 이후 JSON {}만 받는다. 본인 실제 submitted Track→검증된 immutable upload/decoded receipt→private Storage bytes/hash 재검사→기존 v5 특징 분석→service-only 확정 순서다. migration submitted_track_analysis는 verified_audio_receipts 이후 적용하며 아직 원격에 적용하지 않았다. 별도 ieum-track-analysis-v1 결과에는 실제 source hash/size/receipt/features hash/analysis version과 project-track assessment를 보존한다. 임의 클라이언트 features/음역·대표 Sample을 대체하지 않고 원본·Part·제출/Project revision·Mix job·Identity를 변경하지 않는다.

IEUM_TRACK_ANALYSIS_MAX_PCM_BYTES는 서버의 명시적 Float32 PCM 예산이다. 부족하면 Storage 다운로드/할당 전에 거부하고 미지원 BPM·비브라토·호흡량 등을 실제 수치로 채우지 않는다. 저장 결과는 새 decoder로 재생성하지 않고 기존 원본 hash를 재검사한다. 동일 입력 재시도는 동일 결과이며 다른 결과/용도는 conflict다. 향후 generator/재분석 버전 정책은 확정하지 않았다. 기존 session.run의 service.analyzeSubmittedTrack transport는 logout 후 사용 불가하며 API 응답은 private/no-store다.

qa:submitted-track-analysis의 짧은 합성 WAV/실제 기존 decoder→기존 분석기→격리 SQL/API·2–4 Part 검증은 실제 Supabase/Google/운영 저장·음악·물리 입력·생성 그래픽 성공 증거가 아니다. 원격/App 바인딩 및 R5 생성 gate는 잔여다.

## 2026-10-13 기존 인증의 만료·갱신 연결 준비

serviceSession.connect(token,{expiresAt})는 명시적 Unix millisecond deadline을 받고, Google 교환/갱신의 expires_in으로 같은 deadline을 전달한다. snapshot/run/응답 적용에서 만료를 확인한다. 날짜 없는 기존 준비 call의 호환성은 유지하지만 실제 Google 연결은 항상 deadline을 공급한다. renew는 server-verified 같은 UUID만 보존하고 유효기간 내 요청 epoch를 바꾸지 않는다. scope의 다음 메서드는 현재 token transport를 참조한다. 만료 후 보존되는 context는 메모리 UUID뿐이며 토큰/접근 권한이 아니다. 새 token을 server에서 재검증한 뒤 새 scope만 열고 명시적 logout에서는 해당 context도 제거한다. 늦은 경쟁 갱신/다른 사용자·logout 이후 응답은 차단한다.

Google helper는 단일 timer를 만료30초 전(30초보다 짧은 여유는 남은 시간 절반)에 예약한다. 새 로그인/갱신/로그아웃에 이전 timer를 정리하고 갱신 실패는 세션을 종료한 뒤 code-only 오류를 caller에게 전달한다. silent 반복 재시도/secret 저장/유실 원본 재생성은 없다. background에서 timer가 늦게 실행되면 만료된 예전 scope를 복원하지 않고 신규 신원 검증 scope만 허용한다. 실제 앱 clock/visibility·모바일 복귀·운영 refresh token과 새로고침 복원은 아직 검증하지 않았다. qa:service-auth/service-session의 제어 시계·주입 HTTP 결과만 완료이며 preparation capability는 계속 false다.

## 2026-10-13 Google 로그인 PKCE 연결 준비

사용자의 Google 우선 결정을 기존 serviceSession에 연결하는 createGoogleLogin helper를 추가했다. [Supabase Auth OpenAPI](https://github.com/supabase/auth/blob/master/openapi.yaml)의 authorize provider=google·code_challenge_method=s256와 token?grant_type=pkce의 auth_code/code_verifier를 따른다. 신규 SDK/runtime·계정 생성·env 활성화·별도 화면은 없다. 운영에서 승인된 Auth origin/public key/App origin과 기존 session/storage를 명시적으로 공급해야 하며 실제 공급·App 버튼/복귀 바인딩은 미완료다.

begin은 기존 서비스 capability가 remote/authenticated/sharedProjects일 때만 URL을 만든다. 현재 preparation은 계속 거부한다. 같은 탭 sessionStorage에는 임시 random verifier/state/Auth·App origin/복귀 hash/시각만 보존하고 access/refresh token은 저장하지 않는다. 반대 탭/기기, 변조·중복·30분 초과 임시 context는 거부한다. 30분은 임시 로그인 context의 기술 TTL이며 공급자의 일회성 code 유효기간을 연장하지 않는다. approved redirect allowlist 설정은 실제 서비스 연결 시 확인해야 한다.

finish는 callback origin/path/state/code를 확인하고 외부 오류 원문을 UI에 반영하지 않는다. token 교환 전에 URL의 code/error를 기존 앱 hash로 제거하고 verifier context를 한 번 소비한다. token 교환은 credentials omit/redirect error/no-referrer/no-store/timeout이며 공개 apikey만 전송한다. secret/service_role 키는 입력에서 거부한다. OAuth user metadata를 신원으로 쓰지 않고 기존 session.connect→server verifyRequestUser로 본인 UUID를 재검증한다. 로그아웃·중복 finish/finish 중 begin 및 늦은 응답은 차단한다. Profile/Track/Mix/local app 데이터를 이관·삭제하지 않는다.

refresh는 메모리 내 refresh token으로만 교환하고 새 token으로 기존 server 신원을 다시 검증한다. rotation된 token만 다음 교환에 사용하고 사용자 UUID가 달라지면 세션을 차단한다. logout은 즉시 기존 local session/context를 제거한 뒤 현재 로그인 scope=local만 서버에 폐기 요청한다. 서버 실패는 실패로 반환하지만 기존 Profile/Track/Mix를 지우거나 로그인을 다시 활성화하지 않는다. 사용자 자동 refresh 타이머/기한 처리·새로고침 재인증/복원은 App 바인딩에서 남아 있다.

qa:service-auth의 실제 Crypto/주입 OAuth→기존 session→server Auth 및 refresh rotation/사용자 변경·서버 logout 실패 검증 통과는 실제 Google/OAuth allowlist·두 사용자·모바일 복귀 증거가 아니다. access/refresh token은 메모리에만 있고 reload에는 소멸한다. 따라서 R3 Auth 완료로 표시하거나 capability를 true로 변경하지 않는다.

## 2026-10-13 Owner의 녹음 전 Key 조정 준비

client setProjectKey(projectId,{arrangementId,expectedRevision},requestKey)는 기존 transport와 serviceSession을 재사용한다. 본인 bearer/재시도 키만 기존 route로 전달하고 추가 user/key/source 입력은 보내지 않는다. 세션에서 탈출한 함수나 응답 대기 중 사용자 변경은 SESSION_CHANGED로 거부하며 local data에 쓰지 않는다. 최초 성공 receipt와 현재 GET 상태를 구분하고 자동 재시도 키 변경/Conflict 덮어쓰기를 하지 않는다.2–4 Part client→API→격리 SQL 및 세션 QA를 통과했으나 실제 App W07 바인딩은 아직 없다.

project_participation 이후 project_key_adjustment migration을 적용한다. 실제 원격에는 적용하지 않았다. POST /api/projects/:id/key는 본인 Auth, Idempotency-Key 및 {arrangementId,expectedRevision}만 받는다. 사용자 UUID·직접 Key/추정 음역·임의 source는 받지 않는다. SQL은 Owner→Project 잠금→동일 요청 최초 응답→첫 녹음/실제 제출/현재 revision→trusted arrangement를 검사한다. 같은 Song/실제2–4 Part ID·수만 변경하며 배정자 Fit을 현재 저장 측정값으로 다시 확인한다. Fit 실패에는 전체 transaction을 보존하고 자동 Part 재배정/제거를 하지 않는다.

성공은 실제 key/source/Part 요구 음역과 revision/activity만 갱신하며 Seed·배정·Profile·제출·Mix는 유지한다. 같은 arrangement 선택은 revision을 늘리지 않는다. 첫 녹음과 동일 Project 잠금을 사용하고 시작 후 새 요청은 거부한다. 이전 성공 요청의 응답 유실 재시도는 첫 receipt만 반환하며 녹음 이후 실제 Project를 되돌리지 않는다. 현재 상태는 기존 GET으로 읽는다. 오류는 whitelist code만 제공하고 upstream 진단은 제외한다. 기존 lifecycle rewrite를 사용하며 별도 앱·화면·시연 편곡은 추가하지 않았다.

격리 SQL의2/3/4 Part·Owner/익명·Fit·다른 Part/누락 arrangement·revision·실패 보존·재시도/no-op·제출0에서도 녹음 시작 잠금 및 주입 HTTP/build 통과다. 실제 운영 migration·catalog ingest·동시 연결·client transport/App W07 바인딩·실기기 인수는 미완료다. 기존 서비스 없음·Google 우선 선택을 보존하며 같은 접근 정보 질문을 반복하지 않는다.

## 2026-10-13 Mix 결과 업로드·출력 intent 준비

mix_completion_context 다음 mix_output_intents migration을 적용한다. 원격에는 적용하지 않았다. service-only ieum_prepare_mix_output(jobId,sha256,size)는 Project→job 잠금·기존 실제 제출/source 검증 후 출력 UUID/hash/byteLength를 함께 보존한다. 같은 입력만 재시도하고 첫 candidate와 다른 hash/size는409다. 기존 완료 결과는 원래 result_object_id를 유지한다. allocation은 Track/완료/revision을 늘리지 않는다.

persistProjectMix({jobId,blob})는 worker 내부의 기존 WAV render output을 받는다. 사용자 ID/URL/길이/완료 주장을 받거나 별도 HTTP endpoint를 만들지 않는다. 명시적 byte 예산·stream hash 뒤 intent metadata를 대조하고 기존 Storage byte 검증/비공개 signed no-upsert uploader를 재사용한다. 업로드 오류/409는 저장 bytes가 동일하게 검증된 경우에만 이어가며 DB 실패/응답 유실 뒤 재시도에서도 같은 output ID를 사용한다. 실제 해독/완료 transaction이 마지막 성공 판정이고 완료 파일 유실/불일치에는 재생성·덮어쓰기·원본 삭제를 하지 않는다. signed token은 저장 metadata에 남기지 않고 service credential은 signed PUT에 보내지 않는다.

이하 내용은 runtime 시험 승인 전의 과거 기록이다. 현재 renderer 구현/검증은 문서 상단의2026-10-13 항목을 따른다. 당시 renderer 자체는 없었다. [node-web-audio-api 공식 문서](https://github.com/ircam-ismm/node-web-audio-api)는 Node용 Web Audio와 native 플랫폼·AudioBuffer 접근 caveat를 안내한다.2.2.0 별도 TEMP runtime 설치는 기존 설치 금지 제약으로 자동 승인 검토가 거부했으며 우회하지 않는다. 설치 시험은 사용자 응답 대기이며 새로운 서비스 계정/유료 경로 질문으로 바꾸지 않는다. 기존 PC/앱/모델 runtime은 보존한다. 실제 운영 runtime·Mix renderer/업로드 worker scheduler·Google/DB/Storage/App·실기기 청취는 계속 미완료이고 capability false를 유지한다.

## 2026-10-13 저장 Mix 완료 확정 연결 준비

project_tracks 다음 mix_completion_context migration을 적용한다. 원격에는 적용하지 않았다. service_role만 현재 job의 Project Seed·실제2–4 제출 Track snapshot/Source·상태/기존 결과를 조회한다. completeStoredProjectMix는 trusted worker 내부 호출이며 브라우저 route/서명 API가 아니다. jobId/objectId/sha256만 받고 실제 Storage bytes/hash·기존 decoder의 frame 길이를 검증한 뒤 ieum_complete_verified_mix를 호출한다. 완료 transaction의 현재 입력 재검사와 동일 결과 재시도를 재사용한다. secret은 apikey만으로 서버 RPC/Storage에 전달하고 사용자 bearer/상류 진단을 반환하지 않는다.

기존 IEUM_MIX_MAX_BYTES 및 decoder 실행·길이 설정이 명시적으로 필요하다. 파일/설정/권한/DB 오류면 완료로 표시하지 않고 제출 Track·결과 원본을 유지한다. DB 성공 응답 유실도 동일 결과 재시도로 확인하며 이전 완료 파일이 유실되면 조용히 재생성/덮어쓰지 않는다. 기존 read API는 별도로 저장 결과를 검증한다. 현재 helper는 실제 Mix renderer/결과 upload·job 실행 scheduler·운영 runtime/App 연결을 대신하지 않으며 preparation capability를 true로 변경하지 않는다. qa:mix-completion의 actual short WAV/격리 DB는 실제 음악·원격 두 사용자·청취 인수가 아니다.

## 2026-10-13 공개 Project 탐색 준비

GET /api/project-discovery?songId=<id>&after=<project-id>&limit=<1–50>는 선택적 Song 필터/동일 cursor 규칙으로 기존 Project 목록을 읽는다. SQL은 기존 arrangement/source와 일치하는 Project만 포함하고 실제 제출 row·Part 배정으로 submitted/ready/open을 구분한다. 공개 응답은 id/seed/songId/key/arrangementId/partCount·Part 상태/requiredRange/tessitura·제출 수/revision/lifecycle/keyLockedAt/createdAt이다. owner/participant UUID·Track/원본 참조·private 진단/URL은 SQL/HTTP whitelist로 제외한다. completed는 succeeded Mix job이 있는 경우만 포함한다.

RPC만 anon/auth 읽기를 허용하고 기본 Project table 직접 접근은 계속 금지한다. create/join/recording/submit/Mix 권한은 변경하지 않았다. 기존 catalog의 public request/query parsing을 재사용하며 bearer·쿠키·referrer를 DB read로 보내지 않는다. 기존 discoverProjects는 public transport이고 session.run은 anonymous 경로/세션 변경 차단을 유지한다. project_participation 이후 project_discovery migration을 적용한다. 원격 적용·실제 공개 참여자 Profile/청취·Home/02 data 연결·음악 권리/품질 인수는 미완료다.

## 2026-10-13 공개 catalog arrangement 조회 준비

GET /api/catalog-arrangements?after=<id>&limit=<1–50>는 Profile/login 없이 기존 trusted catalog의 arrangement 선택 입력을 조회한다. 기본20개이며 id의 C collation 순서·마지막 id cursor를 사용하고 {items,nextCursor}를 반환한다. source revision/hash/실제 duration과2–4 Part requiredRange/tessitura만 제공하며 추가 개인 metadata·private asset URL·사용자 ID는 SQL/HTTP에서 제외한다. underlying table은 anon/auth 직접 읽기·쓰기를 계속 금지하고 public RPC만 허용한다. 음악 권리/품질 승인을 생략해 실제 곡을 seed하지 않았다.

기존 getCatalog는 publicRead이므로 개인 토큰을 읽거나 보내지 않으며 session.run에서도 anonymous transport를 재사용한다. Profile 없어도 탐색 가능한 계약과 Profile/Part Fit 후 실제 생성/참여 계약을 구분한다. 환경 미연결은503이고 실제 catalog가 비어 있으면 빈 결과이지 demo fallback이 아니다. 적용 순서는 project_participation 이후 catalog_reads migration이며 실제 원격 적용/승인 음원·Home/Setup data 연결은 미완료다. 현재 주입 network+격리 PostgreSQL QA만 통과했다. 기존 publicRead 토큰 미조회 변경 한 줄을 이 기능의 필수 의존성으로 함께 검토하고 다른 미커밋 transport/QA 변경은 포함하지 않는다.

## 2026-10-13 클라이언트 Profile 원본 연결 준비

기존 createRemoteProjectService에 getVoiceSource/prepareVoiceSampleUpload/verifyVoiceSample/analyzeVoiceSample/registerVoiceSource를 추가했다. 기존 createServiceSession.run 범위의 registerOwnedVoiceSource는 현재 실제 UUID 사용자 소유의 저장 rangeRecord/sampleRecord와 expectedSourceRevision(null=초기), 서로 다른 uploadKey/registrationKey, 기존 signed uploader를 받는다. Blob/provenance hash를 재검사하고 immutable metadata snapshot→Sample 업로드(검증된 같은 byte 재시도는 skip)→서버 audio verify→실제 feature analyze→Profile source 등록 순서다. 서버 features hash/원본 hash/길이·source 계보/출처를 확인하고 최종 등록 응답만 반환한다.

실패/세션 변경은 기존 원본이나 Profile을 삭제하지 않는다. 재시도 키·저장 source revision은 호출자가 유지하고 같은 등록 응답은 최초 성공 결과이므로 현재 상태는 getVoiceSource로 구분한다. 성향 저장/VP05A·Project 제출/Mix/Identity 생성과 분리한다. actual App/OAuth 바인딩·서비스 설정은 활성화하지 않으며 preparation capability에서는 기존 session 연결 거부를 유지한다. 주입 session QA 및 실제 AAC/격리 SQL·서버 handlers를 이은 client 검증만 통과했다. 실서비스 로그인/Storage/물리 입력/청취 인수는 미완료다.

## 2026-10-13 개인 Voice Profile 원본 등록 준비

GET/POST /api/me/voice-source를 추가했다. GET은 auth.uid()의 현재 source와 저장 출처를 반환하고 미등록은source:null, 기존 출처 없는 source는provenanceStatus:unavailable로 유지한다. POST는 {expectedSourceRevision,rangeData,rangeProvenance,sampleUploadIntentId,sampleProvenance}와 Idempotency-Key를 받는다. 사용자 ID/선언 features/등록 성공 값은 받지 않는다. 현재 브라우저 측정 range의 버전·정수 음역·기존6표본 조건/검출 confidence·canonical SHA256와 provenance를 검사하고 본인 서버 Sample 분석/receipt/hash·실제 Storage byte를 재검증한다.

음역은 기존 브라우저 pitch 측정의 선언 데이터다. hash 검사는 무변경을 확인하며 서버 음성 재측정이나 물리 입력 인증이 아니다. rangeOrigin=browser-pitch-analysis와 sampleOrigin=server-decoded-private-original을 구분한다. 실제 Sample의 sampled F0를 편한 음역으로 대체하지 않는다. 기존 voiceSourceRevision 계약을 재사용하며 Sample 분석은 DB에 확정된 결과만 참조한다.

profile_source_history/profile_sample_analysis 다음 profile_source_registration migration을 적용한다. service-only 등록 RPC는 사용자 source 잠금→최초 요청 결과/입력 hash→expected revision CAS→본인 Sample 분석 확인→기존 current source/history·immutable metadata·최초 응답을 같은 transaction에서 저장한다. 기존 ieum_profiles 성향/Identity 및 Project/Track/Mix를 변경하지 않는다. metadata는 source 이력의 참조이며 별도 앱/화면/성향 저장 구조가 아니다. 조회는 본인 RPC로 제한하고 private object ID를 결과에 그대로 노출하지 않는다.

동일 요청은 최초 성공 응답을 유지하며 나중에 source가 바뀌어도 재시도 응답을 새 값으로 바꾸지 않는다. 현재 상태는 GET으로 읽는다. stale revision/다른 파일·원본 유실/DB 실패는 기존 source를 유지한다. 이전 revision 재참조는 저장된 이력의 검증 시각을 보존하고 새로운 그래픽 재생성 정책을 적용하지 않는다. 실제 원격 migration·App Setup/재측정/교체 바인딩·Sample 청취·R5 생성은 미완료다.

## 2026-10-13 실제 대표 Sample 특징 분석 준비

POST /api/me/voice-sample-analyze는 {uploadIntentId}만 받는다. Auth/본인 Sample lookup과 기존 audio receipt 확인 후, private 원본 byte/hash 재검증 및 같은 decoder의 실제 PCM을 기존 analyzeAudioBuffer(v5)에 전달한다. PCM은 기존 count/discard 경로의 선택적 synchronous consumer로 읽으며 전체 Track 저장/submit에 버퍼 할당을 추가하지 않는다. 확정 decodedFrames에 해당하는 mono Float32만 할당하고 IEUM_SAMPLE_ANALYSIS_MAX_PCM_BYTES 예산을 초과하면 다운로드 전에 거부한다. 이는 PCM 버퍼 예산이며 전체 Node process RAM 보장은 아니다. 새 server-only 설정은 비어 있고 실제 환경을 변경하지 않았다.

profile_sample_receipts 다음 profile_sample_analysis migration을 적용한다. service-only confirm RPC는 본인 원본 ID/hash/byteLength·기존 audio receipt에 연결된 v5 features/featuresSha256/assessment를 immutable하게 보존한다. 같은 분석만 재시도하고 저장된 분석은 새 decoder/예산 설정 없이도 원본 byte 재확인 후 재사용한다. 브라우저 features/분석 성공 선언을 받지 않는다. 분석 완료는 대표 Sample 등록·음역 측정·Identity 생성·Track 제출·Mix 완료가 아니며 sampleVerification은pending이다.

밝기/거칠기/dynamics는 기존 signal proxy estimated 표현을 유지하고 호흡량/비브라토/평균 음역 등 미지원 추출은unsupported/null로 둔다. sampled F0는 기존 제한된 monophonic 관찰이며 Sample로 편한 음역을 대체하거나 과학적 음색·실력 판정으로 표시하지 않는다. 원격 migration/hosted decoder/실제 가창 데이터·Profile 등록/App 연결은 미완료다. 실제 짧은 AAC와 격리 SQL의 source/version/예산/권한/실패·보존 검증만 완료했다.

## 2026-10-13 저장 Mix 재조회 준비

project_tracks 다음 project_mix_reads migration을 적용한다. 실제 원격에는 적용하지 않았다. GET projects/:id/mix는 본인 bearer로 참여자 전용 RPC를 호출한다. Project→job shared lock·제출 Track snapshot/Source/실제2–4 Part와 lifecycle을 대조한다. 대기/실패는 result:null, 성공은 opaque private 결과 참조를 서버에서만 읽는다. 공개 결과/공유 접근과 private Track 범위는 별도이며 이 API는 공개 원본 URL을 제공하지 않는다.

성공 결과의 read URL 전에 기존 Storage/decoder를 재사용하여 실제 hash·오디오 포맷·frame 길이를 확인한다. server-only IEUM_MIX_MAX_BYTES와 기존 decoder path/최대 해독 길이는 명시적으로 설정해야 한다. 임의 기본값이나 로컬 Windows 경로를 운영에 적용하지 않는다. 파일 byte 한도는 전체 프로세스 RAM 한도와 다르며 서버 TEMP 사본·stream 해독으로 전체 PCM 누적을 피한다. 저장된 길이는 실제 frame 기준1sample 이내로 일치해야 한다. 불일치/유실/미설정은 실패하며 completion DB를 새로 확정하지 않는다.

loadRemoteProjectMix는 기존 세션과 검증된 Blob 다운로드를 재사용한다. 명시적 file-byte 예산과 신뢰 Storage origin이 필요하며 signed URL/expiry를 Blob metadata/local 저장에 남기지 않는다. 실제 Mix worker·원격 환경·App 연결은 미완료다. 합성 짧은 WAV와 격리 DB/주입 HTTP 증거는 실제 음악 생성·두 사용자·청취 인수와 구분한다.

## 2026-10-13 개인 대표 Sample 업로드·오디오 검증 준비

POST /api/me/voice-sample-upload는 {size,sha256,contentType}와 Idempotency-Key를 받는다. Auth의 실제 UUID→본인 목적의 ieum_prepare_profile_sample_upload RPC→private Storage byte 검사/없는 원본의 no-upsert 서명 순서다. 기존 Profile/Part가 없어도 초기 Setup 원본을 준비할 수 있으며 사용자 ID/purpose/음역/features/검증 성공 입력은 거부한다. 개인 Sample intent는 Project upload intent와 별도 테이블·키 공간이다. opaque 원본 UUID는 기존 Storage adapter를 재사용하고 API bearer를 Storage에 전달하지 않는다.

POST /api/me/voice-sample-verify는 {uploadIntentId}만 받는다. 본인 ieum_get_owned_profile_sample_upload 조회→실제 Storage 원본 hash/MIME/크기·해독→service-only ieum_confirm_profile_sample_audio RPC의 immutable receipt를 연결했다. 권한 확인 전에 Storage를 읽지 않는다. 기존 IEUM_AUDIO_DECODER_PATH/IEUM_AUDIO_MAX_DECODE_SECONDS server-only 설정을 재사용하며 decoder/분석 version·실제 frame 길이를 저장한다. 기존 receipt 재시도는 새 decoder 없이도 byte 재검사 후 같은 길이/version을 유지한다. Sample 원본 유실이면 재서명/덮어쓰기로 조용히 복구하지 않는다.

상태는 uploadStatus(바이트 전송), audioVerification(실제 format/길이 해독), sampleVerification(대표 Sample/Profile 등록)을 구분한다. 현재 마지막 상태는 pending이다. decoded-pcm-v1은 길이 검증이며 음색·음역 분석 version이나 Identity 생성 성공이 아니다. 원본 검증만으로 기존 대표 Sample·측정 음역·성향·Identity/Track/Mix를 변경하지 않는다. 실제 Profile 등록에는 측정 출처·대표 Sample 분석/참조·revision을 연결하는 별도 transaction이 남아 있다.

profile_sample_uploads→profile_sample_receipts 순서로 migration을 적용한다. 실제 원격에는 적용하지 않았고 App 바인딩/Google 연결/hosted decoder도 미완료다. 로컬 실제 AAC + 격리 SQL·주입 HTTP의 검증 성공/재시도/권한/DB 실패와 관련 Project 해독·제출 회귀는 통과했지만 실제 원격 사용자·청취 인수 증거는 아니다. 새 화면/측정 과제·자동 시연 데이터 업로드는 추가하지 않았다.

## 2026-10-13 Profile 원본 revision 이력

project_participation 다음에 profile_source_history migration을 적용한다. ieum_profile_voice_sources는 현재 Part Fit용 source이며 새 private history는(user_id,source_revision)별 전체 원본 참조를 보존한다. 기존행 backfill/현재행 insert·update의 snapshot은 같은 transaction이고 같은 revision 내용 변경은409 rollback이다. 시각 값은 실제 verified_at을 UTC microseconds로 직렬화하며 새 검증 시각을 만들지 않는다. authenticated/anon은 이력에 접근하지 않고 service_role도 SELECT만 가능하다. 쓰기는 현재 source의 trusted write trigger에 한정한다. 원격에는 적용하지 않았다.

이는 기존 source 출처 보존의 선행 작업이다. 실제 등록은 개인 측정/대표 Sample과 Project 제출 Track의 목적·원본·분석 경계를 유지해야 한다. 클라이언트 hash는 무변경 증거이며 서버 음성 분석 성공 증거가 아니다. Profile 생성·Sample 분석·Identity 생성·제출·Mix의 상태를 혼동하지 않고 갱신/fallback 정책은 아직 미정이다. 이력에는 개인 UUID/private object ID가 있으므로 공개 URL/시각 metadata/API에 그대로 반환하지 않는다.

## 2026-10-13 Workspace 제출 원본 재조회 준비

GET projects/:id/tracks는 본인 Auth bearer로 ieum_list_project_tracks를 호출한다. private 원본은 확정 Workspace 참여자 범위로 기본 거부/허용하고 아직 초대 후보·공개 방문자에게 원본 URL을 확장하지 않는다.02/초대의 미리듣기와07 공개 공유는 별도 Preview/Result Mix 계약을 유지한다. 실제 제출과 확인된 audio receipt만 목록으로 반환하고 Project 잠금/Source/revision/제출수 일치를 확인한다. server Storage가 원본을 재검증한 뒤600초 operational read URL을 준비하며 secret/user bearer는 URL에 넣지 않는다. expiresIn은 파일 접근 수명이며 Product7일 알림 정책과 무관하다. [공식 signed URL 구현](https://github.com/supabase/storage-js/blob/master/src/packages/StorageFileApi.ts)의 signedURL 응답 형식을 확인했다.

client loadRemoteProjectTracks는 explicit Storage origin과 aggregate maxTotalBytes 예산을 받아 기존 engine의 Blobs로 반환한다. URL/token을 local Track metadata로 남기거나 IndexedDB/시연 자료를 자동 변경하지 않는다. session 변경/원본 불일치/예산 초과는 실패하며 실제 UI 연결/청취 성공으로 처리하지 않는다. 현재 준비 코드이며 원격 환경과 App 바인딩은 미완료다.

## 확정된 서비스 결정과 접근 대기

2026-10-13 사용자 경계 준비: createServiceSession은 기존 remote transport 위에서 실제 지원 capability→검증된 me/session UUID를 확인한다. token은 저장하지 않으며 stateKey는 기존 local key와 다른 remote 사용자 범위다. disconnect는 세션 revision만 바꾸고 데이터/원본을 지우지 않는다. session.run의 보호된 transport는 요청 전/실제 전송 시/응답 뒤 revision을 확인한다. 이미 전송된 변경의 취소를 보장하지 않으므로 서버 idempotency와 실제 확정 응답이 계속 필요하다. 이전 사용자 응답을 새 사용자 상태로 적용하지 않는다.

transferAndSubmitTrack({session,...})은 같은 검증 사용자에게 속한 take.userId만 전송한다. upload 중 session 변경이면 submit을 막고 원본·uploadKey/submissionKey를 유지한다. 실제 서버 capability가 preparation이면 연결을 활성화하지 않고 local로 조용히 우회하지 않는다. 현재 App은 기존 local 모드이며 Google OAuth/기존 진입 복귀와 전체 remote source 바인딩을 아직 활성화하지 않았다. 이번 모듈은 별도 앱/로그인 화면을 만들거나 local 데이터 자동 이관 정책을 확정하지 않는다.

사용자 답변은 기존 서비스 없음→구성안 준비, Google 로그인 우선이다. 같은 계정·프로젝트 존재 여부나 접근 요청을 반복하지 않는다. 실제 Supabase/Google OAuth 연결 수단은 외부 의존성으로 대기하며 새 정보가 제공되었을 때만 확인한다. 접근 없이 가능한 기존 DB/API 준비를 진행하고 실제 계정 생성·서비스 연결 완료와 구분한다. 비용0원 및 완료 보장 없는 무료 크레딧 시험 금지도 유지한다.

## 원본 오디오 해독 경계

현행 HTTP 연결 준비: tracks 요청은 본인 bearer로 ieum_get_owned_upload를 호출해 DB의 본인 Project/Part/intent/원본 정보를 얻는다. 조회 권한/응답 일치 확인 후에만 private Storage를 읽는다. 미확정 원본은 실제 해독→service-only receipt RPC→사용자 권한 제출로 처리하고 이미 확정된 receipt는 원본 byte/hash를 재검사해 확정 길이를 사용한다. POST tracks의 duration은 클라이언트 선언값이며 결과 duration은 서버 확정값이다. syncOffsetMs는 확정 길이 범위 안에서 다시 검사한다. 이전 helper-only/HTTP 미연결 문단은 당시 기록이다. 실제 remote 환경/App 연결 완료와 구분한다.

IEUM_AUDIO_DECODER_PATH와 IEUM_AUDIO_MAX_DECODE_SECONDS는 비어 있는 server-only 실행 설정이다. hosted 환경과 운영 자원 한도를 확인한 뒤 설정해야 하며 임의 기본 경로나 로컬 Windows binary를 자동 적용하지 않는다. secret key는 privileged receipt 요청의 apikey에만, 사용자의 bearer는 본인 lookup/submit에만 전달한다. 키별 Postgres 역할 구분은 [Supabase 공식 API key 문서](https://supabase.com/docs/guides/getting-started/api-keys)로 확인했으며 실제 gateway/원격 호출 성공은 아직 확인하지 않았다.

2026-10-13 receipt 연결 준비: 해독 결과는 실제 executable SHA256/FFmpeg version을 포함한다. verifyOwnedOriginalAudio는 인증/본인 DB 조회에서 얻은 context에 대해서만 내부 worker에서 호출하고 실제 Storage 검증 결과를 service-only ieum_confirm_original_audio RPC로 확정한다. 새 audio_receipt에는 바이트/hash/MIME와 frame/sampleRate/실제 duration·analysis/decoder version/hash를 보존한다. RPC는 Project→intent 잠금, 소유자/배정/원본 식별 정보 일치, 첫 녹음 잠금과 상태를 재검사한다. 검증 success는 Track/Mix를 생성하지 않는다. 같은 receipt만 재시도 가능하며 다른 검증 결과는 충돌로 남긴다. 이는 Identity 알고리즘 갱신 정책을 확정하는 변경이 아니다. 공개 HTTP 경계/hosted runtime은 아직 연결하지 않았으므로 클라이언트가 이 context를 직접 제출하거나 service credential을 받지 않는다.

verifyOriginalAudio는 기존 private Storage 원본의 byte/hash 검증을 재사용하고 서버 TEMP 사본을 실제 decoder로 해독한다. decodeOriginalAudio의 executable/filePath는 신뢰된 서버 설정/사본 경로이며 브라우저 입력 URL이나 실행 명령을 허용하지 않는다. WebM DocType/MP4 ftyp/WAV header와 실제 오디오 해독을 확인한다. PCM frame을 세며 RAM에 누적하지 않고 decoder stdout/stderr를 사용자에게 노출하지 않는다. [FFmpeg의 stream 선택·해독 문서](https://ffmpeg.org/ffmpeg.html)를 참고했다.

현재는 로컬 FFmpeg7.1로 기술 검증한 worker helper이며 Vercel용 binary/runtime은 준비되지 않았다. Windows 로컬 executable을 배포 설정이나 repository 자산으로 옮기지 않는다. maxDurationSeconds는 호출자가 확정 원본/서비스 한도에 맞춰 제공해야 하는 기술 제한으로 신규 녹음 길이 정책을 의미하지 않는다. 반환 analysisVersion=decoded-pcm-v1은 길이 계산 규칙 버전이며 실제 decoder binary/version·hash를 보존하는 receipt와 별개다. 제출 verified_at/duration을 쓰거나 capability를 true로 만들지 않는다. 실제 서버 runtime과 trusted receipt 연결 후 원본 재검증·권한·실제 제출을 검증해야 한다.

## 2026-10-13 R3 권한 확인 후 원본 업로드 준비

기존 project-lifecycle Function의 POST `projects/:id/parts/:partId/upload-intents`에 `{size,sha256,contentType}`와 Idempotency-Key를 연결했다. 인증·DB/Storage 설정 확인→배정된 본인 Part/첫 녹음 잠금의 SQL 확인→opaque 원본 ID 할당→비공개 Storage 원본 검사→없으면 no-upsert 서명 URL을 준비한다. API bearer는 Auth/본인 RPC에만 전달하고 Storage는 server-only secret을 사용한다. 준비 성공은 Track·Mix·Layer 생성이 아니다. 기존 transferAndSubmitTrack/signed uploader 계약을 재사용하며 App에 아직 연결하지 않는다.

`20261013_track_uploads.sql`의 사용자+upload key unique와 행/작업 잠금은 원본 ID를 안정되게 유지한다. 같은 키의 파일 hash/크기/MIME 또는 Project/Part 변경은409, 다른 사용자의 Part는403이다. 최초 Track 제출 후에도 원래 intent는 재조회 가능해 성공 응답 유실 시 기존 제출 재시도를 막지 않는다. 새 intent나 원본 재검증 실패는 제출로 확정하지 않는다. 원격 migration/실제 원본 쓰기는 수행하지 않았다.

응답 `uploadStatus:'verified',verifiedFile`은 현재 Storage의 바이트·hash·크기·MIME가 일치한다는 증거이며 재업로드만 생략한다. 별도 `submissionVerification:'pending'|'verified'`는 DB의 실제 duration을 포함한 제출 검증 상태다. 바이트만 확인한 경우 SQL verified_at/verified_duration을 쓰지 않고 pending을 유지한다. 준비 재시도에서도 Storage를 재검사하며 이미 검증된 intent의 원본이 없거나 바뀌면409를 반환한다. 실제 오디오 포맷/길이 검증과 trusted receipt 기록을 연결하기 전에는 정상 제출 완료로 사용할 수 없다. WebM/MP4 등을 WAV-only로 축소하지 않았으며 오디오 MIME metadata를 처리하는 준비 경계일 뿐 실제 디코딩 지원 완료가 아니다.

`qa:track-upload-db`는 권한·안정된 원본 ID·키/파일 변경 충돌·준비의0Track/0Mix·검증값 위조 거부·제출 후 재조회·익명 거부를 실제 격리 PostgreSQL로 확인한다. `qa:track-upload-api`는 주입 Auth/RPC/Storage의 서명 순서·비공개/no-upsert·스트림 hash 재검사·두 검증 상태 분리·원본 유실/불일치·미설정/잘못된 입력·Storage에 API bearer 미전달을 확인한다. 기존 Project API 회귀와 build도 검증한다. 실제 Google/DB/Storage·원본 duration 검증·App 연결과 전체 R3/R4는 미완료다.

## 2026-10-13 R3 곡 기반 Project 생성·Part Fit 참여 준비

기존 project-lifecycle Function에 POST `/api/projects`와 POST `/api/projects/:id/parts/:partId/join`을 추가했다. 생성 입력은 `{arrangementId,ownerPartId}`, 참여 입력은 `{}`이며 둘 다 Idempotency-Key를 사용한다. 클라이언트가 사용자 ID·Part 음역·eligible·Track 수·프로젝트 Seed를 지정하지 않는다. 준비된 remote transport의 createProject/joinPart 경로를 재사용하며 App의 기존 로컬 흐름은 아직 연결/이관하지 않았다.

`20261013_project_participation.sql`은 검증된 곡·Key별 audioSourceRef/실제2–4 Part를 저장하는 catalog_arrangements, 개인 측정·대표 Sample의 원본 hash/revision/analysis version·private object 참조를 저장하는 profile_voice_sources, 최초 요청 결과를 보관하는 operation_results를 추가한다. 이 source 테이블에는 authenticated/anon 직접 접근 권한이 없으며 검증된 서버 ingestion만 쓸 수 있다. 원격 자료는 아직 등록하지 않았고 시연 곡·고정 사용자·임의 음역을 실제 자료로 채우지 않는다. catalog revision은 같은 ID의 UPDATE를 막으며 새 검증 revision은 다른 ID로 등록한다. 이는 오디오 catalog의 버전 규칙이며 Voice Identicon의 미정 갱신 정책을 확정하는 것이 아니다.

생성 RPC는 auth.uid()·저장된 Profile 원본·곡의 선택 Part Fit을 확인하고 서버 Project ID/Seed·Owner를 저장한다. 생성자 Part만 ready, 나머지는 OPEN, Track0이며 아직 Key 잠금은 없다. 참여 RPC는 Project/Part를 잠그고 현재 상태·OPEN·실제 음역/주 음역대 적합성을 확인한 뒤 배정만 확정한다. 성향/Identity 상태는 Gate 입력이 아니다. 같은 요청 키는 최초 성공 응답을 유지하고 키를 다른 대상에 재사용하면409다. 실패/경쟁에서는 자리·Track·Mix가 늘지 않는다. 현재 SQL 경쟁 검증은 격리된 한 DB connection이며 실제 두 사용자/동시 connection 검증은 원격 연결 후 수행한다.

`qa:project-participation-db`는 세 migration을 순서대로 실제 PostgreSQL PGlite에 적용하고2/3/4 Part 생성·OPEN/0Track·원본 version 보존·누락 Profile/기존 배정 거부·재시도·기존 matching.evaluatePartFit의 음역/comfortableRange/tessitura 판정 일치·직접 source 변경 차단을 확인한다. API QA는 생성/참여·위조 payload 거부·안전한 PROFILE_REQUIRED/PART_FIT_FAILED 안내 코드와 root rewrite 계약을 추가 검증한다. 실제 Google/Supabase·catalog ingestion·측정/Sample 등록·upload 검증·Key 조정 API·초대 경쟁 정리·App 연결은 미완료다. Owner는 저장하되 초대를 Owner 전용 권한으로 제한하지 않는다. 기존 로컬 기능/문서 이력과 미정 디자인·Identity 정책을 보존한다.

## 2026-10-13 R3 공유 Project·제출·Mix 저장 경계

`20261013_project_tracks.sql`은 Project·실제 Part·upload intent·확정 Track·Mix job의 준비 스키마/RPC다. 원격에 적용하거나 실제 곡·사용자를 등록하지 않았다. 인증 사용자의 GET Project, POST `projects/:id/parts/:partId/recording-start`, POST `projects/:id/parts/:partId/tracks`를 하나의 project-lifecycle Function과 제한된 rewrite로 연결한다. 기존 Track 제출 transport의 JSON metadata와 Idempotency-Key를 받으며 클라이언트 사용자 ID/검증 완료 주장은 거부한다. 초기 Project 생성/Part Fit 참여·초대/API 업로드 준비·실제 DB/App 연결은 아직 없다.

첫 녹음 시작 요청은 본인 배정 Part를 확인하고 Key·곡/반주 참조·Seed·Part 구성 잠금을 저장한다. 제출은 Project 행 잠금→배정·2–4 실제 Part·잠금 확인→원본 intent 소유자/Part/검증 receipt·실제 검증 duration 확인→Track 확정→필수 전원 제출 시 Mix job 하나를 같은 트랜잭션에서 수행한다. 단순 배정/업로드 준비/그래픽 상태는 Track을 늘리지 않는다. 실패하면 확정되지 않으며 로컬 원본 삭제를 요청하지 않는다. 최초 성공 응답을 저장해 같은 키·원본·metadata 재시도에 그대로 반환한다. 현재 상태는 별도 GET으로 갱신한다.

원본 intent verified_at/verified_duration은 브라우저가 변경할 수 없다. 기존 Storage.verifyOriginal의 파일 존재·크기·hash·MIME 검증에 실제 오디오 duration 검사까지 연결하는 trusted server 경계가 선행돼야 한다. 클라이언트 features는 client_features에 보존하며 서버 검증 분석으로 표시하지 않는다. 현재 receipt 생성/원격 파일 검증 API가 없어 준비 RPC를 실제 제출 성공으로 사용할 수 없다. 시연 음원/임의 hash로 운영 테이블을 채우지 않는다.

마지막 제출은 lifecycle=mixing/queued job으로만 바뀐다. 실패 job은 completed가 아니며, 실제 저장 Mix 원본을 검증한 서버만 complete_verified_mix RPC를 실행할 수 있다. Track snapshot/반주 계보·결과 hash/duration을 확인한 트랜잭션만 completed로 전환하며 동일 결과 재확정은 중복하지 않는다. 원격 Mix worker·실제 결과 파일 검증·결과 조회/공유는 미연결이다. 그래픽 generation/Identity는 이 트랜잭션의 성공 판정이 아니다.

`qa:project-track-db`는 격리 PostgreSQL PGlite의2/3/4 Part·본인 배정·미검증 원본 거부·Key/구성 잠금·최초 결과 재사용·마지막 제출 한 job·실패 Mix 미완료·서버 전용 결과 확정/재시도와 접근 거부를 확인한다. `qa:project-lifecycle-api`는 주입 Auth/RPC·rewrite 경로·metadata/오류/응답 검사를 확인한다. 실제 Google 사용자·Supabase·Storage·다중 connection 경쟁·물리 녹음 증거가 아니다. 앱/capabilities는 기존 로컬·preparation 상태를 유지한다. Vercel의 [Web handler·공유 Function/rewrite 안내](https://vercel.com/docs/functions/runtimes/node-js)를 적용했으며 Production의 실제 rewrite 확인은 push 이후 검사한다.

## 2026-10-13 R3 개인 저장 목록 DB·API 준비

기존 transport의 `listSavedObjects/saveObject` 계약에 맞춰 GET/PUT `/api/me/saves`를 준비했다. PUT 입력은 `{type:'project'|'vocal'|'song',objectId,saved:boolean}`이며 사용자 ID는 입력받지 않는다. GET은 `{saves:[{type,objectId,savedAt}]}`, PUT은 해당 객체의 `{type,objectId,saved,savedAt}`를 반환한다. private/no-store와 검증된 bearer 기반 RPC를 사용하고 미인증401·미설정503·잘못된 입력400·상류 실패503을 구분한다. 성공 응답의 대상/상태/시간을 확인하기 전 성공으로 표시하지 않는다.

`20261013_saved_objects.sql`은 사용자·종류·객체 ID의 복합 기본키, 본인 SELECT RLS, 직접 쓰기/익명 접근 차단 및 auth.uid() 기반 저장/해제 RPC를 제공한다. 같은 객체의 반복 저장은 행이나 savedAt을 늘리지 않고, 없는 항목의 반복 해제도 안전하다. 세 종류는 같은 ID라도 별개이며 Profile의 preferredSongIds, 참여, Track, Mix를 변경하지 않는다. 저장 참조가 실제 대상의 존재·열람 권한을 부여하지 않는다. Project/후보 조회 서비스 연결 시 대상 존재와 접근 가능성 검증이 추가로 필요하다. 여러 요청의 순서는 DB 처리 순서이며 다중 기기 동시성은 실제 연결 후 검증한다.

`qa:saves`는 주입 HTTP 계약/입력/개인정보 제외/실패 응답 검사, `qa:saves-db`는 기존 격리 PGlite 런타임에서 실제 SQL·두 Auth 문맥·종류 독립성·반복 저장/해제·성향 보존·RLS 거부를 검사한다. 원격 migration·실제 Google 로그인·App 연결은 수행하지 않았으며 capabilities는 false다. 기존 로컬 Bookmark를 자동 이관하지 않는다. DB 엔진은 앱 dependency에 추가하지 않았다.

## 2026-10-13 R3 Profile DB·API 준비 구현

사용자 답변은 기존 서비스 없음/구성안 준비, Google 로그인 우선이다. 기존 계정/프로젝트를 다시 찾도록 같은 질문을 반복하지 않는다. 계정 생성·실제 프로젝트 설정은 수행하지 않았으며 준비 코드를 실제 연결 성공으로 표시하지 않는다.

기존 Vercel Functions에 GET/PATCH /api/me/profile을 준비했다. GET은 `{profile:null,revision:0}` 또는 본인 저장 Profile과 편집 revision을 반환한다. PATCH는 `{expectedRevision,roles?,genres?,taste?,preferredSongIds?}`를 받으며 성향 필드만 부분 갱신한다. expectedRevision은 직전 GET의 revision이다. 기존 transport의 getProfile/saveProfile 경로를 재사용할 수 있으나 App에는 아직 연결하지 않았다. 이번 PATCH는 음역·Sample 원본 업로드/분석·Identity 갱신을 지원하지 않으며 해당 필드를 보내면400으로 거부한다. Profile 객체 존재만으로 측정 완료/참여 가능을 판정하면 안 된다.

server/migrations/20261013_voice_profiles.sql은 선택한 Supabase 프로젝트에 적용할 신규 migration이다. 실제 auth.users에 연결된 ieum_profiles 행, 본인 SELECT RLS, 직접 쓰기/익명 접근 차단과 auth.uid() 기반 제한된 RPC를 제공한다. 사용자 ID를 PATCH 입력으로 받지 않고 검증된 사용자 bearer+publishable key를 사용한다. 성향 갱신은 행 잠금/expectedRevision 비교→해당 키만 병합→revision 증가를 동일 트랜잭션에서 처리한다. 충돌409/실패 시 성공 응답 없이 기존값 유지, 빈 선택 배열 저장 가능, 누락 키 유지, 중복 선택 정리다. 편집 revision은 음성 원본의 voiceSourceRevision/analysis/generator version과 별개이며 성향 저장으로 기존 음역·Sample·Identity를 바꾸지 않는다. 표/함수/권한의 실제 원격 적용은 아직 하지 않았다.

서버 설정 IEUM_DB_PROVIDER=supabase와 기존 Auth 설정은 migration 적용 후에만 사용한다. 값이 없으면 인증 누락401 또는 서비스 미설정503이다. capabilities는 모두false를 유지한다. 세션·DB 응답은 private/no-store, 상류 오류/토큰/URL은 응답에 기록하지 않는다. PATCH JSON64KiB 제한은 전송 metadata의 크기 제한이며 선택 개수의 최소/최대 정책이 아니다. 기존 로컬/시연 데이터를 자동 이관하지 않는다.

검증: npm run qa:profile-service는 인증/RPC 계약·revision 충돌·성향 필드 제한·빈 선택·실패/응답 검증의 주입 HTTP 시험이다. npm run qa:profile-db는 IEUM_PGLITE_ROOT가 가리키는 별도 QA 런타임(@electric-sql/pglite0.5.9)에서 migration SQL을 실제 실행한다. 두 테스트 Auth 문맥·본인 행 RLS·익명/직접 쓰기 거부·동일revision1승자·음역/Sample/Identity 보존·잘못된 입력을 확인했다. 실제 Supabase 역할/Google OAuth/다중 DB connection 검증은 아니며 실제 프로젝트 연결 후 같은 allow/deny·경쟁 조건을 다시 검증해야 한다. 앱 dependency에 DB 엔진/Docker를 추가하지 않는다.

근거: [Supabase RLS와 grants](https://supabase.com/docs/guides/database/postgres/row-level-security), [Database RPC와 definer 권한](https://supabase.com/docs/guides/database/functions). SECURITY DEFINER는 빈 search_path·명시 schema·auth.uid() 소유자 조건·public/anon execute 해제로 제한한다. 실제 서비스 접근 이후 migration 적용→두 실제 사용자→측정 Profile/원본 업로드→App session/transport 연결 순서로 R3 잔여를 진행한다.

## 2026-10-12 로그인 방식 확정 — Google 우선

사용자가 실제 서버 연결 질문에 `Google 로그인 우선`으로 답했다. 준비된 Supabase 구성안의 우선 로그인 방식은 Google로 확정한다. 이메일/Magic Link를 기본 방식으로 추가하지 않는다. 제공자 자원 생성·계정 접근·로그인 UI 배치·실제 OAuth 연결 성공은 이 답변으로 완료 처리하지 않는다.

다음 R3 연결 작업은 실제 Supabase 프로젝트 접근과 Google OAuth 설정 수단을 확보한 뒤 진행한다. Production과 개발 redirect를 구분하고 실제 로그인·콜백·로그아웃·재접속 및 서버 session 검증을 확인한다. 기존 탐색/곡 감상 전에 로그인이나 Voice Profile을 강제하지 않는다. 두 실제 사용자의 권한·공유 DB·Storage 검증 전에는 capabilities를 true로 바꾸지 않는다. 비밀키는 채팅/Git에 기록하지 않는다.

아래 날짜별 기록의 로그인 미정 표현은 당시 상태이며, 현재 우선 방식은 이 결정이 대체한다. 서비스는 아직 미연결이다.

### Google 연결 준비와 검증 순서

2026-10-12 [Supabase Google 공식 문서](https://supabase.com/docs/guides/auth/social-login/auth-google)와 [PKCE 공식 문서](https://supabase.com/docs/guides/auth/sessions/pkce-flow)를 확인했다. 기존 Vite React는 Next.js로 전환하지 않는다. 기존 서버의 `/auth/v1/user` 검증은 유지하고, 브라우저 OAuth는 공식 Supabase SDK를 통한 경로로 준비한다. 임의 JWT 파싱이나 수동 Google token 교환으로 로그인 성공을 만들지 않는다. 아래는 실행 준비안이며 외부 설정 완료 증거가 아니다.

1. 실제 Google Cloud 프로젝트의 OAuth audience/branding과 Web application client를 확인한다. 기본 로그인 scope는 openid/email/profile만 사용하며 Drive·Gmail 접근을 추가하지 않는다. Client Secret은 Supabase Google provider 설정에만 전달하고 앱 bundle/Git/채팅에 넣지 않는다.
2. Google OAuth의 authorized redirect URI에는 실제 Supabase 프로젝트의 `/auth/v1/callback` URL을 등록한다. 이는 IEUM 앱의 로그인 복귀 주소와 다르다. 실제 project ref 없이 임의 callback을 만들어 등록하지 않는다.
3. Supabase Site URL은 현재 Production origin `https://ieum-v2-react.vercel.app`을 기준으로 준비하고 앱 복귀 URL을 별도 allow list에 등록한다. 개발/Preview는 실제 사용하는 주소만 구분해 등록한다. 현재 앱은 hash navigation을 사용하므로 code/query 처리와 기존 화면 복귀가 충돌하지 않는지 확인한 뒤 callback 경로를 정한다. Production allow list에 무제한 wildcard를 넣지 않는다.
4. 공식 SDK의 Google `signInWithOAuth` 및 PKCE code exchange를 기존 앱 session 경계에 연결한다. PKCE verifier가 있는 동일 브라우저에서 교환하며 callback 중복 처리·거절·오류·재접속·로그아웃을 검증한다. 원격 사용자 ID로 전환할 때 기존 시연 Profile/Draft를 자동으로 이관하거나 다른 계정에 노출하지 않는다.
5. 서로 다른 두 실제 Google 계정으로 서버 `/api/me/session`의 사용자 분리, 만료/잘못된 token 거부, RLS/Storage 권한을 검증한다. mock SDK 성공·OAuth 설정 저장만으로 실제 로그인 완료를 판정하지 않는다. Google provider token은 일반 협업 API에 보내지 않으며 필요한 Supabase session token과 구분한다.

현재 확보되지 않은 실행 수단: Supabase 프로젝트 접근, Google Cloud OAuth client 설정 권한, 실제 provider 설정. 로그인 UI의 최신 제품 명세는 Notion 전용 도구로 확인해야 하며 현재 해당 도구가 노출되지 않아 읽었다고 주장하지 않는다. 기존 React 사용자/session 연결은 위 외부 수단과 명세 확보 후 수행한다.

## 2026-10-11 R3 실제 서비스 구성안 — 준비 완료, 제공자 미확정

사용자는 기존 서비스가 없으며 구성안을 준비하라고 답했다. 아래는 검토 가능한 추천안이며 계정/서비스 생성·연결 성공·사용자 확정으로 기록하지 않는다. 기존 Vite React와 Vercel Git Integration을 유지한다. 새 앱, 로컬 DB/Docker 상주, 로컬 대형 모델을 추가하지 않는다.

### 추천 구성

| 역할 | 제안 | 현재 코드 연결 지점 |
| --- | --- | --- |
| 프런트엔드 | 현재 Vercel 배포 그대로 | src/App.jsx/기존4탭·녹음·Mix |
| 사용자 인증 | Supabase Auth | CURRENT_USER_ID를 실제 세션 사용자로 연결. 탐색/감상 전에 로그인·Profile을 강제하지 않음 |
| 공유 데이터 | Supabase Postgres + RLS | projectModel/voiceIdentityContract와 기존 projectService 계약 |
| 원본 오디오·대표 Sample·확정 결과 | Supabase private Storage, 권한 확인된 signed URL | trackStore 로컬 Draft 유지, 제출 파일/결과 공유만 원격 |
| HTTP 경계 | 같은 Vercel 프로젝트의 Node Functions /api | 기존 remote transport; native React 앱 유지 |
| 7일 안내 | DB due 상태 + 인증된 scheduled 함수 + Web Push | 활동/revision·기간별 dedupe, 기존08 badge/03 banner |
| AI 생성 | 별도 기술 검증 경로 | Auth/DB 서비스를 음악 생성 GPU로 간주하지 않음 |

추천 이유: 인증·Postgres·파일 저장을 한 제공자에 묶어 세 서비스를 따로 구현/연결하는 작업을 줄이고 PC에 서버를 상주시키지 않는다. 비교안은 Neon DB + 별도 Auth + Blob이지만 계정/권한/파일 연계가 늘어난다. 2026-10-12 사용자 답변으로 Google 로그인 우선은 확정했고 연결 UI는 아직 미정이다. 이메일 Magic Link는 우선 방식으로 선택되지 않았다. 추후 선택할 경우 기본 메일 발송을 일반 사용자용 SMTP 준비 완료로 간주하지 않는다. [Supabase React/Auth](https://supabase.com/docs/guides/getting-started/tutorials/with-react), [메일 제공 조건](https://supabase.com/docs/guides/auth/auth-smtp).

### 비용·배포 제약

2026-10-11 공식 가격표 기준 Supabase Free는 $0/월, DB500MB·파일1GB·egress5GB이며 비활동1주 후 pause될 수 있다. 초기 두 사용자 검증 후보이고 서비스 운영 용량/가용성 보장은 아니다. 기존 Vercel 플랜과 사용량도 연결 전 확인한다. 자동 유료 전환·별도 유료 Mix API는 도입하지 않는다. [Supabase 가격](https://supabase.com/pricing).

Vercel Function 요청/응답4.5MB 제한 때문에 원본 WAV를 기존 multipart 요청 그대로 Function에 보내는 안은 채택하지 않는다. 인증된 upload 준비→Storage 직접 업로드→파일 존재/소유자/크기/hash 검증→메타데이터 제출 확정의 계약으로 수정한다. 업로드만으로 제출수/Layer/Mix가 증가하지 않는다. [Vercel payload 제한](https://vercel.com/docs/functions/limitations), [Supabase signed upload](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl).

Vercel Hobby Cron은 하루1회 제약이 있으므로 이를 정확히7일 시각에 발송된다고 표시하지 않는다. 요구하는 발송 정밀도를 만족하는 scheduler를 연결/검증하기 전 Push 완료 판정 금지. [Cron 운영 제한](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

### 데이터·권한 준비안

- profiles/profile_revisions: 실제 auth user 연결, range/sample의 독립 source/revision·분석 출처. 사용자 원문 ID를 공개 그래픽 URL에 넣지 않음.
- projects/project_parts: 기존 seed, song/audio reference, 실제2–4 Part, key lock, revision, assigned user, lastValidActivityAt. owner 전용 초대 권한으로 축소하지 않음.
- tracks/upload_intents: 개인 Track ID/Part/파일 참조·실제 duration/offset·hash/identity revision. 프로젝트+Part 최종 제출 unique. upload_intent는 진행률에서 제외. 원본/임시본은 제출 성공 응답 전 보존.
- invitations: 발신/수신 사용자·Project/Part·sent/accepted/declined/closed. accept 시 Part row lock→OPEN 및 수신자/fit 재검사→배정+경쟁 초대 closed를 동일 DB transaction. decline은 해당 초대만 변경. Profile 저장/초대 수락으로 Track 생성 없음.
- operation_results: 실제 사용자+operation+idempotency key unique, 재요청에 최초 확정 결과 반환. 임의 클라이언트 participantId로 권한 판정하지 않음.
- results/mix_jobs: 확정 Track snapshot/revision·실제파일/hash/duration·processing status. 마지막 필수 제출 성공 후 하나의 Mix job. 기존 native Mix를 재사용하되 파일 저장/검증 성공 이후에만 completed. 브라우저 Mix와 서버 job의 실행 소유/중복 방지는 연결 단계에서 검증하며 무거운 서버 Mix 제공자를 확정했다고 주장하지 않음.
- saved_objects/push_subscriptions/notification_runs: 사용자별 객체 독립 저장, 실제 subscription, 사용자+Project+활동기간 dedupe. 참여/탈퇴/원본 삭제와 분리.
- identity_artifacts/track_layers: 기존 G1–G5 입력·analysis/generator version·확정 결과 참조. Profile 저장/그래픽 생성/Track 제출/Mix 성공을 독립 보존.

RLS는 모든 사용자 데이터에서 기본 거부하고 본인/Project 권한별 허용한다. 원본/대표 Sample bucket은 private, 공개 결과에는 필요한 Credits/완성 Mix만 제공한다. signed URL/token/서비스 키를 로그나 공개 metadata에 출력하지 않는다. service secret은 Vercel 서버 환경에만, publishable key도 RLS 없는 권한으로 사용하지 않는다. [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Storage 권한](https://supabase.com/docs/guides/storage/security/access-control).

### 실제 연결 실행 순서와 완료 조건

1. Google 로그인 우선 결정을 적용하고 제공자·계정 접근·무료 quota/운영 범위를 확인한다. 원격 자원 생성은 이 구성안 기준의 승인/실제 접근 수단 확보 후 실행.
2. 기존 repo에 DB migration/RLS·Storage 권한·API를 작성하고 두 실제 사용자 allow/deny/동시성 테스트. 로컬 Docker/PyTorch를 QA 전제로 추가하지 않음.
3. App 사용자/session 경계와 기존 transport 연결. 시연 로컬 자료를 사용자 원격 Track으로 자동 업로드하지 않음. 기존 Draft·음원·디자인 worktree 보존.
4. upload/submit/join/invitation transaction→마지막 제출/Mix job→실제 result file 검증을 순차 연결. invalid JWT/다른 사용자/중복 제출/동시 수락/업로드 성공 후 DB 실패에도 원본 보존 확인.
5. 두 사용자·다른 기기 result 재접속·실제 Push/활동 dedupe 검증 후 capabilities를 각각 true로 판정. 미지원 항목은 false 유지.

현재 준비 상태: 구조/연결 순서와 제한 검토 완료. 실제 Supabase 프로젝트/credentials/DB/Storage/API/Auth/Push는 생성·연결하지 않았다. 새 로그인 UX·공유 권한 미정 정책은 추천을 확정으로 바꾸지 않는다.

2026-10-07. 준비 단계이며 실제 서버 연결 완료를 의미하지 않는다. 기존 React 앱의 화면·Record·녹음 엔진을 공유한다. 서비스 연결을 위한 별도 앱은 만들지 않는다.

## 현재 상태

기존 React/Vite를 유지한다. 현재 `api/capabilities.js` 및 `api/me/session.js`와 선택적인 server/Auth/Storage adapter가 있으며 공유 DB·실제 인증 계정·Object Storage·Push는 연결되지 않았다. `.env.example`에는 빈 server-only 설정 이름만 있고 실제 값을 저장하지 않았다. 외부 계정의 존재 여부는 프로젝트 파일로 판단할 수 없다. IndexedDB Track와 localStorage 상태는 같은 기기의 로컬 데이터다. 과거의 api/가 비어 있다는 날짜별 기록은 당시 상태다.

`src/projectService.js`는 로컬 상태 읽기/쓰기와 Track 접근 경계, 명시적인 HTTP transport를 제공한다. 외부 서비스 주소를 자동 선정하거나 원격으로 조용히 전환하지 않는다. 원격 transport 생성 자체는 접속을 수행하지 않으며 성공 표시를 만들지 않는다. 실제 서버를 정하고 인증 토큰 공급 함수를 연결한 이후 `discover()`로 서버 응답을 확인해야 한다. 현재 UI가 모두 원격 transport에 연결된 상태도 아니다.

## 공유 모델

서버와 로컬 모델은 같은 userId/projectId/partId/songId/seed를 사용한다. Profile의 측정 음역과 대표 음성 샘플은 별개다. Part의 배정과 Track 제출도 별개다. 제출된 Track만 진행률과 Record Layer에 포함한다.

- Project: id, songId, seed, partIds(2–4), parts, key, keyLockedAt, lifecycle, lastValidActivityAt, revision.
- Part: id, assignedUserId, requiredRange, status. 초대 대기 중에도 OPEN을 유지한다.
- Track: id, projectId, partId, participantId, 원본 파일 참조, duration, syncOffsetMs, features, layer, origin, submittedAt.
- Invitation: id, projectId, partId, senderId, recipientId, status(sent/accepted/declined/closed), revision.
- Draft: userId/projectId/partId, 원본 Blob, guideSettings, timeline, duration. 기기 간 동기화를 약속하지 않으며 로컬 임시 저장을 유지한다.
- Mix/Result: resultId, projectId, submittedTrackIds, processingStatus, audioFileRef, actualDuration, finalKey, credits, completedAt.
- SavedObject: userId, type(project/vocal/song), objectId, savedAt. 참여·Track와 독립적이다.

## 제안 HTTP 계약

아래는 실제 서버가 구현해야 할 계약이다. 현재 존재하는 엔드포인트 목록이 아니다. 제공자가 정해지면 실제 서버와 함께 검증하고 필요한 경로를 맞춘다. 모든 변경 요청은 인증 사용자로 권한을 판단하며 클라이언트의 participantId를 신뢰하지 않는다. CORS는 앱 origin과 Authorization/Idempotency-Key 헤더를 허용해야 한다.

| 메서드·경로 | 요구 동작 |
|---|---|
| GET capabilities | public. sharedProjects/authenticated/publicResults/push/aiVoiceLayers 실제 지원 여부, 계약 버전 반환 |
| GET me/session | Auth 서버가 검증한 사용자 ID만 반환. 미인증401·미설정503, private/no-store. 클라이언트 ID를 신뢰하지 않음 |
| GET/PATCH me/profile | 본인 Profile 조회·부분 수정. 기존 값은 저장 성공 전 유지 |
| GET projects/:id | 공유 Project, 배정, 제출 수와 revision |
| POST projects | 곡 기반 2–4 Part, 작성자 배정, 나머지 OPEN, 제출 0개 |
| POST projects/:id/parts/:partId/join | 음역 Gate와 OPEN 확인, 원자적 자리 배정 |
| GET projects/:id/tracks | 실제 제출 Track 메타데이터·권한 있는 파일 URL |
| POST projects/:id/parts/:partId/upload-intents | 원본 hash/size/MIME와 인증/Part 확인. 준비 성공만으로 제출수 증가 없음 |
| POST projects/:id/parts/:partId/tracks | Vercel 경로는 uploadIntentId+metadata JSON. 서버 파일·소유자/hash 검증 및 맡은 Part 확인 후 DB 제출 확정. 기존 multipart transport는 호환용으로만 보존 |
| GET me/invitations | 실제 수신 초대 조회 |
| POST projects/:id/invitations | 확정 참여자만 OPEN Part에 후보 초대, 자리 배정 없음 |
| POST invitations/:id/response | 본인 수신 초대 accept/decline, 첫 유효 accept 배정과 나머지 closed를 같은 트랜잭션에서 처리 |
| GET results/:resultId | 공유 정책 범위 내 공개 Result·Credits·재생 URL 조회 |
| GET/PUT me/saves | project/vocal/song 저장 종류를 독립 유지 |
| POST me/push-subscriptions | 본인의 실제 구독 저장, 서버 활동 기간별 중복 발송 방지 |

생성·참여·초대·응답·제출에는 재시도에도 같은 `Idempotency-Key`를 사용한다. 서버는 사용자+키별 결과를 보관하고 중복 Track/자리 배정을 막는다. HTTP409는 이미 배정된 자리 등 충돌이며 임시 녹음 원본을 삭제하지 않는다. 제출 성공 응답이 있어야 로컬 제출수·Record·임시본 삭제를 확정한다. 미지원·미설정 서비스는 성공한 것처럼 응답하지 않는다.

파일 URL은 로컬 blob URL을 다른 기기에 공유하지 않는다. 서버가 반환한 제한된 접근 URL 또는 명시적 공유 Result URL을 사용한다. 믹싱 중 이탈하면 결과 데이터만 갱신하며 다른 화면을 강제로 빼앗지 않는다. 서버의 원자성·권한·저장·실제 Push는 클라이언트 코드만으로 보장할 수 없다.

## 완료 전 남은 작업

실제 서비스 제공 환경, 인증 방식, 파일 저장·공유 정책을 확인한 뒤 서버 구현과 UI transport 연결을 수행해야 한다. 별도 요청 없이 계정 생성·유료 서비스·배포를 수행하지 않는다. 두 사용자와 동시 수락, 다른 환경의 결과 URL, 앱 종료 중 Push를 검증해야 연결 완료다.

AI Voice Layer는 FFT 수식과 다르다. 모델·가중치·추론 런타임·모바일 비용·같은 음성 재현성과 다른 음성 구별이 아직 검증되지 않았다. 제공곡/가사/반주 타임코드와 실제 iOS·Android 마이크/Guide 지연 역시 별도 검증이 필요하다.

검증: `node qa/verify-project-service.mjs`. 테스트는 주입한 HTTP stub으로 인증 누락·주소 검증·충돌·중복 방지 키·로컬 저장 오류 전파를 확인한다. 실제 서버 연결 증거로 사용하지 않는다.

## 2026-10-08 읽기 전용 실제 연결 확인

Vercel project `prj_eowHNSo22vKNulK4a2LFYzQnAYj1`의 Git 연결은 github/ieum-v2-react, productionBranch main이다. 환경변수 목록 API의 결과는 0개였다. 값은 출력하거나 변경하지 않았다. 저장소 api에는 구현 파일이 없고 .env.example은 주석만 있다. `.vercel/project.json`은 현재 저장소에 없다. 이 사실만으로 외부 계정 자체가 없다고 판단하지 않는다. 인증/DB/파일 저장/AI 서버 endpoint의 실제 제공 환경은 아직 확인되지 않았다. 계정 생성·서비스 설치·원격 설정 변경은 수행하지 않았다.

P0 실제 모델 기술 검증과 기존 Record의 검증된 출력 표시 연결은 현재 상태 문서에 기록되어 있다. 이 문서의 과거 ‘모델 미검증’ 표현은 그 기술 검증 이전 상태이며, 실제 production 추론 서비스 연결은 계속 미완료다.

## 2026-10-11 직접 업로드 transport 준비

`prepareTrackUpload(projectId,partId,{size,contentType,sha256},key)`는 파일 metadata로 upload-intents를 요청한다. `submitUploadedTrack(projectId,partId,{uploadIntentId,duration,syncOffsetMs,features,projectSeed},key)`는 원본 Blob 없이 JSON 확정 제출을 요청한다. 서로 다른 idempotency 키를 사용하며 업로드 준비 성공은 제출 성공이 아니다. 실제 signed upload 실행/서버 intent 검증/권한/DB transaction/마지막 Mix/UI 연결은 미구현이다. 기존 multipart 경로는 별도 transport 호환으로 보존하며 Vercel 경로에 연결하지 않았다. Stub 계약 QA 통과만으로 capabilities를 true로 바꾸지 않는다.

`src/trackTransfer.js`의 `transferAndSubmitTrack`은 실제 Blob hash→prepare→주입한 uploadOriginal→submit을 순차 처리한다. provider adapter는 업로드 성공 확인 시에만 `{uploaded:true}`를 반환해야 한다. 업로드 intent 응답은 `uploadIntentId`가 필수이며 서버가 원본/소유자/hash를 독립 검증해야 한다. 제출 실패 시 원본과 안정된 uploadKey/submissionKey를 유지해 재시도한다. 이 모듈은 로컬 Draft를 삭제하거나 응답의 제출 성공을 임의 판정하지 않는다. 실제 provider adapter/보안/DB transaction/검증된 제출 응답과 App 연결이 남아 있다. 단위·transport/격리 IndexedDB 회귀는 기본 `npm run qa`에 포함했다.

## 2026-10-12 인증·Storage 준비 코드와 실제 연결 경계

선택적인 Supabase adapter 코드는 작성했으나 제공자/로그인 방식을 확정하거나 원격 자원을 생성하지 않았다. `IEUM_AUTH_PROVIDER`, `IEUM_SUPABASE_URL`, `IEUM_SUPABASE_PUBLISHABLE_KEY`는 Auth 검증용 서버 설정이다. `IEUM_STORAGE_PROVIDER`, `IEUM_SUPABASE_SECRET_KEY`, `IEUM_AUDIO_BUCKET`은 private Storage 서버 전용이다. 빈 값은 미연결이며 실제 값은 Git/채팅/브라우저 VITE_ 환경에 두지 않는다. Preview에 Production credential을 복제하지 않는다. 환경을 읽기/변경/설치하는 작업은 수행하지 않았다.

- `GET /api/capabilities`: 현재 preparation/모든capabilityfalse. endpoint 존재·환경변수 존재·session 코드만으로 실제 공유 서비스 완료를 표시하지 않음.
- `GET /api/me/session`: 로그인 방식 선택과 독립적인 인증 검증 코드. Bearer 누락401, 서비스 미설정503. Auth /user가 확인한 id만 응답, 이메일/키/서명URL 미포함. [공식 getUser](https://supabase.com/docs/reference/javascript/auth-getuser).
- `createSupabaseSignedAudioUploader({storageOrigin})`: 같은 허용origin의 signedUploadUrl에 원본PUT; API token/cookies/referrer/redirect 전달 없음. [공식 서명 업로드](https://supabase.com/docs/reference/javascript/storage-from-uploadtosignedurl).
- `createSupabaseAudioStorage`: private bucket 확인, 별도로 할당한 opaque object ID의 no-upsert 서명 URL 준비·실제 스트림 해시/크기/MIME essence 검증. secret key는 apikey에만 사용하고 브라우저에 보내지 않음. 사용자·Part·intent 권한을 확인한 서버 경계에서만 호출해야 함. [공식 API key](https://supabase.com/docs/guides/getting-started/api-keys), [공식 Storage 소스](https://github.com/supabase/storage-js/blob/master/src/packages/StorageFileApi.ts).
- 업로드 준비가 기존 파일을 재검증했다면 `{uploadIntentId,uploadStatus:'verified',verifiedFile:{sha256,size,contentType}}`로 응답할 수 있음. 정확히 같은 원본 receipt일 때만 재업로드를 건너뜀. 파일 존재나 클라이언트 uploaded=true만으로 이 응답을 만들면 안 됨.

기본 QA13 suites와 `npm run qa:service-http`의 loopback5MB 전송은 실제 외부서비스 성공이 아니다. [Vercel Node Web handler](https://vercel.com/docs/functions/runtimes/node-js)를 기존 Vite 프로젝트의 api/에 사용한다. 로그인 UI/App 실제 사용자 경계·권한/RLS/DB transaction·실제 bucket quota·두 사용자 allow/deny/동시성·Mix job/result/Push는 계속 남아 있다.
