# E2E Testing & Profiling

CodeInsight의 **End-to-End 테스트**와 **프로파일링** 도구 모음입니다.

## 📁 구조

```
e2e/
├── profile.sh              # 메인 프로파일링 스크립트
├── README.md               # 이 파일
├── performance/            # 성능 테스트
│   ├── api-bench.js       # API 벤치마크
│   └── memory-test.js     # 메모리 테스트
└── scripts/
    └── cleanup.sh         # 로그 정리
```

## 🚀 빠른 시작

### 1. 필수 도구 설치

```bash
# 전역 도구 설치
npm install -g clinic autocannon

# 백엔드 개발 의존성 설치
cd backend
npm install --save-dev heapdump
```

### 2. 프로파일링 실행

```bash
# 먼저 개발 서버 실행
./start-dev.sh

# API 응답 시간 측정
./e2e/profile.sh api /api/courses

# CPU/메모리 프로파일링
./e2e/profile.sh clinic doctor

# React Profiler 분석
./e2e/profile.sh react ~/Downloads/profiler-data.json

# 프론트엔드 번들 분석
./e2e/profile.sh front
```

## 📊 프로파일링 종류

### 1️⃣ API 프로파일링

**간단한 응답 시간 측정**

```bash
./e2e/profile.sh api /api/courses/languages
./e2e/profile.sh api /api/c/run
```

**결과:**
- 10회 API 호출 평균 응답 시간
- 로그: `/tmp/codeinsight-profile/api_profile_*.txt`

---

### 2️⃣ Clinic.js 프로파일링

**CPU, 메모리, 이벤트 루프 병목 찾기**

```bash
# Doctor: 전체 진단 (추천)
./e2e/profile.sh clinic doctor

# Flame: CPU 프로파일 (함수별 시간)
./e2e/profile.sh clinic flame

# Bubbleprof: 비동기 작업 흐름
./e2e/profile.sh clinic bubbleprof
```

**사용법:**
1. 명령 실행
2. API를 여러 번 호출 (브라우저 또는 curl)
3. `Ctrl+C`로 종료
4. 자동으로 브라우저에서 결과 HTML 열림 (WSL 연동)

**결과:**
- 인터랙티브 HTML 보고서
- 위치: `backend/.clinic/*.html`

---

### 3️⃣ 메모리 힙 덤프

**메모리 누수 확인**

```bash
./e2e/profile.sh heap
```

**결과:**
- Heapsnapshot 파일 생성
- Chrome DevTools로 열기:
  1. Chrome → DevTools (F12)
  2. Memory 탭 → Load
  3. `.heapsnapshot` 파일 선택

---

### 4️⃣ 프론트엔드 번들 분석

**Vite 빌드 결과 분석**

```bash
./e2e/profile.sh front
```

**결과:**
- 번들 크기 리포트
- 자동으로 `stats.html` 생성 (브라우저에서 열림)

---

### 5️⃣ React Profiler 분석

**컴포넌트 리렌더링 병목 찾기**

#### Step 1: React DevTools에서 프로파일 녹화

1. Chrome에서 CodeInsight 열기
2. React DevTools → **Profiler** 탭
3. 🔴 녹화 시작
4. 앱 사용 (레슨 이동, 코드 실행 등)
5. ⏹️ 녹화 중지
6. ⬇️ **Export** 버튼 클릭 → JSON 다운로드

#### Step 2: Speedscope로 시각화

```bash
./e2e/profile.sh react ~/Downloads/profiler-data.json
```

**결과:**
- 컴포넌트별 리렌더 횟수 (Top 10)
- Suspense 로딩 시간
- Speedscope 브라우저 자동 열림 (WSL 연동)

**경고 신호:**
- 특정 컴포넌트가 20회 이상 리렌더 → 최적화 필요
- 200ms 이하 간격으로 리렌더 → useMemo/useCallback 추가

---

### 6️⃣ API 벤치마크

**부하 테스트 (autocannon)**

```bash
# 기본: 10초, 10개 동시 연결
./e2e/profile.sh bench /api/courses

# 커스텀 엔드포인트
./e2e/profile.sh bench /api/c/run
```

**결과:**
- 평균/최소/최대 지연 시간
- 초당 요청 수 (RPS)
- 에러율

---

### 7️⃣ 로그 정리

```bash
./e2e/profile.sh clean
```

로그 디렉토리: `/tmp/codeinsight-profile/`

## 🔧 WSL 환경 특이사항

### 브라우저 자동 열기

스크립트가 자동으로 Windows 브라우저를 엽니다:

1. `wslview` (우선)
2. `cmd.exe /c start` (백업)

### 파일 경로

- WSL: `/home/jammy/...`
- Windows: `/mnt/c/Users/...`
- React Profiler JSON은 양쪽 경로 모두 지원

### 포트

- Backend: `http://localhost:3002`
- Frontend: `http://localhost:5174`
- Speedscope: `http://localhost:9999`

WSL2는 localhost를 자동으로 Windows와 공유합니다.

## 📝 성능 최적화 체크리스트

### Backend (Node.js + Express)

- [ ] API 응답 시간 < 100ms
- [ ] Clinic Doctor에서 경고 없음
- [ ] 메모리 누수 없음 (힙 덤프 확인)
- [ ] CPU 사용률 < 70%

### Frontend (React + Vite)

- [ ] 번들 크기 < 500KB (gzipped)
- [ ] React 컴포넌트 리렌더 < 20회/컴포넌트
- [ ] Suspense 로딩 < 500ms
- [ ] Lighthouse 점수 > 90

## 🛠️ 트러블슈팅

### "백엔드가 실행 중이 아닙니다"

```bash
# 개발 서버 시작
./start-dev.sh
```

### "clinic이 설치되지 않았습니다"

```bash
npm install -g clinic
```

### "브라우저가 안 열려요"

수동으로 열기:
```bash
# Speedscope
http://localhost:9999

# Clinic.js HTML
# 터미널에 출력된 파일 경로를 복사해서 브라우저에서 열기
```

### "heapdump 모듈 오류"

```bash
cd backend
npm install --save-dev heapdump
```

## 📚 참고 자료

- [Clinic.js 문서](https://clinicjs.org/)
- [Speedscope](https://www.speedscope.app/)
- [React Profiler API](https://react.dev/reference/react/Profiler)
- [autocannon](https://github.com/mcollina/autocannon)

## 🎯 다음 단계

1. **성능 벤치마크 기록** - 각 버전별 성능 비교
2. **CI/CD 통합** - GitHub Actions에서 자동 프로파일링
3. **성능 회귀 테스트** - 성능 저하 감지
