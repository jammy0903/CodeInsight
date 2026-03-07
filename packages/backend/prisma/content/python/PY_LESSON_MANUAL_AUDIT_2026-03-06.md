# Python Lesson Manual Audit (2026-03-06)

검사 방식: 자동 탐지 스크립트 없이, 레슨 JSON을 스텝 단위로 수동 대조.

검사 범위(1차): `py-1-1` ~ `py-4-5`

## Findings

### 1) 실행 순서 역전 (중요)
- 파일: `packages/backend/prisma/content/python/lessons/py-1-5.json`
- 근거 라인:
  - `함수 본문` 스텝: line 33
  - `return 문` 스텝: line 66
  - `함수 호출` 스텝: line 99
- 문제:
  - 함수 호출(`result = greet("Python")`)보다 함수 본문/return 스텝이 먼저 배치됨.
  - 실제 실행 순서와 반대라 학습자에게 오해 유발.

### 2) String Interning 예시의 결정값 단정 (중요)
- 파일: `packages/backend/prisma/content/python/lessons/py-2-5.json`
- 근거 라인:
  - "예측할 수 없습니다" 설명: line 128
  - `x is y`를 False로 단정: line 177
  - `s1 = "hello" + " " + "world"`: line 229
  - `s1 is s2`를 False로 단정: line 346
- 문제:
  - 설명은 "예측 불가"라고 해놓고, 결과를 False로 고정 단정.
  - 구현/최적화 차이를 무시한 고정 결과 제시는 교육적으로 부정확.

### 3) 스텝 코드 표시와 실행 설명 불일치 (경미)
- 파일: `packages/backend/prisma/content/python/lessons/py-4-3.json`
- 근거 라인:
  - `람다 함수 실행` 스텝: line 193
  - 해당 스텝 code: `add_lambda = lambda x, y: x + y` (line 196)
- 문제:
  - 설명은 람다 호출 실행 문맥인데, code 표시는 재할당/정의 라인으로 노출됨.
  - 실행 흐름 이해가 혼동될 수 있음.

## No Major Issues (within this pass)
- `py-1-1`, `py-1-2`, `py-1-3`, `py-1-4`
- `py-2-1`, `py-2-2`, `py-2-3`, `py-2-4`
- `py-3-1`, `py-3-2`, `py-3-3`, `py-3-4`, `py-3-5`, `py-3-6`
- `py-4-1`, `py-4-2`, `py-4-4`, `py-4-5`

## Next Scope
- 계속 검사: `py-5-1`부터 후속 챕터

## Findings (Phase 2: py-5-1 ~ py-10-4)

### 4) GIL 설명의 사실 오류 (중요)
- 파일: `packages/backend/prisma/content/python/lessons/py-10-1.json`
- 근거 라인:
  - line 206: `shared_counter += 1`이 안전해서 결과가 정확히 10이라고 단정
  - line 245: "최종 값은 항상 10" 단정
- 문제:
  - `shared_counter += 1`은 원자 연산이 아니며, 락 없이 공유 상태를 수정하면 race condition이 발생할 수 있음.
  - GIL이 있다고 해서 논리적 동기화 문제가 자동으로 해결되는 것은 아님.

### 5) join 스텝의 코드 라벨 오기 (중요)
- 파일: `packages/backend/prisma/content/python/lessons/py-10-2.json`
- 근거 라인:
  - line 200: 스텝 제목은 `프로세스 종료 대기 (join)`
  - line 203: 실제 code는 `p2.start()`로 표기
- 문제:
  - 스텝 제목/설명과 코드 필드가 불일치.
  - 학습자가 join 단계를 start 호출로 오인할 수 있음.

### 6) 이벤트 루프 실행 스텝 위치 역전 (중요)
- 파일: `packages/backend/prisma/content/python/lessons/py-10-4.json`
- 근거 라인:
  - line 261: `이벤트 루프 실행` 스텝
  - line 264: `asyncio.run(main())`
  - line 96: `동시 실행 및 결과 수집 (gather)` 스텝이 앞에 위치
- 문제:
  - 실제 실행은 `asyncio.run(main())` 진입 후 `main()` 내부 gather가 실행됨.
  - 현재 스텝 순서는 실행 트리를 거꾸로 설명.

## No Major Issues (Phase 2 pass)
- `py-5-1`, `py-5-2`, `py-5-3`, `py-5-4`
- `py-6-1`, `py-6-2`, `py-6-3`, `py-6-4`, `py-6-5`, `py-6-6`
- `py-7-1`, `py-7-2`, `py-7-3`, `py-7-4`
- `py-8-1`, `py-8-2`, `py-8-3`, `py-8-4`
- `py-9-1`, `py-9-2`, `py-9-3`, `py-9-4`
- `py-10-3`

## Findings (Phase 3: python-practical 기본본)

검사 범위: `py-practical-1-1` ~ `py-practical-7-1` (기본 `.json`, en/zh 제외)

### 7) 함수 실행 순서 역전 (중요)
- 파일: `packages/backend/prisma/content/python-practical/lessons/py-practical-1-3.json`
- 근거 라인:
  - line 31: `Step 3: 보너스 계산` (함수 본문)
  - line 57: `Step 4: 결과 반환`
  - line 76: `Step 5: 함수 호출`
- 문제:
  - 함수 호출 전에 함수 본문/return 스텝이 먼저 배치됨.
  - 실제 실행 흐름(`호출 -> 본문 -> return`)과 반대.

### 8) f-string 출력값이 미평가 플레이스홀더로 저장됨 (중요)
- 파일 A: `packages/backend/prisma/content/python-practical/lessons/py-practical-1-3.json`
  - line 135: `"보너스: {my_bonus}원"`
- 파일 B: `packages/backend/prisma/content/python-practical/lessons/py-practical-5-1.json`
  - line 144: `"원본: {len(df)}행 → 정제: {len(df_clean)}행"`
- 문제:
  - 설명은 실제 평가값 출력을 말하지만, state output은 플레이스홀더 문자열 그대로 저장됨.
  - 학습자가 f-string 동작을 잘못 이해할 수 있음.

## No Major Issues (Phase 3 pass)
- `py-practical-1-1`, `py-practical-1-2`
- `py-practical-2-1`, `py-practical-2-2`, `py-practical-2-3`
- `py-practical-3-1`, `py-practical-3-2`
- `py-practical-4-1`
- `py-practical-5-2`
- `py-practical-6-1`, `py-practical-6-2`
- `py-practical-7-1`

## Remaining Scope (optional)
- 번역본 일치성 검사: `*.en.json`, `*.zh.json`

## Cross-Locale Check (en/zh)

확인 결과, 핵심 이슈는 번역본에도 동일 패턴으로 복제됨.

- `py-1-5.en/zh`: 함수 본문(code line 36), return(code line 69), 호출(code line 102) 순서 역전 동일
- `py-10-4.en/zh`: gather(code line 99/155)가 `asyncio.run(main())`(line 264)보다 먼저 설명되는 순서 역전 동일
- `py-10-2.en/zh`: join 단계에 `"code": "p2.start()"` 오기 동일
- `py-practical-1-3.en/zh`: 함수 본문/return 선행 + output 플레이스홀더(`보너스: {my_bonus}원`) 동일
- `py-practical-5-1.en/zh`: output 플레이스홀더(`원본: {len(df)}행 → 정제: {len(df_clean)}행`) 동일

