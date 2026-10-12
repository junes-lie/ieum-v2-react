# 단일 앱 서비스 연결 계약

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
