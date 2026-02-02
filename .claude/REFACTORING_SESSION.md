# CodeInsight 리팩토링 세션 기록

## 📅 세션 개요
- **목표**: 모바일 UI 개선, 개발/프로덕션 환경 분리, AI 연결 문제 해결
- **핵심 이슈**: 백지 화면, 환경 변수 불일치, AdMob import 오류

---

## 🎯 해결한 주요 문제들

### 1️⃣ 모바일 UI 개선
**문제**: Playground 헤더 텍스트 오버플로우
**해결**:
- 헤더 텍스트에 줄 바꿈 추가
- 글씨 크기 감소
- 모바일 반응형 개선

**파일**: `packages/frontend/src/features/pages/PlaygroundPage.tsx`

---

### 2️⃣ 개발/프로덕션 환경 완전 분리 ⭐

#### 문제점 분석
- `.env` 파일에서 `VITE_API_URL=http://localhost:3002` 설정
- 프로덕션 빌드에도 적용되어 배포 후 localhost 요청 시도
- 백엔드도 `NODE_ENV` 없이 항상 동일한 설정 사용

#### 해결 방법
Vite의 환경 변수 로딩 체계 활용:

```
.env (공통)
├── .env.development (개발용)
└── .env.production (프로덕션용)
```

**Frontend 설정:**

**`packages/frontend/.env`** (공통, API URL 제거)
```env
VITE_API_VERSION=v1
VITE_FIREBASE_API_KEY=...
VITE_FAL_API_KEY=...
```

**`packages/frontend/.env.development`** (개발용)
```env
VITE_API_URL=http://localhost:3002
```

**`packages/frontend/.env.production`** (프로덕션용)
```env
VITE_API_URL=https://c-osine-backend-5z56.onrender.com
```

**Backend 설정:**

**`packages/backend/.env.development`**
```env
NODE_ENV=development
CORS_ORIGINS=http://localhost:5174,http://localhost:5173
```

**`packages/backend/src/config/env.ts`** (환경별 로드)
```typescript
const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = nodeEnv === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
dotenv.config(); // .env 공통 설정
```

---

### 3️⃣ Content Security Policy (CSP) 수정

**문제**:
- Vite eval 차단 (`script-src`에 `'unsafe-eval'` 없음)
- localhost API 요청 차단 (`connect-src`에 `http://localhost:*` 없음)
- Worker 생성 차단 (`worker-src` 미설정)

**해결**: `packages/frontend/vite.config.ts`
```typescript
headers: {
  'Content-Security-Policy': "script-src 'self' 'unsafe-inline' 'unsafe-eval'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src 'self' https://cdn.jsdelivr.net data:; img-src 'self' data: blob: https:; connect-src 'self' http://localhost:* https: wss: ws:",
},
```

**핵심 정책**:
- `script-src 'unsafe-eval'` - Vite HMR을 위한 eval 허용
- `worker-src 'self' blob:` - 백그라운드 워커 허용
- `connect-src http://localhost:*` - 로컬호스트 API 허용
- `connect-src https: wss: ws:` - 배포 서버 & WebSocket 허용

---

### 4️⃣ AdMob Import 오류 수정 ⭐⭐

**원래 에러**:
```
Uncaught SyntaxError: The requested module '/node_modules/.vite/deps/@capacitor-community_admob.js?v=9bf05836'
does not provide an export named 'AdLoadInfo' (at admob.ts:1:103)
```

**근본 원인**:
- `AdLoadInfo`, `BannerAdOptions` 등은 TypeScript **interface**
- 컴파일된 JavaScript에서 런타임 값이 없음 (`export {}` 만 있음)
- Vite가 ESM 번들링 시 존재하지 않는 export 참조 시도

**해결**: `packages/frontend/src/services/admob.ts`

**변경 전**:
```typescript
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, ..., AdLoadInfo, ... }
  from '@capacitor-community/admob';
```

**변경 후**:
```typescript
// 런타임 값 (actual exports)
import { AdMob, BannerAdSize, BannerAdPosition, AdmobConsentStatus, RewardAdPluginEvents }
  from '@capacitor-community/admob';

// 타입 전용 (컴파일 시에만 사용)
import type { BannerAdOptions, RewardAdOptions, AdLoadInfo, AdMobRewardItem }
  from '@capacitor-community/admob';
```

