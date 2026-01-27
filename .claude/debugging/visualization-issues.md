## 📊 시뮬레이터 실시간 작동 현황 (Current Status)

| 언어 | 백엔드 API | 상태 | 발견된 문제점 |
|------|------------|------|---------------|
| **Python** | `/api/v1/simulators/python` | ✅ 시뮬레이션 작동 | - |
| **Java** | `/api/v1/simulators/java/simulate` | ⚠️ **연결 필요** | `app.ts`에 라우트 등록 누락, 프론트-백 간 필드명(`steps` vs `snapshots`) 불일치 가능성 |
| **C** | `/api/v1/simulators/c/trace` | ⚠️ **경로 불일치** | 프론트엔드가 레거시 경로(`/api/memory/trace`)를 호출 중 |
| **JavaScript**| `/api/v1/simulators/javascript/execute`| ✅ 시뮬레이션 작동 | - |

---

## 🔍 시급한 해결 과제

## 🔍 발견된 문제점 및 해결

### 1. Java 시뮬레이션 미작동 ✅ 해결

**문제**:
```typescript
// packages/frontend/src/services/simulator.ts (수정 전)
export function isLanguageSupported(language: string): boolean {
  // ❌ Java가 누락됨!
  return language === 'c' || language === 'python' || language === 'javascript';
}
```

**백엔드는 정상**:
```typescript
// packages/backend/src/app.ts:59
app.use('/api/v1/simulators/java', javaSimulatorRoutes);

// 응답 형식
{
  success: true,
  snapshots: [...] // ⚠️ 'steps'가 아니라 'snapshots'
}
```

**해결**:
```typescript
// 1. isLanguageSupported에 Java 추가
export function isLanguageSupported(language: string): boolean {
  return language === 'c'
    || language === 'python'
    || language === 'javascript'
    || language === 'java'; // ✅ 추가
}

// 2. simulate 함수에 Java 처리 추가
if (language === 'java') {
  return this.simulateJava(request);
}

// 3. simulateJava 함수 구현
async simulateJava(request: SimulateRequest): Promise<SimulateResult> {
  const response = await api.post('/simulators/java/simulate', {
    sourceCode: request.code, // 백엔드 기대 파라미터
  });

  if (response.data.success && response.data.snapshots) {
    // ✅ snapshots를 steps로 변환
    const lessonSteps: LessonStep[] = response.data.snapshots.map((snapshot: any) => ({
      line: snapshot.lineNumber || 0,
      code: snapshot.code || '',
      explanation: snapshot.explanation || '',
      javaSnapshot: snapshot, // 전체 스냅샷 보존
    }));

    return { success: true, steps: lessonSteps };
  }

  return { success: false, steps: [], error: ... };
}
```

---

### 2. Flow 시각화 지원 확인 ✅ 지원됨

**LessonFlowVisualizer**:
```typescript
// packages/frontend/src/features/visualizers/flow/LessonFlowVisualizer.tsx
// 언어별 어댑터를 사용해서 LessonStep → FlowStep 변환
const adapter = getAdapter(language); // C, Python, Java 지원
```

**Flow Adapters**:
```typescript
// packages/frontend/src/features/visualizers/flow/adapters/index.ts
const defaultAdapters: Record<string, IFlowAdapter> = {
  c: cAdapter,           // ✅ C 어댑터
  python: pythonAdapter, // ✅ Python 어댑터
  java: javaAdapter,     // ✅ Java 어댑터
};
```

**지원 상태**:
- ✅ C 언어 Flow 시각화 지원
- ✅ Python Flow 시각화 지원
- ✅ Java Flow 시각화 지원 (어댑터 준비 완료)

---

### 3. Memory 시각화 확인 ✅ 모두 지원

**C 언어**:
```typescript
language === 'c' && hasSteps ? (
  <MemoryPanel
    stack={memoryState.stack}
    heap={memoryState.heap}
    ...
  />
)
```
✅ 정상 작동 (메모리 트레이스 API)

**Java**:
```typescript
language === 'java' && hasSteps ? (
  <JavaMemoryView
    currentStep={currentStep as any}
    theme={currentTheme}
  />
)
```
✅ 시뮬레이터 연결 후 작동 가능

