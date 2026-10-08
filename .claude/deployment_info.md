# 배포 정보

2026-10-08부터 Render 대신 아래 구성으로 운영합니다.

| 구분 | 값 |
|------|-----|
| 프론트엔드 | Vercel 프로젝트 `codeinsight` (팀 jammy0903s-projects), root `packages/frontend` |
| 프론트 주소 | https://codeinsight-jammy0903s-projects.vercel.app (Vercel Authentication 꺼둠 = 공개) |
| 백엔드 | Fly.io 앱 `codeinsight-backend`, 리전 nrt, shared-cpu 1GB, 자동 정지 |
| 백엔드 주소 | https://codeinsight-backend.fly.dev |
| 데이터베이스 | Neon 프로젝트 `cosine` (us-east-1), role `neondb_owner` |
| Git | https://github.com/jammy0903/CodeInsight, 브랜치 `main` |

비밀값은 이 파일이나 저장소에 적지 않습니다. 각 플랫폼 대시보드/시크릿에서만 관리합니다.

## 프론트엔드 (자동)
`main`에 push → Vercel이 `packages/frontend/vercel.json` 설정으로 빌드·배포 (2~3분)

- 환경변수: `VITE_API_URL=https://codeinsight-backend.fly.dev`

## 백엔드 (수동)
```bash
# 저장소 루트에서
~/.fly/bin/flyctl deploy --remote-only -a codeinsight-backend
```
1. Fly 원격 빌더가 `packages/backend/Dockerfile`로 이미지 빌드
2. `release_command`: `npx prisma migrate deploy && npx prisma db seed` (실패 시 배포 중단)
3. 머신 교체, `/health` 헬스 체크

- 시크릿: `DATABASE_URL`, `CORS_ORIGINS` (`flyctl secrets list -a codeinsight-backend`)
- env(fly.toml): `PORT=3002`, `NODE_ENV=production`, `SKIP_MIGRATE=true` (콜드 스타트 시 migrate 생략)
- 레슨 JSON만 바꿔도 seed가 돌아야 반영되므로 백엔드 배포 필요

### 이미지 주의사항
- Node 22 이상 (JS 시뮬레이터가 global WebSocket 사용)
- 런타임 이미지에 `prisma.config.ts`, `src/utils` 포함 필요 (migrate·seed)

## 상태 확인
```bash
~/.fly/bin/flyctl status -a codeinsight-backend
~/.fly/bin/flyctl logs -a codeinsight-backend
```
프론트: Vercel Dashboard → codeinsight → Deployments

## 롤백
- 프론트: Vercel Dashboard → Deployments → 이전 배포 → Promote to Production
- 백엔드: `flyctl releases -a codeinsight-backend`로 이전 이미지 확인 → `flyctl deploy --image <image> -a codeinsight-backend`
