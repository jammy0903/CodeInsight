#!/bin/bash
# Emscripten 설치 확인 스크립트

if command -v emcc &> /dev/null; then
  echo "✅ Emscripten이 설치되어 있습니다."
  echo ""
  emcc --version
  exit 0
else
  echo "❌ Emscripten이 설치되어 있지 않습니다."
  echo ""
  echo "설치하려면 다음 명령을 실행하세요:"
  echo "  ./scripts/install-emscripten.sh"
  exit 1
fi
