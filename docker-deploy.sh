#!/bin/bash
# ========================================
# C-OSINE Docker Deployment Script
# ========================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.production exists
if [ ! -f .env.production ]; then
    log_error ".env.production not found!"
    log_info "Please copy .env.production.example to .env.production and fill in your values."
    exit 1
fi

# Note: Environment variables are loaded via docker-compose --env-file
# No need to export them here to avoid multiline value issues

# Command argument
COMMAND=${1:-up}

case $COMMAND in
    build)
        log_info "Building Docker images..."
        docker-compose build --no-cache
        log_info "Build completed!"
        ;;

    up)
        log_info "Starting C-OSINE services..."
        docker-compose --env-file .env.production up -d
        log_info "Services started!"
        log_info "Frontend: http://localhost (port 80)"
        log_info "Backend: http://localhost:3002"
        ;;

    down)
        log_info "Stopping C-OSINE services..."
        docker-compose down
        log_info "Services stopped!"
        ;;

    restart)
        log_info "Restarting C-OSINE services..."
        docker-compose --env-file .env.production restart
        log_info "Services restarted!"
        ;;

    logs)
        SERVICE=${2:-}
        if [ -z "$SERVICE" ]; then
            docker-compose logs -f
        else
            docker-compose logs -f $SERVICE
        fi
        ;;

    ps)
        log_info "Running services:"
        docker-compose ps
        ;;

    clean)
        log_warn "This will remove all containers, volumes, and images. Are you sure? (y/N)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            log_info "Cleaning up..."
            docker-compose down -v --rmi all
            log_info "Cleanup completed!"
        else
            log_info "Cleanup cancelled."
        fi
        ;;

    pull-gcc)
        log_info "Pulling GCC Docker image for C simulator..."
        docker pull gcc:latest
        log_info "GCC image pulled!"
        ;;

    health)
        log_info "Checking service health..."
        echo "Frontend:"
        curl -f http://localhost/ > /dev/null 2>&1 && echo "  ✅ Healthy" || echo "  ❌ Unhealthy"
        echo "Backend:"
        curl -f http://localhost:3002/health > /dev/null 2>&1 && echo "  ✅ Healthy" || echo "  ❌ Unhealthy"
        ;;

    *)
        echo "Usage: $0 {build|up|down|restart|logs|ps|clean|pull-gcc|health}"
        echo ""
        echo "Commands:"
        echo "  build      - Build Docker images"
        echo "  up         - Start services"
        echo "  down       - Stop services"
        echo "  restart    - Restart services"
        echo "  logs       - View logs (add service name for specific service)"
        echo "  ps         - List running services"
        echo "  clean      - Remove all containers, volumes, and images"
        echo "  pull-gcc   - Pull GCC Docker image for C simulator"
        echo "  health     - Check service health"
        exit 1
        ;;
esac
