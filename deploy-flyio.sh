#!/bin/bash

# ==================================================
# Fly.io 자동 배포 스크립트
# ==================================================

set -e

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  CodeInsight Fly.io 자동 배포${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Fly CLI 설치 확인
if ! command -v flyctl &> /dev/null; then
    echo -e "${YELLOW}⚠️  Fly CLI가 설치되지 않았습니다. 설치를 시작합니다...${NC}"
    curl -L https://fly.io/install.sh | sh
    echo ""
    echo -e "${GREEN}✓ Fly CLI 설치 완료!${NC}"
    echo -e "${YELLOW}⚠️  터미널을 다시 시작하거나 다음 명령어를 실행하세요:${NC}"
    echo -e "   ${BLUE}export FLYCTL_INSTALL=\"\$HOME/.fly\"${NC}"
    echo -e "   ${BLUE}export PATH=\"\$FLYCTL_INSTALL/bin:\$PATH\"${NC}"
    echo ""
    exit 0
fi

echo -e "${GREEN}✓${NC} Fly CLI 설치 확인됨"

# 로그인 확인
echo -e "\n${BLUE}🔐 Fly.io 로그인 확인 중...${NC}"
if ! flyctl auth whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  로그인이 필요합니다.${NC}"
    flyctl auth login
fi

echo -e "${GREEN}✓${NC} 로그인 완료"

# ==================================================
# 1. 백엔드 배포
# ==================================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  1️⃣  백엔드 배포${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 백엔드 앱 생성 (이미 있으면 스킵)
if ! flyctl apps list | grep -q "codeinsight-backend"; then
    echo -e "\n${BLUE}📦 백엔드 앱 생성 중...${NC}"
    flyctl apps create codeinsight-backend --org personal
    echo -e "${GREEN}✓${NC} 백엔드 앱 생성 완료"
else
    echo -e "${GREEN}✓${NC} 백엔드 앱이 이미 존재합니다"
fi

# 백엔드 환경 변수 설정
echo -e "\n${BLUE}🔧 백엔드 환경 변수 설정 중...${NC}"

flyctl secrets set \
  DATABASE_URL="postgresql://neondb_owner:npg_n2V3WyUcbRpz@ep-ancient-sea-ahi4jsfx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require" \
  FIREBASE_PROJECT_ID="code2u-78d63" \
  FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@code2u-78d63.iam.gserviceaccount.com" \
  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDCHQQMOeLZ0NBt
UA7SnU7vyeo2AbEGlsWWZhIW2XL5w3/xg5EBBN/ZObF/yDJeRQ3JYZayhfaHKJLA
ivdJobUUyqFmlcNpEoZZifp4juC4Xk9sLoa4FnUzfJyrVPBe/p8/oKsAMjk+4U4S
RuDe35qvVn62c7p2UPDk0PvVJ/Pvn894qT4KtD9bFaESLoH9obL6BwKgqEHhno6G
TEsXUlYOCUSEVYekpFHCIceHu2ucSy97VJZ5z8inTHrpL6es2sI4HANiYOGwlgC/
KhqL3LI+nGKhjK91jAqoespHpdIQCsTC4GcoVgyPWvBxvnJxngRhqS4TqHzwPA12
qbwz2k1fAgMBAAECggEAP+6wk5pJJfZJf4dbqnCXPBDjq+/4rzPfVf6+PHpYDP0f
2Zq8mnpRg8kltfFo7XWO6eHTcW7/2Fo7o2Dhu4WgD34BlLkEyEmKqFjyftyIFREy
1W2pf14eMdv7+c4a8R6psponWAQyqIwqW4iurZk16EPzrgIFyswz2xkdqIHlLOmB
tFSx/7pPuLn9sgTn8iFmG8l0/9M61mcpoyhEqRjiiFGEqpDYlvjBrCgKYotI9XbT
49FqbRen2TIH77zFJeCByJgxscEMBNiG91w5NXcU9OCztB/2xzYmhViFK2na4xI8
lpNWh5Gz809+zZ83OHZMTmx8mUNVvCD429NhJH4IiQKBgQDqVceXvs+3VyV0qqMI
lwLhmUAB+CvLm0jDraeqIA6rHwmkmjYybYrnZVh/j5L6p7mxOC8B+ueSKFF3wkJ/
KlcjQArS2mPt4DryldIEa5LMWw1VSlXWz5qs/JZEFAFb7MzQrfu720/rVPzhb7aE
7h4UOTqDE1R9YlJktf3H8GfUswKBgQDUD0WgUF9EGqRMqe4ysMoOkupD4LZOwuPH
5rLKuI228gi7v8mkUv13KRduxMWqGahIuuT8tEzbuH3T2Eworheacvk3h34320Kv
YIPU4ChgW01jROHq1un68TPZqXXS9KFhbxD9MiVvLB5AACUeCYAwnu3Lxg9vY7TG
c+L8Py/ypQKBgBBw0D4PPxeH37Ldve5+Wc9mJx18QeZZELPZ3SeMdDsBRHXt89t5
4AL4E0tv0UoQtnB+lp228sRIW97hHDU7zT1F4vyEIfqwfrJCXKe+vF/mC3tuabNW
gW2dkxVXqfi/FmeVrVGyw1qpbcyLP+z3n9ifY0GK+6SIX2t9cT6z2TUNAoGAc4Pu
NaoSexLYNTrMGqjbKJ03J8qdBMJ9OkOdWXi3GdU2lK+gs/bRQ7wKm7hsxIA9f4Dv
hAjjZT1WrbPBqNdM3EGNKIaSZvL1nHtC1Q9Wb0bNHSpEtpxj0OLbj9IT8Np5no3V
/1b1tV2fDNYHYhlizxmEB+DYP6FctE4kc6wn/lECgYAF2y37ecmyGtLzvVmmU3u3
cMAloFm+SqrlvqGALOayJQ2R9tvPosvEv+/4DUbnQafRZg+Irs+W5OgTn8QTMznr
4iG1Y2/aPiWO6VYWos2LiQmYgqKkBhTQORCygCX7PjPQIWBeURjWx5lnKmaWoQUC
0pRMpVJKW4BZCi3l/+7j1A==
-----END PRIVATE KEY-----" \
  ADMIN_FIREBASE_UID="nAjajQSbTWhGGEC7XR8ctA1JBzC2" \
  CORS_ORIGINS="https://codeinsight-frontend.fly.dev" \
  DEEPSEEK_API_KEY="sk-327987f9e36648d7b394b1c98fd4e4ec" \
  DEEPSEEK_BASE_URL="https://api.deepseek.com" \
  FAL_API_KEY="b41b3efb-282b-414d-9518-d09f82bf4ea6:1a4ce6d827c44534a73ebbfdf6680df9" \
  -a codeinsight-backend

echo -e "${GREEN}✓${NC} 백엔드 환경 변수 설정 완료"

# 백엔드 배포
echo -e "\n${BLUE}🚀 백엔드 배포 시작...${NC}"
flyctl deploy --config fly.toml --app codeinsight-backend

echo -e "${GREEN}✓${NC} 백엔드 배포 완료!"

# ==================================================
# 2. 프론트엔드 배포
# ==================================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  2️⃣  프론트엔드 배포${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 프론트엔드 앱 생성 (이미 있으면 스킵)
if ! flyctl apps list | grep -q "codeinsight-frontend"; then
    echo -e "\n${BLUE}📦 프론트엔드 앱 생성 중...${NC}"
    flyctl apps create codeinsight-frontend --org personal
    echo -e "${GREEN}✓${NC} 프론트엔드 앱 생성 완료"
else
    echo -e "${GREEN}✓${NC} 프론트엔드 앱이 이미 존재합니다"
fi

# 프론트엔드 환경 변수 설정
echo -e "\n${BLUE}🔧 프론트엔드 환경 변수 설정 중...${NC}"

flyctl secrets set \
  VITE_API_VERSION="v1" \
  VITE_FIREBASE_API_KEY="AIzaSyBL-fwcQFGXfrKQCZ4TiP-tBoe8qwKcle0" \
  VITE_FIREBASE_AUTH_DOMAIN="code2u-78d63.firebaseapp.com" \
  VITE_FIREBASE_PROJECT_ID="code2u-78d63" \
  VITE_FIREBASE_STORAGE_BUCKET="code2u-78d63.firebasestorage.app" \
  VITE_FIREBASE_MESSAGING_SENDER_ID="213972727628" \
  VITE_FIREBASE_APP_ID="1:213972727628:web:8737c4bd4412a01bc541e9" \
  VITE_FIREBASE_MEASUREMENT_ID="G-NV6JZFYXLC" \
  VITE_FAL_API_KEY="b41b3efb-282b-414d-9518-d09f82bf4ea6:1a4ce6d827c44534a73ebbfdf6680df9" \
  -a codeinsight-frontend

echo -e "${GREEN}✓${NC} 프론트엔드 환경 변수 설정 완료"

# 프론트엔드 배포
echo -e "\n${BLUE}🚀 프론트엔드 배포 시작...${NC}"
flyctl deploy --config fly.frontend.toml --app codeinsight-frontend

echo -e "${GREEN}✓${NC} 프론트엔드 배포 완료!"

# ==================================================
# 배포 완료
# ==================================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 배포 완료!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${BLUE}📍 배포된 URL:${NC}"
echo -e "  • 백엔드: ${GREEN}https://codeinsight-backend.fly.dev${NC}"
echo -e "  • 프론트엔드: ${GREEN}https://codeinsight-frontend.fly.dev${NC}"

echo -e "\n${BLUE}📊 상태 확인:${NC}"
echo -e "  ${BLUE}flyctl status -a codeinsight-backend${NC}"
echo -e "  ${BLUE}flyctl status -a codeinsight-frontend${NC}"

echo -e "\n${BLUE}📋 로그 확인:${NC}"
echo -e "  ${BLUE}flyctl logs -a codeinsight-backend${NC}"
echo -e "  ${BLUE}flyctl logs -a codeinsight-frontend${NC}"

echo ""
