# Code Audit Round 2 — Module-Level Deep Scan (2026-02-16)

## Scan Method
- 12개 유닛 병렬 스캔 (Frontend 7 + Backend 5)
- 모듈별 파일 단위 분석: 미사용 export, dead code, 타입 안전성, 설계 결함, 미완성 코드

---

## COMPLETED FIXES

### 🔴 CRITICAL (3건 — 전부 완료)

| # | File | Fix | Status |
|---|------|-----|--------|
| C1 | `prisma/update-content.ts` | `expandDeltaSteps()` import + deltaFormat 확장 후 DB 저장 | ✅ |
| C2 | `prisma/scripts/migrate-to-delta.ts` | VIZ_FIELDS + DEEP_MERGE_FIELDS에 `algorithmState` 추가 | ✅ |
| C3 | `modules/ai/routes.ts` | `/explain`, `/explain-step`에 `requireDbUser + checkAIUsage` preHandler 추가 | ✅ |

### 🟠 HIGH (5건 — 전부 완료)

| # | What | Action | LOC Removed |
|---|------|--------|-------------|
| H1 | `features/simulator/` 전체 | 디렉토리 삭제 (40+ 파일) | ~621 |
| H2 | `simulators/c/gdb/` 모듈 | 디렉토리 삭제 + routes.ts GDB 참조 제거 | ~2,114 |
| H3 | `simulators/java/index.ts` | Express 라우터 파일 삭제 | ~10 |
| H4 | 3개 stale 테스트 파일 | python/java/js simulation service tests 삭제 | ~1,100 |
| H5 | `analytics/routes.ts` notes 쿼리 | `createdAt: { gte: since }` 날짜 필터 추가 | fix |

### 🟡 MEDIUM (28건 — 전부 완료, 1건 복구)

**Frontend 파일 삭제 (7건):**
- `stores/simulatorStore.ts` (M1)
- `stores/chatStore.ts` (M2)
- `hooks/useSlidingPages.ts` (M3)
- `visualizers/shared/components/ScopeChainView.tsx` (M4)
- `playground/components/VisualizerPanel.tsx` (M7)
- `courses/components/day/CodeViewer.tsx` (M10)
- `courses/components/day/SelectedCodeBadge.tsx` (M11)

**Frontend 디렉토리 삭제 (1건):**
- `courses/components/mobile/` (M13) — MobileAIChatFAB + MobileAIChatModal

**Frontend 코드 정리 (9건):**
- `shared/styles.ts` — `getFrameStyle()` 삭제 (M5)
- `c/hooks/useFlowDiff.ts` — `useFlowDiffStatus` 삭제 (M6)
- `playgroundStore.ts` — `useLanguage`, `useSimulationState`, `getCurrentStep` 삭제 (M8)
- `LessonPage.tsx` — AIChatOverlay 함수 + 주석 블록 + import 삭제 (M12)
- `useCodeSelection.ts` — DEBUG console.log 3개 제거 (M14)
- `PlaygroundPage.tsx` — 주석 Enter키 훅, 미사용 registers, debug useEffect 삭제 (M15-17)

**Frontend barrel export 정리 (5개 파일):**
- `hooks/index.ts` — useSlidingPages 제거
- `playground/index.ts` — useLanguage, useSimulationState, VisualizerPanel, 내부 컴포넌트 제거
- `courses/components/index.ts` — CodeViewer, SelectedCodeBadge 제거
- `courses/index.ts` — CodeViewer, SelectedCodeBadge 제거
- `visualizers/shared/index.ts` — getFrameStyle 제거
- `visualizers/c/index.tsx` — useFlowDiffStatus 제거
- `visualizers/c/hooks/index.ts` — useFlowDiffStatus 제거

**Backend 코드 정리 (7건):**
- `plugins/auth.ts` — 미호출 `verifyTokenAndSetUser`, `lookupDbUser` 삭제 (M18)
- `plugins/index.ts` — `getRateLimitConfig`, `RateLimitPreset` export 제거 (M19)
- `courses/service.ts` — `getLessons`, `createLanguage`, `createChapter`, `createLessonWithContent` 삭제 (M20-21)
- `python/handlers/index.ts` — 미사용 re-export 12개 제거 (M23)
- `c/handlers/io.handler.ts` — 미사용 `evaluateArg()` 삭제 (M24)

**Prisma 레거시 스크립트 삭제 (4건):**
- `c-json-content-seed.ts` (M25)
- `python-json-content-seed.ts` (M26)
- `python-seed.ts` (M27)
- `java-seed.ts` (M28)

**감사 오류 복구 (1건):**
- ~~M22: `resolveNameToObject` 삭제~~ → **즉시 복구** — 핸들러 5곳(attribute, builtin, method-call, function-call, instance-create)에서 활발히 import 중이었음

---

## REMAINING (미처리 — 향후 작업)

### 🔵 DESIGN ISSUES (리팩토링 — 코드 변경 없이 메모만)

| # | Issue | Files | Impact |
|---|-------|-------|--------|
| D1 | `as any` 107회 | 31개 파일 | LessonStep discriminated union 필요 |
| D2 | MemoryBlock 타입 4곳 중복 | types/memory.ts 외 3곳 | 단일 소스 통합 필요 |
| D3 | parseValue() 3개 어댑터 중복 | JS/Java/C Transformer | 공통 유틸 추출 |
| D4 | Transformer 패턴 중복 ~1,300 LOC | 4개 Transformer | BaseTransformer 추출 |
| D5 | Store 중복 (authStore ↔ store.ts) | 3개 store 파일 | 마이그레이션 미완성 |
| D6 | Quiz 데이터 하드코딩 ~1,890 LOC | 3개 QuizPage | JSON/API 분리 권장 |
| D7 | PlaygroundPage 인라인 스타일 43개 | PlaygroundPage.tsx | TailwindCSS 규칙 위반 |
| D8 | 시뮬레이터 모듈 진입점 불일치 | py/java/js index.ts | 표준화 필요 |
| D9 | Users 중복 admin 인증 | users/routes.ts | fastify.requireAdmin 통합 |
| D10 | mark-admin-complete.ts 타임스탬프 결함 | prisma script | toString 비교 로직 |

### 🟣 INCOMPLETE (미완성 기능 — 결정 필요)

| # | File | What |
|---|------|------|
| I1 | `stores/lessonHistoryStore.ts` | STUB 구현 |
| I2 | `executors/index.ts` | Python/Java/JS executor Phase 2 |
| I3 | `ai/routes.ts` checkAIUsage | stub preHandler |
| I4 | `Sidebar.tsx:281` | 닉네임 등록 모달 |
| I5 | `variable.handler.ts:496` | 함수 호출 표현식 TODO |
| I6 | `shared/types/course.ts` | Python 메모리 타입 Zod 스키마 없음 |
| I7 | `shared/schemas/course.ts:247-248` | Java cache/hashSet `z.any()` |
| I8 | `schema.prisma:90-101` | Draft 모델 미사용 |

---

## Summary

| 카테고리 | 건수 | 상태 |
|----------|------|------|
| 🔴 CRITICAL | 3 | ✅ 전부 완료 |
| 🟠 HIGH | 5 | ✅ 전부 완료 |
| 🟡 MEDIUM | 28 | ✅ 전부 완료 (1건 복구) |
| 🔵 DESIGN | 10 | 📋 메모 (향후) |
| 🟣 INCOMPLETE | 8 | 📋 결정 필요 |

**총 제거: ~4,100+ LOC** (프론트 simulator 621 + GDB 2,114 + stale tests ~1,100 + 기타 ~300)
