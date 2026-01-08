# 새로 추가된 MCP API 키 발급 가이드

> Brave Search + MS Office MCP 사용을 위한 API 키 발급

---

## 🔑 발급해야 할 API 키

### 1. Brave Search API ⭐ (우선순위 높음)

#### 왜 필요한가?
- 웹 검색 기능 (Claude 내장 WebSearch보다 강력)
- 프라이버시 중심 검색
- 최신 정보 검색 (C 표준, 라이브러리, 튜토리얼 등)

#### 발급 링크
🔗 **https://brave.com/search/api/**

#### 발급 절차
1. 위 링크 접속
2. **"Get Started"** 또는 **"Sign Up"** 클릭
3. 이메일로 회원가입
4. **Dashboard** → **API Keys** 이동
5. **"Create API Key"** 클릭
6. API 키 복사

#### 무료 티어
- ✅ **2,000 요청/월** (무료)
- ✅ 신용카드 불필요
- ✅ Web Search, Image Search, News 지원

#### 환경변수 설정
```bash
# ~/.bashrc 편집
nano ~/.bashrc

# 아래 줄 찾아서 주석 해제하고 키 입력
export BRAVE_API_KEY="BSA_xxxxxxxxxxxxxxxxxxxxx"

# 적용
source ~/.bashrc
```

---

### 2. Microsoft 365 Graph API ⭐⭐ (매우 유용)

#### 왜 필요한가?
- **Excel** 생성: 학습 통계, 퀴즈 결과 분석
- **PowerPoint** 생성: 프로젝트 발표, 아키텍처 다이어그램
- **Word** 생성: API 문서, 사용자 매뉴얼
- **OneDrive**: 파일 자동 저장
- **Outlook**: 이메일 발송

#### 발급 링크
🔗 **https://portal.azure.com/**

#### 발급 절차 (상세)

##### Step 1: Azure Portal 접속
1. https://portal.azure.com/ 접속
2. Microsoft 계정으로 로그인 (개인 계정 OK)
3. **"Azure Active Directory"** 또는 **"Microsoft Entra ID"** 클릭

##### Step 2: 앱 등록
1. 왼쪽 메뉴에서 **"App registrations"** (앱 등록) 클릭
2. **"+ New registration"** (새 등록) 클릭
3. 앱 정보 입력:
   - **Name**: `CodeInsight MCP` (또는 원하는 이름)
   - **Supported account types**:
     - "Accounts in this organizational directory only" 선택
     - (개인 계정이면 "Personal Microsoft accounts only")
   - **Redirect URI**: 비워두기 (선택사항)
4. **"Register"** 클릭

##### Step 3: Client ID 복사
1. 앱 등록 완료 후 **"Overview"** 페이지
2. **"Application (client) ID"** 복사
   - 예: `12345678-1234-1234-1234-123456789abc`
   - → 이게 `MS_GRAPH_CLIENT_ID`

##### Step 4: Tenant ID 복사
1. 같은 **"Overview"** 페이지
2. **"Directory (tenant) ID"** 복사
   - 예: `87654321-4321-4321-4321-cba987654321`
   - → 이게 `MS_GRAPH_TENANT_ID`

##### Step 5: Client Secret 생성
1. 왼쪽 메뉴에서 **"Certificates & secrets"** 클릭
2. **"Client secrets"** 탭 선택
3. **"+ New client secret"** 클릭
4. 설정:
   - **Description**: `MCP Server Secret`
   - **Expires**: `24 months` (또는 원하는 기간)
5. **"Add"** 클릭
6. ⚠️ **즉시 Value 복사** (한 번만 보임!)
   - 예: `abc123def456~XYZ789`
   - → 이게 `MS_GRAPH_CLIENT_SECRET`

##### Step 6: API 권한 부여
1. 왼쪽 메뉴에서 **"API permissions"** 클릭
2. **"+ Add a permission"** 클릭
3. **"Microsoft Graph"** 선택
4. **"Delegated permissions"** 선택
5. 다음 권한 추가:
   - ✅ `Files.ReadWrite.All` - OneDrive 파일
   - ✅ `Mail.Send` - 이메일 발송
   - ✅ `offline_access` - 백그라운드 접근
   - ✅ `User.Read` - 사용자 정보
6. **"Add permissions"** 클릭
7. **"Grant admin consent for [Your Account]"** 클릭 (관리자 권한)

#### 환경변수 설정
```bash
# ~/.bashrc 편집
nano ~/.bashrc

# 아래 줄들 찾아서 주석 해제하고 키 입력
export MS_GRAPH_CLIENT_ID="12345678-1234-1234-1234-123456789abc"
export MS_GRAPH_CLIENT_SECRET="abc123def456~XYZ789"
export MS_GRAPH_TENANT_ID="87654321-4321-4321-4321-cba987654321"

# 적용
source ~/.bashrc
```

---

## 📝 빠른 설정 체크리스트

### Brave Search API
- [ ] https://brave.com/search/api/ 회원가입
- [ ] API 키 생성
- [ ] `~/.bashrc`에 `BRAVE_API_KEY` 추가
- [ ] `source ~/.bashrc` 실행

### Microsoft Graph API
- [ ] https://portal.azure.com/ 로그인
- [ ] 앱 등록 (CodeInsight MCP)
- [ ] Client ID 복사 → `MS_GRAPH_CLIENT_ID`
- [ ] Tenant ID 복사 → `MS_GRAPH_TENANT_ID`
- [ ] Client Secret 생성 → `MS_GRAPH_CLIENT_SECRET`
- [ ] API 권한 부여 (Files, Mail, User)
- [ ] `~/.bashrc`에 3개 변수 추가
- [ ] `source ~/.bashrc` 실행

---

## 🧪 테스트 방법

### Brave Search 테스트
```
Claude Code 재시작 후:
"Brave Search로 'C memory management best practices' 검색해줘"
```

### MS Office 테스트
```
Claude Code 재시작 후:
"Excel 파일 만들어줘: Day별 학습 진도 표"
"PowerPoint 만들어줘: CodeInsight 프로젝트 소개"
```

---

## 🔒 보안 주의사항

### Client Secret 관리
- ⚠️ **절대 Git에 커밋하지 마세요**
- ⚠️ **한 번만 보이므로 안전한 곳에 백업**
- ⚠️ **만료되면 새로 생성**

### API 키 유출 시
1. Azure Portal → App registrations
2. 해당 앱 선택 → Certificates & secrets
3. 유출된 Secret 삭제
4. 새 Secret 생성

---

## 💡 대체 옵션

### Brave Search 대신
- **Google Custom Search API**: https://developers.google.com/custom-search
- **Bing Search API**: https://www.microsoft.com/en-us/bing/apis/bing-web-search-api
- (하지만 Brave가 프라이버시 측면에서 최고)

### MS Office 대신
- **Google Sheets API**: 무료, 더 쉬움
  - https://developers.google.com/sheets/api
- **LibreOffice 로컬**: API 없이 사용 가능
  - 하지만 MCP 연동 제한적

---

## 📚 참고 문서

- **Brave Search API Docs**: https://brave.com/search/api/docs/
- **Microsoft Graph API Docs**: https://learn.microsoft.com/en-us/graph/
- **Azure App Registration**: https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app

---

**작성일**: 2026-01-01
**필요한 API 키**: 2개 (Brave + MS Graph 3개 값)
