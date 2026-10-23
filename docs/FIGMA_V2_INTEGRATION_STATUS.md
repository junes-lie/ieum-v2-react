# IEUM V2 통합 체크포인트 · 2026-10-24

## 완료
- 기준 `3de232abccf67e00e39f4b171125488bf7571458`에서 프로젝트↔내 실제 Voice Profile 조화 계산을 연결했다. `matching.js`는 실제 제출 음성의 중복 제거 평균 또는 곡·Key·편곡·SHA가 일치하는 등록 보컬 가이드와 내 샘플의 밝기/거칠기 유사도를 계산한다. 사람별 비교 문구를 프로젝트 기준으로 바꿨다. 역할은 등록된 멜로디/화음 역할과 내 선호, 취향은 프로젝트 곡/장르/명시 취향과 내 선택을 비교한다. SATB 이름으로 음악적 역할을 추정하지 않는다.
- 계산식 `project-reference-indices-v1`: 음색=100×(1−밝기/거칠기 절대차 평균), 역할=등록 역할 교집합, 취향=등록 장르/취향 일치 비율 또는 직접 선택한 곡. 종합은 사용 가능한 항목의 같은 비중 평균이며 실제 음색 비교가 필수다. 선택하지 않은 선택 항목은 제외하고 n/3 범위를 표시한다. 0–100%는 설명 가능한 참고 지수이며 검증된 AI 판단·노래 실력·합창 품질의 예측 확률이 아니다. 무음/저레벨 및 3초 미만 자기 샘플·가짜/시연 분석·자기 제출 Track·오래된 편곡/다른 프로젝트는 종합 계산에서 제외한다.
- `projectHarmonySource.js`로 기존 등록 보컬 원본을 SHA 검증 후 브라우저에서 분석한다. 비동기 프로젝트 전환 소유권·캐시·실패 후 재시도를 지키고, 반주/완성 MP3를 보컬 기준으로 사용하지 않는다. `projectMusic.js`의 `harmonyVocalFile/Sha256`은 분석 전용이며 기존 Recording Guide 재생 설정을 바꾸지 않는다. 실제 Profile/Track 저장 형식과 원본 파일은 변경하지 않는다.
- Detail의 기존 막대/수치에 실제 계산과 근거를 연결했다. 기존 데모 96/92·91/95/89는 데모에만 유지한다. My Voice에서 분석 완료한 실제 샘플을 계속 ‘음색 분석 대기’로 표시하던 문구를 수정했다. 생성형 Voice Identity는 여전히 별도 준비 상태다.
- 최신 전용 Figma `1881:44202`를 다시 읽고 VP02 결과의 실제 측정 음역 가로 바를 복구했다. 라벨56/간격12/그래프최대358·내부축10/7px rail·9px fill/기존14px endpoint를 사용한다. 원래40px 음역값/그룹32를 유지한다. 샘플송과 음역만 저장은 52px 첫 행·간격12, 다시 측정은 48px 둘째 행·간격12다. 좁은 음역 경고를 제거하고 실제 표본 수/신뢰도는 접근성 이름으로 보존한다. 동일음 측정은 넓은 가짜 범위로 확장하지 않는다. 기존76px nav/하단24px·원래 복귀/샘플 선택/재측정/음역만 저장 출처를 유지한다.
- 관련 Node `verify-project-harmony.mjs`, `verify-project-harmony-source.mjs`와 build 통과. 실제 native 브라우저390/430에서 합성 마이크 짧은 샘플 등록→프로젝트 기준 음색/역할/취향/종합 표시→다른 프로젝트의 자료부족 분리→선호 수정 재계산→reload/원본샘플SHA/Track0/참여없음 보존을 확인했다. VP02 native390/430 측정/좌표/이미지·버튼·샘플 Back·재측정·음역저장/reload 및430 버튼200% 확대가 통과했다. 첫 조화 QA의 reload 대기는 `scene=first-visit`가 Home으로 복귀하는 기존 동작과 기대가 달랐으므로 같은 Home의 원래 프로젝트 진입을 통해 재확인했다. 앱 결함 해결로 보고하지 않는다. 전체QA/44캡처/전곡·물리검수는 반복하지 않았다.
- 기존 사용자 정정 보존: 단일 profile-ready 진입, 나/JISUN 청록·윤슬 파랑/도윤 코랄/Min 크림, 내 Tenor 오른쪽·직접 Review 제출 후에만 청록 공명, 멤버/아이콘/공명 수 동기화. 작은 공명 최소184px×DPR raster/softlimit2.8, Home8/32·원형문자6초/하트저장, Detail 체크#25211C/음역항상/Player 중심, Review 금속 캡슐, 모든 Part 토글·Back·원본데이터 보존. 준비3Track은 동일 기존 보컬 재사용 시연 예시다. 제공 MP3 SHA256 `1f2270ac18af16028e0a86488ce88898a652c5fa13895d4db18948acc5a4f4c4`·9,177,424bytes/397.224초·실제Track청취우선은 유지한다.
- 이번 Push의 Pages build/deploy·공개 build-info/SHA/실제 JS·CSS·변경화면과 Git 자동 Preview는 자기 완료 기록에서 대조한다. main·공명 독립 브랜치·Production·Notion/Figma 수정·수동 중복배포는 하지 않는다.

