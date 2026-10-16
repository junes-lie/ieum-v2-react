# IEUM — 선·입자 매듭 Resonance

독립 실행본 v0.4.0. `feature/resonance-standalone` / `resonance-standalone/`.
기존 React 앱, main, Notion, Figma, Vercel Production은 변경하지 않습니다.

## 바로 실행

`public/IEUM-Resonance.html` **파일 자체를 다운로드**해서 Chrome/Edge/Firefox의 브라우저 창에 엽니다. GitHub 소스 보기 화면에서는 실행되지 않습니다. 빌드 결과는 폰트·라이브러리를 포함한 단일 HTML이며 실행 중 네트워크 요청이 없습니다. WebGL과 Web Audio 지원이 필요합니다.

1. 기본 3명의 개인 매듭과 합성 공명을 확인합니다.
2. **함께하는 목소리**에서 1명(개인), 2명, 3명, 4명을 선택합니다. 제거한 참여자의 파일은 보존됩니다.
3. 카드의 매듭을 누르면 확대와 파라미터 설명을 볼 수 있습니다. SVG/프로필 JSON으로 저장할 수 있습니다.
4. **보컬 파일 +**로 반주 없는 녹음을 선택합니다. 분석 성공 후 그 사람의 개인 매듭과 공명 흔적이 함께 변합니다. 잘못된 파일은 기존 결과를 유지합니다.
5. **공명에서 보기**는 해당 결을 강조합니다. ◉는 시각 레이어만, ♪는 소리와 오디오 반응을 끕니다.
6. 재생/일시정지/탐색/반복/음량을 조작하고, 2D/3D 및 드래그로 교차와 높이를 비교합니다.
7. 표현 설정에서 입자·높이·흐름을 조절합니다. 하단 FPS는 현재 브라우저 프레임 시간으로 계산합니다.

데모 프로필과 합성 데모 사운드는 실제 사람의 보컬 분석 결과가 아닙니다. 업로드한 녹음은 기기 안에서만 처리하며 서버에 보내지 않습니다. 새로고침하면 파일과 분석 상태는 사라집니다. JSON 저장은 기록용이며 재가져오기 기능은 없습니다.

## 개발

Node 22 이상:

```sh
cd resonance-standalone
npm ci
npm run build
npm test
```

`src/index.html`과 ES modules를 편집한 후 빌드합니다. 배포 파일은 `public/IEUM-Resonance.html`입니다. 폰트 원본과 라이선스가 포함됩니다. 프로젝트 바깥의 React 앱이나 설정을 실행에 사용하지 않습니다.

## 브라우저 검증

별도로 Playwright와 Chromium을 설치한 환경에서:

```sh
npm run test:browser
npm run test:extended
npm run capture:motion
```

사용 중인 Playwright 모듈/브라우저가 다른 경로라면 `IEUM_PLAYWRIGHT_PATH`, `IEUM_CHROMIUM_PATH`, `IEUM_CHROMIUM_ARGS`(JSON 배열)를 지정합니다. 확장 검사는 기본 180초 연속 실행하며 `IEUM_SOAK_MS`로 시간을 바꿀 수 있습니다. Computer Use가 아니라 CLI Playwright로 실행한 자동 QA입니다.

## 파일 안내

- `src/profiles.js`: 결정적인 개인 매듭/레코드 경로
- `src/visuals.js`: 픽셀 선, 깊이, 입자, 접촉장, 2D/3D
- `src/audio.js`: 독립 음원 동기화와 실제 RMS/FFT 반응
- `src/analyze.js`: 보컬 파일의 기본 DSP 분석
- `qa/DATA_MAPPING.md`: 데이터의 의미와 한계, 제품 계약과의 차이
- `qa/index.html`: 승인 이미지와 실제 렌더/모션 비교
- `qa/*verification.json`: 실제 검사 결과 (baseline은 기존본)
- `PROGRESS.md`: 단계별 완료/미완료와 재개 지점

설치/빌드 성공이나 자동 검사 개수를 시각적 완성도의 증거로 간주하지 않습니다. 실제 기기 GPU/청취/사람 목소리 타당성 검증 상태는 진행 문서를 확인하세요.

## 복구 상태와 재개

2026-10-17 복구 완료. 원격 `29842c2`는 기존 중단 개선본과 정확히 같은 HTML 해시를 재현하고 분석 19개·브라우저 39개를 다시 통과한 체크포인트입니다. 이후 선 간격/굵기/미세 굴곡과 입자 산포를 보정했습니다. 현재 소스에 과거 복구 패치를 다시 적용하지 마세요. 추가 검증은 `node qa/final.cjs`, 10분 연속 검증은 `IEUM_SOAK_MS=600000 npm run test:extended`입니다.

최신 완료 범위와 미검증 항목은 `PROGRESS.md` 마지막 항목을 확인하세요. 테스트 통과는 기준 이미지와의 시각적 일치, 실제 사람 보컬 타당성 또는 실제 기기 성능 인증을 의미하지 않습니다.
