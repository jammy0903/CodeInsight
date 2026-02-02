#!/bin/bash

# ========================================
# CodeInsight Production Build & Deploy
# ========================================
# 프로덕션 빌드 및 배포 스크립트
#
# 사용:
#   ./start-prod.sh           # 빌드만
#   ./start-prod.sh --deploy  # 빌드 + Render 배포
#   ./start-prod.sh --apk     # 빌드 + APK 생성
#   ./start-prod.sh --all     # 빌드 + APK + 배포
#
# 이 스크립트는:
#   - NODE_ENV=production 설정
#   - .env.production 파일 사용
#   - 프론트엔드 프로덕션 빌드
#   - Android APK 빌드 (--apk)
#   - Render 배포 트리거 (--deploy)
# ========================================

set -e

export NODE_ENV=production

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOWNLOADS_DIR="/mnt/c/Users/jammy/Downloads"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Arguments
BUILD_APK=false
DEPLOY_RENDER=false

for arg in "$@"; do
    case $arg in
        --apk)
            BUILD_APK=true
            ;;
        --deploy)
            DEPLOY_RENDER=true
            ;;
        --all)
            BUILD_APK=true
            DEPLOY_RENDER=true
            ;;
    esac
done

echo -e "${MAGENTA}"
echo "╔═══════════════════════════════════════╗"
echo "║  CodeInsight Production Build         ║"
echo "║  NODE_ENV=production                  ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# 버전 정보 읽기
VERSION=$(grep 'versionName' "$PROJECT_DIR/android/app/build.gradle" | sed 's/.*"\(.*\)".*/\1/')
echo -e "${CYAN}[i] Current Version: v${VERSION}${NC}\n"

# ========================================
# Step 0: DB Seed 확인
# ========================================
echo -e "${CYAN}[0/4] DB Seed 상태 확인 중...${NC}"
cd "$PROJECT_DIR/packages/backend"

if npx tsx scripts/check-seed.ts 2>/dev/null; then
    echo -e "${GREEN}[✓] DB Seed 확인 완료${NC}"
else
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 1 ]; then
        echo -e "${YELLOW}[!] Seed 데이터 없음 - 자동 실행${NC}"
        npx prisma db seed
        echo -e "${GREEN}[✓] Seed 완료${NC}"
    else
        echo -e "${YELLOW}[!] DB 연결 실패 - Seed 스킵${NC}"
    fi
fi

# ========================================
# Step 1: Frontend 프로덕션 빌드
# ========================================
echo -e "${CYAN}[1/4] Frontend 프로덕션 빌드 중...${NC}"
cd "$PROJECT_DIR/packages/frontend"

# 캐시 삭제
rm -rf node_modules/.vite dist 2>/dev/null || true

# 프로덕션 빌드 (자동으로 .env.production 사용)
pnpm run build

if [ -d "dist" ]; then
    echo -e "${GREEN}[✓] Frontend 빌드 완료!${NC}"
else
    echo -e "${RED}[✗] Frontend 빌드 실패!${NC}"
    exit 1
fi

# ========================================
# Step 2: Capacitor Sync
# ========================================
echo -e "\n${CYAN}[2/4] Capacitor 동기화 중...${NC}"
cd "$PROJECT_DIR"
npx cap sync android

echo -e "${GREEN}[✓] Capacitor 동기화 완료!${NC}"

# ========================================
# Step 3: APK 빌드 (선택)
# ========================================
if [ "$BUILD_APK" = true ]; then
    echo -e "\n${CYAN}[3/4] Android APK 빌드 중...${NC}"
    cd "$PROJECT_DIR/android"

    # Gradle 빌드
    ./gradlew assembleDebug

    APK_PATH="$PROJECT_DIR/android/app/build/outputs/apk/debug/app-debug.apk"

    if [ -f "$APK_PATH" ]; then
        # APK 복사
        TIMESTAMP=$(date +%Y%m%d-%H%M%S)
        APK_NAME="CodeInsight-v${VERSION}-${TIMESTAMP}.apk"
        cp "$APK_PATH" "$DOWNLOADS_DIR/$APK_NAME"

        echo -e "${GREEN}[✓] APK 빌드 완료!${NC}"
        echo -e "${GREEN}    → $DOWNLOADS_DIR/$APK_NAME${NC}"
    else
        echo -e "${RED}[✗] APK 빌드 실패!${NC}"
        exit 1
    fi
else
    echo -e "\n${YELLOW}[3/4] APK 빌드 건너뜀 (--apk 옵션 없음)${NC}"
fi

# ========================================
# Step 4: Render 배포 (선택)
# ========================================
if [ "$DEPLOY_RENDER" = true ]; then
    echo -e "\n${CYAN}[4/4] Render 배포 트리거 중...${NC}"

    # .env에서 RENDER_API_KEY 로드
    if [ -f "$PROJECT_DIR/packages/backend/.env" ]; then
        source <(grep RENDER_API_KEY "$PROJECT_DIR/packages/backend/.env")
    fi

    if [ -z "$RENDER_API_KEY" ]; then
        echo -e "${RED}[✗] RENDER_API_KEY가 설정되지 않았습니다.${NC}"
        echo -e "${YELLOW}    packages/backend/.env 또는 환경변수에 설정하세요.${NC}"
        exit 1
    fi

    # Render Deploy Hook 호출
    RENDER_SERVICE_ID="srv-d5s6sti4d50c73d50q6g"

    RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $RENDER_API_KEY" \
        "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys")

    DEPLOY_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

    if [ -n "$DEPLOY_ID" ]; then
        echo -e "${GREEN}[✓] Render 배포 시작됨!${NC}"
        echo -e "${GREEN}    Deploy ID: $DEPLOY_ID${NC}"
        echo -e "${YELLOW}    배포 상태: https://dashboard.render.com${NC}"
    else
        echo -e "${RED}[✗] Render 배포 실패!${NC}"
        echo "$RESPONSE"
        exit 1
    fi
else
    echo -e "\n${YELLOW}[4/4] Render 배포 건너뜀 (--deploy 옵션 없음)${NC}"
fi

# ========================================
# 완료 메시지
# ========================================
echo -e "\n${GREEN}"
echo "╔═══════════════════════════════════════╗"
echo "║        프로덕션 빌드 완료!             ║"
echo "╠═══════════════════════════════════════╣"
echo "║  Version: v${VERSION}                      ║"
echo "║  Mode:    production                  ║"
echo "╠═══════════════════════════════════════╣"
if [ "$BUILD_APK" = true ]; then
echo "║  ✓ APK 생성됨                         ║"
fi
if [ "$DEPLOY_RENDER" = true ]; then
echo "║  ✓ Render 배포 시작됨                 ║"
fi
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${CYAN}사용 가능한 옵션:${NC}"
echo "  ./start-prod.sh           # 빌드만"
echo "  ./start-prod.sh --apk     # 빌드 + APK"
echo "  ./start-prod.sh --deploy  # 빌드 + Render 배포"
echo "  ./start-prod.sh --all     # 빌드 + APK + 배포"
