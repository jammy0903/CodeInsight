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

## REMAINING (미처리 — 코드 대조 검증 완료 2026-02-16)

### 🔵 DESIGN ISSUES (10건 — 전부 검증 완료)

| # | 심각도 | Issue | 검증 결과 | 권장 조치 |
|---|--------|-------|-----------|-----------|
| D1 | 중상 | `as any` **130회** (24개 파일) | Top: LessonFlowVisualizer(27), useLessonVisualization(18), LanguageCoursePage(9) | LessonStep discriminated union 타입 도입 |
| D2 | 높음 | MemoryBlock 타입 **6곳** 중복 | types/memory.ts, shared/types.ts, CMemoryView.tsx, runtime/types.ts, schemas/course.ts, ai.ts — 필드 불일치 | shared MemoryBlock 단일 소스 통합 |
| D3 | 중간 | parseValue() 3개 Transformer 중복 | JS(@N refs), Java(-> refs), C(hex) — ~70% 로직 동일 | 공통 유틸 + 언어별 모드 파라미터 |
| D4 | 높음 | Transformer **1,343 LOC** 중복 | JS(360), Py(358), C(331), Java(294) — ~85% 구조 동일 | BaseTransformer 추상 클래스 추출 |
| D5 | 중간 | authStore ↔ store.ts 중복 | authStore: 1개 파일만 import (store.ts 자체). store.ts: 30개 파일 import. 5개 필드 중복 | authStore 삭제, store.ts로 통합 |
| D6 | 높음 | Quiz 하드코딩 **1,890+ LOC** | MultipleChoice(138 LOC), FillBlank(~133 LOC), Algorithm(대량) — OXQuiz만 API 사용 | JSON/API 분리 |
| D7 | 중간 | PlaygroundPage 인라인 스타일 **43개** | `style={{` 43회 확인 — TailwindCSS 규칙 위반 | Tailwind 클래스로 전환 |
| D8 | 낮음 | 시뮬레이터 진입점 불일치 | C: simulator.ts, Java/JS: *-simulation.service.ts, Python: index.ts(barrel) | 표준화 (낮은 우선순위) |
| D9 | 낮음 | Admin 인증 인라인 | users/routes.ts에 requireAdmin() 인라인 정의, Fastify decorator 미등록 | fastify.requireAdmin 플러그인화 |
| D10 | **버그** | mark-admin-complete.ts 타임스탬프 | `completedAt?.toString() !== new Date().toString()` — 항상 true, 카운터 완전히 깨짐 | **즉시 수정** 필요 |

### 🟣 INCOMPLETE (8건 중 3건 해소, 5건 잔존)

| # | 상태 | File | What | 권장 |
|---|------|------|------|------|
| ~~I3~~ | ✅ 해소 | `ai/routes.ts` | checkAIUsage 완전 구현됨 (구독 제거, 로그인 유저 무제한) | — |
| ~~I6~~ | ✅ 해소 | `schemas/course.ts` | PyNameSchema, PyObjectSchema 이미 존재 | — |
| ~~I8~~ | ✅ 해소 | `schema.prisma` | Draft 모델 users/routes.ts에서 활발히 사용 중 | — |
| **I1** | 잔존 | `stores/lessonHistoryStore.ts` | addEntry/clear가 console.warn만 출력하는 STUB | 구현 또는 삭제 결정 |
| **I2** | 잔존 | `executors/index.ts` | Python/Java/JS executor TODO만 존재, 구현 없음 | KEEP — Phase 2 블로커 |
| **I4** | 잔존 | `Sidebar.tsx:281` | 닉네임 등록 버튼 onClick 빈 핸들러 + TODO 주석 | 모달 구현 또는 /profile 라우팅 |
| **I5** | 잔존 | `variable.handler.ts:496` | callFunction() → null 반환, 시뮬레이터 연동 필요 | KEEP — 시뮬레이터 성숙 후 |
| **I7** | 잔존 | `schemas/course.ts:247-248` | Java cache/hashSet `z.any().optional()` — 타입 안전성 없음 | 실제 Java JSON 분석 후 스키마 정의 |

---

## Summary

| 카테고리 | 건수 | 상태 |
|----------|------|------|
| 🔴 CRITICAL | 3 | ✅ 전부 완료 |
| 🟠 HIGH | 5 | ✅ 전부 완료 |
| 🟡 MEDIUM | 28 | ✅ 전부 완료 (1건 복구) |
| 🔵 DESIGN | 10 | ✅ 검증 완료 — D10은 버그(즉시 수정 권장), 나머지 리팩토링 |
| 🟣 INCOMPLETE | 8 → 5 | ✅ 3건 해소 (I3, I6, I8), 5건 잔존 |

**총 제거: ~4,100+ LOC** (프론트 simulator 621 + GDB 2,114 + stale tests ~1,100 + 기타 ~300)

### 우선순위 권장

1. **즉시**: D10 타임스탬프 버그 수정
2. **단기**: D5 authStore 삭제 (미사용), I1 lessonHistoryStore 결정 (구현/삭제)
3. **중기**: D1 `as any` 정리 (LessonStep union 타입), D2 MemoryBlock 통합, D4 BaseTransformer
4. **장기**: D6 Quiz API 분리, D7 Tailwind 전환, D3 parseValue 통합
