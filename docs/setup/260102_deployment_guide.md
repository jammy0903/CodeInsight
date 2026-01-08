# CodeInsight 배포 가이드

> 작성일: 2026-01-02
> 상태: 미래 참고용 (현재 로컬 개발 중)

---

## 개요

프로덕션 배포 시 Caddy + Cloudflare 조합 사용.

```
사용자
  ↓ HTTPS (Cloudflare SSL + CDN)
Cloudflare
  ↓ HTTPS
Caddy (리버스 프록시)
  ├→ React 빌드 (정적 파일)
  └→ Node.js API (localhost:3002)
```

---

## 1. 개발 환경 (현재)

```
http://localhost:5174  ← Frontend (Vite)
http://localhost:3002  ← Backend (Express)
```

- TLS 불필요
- 그대로 사용

---

## 2. Caddy 설정

### 2.1 설치

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install caddy

# 또는 공식 저장소
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

### 2.2 Caddyfile

```caddyfile
# /etc/caddy/Caddyfile

codeinsight.com {
    # Frontend (정적 파일)
    root * /var/www/codeinsight/frontend/dist
    file_server
    try_files {path} /index.html

    # Backend API (프록시)
    reverse_proxy /api/* localhost:3002

    # 로그
    log {
        output file /var/log/caddy/codeinsight.log
    }

    # 보안 헤더
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        X-XSS-Protection "1; mode=block"
        Referrer-Policy strict-origin-when-cross-origin
    }
}
```

### 2.3 실행

```bash
# 설정 검증
sudo caddy validate --config /etc/caddy/Caddyfile

# 시작
sudo systemctl enable caddy
sudo systemctl start caddy

# 상태 확인
sudo systemctl status caddy
```