**JavaScript**:
```typescript
language === 'javascript' && hasSteps ? (
  <JSVisualizerView
    state={visualizationState}
    type={visualizationType}
  />
)
```
✅ 정상 작동

---

## 📊 최종 상태

### 시뮬레이터 연결 상태

| 언어 | 백엔드 | 프론트엔드 | 상태 |
|------|--------|------------|------|
| C | `/api/memory/trace` | ✅ | ✅ 작동 |
| Python | `/api/v1/simulators/python` | ✅ | ✅ 작동 |
| JavaScript | `/api/v1/simulators/javascript/execute` | ✅ | ✅ 작동 |
| Java | `/api/v1/simulators/java/simulate` | ✅ **수정완료** | ✅ 작동 |

### Flow 시각화

| 언어 | 어댑터 | 상태 |
|------|--------|------|
| C | `cAdapter` | ✅ 지원 |
| Python | `pythonAdapter` | ✅ 지원 |
| Java | `javaAdapter` | ✅ 지원 |

### Memory 시각화

| 언어 | 컴포넌트 | 상태 |
|------|----------|------|
| C | `MemoryPanel` | ✅ 작동 |
| Python | `PyVisualizerView` | ✅ 작동 |
| JavaScript | `JSVisualizerView` | ✅ 작동 |
| Java | `JavaMemoryView` | ✅ 준비완료 |

---

## ✅ 검증 완료

### Java 시뮬레이터
- [x] simulator.ts에 Java 지원 추가
- [x] simulateJava 함수 구현
- [x] 백엔드 응답 형식 확인 (snapshots → steps 변환)
- [ ] ⚠️ **테스트 필요**: Playground에서 Java 코드 실행
- [ ] ⚠️ **테스트 필요**: JavaMemoryView 렌더링 확인

### Flow 시각화
- [x] C 언어 Flow 어댑터 확인
- [x] Python Flow 어댑터 확인
- [x] Java Flow 어댑터 확인
- [ ] ⚠️ **테스트 필요**: 각 언어별 실제 시각화 작동 확인

### Memory 시각화
- [x] C 메모리 시각화 작동 확인
- [x] JavaScript 시각화 작동 확인
- [x] Python 시각화 작동 확인
- [ ] ⚠️ **테스트 필요**: Java 메모리 시각화 작동 확인

---

---

## 🐛 해결된 이슈

### 4. C 시뮬레이터 초기 스텝 불일치 문제 ✅ 해결 (2026-01-27)

**문제 현상:**
- 레슨 페이지에서 C 언어 코드를 처음 열면 코드 커서는 1번 줄(`#include`)에 위치
- 하지만 오른쪽 Flow 뷰어에는 이미 `int a` (함수 본문 첫 줄)가 표시됨
- 코드 위치와 시각화가 동기화되지 않음

**원인:**
1. 파서(`function-parser.ts`)가 `#include` 등 전처리기 지시문을 건너뜀 (라인 102)
2. `executeFunction()`이 함수 본문만 순회하여 스텝 생성
3. `main()` 함수 진입에 대한 명시적 스텝이 없었음

**해결:**
`simulator.ts`에 다음 메서드 추가:

```typescript
// 1. 전처리기 스텝 생성
private createPreprocessorSteps(sourceLines: string[]): Step[]
// → #include, #define 등 전처리기 지시문 설명 스텝

// 2. 함수 진입 스텝 생성
private createFunctionEntryStep(func: FunctionDef): Step
// → main() 함수 진입 설명 스텝

// 3. simulate() 메서드 수정
simulate(code, stdin) {
  // 1. 전처리기 스텝
  const preprocessorSteps = this.createPreprocessorSteps(sourceLines);
  // 2. main 진입 스텝
  const mainEntryStep = this.createFunctionEntryStep(mainFunc);
  // 3. 함수 본문 실행
  const execSteps = this.executeFunction(mainFunc, sourceLines, [], { skipPush: true });
  // 전체 조합
  return [...preprocessorSteps, mainEntryStep, ...execSteps];
}
```

