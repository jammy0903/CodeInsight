#!/bin/bash

# ==================================================
# Tailwind CSS Opacity 표기법 수정 스크립트
# bg-black/50 → bg-black bg-opacity-50
# ==================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Tailwind CSS Opacity 표기법 수정 중...${NC}"

# 프론트엔드 src 디렉토리로 이동
cd packages/frontend/src

# 모든 .tsx, .ts 파일에서 수정
find . -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i \
  -e 's/bg-black\/\([0-9]\+\)/bg-black bg-opacity-\1/g' \
  -e 's/bg-white\/\([0-9]\+\)/bg-white bg-opacity-\1/g' \
  -e 's/bg-gray\/\([0-9]\+\)/bg-gray bg-opacity-\1/g' \
  -e 's/bg-\([a-z]\+\)-\([0-9]\+\)\/\([0-9]\+\)/bg-\1-\2 bg-opacity-\3/g' \
  -e 's/text-white\/\([0-9]\+\)/text-white text-opacity-\1/g' \
  -e 's/text-black\/\([0-9]\+\)/text-black text-opacity-\1/g' \
  -e 's/text-gray\/\([0-9]\+\)/text-gray text-opacity-\1/g' \
  -e 's/text-\([a-z]\+\)-\([0-9]\+\)\/\([0-9]\+\)/text-\1-\2 text-opacity-\3/g' \
  -e 's/border-\([a-z]\+\)-\([0-9]\+\)\/\([0-9]\+\)/border-\1-\2 border-opacity-\3/g' \
  {} \;

cd ../../..

echo -e "${GREEN}✓ 수정 완료!${NC}"
echo ""
echo "수정된 패턴:"
echo "  • bg-black/50 → bg-black bg-opacity-50"
echo "  • text-white/90 → text-white text-opacity-90"
echo "  • border-gray-200/20 → border-gray-200 border-opacity-20"
echo ""
