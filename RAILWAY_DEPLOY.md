# 🚂 Railway 배포 가이드

## ⚡ 초간단 배포 (CLI 자동화) - 추천!

**명령어 하나로 모든 것이 완료됩니다!**

```bash
./deploy-railway.sh
```

스크립트가 자동으로:
- ✅ Railway CLI 설치 (없으면)
- ✅ 로그인
- ✅ 프로젝트 연결
- ✅ 백엔드 환경 변수 설정
- ✅ 백엔드 배포
- ✅ 프론트엔드 환경 변수 설정
- ✅ 프론트엔드 배포
- ✅ CORS 설정

**끝!** 10분이면 배포 완료됩니다.

---

## 🚀 수동 배포 (UI 사용)

### 1단계: Railway 가입 및 프로젝트 생성

1. https://railway.app 접속
2. **GitHub로 로그인** (회원가입)
3. Dashboard → **New Project** 클릭
4. **Deploy from GitHub repo** 선택
5. `jammy0903/CodeInsight` 저장소 선택

---

## 📦 서비스 구성

Railway가 자동으로 Dockerfile을 감지하지만, 멀티 서비스를 위해 수동 설정이 필요합니다.

### 🗄️ 1. PostgreSQL 데이터베이스 추가

1. 프로젝트 화면에서 **+ New** 클릭
2. **Database** → **Add PostgreSQL** 선택
3. 자동으로 생성됨!
4. **Connect** 탭에서 `DATABASE_URL` 자동 생성 확인

### 🔧 2. 백엔드 서비스 생성

1. **+ New** → **GitHub Repo** → `jammy0903/CodeInsight` 선택
2. **Settings** 탭:
   - **Service Name**: `backend`
   - **Root Directory**: 비워두기 (루트)
   - **Dockerfile Path**: `Dockerfile`
   - **Port**: `3002`

3. **Variables** 탭 (환경변수 추가):
```bash
NODE_ENV=production
PORT=3002
DATABASE_URL=${{Postgres.DATABASE_URL}}
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-email@xxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n
ADMIN_FIREBASE_UID=your-admin-uid
CORS_ORIGINS=https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}
```

4. **Deploy** 클릭!

### 🎨 3. 프론트엔드 서비스 생성

1. **+ New** → **GitHub Repo** → `jammy0903/CodeInsight` 선택
2. **Settings** 탭:
   - **Service Name**: `frontend`
   - **Root Directory**: 비워두기
   - **Dockerfile Path**: `Dockerfile.frontend`
   - **Port**: `80`

3. **Variables** 탭:
```bash
VITE_API_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

4. **Deploy** 클릭!

---

## 🔗 서비스 간 연결

Railway의 **Service Variables**를 사용하여 자동 연결:

- `${{Postgres.DATABASE_URL}}` - PostgreSQL 연결 URL
- `${{backend.RAILWAY_PUBLIC_DOMAIN}}` - 백엔드 공개 URL
- `${{frontend.RAILWAY_PUBLIC_DOMAIN}}` - 프론트엔드 공개 URL

---

## ⚙️ 추가 설정 (선택사항)

### AI 기능 활성화

백엔드 서비스 → **Variables** 추가:
```bash
DEEPSEEK_API_KEY=sk-xxxxx
XAI_API_KEY=xai-xxxxx
OLLAMA_URL=http://host.docker.internal:5044
```

### 커스텀 도메인 설정

1. 각 서비스 → **Settings** → **Domains**
2. **Add Custom Domain** 클릭
3. DNS 설정 (CNAME 레코드)

---

## 🗃️ 데이터베이스 초기화 (Seed)

백엔드 배포 완료 후:

1. 백엔드 서비스 → **Deploy** 탭
2. **Deployments** 목록에서 최신 배포 선택
3. 로그 확인 및 Shell 접근 (Railway CLI 필요)

**Railway CLI 사용:**
```bash
# CLI 설치
npm i -g @railway/cli

# 로그인
railway login

# 프로젝트 연결
railway link

# 백엔드 서비스 선택 후 명령 실행
railway run --service backend pnpm --filter @codeinsight/backend seed
```

---

## 🔍 배포 확인

### 백엔드 Health Check
```bash
curl https://your-backend.railway.app/health
# 응답: {"status":"healthy"}
```

### 프론트엔드 접속
```
https://your-frontend.railway.app
```

---

## 💰 비용 관리

Railway 무료 플랜: **$5 크레딧/월**

**예상 비용:**
- PostgreSQL: ~$5/월
- 백엔드 (512MB RAM): ~$5/월  
- 프론트엔드 (256MB RAM): ~$3/월

**절약 팁:**
- 개발 중에만 사용 (Sleep 모드 활용)
- 프론트엔드를 Vercel/Cloudflare Pages로 분리
- 크레딧 초과 시 자동 중지 설정

---

## ⚠️ 주의사항

### Docker-in-Docker (C 시뮬레이터)

백엔드의 C 시뮬레이터는 Docker-in-Docker를 사용합니다.

Railway에서 작동하지 않을 수 있으므로:
- C 시뮬레이터 비활성화, 또는
- Railway Pro 플랜 사용 ($20/월)

### 빌드 시간

첫 배포 시:
- 백엔드: ~10-15분 (Java, Python, C 컴파일러 설치)
- 프론트엔드: ~5분

---

## 🆘 문제 해결

### 빌드 실패
1. 서비스 → **Deployments** → 실패한 배포 클릭
2. 로그 확인
3. 환경변수 누락 확인

### 502 Bad Gateway
- 백엔드 Health Check 확인
- PORT 환경변수 확인 (3002)
- 로그에서 에러 확인

### CORS 에러
- 백엔드 `CORS_ORIGINS` 환경변수 확인
- 프론트엔드 URL 정확히 입력

---

## 🎯 배포 완료 체크리스트

- [ ] PostgreSQL 데이터베이스 생성
- [ ] 백엔드 서비스 배포 및 환경변수 설정
- [ ] 프론트엔드 서비스 배포 및 환경변수 설정
- [ ] 백엔드 Health Check 성공
- [ ] 프론트엔드 접속 성공
- [ ] Firebase 인증 테스트
- [ ] 데이터베이스 Seed 실행

---

## 📚 더 알아보기

- Railway 공식 문서: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway CLI: https://docs.railway.app/develop/cli

---

**Happy Deploying! 🚀**
