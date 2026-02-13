# Git & Deployment

## Workflow
```bash
git pull origin main
# Make changes
git add .
git commit -m "type: brief description"
git push origin main
```

## Automatic Deployment (Render)
- Push to main → Render detects → Auto-build
- Frontend: Static site (2-3 min)
- Backend: Docker (5-10 min) + `prisma migrate deploy` + `prisma db seed`

## Rollback
Render Dashboard → Services → codeinsight-backend → Deployments → Select previous → Redeploy