**Caddy 장점:**
- 자동 HTTPS (Let's Encrypt)
- 자동 인증서 갱신
- 설정 10줄
- HTTP/2 기본 지원

---

## 3. Cloudflare 설정

### 3.1 왜 Cloudflare?

| 기능 | 설명 |
|------|------|
| 무료 SSL | 클릭 한 번 |
| CDN | 전 세계 빠른 속도 |
| DDoS 방어 | 자동 |
| 캐싱 | 트래픽 절약 |
| Analytics | 무료 통계 |

### 3.2 설정 순서

1. **Cloudflare 가입** - https://cloudflare.com

2. **도메인 추가**
   - Add a Site → 도메인 입력
   - Free 플랜 선택

3. **DNS 설정**
   - 기존 DNS 레코드 자동 감지
   - A 레코드: `@` → 서버 IP
   - A 레코드: `www` → 서버 IP
   - 오렌지 구름 (Proxied) 활성화

4. **네임서버 변경**
   - 도메인 등록업체에서 Cloudflare 네임서버로 변경
   - 예: `ada.ns.cloudflare.com`, `bob.ns.cloudflare.com`

5. **SSL/TLS 설정**
   - SSL/TLS → Overview
   - **Full (strict)** 선택 (Caddy가 자체 인증서 발급하므로)

6. **캐싱 설정**
   - Caching → Configuration
   - Caching Level: Standard
   - Browser Cache TTL: 1 year (정적 파일)

7. **보안 설정**
   - Security → Settings
   - Security Level: Medium
   - Bot Fight Mode: On

### 3.3 Page Rules (선택)

```
# API는 캐싱 안 함
codeinsight.com/api/*
  - Cache Level: Bypass

# 정적 파일 캐싱
codeinsight.com/assets/*
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
```

---

## 4. 배포 스크립트

### 4.1 서버 초기 설정

```bash
#!/bin/bash
# setup-server.sh

# 필수 패키지
sudo apt update
sudo apt install -y nodejs npm caddy git

# Node.js LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 프로젝트 디렉토리
sudo mkdir -p /var/www/codeinsight
sudo chown $USER:$USER /var/www/codeinsight
```

### 4.2 배포 스크립트

```bash
#!/bin/bash
# deploy.sh

set -e

PROJECT_DIR="/var/www/codeinsight"
REPO="git@github.com:jammy0903/CodeInsight.git"
BRANCH="codeinsight"

echo "🚀 Deploying CodeInsight..."

# 1. 코드 가져오기
cd $PROJECT_DIR
if [ -d ".git" ]; then
    git pull origin $BRANCH
else
    git clone -b $BRANCH $REPO .
fi

# 2. Backend 빌드
echo "📦 Building backend..."
cd backend
npm ci --production
npm run build

# 3. Frontend 빌드
echo "📦 Building frontend..."
cd ../frontend
npm ci
npm run build

# 4. Backend 재시작 (PM2 사용)
echo "🔄 Restarting backend..."
pm2 restart codeinsight-api || pm2 start dist/app.js --name codeinsight-api

# 5. Caddy 재시작
echo "🔄 Reloading Caddy..."
sudo systemctl reload caddy

echo "✅ Deployment complete!"
```

### 4.3 PM2 설정

```bash
# PM2 설치
npm install -g pm2

# 앱 시작
cd /var/www/codeinsight/backend
pm2 start dist/app.js --name codeinsight-api

# 자동 시작 설정
pm2 startup
pm2 save
```

---

## 5. 환경변수

### 5.1 Backend (.env)

```bash
# /var/www/codeinsight/backend/.env

NODE_ENV=production
PORT=3002

# Database
DATABASE_URL="file:./data/codeinsight.db"

# AI
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:7b

# Firebase (프로덕션 키)
FIREBASE_PROJECT_ID=codeinsight-prod
FIREBASE_PRIVATE_KEY="..."
FIREBASE_CLIENT_EMAIL="..."

# CORS
CORS_ORIGIN=https://codeinsight.com
```

### 5.2 Frontend (.env.production)

```bash
# /var/www/codeinsight/frontend/.env.production

VITE_API_URL=https://codeinsight.com
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=codeinsight-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=codeinsight-prod
```

---

## 6. 체크리스트

### 배포 전

- [ ] 도메인 구매
- [ ] 서버 구매 (DigitalOcean, Vultr, AWS 등)
- [ ] SSH 키 설정
- [ ] 방화벽 설정 (22, 80, 443 포트)

### 배포 시

- [ ] Caddy 설치 및 설정
- [ ] Cloudflare DNS 설정
- [ ] SSL/TLS Full (strict) 설정
- [ ] 환경변수 설정
- [ ] PM2로 백엔드 실행
- [ ] 배포 스크립트 실행

### 배포 후

- [ ] HTTPS 접속 확인
- [ ] API 동작 확인
- [ ] 로그 모니터링 설정
- [ ] 백업 설정

---

## 7. 문제 해결

### Caddy가 시작 안 됨

```bash
# 로그 확인
sudo journalctl -u caddy -f

# 설정 검증
sudo caddy validate --config /etc/caddy/Caddyfile
```

### 502 Bad Gateway

```bash
# 백엔드 실행 확인
pm2 status

# 포트 확인
sudo lsof -i :3002
```

### SSL 인증서 문제

```bash
# Caddy 인증서 확인
sudo ls -la /var/lib/caddy/.local/share/caddy/certificates/

# 수동 갱신
sudo caddy reload
```

---

## 8. 비용 예상

| 항목 | 월 비용 |
|------|--------|
| 도메인 (.com) | ~$12/년 |
| 서버 (2GB RAM) | ~$10-20/월 |
| Cloudflare | $0 (무료) |
| SSL | $0 (Caddy 자동) |
| **합계** | **~$15/월** |

---

## 참고 링크

- [Caddy 공식 문서](https://caddyserver.com/docs/)
- [Cloudflare 가이드](https://developers.cloudflare.com/)
- [PM2 문서](https://pm2.keymetrics.io/docs/)
- [DigitalOcean 튜토리얼](https://www.digitalocean.com/community/tutorials)
