# Refactoring History

## 2026-01-11: Playground-Lesson 완전 통합 (snapshot 형식 제거, CStep 제거)

### 배경
- 이전: Playground는 CStep (snapshot), Lesson은 LessonStep (memoryChanges)
- 목표: 완전히 같은 타입 사용, 중복 로직 완전 제거

### 작업 내용
1. **snapshot 형식 제거**:
   - `useLessonVisualization.detectFormat()`에서 'snapshot' 케이스 삭제
   - switch 문에서 snapshot 처리 로직 제거
   - Playground도 이제 LessonStep의 stack/heap 필드 사용

2. **CStep 완전 제거**:
   - `LessonPage.tsx`: `simulatorSteps` 타입을 CStep[] → LessonStep[]로 변경
   - `explanationStore.ts`: CStep → LessonStep, `getCodeAtLine()` 헬퍼 추가
   - `VisualizerPanel.tsx`: CStep/CMemoryBlock → LessonStep/MemoryBlock
   - `types/index.ts`: CStep, CMemoryBlock export 제거

3. **헬퍼 함수 추가**:
   - `getCodeAtLine(fullCode, line)`: LessonStep엔 code 필드 없으므로 fullCode에서 추출
   - explanationStore에서 AI 설명 요청 시 사용

4. **제거된 필드 대응**:
   - `step.code`: getCodeAtLine()으로 추출
   - `step.changes`: 빈 배열로 대체 (LessonStep엔 없음, 향후 memoryChanges 사용 고려)

### 결과
- ✅ Playground와 Lesson이 완전히 같은 LessonStep 타입 사용
- ✅ snapshot 형식 감지/처리 로직 완전 제거
- ✅ CStep, CMemoryBlock 사용처 모두 제거 (정의만 남음, @deprecated)
- ✅ 코드 중복 제거, 유지보수성 향상

---

## 2026-01-11: LessonStep/CStep 타입 통합 (Playground-Lesson 통합)

### 배경
- Playground: CStep (snapshot 형식 - stack, heap 직접)
- Lesson: LessonStep (memoryChanges 형식 - 변경사항 누적)
- **문제**: 다른 타입 사용 → 중복 로직, 유지보수 어려움

### 해결
1. **shared 패키지 수정**:
   - `MemoryBlockSchema` 추가 (z.lazy로 순환 참조 처리)
   - `LessonStepSchema`에 `stack`, `heap`, `data` 필드 추가 (optional)
   - `MemoryBlock` 타입 export

2. **useLessonVisualization 확장**:
   - `detectFormat`에 `'snapshot'` 형식 추가
   - snapshot: `step.stack`이 `MemoryBlock[]`인 경우 감지
   - switch 문에 snapshot 케이스 추가 (현재 스텝의 stack/heap 직접 사용)

3. **PlaygroundPage 수정**:
   - `CStep` → `LessonStep` 타입 변경
   - 수동 메모리 계산 제거 (line 41-69)
   - `useLessonVisualization` hook 사용
   - `MemoryPanel`에 `memoryState` 전달

4. **CStep deprecated**:
   - `@deprecated` JSDoc 추가
   - Migration 가이드 작성

### 결과
- **코드 통합**: Playground와 Lesson이 같은 타입 사용
- **중복 제거**: 메모리 계산 로직 한 곳에서 관리
- **자동 기능 적용**: 배열 접기/펼치기, 함수 오버레이 등 모든 기능 자동 적용

---

## 2026-01-11: 함수별 변수 그룹핑 + RSP/RBP 위치 수정

### 문제 1: 오버레이가 모든 블록 덮음
- **증상**: `foo()` 오버레이가 `main.x`, `foo.local` 모두 덮음
- **원인**: `FrameOverlay`가 전체 컨테이너에 `absolute inset-0`
- **해결**: 오버레이를 각 `MemoryBlockCard` 내부로 이동, `isHovered`일 때만 렌더링

### 문제 2: RSP/RBP 화살표 위치 틀림
- **증상**: 하드코딩 `BLOCK_HEIGHT = 48`로 인한 오차
- **해결**: CSS `top: 50%` + `translateY(-50%)`, 각 블록에 `registerLabel` prop

### 교훈
- UI 버그는 스크린샷으로 즉시 발견
- 복잡한 계산(useEffect, ResizeObserver) < 간단한 CSS

---

## 2026-01-11: Zod 스키마 동기화 문제 해결 ⭐ 중요

