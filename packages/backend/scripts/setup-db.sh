#!/bin/bash
#
# CodeInsight PostgreSQL 자동 설정 스크립트
#
# 사용법:
#   ./scripts/setup-db.sh          # 개발 환경 (기본값)
#   ./scripts/setup-db.sh prod     # 프로덕션 환경
#
# 원격 서버에서:
#   curl -sSL https://raw.githubusercontent.com/jammy0903/CodeInsight/codeinsight/packages/backend/scripts/setup-db.sh | bash
#

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 환경 확인
ENV=${1:-dev}
log_info "환경: $ENV"

# =============================================
# 1. Docker 설치 확인
# =============================================
check_docker() {
    log_info "Docker 확인 중..."

    if ! command -v docker &> /dev/null; then
        log_warn "Docker가 설치되어 있지 않습니다. 설치를 시작합니다..."

        # Docker 설치 (Ubuntu/Debian)
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y ca-certificates curl gnupg
            sudo install -m 0755 -d /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            sudo chmod a+r /etc/apt/keyrings/docker.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            sudo apt-get update
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            sudo usermod -aG docker $USER
            log_success "Docker 설치 완료!"
        else
            log_error "apt-get을 찾을 수 없습니다. 수동으로 Docker를 설치해주세요."
            exit 1
        fi
    else
        log_success "Docker 설치됨: $(docker --version)"
    fi
}

# =============================================
# 2. 환경 변수 설정
# =============================================
setup_env() {
    log_info "환경 변수 설정 중..."

    # 프로덕션 환경이면 강력한 비밀번호 생성
    if [ "$ENV" == "prod" ]; then
        if [ -z "$POSTGRES_PASSWORD" ]; then
            POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 24)
            log_warn "프로덕션 비밀번호 생성됨: $POSTGRES_PASSWORD"
            log_warn "이 비밀번호를 안전한 곳에 저장하세요!"
        fi
        POSTGRES_USER=${POSTGRES_USER:-codeinsight}
        POSTGRES_DB=${POSTGRES_DB:-codeinsight}
        POSTGRES_PORT=${POSTGRES_PORT:-5432}
    else
        POSTGRES_USER=${POSTGRES_USER:-codeinsight}
        POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-codeinsight123}
        POSTGRES_DB=${POSTGRES_DB:-codeinsight}
        POSTGRES_PORT=${POSTGRES_PORT:-5432}
    fi

    # DATABASE_URL 생성
    DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}"

    log_success "DATABASE_URL: postgresql://${POSTGRES_USER}:***@localhost:${POSTGRES_PORT}/${POSTGRES_DB}"
}

# =============================================
# 3. Docker Compose 파일 생성
# =============================================
create_docker_compose() {
    log_info "docker-compose.yml 생성 중..."

    cat > docker-compose.yml << EOF
services:
  postgres:
    image: postgres:16-alpine
    container_name: codeinsight-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "${POSTGRES_PORT}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
EOF

    log_success "docker-compose.yml 생성 완료"
}

# =============================================
# 4. .env 파일 생성/업데이트
# =============================================
create_env_file() {
    log_info ".env 파일 설정 중..."

    if [ -f .env ]; then
        # 기존 .env에서 DATABASE_URL 업데이트
        if grep -q "^DATABASE_URL=" .env; then
            sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"${DATABASE_URL}\"|" .env
            log_info "기존 .env의 DATABASE_URL 업데이트됨"
        else
            echo "" >> .env
            echo "# === Database ===" >> .env
            echo "DATABASE_URL=\"${DATABASE_URL}\"" >> .env
            log_info ".env에 DATABASE_URL 추가됨"
        fi
    else
        # 새 .env 생성
        cat > .env << EOF
# === Database ===
DATABASE_URL="${DATABASE_URL}"

# === Server ===
PORT=3002
NODE_ENV=${ENV}
EOF
        log_info "새 .env 파일 생성됨"
    fi

    log_success ".env 설정 완료"
}

# =============================================
# 5. PostgreSQL 컨테이너 시작
# =============================================
start_postgres() {
    log_info "PostgreSQL 컨테이너 시작 중..."

    docker compose down 2>/dev/null || true
    docker compose up -d

    # 컨테이너 준비 대기
    log_info "PostgreSQL 준비 대기 중..."
    for i in {1..30}; do
        if docker compose exec -T postgres pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB} &>/dev/null; then
            log_success "PostgreSQL 준비 완료!"
            return 0
        fi
        sleep 1
        echo -n "."
    done

    log_error "PostgreSQL 시작 시간 초과"
    exit 1
}

# =============================================
# 6. DB 스키마 & 시드 (Node.js 있는 경우)
# =============================================
setup_schema() {
    if command -v npx &> /dev/null; then
        log_info "Prisma 스키마 푸시 중..."
        npx prisma db push

        log_info "Prisma 클라이언트 생성 중..."
        npx prisma generate

        read -p "시드 데이터를 넣을까요? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "시드 데이터 삽입 중..."
            npx tsx prisma/seed.ts
        fi

        log_success "DB 설정 완료!"
    else
        log_warn "Node.js가 없어서 스키마 설정을 건너뜁니다."
        log_warn "수동으로 실행하세요:"
        echo "  npx prisma db push"
        echo "  npx prisma generate"
        echo "  npx tsx prisma/seed.ts"
    fi
}

# =============================================
# 7. 결과 출력
# =============================================
print_summary() {
    echo ""
    echo "=============================================="
    log_success "PostgreSQL 설정 완료!"
    echo "=============================================="
    echo ""
    echo "📦 컨테이너 상태:"
    docker compose ps
    echo ""
    echo "🔗 연결 정보:"
    echo "   Host: localhost"
    echo "   Port: ${POSTGRES_PORT}"
    echo "   User: ${POSTGRES_USER}"
    echo "   DB:   ${POSTGRES_DB}"
    echo ""
    echo "📝 DATABASE_URL:"
    echo "   ${DATABASE_URL}"
    echo ""
    echo "🛠️ 유용한 명령어:"
    echo "   docker compose logs -f        # 로그 보기"
    echo "   docker compose down           # 중지"
    echo "   docker compose up -d          # 시작"
    echo "   docker exec -it codeinsight-postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}  # DB 접속"
    echo ""
}

# =============================================
# 메인 실행
# =============================================
main() {
    echo ""
    echo "🐘 CodeInsight PostgreSQL 설정"
    echo "=============================================="
    echo ""

    check_docker
    setup_env
    create_docker_compose
    create_env_file
    start_postgres
    setup_schema
    print_summary
}

main
