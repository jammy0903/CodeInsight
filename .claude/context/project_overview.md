# CodeInsight 프로젝트 개요

## 🎯 프로젝트 목표

**코드 실행 과정을 시각화하여 프로그래밍 학습을 돕는 플랫폼**

### 핵심 가치
1. **시각화**: 코드 실행 단계별 메모리/변수/콜스택 상태 표시
2. **인터랙티브**: 단계별 진행, 변수 추적, 퀴즈
3. **교육 중심**: 초보자도 쉽게 이해할 수 있는 UI/UX

---

## 🏗️ 핵심 아키텍처: 이중 실행 구조

### 아키텍처 전환 배경

초기에는 시뮬레이터가 모든 코드를 동적으로 실행하여 시각화를 생성하는 단일 구조였으나, 다음 문제점들이 있었다:
- 시뮬레이터가 지원하지 못하는 고급 개념(yield, decorator, async/await 등) 교육 불가
- 동적 실행 결과의 교육적 품질 통제 어려움
- 시뮬레이터 버그가 교육 품질에 직접 영향

이를 해결하기 위해 **이중 실행 구조**로 전환했다:

### 모드 1: Lesson (사전 스크립팅 방식)

```
DB(JSON 파일) → API → 프론트엔드 → 사전 제작된 단계별 시각화 표시
```

- 레슨 콘텐츠는 **JSON 파일에 단계별 시각화 데이터를 미리 스크립팅**
- 시뮬레이터를 사용하지 않음 — 코드 실행 없이 JSON 데이터만 로드
- 시뮬레이터가 지원 못하는 개념도 교육 가능 (수동 스크립팅)
- 교육 품질을 직접 통제 (변수 상태, 설명, 퀴즈 등)
- JSON 위치: `packages/backend/prisma/content/{language}/lessons/`
- 배포 시 `prisma db seed`로 DB에 자동 동기화

### 모드 2: Playground (동적 실행 방식)

```
사용자 코드 입력 → 백엔드 검증 → 시뮬레이터 실행 → JSON 변환 → 동적 시각화
```

- 사용자가 자유롭게 코드를 작성하면 시뮬레이터가 실제 실행
- 실행 결과를 파싱하여 동적으로 시각화 생성
- 시뮬레이터가 지원하는 범위 내에서만 동작

---

## 📊 주요 기능

### 1. 코드 에디터
- 여러 언어 지원 (C, Python, JavaScript, Java)
- 구문 강조
- 실시간 유효성 검사

### 2. 시뮬레이터 (Playground용)
- **C**: Emscripten 검증 + 인터프리터 실행 (하이브리드)
- **Python**: sys.settrace() 기반
- **JavaScript**: Node.js VM 기반

### 3. 시각화 엔진
- 메모리 레이아웃 (스택, 힙 - C언어)
- 변수 값 단계별 추적 (Python, JS)
- 콜 스택 표시
- 실행 흐름 하이라이트

### 4. 학습 콘텐츠 (Lesson용)
- **사전 제작된 JSON 레슨** — 시뮬레이터 없이 동작
- 단계별 explanation, 변수 상태, 메모리 시각화 포함
- 퀴즈, misconceptions, keyTakeaway 포함
- 진행 상황 추적

---

## 👥 사용자 타입

### 1. 학생
- 코드 작성 및 실행
- 단계별 추적으로 이해
- 문제 풀이

### 2. 교사
- 레슨 생성/관리
- 학생 진행 상황 모니터링

### 3. 개발자 (나)
- 새 기능 개발
- 시뮬레이터 개선
- 성능 최적화

---

## 🏗️ 아키텍처 레이어

```
┌─────────────────────────────────┐
│     Frontend (React/Vite)       │
│  - 에디터                       │
│  - 시각화 컴포넌트              │
│  - UI/UX                        │
└──────────────┬──────────────────┘
               │ REST API
┌──────────────▼──────────────────┐
│    Backend (Node.js/Express)    │
│  - API 라우팅                   │
│  - 인증/권한                    │
│  - 데이터 관리                  │
└──────────────┬──────────────────┘
               │ stdio/stdio
┌──────────────▼──────────────────┐
│  Simulators (subprocess)        │
│  - C (GCC)                      │
│  - Python (sys.settrace)        │
│  - JavaScript (VM)              │
│  - Java (JDI)                   │
└─────────────────────────────────┘
```

---

## 🗄️ 데이터 흐름

### Lesson 모드 (사전 스크립팅)
```
DB (JSON seed 데이터)
    ↓
[Backend] GET /api/lessons/:id → 레슨 데이터 반환
    ↓
[Frontend] JSON steps 로드 → 단계별 시각화 렌더링
    ↓
사용자 화면 (단계별 시각화 + 퀴즈)
```

### Playground 모드 (동적 실행)
```
사용자 입력 (코드)
    ↓
[Backend] 코드 검증
    ↓
[Backend] 시뮬레이터 선택 (언어별)
    ↓
[Simulator] 코드 실행 (디버거 모드)
    ↓
[Backend] 실행 결과 수집 → JSON 변환
    ↓
[Frontend] 시각화 엔진으로 렌더링
    ↓
사용자 화면 (단계별 시각화)
```

---

## 📱 프론트엔드 구조

