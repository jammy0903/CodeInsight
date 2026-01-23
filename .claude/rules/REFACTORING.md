# REFACTORING.md - C-OSINE 프로젝트 리팩토링 규칙 총정리

프론트엔드 & 백엔드 리팩토링 시 반드시 지켜야 할 규칙들

---

# 🎨 Part 1: Frontend (React/Vite 예시)

## 1. Import Path Rules (파일 이동 시)
- 파일 이동 후 **모든 import 경로 업데이트 필수!**
- [예시: `components/common/`에서 `../../` 사용, `pages/`에서 `../` 사용 등]

## 2. 폴더 구조 원칙
```
✅ 올바른 구조 (pnpm monorepo)
packages/
└── frontend/
    └── src/
        ├── components/   # 재사용 가능한 공통 UI 컴포넌트
        ├── features/     # 도메인/기능별 컴포넌트 및 로직 (페이지 역할)
        ├── hooks/        # 커스텀 훅
        ├── layouts/      # 페이지 전체 레이아웃
        ├── services/     # API 호출 로직
        ├── stores/       # Zustand 전역 상태 관리
        └── utils/        # 범용 유틸리티 함수
```
- **2개 이상 페이지에서 사용** | `components/`
- **1개 페이지에서만 사용** | `pages/xxx/components/` (필요한 경우)

## 3. Frontend 리팩토링 체크리스트 (필수 강제 사항!)

**⚠️ 각 단계를 순서대로 실행하고 검증하지 않으면 절대 다음 단계로 넘어가지 마세요!**

### 3.1 사전 검증 (Pre-check)
```bash
# 1. Git 상태 확인
git status
# → 반드시 깨끗한 상태에서 시작 (커밋되지 않은 변경사항 없음)

# 2. 현재 빌드 성공 확인
pnpm dev
# → 에러 없이 빌드되는지 확인 (Ctrl+C로 종료)
```

### 3.2 파일 이동 전 의존성 분석 (Dependency Analysis)
```bash
# 3. 이동할 파일을 import하는 모든 파일 찾기
grep -r "from.*파일명" packages/frontend/src --include="*.tsx" --include="*.ts"
# 예: grep -r "from.*JSMemoryFlowView" packages/frontend/src --include="*.tsx" --include="*.ts"

# 4. 결과를 기록하고 업데이트할 파일 리스트 작성
# 예: PlaygroundPage.tsx, LessonPage.tsx 등
```

### 3.3 파일 이동 실행
```bash
# 5. git mv로 파일 이동 (히스토리 보존)
git mv packages/frontend/src/features/OLD_PATH packages/frontend/src/features/NEW_PATH
```

### 3.4 Import 경로 업데이트 (Critical!)
```bash
# 6. 3.2에서 찾은 모든 파일의 import 경로 수정
# 각 파일을 열어 import 경로를 새 경로로 변경

# 7. 자동 검증: 이동한 파일명으로 다시 검색
grep -r "OLD_PATH" packages/frontend/src --include="*.tsx" --include="*.ts"
# → 결과가 0개여야 함! 하나라도 있으면 수정 누락!
```

### 3.5 빌드 검증 (Critical!)
```bash
# 8. TypeScript 컴파일 확인
pnpm --filter frontend build
# → 에러 없이 완료되어야 함

# 9. Dev 서버 실행 확인
pnpm dev
# → 브라우저에서 관련 페이지 열어보기
# → 콘솔 에러 확인 (F12)
# → 404 에러가 없는지 Network 탭 확인
```

### 3.6 커밋
```bash
# 10. 변경사항 확인 후 커밋
git status
git add .
git commit -m "refactor: Move 파일명 from OLD_PATH to NEW_PATH"
```

---

## ❌ 리팩토링 실패 사례 분석

### 사례 1: js-visualizer → visualizers/js 이동 실패

**문제**:
```typescript
// PlaygroundPage.tsx (업데이트 누락!)
import { JSMemoryFlowView } from '@/features/js-visualizer/components/JSMemoryFlowView';
import { useJsToFlow } from '@/features/js-visualizer/hooks/useJsToFlow';

// 404 에러: http://localhost:5174/src/features/js-visualizer/hooks/useJsToFlow.ts
```

**원인**:
1. grep으로 의존성 파일 찾기를 하지 않음
2. import 경로 업데이트를 누락함
3. pnpm dev로 빌드 검증을 하지 않음
4. 브라우저 콘솔 확인을 하지 않음

**올바른 절차**:
```bash
# 1. 의존성 찾기
grep -r "js-visualizer" packages/frontend/src --include="*.tsx" --include="*.ts"
# → PlaygroundPage.tsx 발견

# 2. 파일 이동
git mv packages/frontend/src/features/js-visualizer packages/frontend/src/features/visualizers/js

# 3. import 경로 업데이트
# PlaygroundPage.tsx 수정:
# - from '@/features/js-visualizer/...'
# + from '@/features/visualizers/js/...'

# 4. 재검증
grep -r "js-visualizer" packages/frontend/src --include="*.tsx" --include="*.ts"
# → 결과: 0개 (성공!)

# 5. 빌드 확인
pnpm dev
# → 에러 없음 확인
```

---

# ⚙️ Part 2: Backend (Node.js/Express.js 예시)

## 1. 폴더 구조
```
packages/
└── backend/
    └── src/
        ├── app.ts          # Express 앱 진입점
        ├── modules/        # 도메인별 모듈 디렉토리
        │   ├── users/      # 예시: 사용자 모듈
        │   │   ├── routes.ts
        │   │   ├── service.ts
        │   │   └── types.ts
        │   └── problems/   # 예시: 문제 모듈
        │       └── ...
        ├── config/         # 환경 변수 및 설정
        └── services/       # 여러 모듈에서 공유하는 서비스 (필요시)
```

