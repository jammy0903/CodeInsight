# MCP Server 설정 가이드

> CodeInsight 프로젝트를 위한 Model Context Protocol 서버 설정 문서
>
> **작성일**: 2026-01-01
> **설정 파일**: `~/.claude.json`, `~/.bashrc`

---

## 📋 설치된 MCP 서버 목록 (총 22개)

### Phase 1 - MVP (7개)
| 이름 | 패키지 | 용도 |
|------|--------|------|
| desktop-commander | @wonderwhy-er/desktop-commander | 파일 시스템 + 터미널 제어 |
| github-go | github.com/github/github-mcp-server | GitHub API (Go 구현) |
| context7 | @upstash/context7-mcp | RAG 기반 실시간 문서 검색 |
| jupyter | jupyter-mcp-server | Jupyter 노트북 실행 |
| grafana | mcp-grafana | 모니터링 대시보드 |
| obsidian | obsidian-mcp-server | 노트 관리 |
| local-memory | local-memory-mcp | 로컬 메모리 저장 |

### Phase 2 - 개발 품질 (4개)
| 이름 | 패키지 | 용도 |
|------|--------|------|
| sentry | @sentry/mcp-server | 에러 트래킹 및 성능 모니터링 |
| sonarqube | oe-sonar-mcp | 코드 품질 분석 (버그, 취약점, 코드 스멜) |
| memento | @gannonh/memento-mcp | Neo4j 기반 장기 메모리 |
| neo4j | @johnymontana/neo4j-mcp | Neo4j 그래프 DB 직접 제어 |

### Phase 3 - 고급 도구 (2개)
| 이름 | 소스 | 용도 |
|------|------|------|
| lldb | github.com/benpm/claude_lldb_mcp | C/C++ 디버깅 (GDB 대안) |
| ghidra | github.com/LaurieWired/GhidraMCP | 바이너리 리버스 엔지니어링 |

### 기본 MCP (9개)
playwright, filesystem, memory, sequential-thinking, puppeteer, fetch, github (npm), win-cli, claude-in-chrome

---

## 🔑 API 키 설정

### 환경 변수 위치
모든 API 키는 `~/.bashrc`에 저장됨:

```bash
# === MCP Server API Keys ===

# GitHub Personal Access Token (실제 토큰으로 교체)
export GITHUB_TOKEN="github_pat_YOUR_TOKEN_HERE"

# Notion API Key (실제 토큰으로 교체)
export NOTION_API_KEY="ntn_YOUR_TOKEN_HERE"

# Sentry (에러 트래킹 - 선택사항)
# export SENTRY_AUTH_TOKEN="your_token"
# export SENTRY_ORG="your_org"
# export SENTRY_PROJECT="codeinsight"

# SonarQube/SonarCloud (코드 품질 - 선택사항)
# export SONAR_HOST_URL="https://sonarcloud.io"
# export SONAR_TOKEN="your_token"

# Grafana (모니터링 - 선택사항)
# export GRAFANA_URL="http://localhost:3000"
# export GRAFANA_API_KEY="your_key"

# Obsidian (노트 - 선택사항)
# export OBSIDIAN_API_KEY="your_key"
```

### API 키 발급 링크

| 서비스 | 발급 URL | 필수 여부 |
|--------|---------|----------|
| **GitHub** | https://github.com/settings/tokens | ✅ 필수 |
| **Notion** | https://www.notion.so/my-integrations | ✅ 필수 (문서 작업 시) |
| Brave Search | https://brave.com/search/api/ | ✅ 필수 (웹 검색 시) |
| Sentry | https://sentry.io/signup/ → https://sentry.io/settings/account/api/auth-tokens/ | 선택 |
| SonarCloud | https://sonarcloud.io/ → https://sonarcloud.io/account/security/ | 선택 |
| Grafana Cloud | https://grafana.com/auth/sign-up | 선택 |
| Obsidian | Obsidian 앱 + Local REST API 플러그인 | 선택 |

#### GitHub Token 권한 (Scopes)
토큰 생성 시 다음 권한 선택:
- ✅ `repo` - 저장소 전체 접근
- ✅ `read:org` - 조직 정보 읽기
- ✅ `workflow` - GitHub Actions
- ✅ `read:user` - 사용자 정보

---

## 🐳 Neo4j Docker 설정

### 컨테이너 실행
```bash
docker run -d \
  --name neo4j-codeinsight \
  -p 7474:7474 \
  -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/codeinsight123 \
  neo4j:latest
```

