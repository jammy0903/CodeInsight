# claude.md - CodeInsight 프로젝트 핵심 가이드

---

## 🎯 프로젝트 개요

**CodeInsight** - 코드 실행 시각화 학습 플랫폼

### 핵심 목표
- 코드 실행 과정을 단계별로 시각화 (메모리, 변수, 콜스택)
- C, Python, JavaScript, Java 다국어 지원
- 인터랙티브한 교육 경험 제공

### 🏗️ 핵심 아키텍처: 이중 실행 구조

이 앱은 **두 가지 실행 경로**를 가진다:

| 모드 | 데이터 출처 | 시뮬레이터 사용 | 설명 |
|------|------------|---------------|------|
| **Lesson** | 사전 제작 JSON | ❌ 불필요 | 단계별 시각화 데이터가 JSON에 미리 스크립팅됨 |
| **Playground** | 동적 실행 | ✅ 사용 | 사용자 코드를 시뮬레이터가 실행하여 동적으로 시각화 생성 |

```
[ Lesson 모드 ]
  DB(JSON) → 프론트엔드 로드 → 사전 스크립팅된 단계별 시각화 표시
  - 시뮬레이터 미지원 개념(yield, decorator, async 등)도 교육 가능
  - 교육 품질을 직접 통제 가능

[ Playground 모드 ]
  사용자 코드 → 백엔드 → 시뮬레이터 실행 → JSON 변환 → 동적 시각화
  - 자유 코드 입력 가능
  - 시뮬레이터가 지원하는 범위 내에서 동작
```

### 기술 스택
- **Frontend**: React 18, Vite, TypeScript, Framer Motion
- **Backend**: Node.js, Fastify, Prisma ORM
- **Database**: PostgreSQL (Neon)
- **Simulators**: Python `sys.settrace()`, Node.js VM, C (Emscripten 검증 + 인터프리터)
- **Lesson Data**: JSON 파일 (`packages/backend/prisma/content/`) → DB seed로 자동 동기화

---

## 🎯 대화 규칙 (최우선!) ⭐⭐⭐

### 1. 설명식 대답
- 모든 대답은 **왜 이렇게 하는지** 이유를 쉽게 설명
- 코드 변경 시 **변경 이유**를 먼저 설명
- 코드만 던지지 말고, 맥락과 의도 설명

### 2. 이해 확인 절차
- **"이해했다"** 반응이 있어야만 다음 단계 진행
- 개념 하나하나 끊어서 확인
- 이해 확인 없으면 **절대 진행 금지**

### 3. 단계별 진행
```
1️⃣ 설명 → 2️⃣ 이해 확인 → 3️⃣ 다음 단계
     ↑                              │
     └──── 이해 안되면 다시 설명 ◄───┘
```

---

## ⚠️ 코드 작업 시 4대 원칙

### 1. 사용자 목표 우선주의
- **Ask First**: 제안하기 전에 사용자의 현재 목표를 먼저 파악
- "지금 해결하려는 가장 중요한 문제는?"

### 2. 상류 데이터 추적
- Props만 보지 말고, 데이터가 어디서부터 어떻게 흘러오는지 추적
- `grep`으로 역추적하여 전체 맥락 파악

### 3. 가정 배제, 선검증 후실행
- "당연히 있을 것"이라는 가정 버리기
- `read_file`로 파일 내용 직접 확인 후 작업

### 4. 진단 우선, 제안은 나중
- 섣불리 해결책부터 제시하지 않기
- 먼저 분석 내용 요약하여 중간 검증

---

## 🏗️ 프로젝트 구조

```
codeinsight-monorepo
├── packages/
│   ├── frontend/          # React Vite 앱
│   ├── backend/           # Node.js API
│   ├── shared/            # 공유 타입
│   └── simulators/        # 언어별 시뮬레이터
└── .claude/
    └── projects/codeinsight/  # 이 폴더 (홈 디렉토리)
```

---

## 🔧 자주 쓰는 명령어

```bash
# 개발 서버 시작
pnpm dev

# 빌드
pnpm build

# 테스트
pnpm test

# 특정 패키지만 작업
pnpm --filter @codeinsight/frontend dev
pnpm --filter @codeinsight/backend dev
```

---

## 📱 모바일 UI 애니메이션 규칙 (CRITICAL)
- 모든 슬라이딩/화면 전환은 **`framer-motion`의 `variants` 사용**
- Hardcoded Animation 금지: `animate={{ x: '-50%' }}` 절대 금지
- 상태 기반 선언: `state`에 따라 `variants` 동작

```tsx
// ✅ Good
const slideVariants = {
  code: { x: 0 },
  visual: { x: '-50%' }
};
<motion.div variants={slideVariants} animate={state} ... />

// ❌ Bad (절대 금지)
<motion.div animate={{ x: isCode ? 0 : '-50%' }} ... />
```

---

## 🔔 Toast 알림 시스템

모든 사용자 알림은 **중앙화된 Toast 모듈**을 통해 처리:

```typescript
import { notifyAI, notifySimulator, handleSimulatorError } from '@/components/common/Toast';

// AI Provider 알림
notifyAI.ollamaDisconnected();

// 시뮬레이터 에러 자동 분류
handleSimulatorError('Python', errorMessage);
```

---

## 📚 관련 문서

- `context/project_overview.md` - 프로젝트 상세 설명
- `context/tech_stack.md` - 기술 스택 상세
- `context/architecture.md` - 아키텍처 다이어그램
- `rules/coding_standards.md` - 코딩 규칙
- `learning/patterns.md` - 학습된 패턴들

---

## 🚀 Quick Start

```bash
# 프로젝트 클론
cd /home/jammy/projects
git clone https://github.com/jammy0903/CodeInsight.git
cd CodeInsight

# 개발 서버 시작
pnpm dev

# 접속
# Frontend: http://localhost:5174
# Backend: http://localhost:3002
```

---

## 🔐 환경 변수

프로젝트 루트의 `.env` 파일에 설정:

```env
# 백엔드
DATABASE_URL=postgresql://...
OLLAMA_API_URL=http://localhost:11434

# 프론트엔드
VITE_API_URL=http://localhost:3002
```

---

## 📋 체크리스트

### 코드 작성 시
- [ ] 목표 명확히 확인
- [ ] 기존 패턴 확인 (golden_samples)
- [ ] 데이터 흐름 파악
- [ ] 이해 확인 받음

### 커밋 전
- [ ] `pnpm build` 성공
- [ ] 로컬 테스트 완료
- [ ] 메시지 명확함

---

## 🔗 관련 링크

- **GitHub**: https://github.com/jammy0903/CodeInsight
- **로컬 경로**: `/home/jammy/projects/C-OSINE`
- **데이터베이스**: Neon PostgreSQL

---

## 💡 개발 환경 노트

### 브라우저 캐시
- ⚠️ **사용자는 항상 Vite 캐시를 제거하고 하드 리프레시를 함**
- ⚠️ **브라우저 캐시 문제로 가정하지 말 것**
- 변경사항이 반영 안 되면 → 실제 코드 문제 확인
- 캐시 클리어 제안 금지
