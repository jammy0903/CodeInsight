# MCP 서버 빠른 시작 가이드

> CodeInsight 프로젝트 MCP 설정 5분 완성

---

## ✅ 설치 완료 확인

총 **22개** MCP 서버 설치 완료:
- Phase 1 (MVP): 7개
- Phase 2 (개발 품질): 4개
- Phase 3 (고급): 2개
- 기본 MCP: 9개

---

## 🚀 즉시 사용하기

### 1단계: 환경변수 적용
```bash
source ~/.bashrc
```

### 2단계: Neo4j 시작 (메모리 기능용)
```bash
docker start neo4j-codeinsight
```

### 3단계: Claude Code 재시작
```bash
# Claude Code 종료 후 다시 실행
```

**끝!** 이제 모든 MCP 서버를 사용할 수 있습니다.

---

## 🧪 빠른 테스트

### GitHub 연동 테스트
```
"jammy0903/CodeInsight 저장소 정보 보여줘"
```

### 메모리 테스트
```
"이 대화 내용 기억해줘: MCP 서버 22개 설치 완료"
"아까 설치한 MCP 서버 개수가 뭐였지?"
```

---

## 📁 상세 문서 위치

- **MCP 설정 전체**: `.claude/MCP_SETUP.md`
- **API 키 관리**: `.claude/API_KEYS.md`
- **프로젝트 가이드**: `.claude/CLAUDE.md`

---

## 🔧 선택사항 (나중에 설정)

### LLDB 설치 (C 디버깅)
```bash
sudo apt install lldb
```

### 추가 API 키
- Sentry: https://sentry.io/signup/
- SonarCloud: https://sonarcloud.io/

---

**설정 완료일**: 2026-01-01
