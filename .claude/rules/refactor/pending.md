# Pending Refactoring

## ✅ Completed Phases

### Phase 2: Array All Types (2026-01-11)
- char[], float[], double[] support

### Phase 3: Struct Support (2026-01-11)
- struct 정의/선언/멤버접근

### Phase 4: Function Parameters (2026-01-11)
- Pass-by-value (Lesson 5-6 지원)

### Phase 5: Error Detection + Bitwise (2026-01-11)
- Memory leak, buffer overflow detection
- Bitwise operations visualization (&, |, ^, <<, >>, ~)

---

## 🚫 Intentional Limitations (Not Bugs)

### 복잡한 수식 미지원
- `int result = a * b + c;` → 연산자 우선순위 미보장
- 이유: 커리큘럼에 복잡한 수식 없음
- 해결: `int temp = a * b;` 후 `int result = temp + c;` 분리 권장
- 교육적 효과: 각 단계별 메모리 변화를 명확히 볼 수 있음

### 배열 값에 수식 미지원
- `arr[0] = x + 10;` → NaN
- 이유: 커리큘럼엔 `arr[0] = 10;` (리터럴만)
- 의도적 제한, 수정 불필요
