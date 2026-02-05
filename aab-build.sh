#!/bin/bash

# CodeInsight AAB 빌드 스크립트
# 사용법: ./aab-build.sh [버전명]
# 예시: ./aab-build.sh 3.1.0

set -e

# 색상
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== CodeInsight AAB 빌드 시작 ===${NC}"

# 버전 업데이트 (선택적)
if [ -n "$1" ]; then
    VERSION=$1
    echo -e "${GREEN}버전을 $VERSION 으로 설정${NC}"

    # versionCode 자동 증가
    CURRENT_CODE=$(grep "versionCode" android/app/build.gradle | head -1 | grep -o '[0-9]*')
    NEW_CODE=$((CURRENT_CODE + 1))

    sed -i "s/versionCode $CURRENT_CODE/versionCode $NEW_CODE/" android/app/build.gradle
    sed -i "s/versionName \".*\"/versionName \"$VERSION\"/" android/app/build.gradle

    echo "versionCode: $NEW_CODE"
    echo "versionName: $VERSION"
fi

# 1. 프론트엔드 빌드
echo -e "${GREEN}[1/4] 프론트엔드 빌드 중...${NC}"
pnpm --filter frontend build

# 2. Capacitor 동기화
echo -e "${GREEN}[2/4] Capacitor 동기화 중...${NC}"
npx cap sync android

# 3. AAB 빌드
echo -e "${GREEN}[3/4] AAB 빌드 중...${NC}"
cd android
./gradlew bundleRelease
cd ..

# 4. 다운로드 폴더로 복사
echo -e "${GREEN}[4/4] 다운로드 폴더로 복사 중...${NC}"
VERSION_NAME=$(grep "versionName" android/app/build.gradle | head -1 | grep -o '"[^"]*"' | tr -d '"')
cp android/app/build/outputs/bundle/release/app-release.aab /mnt/c/Users/jammy/Downloads/CodeInsight-v${VERSION_NAME}.aab

echo ""
echo -e "${YELLOW}=== 빌드 완료! ===${NC}"
echo "파일: /mnt/c/Users/jammy/Downloads/CodeInsight-v${VERSION_NAME}.aab"
ls -lh /mnt/c/Users/jammy/Downloads/CodeInsight-v${VERSION_NAME}.aab