## 2. API 라우터 패턴
- 라우터는 요청 처리만 담당하고, 비즈니스 로직은 서비스 계층으로 분리합니다.
- [예시: `app.use('/api/v1/users', userRoutes);`]

## 3. Service Layer 패턴
- 비즈니스 로직을 `services/` 폴더에 분리하여 재사용성 및 테스트 용이성을 높입니다.

## 4. DB 접근 규칙
- ORM/ODM(예: Sequelize, Mongoose, Prisma)을 사용하여 데이터베이스와 상호작용합니다.
- 직접적인 SQL 쿼리 사용은 최소화하고, 필요한 경우 별도 리포지토리(repository) 계층을 둡니다.

## 5. Backend 리팩토링 체크리스트
- [ ] 라우터 이동/수정 시 `app.js` (또는 메인 진입점)의 라우터 등록 확인
- [ ] 프론트엔드 API 호출 경로 업데이트
- [ ] 모델 수정 시 마이그레이션 필요 여부 확인
- [ ] 관련 서비스/리포지토리 함수 업데이트

---

# 📦 Part 3: 써드파티 라이브러리 업데이트 대응

라이브러리 버전 업데이트 후 발생하는 문제를 해결하고, 실수를 방지하기 위한 규칙입니다.

## 1. 'Breaking Changes' (주요 변경점) 확인 필수
- `npm install` 또는 `pnpm up` 실행 후에는 항상 라이브러리의 **CHANGELOG**나 **Release Notes**를 확인하여 주요 변경점이 있는지 파악해야 합니다.
- 특히 타입 정의(`.d.ts`) 파일이 변경되었거나, 컴포넌트 이름이 바뀌는 경우가 잦습니다.

## 2. 타입 전용 Import 사용 (`import type`)
- 라이브러리가 값(value)이 아닌 타입(type)만 export하는 경우, `import type`을 사용해야 합니다.
- 이를 지키지 않으면 "does not provide an export named '...'" 오류가 발생합니다.

- **예시 (`reactflow` v11+)**:
  ```typescript
  // ❌ 잘못된 사용법 (런타임 오류 발생)
  import { Node, Edge } from 'reactflow';

  // ✅ 올바른 사용법
  import type { Node, Edge } from 'reactflow';
  // 또는
  import { type Node, type Edge } from 'reactflow';
  ```

## 3. 컴포넌트/API 이름 변경 확인
- 라이브러리 업데이트 시, 기존에 사용하던 컴포넌트나 함수의 이름이 변경될 수 있습니다.
- 공식 문서를 확인하거나, `node_modules` 내의 타입 정의 파일(`d.ts`)을 직접 확인하는 것이 가장 확실합니다.

- **예시 (`react-resizable-panels` v2.0.0 → v4.4.1)**:
  - `ResizablePanelGroup` → `Group`
  - `ResizablePanel` → `Panel`
  - `ResizableHandle` → `Separator` (또는 다른 이름, 버전마다 확인 필요)

  ```typescript
  // ❌ 이전 버전 사용법
  import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from 'react-resizable-panels';

  // ✅ 최신 버전 사용법 (예시)
  import { Group, Panel, Separator } from 'react-resizable-panels';
  ```

---

## 🤖 자동 검증 도구

### 리팩토링 검증 스크립트

모든 리팩토링 작업 후 자동 검증:

```bash
# 리팩토링 완료 후 실행
./.gemini/scripts/verify-refactoring.sh
```

**검증 항목**:
1. ✅ Git 상태 확인
2. ✅ 폐기된 import 경로 검색 (js-visualizer 등)
3. ✅ 누락된 export 확인
4. ✅ TypeScript 컴파일 검증

**통과 조건**:
- 폐기된 경로 참조 0개
- 모든 export 정상
- TypeScript 컴파일 에러 0개

---

## 🎯 앞으로의 권장 사항 (Best Practices)

### 1. 리팩토링 전 필수 실행

파일 이동 전 의존성 파악:

```bash
# 이동할 파일을 import하는 모든 파일 찾기
grep -r "이동할_파일명" packages/frontend/src --include="*.tsx" --include="*.ts"

# 예시: JSMemoryFlowView를 이동하기 전
grep -r "JSMemoryFlowView" packages/frontend/src --include="*.tsx" --include="*.ts"
```

### 2. 리팩토링 후 필수 실행

자동 검증 스크립트 실행:

```bash
# 모든 리팩토링 작업 완료 후
./.gemini/scripts/verify-refactoring.sh

# 통과하면:
# ✅ 리팩토링 검증 통과!

# 실패하면:
# ❌ N개의 문제 발견!
# → 폐기된 경로 수정 후 재실행
```

### 3. Pre-commit Hook 추가 (선택 사항)

리팩토링 실수를 커밋 전에 방지:

```bash
# .git/hooks/pre-commit 파일 생성/수정
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# 리팩토링 검증
./.gemini/scripts/verify-refactoring.sh || exit 1
EOF

# 실행 권한 부여
chmod +x .git/hooks/pre-commit
```

**효과**:
- 폐기된 경로가 포함된 커밋 자동 차단
- 빌드 실패 위험 사전 방지
- 코드 리뷰 시간 절약

---

## 📚 참고 자료

- `C-OSINE/.gemini/golden_samples/` - 패턴 및 모범 사례
- `C-OSINE/.gemini/scripts/verify-refactoring.sh` - 자동 검증 스크립트