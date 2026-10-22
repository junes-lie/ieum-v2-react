# IEUM V2 통합 체크포인트 · 2026-10-23

## 완료
- 기준 원격 6cc024a. 〈오늘 같은 날〉은 기존 Song/Project ID·Seed·4-Part·참여자·원본 저장 데이터를 유지한다. 상세 슬라이드 두 카드와 Workspace/Recording 공명, 실제 AI 반주 22초·가사 3/11.2/16.96초·독립 가이드 보컬·볼륨을 보존한다.
- 사용자 최종 정정: 프로필 등록 완료 진입은 데모다. 음역·음색·선호 정보와 Part Fit 96%/프로젝트 조화 92% 및 후보 매칭 예시를 그대로 유지한다. 실제 직접 등록 Profile에는 데모 점수를 적용하지 않는다.
- Figma 전용 도구로 최신 1803:72333 및 Search 1396:30802를 재조회. Compact Workspace의 불필요한 보컬 찾기 버튼을 제거해 v2-part-actions에는 제출 Track의 Mix 토글만 남겼다. OPEN 매듭·이름 영역에서 기존 보컬 찾기 진입을 유지하며 추가 카드/버튼/구분선은 만들지 않았다.
- Workspace·Finder는 하단 PROJECTS 활성, 생성 화면은 HOME 활성으로 화면 문맥을 보정. Detail·공개 완성곡은 진입 탭을 유지한다. iframe 390/430의 활성 탭과 Back 경로를 검사했다.
- 전체 Node QA, 변경 후 통합 QA, 프로필/음원 계약 및 빌드 통과. iframe 390/430 Search→Detail→Workspace→Finder/Recording의 최상단·앱 Back·브라우저 Back·검색어 보존 검수 통과.
- 390/430에서 합성 마이크로 음역·별도 Voice Sample 직접 등록→같은 Detail 복귀→분석값/원본 출처 해시 새로고침 보존→참여 통과. Part Fit과 실제 참여자 데이터 부족 사유를 분리하고 가짜 실사용 점수/Track을 만들지 않음.
- 유지 중인 격리 음악 A/B QA에서 390과 430 각각 실제 22초 반주·가사·일시정지/재개·Review·직접 제출·Auto Mix·22초 완성곡 재생/복원 통과. 재생 중 토글 변경은 이전 재생을 멈추고 선택된 Track만 새 미리듣기로 생성하며 원본/최종 Mix를 보존한다. 이는 기존 4-Part 전체 완성이나 실사용 다중 사용자 검증이 아니다.
- 네 개의 서로 다른 native 마이크 녹음 원본으로 브라우저 DSP의 2/3/4 Track Auto Mix를 검사: 각각 22초·비무음·-3dBFS peak 제한·원본 해시 불변 통과. 이는 앱에서 네 사람이 제출한 협업 완료가 아닌 믹싱 엔진 검사다.
- 기존 Quartet 390에서 실제 22초 Guide/반주·가사·마이크 녹음→Review 재생→Tenor 제출/새로고침 원본 해시 보존 통과. 1/4를 임의로 4/4 완료 처리하지 않음.
- 수정 전 공개 Pages 6cc024a의 390/430 전체 진입 44개 화면 캡처 성공. 공개 두 공명 카드 및 데모 점수·미등록 분기도 별도 통과. 이번 변경의 Pages 제공 SHA는 새 build-info.json과 실제 번들 파일을 Actions 완료 후 대조한다.

## 미완료
- 430 음악 검사에서 캡처와 병행할 때 오디오 시계·Review 임시 저장 지연으로 제한 시간 실패. 캡처 중단 후 동일 기준의 직렬 430 검사는 통과했으나 원인·부하 안정성 해결로 단정하지 않는다. 이전 원본 길이 간헐 실패도 미해결로 유지.
- 기존 4-Part의 실제 네 참여자 전체 직접 녹음/제출→4/4 Auto Mix→완성곡 및 장시간 안정성. 원본/가짜 제출을 주입해 완료로 만들지 않는다.
- 실제 실사용 종합 매칭 % 산식/가중치는 Notion에서 미확정. 실제 음색 특징 비교·입력 부족 안내와 사용자 승인 데모 %는 구분한다.
- Figma 전체 픽셀·동적 공명 조형/모션 정합성, 물리 기기·이어폰 청취/마이크, 서버·실제 다중 사용자 인수는 미완료.

## 다음 시작점
- 최신 원격 HEAD·소유 잠금·실행 프로세스를 대조하고 사용자 수정/다른 실행을 보호한다. 본 코드 커밋의 Pages build/deploy 및 build-info.json의 SHA·번들·실제 390/430 변경 화면을 확인한다. 상태 성공만으로 실제 반영을 단정하지 않는다.
- 유지 QA: qa/verify-presentation-navigation-browser.mjs, qa/verify-profile-detail-browser.mjs(유성 WAV를 IEUM_QA_FAKE_AUDIO_FILE로 지정), qa/verify-detail-carousel-resonance-browser.mjs. 임시 근거는 /tmp/ieum-emergency-* 및 /tmp/ieum-resonance-restore-qa에 보존.
- 기존 자동 재개 6ada4a9f12308191a70215e282681098만 갱신했다. Asia/Seoul 10/23 08:00부터 매시간, 10/24 10:00까지. 새 예약/빈 배포/중복 Push/Vercel 수동 재배포 금지. main·공명 독립 브랜치·Production·Notion/Figma 원본을 보존한다.
