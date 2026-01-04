# API Keys 관리 가이드

> **⚠️ 보안 경고**: 이 파일은 API 키 발급 방법만 안내합니다. 실제 키 값은 `~/.bashrc`에만 저장됩니다.

---

## 📋 현재 설정된 API 키

### ✅ GitHub Personal Access Token
- **환경변수**: `GITHUB_TOKEN`
- **현재 값**: `github_pat_11BCOF22Q0...` (설정 완료)
- **위치**: `~/.bashrc` line 107
- **발급일**: 2026-01-01
- **만료**: 확인 필요

---

## 🔑 API 키 발급 가이드

### 1. GitHub Personal Access Token (필수)

#### 발급 링크
https://github.com/settings/tokens

#### 발급 절차
1. 위 링크 접속
2. **"Generate new token"** 클릭
3. **"Generate new token (classic)"** 선택
4. 토큰 설정:
   - **Note**: `Claude Code MCP` (또는 원하는 이름)
   - **Expiration**: `No expiration` (또는 원하는 기간)
   - **Select scopes**:
     - ✅ `repo` - Full control of private repositories
     - ✅ `workflow` - Update GitHub Action workflows
     - ✅ `read:org` - Read org and team membership
     - ✅ `read:user` - Read user profile data
     - ✅ `user:email` - Access user email addresses
5. **"Generate token"** 클릭
6. 토큰 복사 (⚠️ 한 번만 보입니다!)

#### 환경변수 설정
```bash
# ~/.bashrc에 추가
export GITHUB_TOKEN="ghp_your_token_here"

# 적용
source ~/.bashrc
```

#### 토큰 확인
```bash
# 토큰이 설정되었는지 확인
echo ${GITHUB_TOKEN:0:20}...
```

---

### 2. Sentry (에러 트래킹) - 선택사항

#### 가입 링크
https://sentry.io/signup/

#### 토큰 발급
1. 가입 후 로그인
2. https://sentry.io/settings/account/api/auth-tokens/ 접속
3. **"Create New Token"** 클릭
4. **Scopes** 선택:
   - ✅ `project:read`
   - ✅ `project:write`
   - ✅ `event:read`
   - ✅ `event:write`
5. 토큰 생성 및 복사

#### 프로젝트 설정
1. Organization 생성 (예: `jammy0903`)
2. Project 생성 (예: `codeinsight`)
3. Organization과 Project 이름 확인

#### 환경변수 설정
```bash
# ~/.bashrc에 추가
export SENTRY_AUTH_TOKEN="sntrys_xxxxxxxxxx"
export SENTRY_ORG="jammy0903"
export SENTRY_PROJECT="codeinsight"

# 적용
source ~/.bashrc
```

---

### 3. SonarQube / SonarCloud (코드 품질) - 선택사항

#### 옵션 A: SonarCloud (추천 - 클라우드)

##### 가입 링크
https://sonarcloud.io/

##### 토큰 발급
1. GitHub 계정으로 로그인
2. https://sonarcloud.io/account/security/ 접속
3. **"Generate Token"** 클릭
4. Token name: `Claude Code MCP`
5. 토큰 복사

##### Organization 설정
1. **"+"** → **"Analyze new project"**
2. GitHub 저장소 연동
3. Organization key 확인 (예: `jammy0903`)

##### 환경변수 설정
```bash
# ~/.bashrc에 추가
export SONAR_HOST_URL="https://sonarcloud.io"
export SONAR_TOKEN="squ_xxxxxxxxxx"

# 적용
source ~/.bashrc
```

#### 옵션 B: SonarQube (로컬)

##### Docker로 설치
```bash
docker run -d \
  --name sonarqube \
  -p 9000:9000 \
  sonarqube:lts-community

# 브라우저에서 접속
# http://localhost:9000
# 기본 로그인: admin / admin
```

##### 토큰 발급
1. http://localhost:9000 접속
2. 로그인 후 **User** → **My Account** → **Security**
3. **Generate Token** 클릭

##### 환경변수 설정
```bash
# ~/.bashrc에 추가
export SONAR_HOST_URL="http://localhost:9000"
export SONAR_TOKEN="squ_xxxxxxxxxx"

# 적용
source ~/.bashrc
```

---

### 4. Grafana (모니터링) - 선택사항

#### 옵션 A: Grafana Cloud (추천)

##### 가입 링크
https://grafana.com/auth/sign-up