### 증상
- 레슨 페이지 메모리 시각화 안 됨 (`/courses/c/c-1/c-1-4`)
- curl API 응답 정상, 브라우저만 실패
- ZodError: `Invalid option: expected one of "allocate"|"update"|"free"`

### 원인
1. **Zod 스키마 불완전**: `action`에 `'frame'`, `'frame_end'`, `'deallocate'` 누락
2. **필수 필드 문제**: `type`, `size`, `value`, `address`가 필수인데 frame 액션엔 없음
3. **이중 정의**: TypeScript 타입과 Zod 스키마 별도 관리 → 동기화 실패
4. **Vite 캐시**: shared 패키지 수정해도 프론트엔드가 이전 버전 사용

### 해결
```typescript
// schemas/course.ts - action 추가 + optional 필드
action: z.enum(['frame', 'allocate', 'update', 'free', 'deallocate', 'frame_end']),
type: z.string().optional(),
size: z.number().optional(),
value: z.union([...]).optional(),
address: z.string().optional(),

// z.infer 패턴 적용 (Single Source of Truth)
export type MemoryChangeAction = z.infer<typeof MemoryChangeSchema>;
```

```bash
# 캐시 정리
pnpm --filter @codeinsight/shared build
rm -rf packages/frontend/node_modules/.vite
# 프론트엔드 재시작
```

### 교훈
- Zod + TypeScript는 `z.infer`로 Single Source 유지
- API 데이터 변경 시: 스키마 수정 → shared 빌드 → Vite 캐시 삭제
- 상세 규칙: `docs/claude-rules/code/typescript.md` 참조

---

## 2026-01-11: Codeium Rollback
- Tried: @codeium/react-code-editor for AI autocomplete
- Issue: Backend service returning 500 error (since 2025-12)
- Cause: Codeium → Windsurf rebrand, free React editor abandoned
- Removed: services/codeium/, useCodeiumContext hook, types/codeium.ts
- Kept: lessonHistoryStore.ts (for future "recent lessons" feature)
- Reverted: CodeEditor.tsx back to plain Monaco Editor
- Lesson: Don't depend on free external services for core features

## 2026-01-11: Side Effect Analysis
- Analyzed: 연산자 우선순위 "버그" → 의도적 제한으로 확인
- Analyzed: 배열 수식 "버그" → 커리큘럼 범위 밖으로 확인
- Confirmed: Phase 4-5 기능들은 커리큘럼(Lesson 5-8)과 일치
- Decision: 복잡한 수식 미지원은 유지 (교육적 효과)

## 2026-01-11: Error Detection + Bitwise (Phase 5)
- Added: Memory leak detection in simulator.ts (createMemoryLeakWarning)
- Added: Buffer overflow detection in array.handler.ts (enhanced warning)
- Added: bitwise.handler.ts for &, |, ^, <<, >>, ~ visualization
- Added: findHandlerWithFallback in registry for pointer/array disambiguation
- Result: Memory errors caught with detailed explanations, binary visualization

## 2026-01-11: Function Parameter Passing (Phase 4)
- Changed: simulator.ts executeFunction() now accepts args parameter
- Added: parseArguments(), evaluateExpression() methods in simulator.ts
- Added: executeFunctionWithReturn() for capturing return values
- Added: Expression support in VariableHandler (int sum = a + b;)
- Result: Pass-by-value function calls with return value assignment

## 2026-01-11: Struct Support
- Added: struct.handler.ts (struct 정의/선언/멤버접근)
- Added: is_struct, struct_name fields to Variable interface
- Result: struct Point { int x; int y; }; 지원

## 2026-01-11: Array All Types Support
- Changed: ArrayHandler now uses TypeRegistry
- Added: Support for char[], float[], double[], short[], long[], unsigned variants
- Added: element_type, element_size fields to Variable interface
- Result: All C primitive types supported in arrays

## 2026-01-11: CSS Structure
- Removed: NES.css (unused, caused conflicts)
- Changed: All custom CSS moved to @layer
- Result: Tailwind works without !important

## 2026-01-11: Handler Consolidation
- Removed: int.handler.ts, primitive.handler.ts
- Added: VariableHandler + TypeRegistry
- Result: Single handler for all primitive types

## 2026-01-08: Multi-language Architecture Plan
- Added: FILE_STRUCTURE.md with shared/languages/adapters pattern
- Status: Planning phase, implementation pending
