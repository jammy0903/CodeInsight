#!/bin/bash

# CodeInsight Development Server Starter
# Backend (3002) -> Frontend (5174) 순차 실행
# 포트 충돌 시 자동 kill

set -e

BACKEND_PORT=3002
FRONTEND_PORT=5174
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════╗"
echo "║        CodeInsight Dev Server         ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# 포트 점유 프로세스 kill
kill_port() {
    local port=$1
    local pid=$(lsof -t -i:$port 2>/dev/null)

    if [ -n "$pid" ]; then
        echo -e "${YELLOW}[!] Port $port 사용 중 (PID: $pid) - 종료 중...${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}[✓] Port $port 해제됨${NC}"
    else
        echo -e "${GREEN}[✓] Port $port 사용 가능${NC}"
    fi
}

# 종료 시 cleanup
cleanup() {
    echo -e "\n${YELLOW}[!] 서버 종료 중...${NC}"
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# 포트 정리
echo -e "${CYAN}[1/4] 포트 확인 중...${NC}"
kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT

# Backend 실행
echo -e "\n${CYAN}[2/4] Backend 시작 중... (port $BACKEND_PORT)${NC}"
cd "$PROJECT_DIR/backend"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[!] node_modules 없음 - npm install 실행${NC}"
    npm install
fi

npm run dev &
BACKEND_PID=$!

# Backend 준비 대기
echo -e "${YELLOW}[...] Backend 준비 대기 중...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
        echo -e "${GREEN}[✓] Backend 준비 완료!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}[!] Backend 응답 없음 - 계속 진행${NC}"
    fi
    sleep 1
done

# Frontend 실행
echo -e "\n${CYAN}[3/4] Frontend 시작 중... (port $FRONTEND_PORT)${NC}"
cd "$PROJECT_DIR/frontend"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[!] node_modules 없음 - npm install 실행${NC}"
    npm install
fi

npm run dev &
FRONTEND_PID=$!

# Frontend 준비 대기
sleep 3

echo -e "\n${GREEN}"
echo "╔═══════════════════════════════════════╗"
echo "║           서버 실행 완료!              ║"
echo "╠═══════════════════════════════════════╣"
echo "║  Frontend: http://localhost:$FRONTEND_PORT      ║"
echo "║  Backend:  http://localhost:$BACKEND_PORT       ║"
echo "╠═══════════════════════════════════════╣"
echo "║  종료: Ctrl+C                         ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# 프로세스 대기
wait
