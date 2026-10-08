# Git & Deployment

## Workflow
```bash
git pull origin main
# Make changes
git add <files>
git commit -m "type: brief description"
git push origin main
```

## Deployment
| 대상 | 플랫폼 | 방식 |
|------|--------|------|
| Frontend | Vercel (`codeinsight`) | `main` push → 자동 배포 (2~3분) |
| Backend | Fly.io (`codeinsight-backend`) | **수동**: 저장소 루트에서 `~/.fly/bin/flyctl deploy --remote-only -a codeinsight-backend` |

- 백엔드 배포 시 `release_command`가 `prisma migrate deploy && prisma db seed` 실행 → 실패하면 배포 중단 (DB 변경 전 단계에서 멈춤)
- 레슨 콘텐츠(JSON)만 바꿨어도 seed가 필요하므로 백엔드를 배포해야 반영됨

## Rollback
- Frontend: Vercel Dashboard → codeinsight → Deployments → 이전 배포 → Promote
- Backend: `flyctl releases -a codeinsight-backend` → `flyctl deploy --image <이전 이미지>`
