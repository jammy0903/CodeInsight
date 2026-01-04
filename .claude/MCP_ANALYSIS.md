# MCP 서버 실용성 분석

> CodeInsight 프로젝트에 정말 필요한 MCP는 무엇인가?

---

## 🔍 발견된 문제점

### ✅ 이미 설정되어 있지만 목록에 없던 것
- **fal.ai** - AI 이미지 생성 (CodeInsight 프로젝트 전용 설정)
- **mermaid-mcp** - Mermaid 다이어그램 생성
- **figma** - Figma 디자인 도구

### ❌ 필요하지만 누락된 것
1. **Brave Search API** - 웹 검색 (현재 WebSearch 사용 중, Brave가 더 나음)
2. **MS Office 문서 생성** - Excel, PowerPoint, Word 생성 MCP

---

## 📊 각 MCP 실용성 분석

### ❌ 불필요 (제거 추천)

#### 1. **jupyter** (Jupyter 노트북)
- **현재 역할**: Python 노트북 실행
- **CodeInsight에서 필요?**: ❌ **불필요**
- **이유**:
  - CodeInsight는 C 학습 플랫폼 (Python 노트북 사용 안 함)
  - 백엔드는 TypeScript (Python 환경 필요 없음)
  - 데이터 분석/ML 프로젝트 아님
- **판정**: **삭제 권장**

#### 2. **ghidra** (바이너리 리버스 엔지니어링)
- **현재 역할**: 바이너리 파일 분석 (어셈블리, 디컴파일)
- **CodeInsight에서 필요?**: ❌ **불필요**
- **이유**:
  - CodeInsight는 교육용 플랫폼 (보안 분석 도구 아님)
  - 사용자 제출 C 코드는 소스 코드로 처리
  - 바이너리 분석 기능 없음
  - Ghidra 설치도 복잡함 (Ghidra 11.0+ + JDK 17+ 필요)
- **판정**: **삭제 권장**

#### 3. **puppeteer** (브라우저 자동화)
- **현재 역할**: Chrome 자동화
- **CodeInsight에서 필요?**: ⚠️ **중복**
- **이유**:
  - `playwright`와 기능 중복 (둘 다 브라우저 자동화)
  - playwright가 더 강력 (Chromium/Firefox/WebKit 지원)
  - puppeteer는 Chrome만 지원
- **판정**: **playwright 하나만 사용 (puppeteer 삭제)**

#### 4. **obsidian** (노트 관리)
- **현재 역할**: Obsidian 마크다운 노트 읽기/쓰기
- **CodeInsight에서 필요?**: ❌ **불필요**
- **이유**:
  - 개인 노트 도구 (프로젝트와 무관)
  - 프로젝트 문서는 Git에서 관리
  - API 키 설정 추가 필요
- **판정**: **삭제 권장**

#### 5. **grafana** (모니터링 대시보드)
- **현재 역할**: 시스템 모니터링 대시보드
- **CodeInsight에서 필요?**: ⚠️ **프로덕션에서만**
- **이유**:
  - 개발 단계에서는 불필요
  - 프로덕션 배포 시 유용
  - Sentry로 대체 가능 (에러 + 성능)
- **판정**: **개발 중 삭제, 배포 시 추가**

---

### ✅ 필요 (유지)

#### 6. **sentry** vs **sonarqube** - 역할 다름!
**혼동하면 안 됨**: Ghidra와 전혀 다른 용도

- **sentry**: 런타임 에러 트래킹 (실행 중 발생한 에러)
  - 프로덕션에서 실제 사용자가 겪는 에러 추적
  - 성능 모니터링 (응답 시간, 느린 API)
  - 예: "사용자가 /api/memory/trace 호출 시 500 에러 발생"

- **sonarqube**: 정적 코드 분석 (코드 작성 시 분석)
  - 코드 품질 검사 (버그 가능성, 코드 스멜)
  - 보안 취약점 탐지 (SQL injection, XSS)
  - 예: "이 함수에 SQL injection 취약점이 있습니다"

- **ghidra**: 바이너리 리버스 엔지니어링
  - 컴파일된 실행 파일 분석
  - 어셈블리 코드 보기
  - CodeInsight와 무관!

**판정**:
- ✅ **sentry 유지** (런타임 에러 추적)
- ✅ **sonarqube 유지** (코드 품질)
- ❌ **ghidra 삭제** (불필요)

#### 7. **lldb** (C/C++ 디버거)
- **현재 역할**: C 코드 디버깅 (breakpoint, 메모리 검사)
- **CodeInsight에서 필요?**: ✅ **매우 유용**
- **이유**:
  - CodeInsight는 C 메모리 시각화 플랫폼
  - 사용자 제출 C 코드 디버깅 가능
  - Stack/Heap 메모리 상태 실시간 확인
  - **교육용으로 완벽**
- **판정**: **유지 필수 + LLDB 설치 권장**

#### 8. **neo4j** + **memento** (지식 그래프)
- **현재 역할**: 대화 내용을 그래프 DB에 저장
- **CodeInsight에서 필요?**: ✅ **유용**
- **이유**:
  - 사용자 학습 히스토리 저장 가능
  - "이전에 배운 포인터 개념 다시 설명해줘" 가능
  - Day 간 학습 연결성 추적
  - 개인화된 학습 경로 제공
- **Neo4j란?**:
  - 관계형 DB가 아닌 **그래프 DB**
  - 노드(개념)와 엣지(관계)로 데이터 저장
  - 예: `User --학습함--> Day1 --이해함--> 포인터`
