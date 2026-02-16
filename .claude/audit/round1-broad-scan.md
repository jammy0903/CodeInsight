# Code Audit Round 1 — Broad Scan (2026-02-16)

## Scan Method
- Frontend 전체 1회, Backend 전체 1회 스캔
- 주로 unused imports/exports, TODO, 주석 블록, 명백한 데드코드 탐지

## Findings

### 🔴 Bug/Inconsistency
| # | File | Issue |
|---|------|-------|
| 1 | `prisma/scripts/migrate-to-delta.ts` | `VIZ_FIELDS`에 `algorithmState` 누락 — `expandDeltaSteps.ts`와 불일치 |

### 🟡 Dead Code (Safe to Remove)
| # | File | What | Lines |
|---|------|------|-------|
| 2 | `frontend/src/stores/simulatorStore.ts` | 전체 파일 미사용 (import 0건) | 1-57 |
| 3 | `frontend/src/hooks/useSlidingPages.ts` | 미사용 훅 (import 0건) | 1-78 |
| 4 | `frontend/src/hooks/useFocusCycle.ts` | 미사용 훅 (import 0건) | 1-86 |
| 5 | `frontend/src/features/playground/PlaygroundPage.tsx` | 주석 처리된 Enter 키 훅 | 88-94 |
| 6 | `frontend/src/features/visualizers/c/CMemoryView.tsx` | `@deprecated` theme prop | 532 |

### 🟢 Intentionally Kept
| # | File | Reason |
|---|------|--------|
| 7 | `useLessonNavigation.ts` — `isEmptyLineStep()` | 백엔드 필터링 설계, 프론트 패스스루 |
| 8 | `useLessonSimulation.ts` — `filterEmptyLineSteps()` | 안전망 |
| 9 | `shared/schemas/course.ts` — StackVariableSchema/HeapBlockSchema | 프론트 types/index.ts에서 import 중 |

### ⚪ Incomplete/TODO
| # | File | What |
|---|------|------|
| 10 | `stores/lessonHistoryStore.ts` | STUB — addEntry가 console.warn만 |
| 11 | `backend/modules/executors/index.ts` | Python/Java/JS executor Phase 2 TODO |
| 12 | `frontend — Sidebar.tsx:281` | 닉네임 등록 모달 미구현 |
| 13 | `frontend — firebase.ts:226` | Capacitor 네이티브 연동 TODO |

## Limitations of This Scan
- **모듈 내부 깊이 부족**: features/visualizers/ 내 각 언어별 adapter, component 레벨 미분석
- **Cross-module 중복 미탐지**: simulator engine vs visualizers 간 책임 겹침 미확인
- **대형 모듈 미분석**: courses/ (훅 10개+), simulators/c/ (sub-module 10개+)
- **타입 안전성 미점검**: any 사용, 느슨한 타입 캐스팅 등
- **설계 패턴 미평가**: 과도한 추상화, 잘못된 책임 배치 등
