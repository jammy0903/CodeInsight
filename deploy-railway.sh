#!/bin/bash

# ==================================================
# Railway CLI 자동 배포 스크립트
# ==================================================

set -e

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  CodeInsight Railway 자동 배포${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Railway CLI 설치 확인
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}⚠️  Railway CLI가 설치되지 않았습니다. 설치를 시작합니다...${NC}"
    npm install -g @railway/cli
    echo -e "${GREEN}✓ Railway CLI 설치 완료!${NC}"
fi

echo -e "${GREEN}✓${NC} Railway CLI 설치 확인됨"

# 로그인 확인
echo -e "\n${BLUE}🔐 Railway 로그인 확인 중...${NC}"
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  로그인이 필요합니다.${NC}"
    railway login
fi

echo -e "${GREEN}✓${NC} 로그인 완료"

# 프로젝트 연결
echo -e "\n${BLUE}🔗 프로젝트 연결 중...${NC}"
railway link e4db88d4-a736-4f9a-857a-77ff1842fc3d

echo -e "${GREEN}✓${NC} 프로젝트 연결 완료"

# ==================================================
# 백엔드 환경 변수 설정
# ==================================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  1️⃣  백엔드 환경 변수 설정${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 백엔드 서비스 선택
echo -e "\n${YELLOW}Railway 대시보드에서 'backend' 서비스를 선택해주세요.${NC}"
echo -e "${YELLOW}서비스가 없으면 New -> GitHub Repo로 생성하세요.${NC}"
echo -e "\n${BLUE}계속하려면 Enter를 누르세요...${NC}"
read

echo -e "\n${BLUE}🔧 백엔드 환경 변수 설정 중...${NC}"

# 한 번에 모든 환경 변수 설정
railway variables set \
  NODE_ENV=production \
  PORT=3002 \
  DATABASE_URL="postgresql://neondb_owner:npg_n2V3WyUcbRpz@ep-ancient-sea-ahi4jsfx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require" \
  FIREBASE_PROJECT_ID="code2u-78d63" \
  FIREBASE_CLIENT_EMAIL="REDACTED_SERVICE_ACCOUNT" \
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
  ADMIN_FIREBASE_UID="REDACTED_ADMIN_UID" \
  DEEPSEEK_API_KEY="sk-327987f9e36648d7b394b1c98fd4e4ec" \
  DEEPSEEK_BASE_URL="https://api.deepseek.com" \
  FAL_API_KEY="b41b3efb-282b-414d-9518-d09f82bf4ea6:1a4ce6d827c44534a73ebbfdf6680df9" \
  DOCKER_IMAGE="gcc:latest" \
  DOCKER_MEMORY_LIMIT="128m" \
  DOCKER_CPU_LIMIT="0.5" \
  DOCKER_PID_LIMIT="50" \
  DOCKER_TMPFS_SIZE="10m" \
  C_RUN_DEFAULT_TIMEOUT="10" \
  C_RUN_MAX_TIMEOUT="30" \
  C_JUDGE_TIMEOUT="5" \
  C_EXECUTOR_BUFFER_SIZE="10485760" \
  CODE_MAX_LENGTH="50000" \
  JSON_BODY_LIMIT="1mb" \
  DAILY_PROBLEM_CRON="0 9 * * *" \
  TIMEZONE="Asia/Seoul"

echo -e "${GREEN}✓${NC} 백엔드 환경 변수 설정 완료"

# CORS_ORIGINS는 프론트엔드 배포 후 설정
echo -e "${YELLOW}⚠️  CORS_ORIGINS는 프론트엔드 배포 후 수동으로 설정하세요.${NC}"

# ==================================================
# 백엔드 배포
# ==================================================
echo -e "\n${BLUE}🚀 백엔드 배포 시작...${NC}"
railway up

echo -e "${GREEN}✓${NC} 백엔드 배포 완료!"

# 백엔드 URL 가져오기
BACKEND_URL=$(railway domain 2>/dev/null || echo "")

if [ -n "$BACKEND_URL" ]; then
    echo -e "${GREEN}✓${NC} 백엔드 URL: ${GREEN}https://$BACKEND_URL${NC}"
