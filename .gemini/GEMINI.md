# GEMINI.md - C-OSINE 프로젝트 핵심 가이드

---

## 🎯 대화 규칙 (최우선!) ⭐⭐⭐

### 1. 설명식 대답
- 모든 대답은 **왜 이렇게 하는지** 이유를 쉽게 설명
- 리팩토링 시 **변경 이유**를 먼저 설명
- 코드만 던지지 말고, 맥락과 의도 설명

### 2. 이해 확인 절차
- **"이해했다"** 반응이 있어야만 다음 단계 진행
- 이해 확인 없으면 **절대 진행 금지**
- 개념 하나하나 끊어서 확인
- TodoList처럼 체크하며 진행

### 3. 단계별 진행
```
1️⃣ 설명 → 2️⃣ 이해 확인 → 3️⃣ 다음 단계
     ↑                              │
     └──── 이해 안되면 다시 설명 ◄───┘
```

---

## ⚠️ CRITICAL RULES

### 🧠 코드 작업 시 사고 원칙 (최우선!) ⭐⭐⭐

**리팩토링 / 기능 추가 / 데드코드 제거 / 성능 최적화 등 모든 코드 작업 시 필수 적용!**

#### 1. First Principles 사고 - "왜?"를 3번 물어라
- 코드의 **의도**를 파악
- **근본 원인** 찾기
- **Upstream 추적**

#### 2. 🤖 에이전트 4대 행동 원칙 (실수 방지)

1.  **사용자 목표 우선주의 (Top-Priority First)**
    - **(Ask First)** 제안하기 전에 항상 사용자의 현재 작업 맥락과 최종 목표를 먼저 파악하고 질문합니다.
    - **(Align)** "지금 해결하려는 가장 중요한 문제는 무엇인가요?" 와 같이 먼저 질문하여 우선순위를 명확히 합니다.

2.  **상류 데이터 추적 (Upstream Data Tracing)**
    - **(Trace)** 컴포넌트가 받는 `props`만 보지 않고, 그 데이터가 어디서부터 어떻게 흘러오는지를 `grep` 등으로 역추적합니다.
    - **(Understand)** 데이터의 전체 생명주기를 파악하여 숨겨진 맥락(예: `rawStep` vs `step`)을 놓치지 않습니다.

3.  **가정 배제, 선검증 후실행 (Verify, Then Act)**
    - **(Check)** "당연히 있을 것"이라는 가정을 버리고, 모든 것은 `read_file`로 파일 내용을 직접 확인합니다.
    - **(Fact-Based)** 명령어는 `package.json`에서, 코드 패턴은 주변 코드에서, 용어는 정확한 기술적 의미로만 사용합니다.

4.  **진단 우선, 제안은 나중 (Diagnose First, Propose Later)**
    - **(Summarize)** 섣불리 해결책(Plan)부터 제시하지 않고, 분석한 내용(Findings)을 먼저 요약하여 공유합니다.
    - **(Confirm)** "제가 파악한 현황은 이러이러한데, 맞습니까?" 와 같이 중간 검증을 통해 잘못된 계획을 세우는 것을 원천 차단합니다.

#### 3. 최적화 아키텍처 의도 파악
- `useMemo`, `useCallback`, `React.memo` 등의 사용 의도를 파악하고 존중합니다.
- 불필요한 재렌더링을 유발하는 코드를 작성하지 않습니다.

#### 4. 리팩토링 시 Golden Samples 참조
**⚠️ 리팩토링을 시작하기 전에 `C-OSINE/.gemini/golden_samples/` 디렉토리를 반드시 확인하여 프로젝트의 모범 사례와 패턴을 숙지하세요.**

#### 5. 🔴 리팩토링 필수 검증 사항 (절대 무시 금지!)

**모든 파일 이동/리팩토링 작업 시 반드시 실행:**

