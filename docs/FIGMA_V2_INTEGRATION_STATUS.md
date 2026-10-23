# IEUM V2 통합 체크포인트 · 2026-10-24

## 완료
- 기준 `97ff11fe36fbe1fbd684b82352d38446e889c6e1`에서 실제 음역 적합 백분율을 연결했다. `evaluatePartFit.coveragePercent`는 현재 Key의 Part 요구 범위와 내 저장된 측정 범위의 반음 기준 포함 비율(양끝 포함)을 계산한다. 전체100/겹침없음0/정보없음null이며 측정 범위를 임의 확장하지 않는다. 캡처의 F♯3–D5 대 C3–G4는14/20=70%다. Detail의 ‘참고 비교’를 실제 퍼센트로 바꾸고 계산 의미를 표시했다. 기존 tessitura/참여 허용·실제 요구 음역·데모96%는 보존한다.
- 프로젝트↔사람 음색 계산의 값과 원시 입력을 `data-harmony-value/own-brightness/own-roughness/reference-brightness/reference-roughness/calculation`에 연결했다. 표시값을 임의80으로 고정하지 않는다. 기존 식은100×(1−밝기/거칠기 절대차 평균)이며 Node와 native 브라우저에서 저장 샘플 입력으로 재계산해 표시값과 대조한다. 역할은 등록 멜로디/화음과 선호 역할의 겹침100/0, 취향은 등록 곡/장르/명시 취향 비교다. 실제 음색이 없으면 종합은 없고 선택하지 않은 항목은 제외한다. 검증된AI·실력·합창 품질의 확률로 보고하지 않는다.
- 전용 Figma VP04 준비1883:44520/녹음중1883:44868의 최신 대형 Record·중앙 가사·우측 볼륨·하단 금속 조작을 기존 Recording 요소로 반영했다. Header72/배경y232·700/Record700×640/동일 준비·녹음 가사좌표/350패널·84.48중앙버튼·63.36보조버튼·44px볼륨 hit를 유지한다. 실제 pause/resume과 반주 볼륨0–100을 연결하고 초기 재생·재개·준비 반주에 같은 gain을 적용한다. 옵션이 없는 기존 Project Recording gain은1로 유지한다. 샘플에는 보컬 stem이 없으므로 ‘가이드 반주’로 표시하며 녹음 입력에 합성하지 않는다. Notion의 VP76px return-context탭을 유지해 패널은 탭 없는 Figma보다76px 위다. 전체 픽셀 일치로 확대하지 않는다.
- 최신 Review1950:48118은02:25 KST 전용 원본 재확인대로 세로8/상하12/이미지280×158.795·라벨13/19/상태15/22로 반영했다. 샘플 Player48의 버튼/seek 중심·좌우 시간을 정렬했다. 시연 청록 매듭을 유지하고 실제 생성은 준비 중임을 명시한다. VP06에 실제 저장한 역할·장르·취향/선택곡 요약을6/20/32 그룹으로 표시하고 원본에서 제거된 복귀 설명 카드는 제거했다. 미선택 항목의0 노출을 수정하고 단계 전환은 기존 공통 최상단 복귀를 재사용한다. 등록이 자동 Part 참여/제출을 만들지 않는다.
- 변경 관련 build/Node 음역·조화·반주 gain 검사와 로컬 native390/430 짧은 합성 마이크 흐름을 확인했다. 공개 확인은 배포 후 자기 완료 기록에 남긴다. 해당 VP 준비/녹음/일시정지/재개/반주 gain50→100 실제2배/Review청취·다시부르기취소/실제샘플저장/완료요약/Detail 실측퍼센트·음색원시입력 재계산/reload·원본SHA/Track0/참여없음만 검수한다. 전체QA/44캡처/전곡·물리마이크 검수로 확대하지 않는다. 기존 별도 stop-retry QA는 Windows Playwright 경로 오류로 시작하지 못했으며 통과로 계산하지 않는다.
- 기존 정정 보존: profile-ready 단일 진입, 자기청록·윤슬파랑/도윤코랄/Min크림·내Tenor오른쪽·직접 Review 제출 후에만 자기공명, 멤버/아이콘/공명수·작은공명 최소184raster/softlimit2.8, Home8/32·첫방문6초/하트, Detail체크#25211C/음역항상, Review금속/Player중심·모든Part토글·Back·원본데이터/실제Track청취우선. 준비3Track은 동일 보컬 재사용 시연 예시다. 제공MP3 9,177,424bytes/397.224초/SHA256 `1f2270ac18af16028e0a86488ce88898a652c5fa13895d4db18948acc5a4f4c4`는 변경하지 않았다. 이번 Push/Pages 파일SHA/공개검수와 자동Preview는 자기 완료 기록에서 대조한다.

## 미완료
- `overallProductAcceptance=false`. 참고 계산은 사람의 청감으로 검증된 조화 모델/서버AI가 아니다. 실제 독립4인/물리마이크·이어폰·공유/인증/Appremote/다중사용자·장시간 안정성 및 과거430 시작 timeout·길이 편차·MyVoice pointer/OpenParts Enter 지연은 미해결이다. 실제 기준 보컬이 없는 프로젝트에는 종합 지수를 만들지 않는다.
- 최신 Completed 금속/Smoky 버튼·Player/time와 기타 상태별 시각·모션 인수는 남았다. VP Review의 매듭은 제공 시연 미리보기이며 샘플 기반 실제 Identity 생성은 연결 전이다. 샘플 전체음원/반주를 보컬 stem으로 위장하지 않는다. CC0 독립 확인/정식 서비스의 적법 stem 확보는 미완료다.
- Preview 브라우저는 기존 외부 Sentry telemetry 내용/전송 승인 미확인 자동 검토 차단을 존중해 재실행하지 않는다. 읽기전용 정적 확인만 한다. 기존 전체 Node render의 fixture.parts 누락/PartFit 숨김 구기대도 전체 통과로 표시하지 않는다.

## 다음 시작점
- 최신 HEAD/owner/활성 실행을 대조한 뒤 최신 Completed 버튼/Player/time의 실제 차이부터 수정한다. 새 진입점·새 앱·수동 중복배포를 만들지 않는다. 이미 통과한 실측 퍼센트·프로젝트 비교·VP01~06·공명/멤버/음원/그룹을 회귀 근거 없이 반복 구현하지 않는다.
- 작업 `/workspace/scratch/cad8a99a0a38/ieum-focus`; 관련 QA `qa/verify-part-range-percent.mjs`, `qa/verify-vp-recorder-browser.mjs`, `qa/vp-registration-summary-assertions.mjs`; 근거 `/tmp/ieum-vp-scene-final-local`, 공개 후 `/tmp/ieum-vp-scene-public`. 자기 owner `automation-vp-recording-cad8a99a0a38-0205`만 완료 기록을 보존하고 해제한다.
