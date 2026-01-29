#!/bin/bash

# ==================================================
# Railway CLI 안전한 배포 스크립트 (환경변수 기반)
# ==================================================

set -e

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  CodeInsight Railway 안전 배포${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# ==================================================
# 1. .env 파일 확인 및 로드
# ==================================================
echo -e "\n${BLUE}🔍 환경 파일 확인 중...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env 파일이 없습니다!${NC}"
    echo -e "${YELLOW}다음 명령어로 .env 파일을 생성하세요:${NC}"
    echo -e "${YELLOW}  cp .env.example .env${NC}"
    echo -e "${YELLOW}  # 그 다음 .env에서 실제 값들을 입력하세요${NC}"
    exit 1
fi

# .env 파일 로드
set -a
source .env
set +a

echo -e "${GREEN}✓ .env 파일 로드 완료${NC}"

# ==================================================
# 2. 필수 환경변수 확인
# ==================================================
echo -e "\n${BLUE}✅ 필수 환경변수 확인 중...${NC}"

REQUIRED_VARS=(
    "RAILWAY_TOKEN"
    "DATABASE_URL"
    "FIREBASE_PROJECT_ID"
    "FIREBASE_CLIENT_EMAIL"
    "DEEPSEEK_API_KEY"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}❌ 다음 환경변수가 설정되지 않았습니다:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo -e "${RED}   - $var${NC}"
    done
    exit 1
fi

echo -e "${GREEN}✓ 모든 필수 환경변수가 설정되었습니다${NC}"

# ==================================================
# 3. Railway CLI 설치 확인
# ==================================================
echo -e "\n${BLUE}🔧 Railway CLI 확인 중...${NC}"

if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}⚠️  Railway CLI가 설치되지 않았습니다. 설치를 시작합니다...${NC}"
    npm install -g @railway/cli
    echo -e "${GREEN}✓ Railway CLI 설치 완료!${NC}"
else
    echo -e "${GREEN}✓ Railway CLI 설치 확인됨${NC}"
fi

# ==================================================
# 4. Railway 토큰 설정
# ==================================================
echo -e "\n${BLUE}🔐 Railway 인증 중...${NC}"

export RAILWAY_TOKEN="${RAILWAY_TOKEN}"

if ! railway status &> /dev/null; then
    echo -e "${RED}❌ Railway 토큰이 유효하지 않습니다!${NC}"
    echo -e "${YELLOW}.env 파일의 RAILWAY_TOKEN을 확인하세요${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Railway 인증 성공${NC}"
railway status

# ==================================================
# 5. 백엔드 환경변수 설정
# ==================================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  📝 백엔드 환경변수 설정${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${YELLOW}📋 설정할 환경변수:${NC}"
echo "  - NODE_ENV: ${NODE_ENV}"
echo "  - PORT: ${PORT}"
echo "  - DATABASE_URL: ✓ 설정됨"
echo "  - FIREBASE_PROJECT_ID: ${FIREBASE_PROJECT_ID}"
echo "  - FIREBASE_CLIENT_EMAIL: ${FIREBASE_CLIENT_EMAIL}"
echo "  - DEEPSEEK_API_KEY: ✓ 설정됨"
echo "  - FAL_API_KEY: ✓ 설정됨"

echo -e "\n${BLUE}🔄 Railway에 환경변수 설정 중...${NC}"

# 백엔드 환경변수 설정
railway variables set \
  NODE_ENV="${NODE_ENV:-production}" \
  PORT="${PORT:-3002}" \
  DATABASE_URL="${DATABASE_URL}" \
  FIREBASE_PROJECT_ID="${FIREBASE_PROJECT_ID}" \
  FIREBASE_CLIENT_EMAIL="${FIREBASE_CLIENT_EMAIL}" \
  ADMIN_FIREBASE_UID="${ADMIN_FIREBASE_UID:-}" \
  DEEPSEEK_API_KEY="${DEEPSEEK_API_KEY}" \
  DEEPSEEK_BASE_URL="${DEEPSEEK_BASE_URL:-https://api.deepseek.com}" \
  FAL_API_KEY="${FAL_API_KEY:-}" \
  DOCKER_IMAGE="${DOCKER_IMAGE:-gcc:latest}" \
  DOCKER_MEMORY_LIMIT="${DOCKER_MEMORY_LIMIT:-128m}" \
  DOCKER_CPU_LIMIT="${DOCKER_CPU_LIMIT:-0.5}" 2>&1 | grep -E "✓|error|warn" | head -20

echo -e "${GREEN}✓ 백엔드 환경변수 설정 완료${NC}"

# ==================================================
# 6. 프론트엔드 환경변수 설정
# ==================================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🎨 프론트엔드 환경변수 설정${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${YELLOW}📋 설정할 환경변수:${NC}"
echo "  - VITE_API_URL: ${VITE_API_URL}"
echo "  - VITE_APP_ENV: ${VITE_APP_ENV}"

echo -e "\n${BLUE}🔄 Railway에 환경변수 설정 중...${NC}"

railway variables set \
  VITE_API_URL="${VITE_API_URL}" \
  VITE_APP_ENV="${VITE_APP_ENV:-production}" 2>&1 | grep -E "✓|error|warn" | head -10

echo -e "${GREEN}✓ 프론트엔드 환경변수 설정 완료${NC}"

# ==================================================
# 7. 수동 설정 필요 사항
# ==================================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}⚠️  수동으로 설정해야 할 항목${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${YELLOW}다음 항목은 Railway Web UI에서 수동으로 설정하세요:${NC}"
echo -e "${YELLOW}1. FIREBASE_PRIVATE_KEY${NC}"
echo -e "   - Railway 대시보드 → Backend 서비스 → Variables"
echo -e "   - 'FIREBASE_PRIVATE_KEY' 추가"
echo -e "   - 값: -----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY-----"
echo -e "\n${YELLOW}2. 기타 민감한 환경변수가 필요하면 같은 방식으로 추가${NC}"

# ==================================================
# 완료
# ==================================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ CLI 배포 준비 완료!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${YELLOW}📋 다음 단계:${NC}"
echo -e "\n${GREEN}1️⃣  수동 설정 (위 참고)${NC}"
echo -e "\n${GREEN}2️⃣  Railway 대시보드에서 배포 확인:${NC}"
echo -e "   https://railway.app/dashboard"
echo -e "\n${GREEN}3️⃣  또는 CLI에서 배포:${NC}"
echo -e "   railway up --detach"
echo -e "\n${GREEN}4️⃣  배포 상태 확인:${NC}"
echo -e "   railway logs --tail 100"

