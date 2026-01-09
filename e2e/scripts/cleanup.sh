#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# 🧹 CodeInsight 프로파일 로그 정리 스크립트
# ═══════════════════════════════════════════════════════════════════

set -e

LOG_DIR="/tmp/codeinsight-profile"
BACKEND_CLINIC="/home/jammy/projects/C-OSINE/backend/.clinic"

echo "🧹 프로파일 로그 정리"
echo ""

# 1. /tmp/codeinsight-profile/ 정리
if [ -d "$LOG_DIR" ]; then
    echo "📁 $LOG_DIR"
    du -sh "$LOG_DIR"
    rm -rf "$LOG_DIR"/*
    echo "✓ 삭제 완료"
else
    echo "⚠️  디렉토리 없음: $LOG_DIR"
fi

echo ""

# 2. backend/.clinic/ 정리
if [ -d "$BACKEND_CLINIC" ]; then
    echo "📁 $BACKEND_CLINIC"
    du -sh "$BACKEND_CLINIC" 2>/dev/null || echo "0B"
    rm -rf "$BACKEND_CLINIC"/*
    echo "✓ 삭제 완료"
else
    echo "⚠️  디렉토리 없음: $BACKEND_CLINIC"
fi

echo ""
echo "✓ 모든 프로파일 로그 정리 완료"
