# CodeInsight TODO

> 마지막 업데이트: 2026-01-11

---

## 완료된 항목

### Phase 0: 코스 시스템 기초
- ✅ DayPage → LessonPage 리팩토링
- ✅ 코스 시스템 DB 기반 전환
- ✅ User 스키마 재설계 (닉네임 기반)
- ✅ 다중 OAuth 지원
- ✅ Axios 인프라 구축
- ✅ Monorepo 전환 (`packages/shared`)
- ✅ Admin Provider Toggle
- ✅ 인증 미들웨어 (`requireDbUser`)
- ✅ 프로덕션 console.log 제거
- ✅ HomePage 리디자인 (CSS 픽셀아트 → 모던 디자인)

### Phase 1: 아키텍처 개선 (2026-01-08 완료)
- ✅ **codeinsight → main 브랜치 병합**
- ✅ **Docker-in-Docker 제거**
  - docker-compose.yml 삭제 (프로덕션은 별도)
  - Docker Socket 연결 제거

- ✅ **로컬 gcc 기반 C 실행기 구현**
  - executor.ts → 로컬 gcc로 리팩토링
  - FORBIDDEN_PATTERNS 보안 검사 유지
  - 성능 3배 향상 (3-5초 → 0.5-1초)

- ✅ **멀티-언어 Executor 아키텍처 설계 및 구현**
  - `packages/backend/src/modules/executors/` 생성
  - `IExecutor` 인터페이스 정의 (모든 언어 통일)
  - `CExecutor` 클래스 구현
  - 향후 Python/Java/JavaScript 확장 용이

### Phase 2: Playground 기반 (2026-01-10 완료)
- ✅ **1주차: 기반 구축**
  - ✅ 공통 인터페이스 정의 (`types/simulator.ts`)
  - ✅ Zustand 스토어 (`playgroundStore.ts`)
  - ✅ PlaygroundPage 기본 레이아웃 (40/60 분할)
  - ✅ CodeEditor (Monaco) 연동
  - ✅ LanguageTabs (C/Python/Java)
  - ✅ StepControls (◀ ▶ Reset)
  - ✅ MemoryGridPanel, MetadataPanel, VisualizerPanel
  - ✅ `/playground` 라우트

- ✅ **2주차: C 시뮬레이터**
  - ✅ CMemoryView 컴포넌트 (17KB)
  - ✅ 기존 핸들러 통합 (backend/memory/handlers/)
  - ✅ RSP/RBP 레지스터 추적

### Phase 3: C 핸들러 확장 (2026-01-11 완료)
- ✅ struct 지원 (struct.handler.ts)
- ✅ 배열 다양한 타입 지원 (char[], float[], double[])
- ✅ 함수 파라미터 지원 (pass-by-value)
- ✅ 비트 연산 시각화 (bitwise.handler.ts)
- ✅ 메모리 에러 감지 (leak, buffer overflow)

