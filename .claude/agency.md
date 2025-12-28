# CodeTrace Development Guide

## Development Environment

### Running Dev Servers

```bash
# Backend (port 3000)
cd backend-node && npm run dev

# Frontend (port 5173)
cd frontend && npm run dev

# Ollama (port 11434)
ollama serve
```

### Quick Start Script
```bash
./start-dev.sh
```

---

## Project Direction

### Core Identity

> **"AI가 대신 짜준 코드조차 이해하지 못하는 사람을, 스스로 설명할 수 있는 개발자로 만드는 앱"**

### What We Do / Don't Do

| ❌ Don't | ⭕ Do |
|----------|-------|
| 코딩테스트 문제 풀이 | 코드 실행 시뮬레이션 |
| AI 코드 생성 | AI 코드 해설 |
| 점수/랭킹 | 착각 교정 |
| 알고리즘 연습 | 실행 모델 형성 |

---

## MVP Features

1. **코드 시뮬레이터** - 한 줄씩 실행, 상태 시각화
2. **메모리 시각화** - Stack/Heap/포인터 화살표
3. **AI 해설자** - 착각 포인트 설명 (코드 생성 X)
4. **개념 코스** - C 언어 10개 Day
5. **결과 예측 퀴즈** - 미세 실습

---

## Key Documents

| File | Purpose |
|------|---------|
| `.claude/CLAUDE.md` | 프로젝트 전체 개요 |
| `docs/plans/17_new_direction_mvp.md` | MVP 상세 계획 |
| `docs/reference/CURRICULUM.md` | C 개념 커리큘럼 |
| `docs/reference/reference.md` | Quick Reference |

---

## Code Style

- Use `@/` path alias (no relative paths like `../../../`)
- No `any` type
- No hardcoded values → use `config/env.ts`
- Prefer small, focused components
- Zod for all validation

---

## Commit Rules

- No Claude signatures
- No `Generated with Claude Code`
- No `Co-Authored-By: Claude`
- Korean commit messages OK