## 미완료
- `overallProductAcceptance=false`. 이번은 실제 브라우저 기본 음색 특징과 등록 정보에 근거한 프로젝트 참고 계산 연결이다. 사람의 청감으로 검증한 음색 조화 모델/서버AI·실제 독립4인/물리마이크·이어폰·공유/인증/Appremote/다중사용자·장시간 안정성 인수가 아니다. 과거430 녹음시작 timeout·길이 편차·MyVoice pointer 지연 및 공개open-parts Enter20초 지연은 미해결이다.
- 실제 음성 분석/등록 보컬 기준이 없는 프로젝트에는 종합 지수를 만들지 않는다. 역할 의미/선호가 없는 항목은 ‘—’이며, 다른 실제 프로젝트에도 적법한 보컬 기준과 역할 메타데이터를 등록해야 동일한 전체 계산을 제공할 수 있다.
- 최신 VP04 원본1883:44520/44868은 기존 Project Recording 장면과 같은 배경 Record/가사/하단 조작 구조로 다시 바뀌었다. 이번은 VP02 수정이며 VP04 신규 변경을 반영했다고 보고하지 않는다. Completed 버튼/Player·기타 상태별 최신 시각 차이와 전체 모션 인수도 남아 있다. 기존 VP01~06 초기 흐름을 다시 구현하지 않는다.
- CC0 독립 확인은 미완료다. 발표 완성 예시 음원은 정식 반주/원곡보컬 분리 또는 적법한 stem 확보를 대체하지 않는다. 실제4인 완성을 가짜 제출로 채우지 않는다.
- Preview 브라우저는 기존 외부 Sentry telemetry 내용/전송 승인 미확인으로 자동 승인 검토가 차단한 상태다. 해당 사유 해소 없이 재시도/우회하지 않으며 읽기전용 정적 배포 확인만 한다. 기존 Node 전체 render의 staticProject.parts fixture 누락/PartFit 숨김 구기대도 전체 통과로 표시하지 않는다.

## 다음 시작점
- 최신 HEAD/owner/활성 프로세스를 대조한 후 VP04 최신 편집가능 원본과 기존 Recording 레이아웃을 재사용해 실제 시각 차이를 수정한다. 샘플 전체음원과 반주를 보컬 stem으로 위장하거나 장식 Guide 슬라이더를 만들지 않는다. 이후 최신 Completed smoky 보조/금속 주요 버튼·Player/time 위치의 실제 차이를 확인한다.
- 계산을 사람↔사람 비교로 되돌리지 않는다. 실제 측정 없는 점수·데모 고정수치 유출을 막고 없는 프로젝트 기준 자료는 명시한다. 이미 완료한 VP02 가로음역/버튼2행, VP05A/06 초기 흐름, 공명 광량/멤버/음원/기존 그룹을 회귀 없이 반복하지 않는다.
- 작업 `/workspace/scratch/cad8a99a0a38/ieum-focus`; 관련 QA `qa/verify-project-harmony{,-source,-browser}.mjs`, `qa/verify-vp-latest-browser.mjs`; 근거 `/tmp/ieum-project-harmony-local`, `/tmp/ieum-vp-latest-local`, `/tmp/ieum-vp-latest-expanded`. 자기 owner `interactive-project-harmony-parallel-cad8a99a0a38`만 종료 기록으로 보존·해제한다.