- **판정**: **유지 (장기적으로 매우 유용)**

#### 9. **claude-in-chrome** (Chrome 확장)
- **현재 역할**: Chrome에서 Claude 사용
- **CodeInsight에서 필요?**: ✅ **유용**
- **이유**:
  - 웹 페이지 테스트 자동화
  - 브라우저 기반 E2E 테스트
  - UI 버그 재현
- **판정**: **유지**

---

## 🆕 추가 권장 MCP

### 1. Brave Search API ⭐ (높은 우선순위)
```bash
# 설치
npx -y brave/brave-search-mcp-server

# API 키: https://brave.com/search/api/
```

**왜 필요?**
- 현재 WebSearch는 제한적 (Claude 내장)
- Brave Search가 더 나은 결과
- 프라이버시 중심
- 무료 티어: 2,000 requests/month

**사용 예**:
- "C 메모리 관리 best practices 검색해줘"
- "최신 C23 표준 문서 찾아줘"

---

### 2. MS Office 문서 생성 ⭐⭐ (매우 높은 우선순위)

#### 옵션 A: **ms-365-mcp-server** (추천)
```bash
npx -y softeria/ms-365-mcp-server
```

**지원 기능**:
- ✅ Excel 생성/편집
- ✅ PowerPoint 생성
- ✅ Word 문서 생성
- ✅ Outlook 메일
- ✅ OneDrive 파일 관리

**API 키**: Microsoft Graph API
- https://portal.azure.com/
- 무료 (개인 Microsoft 계정)

#### 옵션 B: **excel-mcp-server** (Excel 전용)
```bash
uvx excel-mcp-server
```

**왜 필요?**
- **교육 콘텐츠 생성**:
  - 학습 통계 Excel 시트
  - 진도 리포트 자동 생성
  - 퀴즈 결과 분석
- **프레젠테이션**:
  - 프로젝트 발표 PPT 자동 생성
  - 아키텍처 다이어그램 슬라이드
- **문서화**:
  - API 문서 Word 생성
  - 사용자 매뉴얼

**판정**: **강력 추천 (특히 교육 플랫폼)**

---

### 3. Google Sheets MCP (선택)
```bash
npx -y google-sheets-mcp-server
```

**왜?**: MS Office 대신 Google Workspace 사용 시

---

## 📋 최종 권장 MCP 구성

### 🔴 즉시 삭제 (6개)
1. ❌ jupyter
2. ❌ ghidra
3. ❌ puppeteer (playwright 중복)
4. ❌ obsidian
5. ❌ grafana (개발 중)
6. ❌ local-memory (memory, memento 중복)

### 🟢 즉시 추가 (2개)
1. ✅ **brave-search-mcp** - 웹 검색
2. ✅ **ms-365-mcp-server** - Office 문서 생성

### ✅ 유지 (14개)
- playwright, filesystem, memory, sequential-thinking
- fetch, github, github-go, win-cli, claude-in-chrome
- desktop-commander, context7
- sentry, sonarqube
- memento, neo4j, lldb

---

## 📊 최적화 전후 비교

### 현재 (22개)
```
기본: 9개
Phase 1: 7개
Phase 2: 4개
Phase 3: 2개
```

### 최적화 후 (16개)
```
기본: 7개 (-2: puppeteer, win-cli 선택적 유지)
Phase 1: 4개 (-3: jupyter, obsidian, grafana, local-memory 삭제)
Phase 2: 4개 (유지)
Phase 3: 1개 (-1: ghidra 삭제)
신규 추가: 2개 (brave-search, ms-365)
```

**메모리/성능 개선**: 6개 제거로 약 27% 리소스 절약

---

## 🎯 CodeInsight에 최적화된 MCP 구성

### 핵심 개발 도구 (8개)
1. filesystem - 파일 관리
2. github / github-go - Git 작업
3. desktop-commander - 터미널
4. playwright - E2E 테스트
5. fetch - API 테스트
6. context7 - 문서 검색
7. brave-search - 웹 검색 ⭐ 신규
8. lldb - C 디버깅 ⭐ 핵심

### 품질/모니터링 (2개)
9. sentry - 에러 추적
10. sonarqube - 코드 품질

### 지식/메모리 (3개)
11. memory - 대화 메모리
12. memento - 장기 메모리
13. neo4j - 지식 그래프

### 문서/협업 (3개)
14. ms-365-mcp - Office 문서 ⭐ 신규
15. mermaid-mcp - 다이어그램
16. figma - 디자인

---

## 💡 권장 조치

### 1단계: 불필요한 MCP 제거
```bash
# .claude.json에서 삭제 (또는 주석 처리)
- jupyter
- ghidra
- puppeteer
- obsidian
- grafana
- local-memory
```

### 2단계: 필수 MCP 추가
```bash
# Brave Search
npm install -g @brave/brave-search-mcp-server

# MS Office
npm install -g @softeria/ms-365-mcp-server

# API 키 설정
export BRAVE_API_KEY="your_key"
export MS_GRAPH_CLIENT_ID="your_id"
export MS_GRAPH_CLIENT_SECRET="your_secret"
```

### 3단계: LLDB 설치 (핵심!)
```bash
sudo apt install lldb
```

---

**작성일**: 2026-01-01
**결론**: 22개 → 16개로 최적화 + 2개 필수 추가
