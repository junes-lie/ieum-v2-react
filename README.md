# IEUM V2 React

기존 `App.jsx`를 진입점으로 사용하는 단일 React 앱입니다. 작업실·녹음·완성곡 디자인은 기존 화면과 녹음/저장/Record 엔진에 통합합니다. `?design=figma`도 같은 앱을 실행하며 독립 Figma 앱을 선택하지 않습니다.

## 실행

```powershell
cd "C:\Users\LEE\Documents\AI\J영 새 프로젝트\레코드판\ieum-v2-react"
npm install
npm run dev
```

개발 주소는 `http://127.0.0.1:4187`입니다. 마이크는 localhost 또는 HTTPS에서 사용할 수 있습니다.

```powershell
npm run build
node qa/verify-audio-foundation.mjs
node qa/verify-project-service.mjs
node qa/verify-pitch-detector.mjs
node qa/verify-resonance-record.mjs
```

## 데이터와 서비스 상태

현재 로컬 데이터는 localStorage와 IndexedDB에 저장됩니다. 공유 서버·인증·원격 파일 저장·Push 스케줄러는 연결되지 않았습니다. `src/projectService.js`의 HTTP transport와 [서비스 연결 계약](docs/SERVICE_CONNECTION.md)은 연결을 준비하는 코드/계약이며 실제 서버 성공을 뜻하지 않습니다. 실제 서버를 연결할 때도 동일 앱의 화면을 사용합니다.

Voice Range는 마이크 음정 표본이며 Part 요구 음역의 Gate에 사용합니다. Voice Sample은 별도로 녹음하는 대표 음성입니다. 제출된 프로젝트 Track만 프로젝트 Record와 진행률에 포함합니다. 초대를 보내거나 수락하는 것만으로 녹음 Track을 만들지 않습니다.

초기 시연 Track은 `scripts/generate-demo-stems.mjs`가 생성한 비보컬 합성 fixture입니다. 실제 사람 녹음이나 서버 협업 결과가 아닙니다. 타인의 제출을 타이머로 만들어 실제 협업처럼 표시하지 않습니다.

## 디자인과 AI

Figma 원본 기준은 Desktop MCP로 읽은 `653:46`, `IEUM · 3화면 · 편집용 프레임`입니다. 원본 자산은 `public/figma/653-46`에 있습니다. 실제 프로젝트 Record는 기존 WebGL 렌더러와 제출 Track의 분석 특징을 사용합니다.

현재 Record는 FFT 특징에 조건화된 결정적 절차 시각화입니다. 생성형 AI 추론 모델과 가중치는 아직 연결되지 않았으며 AI 완료로 표시하지 않습니다.

## 검증 한계

Node 테스트는 음역 Gate, 입력 신호 처리, 타임라인, 출력 피크, Record 재현성과 HTTP adapter 계약을 확인합니다. HTTP adapter 테스트의 서버 응답은 stub입니다. 실제 서버 인증·원자적 초대 배정·원격 제출·공유·Push 성공을 검증하지 않습니다.

`npm run qa`는 7개 Node suite를 실행합니다. 사용자 여정은 happy-dom과 in-memory IndexedDB에서 실제 App의 복원·Review 제출·탭/scroll 복귀·저장된 Mix의 Complete 복원을 확인하도록 교체했습니다. GPU/Preview/음원 재생은 stub이고 녹음·Mix는 synthetic 저장 fixture이므로 실제 캡처·합성·청취 검증과 구분합니다. 폐기된 별도 Figma 시험은 로컬 참고로만 보관합니다. Computer Use 금지 정책에 따라 이번 실행에서 브라우저 UI 자동화를 사용하지 않습니다. 물리 마이크, 모바일 Safari/Chrome, 장시간 녹음, 기기 지연, 디자인의 시각 일치는 별도 검증이 필요합니다.

상세 범위와 남은 단계는 [구현 계획](docs/IMPLEMENTATION_PLAN_2026-10-07.md)을 참조하세요. 이후 배포는 [Git 작업 규칙](docs/GIT_WORKFLOW.md)에 따라 로컬 검증 → 명시적 commit → GitHub main push → Vercel Git Integration 자동배포 → production 검증 순서로 진행합니다. 수동 production 배포로 우회하지 않습니다.
