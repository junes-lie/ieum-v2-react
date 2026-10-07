# Git 동기화 전 독립 검증

2026-10-07. 사용자 첨부 Git/GitHub/Vercel 작업 지침을 읽고 최신 로컬 구현을 검증했다. 이 감사에서 Git stage/commit/push, 배포, 소스 편집, 브라우저 UI 또는 Computer Use를 실행하지 않았다. 검증 문서만 작성했다. Commit·push·자동배포 완료 여부는 담당자의 실제 후속 결과로 보완해야 한다.

## 실행 결과

| 확인 | 결과와 근거 |
|---|---|
| dependency install | `npm ls --depth=0` exit 0. React/ReactDOM 19.3.0, Vite 8.3.1, React plugin 6.1.1, Font Awesome 아이콘 7.3.1 및 React wrapper 3.5.0. devDependencies happy-dom 20.14.5와 fake-indexeddb 6.2.5도 정상. missing/invalid 출력 없음 |
| production build | `npm run build` 성공, 31 modules. JS `index-CdnTOndk.js`, CSS `index-BteeLf2-.css`. import/bundle 오류 없음 |
| 음역/오디오 기반 | `node qa/verify-audio-foundation.mjs` 성공. 음역·전조·metadata 없음·합산 피크·녹음/Guide 타임라인 |
| 저장 실패 처리 | `node qa/verify-track-store.mjs` 성공. IndexedDB success/error/abort/transaction throw/cleanup abort와 DB 정리 |
| 서비스 계약 | `node qa/verify-project-service.mjs` 성공. 인증 누락 차단·URL·idempotency·409. HTTP 응답은 stub |
| 기존 3화면 | `node qa/verify-single-app-render.mjs` 성공. 단일 App 초기 상태와 다른 곡/Key/3 Part Workspace/Recorder/Complete, 동적 Credits·audio source의 Node 렌더 |
| 음정 검출 | `node qa/verify-pitch-detector.mjs` 성공, 합성 입력 8/8 및 무음 거절 |
| Record 계보 | `node qa/verify-resonance-record.mjs` 성공. 동일 Track 결정성, 다른 Track 구분, 2→3→4 Layer 보존, 재현성 |
| 필요한 자산 | Node 파일 검증 성공. figmaAssets 28개 참조와 실제 Figma 파일 28개, fonts 4개, manifest 및 demo stems 3개, reference 등 중복 제외 38개 파일 nonzero. JSON 참조 누락 없음 |
| 임시 출력 | 테스트 종료 후 `.qa-single-app-*` 임시 변환 파일 0개 |

위 Node/수치 검증은 실제 물리 마이크, 브라우저 console, 모바일 시각·터치, 음질, 실제 서버 인증·공유·Push·동시 초대의 성공을 입증하지 않는다. Build가 console 오류 전체를 검증하지 않는다.

## 유지 QA와 실행 제외

최종 `npm run qa`는 유지하기로 한 7개 Node suite를 실행하여 모두 성공했다. 교체된 `qa/verify-user-journey.mjs`는 happy-dom + fake-indexeddb 격리 환경에서 실제 App React effect와 click/popstate를 실행한다. 기존 Blob·Layer·seed·Profile·Collection 복원, 임시본 Review→직접 제출→2/4에서 3/4→해당 임시본 정리, 탭과 scroll 복귀, 미리 저장한 4 Track/Mix 재마운트→Complete 6개 체크가 통과했고 포착한 App console error 배열은 비어 있었다.

이 통합 시험은 테스트 전용 GPU renderer/Current Mix preview, MediaElement play를 stub으로 대체하고 synthetic Blob과 저장된 final mix fixture를 사용한다. 실제 마이크 캡처·유효한 음원 디코딩·새 Auto Mix 완주·GPU·청취·시각·모바일 성공을 뜻하지 않는다. 실제 사용자 브라우저 저장소에 접근하지 않으며 테스트 DB 정리는 격리된 in-memory 저장소에만 적용한다.

`qa/verify-resonance-motion.mjs`는 Playwright로 Edge를 실행하고 특정 사용자 runtime 경로 및 localhost:4191을 가정한다. Computer Use/브라우저 UI 금지 정책에 따라 `npm run qa:motion`을 실행하지 않았다. `qa/run-journey.mjs`와 `qa/verify-resonance.mjs`는 교체된 journey wrapper이지만 최종 suite와 같은 통합 시험을 중복 실행하므로 별도로 실행하지 않았다.
C 코드 `qa/create-resonance-comparison.mjs`와 `qa/verify-figma-design.mjs`는 package 실행 항목이나 앱 imports에서 참조되지 않는다. README의 이력/한계 설명을 제외한 runtime 호출 참조를 찾지 못했다. 파일을 삭제하지 않고 로컬 참고로 보관하며 이번 commit에서 제외한다. `.gitignore`가 이 두 경로와 개별 일회성 산출물 경로만 제외하고 public/figma 또는 qa 전체를 제외하지 않는 것을 확인했다. 실제 추적 해제/최종 staged 목록은 root가 확인한다.

## 검토 메모

- 기존 `App.jsx` 단일 진입과 live WebGL Record를 유지한다. HTML/JSX imports는 build와 Node 렌더링으로 확인했다.
- 현재 UI는 localStorage/IndexedDB이며 HTTP transport 코드의 존재를 실제 서버 연결로 해석하지 않는다. AI 모델도 아직 미연결이다.
- 최초 공백 문제는 별도 담당자가 정리했고 최종 `git diff --check` 성공을 확인했다. 최종 staged 목록은 root가 확인한다.
- 사용자 변경이나 local 녹음 데이터를 삭제·초기화하지 않았다. 기존 삭제 API는 호출하지 않았다.

## 후속 실제 결과

현재 보고 시점에는 새 Git commit hash/message, origin/main push, local/remote HEAD 일치, 이번 commit의 Vercel Git Integration 자동배포가 아직 이 감사에서 확인되지 않았다. 임의 수동 배포로 자동배포 검증을 대체하지 않는다. 앞선 보정 production 배포 READY는 이번 Git commit 자동배포의 증거가 아니다.

추가 자산 기준: Figma 28개 파일을 filename 순서로 정렬하고 각 파일 SHA256을 결합한 집합 SHA256은 `029d88d28d4e7141396d6382fa15299dc9fce4ce21db3f18390118b84d3d4e22`다. 파일명 자체의 해시와 파일 내용 해시는 동일해야 하는 규칙이 아니며, 이 값은 현재 집합의 감사 기준점이다. 최종 `git diff --check`는 공백 보정 후 성공했다. AGENTS.md의 보존·명시적 stage·정상 push·Git Integration·Computer Use 금지·단계 순서 규칙을 읽었다.

최종 검증을 닫는다: npm ls 정상, npm run qa 7개 suite 성공, production build 31 modules 성공, diff --check 성공, 자산 28 Figma 참조/4 fonts/3 demo 음원 재확인, 임시 QA 모듈 0개. Git commit 이후 이 문서를 수정하지 않는다. 이후 commit/push/자동배포 결과는 root의 최종 응답으로 보고한다. dependency audit의 source-map-js 이슈는 별도 보고된 잔여 사항이며 임의 upgrade하지 않았다.
