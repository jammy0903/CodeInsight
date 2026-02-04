### 🚀 핵심 정보

| 구분 | 값 |
|------|-----|
| **배포 플랫폼** | **Render만 사용** (다른 플랫폼 사용 안 함) |
| 로컬 경로 | `/home/jammy/projects/C-OSINE` |
| 프론트엔드 배포 | Render Static Site (https://codeinsight-frontend.onrender.com) |
| 백엔드 배포 | Render Web Service (Docker) |
| **데이터베이스** | **Neon PostgreSQL** |
| **DB Host** | `ep-**.us-east-1.aws.neon.tech` |
| **DB Name** | `codeinsight_prod` |
| Git Remote | `https://github.com/jammy0903/CodeInsight.git` |
| Branch | `main` |

### API Keys & Credentials

| 서비스 | Key 이름 | 용도 |
|--------|---------|------|
| Render | `coin` | 배포 자동화 (rnd_8QlbsM81Vm9YCQe0RWeo6nwhxHnP) |
| DeepSeek | - | AI Tutor 기능 (sk-327987f9e36648d7b394b1c98fd4e4ec) |
| Neon | - | PostgreSQL 데이터베이스 |
| Firebase | - | 사용자 인증 |
| Fal.ai | - | 이미지 생성 |

## ✅ 배포 방식: Push만 하면 자동 배포됨!

### 🎯 배포 프로세스

```
git push origin main
         ↓
    Render 감지
         ↓
프론트엔드 배포 (2-3분) ┐
                      ├→ 완료!
백엔드 배포 (10-15분)  ┘
```

### 배포 단계별 순서

1. **🔧 로컬에서 코드 수정**
   ```bash
   # 예: 레슨 데이터 수정
   vi packages/backend/prisma/content/javascript/lessons/js-4-2.json
   ```

2. **📝 커밋**
   ```bash
   git add .
   git commit -m "docs: js-4-2 레슨 개선"
   ```

3. **🚀 Push (배포 시작)**
   ```bash
   git push origin main  ← 이 순간 자동 배포 시작!
   ```

4. **🔄 Render 자동 처리**
   - GitHub Webhook 감지 (1초)
   - 프론트엔드 빌드 및 배포 (2-3분)
   - 백엔드 Docker 이미지 빌드 (5-10분)
   - 백엔드 배포 및 시드 실행 (3-5분)
     - Prisma migrate 실행
     - `npx prisma db seed` (JSON → DB)
     - 앱 시작

5. **✅ 완료**
   ```
   전체 소요 시간: 15-20분
   학생들이 바로 새 레슨을 볼 수 있음!
   ```

### 📊 배포 진행 상황 확인

```
Render Dashboard: https://dashboard.render.com
↓
Services 클릭
↓
codeinsight-backend (또는 frontend) 선택
↓
Deployments 탭 → 최신 배포 상태 확인
(Building/Deploying/Live)
```

### 📌 환경 변수 (Render Dashboard에서 관리)

**백엔드 환경 변수**:
- `DATABASE_URL`: Neon 연결 문자열
- `NODE_ENV`: production
- `OLLAMA_API_URL`: (로컬 개발용)

**프론트엔드 환경 변수**:
- `VITE_API_URL`: https://codeinsight-backend.onrender.com

⚠️ **중요**: `.env` 파일은 Git에 커밋하면 안됨!

### 🔙 롤백 (필요 시)

```
Render Dashboard
  → Services → codeinsight-backend
  → Deployments
  → 이전 배포 선택
  → Redeploy 클릭
```