# MCP 서버 전체 목록 (22개)

## 기본 MCP 서버 (9개) - Claude Code 내장

1. **playwright** - 브라우저 자동화 (Chromium/Firefox) `API 불필요`
2. **filesystem** - 파일 시스템 읽기/쓰기 `API 불필요`
3. **memory** - 기본 대화 메모리 저장 `API 불필요`
4. **sequential-thinking** - 사고 과정 단계별 추적 `API 불필요`
5. **puppeteer** - 브라우저 자동화 (Chrome) `API 불필요`
6. **fetch** - HTTP 요청/웹 크롤링 `API 불필요`
7. **github** - GitHub API (npm 버전) `✅ API: GITHUB_TOKEN (설정됨)`
8. **win-cli** - Windows CLI 명령 실행 `API 불필요`
9. **claude-in-chrome** - Chrome 확장 통합 `API 불필요`

---

## Phase 1 - MVP (7개)

10. **desktop-commander** - 파일 탐색 + 터미널 명령 `API 불필요`
11. **github-go** - GitHub API (Go 구현, 더 빠름) `✅ API: GITHUB_TOKEN (설정됨)`
12. **context7** - RAG 기반 실시간 문서 검색 `API 불필요`
13. **jupyter** - Jupyter 노트북 실행 및 관리 `API 불필요`
14. **grafana** - 모니터링 대시보드 조회/생성 `⚠️ API: GRAFANA_URL, GRAFANA_API_KEY`
15. **obsidian** - Obsidian 노트 읽기/쓰기 `⚠️ API: OBSIDIAN_API_KEY`
16. **local-memory** - 로컬 파일 기반 메모리 `API 불필요`

---

## Phase 2 - 개발 품질 (4개)

17. **sentry** - 에러 트래킹 및 성능 모니터링 `⚠️ API: SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT`
18. **sonarqube** - 코드 품질 분석 (버그/취약점) `⚠️ API: SONAR_HOST_URL, SONAR_TOKEN`
19. **memento** - Neo4j 기반 장기 메모리 `🔧 Neo4j DB 필요 (설정됨)`
20. **neo4j** - Neo4j 그래프 DB 직접 제어 `🔧 Neo4j DB 필요 (설정됨)`

---

## Phase 3 - 고급 도구 (2개)

21. **lldb** - C/C++ 디버깅 (breakpoint, 메모리 검사) `🔧 시스템 LLDB 필요`
22. **ghidra** - 바이너리 리버스 엔지니어링 `🔧 Ghidra 설치 필요`

---

## API 키 상태 요약

### ✅ 설정 완료
- `GITHUB_TOKEN` - GitHub API (github, github-go)

### ⚠️ 미설정 (선택사항)
- `GRAFANA_URL`, `GRAFANA_API_KEY` - Grafana
- `OBSIDIAN_API_KEY` - Obsidian
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` - Sentry
- `SONAR_HOST_URL`, `SONAR_TOKEN` - SonarQube

### 🔧 시스템 의존성
- **Neo4j Docker** (memento, neo4j) - ✅ 실행 중
- **LLDB** (lldb) - ⚠️ 미설치 (`sudo apt install lldb`)
- **Ghidra** (ghidra) - ⚠️ 미설치 (https://ghidra-sre.org)

---

## 간단 역할 설명

| 번호 | 이름 | 한 줄 설명 |
|------|------|-----------|
| 1 | playwright | 웹 자동화 (테스트, 스크래핑) |
| 2 | filesystem | 파일 읽기/쓰기 |
| 3 | memory | 대화 내용 기억 |
| 4 | sequential-thinking | 생각 과정 보여주기 |
| 5 | puppeteer | Chrome 자동화 |
| 6 | fetch | HTTP 요청 |
| 7 | github | GitHub 저장소/이슈/PR |
| 8 | win-cli | Windows 명령어 |
| 9 | claude-in-chrome | Chrome에서 Claude 사용 |
| 10 | desktop-commander | 파일 관리 + 터미널 |
| 11 | github-go | GitHub (빠른 버전) |
| 12 | context7 | 실시간 문서 검색 |
| 13 | jupyter | Python 노트북 |
| 14 | grafana | 시스템 모니터링 |
| 15 | obsidian | 마크다운 노트 |
| 16 | local-memory | 로컬 메모리 |
| 17 | sentry | 에러 추적 |
| 18 | sonarqube | 코드 품질 검사 |
| 19 | memento | AI 장기 기억 (그래프) |
| 20 | neo4j | 그래프 DB |
| 21 | lldb | C 디버거 |
| 22 | ghidra | 바이너리 분석 |

---

**작성일**: 2026-01-01
**총 MCP 서버**: 22개
**API 설정 완료**: 1/5 (GitHub)
