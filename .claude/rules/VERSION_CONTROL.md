# VERSION_CONTROL.md - C-OSINE 프로젝트 버전 관리 & 배포 가이드

---

## 🔐 민감 정보 관리 (비밀번호 & API 키)

**⚠️ 경고: 비밀번호 및 API 키와 같은 민감 정보는 절대로 Git 저장소에 직접 저장해서는 안 됩니다.**

대신 다음 방법을 사용하십시오:
*   **환경 변수:** `.env` 파일에 저장하고, `.gitignore`를 통해 Git 추적에서 제외합니다.
*   **시크릿 관리 도구:** 클라우드 서비스에서 제공하는 시크릿 관리 도구(예: AWS Secrets Manager, GCP Secret Manager)를 활용합니다.
*   **SSH 키:** 서버 접근 시에는 비밀번호 대신 SSH 키 방식을 사용합니다.

---

## 📍 서버 주소 정리

| 서버 | 주소 | 용도 |
|------|------|------|
| **프론트엔드 배포** | https://codeinsight-frontend.onrender.com | Render |
| **백엔드 배포** | https://codeinsight-backend.onrender.com | Render (Docker) |
| **데이터베이스** | Neon PostgreSQL (ep-**.us-east-1.aws.neon.tech) | 프로덕션 DB |
| **Git Remote** | https://github.com/jammy0903/CodeInsight | GitHub |
| **로컬 작업 디렉토리** | `/home/jammy/projects/C-OSINE` | 개발 환경 |

---

## 1️⃣ Git 사용법 (주 버전 관리) ⭐

### 기본 워크플로우
```
git pull origin [main 브랜치명]
코드 수정
git add .
git commit -m "feat: 기능 추가 메시지"
git push origin [자신의 브랜치명]
```

### 자주 쓰는 명령어
```bash
# 상태 확인
git status
git diff
git log --oneline -5

# 스테이징 & 커밋
git add .
git commit -m "feat: [기능] 짧은 설명"
git commit -m "fix: [버그] 짧은 설명"

# 원격 동기화
git push origin [브랜치명]
git pull origin [브랜치명]
```

---

## 2️⃣ 자동 배포 (Render)

### 🚀 배포 방식: Git Push → 자동 배포

우리는 **Render만 사용**합니다. 다른 배포 플랫폼은 사용하지 않습니다.

### 배포 프로세스

```bash
# 1️⃣ 로컬에서 코드 수정
vi packages/backend/prisma/content/javascript/lessons/js-4-2.json

# 2️⃣ 커밋
git add .
git commit -m "docs: js-4-2 레슨 개선"

# 3️⃣ Push (배포 자동 시작!)
git push origin main
```

### 배포 흐름

| 단계 | 소요 시간 | 자동 실행 내용 |
|------|---------|--------------|
| 1 | 1초 | GitHub Webhook → Render 감지 |
| 2 | 2-3분 | 프론트엔드 빌드 및 배포 |
| 3 | 5-10분 | 백엔드 Docker 이미지 빌드 |
| 4 | 2-3분 | `prisma migrate` + `prisma db seed` + 앱 시작 |
| **전체** | **10-20분** | **완료!** ✅ |

### 배포 상태 확인

```
1. Render Dashboard: https://dashboard.render.com
2. Services 클릭
3. codeinsight-backend (또는 frontend) 선택
4. Deployments 탭에서 상태 확인 (Building → Deploying → Live)
```

### 시드 데이터 자동 동기화

배포 시 자동으로 실행됨 (`packages/backend/Dockerfile`):

```bash
# 1. 스키마 변경 적용
npx prisma migrate deploy

# 2. JSON 파일 → DB에 데이터 삽입
npx prisma db seed

# 3. 앱 시작
node dist/app.js
```

**= 레슨 JSON 파일만 수정 후 push하면, 자동으로 DB에 반영됨!**

### 🔙 롤백 (필요 시)

```
Render Dashboard
  → Services → codeinsight-backend
  → Deployments 탭
  → 이전 배포 선택
  → Redeploy 버튼 클릭
```

---

## 📋 체크리스트

### 커밋 전
- [ ] `git status`로 변경사항 확인
- [ ] 불필요한 파일 커밋 안 하는지 확인 (node_modules, dist 등)

### 배포 전
- [ ] 로컬에서 테스트 완료
- [ ] 프론트엔드 수정 시 → `pnpm build` 실행 확인

### 배포 후
- [ ] 브라우저 하드 리프레시 (Ctrl+Shift+R)
- [ ] 기능 동작 확인