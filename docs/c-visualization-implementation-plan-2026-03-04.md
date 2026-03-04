# C Visualization Implementation Plan

Date: 2026-03-04
Owner: C-OSINE Visualization Team
Scope: C lessons (`packages/backend/prisma/content/c`) + Frontend visualizer pipeline

## 1) Objective

1. 메모리뷰로 표현 가능한 C 개념은 최대한 시각화로 구현한다.
2. 메모리뷰로 직접 표현하기 어려운 개념은 Concept View로 대체해 빈 화면을 제거한다.
3. 학습자가 모든 단계에서 "왜 지금 이렇게 보이는지"를 즉시 이해하도록 만든다.
4. 빈 배열/빈 객체를 "시각화 데이터 있음"으로 오판하지 않도록 데이터 유효성 게이트를 적용한다.

## 2) Current Baseline (2026-03-04)

1. C 커리큘럼 레슨 수: 59
2. 강점: stack/heap/pointer/frame 중심 시각화는 이미 안정적으로 동작
3. 갭: 전처리기/스트림/버퍼/파일 리소스 상태 등은 메모리 모델만으로 표현이 어려움
4. 레퍼런스 문서:
   - `docs/c-memory-view-coverage-gap-report.md`

## 3) Strategy

1. Dual Layer 전략
   - Memory-capable 단계: C Memory View 유지/강화
   - Concept-only 단계: Concept View 표시
2. Hybrid 단계 지원
   - 동일 step에서 메모리 상태 + 개념 상태를 동시에 보여줄 수 있게 구조 확장
3. No Empty Rule
   - 어떤 step에서도 빈 시각화 영역을 보여주지 않는다.
4. Empty-safe Inheritance Rule
   - `stack: []`, `heap: []` 같은 빈 상태는 "유효 시각화 데이터"로 취급하지 않는다.
   - 유효 데이터가 없는 step은 이전 유효 step 상태를 carry-forward 한다.

## 4) Phase Plan

### Phase 0 - Data Validity Gate (D+1)

목표: 빈 배열/빈 객체 오판정으로 발생하는 빈 시각화를 구조적으로 차단

1. `hasVisualizationData` 판정 강화
   - 배열 필드: 길이 > 0일 때만 유효
   - 객체 필드: 내부에 실제 payload가 있을 때만 유효
2. carry-forward 상속 로직 보정
   - 현재 step이 빈 payload면 이전 유효 step 상태를 상속
3. simulation 병합 판정 보정
   - "이미 시각화 데이터 존재" 체크에 동일 유효성 규칙 적용
4. 관련 코드 범위
   - `packages/frontend/src/features/courses/hooks/useLessonVisualization.ts`
   - `packages/frontend/src/features/courses/hooks/useRoundNavigation.ts`
   - `packages/frontend/src/features/courses/hooks/useLessonSimulation.ts`
5. 산출물
   - `docs/c-visualization-validity-gate-report-2026-03-04.md`

### Phase 1 - Lesson Classification (D+1)

목표: 레슨 59개를 시각화 가능성 기준으로 분류

1. 분류 라벨 정의
   - `memory_capable`
   - `concept_only`
   - `hybrid`
2. 레슨별 라벨링 및 근거 기록
3. 산출물
   - `docs/c-lesson-visualization-mapping-2026-03-04.md`

### Phase 2 - Memory View Coverage Expansion (D+3~5)

목표: 메모리뷰로 표현 가능한 개념은 최대한 구현

우선순위 구현 항목:
1. 함수 포인터/콜백 시각화 강화
2. 이중 포인터/동적 2D 배열 화살표 안정화
3. 구조체 멤버/char 배열 렌더링 표준화
4. FILE 포인터 최소 상태(open/closed/mode) 보강
5. dangling/invalid pointer 경고 표현 통일

코드 범위:
1. `packages/frontend/src/features/visualizers/c/CReferenceView.tsx`
2. `packages/frontend/src/features/visualizers/c/adapters/CTransformer.ts`
3. 필요 시 shared 타입 스키마

