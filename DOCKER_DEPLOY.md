# 🐳 C-OSINE Docker 프로덕션 배포 가이드

---

## 📋 **사전 준비 (Prerequisites)**

### **1. Docker 설치**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose 설치
sudo apt-get install docker-compose-plugin

# 현재 사용자를 docker 그룹에 추가 (선택)
sudo usermod -aG docker $USER
```

### **2. 환경 변수 설정**
```bash
# .env.production.example을 복사
cp .env.production.example .env.production

# 환경 변수 편집
nano .env.production
```

**필수 환경 변수:**
- `DATABASE_URL` - Neon PostgreSQL 연결 문자열
- `FIREBASE_PROJECT_ID` - Firebase 프로젝트 ID
- `FIREBASE_CLIENT_EMAIL` - Firebase 서비스 계정 이메일
- `FIREBASE_PRIVATE_KEY` - Firebase 개인 키
- `CORS_ORIGINS` - 프로덕션 도메인 (예: `https://your-domain.com`)
- `VITE_API_URL` - Frontend에서 사용할 Backend API URL

### **3. GCC Docker 이미지 사전 다운로드**
```bash
# C 시뮬레이터용 GCC 이미지 (필수!)
./docker-deploy.sh pull-gcc
```

---

## 🚀 **배포 단계**

### **Step 1: 빌드**
```bash
# Docker 이미지 빌드
./docker-deploy.sh build
```

**예상 시간:** 5-10분 (처음 빌드 시)

**빌드 내용:**
- ✅ Frontend (Nginx + React SPA)
- ✅ Backend (Node.js + Python + Java + gcc)
- ✅ Java Debugger Agent 컴파일
- ✅ TypeScript 컴파일

### **Step 2: 실행**
```bash
# 서비스 시작
./docker-deploy.sh up
```

**접속:**
- Frontend: http://localhost (포트 80)
- Backend: http://localhost:3002

### **Step 3: 상태 확인**
```bash
# 서비스 상태
./docker-deploy.sh ps

# 헬스 체크
./docker-deploy.sh health

# 로그 확인
./docker-deploy.sh logs          # 전체 로그
./docker-deploy.sh logs backend  # Backend만
./docker-deploy.sh logs frontend # Frontend만
```

---

## 🛠️ **관리 명령어**

### **재시작**
```bash
./docker-deploy.sh restart
```

### **중지**
```bash
./docker-deploy.sh down
```

### **완전 삭제 (주의!)**
```bash
# 컨테이너, 볼륨, 이미지 모두 삭제
./docker-deploy.sh clean
```

---

## 🔧 **트러블슈팅**

### **1. Backend가 시작되지 않음**
```bash
# 로그 확인
./docker-deploy.sh logs backend

# 일반적인 원인:
# - DATABASE_URL이 잘못됨 (Neon 연결 실패)
# - FIREBASE_PRIVATE_KEY 형식 오류
# - Docker 소켓 권한 문제
```

**해결:**
```bash
# Docker 소켓 권한 확인
ls -la /var/run/docker.sock

# 권한 부여 (필요한 경우)
sudo chmod 666 /var/run/docker.sock
```

### **2. Frontend가 Backend에 연결 안 됨**
```bash
# Frontend 빌드 시 VITE_API_URL이 제대로 주입되었는지 확인
docker exec codeinsight-frontend cat /usr/share/nginx/html/assets/index-*.js | grep -o "http://[^\"]*3002"
```

**해결:**
```bash
# .env.production에서 VITE_API_URL 확인
grep VITE_API_URL .env.production

# 다시 빌드
./docker-deploy.sh down
./docker-deploy.sh build
./docker-deploy.sh up
```

### **3. C 시뮬레이터 에러**
```bash
# GCC 이미지 확인
docker images | grep gcc

# 이미지가 없으면 다시 pull
./docker-deploy.sh pull-gcc
```

### **4. 메모리 부족**
```bash
# Docker 리소스 확인
docker stats

# 불필요한 컨테이너/이미지 정리
docker system prune -a
```

---

## 📊 **서비스 구조**

```
┌─────────────────────────────────────────┐
│         Internet (Users)                │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Frontend (Nginx:80)                    │
│  - React SPA                            │
│  - Static Files                         │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Backend (Node.js:3002)                 │
│  ├─ Python Simulator                    │
│  ├─ Java Simulator (JDK 17)             │
│  ├─ JavaScript Simulator                │
│  └─ C Simulator (Docker-in-Docker)      │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  External Services                      │
│  ├─ Neon PostgreSQL (Database)          │
│  ├─ Firebase (Authentication)           │
│  └─ Ollama (Optional LLM)               │
└─────────────────────────────────────────┘
```

---

## 🔒 **보안 권장사항**

### **1. 환경 변수 보호**
```bash
# .env.production 권한 제한
chmod 600 .env.production

# Git에 커밋되지 않도록 확인
cat .gitignore | grep ".env.production"
```

### **2. Nginx HTTPS 설정 (프로덕션 필수)**
```bash
# Let's Encrypt 인증서 발급
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### **3. Firewall 설정**
```bash
# 필요한 포트만 열기
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 3002/tcp # Backend (필요한 경우)
sudo ufw enable
```

---

## 📈 **성능 최적화**

### **1. Docker 리소스 제한**
`docker-compose.yml`에서 조정:
```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 1G
```

### **2. Nginx Caching**
이미 설정됨:
- ✅ Gzip 압축
- ✅ 정적 파일 1년 캐싱
- ✅ index.html 캐시 비활성화

### **3. 로그 로테이션**
```bash
# Docker 로그 크기 제한
# /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

---

## 🔄 **업데이트 절차**

### **코드 업데이트 시:**
```bash
# 1. 코드 pull
git pull origin main

# 2. 다시 빌드
./docker-deploy.sh down
./docker-deploy.sh build
./docker-deploy.sh up

# 3. 헬스 체크
./docker-deploy.sh health
```

### **무중단 배포 (Blue-Green):**
```bash
# 1. 새 이미지 빌드
docker-compose build

# 2. 새 컨테이너 시작 (다른 포트)
docker-compose -p codeinsight-blue up -d

# 3. 헬스 체크 후 Nginx 리버스 프록시 전환

# 4. 기존 컨테이너 종료
docker-compose -p codeinsight-green down
```

---

## 📞 **문제 발생 시**

1. **로그 확인**: `./docker-deploy.sh logs`
2. **헬스 체크**: `./docker-deploy.sh health`
3. **컨테이너 상태**: `./docker-deploy.sh ps`
4. **리소스 사용**: `docker stats`

**여전히 해결 안 되면:**
```bash
# 완전 재시작
./docker-deploy.sh down
./docker-deploy.sh clean
./docker-deploy.sh build
./docker-deploy.sh up
```
