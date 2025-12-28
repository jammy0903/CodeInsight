# C-OSINE Backend
# Node.js + Docker CLI (for gcc execution)

FROM node:20-alpine

# Docker CLI 설치 (호스트 Docker와 통신용)
RUN apk add --no-cache docker-cli

WORKDIR /app

# 의존성 먼저 (캐시 활용)
COPY package*.json ./
RUN npm ci --only=production

# Prisma 생성
COPY prisma ./prisma
RUN npx prisma generate

# 소스 복사
COPY dist ./dist

# 환경변수
ENV NODE_ENV=production
ENV PORT=3002

EXPOSE 3002

CMD ["node", "dist/app.js"]
