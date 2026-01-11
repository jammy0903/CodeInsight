# Frontend 구조 정리 계획

> 작성일: 2026-01-12
> 우선순위: 중간
> 예상 소요: 1-2일

---

## 📋 목표

- 중복/불명확한 디렉토리 정리
- 환경변수 관리 개선
- 불필요한 의존성 제거
- Import 경로 일관성 확보

---

## 🔍 현재 문제점

### 1. 중복 디렉토리 (frontend/ vs packages/frontend/)

```
codeinsight/CodeInsight/
├── frontend/              # ⚠️ 용도 불명확
│   ├── .vite/             # Vite 캐시?
│   ├── src/
│   │   └── features/      # packages/frontend/src/features와 중복?
│   └── .env.production
└── packages/
    └── frontend/          # ✅ 메인 프론트엔드
        ├── src/
        ├── package.json
        └── ...
```

**문제**:
- 어느 것이 실제 소스인지 혼란
- 빌드 시 경로 에러 가능성
- 개발자 온보딩 시 혼란

**원인 파악 필요**:
- `frontend/`가 빌드 아티팩트인지 확인
- 레거시 디렉토리인지 확인
- 실제로 사용되는지 확인 (`start-dev.sh` 확인)

---

### 2. 환경변수 관리

**현재**:
```
packages/frontend/
├── .env.example         # 예시
└── (실제 .env 파일은 gitignore)

frontend/
└── .env.production      # ⚠️ 왜 여기에?
```

**문제**:
- 개발/프로덕션 환경 구분 없음
- .env 파일 위치 불명확
- 로컬 개발 시 설정 누락 가능

---

### 3. 불필요한 의존성

**확인 필요**:
```json
// packages/frontend/package.json
{
  "dependencies": {
    "nes.css": "^2.3.0",           // ⚠️ 사용 안 함 (제거됨)
    "boring-avatars": "^2.0.4",    // ⚠️ 사용 여부 확인
    "react-xarrows": "^2.0.2"      // ⚠️ 사용 여부 확인
  }
}
```

**확인 방법**:
```bash
cd packages/frontend
pnpm exec unimported
```

---

### 4. Import 경로 불일치

**혼재된 패턴**:
```typescript
// 상대 경로 (지양)
import { Button } from '../../components/ui/button';

// Alias 경로 (권장)
import { Button } from '@/components/ui/button';

// 모듈 경로 (선호)
import { CourseCard } from '@/features/courses/components';
```

**문제**:
- 코드 이동 시 import 깨짐
- 가독성 저하

---

## 🎯 해결 방안

### Task 1: 중복 디렉토리 정리

#### 1.1 현황 파악
```bash
# frontend/ 용도 확인
cat start-dev.sh | grep frontend
ls -la frontend/

# 빌드 스크립트 확인
cat package.json | grep build
```

#### 1.2 결정 트리
```
frontend/ 디렉토리가...
├─ 빌드 아티팩트?      → .gitignore에 추가, 삭제
├─ Vite 캐시?          → packages/frontend/.vite로 이동
├─ 레거시?             → 백업 후 삭제
└─ 실제 사용?          → packages/frontend/로 병합
```

#### 1.3 실행 (예시: 빌드 아티팩트인 경우)
```bash
# .gitignore 업데이트
echo "/frontend/.vite" >> .gitignore
echo "/frontend/dist" >> .gitignore

# 삭제 (주의: 백업 후)
rm -rf frontend/

# 문서 업데이트
# CLAUDE.md, README.md 등에서 frontend/ 언급 제거
```

---

### Task 2: 환경변수 분리

#### 2.1 파일 구조 개선
```
packages/frontend/
├── .env.example              # Git에 커밋 (예시)
├── .env.development.example  # 개발 환경 예시
├── .env.production.example   # 프로덕션 예시
├── .env.development          # 로컬 개발 (gitignore)
└── .env.production           # 프로덕션 (gitignore)
```

#### 2.2 환경별 변수 분리
```bash
# .env.development.example
VITE_API_URL=http://localhost:3002
VITE_FIREBASE_AUTH_EMULATOR=true
VITE_LOG_LEVEL=debug

# .env.production.example
VITE_API_URL=https://api.codeinsight.io
VITE_FIREBASE_AUTH_EMULATOR=false
VITE_LOG_LEVEL=error
```

#### 2.3 Vite 설정 업데이트
```typescript
// vite.config.ts
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // mode에 따라 .env.development 또는 .env.production 로드
    envPrefix: 'VITE_',
    // ...
  };
});
```

#### 2.4 Scripts 업데이트
```json
// package.json
{
  "scripts": {
    "dev": "vite --mode development --port 5174",
    "build:dev": "vite build --mode development",
    "build:prod": "vite build --mode production"
  }
}
```