### 접속 정보
- **Browser UI**: http://localhost:7474
- **Bolt Protocol**: bolt://localhost:7687
- **Username**: `neo4j`
- **Password**: `codeinsight123`

### 자동 시작 설정 (선택)
```bash
docker update --restart unless-stopped neo4j-codeinsight
```

---

## 🛠️ 시스템 의존성

### LLDB 설치 (C/C++ 디버깅용)
```bash
sudo apt update
sudo apt install -y lldb

# 설치 확인
lldb --version
```

### Ghidra 설치 (바이너리 분석용)
1. **Ghidra 다운로드**: https://ghidra-sre.org/
2. **JDK 17+ 필요**: `sudo apt install openjdk-17-jdk`
3. **GhidraMCP 플러그인**:
   - Releases: https://github.com/LaurieWired/GhidraMCP/releases
   - Ghidra → File → Install Extensions → GhidraMCP-*.zip 선택
4. **플러그인 활성화**: File → Configure → Developer → GhidraMCPPlugin 체크

---

## 📁 MCP 설정 파일 구조

### ~/.claude.json
```json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "github-go": {
      "type": "stdio",
      "command": "/home/jammy/go/bin/github-mcp-server",
      "args": ["stdio"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "lldb": {
      "type": "stdio",
      "command": "/home/jammy/.local/bin/uvx",
      "args": ["--from", "/tmp/claude_lldb_mcp", "lldb-mcp"],
      "env": {}
    },
    "ghidra": {
      "type": "stdio",
      "command": "python3",
      "args": ["/tmp/GhidraMCP/bridge_mcp_ghidra.py", "--ghidra-server", "http://127.0.0.1:8080/"],
      "env": {}
    },
    "memento": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@gannonh/memento-mcp"],
      "env": {
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USER": "neo4j",
        "NEO4J_PASSWORD": "codeinsight123"
      }
    }
    // ... 다른 서버들
  }
}
```

---

## 🚀 빠른 시작 가이드

### 1. 환경 변수 적용
```bash
source ~/.bashrc
```

### 2. Neo4j 시작
```bash
docker start neo4j-codeinsight

# 또는 처음 실행
docker run -d --name neo4j-codeinsight -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/codeinsight123 neo4j:latest
```

### 3. Claude Code 재시작
```bash
# Claude Code 종료 후 다시 실행
```

### 4. MCP 서버 확인
```bash
# Claude Code CLI에서
claude mcp list
```

---

## 🧪 테스트 명령어

### GitHub MCP
```
"jammy0903/CodeInsight 저장소의 최근 커밋 보여줘"
"내 GitHub 저장소 목록 보여줘"
```

### Neo4j / Memento
```
"이 대화 내용을 Neo4j에 저장해줘"
"이전에 논의한 MCP 서버 설정을 기억해?"
```

### LLDB (C 코드가 있을 때)
```
"이 C 프로그램을 LLDB로 디버깅해줘"
"main 함수에 breakpoint 설정하고 변수 검사해줘"
```

---

## 📝 주의사항

### 보안
- ⚠️ API 키는 절대 Git에 커밋하지 마세요
- ✅ `~/.bashrc`는 로컬에만 보관
- ✅ `.gitignore`에 `.env`, `*.key` 추가 권장

### 성능
- Neo4j 컨테이너는 메모리를 많이 사용합니다 (기본 512MB~1GB)
- 사용하지 않을 때는 중지: `docker stop neo4j-codeinsight`

### 의존성
- LLDB는 C/C++ 디버깅 시에만 필요
- Ghidra는 바이너리 분석 시에만 필요
- 불필요한 서버는 `.claude.json`에서 주석 처리 가능

---

## 🔄 업데이트 방법

### npm 패키지 업데이트
```bash
# 자동으로 최신 버전 사용 (npx -y)
# 수동 업데이트 불필요
```

### Go 패키지 업데이트
```bash
go install github.com/github/github-mcp-server/cmd/github-mcp-server@latest
```

### Python 패키지 업데이트
```bash
# uvx는 매번 최신 버전 확인
# 수동 업데이트 불필요
```

---

## 📚 참고 자료

- **MCP 공식 문서**: https://modelcontextprotocol.io/
- **Claude Code 가이드**: https://docs.anthropic.com/claude/docs/claude-code
- **awesome-mcp-servers**: https://github.com/punkpeye/awesome-mcp-servers

---

**문서 작성**: Claude Code + jammy0903
**최종 수정**: 2026-01-01
