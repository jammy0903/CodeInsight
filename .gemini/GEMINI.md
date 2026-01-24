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

#### 2. 최적화 아키텍처 의도 파악
- `useMemo`, `useCallback`, `React.memo` 등의 사용 의도를 파악하고 존중합니다.
- 불필요한 재렌더링을 유발하는 코드를 작성하지 않습니다.

#### 3. 리팩토링 시 Golden Samples 참조
**⚠️ 리팩토링을 시작하기 전에 `C-OSINE/.gemini/golden_samples/` 디렉토리를 반드시 확인하여 프로젝트의 모범 사례와 패턴을 숙지하세요.**

#### 4. 🔴 리팩토링 필수 검증 사항 (절대 무시 금지!)

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

#### 5. 📱 모바일 UI 애니메이션 규칙 (CRITICAL)
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
- 백엔드: http://localhost:3000

**⚠️ 포트 불일치 안내:**
`GEMINI.md`에 명시된 프론트엔드 개발 서버 포트는 `5174`이며, 백엔드 개발 서버 포트는 `3000`입니다.
`.mcp.json` 파일에서 `8080` 포트가 언급될 수 있으나, 이는 현재 문서화되지 않은 별도의 서비스(예: MCP 서버)에서 사용될 가능성이 높습니다.
`8080` 포트를 사용하는 서비스에 대한 명확한 문서화가 필요합니다.

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

## ⚙️ 일반 프로젝트 컨벤션

-   **환경 변수 관리**: 프로젝트에서는 `.env.example` 파일을 사용하지 않고, **오직 `.env` 파일만을 사용하여 환경 변수를 관리합니다.** 개발 및 배포 환경에 따라 `.env` 파일 내 변수를 직접 설정합니다.
