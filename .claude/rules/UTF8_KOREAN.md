# UTF-8 Korean Text Guidelines

## Problem
Claude Code CLI (Rust)에서 한글 문자열을 바이트 인덱스로 자르면 패닉 발생:
```
byte index 86 is not a char boundary; it is inside '다' (bytes 84..87)
```

한글은 UTF-8에서 **3바이트**를 차지. 바이트 경계가 아닌 곳에서 자르면 크래시.

## Rules

### 1. JSON 데이터 작성 시
- **한 필드당 한글 80자 이내** 권장
- 긴 설명은 여러 필드로 분리 (`explanation`, `tip`, `analogy` 등)
- 줄바꿈(`\n`)으로 문단 구분

### 2. 피해야 할 패턴
```json
// BAD: 너무 긴 한글 문자열
"explanation": "이것은 매우 긴 설명입니다... (200자 이상)"

// GOOD: 분리
"explanation": "핵심 설명만 짧게",
"tip": "추가 설명은 tip에",
"analogy": "비유는 analogy에"
```

### 3. 특수문자 + 한글 조합 주의
```json
// 주의: 특수문자와 한글이 섞인 긴 문장
"text": "**볼드**와 함께 긴 한글 설명이 이어지면 위험할 수 있음"

// 권장: 짧게 유지
"text": "**볼드** 설명"
```

## Workaround
오류 발생 시:
1. 문제 필드의 한글 텍스트 길이 줄이기
2. 영어로 대체 (임시)
3. 여러 필드로 분산

## Root Cause
Claude Code CLI의 Rust 코드에서 문자열 truncation 시 `.chars()` 대신 바이트 인덱스 사용.
근본 해결은 Anthropic CLI 업데이트 필요.