### Phase 3 - Concept View Introduction (D+2~3)

목표: 메모리뷰 불가 개념을 별도 시각화로 제공

새 라우팅 타입 제안:
1. `conceptVisualizationType`
   - `preprocessor`
   - `streams`
   - `buffering`
   - `fileio`
2. `conceptState` (타입별 payload)

UI 최소 구성:
1. `preprocessor`: before/after 치환 diff
2. `streams`: stdin/stdout/stderr 채널 뷰
3. `buffering`: buffer queue + flush 이벤트
4. `fileio`: mode/cursor/open-close 상태 타임라인

### Phase 4 - Lesson Data Migration (D+2~4)

목표: c-9/c-10 중심으로 conceptState 주입 및 하이브리드화

1. `c-9-1 ~ c-9-4`: 전처리기 모델화
2. `c-10-1 ~ c-10-4`: 스트림/버퍼/파일 상태 모델화
3. 빈 step 정리, 설명 문구 표준화

### Phase 5 - QA and Gate (D+1~2)

목표: 전 레슨에서 빈 시각화 제거 검증

1. 59 레슨 전수 점검
2. 체크 항목
   - 빈 시각화 유무
   - step 설명과 시각화 일치 여부
   - pointer/heap 연결 오류 여부
3. 산출물
   - `docs/c-visualization-qa-report-2026-03-04.md`

## 5) Success Metrics

1. Empty Visualization Rate = 0%
2. Memory-capable step coverage >= 95%
3. Concept-only step에서 적절한 Concept View 노출 100%
4. 핵심 레슨(c-9, c-10) 사용자 피드백 개선
5. Empty-payload False Positive Rate = 0%
   - 정의: `stack: []`/`heap: []`/빈 객체만 있는데 시각화 step으로 분류된 비율

## 6) Risks and Mitigations

1. Risk: 타입/스키마 변경으로 기존 레슨 깨짐
   - Mitigation: backward-compatible 필드 추가(`conceptVisualizationType` optional)
2. Risk: step 데이터 이관 공수 증가
   - Mitigation: 우선 c-9/c-10 먼저 완료 후 점진 확장
3. Risk: 복잡한 UI로 학습 집중도 하락
   - Mitigation: step당 핵심 시각화 1개 우선, 과밀 정보 접기
4. Risk: 빈 배열이 유효 데이터로 판정되어 carry-forward가 끊김
   - Mitigation: Phase 0에서 유효성 게이트 선적용 후 나머지 단계 진행
5. Risk: simulation merge가 concept/memory payload를 덮어씀
   - Mitigation: merge 시 유효 payload 우선순위 규칙 문서화 및 테스트 추가

## 7) Immediate Next Actions

1. Phase 0 유효성 게이트 먼저 구현 (`useLessonVisualization`/`useLessonSimulation`)
2. 59개 레슨 대상 빈 payload 오판정 재측정 후 리포트 작성
3. `conceptVisualizationType` 초안 타입 정의
4. Concept View 4종 중 `preprocessor`부터 먼저 구현
5. c-9-1 샘플 레슨 1개로 end-to-end 데모 검증

## Appendix A - Priority Lessons (Initial)

1. c-9-1 Preprocessor Phases
2. c-9-2 Macro Pitfalls
3. c-9-3 Conditional Compilation
4. c-9-4 Token Pasting
5. c-10-1 Standard Streams
6. c-10-2 File Modes
7. c-10-3 Buffered I/O
8. c-10-4 Binary Input/Output

---

## Appendix B - Validation Baseline (Measured on 2026-03-04)

1. C lessons: 59
2. Total steps: 506
3. `cMemory` steps: 457
4. Likely blank steps (no memory/output payload): 143
5. Empty-payload but marked-as-visualization steps: 102

이 수치는 Phase 0 적용 후 다시 측정해 감소율을 게이트 기준으로 사용한다.

---

Plan version: v1.1 (updated on 2026-03-04)