```
packages/frontend/src/
├── components/
│   ├── common/           # 공통 UI (Button, Input, etc)
│   ├── editor/          # 코드 에디터
│   ├── visualizer/      # 시각화 컴포넌트
│   │   ├── MemoryView.tsx
│   │   ├── StackView.tsx
│   │   └── CallStackView.tsx
│   └── Toast.tsx        # 알림 시스템
├── features/
│   ├── playground/      # 플레이그라운드 페이지
│   ├── lessons/         # 레슨 페이지
│   └── courses/         # 과정 페이지
├── services/
│   ├── api.ts          # API 호출
│   └── simulator.ts    # 시뮬레이터 호출
├── stores/
│   └── usePlaygroundStore.ts  # Zustand
└── utils/
    └── parser.ts       # 데이터 파싱
```

---

## 🔧 백엔드 구조

```
packages/backend/src/
├── modules/
│   ├── simulators/
│   │   ├── c.ts
│   │   ├── python.ts
│   │   ├── javascript.ts
│   │   └── java.ts
│   ├── users/
│   ├── lessons/
│   └── courses/
├── services/
│   ├── validation.ts
│   └── error-handler.ts
└── app.ts
```

---

## 📄 레슨 JSON 구조 (사전 스크립팅)

레슨 데이터는 JSON 파일에 미리 스크립팅되어 있다:

```
packages/backend/prisma/content/
├── c/lessons/           # C 레슨 (c-1-1.json ~ c-10-4.json)
├── python/lessons/      # Python 레슨 (py-1-1.json ~ py-10-4.json)
├── javascript/lessons/  # JS 레슨
└── java/lessons/        # Java 레슨
```

### Lesson JSON 구조 예시
```json
{
  "lessonId": "py-3-1",
  "title": "리스트 기초",
  "concept": "리스트의 생성과 기본 조작",
  "content": {
    "code": "fruits = ['apple', 'banana']\nfruits.append('cherry')",
    "steps": [
      {
        "step": 1,
        "line": 1,
        "title": "리스트 생성",
        "explanation": "리스트를 생성하고 변수에 할당합니다.",
        "highlight": [1],
        "visualizationType": "pythonMemory",
        "pythonMemoryState": {
          "variables": [
            { "name": "fruits", "value": "['apple', 'banana']", "type": "list" }
          ],
          "output": []
        }
      }
    ]
  },
  "quiz": { "question": "...", "options": [...], "answer": 1 },
  "misconceptions": ["..."],
  "keyTakeaway": "..."
}
```

### 핵심 포인트
- **시뮬레이터 없이 동작**: JSON에 모든 시각화 데이터가 사전 정의됨
- **교육 품질 통제**: 변수 상태, explanation, 퀴즈를 직접 스크립팅
- **시뮬레이터 미지원 개념도 교육 가능**: yield, decorator, async/await 등
- **자동 배포**: JSON 수정 → git push → prisma db seed → DB 반영

---

## 🔌 시뮬레이터 프로토콜 (Playground용)

Playground 모드에서 시뮬레이터는 동일한 프로토콜 사용:

### Input (JSON)
```json
{
  "type": "c",
  "code": "int x = 5;",
  "breakpoints": [1, 3],
  "maxSteps": 100
}
```

### Output (JSON)
```json
{
  "status": "success",
  "steps": [
    {
      "step": 1,
      "line": 1,
      "variables": { "x": { "value": 5, "type": "int" } },
      "memory": { ... }
    }
  ],
  "error": null
}
```

---

## 📊 주요 데이터 모델

### User
```prisma
model User {
  id        Int     @id @default(autoincrement())
  email     String  @unique
  name      String
  role      String  // student, teacher, admin
  lessons   Lesson[]
}
```

### Lesson
```prisma
model Lesson {
  id        Int     @id @default(autoincrement())
  title     String
  content   String
  language  String  // c, python, js, java
  creator   User
}
```

### Submission
```prisma
model Submission {
  id        Int     @id @default(autoincrement())
  code      String
  language  String
  result    Json    // 시뮬레이터 결과
  user      User
  lesson    Lesson
}
```

---

## 🔄 실행 워크플로우

### 1. 사용자 코드 제출
```
Frontend → Backend POST /api/execute
```

### 2. 백엔드 처리
```
- 코드 유효성 검사
- 시뮬레이터 선택 (언어별)
- Subprocess로 시뮬레이터 실행
```

### 3. 시뮬레이터 실행
```
- 디버거 모드로 코드 실행
- 각 단계마다 상태 수집
- JSON으로 변환
```

### 4. 프론트엔드 렌더링
```
- 단계별 데이터 파싱
- 메모리/스택 시각화
- 애니메이션으로 표시
```

---

## ⚡ 성능 고려사항

### 제약 사항
- **최대 실행 시간**: 5초
- **최대 단계 수**: 10,000
- **최대 코드 길이**: 10,000자

### 최적화
- 단계 데이터 압축
- 프론트엔드에서 가상 스크롤
- 웹소켓으로 실시간 업데이트 (향후)

---

## 🔐 보안 고려사항

- 무한 루프 방지 (타임아웃)
- 악성 코드 방지 (샌드박싱)
- 파일 시스템 접근 차단
- 네트워크 접근 차단

---

## 🚀 배포

- **프론트엔드**: Render (Static Site)
- **백엔드**: Render (Docker) — 배포 시 `prisma db seed`로 JSON → DB 자동 동기화
- **데이터베이스**: Neon PostgreSQL
- **배포 방식**: Git push → Render 자동 배포
