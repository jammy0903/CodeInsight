# Keep Files - 삭제 금지 파일 목록

> 이 파일들은 현재 미사용이지만, **Phase 2 (실시간 코드 시뮬레이터)** 기능 구현 시 필요합니다.

---

## 실시간 코드 실행 시스템

| 파일 | 용도 | 비고 |
|------|------|------|
| `frontend/src/services/tracer.ts` | 메모리 트레이스 API | 백엔드 `/api/memory/trace` 호출 |
| `frontend/src/services/crunner.ts` | C 코드 실행/채점 API | 백엔드 `/api/c/run`, `/api/c/judge` 호출 |
| `frontend/src/types/memory.ts` | 트레이서 타입 정의 | `MemoryBlock`, `Step`, `TraceResult` |

---

## 관련 백엔드 엔드포인트

```
POST /api/c/run      - C 코드 실행
POST /api/c/judge    - 테스트 케이스 채점
POST /api/memory/trace - 메모리 트레이스 (GDB 기반)
```

---

## Phase 2 예상 사용처

1. **실시간 시뮬레이터 페이지** - 사용자가 코드 입력 → 실시간 메모리 시각화
2. **실습 문제 시스템** - 코드 제출 → 자동 채점
3. **디버깅 모드** - 브레이크포인트 설정, 스텝 실행

---

**작성일**: 2026-01-03