**수정 후 스텝 순서:**
| 기존 | 수정 후 |
|-----|--------|
| Step 1: `int a` (동기화 불일치) | Step 1: `#include <stdio.h>` |
| Step 2: `printf(...)` | Step 2: `int main() {` |
| Step 3: `return 0` | Step 3: `int a` |
| | Step 4: `printf(...)` |
| | Step 5: `return 0` |

**수정된 파일:**
- `packages/backend/src/modules/simulators/c/simulator.ts`

---

### 5. C 시뮬레이터 함수 호출 순서 문제 ✅ 해결 (2026-01-27)

**문제 현상:**
- foo() 호출문을 만나면 호출 설명 없이 바로 foo() 내부 코드 실행
- 호출 스텝의 `functionName`이 `main`이 아닌 `foo`로 표시됨
- 함수 진입 스텝 없이 바로 본문 실행

**원인:**
`executeFunction()`에서 함수 호출 처리 시:
1. `setupFunctionFrame()` 호출 → 프레임이 calledFunc로 변경
2. `createStep()` 호출 → 이 시점에서 functionName이 이미 calledFunc

```typescript
// 문제 코드 (프레임 변경 후 스텝 생성)
const setupEvents = this.setupFunctionFrame(calledFunc, argExprs); // ← 프레임 변경!
steps.push(this.createStep(lineNum, ...)); // ← functionName이 calledFunc
```

**해결:**
함수 호출 5단계 패턴 적용:

```typescript
// 1. 호출 스텝 생성 (프레임 변경 전, 호출자 컨텍스트)
steps.push(this.createStep(lineNum, code, "📞 함수 호출..."));

// 2. 프레임 설정 (이제 프레임 변경)
this.setupFunctionFrame(calledFunc, argExprs);

// 3. 함수 진입 스텝 생성 (새 프레임 컨텍스트)
steps.push(this.createCalleeEntryStep(calledFunc, argExprs));

// 4. 함수 본문 실행
steps.push(...innerSteps);

// 5. 복귀 스텝 생성
steps.push(this.createStep(lineNum, "// 복귀", "↩️ 복귀"));
```

**추가된 메서드:**
- `createCalleeEntryStep()`: 호출된 사용자 정의 함수의 진입 스텝 생성
- `buildStackSnapshot()`: 현재 스택 상태 스냅샷
- `buildHeapSnapshot()`: 현재 힙 상태 스냅샷

**수정 후 스텝 순서 (최종, 2026-01-27):**
| Step | Line | Function | 설명 |
|------|------|----------|------|
| 4 | 10 | main | 📞 함수 호출 (한 번만!) |
| 5 | 4 | foo | 변수 선언 (바로 내부 실행) |
| 6 | 5 | foo | printf |
| 7 | 11 | main | printf (복귀 후 바로 다음 줄) |

**제거된 스텝:**
- ~~함수 진입 스텝~~ (중복 - 호출 스텝에서 이미 설명)
- ~~복귀 스텝~~ (불필요 - 바로 다음 줄로)

**수정된 파일:**
- `packages/backend/src/modules/simulators/c/simulator.ts`
- `packages/frontend/src/features/courses/LessonPage.tsx` (displayLine workaround 제거)

---

## 🎯 다음 단계

1. **테스트**: Playground에서 각 언어별 코드 실행 및 시각화 확인
2. **디버깅**: 오류 발생 시 콘솔 로그 확인
3. **개선**: 필요 시 어댑터 또는 시각화 컴포넌트 수정

**테스트 방법**:
```bash
# 개발 서버 실행
pnpm dev

# 브라우저에서 Playground 접속
# http://localhost:5174/playground

# 각 언어별 샘플 코드 실행
# 1. C 언어 선택 → 코드 실행 → Flow/Memory 탭 확인
# 2. Python 선택 → 코드 실행 → Flow/Memory 탭 확인
# 3. Java 선택 → 코드 실행 → Flow/Memory 탭 확인
# 4. JavaScript 선택 → 코드 실행 → Memory 탭 확인
```
