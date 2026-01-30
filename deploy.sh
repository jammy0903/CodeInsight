#!/bin/bash

set -e  # 에러 발생 시 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 프로젝트 루트로 이동
cd "$(dirname "$0")"

# .env 파일 로드
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
else
  echo -e "${RED}❌ .env 파일이 없습니다!${NC}"
  exit 1
fi

# 필수 환경 변수 확인
if [ -z "$RENDER_BACKEND_DEPLOY_HOOK" ] || [ -z "$RENDER_FRONTEND_DEPLOY_HOOK" ]; then
  echo -e "${RED}❌ Deploy Hook이 설정되지 않았습니다!${NC}"
  echo -e "${YELLOW}💡 .env 파일에 다음 변수를 추가하세요:${NC}"
  echo "RENDER_BACKEND_DEPLOY_HOOK=https://api.render.com/deploy/srv-xxx?key=xxx"
  echo "RENDER_FRONTEND_DEPLOY_HOOK=https://api.render.com/deploy/srv-xxx?key=xxx"
  echo "RENDER_BACKEND_SERVICE_ID=srv-xxx"
  echo "RENDER_FRONTEND_SERVICE_ID=srv-xxx"
  exit 1
fi

# 배너 출력
echo -e "${CYAN}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 C-OSINE 자동 배포 스크립트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"

# Git 상태 확인
echo -e "${BLUE}📋 Git 상태 확인...${NC}"
if ! git diff-index --quiet HEAD --; then
  echo -e "${YELLOW}⚠️  커밋되지 않은 변경사항이 있습니다!${NC}"
  git status --short
  echo ""
  read -p "배포를 계속하시겠습니까? (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ 배포를 취소합니다.${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✅ Git 상태 깨끗함${NC}"
fi

echo ""

# 배포 확인
echo -e "${YELLOW}📦 다음 서비스를 배포합니다:${NC}"
echo "  1. 백엔드 (Backend)"
echo "  2. 프론트엔드 (Frontend)"
echo ""
read -p "배포를 시작하시겠습니까? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${RED}❌ 배포를 취소합니다.${NC}"
  exit 1
fi

echo ""

# 백엔드 배포
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📦 [1/2] 백엔드 배포 중...${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

BACKEND_RESPONSE=$(curl -s -X POST "$RENDER_BACKEND_DEPLOY_HOOK")

# 응답 확인
if echo "$BACKEND_RESPONSE" | grep -q "error"; then
  echo -e "${RED}❌ 백엔드 배포 실패!${NC}"
  echo "$BACKEND_RESPONSE"
  exit 1
else
  echo -e "${GREEN}✅ 백엔드 배포 트리거 완료!${NC}"
fi

echo ""

# 잠깐 대기 (Render API 부하 방지)
sleep 2

# 프론트엔드 배포
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🎨 [2/2] 프론트엔드 배포 중...${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

FRONTEND_RESPONSE=$(curl -s -X POST "$RENDER_FRONTEND_DEPLOY_HOOK")

# 응답 확인
if echo "$FRONTEND_RESPONSE" | grep -q "error"; then
  echo -e "${RED}❌ 프론트엔드 배포 실패!${NC}"
  echo "$FRONTEND_RESPONSE"
  exit 1
else
  echo -e "${GREEN}✅ 프론트엔드 배포 트리거 완료!${NC}"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 배포 트리거가 성공적으로 완료되었습니다!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Render CLI 설치 확인
if ! command -v render &> /dev/null; then
  echo -e "${YELLOW}💡 Render CLI가 설치되어 있지 않습니다.${NC}"
  echo -e "${YELLOW}   로그를 보려면 Render CLI를 설치하세요:${NC}"
  echo -e "${CYAN}   pnpm add -g @render-inc/cli${NC}"
  echo ""
  echo -e "${BLUE}📋 대시보드에서 로그 확인:${NC}"
  echo -e "${CYAN}   https://dashboard.render.com${NC}"
  exit 0
fi

# 로그 확인 여부 선택
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 배포 로그를 확인하시겠습니까?${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "1) 백엔드 로그 보기"
echo "2) 프론트엔드 로그 보기"
echo "3) 둘 다 보기 (백엔드 → 프론트엔드 순서)"
echo "4) 대시보드 열기"
echo "5) 나중에 보기"
echo ""
read -p "선택 (1-5): " choice

case $choice in
  1)
    echo ""
    echo -e "${YELLOW}📋 백엔드 로그 스트리밍 중... (Ctrl+C로 중단)${NC}"
    echo ""
    sleep 3  # 배포 시작될 때까지 대기
    render logs -s "${RENDER_BACKEND_SERVICE_ID}" --tail
    ;;
  2)
    echo ""
    echo -e "${YELLOW}📋 프론트엔드 로그 스트리밍 중... (Ctrl+C로 중단)${NC}"
    echo ""
    sleep 3  # 배포 시작될 때까지 대기
    render logs -s "${RENDER_FRONTEND_SERVICE_ID}" --tail
    ;;
  3)
    echo ""
    echo -e "${YELLOW}📋 백엔드 로그 확인 (Ctrl+C로 프론트엔드 로그로 이동)${NC}"
    echo ""
    sleep 3  # 배포 시작될 때까지 대기
    render logs -s "${RENDER_BACKEND_SERVICE_ID}" --tail || true
    echo ""
    echo -e "${YELLOW}📋 프론트엔드 로그 확인 (Ctrl+C로 중단)${NC}"
    echo ""
    render logs -s "${RENDER_FRONTEND_SERVICE_ID}" --tail
    ;;
  4)
    echo ""
    echo -e "${YELLOW}🌐 대시보드를 엽니다...${NC}"
    if command -v xdg-open &> /dev/null; then
      xdg-open "https://dashboard.render.com"
    elif command -v open &> /dev/null; then
      open "https://dashboard.render.com"
    else
      echo -e "${CYAN}   https://dashboard.render.com${NC}"
    fi
    ;;
  5)
    echo ""
    echo -e "${GREEN}✅ 배포 완료!${NC}"
    echo ""
    echo -e "${BLUE}📋 나중에 로그 확인 방법:${NC}"
    echo -e "${CYAN}   - 백엔드: render logs -s ${RENDER_BACKEND_SERVICE_ID} --tail${NC}"
    echo -e "${CYAN}   - 프론트엔드: render logs -s ${RENDER_FRONTEND_SERVICE_ID} --tail${NC}"
    echo -e "${CYAN}   - 대시보드: https://dashboard.render.com${NC}"
    ;;
  *)
    echo ""
    echo -e "${RED}잘못된 선택입니다.${NC}"
    echo -e "${BLUE}📋 대시보드에서 확인하세요: ${CYAN}https://dashboard.render.com${NC}"
    ;;
esac

echo ""
echo -e "${GREEN}🎉 모든 작업이 완료되었습니다!${NC}"
