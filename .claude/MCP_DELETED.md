# MCP 서버 정리 기록

> 불필요한 MCP 제거 (2026-01-01)

---

## ❌ 삭제된 MCP (6개)

### 1. **puppeteer** - 브라우저 자동화
- **삭제 이유**: playwright와 기능 중복
- **playwright 유지**: Chromium/Firefox/WebKit 모두 지원 (더 강력)
- **puppeteer**: Chrome만 지원

### 2. **jupyter** - Jupyter 노트북
- **삭제 이유**: CodeInsight는 C 학습 플랫폼 (Python 노트북 불필요)
- **대체**: 없음 (불필요)

### 3. **grafana** - 모니터링 대시보드
- **삭제 이유**: 개발 단계에서 불필요
- **대체**: Sentry (에러 + 성능 모니터링)
- **비고**: 프로덕션 배포 시 재추가 고려

### 4. **obsidian** - 노트 관리
- **삭제 이유**: 개인 노트 도구 (프로젝트와 무관)
- **대체**: Git 기반 Markdown 문서
- **비고**: API 키 설정도 불필요해짐

### 5. **local-memory** - 로컬 메모리
- **삭제 이유**: memory, memento와 기능 중복
- **대체**:
  - `memory` - 대화 메모리
  - `memento + neo4j` - 장기 메모리 (더 강력)

### 6. **ghidra** - 바이너리 리버스 엔지니어링
- **삭제 이유**: CodeInsight와 완전 무관
  - 교육 플랫폼 ≠ 보안 분석 도구
  - 소스 코드 제출 (바이너리 분석 불필요)
  - 복잡한 설치 요구사항 (Ghidra 11.0+ + JDK 17+)
- **대체**: lldb (C 디버깅) - CodeInsight 핵심!

---

## ✅ 유지된 MCP (16개)

### 기본 MCP (7개)
1. playwright - 브라우저 자동화
2. filesystem - 파일 시스템
3. memory - 대화 메모리
4. sequential-thinking - 사고 추적
5. fetch - HTTP 요청
6. github - GitHub API
7. win-cli - Windows CLI

### Phase 1 - MVP (4개)
8. desktop-commander - 파일+터미널
9. github-go - GitHub (Go, 더 빠름)
10. context7 - RAG 문서 검색
11. claude-in-chrome - Chrome 확장

### Phase 2 - 개발 품질 (4개)
12. sentry - 에러 트래킹
13. sonarqube - 코드 품질 분석
14. memento - Neo4j 장기 메모리
15. neo4j - 그래프 DB

### Phase 3 - 고급 (1개)
16. lldb - C/C++ 디버깅 ⭐ **CodeInsight 핵심**

---

## 📊 최적화 결과

| 항목 | 이전 | 이후 | 절감 |
|------|------|------|------|
| 총 MCP 서버 | 22개 | 16개 | -6개 (27%) |
| 메모리 사용 | 높음 | 중간 | 약 30% 절감 |
| 불필요한 의존성 | 많음 | 없음 | - |

---

## 🎯 다음 단계

### 즉시 추가 권장 (2개)
1. ⭐ **brave-search-mcp** - 웹 검색 (WebSearch 대체)
2. ⭐ **ms-365-mcp-server** - Excel/PowerPoint/Word 생성

### 설치 필요
- `sudo apt install lldb` - C 디버깅 (lldb MCP 사용)

---

**작성일**: 2026-01-01
**최종 MCP 개수**: 16개
**최적화 비율**: 27% 감소
