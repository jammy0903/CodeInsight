# C Playground 시뮬레이터: char 배열 + struct 지원 추가

**작성일**: 2026-02-04
**상태**: 완료

---

## 문제 분석

### 1. Char 배열 (`char str[] = "Hello"`) - 패턴 누락
- `array.handler.ts`의 `PATTERNS`에 문자열 리터럴 초기화 패턴이 없었음
- `char arr[4] = {'a','b','c','d'}` (brace init)만 지원
- `char str[] = "Hello"`, `char str[20] = "Hello"` 패턴 추가 필요

### 2. Struct - 두 가지 문제

**문제 A: 파서가 전역 struct 정의를 무시**
- `function-parser.ts`의 `parseCode()`는 함수 정의만 추출
- `struct Point { int x; int y; };`가 함수 바깥에 있으면 파서가 스킵 → StructHandler에 전달 안 됨

**문제 B: 멀티라인 struct가 한 줄 regex에 매칭 안 됨**
- `STRUCT_DEF` regex: `/^struct\s+(\w+)\s*\{([^}]+)\}\s*;?\s*$/`
- 한 줄 완결 struct만 매칭
- 여러 줄로 쓰면 매칭 실패

---

## 수정 내용 (3개 파일)

### 1. `packages/backend/src/modules/simulators/c/handlers/array.handler.ts`
- **STRING_INIT_SIZED** 패턴 추가: `char str[20] = "Hello"` (크기 명시)
- **STRING_INIT_AUTO** 패턴 추가: `char str[] = "Hello"` (크기 자동 = 문자 수 + 1)
- `canHandle()`, `handle()`에 새 패턴 분기 추가 (ARRAY_INIT보다 먼저)
- `handleStringLiteral()` 함수 추가:
  - 각 문자를 ASCII 바이트로 변환
  - null terminator `\0` 자동 추가
  - 명시 크기보다 짧으면 0 패딩
  - Phase 4 이벤트 발생

### 2. `packages/backend/src/modules/simulators/c/simulator.ts`
- `clearStructDefs` import 추가 (from `./handlers/struct.handler`)
- `simulate()` 시작 시 `clearStructDefs()` 호출 (이전 실행 잔여 정의 제거)
- `preprocessGlobalStructs()` private 메서드 추가:
  - 함수 영역(bodyStart~bodyEnd)을 파악하여 함수 바깥만 스캔
  - `struct Name {`로 시작하는 줄 감지
  - 한 줄 완결 struct → 그대로 `analyzeLine()` 호출
  - 멀티라인 struct → `}`까지 병합하여 한 줄로 만든 후 `analyzeLine()` 호출
  - StructHandler가 정의를 파싱하여 `structDefs` 맵에 저장

### 3. `packages/backend/src/modules/simulators/c/handlers/struct.handler.ts`
- 코드 변경 없음 (`clearStructDefs()`는 이미 export되어 있음)
- simulator.ts에서 import하여 호출만 추가

---

## 검증 방법

```bash
# 빌드 확인
pnpm --filter @codeinsight/backend build  # ✅ 통과

# API 테스트 - char 배열
curl -X POST http://localhost:3002/api/v1/simulators/c/trace \
  -H "Content-Type: application/json" \
  -d '{"code": "#include <stdio.h>\nint main() {\n    char str[] = \"Hello\";\n    printf(\"%s\\n\", str);\n    return 0;\n}"}'

# API 테스트 - struct
curl -X POST http://localhost:3002/api/v1/simulators/c/trace \
  -H "Content-Type: application/json" \
  -d '{"code": "#include <stdio.h>\nstruct Point {\n    int x;\n    int y;\n};\nint main() {\n    struct Point p;\n    p.x = 10;\n    p.y = 20;\n    printf(\"(%d, %d)\\n\", p.x, p.y);\n    return 0;\n}"}'
```

### 확인 포인트
- char[]: stack에 변수 나타남, value가 "Hello", bytes에 ASCII 값 + 0 (null terminator)
- struct: structDefs에 정의 등록됨, stack에 p 나타남, is_struct: true, 멤버 접근 동작