**핵심**: `import type` 사용으로 TypeScript 인터페이스는 컴파일 시에만 체크되고, 런타임에는 import되지 않음.

---

### 5️⃣ DB Seed 검증 스크립트

**파일**: `packages/backend/prisma/scripts/check-seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSeed() {
  try {
    const userCount = await prisma.user.count();

    if (userCount === 0) {
      console.log('⚠️ No seed data found');
      process.exit(1); // 시드 실행 필요
    }

    console.log('✅ Seed data exists');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed');
    process.exit(2);
  }
}

checkSeed();
```

**사용**:
```bash
# 0: 시드 완료
# 1: 시드 필요 → 자동 실행
# 2: DB 연결 실패 → 스킵
npx tsx prisma/scripts/check-seed.ts
```

---

## 🚀 시작 스크립트

### `./start-dev.sh` (개발 모드)
```bash
#!/bin/bash
export NODE_ENV=development

# 1. DB Seed 확인
cd packages/backend
npx tsx prisma/scripts/check-seed.ts
if [ $? -eq 1 ]; then
  npx prisma db seed
fi

# 2. 동시 실행
cd ../..
pnpm --filter @codeinsight/backend dev &
pnpm --filter @codeinsight/frontend dev

# 브라우저: http://localhost:5174
# Backend: http://localhost:3002
```

### `./start-prod.sh` (프로덕션 빌드)
```bash
#!/bin/bash
export NODE_ENV=production

# 1. Frontend 빌드
pnpm --filter frontend run build

# 2. Capacitor 동기화
npx cap sync android

# 3. APK 빌드 (선택)
if [ "$1" = "--apk" ]; then
  cd android && ./gradlew assembleDebug
fi

# 4. Render 배포 (선택)
if [ "$1" = "--deploy" ]; then
  curl -X POST https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys
fi
```

---

## 🔍 디버깅 팁

### 환경 변수 확인
```typescript
// main.tsx에 추가
console.log('🔗 API URL:', import.meta.env.VITE_API_URL);
console.log('🔧 Environment:', {
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
});
```

### CSP 오류 확인
브라우저 DevTools → Console에서 CSP 위반 메시지 확인:
```
Refused to ... because it violates the following Content Security Policy directive
```

### Vite 캐시 초기화
```bash
# 변경사항 미반영 시
rm -rf packages/frontend/node_modules/.vite dist
pnpm dev
```

---

## 📋 체크리스트

### 개발 환경 셋업
- [x] `.env.development` 파일 생성
- [x] CSP에 `http://localhost:*` 추가
- [x] CSP에 `worker-src` 추가
- [x] `import type` 변환 (AdMob)
- [x] DB Seed 검증 스크립트
- [x] `./start-dev.sh` 스크립트

### 프로덕션 환경
- [x] `.env.production` 파일 생성
- [x] 백엔드 배포 주소 설정
- [x] `./start-prod.sh` 스크립트
- [ ] GitHub Actions CI/CD 통합 (선택사항)

---

## 🎓 학습한 개념

### 1. Vite 환경 변수 시스템
```
NODE_ENV=development  →  .env.development 로드
NODE_ENV=production   →  .env.production 로드
(미설정)              →  .env만 로드 (build 사용)
```

### 2. TypeScript vs JavaScript Export
```typescript
// TypeScript Interface (런타임에 없음)
interface User { name: string; }
export type { User };  // ✅ 타입 전용
export { User };       // ❌ 런타임 오류

// JavaScript Value (런타임에 있음)
const API_URL = '...';
export { API_URL };    // ✅ 일반 export
```

### 3. CSP 정책 설계
- 개발: `'unsafe-eval'` 허용 (Vite HMR)
- 프로덕션: 더 strict한 정책 권장
- 동적 코드 실행이 필요하면 Worker 사용

---

## 📚 참고 링크

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Content Security Policy Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [TypeScript Type-Only Imports](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export)
- [Capacitor AdMob Plugin](https://github.com/capacitor-community/admob)

---

## ✅ 최종 상태

**현재 실행 가능한 명령어**:
```bash
# 개발 모드 (백그라운드 워커, eval, localhost)
./start-dev.sh

# 또는 수동
pnpm dev

# 프로덕션 빌드
./start-prod.sh

# APK + 배포
./start-prod.sh --all
```

**다음 단계**:
1. AI 연결 테스트 (모든 환경)
2. 모바일 APK 빌드 테스트
3. 배포 서버 안정성 확인
