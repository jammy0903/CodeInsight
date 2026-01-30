# CodeInsight 프로젝트 개요

## 🎯 프로젝트 목표

**코드 실행 과정을 시각화하여 프로그래밍 학습을 돕는 플랫폼**

### 핵심 가치
1. **시각화**: 코드 실행 단계별 메모리/스택/힙 상태 표시
2. **인터랙티브**: 단계별 진행, 브레이크포인트, 변수 추적
3. **교육 중심**: 초보자도 쉽게 이해할 수 있는 UI/UX

---

## 📊 주요 기능

### 1. 코드 에디터
- 여러 언어 지원 (C, Python, JavaScript, Java)
- 구문 강조
- 실시간 유효성 검사

### 2. 시뮬레이터
- **C**: GCC + 메모리 시뮬레이션
- **Python**: sys.settrace() 기반
- **JavaScript**: Node.js VM 기반
- **Java**: JDI (Java Debug Interface) 기반

### 3. 시각화 엔진
- 메모리 레이아웃 (스택, 힙)
- 변수 값 실시간 추적
- 콜 스택 표시
- 실행 흐름 하이라이트

### 4. 학습 콘텐츠
- 사전 제작된 레슨
- 인터랙티브 문제
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

```
사용자 입력 (코드)
    ↓
[Backend] 코드 검증
    ↓
[Backend] 시뮬레이터 선택
    ↓
[Simulator] 코드 실행 (디버거 모드)
    ↓
[Backend] 실행 결과 수집
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

## 🔌 시뮬레이터 프로토콜

모든 시뮬레이터는 동일한 프로토콜 사용:

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

- **프론트엔드**: Vercel / Railway
- **백엔드**: Railway / Heroku
- **데이터베이스**: Neon PostgreSQL
- **모니터링**: Sentry
