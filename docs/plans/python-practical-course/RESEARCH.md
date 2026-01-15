# 파이썬 실무 코스 조사 결과

> 검색 날짜: 2026-01-15

## 📋 코스 컨셉

**타겟**: 급하게 파이썬 배우고 싶은 실무자
- 업무 자동화 (엑셀, PDF, PPT)
- 데이터 분석 및 시각화
- 최소 문법 → 최대 실습

**목표 학습 시간**: 5~7시간 (하루 30분 × 2주)

---

## 🔍 조사 결과

### 1. 엑셀 자동화 (Excel Automation)

#### 핵심 라이브러리

| 라이브러리 | 용도 | 난이도 | 우선순위 |
|-----------|------|--------|----------|
| **pandas** | 데이터 분석, 읽기/쓰기 | 중 | ⭐⭐⭐ 필수 |
| **openpyxl** | 셀 스타일, 수식, 차트 | 중 | ⭐⭐⭐ 필수 |
| **xlwings** | Excel과 실시간 연동 | 고 | ⭐ 선택 (Phase 2) |

#### 주요 작업
- CSV/Excel 읽기/쓰기
- 데이터 정리 (결측치, 중복 제거)
- 필터링, 정렬, 집계
- 차트 생성 (막대, 선, 파이)
- 셀 서식 (색상, 폰트, 병합)

#### 실습 프로젝트 아이디어
1. **급여명세서 자동 생성** - CSV → Excel 템플릿 채우기
2. **월간 판매 보고서** - 데이터 집계 + 차트
3. **여러 파일 병합** - 폴더 내 모든 Excel 합치기

