#!/bin/bash

# 리팩토링 검증 자동화 스크립트
# .claude/rules/REFACTORING.md 규칙 자동 검증

set -e

echo "🔍 리팩토링 검증 시작..."
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Git 상태 확인
echo "1️⃣ Git 상태 확인..."
if [[ -n $(git status --porcelain) ]]; then
  echo -e "${YELLOW}⚠️  커밋되지 않은 변경사항이 있습니다.${NC}"
  git status --short
else
  echo -e "${GREEN}✅ Git 상태 깨끗함${NC}"
fi
echo ""

# 2. 폐기된 경로 검색
echo "2️⃣ 폐기된 import 경로 검색..."
DEPRECATED_PATHS=(
  "js-visualizer"
)

FOUND_ISSUES=0
for path in "${DEPRECATED_PATHS[@]}"; do
  echo "  검색 중: $path"
  RESULTS=$(grep -r "$path" packages/frontend/src --include="*.tsx" --include="*.ts" 2>/dev/null || true)

  if [[ -n "$RESULTS" ]]; then
    echo -e "${RED}❌ 폐기된 경로 발견: $path${NC}"
    echo "$RESULTS"
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
  else
    echo -e "${GREEN}✅ $path 참조 없음${NC}"
  fi
done
echo ""

# 3. 누락된 파일 import 검색
echo "3️⃣ 누락된 파일 import 검색..."
# 이동된 파일이 새 위치에서 제대로 export되는지 확인
if [[ -f "packages/frontend/src/features/visualizers/js/index.ts" ]]; then
  if grep -q "export.*JSVisualizerView" packages/frontend/src/features/visualizers/js/index.ts; then
    echo -e "${GREEN}✅ JSVisualizerView export 확인${NC}"
  else
    echo -e "${RED}❌ JSVisualizerView export 누락${NC}"
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
  fi
else
  echo -e "${RED}❌ visualizers/js/index.ts 파일 없음${NC}"
  FOUND_ISSUES=$((FOUND_ISSUES + 1))
fi
echo ""

# 4. TypeScript 컴파일 체크
echo "4️⃣ TypeScript 컴파일 검증..."
if command -v tsc &> /dev/null; then
  cd packages/frontend
  if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
    echo -e "${RED}❌ TypeScript 컴파일 에러 발견${NC}"
    npx tsc --noEmit 2>&1 | head -20
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
  else
    echo -e "${GREEN}✅ TypeScript 컴파일 성공${NC}"
  fi
  cd ../..
else
  echo -e "${YELLOW}⚠️  tsc 명령어 없음 - 스킵${NC}"
fi
echo ""

# 최종 결과
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [[ $FOUND_ISSUES -eq 0 ]]; then
  echo -e "${GREEN}✅ 리팩토링 검증 통과!${NC}"
  exit 0
else
  echo -e "${RED}❌ $FOUND_ISSUES 개의 문제 발견!${NC}"
  echo ""
  echo "다음 단계:"
  echo "1. 폐기된 경로를 새 경로로 변경"
  echo "2. 누락된 export 추가"
  echo "3. TypeScript 에러 수정"
  echo "4. 다시 실행: .claude/scripts/verify-refactoring.sh"
  exit 1
fi