##### API 키 발급
1. 가입 후 로그인
2. **Configuration** → **API Keys**
3. **Add API key** 클릭
4. Role: **Editor** 또는 **Admin**
5. 키 생성 및 복사

##### 환경변수 설정
```bash
# ~/.bashrc에 추가
export GRAFANA_URL="https://your-org.grafana.net"
export GRAFANA_API_KEY="eyJrIjoixxxxxxxxxx"

# 적용
source ~/.bashrc
```

#### 옵션 B: Grafana (로컬)

##### Docker로 설치
```bash
docker run -d \
  --name grafana \
  -p 3000:3000 \
  grafana/grafana

# 브라우저에서 접속
# http://localhost:3000
# 기본 로그인: admin / admin
```

##### API 키 발급
1. http://localhost:3000 접속
2. **Configuration** → **API Keys**
3. **Add API key** 클릭

##### 환경변수 설정
```bash
# ~/.bashrc에 추가
export GRAFANA_URL="http://localhost:3000"
export GRAFANA_API_KEY="eyJrIjoixxxxxxxxxx"

# 적용
source ~/.bashrc
```

---

### 5. Obsidian (노트) - 선택사항

#### Obsidian 설치
https://obsidian.md/download

#### Local REST API 플러그인
1. Obsidian 실행
2. **Settings** → **Community plugins**
3. **Browse** → "Local REST API" 검색
4. 설치 및 활성화

#### API 키 생성
1. **Settings** → **Local REST API**
2. **API Key** 섹션에서 키 생성
3. 키 복사

#### 환경변수 설정
```bash
# ~/.bashrc에 추가
export OBSIDIAN_API_KEY="your-api-key-here"

# 적용
source ~/.bashrc
```

---

## 🔒 보안 Best Practices

### ✅ DO (해야 할 것)
- API 키는 `~/.bashrc`에만 저장
- `.gitignore`에 `.env`, `*.key` 추가
- 토큰에 최소 권한만 부여 (Principle of Least Privilege)
- 정기적으로 토큰 갱신 (특히 만료 설정된 경우)
- 사용하지 않는 토큰은 즉시 삭제

### ❌ DON'T (하지 말아야 할 것)
- Git에 API 키 커밋 금지
- 코드에 하드코딩 금지
- 공개 채널에 키 공유 금지
- 브라우저 개발자 도구에 키 노출 금지
- 스크린샷/화면공유 시 키 노출 주의

### 🔍 키 유출 시 대응
1. **즉시 토큰 삭제**:
   - GitHub: https://github.com/settings/tokens
   - Sentry: https://sentry.io/settings/account/api/auth-tokens/
   - SonarCloud: https://sonarcloud.io/account/security/
2. **새 토큰 발급**
3. **환경변수 업데이트**
4. **영향 범위 확인** (로그 점검)

---

## 📝 환경변수 체크리스트

### 필수
- [ ] `GITHUB_TOKEN` - GitHub API 접근

### 선택사항 (필요시 설정)
- [ ] `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` - 에러 트래킹
- [ ] `SONAR_HOST_URL`, `SONAR_TOKEN` - 코드 품질 분석
- [ ] `GRAFANA_URL`, `GRAFANA_API_KEY` - 모니터링
- [ ] `OBSIDIAN_API_KEY` - 노트 관리

### 확인 방법
```bash
# 모든 MCP 관련 환경변수 확인
env | grep -E "GITHUB|SENTRY|SONAR|GRAFANA|OBSIDIAN"
```

---

## 🔄 토큰 갱신 가이드

### GitHub Token 갱신
1. 기존 토큰 삭제: https://github.com/settings/tokens
2. 새 토큰 생성 (위 발급 절차 참고)
3. `~/.bashrc`에서 `GITHUB_TOKEN` 값 업데이트
4. `source ~/.bashrc` 실행

### 다른 서비스도 동일
1. 해당 서비스에서 토큰 삭제
2. 새 토큰 생성
3. 환경변수 업데이트
4. Claude Code 재시작

---

## 📚 참고 링크

- **GitHub Tokens**: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
- **Sentry Docs**: https://docs.sentry.io/api/auth/
- **SonarCloud Docs**: https://docs.sonarcloud.io/advanced-setup/authentication/
- **Grafana API**: https://grafana.com/docs/grafana/latest/administration/api-keys/

---

**최종 수정**: 2026-01-01
**작성자**: jammy0903