### Codeium AI 자동완성 시도 및 롤백 (2026-01-11)
- ✅ `@codeium/react-code-editor` 도입 시도
- ✅ 최근 레슨 컨텍스트 연동 설계 (otherDocuments)
- ❌ **롤백 결정**: Codeium 백엔드 서비스 500 에러 (2025-12 ~)
  - 원인: Codeium → Windsurf 리브랜딩 후 무료 React 에디터 방치
  - GitHub Issue: [#47](https://github.com/Exafunction/codeium-react-code-editor/issues/47)
- ✅ Monaco Editor로 롤백
- ✅ `lessonHistoryStore` 유지 (향후 재활용 가능)
  - 최근 학습 레슨 기록 (localStorage persist)
  - 다른 AI 서비스 연동 시 활용 가능

---

## 현재 진행 중

### 🎨 메모리 뷰어 통합 리디자인 (2026-01-11~)

**목표**: 코스/Playground에서 공유 가능한 고정 슬롯 메모리 뷰어

#### 핵심 디자인 원칙

1. **수직 나열** (실제 메모리 방향 반영)
   - Stack: 위→아래 (높은주소→낮은주소, ↓ 주소 감소)
   - Heap: 아래→위 (낮은주소→높은주소, ↑ 주소 증가)

2. **값 vs 변수명 구분** (교육적 핵심!)
   - 값: 크고 굵게 (실제 메모리에 저장됨)
   - 변수명: 작고 회색 (메모리에 없음! 컴파일러만 아는 라벨)

3. **고정 슬롯 구조**
   | 조건 | Stack | Heap |
   |------|-------|------|
   | 기본 레슨 | 3칸 | 3칸 |
   | 함수/포인터 레슨 (`showRegisters=true`) | 5칸 (RSP, RBP + 변수 3개) | 3칸 |

4. **배열 표시** (접기/펼치기)
   - 기본: 축약 `[1,2,3,4,5]` + ▶ (1칸 차지)
   - 클릭: 펼쳐서 각 요소 개별 표시 (N칸)
   - 컨테이너 max-height 고정 + overflow-y: auto (브라우저 안 커짐)

5. **Playground 공유** (variant 패턴)
   - `variant="lesson"`: 코스용 (라이트 테마)
   - `variant="playground"`: Playground용 (다크 테마 등)

#### 슬롯 레이아웃 (ASCII)
```
┌────────────┬──────────────┐
│ 0x7FFFFFFC │     10       │  int a (변수)
└────────────┴──────────────┘
     ↑              ↑              ↑
   주소        값(크고굵게)    타입+변수명(작고회색)
```

#### 구현 작업
- [x] MemoryPanel.tsx - 고정 슬롯 + 수직 나열 (완료)
- [x] RegisterSlot - RSP/RBP 표시 (완료)
- [ ] 배열 접기/펼치기 기능 추가
- [ ] 컨테이너 스크롤 (max-height + overflow-y)
- [ ] Playground용 variant prop 추가
- [ ] 타입 통합 (`packages/shared/src/types/memory.ts`)
- [ ] MemoryGridPanel → MemoryPanel variant로 마이그레이션

---

### 🎯 Playground + 멀티언어 시각화 (설계 문서: `docs/logic/SIMULATOR_EXTENSION.md`)

#### Phase 4: Python MVP (2주)
- [ ] **Week 1: Python 시뮬레이터 기반**
  - [ ] PySimulator 클래스
  - [ ] PyContext (names, objects)
  - [ ] AssignHandler (기본 할당)
  - [ ] 기본 타입 지원 (int, float, str, bool, None)

- [ ] **Week 2: Python 시각화**
  - [ ] PyReferenceView 컴포넌트
  - [ ] NamesPanel, ObjectsPanel
  - [ ] ReferenceArrow (SVG)
  - [ ] ListHandler, TupleHandler
  - [ ] DictHandler, SetHandler

#### Phase 5: C 고급 기능 (3주)
- [ ] 전역변수, static, Data 세그먼트
- [ ] 함수 정의, 함수 호출, 콜스택
- [ ] 함수 포인터

#### Phase 6: Python 확장 (2주)
- [ ] 함수 정의/호출, Call Frame
- [ ] 클래스/인스턴스

---

### 백엔드: 멀티언어 Executor (나중에)

| 언어 | 클래스 | 상태 |
|------|--------|------|
| C | CExecutor | ✅ 완료 |
| Python | PythonExecutor | ⏳ 예정 |
| Java | JavaExecutor | ⏳ 예정 |
| JavaScript | JSExecutor | ⏳ 예정 |

- [ ] Executor 테스트 마이그레이션

---

## 배포 (마지막에)

| 작업 | 상태 | 비고 |
|------|------|------|
| docker-compose.yml 생성 (프로덕션용) | ⏳ | 로컬 gcc 기반 본 서버 구성 |
| Dockerfile 프로덕션 최적화 | ⏳ | shared 패키지 빌드 포함 |
| `.env.production` 설정 | ⏳ | 실제 값 필요 |
| 도메인 설정 | ⏳ | Caddyfile (선택사항) |

---

## 연기된 계획

| 계획 | 진입 조건 | 문서 |
|------|----------|------|
| Chapter 구조 | DAU 50+ | `deferred/chapter_restructure.md` |
| Progress DB 서버 저장 | DAU 100+ | `deferred/progress_tracking.md` |

---

## 기술 스택 (확정)

### 언어 실행 (Executor)
- **C**: 로컬 gcc (CExecutor)
- **Python**: subprocess + python3 (나중)
- **Java**: subprocess + javac/java (나중)
- **JavaScript**: subprocess + node (나중)
- **보안**: FORBIDDEN_PATTERNS + 정책 검사 (언어별)
- **샌드박싱**: 선택적 seccomp (프로덕션)

### 데이터 & 인프라
- **DB**: Prisma + SQLite (개발) / PostgreSQL (프로덕션)
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Monorepo**: pnpm workspace
- **배포**: Docker (프로덕션에만, start-dev.sh 유지)
