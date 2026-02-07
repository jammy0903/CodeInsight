# API Routes Reference

모든 API prefix는 **`/api/v1/`** 이다. `/api/courses`가 아니라 `/api/v1/courses`.
Legacy redirect가 `/api/*` → `/api/v1/*`로 리다이렉트하지만, 직접 호출 시 반드시 `/api/v1/` 사용.

> 소스: `packages/backend/src/app.ts` (라우트 등록)

---

## Route Prefix 매핑

| Module | Prefix | 소스 파일 |
|--------|--------|-----------|
| Problems | `/api/v1/problems` | `modules/problems/routes.ts` |
| C Simulator | `/api/v1/simulators/c` | `modules/simulators/c/routes.ts` |
| Python Simulator | `/api/v1/simulators/python` | `modules/simulators/python/routes.ts` |
| Java Simulator | `/api/v1/simulators/java` | `modules/simulators/java/routes.ts` |
| JS Simulator | `/api/v1/simulators/javascript` | `modules/simulators/javascript/routes.ts` |
| AI | `/api/v1/ai` | `modules/ai/routes.ts` |
| Courses | `/api/v1/courses` | `modules/courses/routes.ts` |
| Analytics | `/api/v1/analytics` | `modules/analytics/routes.ts` |
| Notes | `/api/v1/notes` | `modules/notes/routes.ts` |
| Gamification | `/api/v1/gamification` | `modules/gamification/routes.ts` |
| Admin | `/api/v1/admin` | `modules/admin/admin.routes.ts` |
| Users | `/api/v1/users` | `modules/users/routes.ts` |
| Standalone Quizzes | `/api/v1/standalone-quizzes` | `modules/standalone-quizzes/routes.ts` |
| Submissions | `/api/v1/submissions` | `modules/submissions/routes.ts` |
| Reports | `/api/v1/reports` | `modules/reports/routes.ts` |

---

## 전체 엔드포인트 목록

### Problems (`/api/v1/problems`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/` | 문제 목록 |
| GET | `/:id` | 문제 상세 |

### C Simulator (`/api/v1/simulators/c`)
| Method | Path | 설명 |
|--------|------|------|
| POST | `/trace` | 메모리 시뮬레이션 트레이스 |
| POST | `/simulate` | C 코드 컴파일+실행 (Docker) |
| POST | `/judge` | 테스트케이스 채점 |

### Python Simulator (`/api/v1/simulators/python`)
| Method | Path | 설명 |
|--------|------|------|
| POST | `/simulate` | Python 디버거 기반 시뮬레이션 |

### Java Simulator (`/api/v1/simulators/java`)
| Method | Path | 설명 |
|--------|------|------|
| POST | `/simulate` | Java 코드 시뮬레이션 |

### JS Simulator (`/api/v1/simulators/javascript`)
| Method | Path | 설명 |
|--------|------|------|
| POST | `/simulate` | JavaScript 디버거 기반 시뮬레이션 |

### AI (`/api/v1/ai`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/explain` | 라인 변경 시 자동 설명 |
| POST | `/explain-step` | 시뮬레이션 스텝 설명 (SSE) |
| POST | `/chat` | Q&A 대화 |
| POST | `/chat/stream` | Q&A 스트리밍 (SSE) |
| POST | `/analyze-report` | 학습 리포트 AI 분석 |
| GET | `/health` | AI 서비스 헬스체크 |
| GET | `/providers` | AI 프로바이더 목록 |
| POST | `/providers/switch` | AI 프로바이더 전환 |

### Courses (`/api/v1/courses`)
| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET | `/languages` | - | 언어 목록 |
| GET | `/lessons/:id` | - | 레슨 상세 (콘텐츠+퀴즈) |
| GET | `/chapters/:id` | - | 챕터 상세 (레슨 포함) |
| GET | `/chapters/:id/progress` | required | 챕터 진행률 |
| GET | `/progress` | required | 사용자 진행 상태 |
| POST | `/progress` | required | 진행 상태 업데이트 |
| GET | `/:id` | optional | 언어 상세 (챕터 구조) |
| GET | `/:lang/chapters` | - | 언어별 챕터 목록 |

### Analytics (`/api/v1/analytics`)
| Method | Path | 설명 |
|--------|------|------|
| POST | `/activity` | 레슨 활동 시작/종료 |
| POST | `/activity/end` | 레슨 활동 종료 (sendBeacon) |
| POST | `/quiz-attempt` | 퀴즈 시도 기록 |
| GET | `/summary` | 분석 요약 |
| GET | `/profile` | 사용자 프로필 |
| POST | `/profile` | 프로필 생성/업데이트 (온보딩) |
| POST | `/session-context` | 세션 컨텍스트 저장 |
| POST | `/step-activity` | 스텝 활동 기록 (upsert) |
| POST | `/step-activities` | 스텝 활동 일괄 기록 |

### Notes (`/api/v1/notes`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/` | 노트 목록 |
| GET | `/concepts` | 개념 통계 |
| POST | `/` | 노트 생성 |
| PATCH | `/:id` | 노트 수정 |
| DELETE | `/:id` | 노트 삭제 |

### Gamification (`/api/v1/gamification`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/streak` | 현재 스트릭 조회 |
| POST | `/streak/check` | 스트릭 상태 확인 (at-risk) |
| POST | `/streak/update` | 스트릭 수동 업데이트 |

### Admin (`/api/v1/admin`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/stats` | 시스템 통계 |
| GET | `/users` | 사용자 목록 (페이지네이션) |
| GET | `/submissions` | 최근 제출 목록 |
| GET | `/system` | 시스템 상태 |
| GET | `/ai-usage` | AI 사용량 통계 |
| GET | `/reports` | 리포트 통계 |
| PATCH | `/reports/:id/resolve` | 리포트 해결 처리 |

### Users (`/api/v1/users`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/` | 사용자 목록 (admin only) |
| GET | `/check-nickname/:nickname` | 닉네임 중복 확인 |
| POST | `/register` | 사용자 등록 |
| GET | `/me` | 현재 사용자 정보 |
| GET | `/me/role` | 현재 사용자 역할 |
| POST | `/link-oauth` | OAuth 계정 연결 |
| PATCH | `/me/nickname` | 닉네임 변경 |
| DELETE | `/me` | 계정 삭제 |

### Standalone Quizzes (`/api/v1/standalone-quizzes`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/chapters` | 챕터별 퀴즈 통계 |
| GET | `/` | 퀴즈 목록 (필터) |
| POST | `/attempt` | 퀴즈 시도 기록 |
| GET | `/weak-concepts` | 취약 개념 분석 |

### Submissions (`/api/v1/submissions`)
| Method | Path | 설명 |
|--------|------|------|
| POST | `/` | 제출 생성 |
| GET | `/me` | 내 제출 목록 |
| GET | `/me/solved` | 해결한 문제 ID |

### Reports (`/api/v1/reports`)
| Method | Path | 설명 |
|--------|------|------|
| POST | `/` | 신고/문의 제출 (DB + 이메일) |

---

## 기본 엔드포인트 (prefix 없음)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/` | 서버 상태 (`✅ Backend is live`) |
| GET | `/health` | 헬스체크 |
