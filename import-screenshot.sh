#!/bin/bash

# 스크린샷 원본 폴더 (Windows 경로를 WSL 경로로 변환)
SOURCE_DIR="/mnt/c/Users/jammy/Pictures/Screenshots"

# 프로젝트 내 복사할 위치
DEST_DIR="./screenshots"

# 매개변수 (파일명) 확인
if [ -z "$1" ]; then
  echo "오류: 복사할 스크린샷 파일명을 입력해주세요."
  echo "사용법: ./import-screenshot.sh \"파일 이름.png\""
  exit 1
fi

FILENAME="$1"
SOURCE_FILE="$SOURCE_DIR/$FILENAME"

# 대상 폴더 생성
mkdir -p "$DEST_DIR"

# 파일 존재 확인 및 복사
if [ -f "$SOURCE_FILE" ]; then
  cp "$SOURCE_FILE" "$DEST_DIR/"
  echo "✅ 성공: '$FILENAME' 파일을 '$DEST_DIR' 폴더로 복사했습니다."
  echo "이제 제가 'screenshots/$FILENAME' 경로로 파일을 읽을 수 있습니다."
else
  echo "❌ 오류: 원본 폴더에서 '$FILENAME' 파일을 찾을 수 없습니다."
  echo "경로 확인: '$SOURCE_FILE'"
fi