**참고 자료**:
- [DataCamp - openpyxl Tutorial](https://www.datacamp.com/tutorial/openpyxl)
- [Real Python - Excel Spreadsheets](https://realpython.com/openpyxl-excel-spreadsheets-python/)
- [Analytics Vidhya - Excel Automation Guide](https://www.analyticsvidhya.com/blog/2023/05/master-guide-for-excel-automation-using-python/)

---

### 2. PDF 자동화 (PDF Automation)

#### 핵심 라이브러리

| 라이브러리 | 용도 | 난이도 | 우선순위 |
|-----------|------|--------|----------|
| **PyPDF2** | 병합, 분할, 추출 | 하 | ⭐⭐⭐ 필수 |
| **reportlab** | PDF 생성 (차트, 테이블) | 중 | ⭐⭐ 추천 |
| **pdfplumber** | 텍스트/표 추출 | 중 | ⭐ 선택 |

#### 주요 작업
- **PyPDF2**: 기존 PDF 조작 (병합, 분할, 회전, 암호화)
- **reportlab**: 새 PDF 생성 (보고서, 청구서, 인증서)

#### 실습 프로젝트 아이디어
1. **PDF 병합기** - 여러 PDF를 하나로
2. **자동 보고서 생성** - 데이터 → PDF 보고서 (차트 포함)
3. **PDF 텍스트 추출** - PDF → TXT/CSV

**참고 자료**:
- [Python in Plain English - PDF Workflows](https://python.plainenglish.io/automating-pdf-and-document-workflows-in-python-with-pypdf2-and-reportlab-c6bcf24a24d2)
- [Nanonets - PyPDF2 Guide](https://nanonets.com/blog/pypdf2-library-working-with-pdf-files-in-python/)
- [ReportLab Docs](https://docs.reportlab.com/)

---

### 3. PowerPoint 자동화 (PPT Automation)

#### 핵심 라이브러리

| 라이브러리 | 용도 | 난이도 | 우선순위 |
|-----------|------|--------|----------|
| **python-pptx** | PPT 생성/수정 | 중 | ⭐⭐⭐ 필수 (유일한 선택지) |

#### 주요 작업
- 슬라이드 생성 및 레이아웃 설정
- 텍스트, 이미지, 차트 삽입
- 테이블 생성
- 기존 PPT 수정

#### 실습 프로젝트 아이디어
1. **주간 보고서 자동 생성** - 데이터 → PPT (차트 포함)
2. **템플릿 기반 PPT 생성** - 여러 슬라이드 자동 채우기
3. **대량 PPT 생성** - Excel 데이터 → 개별 PPT 100개

**참고 자료**:
- [python-pptx Documentation](https://python-pptx.readthedocs.io/)
- [Towards Data Science - Automate PowerPoint](https://towardsdatascience.com/automate-powerpoint-slides-creation-with-python-a639c7d429a6/)
- [Practical Business Python - Creating PowerPoint](https://pbpython.com/creating-powerpoint.html)
- [SoftKraft - 7 Ways to Boost Productivity](https://www.softkraft.co/python-powerpoint-automation/)

---

### 4. 데이터 분석 & 시각화 (Data Analysis)

#### 핵심 라이브러리

| 라이브러리 | 용도 | 난이도 | 우선순위 |
|-----------|------|--------|----------|
| **pandas** | 데이터 처리 | 중 | ⭐⭐⭐ 필수 |
| **matplotlib** | 기본 그래프 | 중 | ⭐⭐⭐ 필수 |
| **seaborn** | 고급 시각화 | 중 | ⭐⭐ 추천 |
| **numpy** | 수치 계산 | 중 | ⭐⭐ 추천 |

#### 주요 작업
- 데이터 로드 (CSV, Excel, JSON)
- 탐색적 데이터 분석 (EDA)
- 기술 통계 (평균, 중앙값, 표준편차)
- 그룹화, 피봇 테이블
- 시각화 (막대, 선, 산점도, 히트맵)

#### 실습 프로젝트 아이디어
1. **판매 데이터 분석** - 월별/지역별 집계 + 그래프
2. **고객 데이터 인사이트** - 연령/성별 분포 시각화
3. **주식 데이터 분석** - 가격 추이 그래프

**참고 자료**:
- [freeCodeCamp - Data Analysis Course (4-5시간)](https://www.classcentral.com/course/freecodecamp-data-analysis-with-python-full-course-for-beginners-numpy-pandas-matplotlib-seaborn-105010)
- [Coding Club - Pandas & Matplotlib Tutorial](https://ourcodingclub.github.io/tutorials/pandas-python-intro/)
- [GeeksforGeeks - EDA with NumPy, Pandas, Matplotlib](https://www.geeksforgeeks.org/data-analysis/eda-with-NumPy-Pandas-Matplotlib-Seaborn/)
- [Kanaries - Python Data Analysis Projects](https://docs.kanaries.net/articles/python-data-analysis-projects)
- [DataWars - 12 Free Data Science Projects](https://www.datawars.io/articles/12-free-data-science-projects-to-practice-python-and-pandas)
- [ProjectPro - 15 Pandas Project Ideas](https://www.projectpro.io/article/python-pandas-project-ideas/580)

---

### 5. "Automate the Boring Stuff" 벤치마킹

#### 3판 챕터 구조 (24챕터)

**Part I: Python 기초 (Ch 1-8)** - 8챕터
- 변수, 조건문, 반복문, 함수, 디버깅
- 리스트, 딕셔너리, 문자열

**Part II: 자동화 실전 (Ch 9-24)** - 16챕터
- Ch 9: 정규 표현식
- Ch 10-11: 파일 읽기/쓰기, 조직화
- Ch 12: CLI 프로그램 설계
- Ch 13: 웹 스크래핑
- **Ch 14-15: Excel, Google Sheets** ⭐
- Ch 16: SQLite 데이터베이스
- **Ch 17-18: PDF, Word, CSV, JSON, XML** ⭐
- Ch 19: 스케줄링, 시간 관리
- Ch 20: 이메일, 알림
- **Ch 21: 그래프, 이미지 조작** ⭐
- Ch 22: 이미지 텍스트 인식 (OCR)
- Ch 23: 키보드/마우스 제어
- Ch 24: 음성 인식

#### 우리 코스와의 차이점

| 항목 | Automate the Boring Stuff | 우리 코스 |
|------|---------------------------|----------|
| **챕터 수** | 24개 (기초 8 + 실전 16) | 10~12개 (기초 2~3 + 실전 7~9) |
| **학습 시간** | 15~20시간 | 5~7시간 |
| **기초 비중** | 33% (8/24) | 20% (2/10) |
| **실전 범위** | 웹, DB, OCR, 마우스 등 | 문서 자동화 + 데이터 분석 집중 |
| **난이도** | 완전 초보 → 중급 | 급한 실무자 → 빠른 적용 |

**참고 자료**:
- [Automate the Boring Stuff (3판 무료)](https://automatetheboringstuff.com/)
- [Chapter Structure (3판)](https://automatetheboringstuff.com/3e/chapter0.html)

---

## 💡 핵심 인사이트

### 1. 라이브러리 우선순위

**Tier 1 (필수)**:
- `pandas` - 모든 데이터 작업의 기반
- `openpyxl` - Excel 세밀 제어
- `PyPDF2` - PDF 조작
- `python-pptx` - PPT 유일한 선택지
- `matplotlib` - 기본 그래프

**Tier 2 (추천)**:
- `seaborn` - 아름다운 그래프
- `reportlab` - PDF 생성
- `numpy` - 수치 계산

**Tier 3 (선택, Phase 2)**:
- `xlwings` - Excel 고급 기능
- `pdfplumber` - PDF 표 추출
- `requests` + `beautifulsoup4` - 웹 스크래핑

### 2. 학습 순서 제안

```
1. Python 기초 (2~3 레슨)
   - 변수, 반복문, 함수, 리스트/딕셔너리

2. 파일 다루기 (1 레슨)
   - pathlib, 파일 읽기/쓰기

3. 엑셀 자동화 (2~3 레슨)
   - pandas: 읽기/쓰기, 필터링, 집계
   - openpyxl: 셀 서식, 차트

4. PDF 자동화 (1~2 레슨)
   - PyPDF2: 병합/분할
   - reportlab: 보고서 생성 (선택)

5. PPT 자동화 (1 레슨)
   - python-pptx: 슬라이드 생성

6. 데이터 분석 (2~3 레슨)
   - pandas: 탐색적 분석
   - matplotlib/seaborn: 시각화

7. 종합 프로젝트 (1 레슨)
   - Excel → 분석 → PDF 보고서 + PPT
```

### 3. 프로젝트 기반 학습 강조

각 레슨은 **실제 사용 사례** 중심:
- ❌ "pandas의 groupby() 함수"
- ✅ "부서별 월간 판매액 집계하기"

### 4. 코드 템플릿 제공

실무자는 이해보다 **복사 후 수정**을 선호:
- 각 레슨마다 "바로 쓰는 코드 템플릿" 제공
- 변수명만 바꾸면 동작하는 코드

---

## 📊 추정 학습 시간

| 섹션 | 레슨 수 | 시간 | 누적 |
|------|---------|------|------|
| Python 기초 | 2~3 | 1.5h | 1.5h |
| 파일 다루기 | 1 | 0.5h | 2h |
| 엑셀 자동화 | 2~3 | 1.5h | 3.5h |
| PDF 자동화 | 1~2 | 1h | 4.5h |
| PPT 자동화 | 1 | 0.5h | 5h |
| 데이터 분석 | 2~3 | 1.5h | 6.5h |
| 종합 프로젝트 | 1 | 0.5h | 7h |
| **총계** | **10~14** | **7h** | |

**목표**: 하루 30분 × 2주 = 7시간

---

## 🎯 다음 단계

1. ✅ 조사 완료
2. ⏳ 챕터/레슨 구조 구체화 (`CURRICULUM.md`)
3. ⏳ 각 레슨의 코드 예제 작성
4. ⏳ 퀴즈 및 실습 문제 설계
5. ⏳ JSON 콘텐츠 파일 생성