```bash
# STEP 1: 의존성 파악 (이동 전 필수!)
grep -r "이동할_파일명" packages/frontend/src --include="*.tsx" --include="*.ts"

# STEP 2: 파일 이동
git mv OLD_PATH NEW_PATH

# STEP 3: Import 경로 업데이트 (STEP 1에서 찾은 모든 파일)

# STEP 4: 누락 검증 (OLD_PATH가 0개여야 함!)
grep -r "OLD_PATH" packages/frontend/src --include="*.tsx" --include="*.ts"

# STEP 5: 빌드 검증 (에러 없어야 함!)
pnpm dev
```

**⚠️ 한 단계라도 건너뛰면 프로덕션 빌드 실패 위험!**

#### 6. 📱 모바일 UI 애니메이션 규칙 (CRITICAL)
- **모든 슬라이딩/화면 전환은 반드시 `framer-motion`의 `variants`를 사용해야 합니다.**
- **Hardcoded Animation 금지**: `animate={{ x: '-50%' }}`와 같은 매직 넘버 하드코딩은 절대 허용하지 않습니다.
- **상태 기반 선언**: `state` (예: `"code"`, `"visual"`)에 따라 `variants`가 동작하도록 구현합니다.

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

### 권장 사항

**리팩토링 후 자동 검증**:
```bash
./.gemini/scripts/verify-refactoring.sh
```

**Pre-commit Hook 설정** (선택):
```bash
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
./.gemini/scripts/verify-refactoring.sh || exit 1
EOF
chmod +x .git/hooks/pre-commit
```

상세 규칙: `C-OSINE/.gemini/rules/REFACTORING.md` 참조

---

## 🚀 Quick Start

### 개발 서버 시작

```bash
# 프로젝트 루트 디렉토리에서 아래 명령어를 실행하세요.
pnpm dev
```

### 접속 URL
- 프론트엔드: http://localhost:5174
- 백엔드: http://localhost:3002

---

## 📂 버전 관리

Git, 원격 서버 배포 등 버전 관리에 대한 모든 규칙은 아래 문서를 참조하세요.

**상세 규칙:** `C-OSINE/.gemini/rules/VERSION_CONTROL.md` 참조

---

## 📚 관련 문서

- `C-OSINE/.gemini/context/` - 백엔드/프론트엔드 아키텍처 문서
- `C-OSINE/.gemini/golden_samples/` - 패턴 및 모범 사례
- `C-OSINE/.gemini/rules/` - 데이터 스키마, 리팩토링, 버전 관리 규칙

---

## 🔧 시뮬레이터 아키텍처 (Debugger-Based)

모든 언어 시뮬레이터는 **실제 디버거 기반** 접근 방식을 사용합니다:

| 언어 | 디버거 방식 | 디렉토리 |
|------|------------|----------|
| Java | JDI (Java Debug Interface) | `simulators/java/agent/` |
| Python | `sys.settrace()` | `simulators/python/agent/` |
| JavaScript | Node.js `vm` + AST 계측 | `simulators/javascript/agent/` |
| C | gcc + 메모리 시뮬레이션 | `simulators/c/` |

**공통 4단계 파이프라인**: Setup → Compile → Debug → Cleanup

**에러 처리 원칙**: 재시도 없이 즉시 에러 반환 → 프론트엔드 Toast 알림

상세: `C-OSINE/.gemini/context/backend_arch.md` 참조

---

## 🔔 Toast 알림 시스템

모든 사용자 알림은 **중앙화된 Toast 모듈**을 통해 처리합니다:

```typescript
import { notifyAI, notifySimulator, handleSimulatorError } from '@/components/common/Toast';

// AI Provider 알림
notifyAI.ollamaDisconnected();
notifyAI.backendDisconnected();

// 시뮬레이터 에러 자동 분류
handleSimulatorError('Python', errorMessage);
```

상세: `C-OSINE/.gemini/context/frontend_arch.md` 참조

---

## ⚙️ 일반 프로젝트 컨벤션

-   **환경 변수 관리**: 프로젝트에서는 `.env.example` 파일을 사용하지 않고, **오직 `.env` 파일만을 사용하여 환경 변수를 관리합니다.** 개발 및 배포 환경에 따라 `.env` 파일 내 변수를 직접 설정합니다.
