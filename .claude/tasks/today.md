# CodeInsight 일일 할 일

**날짜**: 2026-03-04
**우선순위**: 높음
**상태**: 진행 중

---

## ✅ 오늘 확인 완료

### 코드/문서 전수 점검
- [x] `.claude` 규칙/컨텍스트/플랜/감사 문서 전체 확인
- [x] 프론트/백엔드 엔트리포인트 및 라우트 구조 확인
- [x] 현재 워크트리 변경사항 확인 (Python lesson JSON 수정 진행 중)

### 리스크 확인
- [x] `.claude` 문서 내 민감정보 노출 흔적 식별
- [x] 문서-코드 불일치 지점 식별
  - `packages/frontend/README.md` 템플릿 상태
  - 기존 `today.md`가 2026-02-01 기준으로 노후화

---

## 🔴 오늘 즉시 작업

### 1) 보안 정리
- [x] `.claude/deployment_info.md` 내 토큰/키 문자열 마스킹
- [x] `.claude/settings.local.json` 내 노출 토큰 문자열 마스킹
- [x] Git 히스토리 포함 완전 제거 필요 여부 검토 (과거 커밋 노출 확인, rewrite 별도 필요)

### 2) 운영 문서 최신화
- [x] `today.md`를 현재 기준 상태로 업데이트
- [x] `memory/2026-03-04.md`, `MEMORY.md`에 세션 요약 기록
- [ ] `.claude`의 오래된 계획 문서 중 "완료/폐기" 태깅 정리

### 3) README 개선
- [x] `packages/frontend/README.md`를 실제 사용 문서로 교체

---

## 🟡 다음 작업

### Python lesson 데이터 정리
- [ ] py-5/6/10/13 시리즈 수정분 검토 후 커밋 단위 정리
- [ ] 설명문 스타일 가이드 확정 (간결형 vs 상세형)

### 코드 품질 잔여 이슈
- [ ] `lessonHistoryStore` STUB 처리 방향 결정 (구현/삭제)
- [ ] Sidebar 닉네임 모달 TODO 처리
- [ ] `modules/executors` Phase 2 TODO 범위 재확정

---

## 참고
- 이 문서는 현재 상태 기준 운영 노트이며, 세부 이력은 `history/`와 git 로그를 우선 참조.
