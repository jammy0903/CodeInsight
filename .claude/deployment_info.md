### 핵심 정보

| 구분 | 값 |
|------|-----|
| 로컬 경로 | `/home/jammy/projects/cosine/CodeInsight` |
| 프론트엔드 배포 | Vercel (https://codeinsight.vercel.app) |
| 백엔드 배포 | Render (Docker) |
| 데이터베이스 | Neon PostgreSQL |
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

### 자동 배포 워크플로우

**Git Push → 자동 배포**

1. **코드 변경 및 커밋**
   ```bash
   git add .
   git commit -m "feat: 새로운 기능 추가"
   git push origin main
   ```

2. **자동 배포 트리거**
   - **프론트엔드**: Vercel이 자동으로 빌드 및 배포
   - **백엔드**: Render가 Docker 이미지 빌드 및 배포 (10-15분 소요)

3. **헬스체크**
   - GitHub Actions가 2분 후 `/health` 엔드포인트 확인
   - 5분간 20회 재시도 (15초 간격)

4. **롤백 (필요 시)**
   - Render Dashboard → Services → Events → "Rollback" 버튼 클릭