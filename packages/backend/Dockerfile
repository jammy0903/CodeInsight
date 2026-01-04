# ========================================
# CodeInsight Backend Dockerfile
# ========================================
# ⚠️  이 파일은 프로덕션 배포(service)용입니다.
#
# 개발(development) 환경에서는:
#   ./start-dev 스크립트를 사용하세요!
#
# 자동 빌드:
#   소스 복사 → npm install → npm run build → 실행
# ========================================

FROM node:20-alpine

# Docker CLI 설치 (C 코드 실행을 위한 호스트 Docker와 통신용)
RUN apk add --no-cache docker-cli

WORKDIR /app

# 의존성 파일 복사 (캐싱 최적화)
COPY package*.json ./

# 의존성 설치 (프로덕션 + 개발 의존성 모두 설치 - 빌드용)
RUN npm ci

# Prisma 스키마 복사 및 생성 (있다면)
COPY prisma ./prisma
RUN npx prisma generate || true

# 소스 코드 복사
COPY . .

# TypeScript 빌드
RUN npm run build

# 개발 의존성 제거 (용량 절약)
RUN npm prune --production

# 환경변수 기본값
ENV NODE_ENV=production
ENV PORT=3002

# 포트 노출
EXPOSE 3002

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 시작 명령어
CMD ["node", "dist/app.js"]
