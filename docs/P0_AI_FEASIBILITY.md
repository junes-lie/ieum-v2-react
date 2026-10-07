# 단계 1 P0 사전 조사 — 2026-10-08

상태: 사전 조사. 실제 모델 추론 미실행, 단계 1 완료 아님. 제품 범위 변경이나 모델 채택 결정이 아니다.

## 실제 확인

- src/voiceAnalysis.js의 buildVoiceLayer는 음성 분석 특징을 그래픽 파라미터에 매핑하는 계산식이다. 학습 모델 추론이 아니다.
- projectService 로컬 capabilities.aiVoiceLayers=false, App의 Voice Identity는 모델 미연결로 표시한다.
- .env.example에는 모델/API 설정이 없다.
- 현재 python의 torch/diffusers/transformers/onnxruntime 설치 여부 조회는 모두 false였다. 다른 Python 환경이 없다는 의미는 아니다.
- public의 오디오는 demo-stems의 합성 WAV 3개다. 이 범위에서 실제 사람 보컬 및 모델 weight 파일은 발견하지 못했다. 사용자 브라우저의 개인 녹음은 조사/전송하지 않았다.
- Win32_VideoController 조회는 ‘클라이언트에서 CIM 리소스에 대한 액세스를 사용할 수 없습니다.’로 실패했다. GPU 종류나 가용 메모리는 미확인이다.

## 공식 자료로 확인한 후보 경로

- [Transformers CLAP](https://huggingface.co/docs/transformers/model_doc/clap): 오디오 embedding을 제공한다. 사람 음색의 구별이나 AI Voice Layer 생성 품질이 이 앱에 적합하다는 증거는 아직 없다. embedding만 생성해 그림을 계산식으로 그리는 것은 확정된 생성형 요구 전체를 충족했다고 볼 수 없다.
- [Diffusers 재현성](https://huggingface.co/docs/diffusers/v0.41.0/using-diffusers/reusing_seeds): seed/generator 제어를 지원하지만 실행 환경에 따른 차이가 있으므로 동일 환경 반복 추론과 결과 저장 계약이 필요하다. 단순 seed 설정만으로 모든 기기에서 동일 결과를 보장하지 않는다.

두 문서는 조사 후보의 기능 근거이며 모델을 선택하거나 라이선스를 승인한 기록이 아니다. 실제 weight의 model card/라이선스/입력 방식/메모리/시간/비용을 확인하기 전 설치·대용량 weight 다운로드·외부 음성 전송은 수행하지 않았다.

## 다음 gate

1. 실제 사용 가능한 생성 모델과 실행 환경을 선정하고 해당 weight 라이선스·비용을 확인한다. 실제 입력에 연결되는 conditioning을 설명해야 한다.
2. 사용 가능한 실제 보컬 입력을 확보한다. 합성 demo를 사람 음성으로 표시하지 않는다.
3. 실제 추론을 실행하여 같은 음성/seed 반복, 다른 음성 비교, 2–4 Layer 합성·기존 계보를 검증한다. 기존 실시간 WebGL을 정적 결과로 교체하지 않는다.
4. 모델/입력/설정/출력 lineage와 project/part/user 계약을 검증한다. 성공 전 단계 2 신규 구현으로 넘어가지 않는다.

현재 환경 미준비는 기술적으로 불가능하다는 결론이 아니다. 계산식 축소나 다른 AI 서비스 채택을 임의로 확정하지 않는다.
