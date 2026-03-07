# CPP Lesson Manual Audit (2026-03-07)

검사 방식: 자동 탐지 스크립트 없이 `cpp-*.json` 기본본을 스텝/코드/stdout 기준으로 수동 대조.

검사 범위: `cpp-1-1` ~ `cpp-6-2` (기본 `.json`)

## Findings

### 1) stdout 누락 (수정 완료)
- 파일: `packages/backend/prisma/content/cpp/lessons/cpp-4-2.json`
- 문제(수정 전): `leaky()` 내부 `cout << *p << endl;`로 출력되는 `999`가 최종 stdout에 반영되지 않음.
- 수정(현재): 최종 stdout을 `999\nleaky 종료`로 보정.

### 2) locale 혼재 문자열 (수정 완료)
- 파일:
  - `packages/backend/prisma/content/cpp/lessons/cpp-4-2.en.json`
  - `packages/backend/prisma/content/cpp/lessons/cpp-4-2.zh.json`
- 문제(수정 전): en/zh 코드 문자열/주석에 한국어 텍스트(`leaky 종료`, `를 빠뜨림!`)가 섞여 있음.
- 수정(현재):
  - en: `// forgot delete p!`, `cout << "leaky done" << endl;`, stdout `999\nleaky done`
  - zh: `// 忘记调用 delete p!`, `cout << "leaky 结束" << endl;`, stdout `999\nleaky 结束`

## No Major Issues (manual pass)
- `cpp-1-1`, `cpp-1-2`, `cpp-1-3`
- `cpp-2-1`, `cpp-2-2`
- `cpp-3-1`, `cpp-3-2`
- `cpp-4-1`
- `cpp-5-1`, `cpp-5-2`
- `cpp-6-1`, `cpp-6-2`


## Locale Consistency Pass (en/zh)

추가 점검: `cpp-*.en.json`, `cpp-*.zh.json`의 코드/주석 내 언어 혼재 확인.

### 수정 사항
- `cpp-5-1.en.json`
  - `// p가 스코프를 벗어나면 자동 delete` -> `// automatic delete when p leaves scope`
- `cpp-6-1.en.json`
  - `// ... 오류! ...` -> `// error: cannot bind lvalue reference to rvalue`
- `cpp-5-1.zh.json`
  - `// p가 스코프를 벗어나면 자동 delete` -> `// p 离开作用域时会自动 delete`
- `cpp-6-1.zh.json`
  - `// ... 오류! ...` -> `// 错误！不能将左值引用绑定到右值`

### 검증
- en 파일 내 한글/중문 미검출
- zh 파일 내 한글 미검출
- 수정 파일 JSON 파싱 정상

## CPP Full Structural Parity Check (ko/en/zh)

추가 수행:
- 대상: `cpp-1-1` ~ `cpp-6-2` 전체
- 기준: ko 기준으로 en/zh의 step 개수, step별 stack 존재 여부, frame marker 존재 여부, stdout 존재 여부

결과:
- 구조 불일치 0건
- frame marker 누락 0건
- stdout 존재 패턴 불일치 0건
- en 파일 내 한글/한자 재검사: 이상 없음
- zh 파일 내 한글 재검사: 이상 없음

## Manual Step-by-Step Recheck (Memory Viewer Correctness)

검사 방식:
- 자동 패턴 탐지 없이 `cpp-1-1` ~ `cpp-6-2` 기본본(`.json`)을 직접 열어
- 각 step의 `code`와 `stack/heap/stdout` 상태를 논리적으로 1:1 대조

결과 요약:
- 렌더링을 깨는 치명 이슈(프레임 마커 누락, stdout 유실, 타입 파싱 오류): **0건**
- 교육 표현/스텝 정합성(코드 스니펫 vs 표시 상태) 불일치: **4건 발견, 전부 수정 완료(ko/en/zh)**

### A) 코드 스니펫-스택 상태 정합성 불일치 (교육 품질, 수정 완료)

1. `cpp-1-3.*` step 1
- code: `int a = 10;`
- stack: `a`, `b` 둘 다 이미 생성된 상태로 표시
- 수정: code를 `int a = 10;\nint b = 20;`로 보정(ko/en/zh 동일).

2. `cpp-6-1.*` step 1
- code: `int x = 10;`
- stack: `x`, `y` 둘 다 이미 생성된 상태로 표시
- 수정: code를 `int x = 10;\nint y = x + 5;`로 보정(ko/en/zh 동일).

3. `cpp-4-1.*` step 3
- code: `delete p;`
- stack: `p = nullptr` 상태로 표시
- 수정: code를 `delete p;\np = nullptr;`로 보정(ko/en/zh 동일).

### B) 설명 문구-메모리 시각화 불일치 (교육 품질, 수정 완료)

4. `cpp-2-1.*` step 1
- explanation: `string greeting = "Hello"`가 "내부적으로 힙에 문자 데이터를 할당"한다고 단정
- visualization: heap은 빈 배열(`[]`)로 표시
- 수정: SSO/구현체 의존성을 반영한 조건형 설명으로 교체(ko/en/zh 동일).

### 참고
- 위 4건은 메모리 뷰어 렌더링 자체를 깨는 버그는 아니며, 학습자 관점에서 step 정합성/설명 정확도를 떨어뜨리는 품질 이슈입니다.

## Locale Wording Cleanup (en/zh, 2차 수동 보정)

목적:
- 메모리 뷰어 로직은 유지하면서, step title/explanation의 직역/오역 표현을 수동 정리

반영 파일(주요):
- en: `cpp-1-1`, `cpp-1-2`, `cpp-1-3`, `cpp-2-1`, `cpp-3-1`, `cpp-4-1`, `cpp-4-2`, `cpp-5-1`, `cpp-5-2`, `cpp-6-1`, `cpp-6-2`
- zh: `cpp-1-1`, `cpp-1-3`, `cpp-2-1`, `cpp-3-1`, `cpp-3-2`, `cpp-4-1`, `cpp-4-2`, `cpp-5-1`, `cpp-5-2`, `cpp-6-1`, `cpp-6-2`

예시 수정:
- en
  - `Pointer reallocation` -> `Reassign pointer`
  - `Used as a backreference` -> `Dereference for access`
  - `movement semantics` -> `move semantics`
- zh
  - `创建参考文献` -> `创建引用`
  - `电路输出` -> `遍历输出`
  - `输入泄漏函数` -> `进入 leaky 函数`

검증:
- 수정된 en/zh JSON 전체 파싱 정상 (`jq empty` 통과)
