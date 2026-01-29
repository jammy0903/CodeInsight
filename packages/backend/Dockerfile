# ==========================================
# Stage 1: Build Java Agent for Java Simulator
# ==========================================
FROM eclipse-temurin:17-jdk-jammy AS java-builder

WORKDIR /build

# Java 소스 복사 및 컴파일
COPY packages/backend/src/modules/simulators/java/agent /build
RUN mkdir -p build/classes && \
    javac -encoding UTF-8 -d build/classes src/main/java/com/vis/*.java && \
    jar cfe build/debugger-agent.jar com.vis.DebuggerAgent -C build/classes .

# ==========================================
# Stage 2: Build TypeScript Backend
# ==========================================
FROM node:20-slim AS builder

WORKDIR /app

# pnpm 설치
RUN npm install -g pnpm

# pnpm workspace 파일 복사
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# 의존성 파일만 먼저 복사 (캐시 최적화)
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json ./packages/shared/

# 의존성 설치
RUN pnpm install --frozen-lockfile

# 소스 코드 복사
COPY packages/backend ./packages/backend
COPY packages/shared ./packages/shared

# Java agent 복사
COPY --from=java-builder /build/build/debugger-agent.jar ./packages/backend/src/modules/simulators/java/agent/build/

# 1. Shared 패키지 빌드 (workspace 의존성)
WORKDIR /app/packages/shared
RUN pnpm build

# 2. Prisma 클라이언트 생성
WORKDIR /app/packages/backend
RUN npx prisma generate

# 3. TypeScript 빌드
RUN npx tsc

# 4. JavaScript/Python Agent 파일들을 dist로 복사 (TypeScript 컴파일 대상 아님)
RUN cp -r src/modules/simulators/javascript/agent dist/modules/simulators/javascript/ && \
    cp -r src/modules/simulators/python/agent dist/modules/simulators/python/

# ==========================================
# Stage 3: Production Runtime
# ==========================================
FROM node:20-slim

WORKDIR /app

# 프로덕션 의존성만 설치
RUN npm install -g pnpm

# 필요한 시스템 패키지 설치 (gcc, python 등)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    python3 \
    python3-pip \
    default-jre \
    && rm -rf /var/lib/apt/lists/*

# pnpm workspace 파일 복사
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./

# 빌드된 파일 복사
COPY --from=builder /app/packages/backend/package.json ./packages/backend/
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/prisma ./packages/backend/prisma
COPY --from=builder /app/packages/backend/src/modules/simulators ./packages/backend/src/modules/simulators

# 의존성 설치 (devDependencies 포함 - prisma CLI 필요)
RUN pnpm install --frozen-lockfile

WORKDIR /app/packages/backend

# Prisma 클라이언트 생성
RUN pnpm prisma generate

# 포트 노출
EXPOSE 3002

# 헬스체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 실행
CMD ["node", "dist/app.js"]
