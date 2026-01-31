# CodeInsight 일일 할 일

**날짜**: 2026-02-01
**우선순위**: 높음
**마감일**: 진행 중

---

## ✅ 완료 (2026-02-01)

### Python 레슨 실행 순서 설명 추가 완료
- [x] **py-2 시리즈** (5개 파일): 변수와 데이터 타입
- [x] **py-3 시리즈** (6개 파일): 제어문 (if, for, while)
- [x] **py-4 시리즈** (5개 파일): 함수와 스코프
- [x] **py-5 시리즈** (4개 파일): OOP 기초
- [x] **py-6 시리즈** (6개 파일): OOP 심화
  - py-6-1: 클래스 정의 (7 steps)
  - py-6-2: __init__과 self (8 steps)
  - py-6-3: 인스턴스 변수 독립성 (16 steps)
  - py-6-4: 클래스 변수 공유 함정 (13 steps)
  - py-6-5: 메서드 바인딩 (12 steps)
  - py-6-6: 상속 기초 (15 steps)

**총 완료**: py-2 ~ py-6 시리즈 (26개 파일)

---

## 🔴 긴급 (오늘 진행 중)

### Python 레슨 실행 순서 설명 추가

**작업 내용**: 각 step에 다음 항목 추가
- `visualizationType: "pythonMemory"`
- `pythonMemoryState` (variables, output, note)
- "왜 이 순서인가?" 설명
- "실행 순서: ..." 상세 흐름
- 객체 ID 추적 (0x1000, 0x2000, etc.)

---

## 🟡 다음 작업 (py-7부터)

### 📚 py-7 시리즈 (4개 파일)
- [ ] **py-7-1.json**: (주제 미확인)
  - 파일 읽어서 내용 확인 필요
  - 예상 작업 시간: 30분

- [ ] **py-7-2.json**: (주제 미확인)
  - 파일 읽어서 내용 확인 필요
  - 예상 작업 시간: 30분

- [ ] **py-7-3.json**: (주제 미확인)
  - 파일 읽어서 내용 확인 필요
  - 예상 작업 시간: 30분

- [ ] **py-7-4.json**: (주제 미확인)
  - 파일 읽어서 내용 확인 필요
  - 예상 작업 시간: 30분

**py-7 시리즈 예상 총 시간**: 2시간

---

### 📚 py-8 시리즈 (4개 파일)
- [ ] **py-8-1.json**
- [ ] **py-8-2.json**
- [ ] **py-8-3.json**
- [ ] **py-8-4.json**

**py-8 시리즈 예상 총 시간**: 2시간

---

### 📚 py-9 시리즈 (4개 파일)
- [ ] **py-9-1.json**
- [ ] **py-9-2.json**
- [ ] **py-9-3.json**
- [ ] **py-9-4.json**

**py-9 시리즈 예상 총 시간**: 2시간

---

### 📚 py-10 시리즈 (4개 파일)
- [ ] **py-10-1.json**
- [ ] **py-10-2.json**
- [ ] **py-10-3.json**
- [ ] **py-10-4.json**

**py-10 시리즈 예상 총 시간**: 2시간

---

## 📊 전체 진행 상황

### Python 레슨 파일
```
완료: py-2 ~ py-6 (26개 파일) ✅
남음: py-7 ~ py-10 (16개 파일) 📝
```

**진행률**: 26 / 42 = 61.9% 완료

---

## 🔗 관련 링크

- **프로젝트**: https://github.com/jammy0903/CodeInsight
- **로컬 경로**: `/home/jammy/projects/cosine/CodeInsight`
- **레슨 파일 위치**: `packages/backend/prisma/content/python/lessons/`

---

## 📝 작업 패턴

### 각 파일 작업 순서
1. **Read**: 파일 내용 읽기 (주제, step 개수 확인)
2. **Edit**: 각 step에 실행 순서 설명 추가
   - visualizationType 추가
   - pythonMemoryState 추가
   - 상세 설명 추가
3. **Commit**: 시리즈 단위로 커밋

### 커밋 메시지 형식
```
refactor(py): Add execution order explanations to py-X series (N steps)

Enhanced Python lessons with detailed execution flow:
- py-X-1.json: [주제] (N steps)
- py-X-2.json: [주제] (N steps)
...

All steps now include:
- visualizationType: pythonMemory
- pythonMemoryState with object IDs
- Detailed execution order explanations

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## 🎯 다음 단계

1. py-7-1.json부터 py-7-4.json까지 읽어서 주제 확인
2. 각 파일 step 개수 확인
3. 실행 순서 설명 추가
4. py-7 시리즈 커밋
5. py-8 시리즈로 계속 진행

---

## 💡 메모

- **객체 ID 할당 규칙**:
  - 클래스: 0x1000, 0x2000, ...
  - 인스턴스: 0x2000, 0x3000, ... (클래스 다음 번호부터)
  - 함수: 0x1100, 0x1200, ... (클래스 + 100 단위)

- **설명 스타일**:
  - "왜 이 순서인가?" → 이전 단계와의 연결 설명
  - "실행 순서: ..." → 구체적인 실행 흐름
  - 한글 설명 + 영어 기술 용어 병기

- **시각화 상태**:
  - variables: 변수 목록 (name, value, type, id, highlight)
  - output: 출력 결과 배열
  - note: 현재 단계 핵심 메모