else
    echo -e "${YELLOW}⚠️  백엔드 URL을 자동으로 가져올 수 없습니다.${NC}"
    echo -e "${YELLOW}   Railway Dashboard에서 확인하세요.${NC}"
    echo -e "\n${BLUE}백엔드 URL을 입력하세요 (예: backend.railway.app):${NC}"
    read BACKEND_URL
fi

# ==================================================
# 프론트엔드 환경 변수 설정
# ==================================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  2️⃣  프론트엔드 환경 변수 설정${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${YELLOW}Railway 대시보드에서 'frontend' 서비스를 선택해주세요.${NC}"
echo -e "${YELLOW}서비스가 없으면 New -> GitHub Repo로 생성하세요.${NC}"
echo -e "\n${BLUE}계속하려면 Enter를 누르세요...${NC}"
read

echo -e "\n${BLUE}🔧 프론트엔드 환경 변수 설정 중...${NC}"

railway variables set \
  VITE_API_URL="https://$BACKEND_URL" \
  VITE_API_VERSION="v1" \
  VITE_FIREBASE_API_KEY="REDACTED_FIREBASE_API_KEY" \
  VITE_FIREBASE_AUTH_DOMAIN="code2u-78d63.firebaseapp.com" \
  VITE_FIREBASE_PROJECT_ID="code2u-78d63" \
  VITE_FIREBASE_STORAGE_BUCKET="code2u-78d63.firebasestorage.app" \
  VITE_FIREBASE_MESSAGING_SENDER_ID="213972727628" \
  VITE_FIREBASE_APP_ID="1:213972727628:web:8737c4bd4412a01bc541e9" \
  VITE_FIREBASE_MEASUREMENT_ID="G-NV6JZFYXLC" \
  VITE_FAL_API_KEY="b41b3efb-282b-414d-9518-d09f82bf4ea6:1a4ce6d827c44534a73ebbfdf6680df9"

echo -e "${GREEN}✓${NC} 프론트엔드 환경 변수 설정 완료"

# ==================================================
# 프론트엔드 배포
# ==================================================
echo -e "\n${BLUE}🚀 프론트엔드 배포 시작...${NC}"
railway up

echo -e "${GREEN}✓${NC} 프론트엔드 배포 완료!"

# 프론트엔드 URL 가져오기
FRONTEND_URL=$(railway domain 2>/dev/null || echo "")

if [ -n "$FRONTEND_URL" ]; then
    echo -e "${GREEN}✓${NC} 프론트엔드 URL: ${GREEN}https://$FRONTEND_URL${NC}"
else
    echo -e "${YELLOW}⚠️  프론트엔드 URL을 자동으로 가져올 수 없습니다.${NC}"
    echo -e "${YELLOW}   Railway Dashboard에서 확인하세요.${NC}"
    echo -e "\n${BLUE}프론트엔드 URL을 입력하세요 (예: frontend.railway.app):${NC}"
    read FRONTEND_URL
fi

# ==================================================
# CORS 설정
# ==================================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  3️⃣  CORS 설정${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${YELLOW}백엔드 서비스를 다시 선택해주세요.${NC}"
echo -e "${BLUE}계속하려면 Enter를 누르세요...${NC}"
read

echo -e "\n${BLUE}🔧 CORS_ORIGINS 설정 중...${NC}"
railway variables set CORS_ORIGINS="https://$FRONTEND_URL"

echo -e "${GREEN}✓${NC} CORS_ORIGINS 설정 완료"

# ==================================================
# 배포 완료
# ==================================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 배포 완료!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${BLUE}📍 배포된 URL:${NC}"
echo -e "  • 백엔드: ${GREEN}https://$BACKEND_URL${NC}"
echo -e "  • 프론트엔드: ${GREEN}https://$FRONTEND_URL${NC}"

echo -e "\n${BLUE}📊 상태 확인:${NC}"
echo -e "  ${BLUE}railway status${NC}"

echo -e "\n${BLUE}📋 로그 확인:${NC}"
echo -e "  ${BLUE}railway logs${NC}"

echo -e "\n${YELLOW}⚠️  다음 작업을 수동으로 완료하세요:${NC}"
echo -e "  1. Railway Dashboard에서 각 서비스의 Dockerfile 경로 확인"
echo -e "     - Backend: Dockerfile"
echo -e "     - Frontend: Dockerfile.frontend"
echo -e "  2. 서비스 포트 확인"
echo -e "     - Backend: 3002"
echo -e "     - Frontend: 80"

echo ""
