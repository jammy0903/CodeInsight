# 교수 탐색 가이드 (Professor Search Guide)

다른 에이전트/사람에게 교수 탐색을 시킬 때 이 문서를 참고하세요.

## 목표

CS 입문/프로그래밍 수업을 담당하는 교수를 찾아서 아래 형식으로 정리합니다.

## 출력 형식

교수 1명당 아래 필드를 모두 채워야 합니다:

```
이름, 대학교, 이메일, 담당과목(과목코드 포함), 직함, 국가코드
```

예시:
```
John DeNero,UC Berkeley,denero@berkeley.edu,CS61A (Structure & Interpretation of Computer Programs),Associate Teaching Professor EECS,US
김문주,KAIST,moonzoo@cs.kaist.ac.kr,CS101 프로그래밍기초 (Python)/소프트웨어테스팅,부교수,KR
Ajit Rajwade,IIT Bombay,ajitvr@cse.iitb.ac.in,CS101 (Computer Programming and Utilization),Professor CSE,IN
```

## 탐색 대상 과목

우선순위 순서:

1. **CS1/프로그래밍 입문** — CS 101, Intro to CS, Programming Fundamentals 등
2. **자료구조** — Data Structures, CS2, Programming II 등
3. **프로그래밍 언어** — Programming Languages, OOP 등
4. **시스템 프로그래밍** — C 기반 메모리 관리 수업

### 왜 이 과목들인가?

CodeInsight가 시각화하는 것:
- **C**: Stack, Heap, BSS, DATA, TEXT 세그먼트 메모리 레이아웃, 포인터
- **Python**: 변수 추적, 스코프 시각화
- **JavaScript**: 이벤트 루프, 스코프 체인, 프로토타입 체인, Promise
- **Java**: JVM 메모리 모델, 객체 참조

→ 이 언어들을 가르치는 입문 수업 교수가 핵심 타깃

## 탐색 방법

### 1단계: 대학 CS 학과 페이지 접속

```
[대학명] computer science department faculty
[대학명] CS course catalog
[대학명] 컴퓨터공학과 교수진    (한국)
```

### 2단계: 과목 → 교수 매핑

- 학과 홈페이지 → Course Catalog / 교과과정
- 최근 학기 시간표에서 입문 과목 담당 교수 확인
- Rate My Professors, 대학 수업 검색 시스템도 활용 가능

### 3단계: 이메일 확인

- **반드시 공식 대학 페이지에서 확인된 이메일만 사용**
- 추측 이메일 (firstname.lastname@univ.edu 패턴 추측) 사용 금지
- Google Scholar, ResearchGate 프로필의 검증된 이메일은 사용 가능
- 이메일을 찾을 수 없으면 해당 교수는 제외

### 4단계: 과목코드 확인

- 과목명만 적지 말고 과목코드(CS 101, COEN 10 등)를 반드시 포함
- 코드를 찾을 수 없으면 과목명만 기재

## 국가별 탐색 팁

### 미국 (US)
- 타깃: 주요 대학 CS 학과 (Top 100 + 규모가 큰 주립대)
- 과목: CS1, CS2, Intro to Programming, Data Structures
- 특징: Teaching Professor, Lecturer, Senior Lecturer도 적극 포함 (연구 교수보다 수업에 관심 많음)
- 이메일: 대부분 학과 faculty 페이지에 공개

### 한국 (KR)
- 타깃: 4년제 대학 컴퓨터공학과/소프트웨어학과
- 과목: 프로그래밍 기초, C프로그래밍, 자료구조, 컴퓨팅사고
- 특징: 강의전담교수도 포함 (오히려 더 좋은 타깃)
- 이메일: 학과 교수진 페이지에서 확인. 일부 대학은 이메일을 "교수명(at)univ.ac.kr" 형태로 표시

### 인도 (IN)
- 타깃: IIT (Bombay, Delhi, Madras, Kanpur, Kharagpur 등), IIIT, NIT, BITS
- 과목: CS101, ESC101, COL100, CS1100, CS10001 등 (대학마다 코드 다름)
- 특징: C 사용 비중 높음 → 메모리 시각화 강조
- 이메일: 학과 faculty 페이지, 일부 IRINS 프로필에서 확인 가능

### 기타 국가 확장 시
- 유럽: ETH Zurich, TU Munich, Oxford, Cambridge, Imperial College 등
- 캐나다: U of Toronto, UBC, Waterloo, McGill 등
- 싱가포르: NUS, NTU
- 일본: 東京大学, 京都大学 등

## 배치 크기

- 1회 탐색 시 대학 10~15개씩 나눠서 진행
- 대학당 교수 1~3명 (입문 수업 담당자만)
- 배치당 20~30명이 적정

## 중복 체크

탐색 전 기존 `professor-outreach.json`의 교수 목록을 확인하고 이미 포함된 대학/교수는 건너뛰세요.

현재 포함된 대학 목록은 JSON 파일에서 `university` 필드로 확인할 수 있습니다.

## 결과물 전달 형식

CSV 형태로 정리해서 전달:

```csv
Name,University,Email,Course,Title,Country
John Smith,MIT,jsmith@mit.edu,6.100A (Intro to CS),Senior Lecturer CS,US
```

이후 JSON 변환 및 개인화 hook 작성은 별도로 처리합니다.
