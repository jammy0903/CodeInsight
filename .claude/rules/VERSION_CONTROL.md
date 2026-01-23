# VERSION_CONTROL.md - C-OSINE 프로젝트 버전 관리 & 배포 가이드

---

## 🔐 민감 정보 관리 (비밀번호 & API 키)

**⚠️ 경고: 비밀번호 및 API 키와 같은 민감 정보는 절대로 Git 저장소에 직접 저장해서는 안 됩니다.**

대신 다음 방법을 사용하십시오:
*   **환경 변수:** `.env` 파일에 저장하고, `.gitignore`를 통해 Git 추적에서 제외합니다.
*   **시크릿 관리 도구:** 클라우드 서비스에서 제공하는 시크릿 관리 도구(예: AWS Secrets Manager, GCP Secret Manager)를 활용합니다.
*   **SSH 키:** 서버 접근 시에는 비밀번호 대신 SSH 키 방식을 사용합니다.

---

## 📍 서버 주소 정리 (예시)

| 서버 | 주소 | 용도 |
|------|------|------|
| **원격 프로덕션** | `[프로덕션 서버 IP/도메인]` | 실제 서비스 배포 |
| **원격 스테이징** | `[스테이징 서버 IP/도메인]` | 테스트/검증 환경 |
| **Git Remote** | `[Git 원격 저장소 주소]` | 코드 저장소 (예: GitHub, GitLab) |
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

## 2️⃣ 원격 서버 배포 (수동)

현재 프로젝트에는 자동화된 배포 스크립트가 없으므로, 수동으로 배포해야 합니다.

### 일반적인 수동 배포 절차
1.  **원격 서버 SSH 접속**
    ```bash
    ssh [사용자명]@[원격 서버 IP]
    ```
2.  **프로젝트 디렉토리로 이동**
    ```bash
    cd [원격 작업 경로]
    ```
3.  **최신 코드 가져오기**
    ```bash
    git pull origin main
    ```
4.  **의존성 설치**
    ```bash
    pnpm install
    ```
5.  **프로젝트 빌드**
    ```bash
    pnpm build
    ```
6.  **애플리케이션 재시작**
    - `pm2`, `systemd` 등 사용 중인 프로세스 매니저에 맞춰 재시작 명령을 실행합니다.
    ```bash
    # 예시: pm2 사용 시
    pm2 restart all 
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