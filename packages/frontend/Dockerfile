# ========================================
# CodeInsight Frontend Dockerfile
# ========================================
# ⚠️  이 파일은 프로덕션 배포(service)용입니다.
#
# 개발(development) 환경에서는:
#   ./start-dev 스크립트를 사용하세요!
#
# Multi-stage Build:
#   Stage 1: 소스 빌드 (node_modules 포함)
#   Stage 2: 빌드 결과물만 추출 (경량화)
# ========================================

# ===========================
# Stage 1: Builder
# ===========================
FROM node:20-alpine AS builder

WORKDIR /app

# 의존성 파일 복사 (캐싱 최적화)
COPY package*.json ./

# 의존성 설치
RUN npm ci

# 소스 코드 복사
COPY . .

# 프로덕션 빌드
RUN npm run build

# ===========================
# Stage 2: 빌드 결과물만 추출
# ===========================
FROM scratch AS dist

# Builder stage에서 빌드 결과만 복사
COPY --from=builder /app/dist /dist
