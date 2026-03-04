# JavaScript Inspector Simulator 전환 계획 (Rewritten, 2026-03-04)

## 목적
- Playground JavaScript 시뮬레이터를 AST 계측 기반에서 Inspector(CDP) 기반으로 전환한다.
- 최우선 목표는 "정확도"가 아니라 **정확도 + 호환성 + 운영 안정성 동시 달성**이다.
- 프론트/백엔드 계약을 먼저 고정하고, 엔진 교체는 그 다음 단계로 진행한다.

---

## 현재 코드 기준 사실 (Plan Baseline)

1. 응답 계약 불일치가 존재한다.
- Backend는 `error: { code, message }`, `normalizedSteps`를 반환 가능
- Frontend JS client는 `error?: string`, `steps`만 기대

2. Normalizer의 frame 매칭이 취약하다.
- `methodName` 기반 매칭으로 재귀/동명 함수 케이스에서 이벤트 오염 가능

3. 취소 전파 체인이 끊겨 있다.
- Frontend `AbortController` 취소는 요청 취소까지만 보장
- Backend child 실행 종료와 강결합되어 있지 않음

4. JS 시뮬레이터 전용 회귀 테스트가 부족하다.
- 전환 전 골든 기준선이 없음

5. 보안 경계는 env 최소화 수준이고, Inspector 포트 노출 설계가 아직 없다.

---

## 비목표 (이번 전환에서 당장 안 하는 것)
- 레슨 JSON 포맷 전체 재설계
- 프론트 비주얼 컴포넌트 대개편
- JS 언어 전 스펙 100% 커버

---

## 아키텍처 원칙

1. 계약 우선
- 엔진 교체 전에 API 스키마를 단일화한다.

2. 이중 경로 안전 전환
- `legacy(ast)`와 `inspector(cdp)`를 feature flag로 병행 유지한다.

3. 관측가능성 기본 탑재
- 단계별 메트릭(실행시간, step수, timeout, abort, 에러코드)을 기록한다.

4. 회귀 방지 우선
- 골든 테스트/계약 테스트 통과 전 기본 엔진 승격 금지.

---

## 목표 계약 (Backend -> Frontend)

`POST /simulators/javascript/simulate` 응답을 아래로 고정한다.

```ts
interface JsSimulateResponse {
  success: boolean;
  engine: 'legacy' | 'inspector';
  steps: LessonStep[];            // 프론트가 바로 소비 가능
  normalizedSteps?: NormalizedJsStep[]; // 내부/디버깅/실험용
  error?: {
    code:
      | 'CODE_TOO_LONG'
      | 'DANGEROUS_CODE'
      | 'SYNTAX_ERROR'
      | 'TIMEOUT'
      | 'MAX_STEPS_EXCEEDED'
      | 'RUNTIME_ERROR'
      | 'INTERNAL_ERROR';
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    durationMs: number;
    stepCount: number;
    truncated?: boolean;
  };
}
```

규칙:
- `success=true`면 `steps`는 반드시 존재
- `success=false`면 `error`는 반드시 객체
- Frontend는 문자열 `error` 가정 금지

---

## 단계별 실행 계획

### Phase 0. 계약/안전성 선행 정리 (필수)

작업:
- Backend/Frontend JS 시뮬레이터 응답 스키마 단일화
- `error` 객체 표준화, 문자열 fallback 제거
- timeout 주석/실동작 값 불일치 정리
- 취소 처리 규약 정의 (abort 시 에러코드/메시지)

완료 기준:
- JS simulate 계약 테스트 통과
- 프론트에서 legacy/inspector 구분 없이 동일 파서로 처리
- abort/timeout/syntax/runtime 각각 일관된 에러 코드 확인

산출물:
- `packages/backend/.../javascript/routes|service`
- `packages/frontend/.../jsSimulator.ts`
- 계약 테스트 파일 신설

---

### Phase 1. 테스트 기준선 구축 (골든 최소셋)

작업:
- 최소 20개 골든 케이스 작성 (sync 12, async 5, error 3)
- 비교 항목 고정:
  - line sequence
  - stdout sequence
  - error.code/message
  - frame depth 변화

완료 기준:
- legacy 엔진으로 골든 스냅샷 확정
- CI에서 golden diff 리포트 생성

주의:
- 이 단계 완료 전 Inspector 기본 승격 금지

