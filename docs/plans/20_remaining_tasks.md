# CodeInsight 남은 작업 계획

> 작성일: 2025-12-28

---

## 개요

Phase 1~2 보안 작업 완료 후 남은 기능 구현 목록.

### 완료된 작업 (2025-12-28)
- [x] 테스트 인프라 (vitest)
- [x] FORBIDDEN_PATTERNS 보강 (28개 패턴)
- [x] 보안 패턴 테스트 (47개)
- [x] Firebase Admin 초기화
- [x] 인증 미들웨어 (requireAuth, requireDbUser, requireAdmin)
- [x] Rate Limiting (일반/인증/AI/실행)
- [x] /me 패턴 URL 재설계
- [x] 시스템 아키텍처 문서화

---

## Phase 1: DayPage 핵심 기능

MVP 완성을 위한 핵심 기능.

### 1.1 DayPage 구현
- [ ] Day 학습 화면 레이아웃
- [ ] 시뮬레이터 + 퀴즈 + AI 해설 통합
- [ ] 라우팅: `/courses/:lang/:day`

### 1.2 시뮬레이터 연동
- [ ] 코스 데이터의 steps와 메모리 시각화 연결
- [ ] 스텝 네비게이션 (이전/다음)
- [ ] 현재 줄 하이라이팅

### 1.3 퀴즈 컴포넌트
- [ ] 결과 예측 퀴즈 UI
- [ ] 정답 확인 + 해설 표시
- [ ] 퀴즈 완료 상태 저장

---

## Phase 2: 실습 문제 연동

코스와 Problem 테이블 연결.

### 2.1 Problem 스키마 확장
```prisma
model Problem {
  // 기존 필드...
  courseId    String?  // "c" | "python" | "java"
  dayNumber   Int?     // 1, 2, 3...
  type        String?  // "exercise" | "challenge"
}
```
- [ ] Prisma 스키마 수정
- [ ] 마이그레이션 실행

### 2.2 실습 문제 시드 데이터
- [ ] C Day 1: 변수 교환 문제
- [ ] C Day 2: 포인터 기초 문제
- [ ] C Day 3: 배열 문제

### 2.3 ExercisePanel 컴포넌트
- [ ] 문제 설명 표시
- [ ] 코드 에디터 (Monaco)
- [ ] 테스트케이스 실행
- [ ] 제출 + 결과 표시

---

## Phase 3: 프론트엔드 인증 연동

백엔드 인증 API와 프론트엔드 연결.

### 3.1 API 클라이언트 유틸리티
```typescript
// services/api.ts
export async function authFetch(url: string, options?: RequestInit) {
  const token = await getIdToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}
```
- [ ] authFetch 구현
- [ ] 에러 핸들링 표준화

### 3.2 user.ts 서비스
- [ ] registerUser() → POST /api/users/register
- [ ] getCurrentUser() → GET /api/users/me
- [ ] getUserRole() → GET /api/users/me/role

### 3.3 submission.ts 서비스
- [ ] createSubmission() → POST /api/submissions
- [ ] getMySubmissions() → GET /api/submissions/me
- [ ] getMySolved() → GET /api/submissions/me/solved

---

## Phase 4: 부가 기능

### 4.1 진행률 추적
- [ ] 로그인 사용자: DB 저장
- [ ] 비로그인 사용자: localStorage
- [ ] CoursesPage에 진행률 표시

### 4.2 ChatPage 구현
- [ ] AI 튜터 독립 페이지
- [ ] 대화 기록 유지
- [ ] 코드 컨텍스트 전달

---

## 권장 구현 순서

```
1. DayPage 구현 ─────────────┐
2. 시뮬레이터 연동 ──────────┼─► MVP 완성
3. 퀴즈 컴포넌트 ────────────┘

7. API 클라이언트 ───────────┐
8. user.ts 서비스 ───────────┼─► 인증 연동
9. submission.ts 서비스 ─────┘

4. Problem 스키마 확장 ──────┐
5. 실습 문제 시드 데이터 ────┼─► 실습 기능
6. ExercisePanel 컴포넌트 ───┘

10. 진행률 추적 ─────────────┐
11. ChatPage 구현 ───────────┴─► 부가 기능
```

---

## 예상 소요

| Phase | 작업 | 복잡도 |
|-------|------|--------|
| 1 | DayPage + 시뮬레이터 + 퀴즈 | 높음 |
| 2 | 실습 문제 연동 | 중간 |
| 3 | 프론트엔드 인증 | 낮음 |
| 4 | 진행률 + ChatPage | 중간 |

---

## 관련 문서

- `docs/architecture/SYSTEM_OVERVIEW.md` - 시스템 전체 구조
- `docs/reference/COURSE_DATA_STRUCTURE.md` - 코스 데이터 구조
- `docs/reference/CURRICULUM.md` - C 개념 커리큘럼
