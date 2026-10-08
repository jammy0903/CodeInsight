# API Routes Reference

**All routes use prefix `/api/v1/`**. 인증 없음 (공개 API). 전역 rate limit: IP당 분당 100회.

| Module | Prefix | Source |
|--------|--------|--------|
| Courses | /courses | modules/courses/routes.ts |
| Simulators | /simulators/{c,python,javascript,java} | modules/simulators/*/routes.ts |

## Courses (read-only)
| Method | Path | 설명 |
|--------|------|------|
| GET | /courses/languages | 언어 목록 |
| GET | /courses/:lang | 언어 + 챕터 목록 |
| GET | /courses/:lang/chapters | 챕터 목록 |
| GET | /courses/chapters/:id | 챕터 + 레슨 목록 |
| GET | /courses/lessons/:id | 레슨 상세 (콘텐츠 + 퀴즈), `?locale=en|zh` |

## Simulators
| Method | Path | Body | 설명 |
|--------|------|------|------|
| POST | /simulators/c/trace | `{ code, stdin? }` | GDB 기반 단계 추적 |
| POST | /simulators/c/simulate | `{ code, stdin?, timeout? }` | 컴파일·실행 결과만 |
| POST | /simulators/python/simulate | `{ code }` | sys.settrace 추적 |
| POST | /simulators/javascript/simulate | `{ code }` | V8 Inspector 추적 (Node 22+ 필요) |
| POST | /simulators/java/simulate | `{ sourceCode }` | JDI 추적 |

기타: `GET /health`, Swagger UI `/api-docs`
