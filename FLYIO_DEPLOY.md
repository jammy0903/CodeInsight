# 🚀 Fly.io 배포 가이드 (초간단!)

Docker 배포에 특화된 Fly.io로 **명령어 하나**로 배포하세요!

---

## ⚡ 빠른 시작 (3분!)

```bash
# 배포 스크립트 실행
./deploy-flyio.sh
```

**끝!** 이게 전부입니다. 스크립트가 자동으로:
- ✅ Fly CLI 설치 (없으면)
- ✅ 로그인
- ✅ 백엔드/프론트엔드 앱 생성
- ✅ 환경 변수 설정
- ✅ Docker 빌드 및 배포

---

## 📍 배포 후 URL

배포가 완료되면 다음 URL로 접속할 수 있습니다:

- **백엔드**: https://codeinsight-backend.fly.dev
- **프론트엔드**: https://codeinsight-frontend.fly.dev

---

## 🔧 수동 설치 (스크립트 실패 시)

### 1. Fly CLI 설치

```bash
curl -L https://fly.io/install.sh | sh

# PATH 추가
export FLYCTL_INSTALL="$HOME/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"

# 또는 bashrc에 추가
echo 'export FLYCTL_INSTALL="$HOME/.fly"' >> ~/.bashrc
echo 'export PATH="$FLYCTL_INSTALL/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### 2. 로그인

```bash
flyctl auth login
```

### 3. 배포 스크립트 실행

```bash
./deploy-flyio.sh
```

---

## 📊 유용한 명령어

### 상태 확인
```bash
# 백엔드 상태
flyctl status -a codeinsight-backend

# 프론트엔드 상태
flyctl status -a codeinsight-frontend
```

### 로그 확인
```bash
# 백엔드 로그 (실시간)
flyctl logs -a codeinsight-backend

# 프론트엔드 로그
flyctl logs -a codeinsight-frontend
```

### 재배포
```bash
# 백엔드만 재배포
flyctl deploy --config fly.toml -a codeinsight-backend

# 프론트엔드만 재배포
flyctl deploy --config fly.frontend.toml -a codeinsight-frontend
```

### 앱 중지/시작
```bash
# 앱 중지 (비용 절약)
flyctl scale count 0 -a codeinsight-backend

# 앱 시작
flyctl scale count 1 -a codeinsight-backend
```

### 환경 변수 확인/수정
```bash
# 환경 변수 목록
flyctl secrets list -a codeinsight-backend

# 환경 변수 추가/수정
flyctl secrets set KEY=VALUE -a codeinsight-backend

# 환경 변수 삭제
flyctl secrets unset KEY -a codeinsight-backend
```

---

## 💰 비용 (무료 티어)

Fly.io 무료 티어:
- ✅ 3개의 shared-cpu-1x 256MB VM
- ✅ 3GB persistent volume storage
- ✅ 160GB 아웃바운드 데이터 전송

**현재 구성:**
- 백엔드: 1GB RAM (무료 티어)
- 프론트엔드: 512MB RAM (무료 티어)

총 2개 VM 사용 → **무료 티어 내!**

---

## 🔧 설정 파일 설명

### `fly.toml` (백엔드)
- Dockerfile 경로 지정
- 포트 3002
- Health check: `/health`
- 자동 시작/중지 활성화 (비용 절약)

### `fly.frontend.toml` (프론트엔드)
- Dockerfile.frontend 경로 지정
- 포트 80
- 백엔드 URL 자동 설정

---

## ⚠️ 문제 해결

### 배포 실패
```bash
# 로그 확인
flyctl logs -a codeinsight-backend

# 상태 확인
flyctl status -a codeinsight-backend
```

### Dockerfile 빌드 에러
```bash
# 로컬에서 Docker 빌드 테스트
docker build -t test-backend -f Dockerfile .
```

### 환경 변수 누락
```bash
# 환경 변수 다시 설정
flyctl secrets set KEY=VALUE -a codeinsight-backend
```

### 502 Bad Gateway
- 백엔드 Health Check 확인: https://codeinsight-backend.fly.dev/health
- 포트 번호 확인 (3002)
- 로그에서 에러 확인

---

## 🎯 배포 체크리스트

- [ ] Fly CLI 설치 완료
- [ ] `flyctl auth login` 로그인 완료
- [ ] `./deploy-flyio.sh` 실행
- [ ] 백엔드 Health Check 성공: https://codeinsight-backend.fly.dev/health
- [ ] 프론트엔드 접속 성공: https://codeinsight-frontend.fly.dev
- [ ] Firebase 인증 테스트

---

## 📚 더 알아보기

- Fly.io 공식 문서: https://fly.io/docs
- Fly.io CLI 가이드: https://fly.io/docs/flyctl
- Fly.io Discord: https://fly.io/discord

---

**Happy Deploying! 🚀**
