#!/bin/bash

# ==================================================
# Render API 자동 배포 스크립트
# ==================================================

set -e

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  CodeInsight Render 자동 배포${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Render API 키 확인
if [ -z "$RENDER_API_KEY" ]; then
    echo -e "${RED}❌ 에러: RENDER_API_KEY 환경변수가 설정되지 않았습니다.${NC}"
    echo ""
    echo -e "${YELLOW}설정 방법:${NC}"
    echo "1. Render Dashboard → Account Settings → API Keys"
    echo "2. API Key 생성 및 복사"
    echo "3. 터미널에서 실행:"
    echo -e "   ${GREEN}export RENDER_API_KEY='your-api-key-here'${NC}"
    echo ""
    exit 1
fi

echo -e "\n${GREEN}✓${NC} Render API 키 확인됨"

# Blueprint 배포
echo -e "\n${BLUE}📦 Blueprint 배포 시작...${NC}"

OWNER_ID=$(curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
    "https://api.render.com/v1/owners" | jq -r '.[0].owner.id')

if [ -z "$OWNER_ID" ] || [ "$OWNER_ID" = "null" ]; then
    echo -e "${RED}❌ Owner ID를 가져올 수 없습니다. API 키를 확인하세요.${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Owner ID: $OWNER_ID"

# Blueprint 배포
echo -e "\n${BLUE}🚀 서비스 생성 중...${NC}"

RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $RENDER_API_KEY" \
    -H "Content-Type: application/json" \
    "https://api.render.com/v1/blueprints" \
    -d '{
        "ownerId": "'$OWNER_ID'",
        "repo": "https://github.com/jammy0903/CodeInsight",
        "autoDeploy": "yes",
        "branch": "main"
    }')

echo "$RESPONSE" | jq '.'

# 배포 성공 확인
if echo "$RESPONSE" | jq -e '.services' > /dev/null 2>&1; then
    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ 배포 성공!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    echo -e "\n${BLUE}📍 다음 단계:${NC}"
    echo "1. Render Dashboard에서 서비스 확인"
    echo "2. 환경변수 설정 (DATABASE_URL, FIREBASE_*, VITE_*)"
    echo "3. 서비스 URL 확인 후 CORS 설정 업데이트"
    echo ""
    echo -e "${YELLOW}⚠️  환경변수는 Render Dashboard에서 수동으로 설정해야 합니다.${NC}"
    echo ""
else
    echo -e "\n${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ 배포 실패${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}에러 메시지:${NC}"
    echo "$RESPONSE" | jq -r '.message // .error // "Unknown error"'
    echo ""
    exit 1
fi
