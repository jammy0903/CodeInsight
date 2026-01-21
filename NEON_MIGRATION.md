# 🚀 Neon Database Migration Guide

CodeInsight 프로젝트가 로컬 PostgreSQL에서 Neon (serverless Postgres)으로 성공적으로 마이그레이션되었습니다.

## 📋 목차
- [마이그레이션 개요](#마이그레이션-개요)
- [완료된 작업](#완료된-작업)
- [Neon 프로젝트 정보](#neon-프로젝트-정보)
- [로컬 PostgreSQL 관리](#로컬-postgresql-관리)
- [Neon 대시보드 사용법](#neon-대시보드-사용법)
- [개발 워크플로우](#개발-워크플로우)
- [문제 해결](#문제-해결)

---

## 마이그레이션 개요

### 변경 사항
- **이전**: 로컬 PostgreSQL (Docker 컨테이너, port 5433)
- **이후**: Neon serverless PostgreSQL (클라우드)

### 주요 장점
- ✅ 로컬 DB 서버 불필요
- ✅ 자동 백업 및 복구
- ✅ 무료 티어 제공 (0.5GB 스토리지)
- ✅ 빠른 connection pooling
- ✅ 팀 협업 용이

---

## 완료된 작업

### 1. 데이터베이스 마이그레이션
```bash
# 실행된 마이그레이션
✅ 20260115131512_init
✅ 20260117223932_add_analytics_models
✅ 20260118051406_add_user_streak
```

### 2. 삽입된 Seed 데이터
- **Languages**: 5개 (C, Python, Java, JavaScript, Python 실무)
- **Chapters**: 28개
- **Lessons**: 109개
- **Lesson Contents**: 109개
- **Quizzes**: 109개

### 3. 설정 변경

**`packages/backend/.env`**
```env
# Old (로컬)
# DATABASE_URL="postgresql://codeinsight:codeinsight123@localhost:5433/codeinsight"

# New (Neon)
DATABASE_URL="postgresql://neondb_owner:npg_n2V3WyUcbRpz@ep-ancient-sea-ahi4jsfx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

**`packages/backend/src/config/database.ts`**
- Neon과 로컬 PostgreSQL 모두 pg adapter 사용
- Prisma 7 구조에 맞게 업데이트

---

## Neon 프로젝트 정보

### 연결 정보
- **Project ID**: `young-tooth-86596723`
- **Project Name**: CodeInsight Database
- **Region**: US East (N. Virginia)
- **Endpoint**: `ep-ancient-sea-ahi4jsfx-pooler`
- **Database**: `neondb`
- **Owner**: `neondb_owner`

### Connection String
```bash
# Connection pooling (권장)
postgresql://neondb_owner:npg_n2V3WyUcbRpz@ep-ancient-sea-ahi4jsfx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

# Direct connection
postgresql://neondb_owner:npg_n2V3WyUcbRpz@ep-ancient-sea-ahi4jsfx.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## 로컬 PostgreSQL 관리

### Docker 컨테이너 중지
```bash
# PostgreSQL 컨테이너 중지
docker stop codeinsight-postgres

# 확인
docker ps | grep postgres
# (아무것도 출력되지 않으면 정상 중지됨)
```

### 다시 시작하고 싶다면
```bash
# 기존 컨테이너 시작
docker start codeinsight-postgres

# 또는 docker-compose 사용 (있다면)
docker-compose up -d postgres
```

### 완전히 제거하려면
```bash
# 컨테이너 제거
docker rm codeinsight-postgres

# 볼륨까지 제거 (데이터 삭제)
docker volume ls | grep codeinsight
docker volume rm <volume-name>
```

---

## Neon 대시보드 사용법

### 1. 대시보드 접속
1. https://console.neon.tech 접속
2. GitHub/Google 계정으로 로그인
3. `young-tooth-86596723` 프로젝트 선택

### 2. 데이터 확인하기

#### SQL Editor 사용
1. 왼쪽 메뉴에서 **SQL Editor** 클릭
2. 쿼리 실행:

```sql
-- 전체 테이블 목록
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 언어 목록 확인
SELECT id, name, description, "order"
FROM languages
ORDER BY "order";

-- 챕터 수 확인
SELECT l.name as language, COUNT(c.id) as chapter_count
FROM languages l
LEFT JOIN chapters c ON l.id = c.language_id
GROUP BY l.id, l.name
ORDER BY l."order";

-- 레슨 수 확인
SELECT
  l.name as language,
  COUNT(DISTINCT c.id) as chapters,
  COUNT(DISTINCT les.id) as lessons
FROM languages l
LEFT JOIN chapters c ON l.id = c.language_id
LEFT JOIN lessons les ON c.id = les.chapter_id
GROUP BY l.id, l.name
ORDER BY l."order";

-- 사용자 수 확인
SELECT COUNT(*) as user_count FROM users;
```

#### Tables 탭 사용
1. 왼쪽 메뉴에서 **Tables** 클릭
2. 테이블 선택 (예: `languages`)
3. **Rows** 탭에서 데이터 확인
4. **Schema** 탭에서 컬럼 구조 확인

### 3. 백업 및 복원

#### 자동 백업 (무료 플랜)
- Neon은 자동으로 7일간 백업 유지
- **Project Settings** > **Backups** 에서 확인

#### 수동 백업
```bash
# pg_dump로 백업
pg_dump "postgresql://neondb_owner:npg_n2V3WyUcbRpz@ep-ancient-sea-ahi4jsfx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require" > backup.sql

# 복원
psql "postgresql://..." < backup.sql
```

### 4. 브랜치 생성 (개발/테스트용)

Neon은 Git처럼 DB를 브랜치할 수 있습니다:

1. **Branches** 탭 클릭
2. **Create Branch** 버튼
3. 이름 입력 (예: `dev`, `test`)
4. 새 CONNECTION_STRING 받아서 `.env` 설정

```env
# 개발용 브랜치
DATABASE_URL="postgresql://...@ep-dev-branch..."
```

### 5. 모니터링

#### Dashboard 탭
- **Storage**: 사용 중인 스토리지
- **Compute**: CPU 사용량
- **Connections**: 활성 연결 수
- **Queries**: 실행된 쿼리 통계

#### Monitoring 탭
- CPU 사용률 그래프
- 메모리 사용률
- Active connections
- Query 실행 시간

---

## 개발 워크플로우

### 기본 개발
```bash
# 1. 백엔드 서버 시작 (자동으로 Neon 연결)
cd packages/backend
pnpm dev

# 2. 프론트엔드 시작
cd packages/frontend
pnpm dev
```

### Prisma 작업

#### 스키마 변경
```bash
# 1. schema.prisma 수정
nano packages/backend/prisma/schema.prisma

# 2. 마이그레이션 생성
cd packages/backend
npx prisma migrate dev --name <migration-name>

# 3. Prisma Client 재생성
npx prisma generate
```

#### Seed 데이터 다시 넣기
```bash
cd packages/backend

# 기존 데이터 삭제 후 재입력
npx prisma migrate reset

# 또는 seed만 다시 실행
pnpm seed
```

#### Prisma Studio (GUI)
```bash
cd packages/backend
npx prisma studio

# 브라우저에서 http://localhost:5555 열림
# GUI로 데이터 확인/수정 가능
```

### 프로덕션 배포
```bash
# 마이그레이션 적용 (downtime 없음)
npx prisma migrate deploy

# Prisma Client 생성
npx prisma generate
```

---

## 문제 해결

### 연결 오류

#### "getaddrinfo ENOTFOUND"
```bash
# DNS 문제 - 인터넷 연결 확인
ping ep-ancient-sea-ahi4jsfx-pooler.c-3.us-east-1.aws.neon.tech
```

#### "SASL: SCRAM-SERVER-FIRST-MESSAGE"
```bash
# 비밀번호 오류 - .env 파일 확인
cat packages/backend/.env | grep DATABASE_URL
```

#### "Connection timeout"
```bash
# 방화벽 문제 - 포트 5432 열려있는지 확인
# 또는 connection pooling URL 사용
```

### 마이그레이션 오류

#### "Migration already applied"
```bash
# 마이그레이션 상태 확인
npx prisma migrate status

# 강제 리셋 (개발 환경만!)
npx prisma migrate reset
```

#### "Schema drift detected"
```bash
# DB와 schema.prisma 동기화
npx prisma db pull  # DB -> schema.prisma
npx prisma db push  # schema.prisma -> DB (개발용)
```

### Prisma Client 오류

#### "PrismaClient is unable to be run in the browser"
```bash
# Prisma Client 재생성
npx prisma generate
```

#### "Cannot find module '.prisma/client'"
```bash
# node_modules 재설치
pnpm install
npx prisma generate
```

---

## 추가 리소스

### 공식 문서
- [Neon 공식 문서](https://neon.tech/docs)
- [Neon + Prisma 가이드](https://neon.tech/docs/guides/prisma)
- [Prisma 7 문서](https://www.prisma.io/docs)

### 유용한 명령어
```bash
# Neon CLI 설치
npm install -g neonctl

# 프로젝트 정보 확인
neonctl projects list
neonctl databases list --project-id young-tooth-86596723

# 브랜치 관리
neonctl branches list --project-id young-tooth-86596723
neonctl branches create --project-id young-tooth-86596723 --name dev
```

### 팀 협업
1. `.env` 파일은 Git에 커밋하지 않음 (이미 `.gitignore`에 추가됨)
2. `.env.example` 파일 업데이트하여 팀원에게 공유
3. Neon 대시보드에서 팀원 초대 가능

---

## 마이그레이션 완료 체크리스트

- [x] DATABASE_URL을 Neon으로 변경
- [x] Prisma 마이그레이션 실행
- [x] Seed 데이터 삽입
- [x] API 연결 테스트
- [x] 로컬 PostgreSQL 중지
- [x] 문서 작성
- [x] Git 커밋

---

**마이그레이션 완료일**: 2026-01-21
**담당자**: Claude Code (with jammyjamjam0903)
**Neon Project**: young-tooth-86596723
