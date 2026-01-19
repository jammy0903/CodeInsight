#!/bin/bash

# =================================================
# CodeInsight Clean Start Script
# =================================================
# 'node_modules'와 'pnpm-lock.yaml'을 완전히 삭제하고
# 의존성을 재설치한 후 개발 서버를 시작합니다.
#
# 서버가 이상하게 동작할 때만 사용하세요!
# (평소에는 ./start-dev.sh 사용)
# =================================================

set -e

# Colors for output
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}Performing a full clean & restart...${NC}"

# 1. Delete root node_modules and lockfile
echo -e "\n${YELLOW}[1/3] Deleting root node_modules and pnpm-lock.yaml...${NC}"
rm -rf node_modules
rm -f pnpm-lock.yaml
echo -e "${GREEN}[✓] Project cleaned.${NC}"

# 2. Re-install all dependencies from scratch
echo -e "\n${YELLOW}[2/3] Reinstalling all dependencies with pnpm...${NC}"
pnpm install
echo -e "${GREEN}[✓] Dependencies reinstalled.${NC}"

# 3. Run the standard development server
echo -e "\n${YELLOW}[3/3] Starting the dev server...${NC}"
exec ./start-dev.sh