---

### Phase 2. Inspector 실행 뼈대 (Read-only stepping)

작업:
- `engine/inspector-runner.ts` 신설
  - child `node --inspect-brk=0` 실행
  - ws endpoint 획득
  - timeout/kill/cleanup
- `engine/inspector-client.ts` 신설
  - `Debugger.enable`, `Runtime.enable`
  - `Debugger.paused` 수신
  - `Debugger.stepOver` 루프
- source map 없이 단일 `main.js` 기준 line 매핑 확정

완료 기준:
- 단순 sync 코드에서 line/stack 수집 성공
- 프로세스 누수 0 (테스트 종료 후 child 없음)

---

### Phase 3. Snapshot Builder + Frame Identity 교정

작업:
- `engine/inspector-snapshot-builder.ts` 신설
- frame 식별키를 `methodName`에서 `frameId + functionLocation + depth` 조합으로 전환
- scopeChain 기반 변수 수집 (Local/Closure/Block/Script/Global)
- objectId 기반 heap 그래프 수집 및 truncate 메타 포함

완료 기준:
- 재귀/동명 함수 케이스에서 variable/frame 이벤트 일관성 확보
- 기존 normalizer 대비 오탐/누락 감소 확인

---

### Phase 4. Abort/Timeout/에러 체계 통합

작업:
- HTTP abort -> simulator run cancel -> inspector detach -> child kill 전파 구현
- timeout, max-step, runtime error 분류 고정
- 에러 메시지 사용자 친화화(코드 유지)

완료 기준:
- 수동 취소 시 child 잔존 0
- timeout 케이스에서 재현 가능하게 동일 코드 반환

---

### Phase 5. Async 정확도 확장

작업:
- `async/await`, Promise chain, `setTimeout` 대표 패턴 검증
- step ordering 규칙 명문화:
  - same tick 내 microtask 우선
  - macrotask 경계마다 frame/scope 안정성 검증
- 비결정성 테스트 방지 규칙(시간/랜덤 고정) 반영

완료 기준:
- async 골든 케이스 통과율 95%+
- known mismatch 목록 문서화

---

### Phase 6. 점진 승격/롤백 전략

작업:
- `JS_SIM_ENGINE=legacy|inspector` feature flag 유지
- dev/internal에서 inspector default
- 에러율/응답시간/취소율 모니터링

승격 게이트:
- 7일 연속 major regression 0
- p95 latency 허용 범위 내
- rollback 1-command 가능

---

## 테스트 전략 (현실형)

1) Contract Tests
- 응답 스키마, 에러 객체 형태, 필수 필드 검증

2) Golden Tests
- 개념군별 고정 입력/기대 출력 비교

3) Regression Gates
- PR마다 golden diff + 실패 케이스 아티팩트 저장

4) Soak Tests
- 긴 루프/큰 객체/중첩 closure/취소 반복 실행

---

## 리스크 레지스터 (업데이트)

1. API 회귀
- 대응: Phase 0 계약 통일 + 타입 공유

2. frame 매칭 오류
- 대응: frameId 기반 식별키 도입

3. Inspector 포트 보안
- 대응: localhost 바인딩, 수명 짧은 포트, 프로세스 종료 시 강제 정리

4. 취소 누락으로 누수
- 대응: abort 전파 체계 + e2e 취소 테스트

5. async 비결정성
- 대응: deterministic fixture + mismatch catalog 운영

---

## 즉시 실행 TODO (이번 사이클)

- [ ] Phase 0: JS simulate 응답 계약 통일 (`error` 객체 + `engine` + `meta`)
- [ ] Phase 0: frontend `jsSimulator.ts`를 객체형 에러 파서로 수정
- [ ] Phase 1: 골든 20케이스 최소셋 작성
- [ ] Phase 2: `inspector-runner.ts` / `inspector-client.ts` 스캐폴딩
- [ ] Phase 4: abort 전파 설계 문서 + PoC 구현

---

## 수용 기준 (Definition of Done)

- Playground JS 기본 엔진이 inspector여도 사용자 체감 회귀가 없어야 한다.
- 최소 요건:
  - 계약 테스트 100% 통과
  - 골든 통과율 95%+
  - 취소/타임아웃 누수 0
  - 치명 에러 발생 시 legacy 즉시 롤백 가능
