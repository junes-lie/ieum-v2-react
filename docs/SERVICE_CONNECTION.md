# 단일 앱 서비스 연결 계약

2026-10-07. 준비 단계이며 실제 서버 연결 완료를 의미하지 않는다. 기존 React 앱의 화면·Record·녹음 엔진을 공유한다. 서비스 연결을 위한 별도 앱은 만들지 않는다.

## 현재 상태

React/Vite만 설치되어 있으며 `api/`는 비어 있다. 서버 인증·공유 DB·Object Storage·Push 스케줄러·AI 추론 모델은 현재 프로젝트에 없다. `.env.example`은 설명 주석만 있다. 외부 계정의 존재 여부는 프로젝트 파일로 판단할 수 없다. IndexedDB Track와 localStorage 상태는 같은 기기의 로컬 데이터다.

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
| GET/PATCH me/profile | 본인 Profile 조회·부분 수정. 기존 값은 저장 성공 전 유지 |
| GET projects/:id | 공유 Project, 배정, 제출 수와 revision |
| POST projects | 곡 기반 2–4 Part, 작성자 배정, 나머지 OPEN, 제출 0개 |
| POST projects/:id/parts/:partId/join | 음역 Gate와 OPEN 확인, 원자적 자리 배정 |
| GET projects/:id/tracks | 실제 제출 Track 메타데이터·권한 있는 파일 URL |
| POST projects/:id/parts/:partId/tracks | multipart audio+metadata, 맡은 Part 확인 후 파일 저장 성공과 제출 확정 |
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
