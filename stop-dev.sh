#!/bin/bash

# CodeInsight 개발 서버 종료 스크립트

BACKEND_PORT=3002
FRONTEND_PORT=5174

echo "🛑 CodeInsight 개발 서버 종료"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

stop_port() {
    local port=$1
    local name=$2

    echo "[$name] port $port 확인 중..."

    # PID를 먼저 캡처
    local pids=$(lsof -i :$port -t 2>/dev/null)

    if [ -z "$pids" ]; then
        echo "  → 실행 중인 프로세스 없음"
        echo ""
        return 0
    fi

    # 프로세스 상세 정보 출력
    echo "  → 실행 중인 프로세스 발견:"
    echo "  ┌─────────────────────────────────────────────"
    lsof -i :$port 2>/dev/null | while read line; do
        echo "  │ $line"
    done
    echo "  └─────────────────────────────────────────────"
    echo ""
    echo "  → PID: $pids"
    echo "  → SIGTERM 전송 중..."

    # kill 시도
    if ! kill $pids 2>/dev/null; then
        echo "  → ⚠️  권한 필요. sudo로 재시도..."
        sudo kill $pids 2>/dev/null
    fi

    # 종료 대기 (최대 5초)
    local count=0
    echo -n "  → 종료 대기 중"
    while [ $count -lt 10 ]; do
        if ! lsof -i :$port -t >/dev/null 2>&1; then
            echo ""
            echo "  → ✅ 프로세스 종료 확인됨 (PID $pids 없음)"
            echo ""
            return 0
        fi
        echo -n "."
        sleep 0.5
        count=$((count + 1))
    done
    echo ""

    # 강제 종료
    echo "  → ⚠️  응답 없음. SIGKILL 전송..."
    local pids=$(lsof -i :$port -t 2>/dev/null)
    if [ -n "$pids" ]; then
        kill -9 $pids 2>/dev/null || sudo kill -9 $pids 2>/dev/null
    fi

    sleep 0.5

    # 최종 확인
    local remaining=$(lsof -i :$port -t 2>/dev/null)
    if [ -n "$remaining" ]; then
        echo "  → ❌ 종료 실패! 남은 PID: $remaining"
        echo ""
        return 1
    fi

    echo "  → ✅ 강제 종료 완료 (PID $pids 없음)"
    echo ""
    return 0
}

# 순차적으로 종료
stop_port $BACKEND_PORT "Backend"
stop_port $FRONTEND_PORT "Frontend"

# 최종 상태 확인
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 최종 상태 확인"
echo ""

check_final() {
    local port=$1
    local name=$2
    local pid=$(lsof -i :$port -t 2>/dev/null)

    if [ -z "$pid" ]; then
        echo "  $name (port $port): ❌ 프로세스 없음"
    else
        echo "  $name (port $port): ⚠️  아직 실행 중 (PID: $pid)"
    fi
}

check_final $BACKEND_PORT "Backend"
check_final $FRONTEND_PORT "Frontend"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 완료"
