# CodeInsight TODO

> 마지막 업데이트: 2026-01-08

---

## 완료된 항목

### Phase 1: 코스 시스템 기초
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

### Phase 2: 아키텍처 개선 (2026-01-08 완료)
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

---

## 현재 진행 중

### 1. CourseMemoryView → 독립 페이지 + 사이드바 (예정)
- [ ] MemoryVisualizerPage 또는 MemoryPage 생성
- [ ] CourseMemoryView를 메인 컴포넌트로 활용
- [ ] Sidebar에 "Memory" 메뉴 추가
- [ ] 학습 중이 아닐 때도 메모리 상태 볼 수 있게

### 2. Python Executor 구현 (Phase 3)
- [ ] PythonExecutor 클래스 생성
- [ ] subprocess로 python 실행
- [ ] 보안 정책 (Python 전용)
- [ ] IExecutor 구현

### 3. Java Executor 구현 (Phase 3)
- [ ] JavaExecutor 클래스 생성
- [ ] javac + java subprocess
- [ ] 보안 정책 (Java 전용)
- [ ] IExecutor 구현

### 4. JavaScript/Node Executor 구현 (Phase 3)
- [ ] JSExecutor 클래스 생성
- [ ] node subprocess
- [ ] 보안 정책 (JS 전용)
- [ ] IExecutor 구현

### 5. Executor 테스트 작성
- [ ] c-executor.test.ts 마이그레이션 (새 구조로)
- [ ] python-executor.test.ts
- [ ] java-executor.test.ts
- [ ] js-executor.test.ts

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
