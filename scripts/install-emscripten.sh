#!/bin/bash
# Emscripten SDK 설치 스크립트

set -e  # 에러 발생 시 중단

EMSDK_DIR="$HOME/emsdk"
EMSDK_VERSION="3.1.50"

echo "=========================================="
echo "Emscripten SDK 설치 시작"
echo "=========================================="

# 1. 기존 설치 확인
if [ -d "$EMSDK_DIR" ]; then
  echo "⚠️  기존 emsdk 디렉토리가 존재합니다: $EMSDK_DIR"
  read -p "삭제하고 재설치하시겠습니까? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  기존 디렉토리 삭제 중..."
    rm -rf "$EMSDK_DIR"
  else
    echo "❌ 설치를 취소합니다."
    exit 1
  fi
fi

# 2. emsdk 클론
echo "📦 emsdk 저장소 클론 중..."
git clone https://github.com/emscripten-core/emsdk.git "$EMSDK_DIR"

# 3. emsdk 디렉토리로 이동
cd "$EMSDK_DIR"

# 4. emsdk 설치
echo "⚙️  Emscripten $EMSDK_VERSION 설치 중..."
./emsdk install $EMSDK_VERSION

# 5. emsdk 활성화
echo "✅ Emscripten $EMSDK_VERSION 활성화 중..."
./emsdk activate $EMSDK_VERSION

# 6. 환경 변수 설정
echo "🔧 환경 변수 설정 중..."
source ./emsdk_env.sh

# 7. bashrc에 추가 (선택 사항)
BASHRC="$HOME/.bashrc"
if ! grep -q "emsdk_env.sh" "$BASHRC"; then
  echo "" >> "$BASHRC"
  echo "# Emscripten SDK" >> "$BASHRC"
  echo "source $EMSDK_DIR/emsdk_env.sh > /dev/null 2>&1" >> "$BASHRC"
  echo "📝 ~/.bashrc에 환경 변수 추가 완료"
else
  echo "✅ ~/.bashrc에 이미 설정되어 있습니다."
fi

# 8. 설치 확인
echo ""
echo "=========================================="
echo "✅ Emscripten 설치 완료!"
echo "=========================================="
echo ""
emcc --version
echo ""
echo "📌 현재 터미널에서 사용하려면 다음 명령을 실행하세요:"
echo "   source $EMSDK_DIR/emsdk_env.sh"
echo ""
echo "📌 새 터미널에서는 자동으로 로드됩니다 (~/.bashrc에 추가됨)"
echo ""
