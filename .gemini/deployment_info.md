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

### 커밋 & 배포

현재 프로젝트의 자동화된 배포 스크립트나 `docker-compose` 설정이 확인되지 않았습니다.
배포 프로세스를 여기에 문서화해야 합니다.

일반적인 워크플로우는 다음과 같을 수 있습니다:
1. 원격 서버에 SSH로 접속합니다.
2. `git pull`을 사용하여 최신 코드를 가져옵니다.
3. `pnpm install`로 의존성을 설치합니다.
4. `pnpm build`로 프로젝트를 빌드합니다.
5. `pm2`, `systemd` 등의 프로세스 매니저를 사용하여 애플리케이션을 재시작합니다.