---

### Task 3: 불필요한 의존성 제거

#### 3.1 사용되지 않는 패키지 확인
```bash
cd packages/frontend

# 방법 1: unimported 도구 사용
pnpm exec unimported

# 방법 2: 수동 검색
grep -r "nes.css" src/        # 사용처 확인
grep -r "boring-avatars" src/
grep -r "react-xarrows" src/
```

#### 3.2 제거 실행
```bash
# 확인 후 제거
pnpm remove nes.css
pnpm remove boring-avatars  # 사용 안 하면
pnpm remove react-xarrows   # 사용 안 하면

# lock 파일 정리
pnpm install
```

#### 3.3 Import 제거
```bash
# 관련 import 검색 및 제거
grep -r "from 'nes.css'" src/
grep -r "import 'nes.css'" src/
```

---

### Task 4: Import 경로 일관성 확보

#### 4.1 규칙 정의
```typescript
// ✅ 권장: Alias 경로
import { Button } from '@/components/ui/button';
import { useCourseProgress } from '@/features/courses/hooks';

// ✅ 허용: 같은 디렉토리 내
import { ChapterCard } from './ChapterCard';

// ❌ 지양: 상대 경로 (3단계 이상)
import { Button } from '../../../components/ui/button';
```

#### 4.2 자동 수정 (ESLint 활용)
```javascript
// eslint.config.js
export default [
  {
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          '../../../*',  // 3단계 이상 상대 경로 금지
          '../../components/*',  // components는 @/ 사용
        ]
      }]
    }
  }
];
```

#### 4.3 기존 코드 수정
```bash
# 일괄 검색
grep -r "from '\.\./\.\./\.\." src/ | wc -l

# VS Code 대량 수정
# 1. Ctrl+Shift+F
# 2. 정규식: from ['"]\.\./\.\./\.\.
# 3. 수동으로 @/ 경로로 변경
```

---

## 📁 기대 결과

### Before
```
codeinsight/CodeInsight/
├── frontend/              # ⚠️ 혼란
├── packages/
│   └── frontend/
│       ├── .env.example
│       └── src/
└── .gitignore
```

### After
```
codeinsight/CodeInsight/
└── packages/
    └── frontend/
        ├── .env.example
        ├── .env.development.example
        ├── .env.production.example
        └── src/              # ✨ 깔끔한 import
```

---

## ✅ 체크리스트

### Phase 1: 조사 (1-2시간)
- [ ] `frontend/` 디렉토리 용도 파악
- [ ] `start-dev.sh` 스크립트 분석
- [ ] 사용되지 않는 패키지 목록 작성

### Phase 2: 정리 (2-3시간)
- [ ] 중복 디렉토리 제거/병합
- [ ] .gitignore 업데이트
- [ ] 환경변수 파일 분리 (.env.development, .env.production)
- [ ] 불필요한 의존성 제거

### Phase 3: 리팩토링 (3-4시간)
- [ ] Import 경로 일관성 확보 (자동화 스크립트)
- [ ] ESLint 규칙 추가
- [ ] Vite 설정 업데이트

### Phase 4: 검증 (1-2시간)
- [ ] 개발 서버 정상 작동 확인
- [ ] 프로덕션 빌드 테스트
- [ ] E2E 테스트 통과 확인

### Phase 5: 문서화 (1시간)
- [ ] CLAUDE.md 업데이트 (디렉토리 구조)
- [ ] README.md 업데이트 (환경변수 가이드)
- [ ] 리팩토링 히스토리 기록

---

## 🚨 주의사항

1. **백업 필수**: `frontend/` 삭제 전 백업
2. **점진적 적용**: 한 번에 모두 변경하지 말고 Task별로 커밋
3. **테스트 확인**: 각 Task 후 `pnpm dev` 실행 확인
4. **Git 히스토리**: 의미 있는 커밋 메시지 작성

---

## 📊 우선순위

| Task | 우선순위 | 리스크 | 소요 시간 |
|------|---------|--------|----------|
| 중복 디렉토리 정리 | 🔴 높음 | 낮음 | 1-2h |
| 환경변수 분리 | 🟡 중간 | 낮음 | 2-3h |
| 의존성 제거 | 🟢 낮음 | 낮음 | 1h |
| Import 일관성 | 🟡 중간 | 중간 | 3-4h |

---

## 🔗 관련 문서

- `.claude/rules/DEVELOPMENT.md` - HMR 설정
- `docs/architecture/SYSTEM_OVERVIEW.md` - 시스템 구조
- `packages/frontend/README.md` - 프론트엔드 가이드
