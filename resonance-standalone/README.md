# IEUM Resonance standalone

독립 작업 브랜치: `feature/resonance-standalone`. 기존 React 앱과 production은 수정하지 않습니다.

## 실행
`public/IEUM-Resonance.html`을 다운로드해서 브라우저로 엽니다. 네트워크 요청 없이 실행되며 오디오는 재생 버튼을 눌러 시작합니다. 파일은 기기에서만 처리됩니다.

## 개발 및 검증
Node 22 이상: `npm ci`, `npm run build`, `npm test`.
브라우저 QA: Playwright와 Chromium 설치 후 `npm run test:browser`.
별도 런타임은 IEUM_PLAYWRIGHT_PATH, IEUM_CHROMIUM_PATH, IEUM_CHROMIUM_ARGS 환경 변수로 지정합니다.

현재 단계와 실제 검증 결과, 미완성 항목은 PROGRESS.md에 기록합니다.
