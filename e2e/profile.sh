#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# 🚀 CodeInsight 프로파일링 스크립트 (WSL 환경)
# ═══════════════════════════════════════════════════════════════════
# 사용법:
#   ./e2e/profile.sh api /api/courses              # API 프로파일링
#   ./e2e/profile.sh clinic doctor                 # Clinic.js 진단
#   ./e2e/profile.sh heap                          # 메모리 힙 덤프
#   ./e2e/profile.sh front                         # 프론트엔드 번들 분석
#   ./e2e/profile.sh react profiler_data.json      # React Profiler 분석
#   ./e2e/profile.sh bench                         # API 벤치마크
#   ./e2e/profile.sh clean                         # 로그 정리
# ═══════════════════════════════════════════════════════════════════

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 경로 설정
PROJECT_ROOT="/home/jammy/projects/C-OSINE"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
LOG_DIR="/tmp/codeinsight-profile"
MAX_LOG_SIZE=5242880  # 5MB

# 로그 디렉토리 생성
mkdir -p "$LOG_DIR"

# ═══════════════════════════════════════════════════════════════════
# 유틸리티 함수
# ═══════════════════════════════════════════════════════════════════

print_header() {
    echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  🚀 $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# 로그 파일 크기 관리
manage_log_size() {
    local log_file="$1"
    if [ -f "$log_file" ]; then
        local size=$(stat -c%s "$log_file" 2>/dev/null || echo 0)
        if [ "$size" -gt "$MAX_LOG_SIZE" ]; then
            tail -1000 "$log_file" > "${log_file}.tmp"
            mv "${log_file}.tmp" "$log_file"
            print_info "로그 파일 크기 조정됨: $log_file"
        fi
    fi
}

# 백엔드 PID 찾기
get_backend_pid() {
    pgrep -f "tsx.*src/app.ts" | head -1
}

# 백엔드 실행 확인
ensure_backend_running() {
    local pid=$(get_backend_pid)
    if [ -z "$pid" ]; then
        print_error "백엔드가 실행 중이 아닙니다!"
        echo -e "먼저 실행하세요: ${YELLOW}./start-dev.sh${NC}"
        exit 1
    fi
    echo "$pid"
}

# WSL 브라우저 열기
open_browser() {
    local url="$1"
    print_info "브라우저 열기: $url"

    if command -v wslview &> /dev/null; then
        # WSL2: wslview 사용
        wslview "$url" 2>/dev/null || cmd.exe /c start "$url" 2>/dev/null
    else
        # WSL1 또는 일반: cmd.exe 사용
        cmd.exe /c start "$url" 2>/dev/null || xdg-open "$url" 2>/dev/null || true
    fi
}

# ═══════════════════════════════════════════════════════════════════
# 1️⃣ API 프로파일링 (Node.js --prof)
# ═══════════════════════════════════════════════════════════════════
profile_api() {
    local endpoint="${1:-/api/courses/languages}"
    local log_file="$LOG_DIR/api_profile_$(date +%H%M%S).txt"

    print_header "API 프로파일링: $endpoint"

    ensure_backend_running > /dev/null

    print_info "API 호출 (10회)..."

    # warmup
    curl -s "http://localhost:3002${endpoint}" > /dev/null || true

    # 성능 측정
    {
        echo "═══ API 응답 시간 ═══"
        for i in {1..10}; do
            /usr/bin/time -f "%E elapsed" curl -s "http://localhost:3002${endpoint}" > /dev/null
        done
    } 2>&1 | tee "$log_file"

    echo ""
    print_success "결과 저장됨: $log_file"

    manage_log_size "$log_file"
}

# ═══════════════════════════════════════════════════════════════════
# 2️⃣ Clinic.js 프로파일링
# ═══════════════════════════════════════════════════════════════════
profile_clinic() {
    local mode="${1:-doctor}"  # doctor, flame, bubbleprof

    print_header "Clinic.js 프로파일링 (${mode})"

    cd "$BACKEND_DIR"

    # clinic 설치 확인
    if ! npm list -g clinic &> /dev/null; then
        print_error "clinic이 설치되지 않았습니다"
        echo "설치: npm install -g clinic"
        exit 1
    fi

    print_info "백엔드를 clinic으로 재시작합니다..."
    print_info "${YELLOW}프로파일링이 끝나면 Ctrl+C를 눌러주세요${NC}"

    # 기존 백엔드 종료
    pkill -f "tsx.*src/app.ts" 2>/dev/null || true
    sleep 2

    # clinic으로 백엔드 시작
    case "$mode" in
        doctor)
            clinic doctor --on-port "echo 'Profiling started. Use API, then press Ctrl+C'" -- npm run dev
            ;;
        flame)
            clinic flame --on-port "echo 'Profiling started. Use API, then press Ctrl+C'" -- npm run dev
            ;;
        bubbleprof)
            clinic bubbleprof --on-port "echo 'Profiling started. Use API, then press Ctrl+C'" -- npm run dev
            ;;
        *)
            print_error "알 수 없는 모드: $mode"
            echo "사용 가능: doctor, flame, bubbleprof"
            exit 1
            ;;
    esac

    # HTML 파일 자동 열기
    local html_file=$(ls -t .clinic/*.html 2>/dev/null | head -1)
    if [ -f "$html_file" ]; then
        print_success "프로파일 생성됨: $html_file"
        open_browser "file://wsl.localhost/Ubuntu$html_file"
    fi

    # 백엔드 재시작
    print_info "백엔드를 다시 시작하세요: ./start-dev.sh"
}

# ═══════════════════════════════════════════════════════════════════
# 3️⃣ 메모리 힙 덤프
# ═══════════════════════════════════════════════════════════════════
profile_heap() {
    print_header "메모리 힙 덤프"

    local pid=$(ensure_backend_running)
    local heap_file="$LOG_DIR/heap_$(date +%H%M%S).heapsnapshot"

    print_info "백엔드 PID: $pid"

    # heapdump 모듈 필요
    cd "$BACKEND_DIR"
    if ! npm list heapdump &> /dev/null; then
        print_error "heapdump가 설치되지 않았습니다"
        echo "설치: cd backend && npm install --save-dev heapdump"
        exit 1
    fi

    print_info "힙 덤프 생성 중..."

    # SIGUSR2 시그널로 힙 덤프 생성 (heapdump 모듈 사용 시)
    kill -USR2 "$pid"
    sleep 2

    # 생성된 heapsnapshot 파일 찾기
    local snapshot=$(ls -t heapsnapshot*.heapsnapshot 2>/dev/null | head -1)

    if [ -f "$snapshot" ]; then
        mv "$snapshot" "$heap_file"
        print_success "힙 덤프 생성됨: $heap_file"
        echo ""
        print_info "Chrome DevTools로 열기:"
        echo "  1. Chrome 열기 → DevTools (F12)"
        echo "  2. Memory 탭 → Load"
        echo "  3. 파일 선택: $heap_file"
    else
        print_error "힙 덤프 생성 실패"
        echo ""
        echo "대안: Node.js --inspect 사용"
        echo "  1. 백엔드를 --inspect로 재시작"
        echo "  2. chrome://inspect 접속"
        echo "  3. Memory Profiler 사용"
    fi
}

# ═══════════════════════════════════════════════════════════════════
# 4️⃣ 프론트엔드 번들 분석
# ═══════════════════════════════════════════════════════════════════
profile_frontend() {
    local log_file="$LOG_DIR/frontend_bundle_$(date +%H%M%S).txt"

    print_header "프론트엔드 번들 분석"

    cd "$FRONTEND_DIR"

    print_info "Vite 번들 분석 실행 중..."

    # rollup-plugin-visualizer가 필요
    if ! grep -q "rollup-plugin-visualizer" package.json 2>/dev/null; then
        print_info "rollup-plugin-visualizer 설치 중..."
        npm install --save-dev rollup-plugin-visualizer
    fi

    # 빌드 + 번들 분석
    npm run build 2>&1 | tee "$log_file"

    # stats.html 찾기
    local stats_file="dist/stats.html"
    if [ -f "$stats_file" ]; then
        print_success "번들 분석 생성됨: $stats_file"
        open_browser "file://wsl.localhost/Ubuntu${FRONTEND_DIR}/${stats_file}"
    else
        # 번들 크기만 출력
        if [ -d "dist" ]; then
            echo ""
            echo "═══ 번들 파일 크기 ═══" | tee -a "$log_file"
            find dist -name "*.js" -o -name "*.css" | xargs ls -lhS 2>/dev/null | tee -a "$log_file"
            echo ""
            echo "═══ 총 크기 ═══" | tee -a "$log_file"
            du -sh dist | tee -a "$log_file"
        fi
    fi

    print_success "로그: $log_file"
}

# ═══════════════════════════════════════════════════════════════════
# 5️⃣ React Profiler 분석 (Speedscope)
# ═══════════════════════════════════════════════════════════════════
profile_react() {
    local json_file="${1}"

    print_header "React Profiler 분석"

    # 파일 존재 확인
    if [ -z "$json_file" ]; then
        print_error "JSON 파일 경로를 입력하세요"
        echo -e "예: ${YELLOW}./e2e/profile.sh react ~/Downloads/profiler-data.json${NC}"
        exit 1
    fi

    # Windows 경로 변환
    if [[ "$json_file" =~ ^[A-Za-z]:\\ ]]; then
        # Windows 경로: C:\Users\... → WSL 경로: /mnt/c/Users/...
        drive=$(echo "${json_file:0:1}" | tr '[:upper:]' '[:lower:]')
        path="${json_file:3}"  # C:\ 제거
        path="${path//\\//}"   # \ → /
        json_file="/mnt/${drive}/${path}"
        print_info "Windows 경로 변환: /mnt/${drive}/${path}"
    elif [[ "$json_file" == /mnt/c/* ]]; then
        # 이미 WSL 경로
        json_file="$json_file"
    elif [[ "$json_file" != /* ]]; then
        # 상대 경로 → 절대 경로
        json_file="$(pwd)/$json_file"
    fi

    if [ ! -f "$json_file" ]; then
        print_error "파일을 찾을 수 없습니다: $json_file"
        exit 1
    fi

    print_success "파일 확인: $json_file"

    # Node.js로 간단한 요약 출력
    print_info "데이터 요약 분석 중..."
    echo ""

    node "$PROJECT_ROOT/e2e/scripts/analyze-react-profiler.js" "$json_file" || print_error "JSON 파싱 오류"

    echo ""

    # Speedscope로 시각화 (WSL 브라우저 연동)
    print_info "Speedscope로 시각화 시작..."
    echo ""

    if command -v npx &> /dev/null; then
        # 백그라운드에서 speedscope 실행
        npx speedscope "$json_file" &
        local speedscope_pid=$!

        sleep 3

        # WSL 브라우저 열기 시도
        if open_browser "http://localhost:9999" 2>/dev/null; then
            print_success "브라우저가 자동으로 열렸습니다"
        else
            print_info "${YELLOW}브라우저를 수동으로 여세요:${NC}"
            echo "  Windows 브라우저에서: http://localhost:9999"
        fi

        print_success "Speedscope 실행 중 (PID: $speedscope_pid)"
        echo "종료하려면 Ctrl+C를 누르세요"

        wait $speedscope_pid 2>/dev/null || true
    else
        print_error "npx가 설치되지 않았습니다"
        echo "설치: sudo apt-get install npm"
    fi
}

# ═══════════════════════════════════════════════════════════════════
# 6️⃣ API 벤치마크 (autocannon)
# ═══════════════════════════════════════════════════════════════════
profile_bench() {
    local endpoint="${1:-/api/courses/languages}"
    local log_file="$LOG_DIR/bench_$(date +%H%M%S).txt"

    print_header "API 벤치마크: $endpoint"

    ensure_backend_running > /dev/null

    # autocannon 설치 확인
    if ! command -v autocannon &> /dev/null; then
        print_error "autocannon이 설치되지 않았습니다"
        echo "설치: npm install -g autocannon"
        exit 1
    fi

    print_info "10초 동안 부하 테스트 실행 중..."

    autocannon -d 10 -c 10 "http://localhost:3002${endpoint}" | tee "$log_file"

    echo ""
    print_success "결과 저장됨: $log_file"

    manage_log_size "$log_file"
}

# ═══════════════════════════════════════════════════════════════════
# 7️⃣ 로그 정리
# ═══════════════════════════════════════════════════════════════════
clean_logs() {
    print_header "프로파일 로그 정리"

    local total_size=$(du -sh "$LOG_DIR" 2>/dev/null | cut -f1)
    print_info "현재 로그 크기: $total_size"

    echo ""
    echo "로그 파일 목록:"
    ls -lh "$LOG_DIR" 2>/dev/null || echo "로그 없음"

    echo ""
    read -p "모든 로그를 삭제할까요? (y/N) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$LOG_DIR"/*
        print_success "로그 삭제 완료"
    else
        print_info "취소됨"
    fi
}

# ═══════════════════════════════════════════════════════════════════
# 도움말
# ═══════════════════════════════════════════════════════════════════
show_help() {
    echo -e "${CYAN}"
    cat << 'EOF'
═══════════════════════════════════════════════════════════════════
  🚀 CodeInsight 프로파일링 스크립트 (WSL 환경)
═══════════════════════════════════════════════════════════════════

사용법: ./e2e/profile.sh <command> [options]

명령어:
  api <endpoint>      API 응답 시간 측정
                      예: ./e2e/profile.sh api /api/courses
                      예: ./e2e/profile.sh api /api/c/run

  clinic <mode>       Clinic.js 프로파일링 (CPU/메모리/이벤트루프)
                      모드: doctor, flame, bubbleprof
                      예: ./e2e/profile.sh clinic doctor
                      ⚠️  프로파일링 후 Ctrl+C로 종료

  heap                메모리 힙 덤프 생성 (Chrome DevTools용)
                      예: ./e2e/profile.sh heap

  front               프론트엔드 번들 분석 (Vite)
                      예: ./e2e/profile.sh front

  react <json_file>   React Profiler JSON 분석 (Speedscope)
                      예: ./e2e/profile.sh react profiler-data.json
                      예: ./e2e/profile.sh react ~/Downloads/profiler.json
                      📝 React DevTools에서 Profiler 탭 → 녹화 → Export

  bench <endpoint>    API 벤치마크 (autocannon)
                      예: ./e2e/profile.sh bench /api/courses

  clean               프로파일 로그 정리
                      예: ./e2e/profile.sh clean

  help                이 도움말 표시

로그 위치: /tmp/codeinsight-profile/

WSL 브라우저 연동:
  - Speedscope, Clinic.js HTML 자동으로 브라우저에서 열림
  - wslview 또는 cmd.exe /c start 사용

필수 도구 설치:
  npm install -g clinic autocannon
  cd backend && npm install --save-dev heapdump

═══════════════════════════════════════════════════════════════════
EOF
    echo -e "${NC}"
}

# ═══════════════════════════════════════════════════════════════════
# 메인
# ═══════════════════════════════════════════════════════════════════
case "${1:-help}" in
    api)
        profile_api "$2"
        ;;
    clinic)
        profile_clinic "$2"
        ;;
    heap)
        profile_heap
        ;;
    front|frontend)
        profile_frontend
        ;;
    react)
        profile_react "$2"
        ;;
    bench|benchmark)
        profile_bench "$2"
        ;;
    clean)
        clean_logs
        ;;
    help|--help|-h|*)
        show_help
        ;;
esac
