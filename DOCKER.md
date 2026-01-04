# Docker 배포 가이드

## ⚠️ 중요: 개발 vs 프로덕션

### 개발 환경 (Development)

**Docker를 사용하지 마세요!**

```bash
./start-dev.sh
```

- Backend: http://localhost:3002
- Frontend: http://localhost:5174
- 핫 리로드 활성화 (코드 변경 시 자동 재시작)

---

### 프로덕션 환경 (Production)

**Docker Compose를 사용하세요!**

```bash
# 단 하나의 명령어로 빌드 + 실행
docker compose up -d --build
```

**자동으로 실행되는 작업:**
1. ✅ Frontend 소스 → npm install → npm run build
2. ✅ Backend 소스 → npm install → npm run build
3. ✅ Caddy HTTPS 인증서 자동 발급 (Let's Encrypt)
4. ✅ 서비스 시작

---

## 프로덕션 배포 절차

### 1. 환경변수 설정

**Backend `.env` 확인:**

```bash
cd backend
cp .env.example .env
# 실제 값으로 수정
```

**Frontend `.env` 확인 (선택적):**

```bash
cd frontend
# .env 파일이 있다면 확인
# VITE_API_URL 등은 빌드 시 자동으로 주입됨
```

### 2. 배포

```bash
# Git에서 최신 코드 가져오기
git pull origin main

# Docker로 빌드 + 실행
docker compose up -d --build
```

**끝!** 더 이상 수동 빌드 불필요합니다.

### 3. 확인

```bash
# 로그 확인
docker compose logs -f

# 상태 확인
docker compose ps

# 브라우저
# http://localhost (Caddy가 80 → 443 리다이렉트)
```

---

## Docker Compose 명령어

### 시작

```bash
docker compose up -d --build    # 빌드 + 백그라운드 실행 (권장)
docker compose up --build       # 빌드 + 포그라운드 (로그 실시간)
docker compose up -d            # 빌드 없이 실행 (코드 변경 없을 때)
```

### 중지

```bash
docker compose down             # 컨테이너 중지 및 삭제
docker compose stop             # 컨테이너만 중지 (삭제 X)
```

### 재시작

```bash
docker compose restart          # 전체 재시작 (빌드 안 함)
docker compose restart backend  # Backend만 재시작
docker compose up -d --build    # 재빌드 + 재시작 (코드 변경 시)
```

### 로그

```bash
docker compose logs -f          # 전체 로그 (실시간)
docker compose logs backend     # Backend 로그만
docker compose logs caddy       # Caddy 로그만
docker compose logs frontend    # Frontend 빌드 로그
```

### 볼륨 정리 (데이터 초기화)

```bash
docker compose down -v          # 컨테이너 + 볼륨 삭제
```

---

## 구조

### 자동 빌드 과정

```
1. Frontend 컨테이너
   소스 복사 → npm install → npm run build → dist/ 생성
   └── dist/를 frontend-dist volume에 저장 → 종료

2. Backend 컨테이너
   소스 복사 → npm install → npm run build → node dist/app.js 실행

3. Caddy 컨테이너
   frontend-dist volume 마운트 → 정적 파일 서빙
   /api/* → Backend로 프록시
```

### 최종 구조

```
[사용자]
    ↓ HTTPS (443)
[Caddy Container]
    ├── frontend-dist volume → 정적 파일 서빙
    └── /api/* → Backend Container (3002)
        └── Docker (C 코드 실행)
```

---

## Cloudflare 연동 (선택)

### DNS 설정

```
your-domain.com → A → [서버 IP] (Proxied ✅)
```

### SSL/TLS 모드

```
Full (Strict) - Origin과 Cloudflare 모두 HTTPS
```

### Page Rules

```
1. /api/* → Cache Level: Bypass
2. /assets/* → Cache Everything, Edge TTL: 1 month
3. /* → Always Use HTTPS
```

### Caddyfile 수정

```caddy
# localhost를 실제 도메인으로 변경
your-domain.com {
    root * /var/www/frontend
    file_server
    reverse_proxy /api/* backend:3002
    try_files {path} /index.html
    encode gzip zstd
}
```

---

## 문제 해결

### 1. 빌드 실패

```bash
# 캐시 없이 재빌드
docker compose build --no-cache

# 전체 재빌드 + 실행
docker compose up -d --build --force-recreate
```

### 2. 포트 충돌

```bash
# 포트 사용 확인
lsof -i:80
lsof -i:443

# 프로세스 종료
kill -9 <PID>
```

### 3. Frontend 빌드 확인

```bash
# Frontend 컨테이너 로그 확인
docker compose logs frontend

# Volume 내용 확인
docker run --rm -v codeinsight_frontend-dist:/dist alpine ls -la /dist
```

### 4. 볼륨 초기화 후 재시작

```bash
docker compose down -v        # 볼륨 포함 삭제
docker compose up -d --build  # 재빌드 + 실행
```

---

## 로컬 Docker 테스트

프로덕션 배포 전 로컬에서 Docker를 테스트하려면:

```bash
# 1. Caddyfile의 도메인을 localhost로 확인 (이미 설정됨)

# 2. Docker 실행 (자동 빌드)
docker compose up --build

# 3. 브라우저
# http://localhost

# 4. 로그 확인
# Frontend 빌드: docker compose logs frontend
# Backend: docker compose logs backend
# Caddy: docker compose logs caddy
```

---

## CI/CD (GitHub Actions 예시)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/codeinsight
            git pull origin main
            docker compose up -d --build
```

---

## 주의사항

1. **.env** 파일은 절대 Git에 올리지 마세요
2. **개발 시에는 ./start-dev.sh 사용!**
3. **프로덕션 배포만 Docker 사용!**
4. **코드 변경 시 `--build` 옵션 필수!**
5. **frontend/dist/**, **backend/dist/** 폴더는 Git 제외 (.gitignore)
