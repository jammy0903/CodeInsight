# Python 레슨 스캔 인수인계 프롬프트

아래 내용을 새 세션에 그대로 붙여넣으세요.

---

## 프롬프트 시작

너는 CodeInsight 프로젝트의 Python 레슨 JSON 파일 품질 검사를 이어서 진행해야 해.

### 프로젝트 위치
- 모노레포 루트: `/home/jammy/projects/C-OSINE`
- 백엔드: `/home/jammy/projects/C-OSINE/packages/backend`
- Python 레슨 파일들: `/home/jammy/projects/C-OSINE/packages/backend/prisma/content/python/lessons/`
- 스캔 계획 문서: `/home/jammy/projects/C-OSINE/packages/backend/prisma/content/python/PY_LESSON_SCAN_PLAN.md`

### 이전 작업 완료 현황

Python 레슨 47개 파일을 4단계로 나눠서 스캔 중이다. Phase 1~3은 완료됨.

| Phase | 대상 | 파일 수 | 상태 | 수정 건수 |
|-------|------|---------|------|-----------|
| Phase 1 | Ch1-2 (py-1-1~py-1-5, py-2-1~py-2-4) | 10개 | ✅ 완료 | 0건 |
| Phase 2 | Ch3-4 (py-3-1~py-3-6, py-4-1~py-4-5) | 11개 | ✅ 완료 | 2건 (한국어 통일) |
| Phase 3 | Ch5-6 (py-5-1~py-5-4, py-6-1~py-6-6) | 10개 | ✅ 완료 | 0건 |
| **Phase 4** | **Ch7-10 (py-7-1~py-10-4)** | **16개** | **⬅️ 이것부터** | - |
| Phase 5 | 종합 결과 정리 | - | 대기 | - |

### Phase 4 대상 파일 (16개)

```
py-7-1, py-7-2, py-7-3, py-7-4    (Ch7: 메모리 관리와 GC)
py-8-1, py-8-2, py-8-3, py-8-4    (Ch8: 이터레이터/제너레이터)
py-9-1, py-9-2, py-9-3, py-9-4    (Ch9: 클로저/데코레이터)
py-10-1, py-10-2, py-10-3, py-10-4 (Ch10: GIL/비동기)
```

### 검사 기준 (파일마다 확인할 것)

1. **모든 step에 `explanation` 필드가 있는가?**
2. **`visualizationType`이 `"pythonMemory"`이면 `pythonMemoryState.variables[]` 데이터가 정확한가?**
   - 변수가 있어야 할 step에서 사라지지 않는가?
   - 값이 해당 시점의 실제 값과 일치하는가?
3. **`visualizationType`이 `"terminal"`이면 — 메모리 시각화 없는 레슨으로 기록**
4. **quiz/misconceptions/keyTakeaway/concept이 모두 한국어인가?** (영어면 한국어로 수정)
5. **교육적으로 정확한가?** (quiz 정답, explanation 내용)

### 수정 규칙

- **데이터 오류 발견 시**: 해당 JSON 파일을 직접 수정
- **영어 텍스트 발견 시**: quiz, misconceptions, keyTakeaway, concept 필드를 한국어로 번역 수정
- **수정 후**: `PY_LESSON_SCAN_PLAN.md`에 Phase 4 결과 섹션 추가

### Phase 4 특별 주의사항

이 영역은 **시뮬레이터가 지원하지 않는 기능**이 많아서 가장 위험하다:

- **Ch8**: yield/제너레이터 → 핸들러 없음
- **Ch9**: 데코레이터 → 핸들러 없음
- **Ch10**: async/await → 핸들러 없음

이런 레슨들은 `visualizationType: "terminal"` (정적 시각화)로 처리되었을 가능성이 높다. 이것 자체는 문제가 아니다. 핵심은 **explanation 존재 여부**와 **한국어 통일** 확인이다.

### 이전 Phase에서 발견된 패턴

- **C 레슨에서 발견된 "변수 사라짐" 버그**: Python에서는 발생하지 않음 (Phase 1~3 모두 확인)
- **curriculum 미등록 파일**: py-1-5, py-2-5, py-3-5, py-3-6, py-4-5 — 5개 존재 (Ch7-10에는 없을 것으로 예상)
- **py-3-5, py-3-6**: `visualizationType: "terminal"` + 영어 텍스트 → 한국어 수정 완료
- **py-2-5**: 영어 quiz/misconceptions → 한국어 수정 완료

### 작업 순서

1. `PY_LESSON_SCAN_PLAN.md`를 먼저 읽어서 전체 맥락 파악
2. Ch7 파일 4개 (py-7-1~py-7-4) 병렬로 읽고 분석
3. Ch8 파일 4개 (py-8-1~py-8-4) 병렬로 읽고 분석
4. Ch9 파일 4개 (py-9-1~py-9-4) 병렬로 읽고 분석
5. Ch10 파일 4개 (py-10-1~py-10-4) 병렬로 읽고 분석
6. 문제 발견 시 수정
7. `PY_LESSON_SCAN_PLAN.md`에 Phase 4 결과 추가 (Phase 1~3 결과 섹션 형식 따라서)
8. Phase 4 완료 후 Phase 5 (종합) 진행

### 결과 보고 형식

Phase 완료 시 아래 형식으로 보고해줘:

```
## Phase 4 결과
- 스캔: N개 파일
- 데이터 이슈: N건
- 한국어 수정: N건
- 수정한 파일 목록: ...
```

Phase 4 시작해.

---

## 프롬프트 끝
