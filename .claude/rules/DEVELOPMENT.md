# Development Rules

## HMR (Hot Module Replacement) 설정 확인됨

### ✅ 확인 사항
- **Vite는 기본적으로 HMR 지원** (`vite.config.ts`에서 확인)
- 개발 서버 실행 시 자동으로 HMR 활성화
- 코드 변경 시 자동 리로드 (빌드 불필요)

### 🚫 개발 중 빌드 금지

**절대로 개발 중에는 `npm run build` 또는 `pnpm build`를 실행하지 마세요.**

#### 빌드를 해야 하는 경우 (예외)
1. **package.json 변경 시** - 의존성 변경 후 빌드 확인
2. **빌드 에러 확인 시** - TypeScript 타입 에러 확인용

#### 개발 서버 실행 방법
```bash
# 개발 서버 시작
./start-dev.sh

# 개발 서버 종료
./stop-dev.sh

# 또는 루트에서
pnpm dev
```

#### 포트 설정
- **Backend**: 3002
- **Frontend**: 5174

### 왜 빌드하면 안 되나요?

1. **시간 낭비**: HMR이 있으므로 빌드 없이 즉시 반영
2. **리소스 낭비**: 빌드는 프로덕션 배포용
3. **개발 속도 저하**: 빌드 시간(~15초) vs HMR(즉시)

### 프로덕션 배포 시에만 빌드

```bash
# 프로덕션 빌드
pnpm build

# Docker 배포
docker compose up -d
```
