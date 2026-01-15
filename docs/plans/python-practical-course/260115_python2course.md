# Python 실무 코스 (2nd Course) - 완전 기획서

> **작성일**: 2026-01-15
> **코스명**: "급하게 배우는 파이썬 - 업무 자동화 & 데이터 분석"
> **타겟**: 엑셀/PDF/PPT 작업이 많은 실무자
> **목표 시간**: 7시간 (하루 30분 × 2주)

---

## 📋 목차

1. [코스 컨셉](#1-코스-컨셉)
2. [커리큘럼 구조](#2-커리큘럼-구조)
3. [UI/UX 설계](#3-uiux-설계)
4. [구현 코드](#4-구현-코드)
5. [컴포넌트 설계](#5-컴포넌트-설계)
6. [JSON 스키마](#6-json-스키마)
7. [다음 단계](#7-다음-단계)

---

## 1. 코스 컨셉

### 1.1 타겟 사용자

**급하게 파이썬 배우고 싶은 실무자**
- 엑셀 작업이 많은 사무직
- 업무 보고서(PDF/PPT) 자동화 필요
- 데이터 분석/시각화 입문자
- 프로그래밍 경험 최소 (또는 전무)

### 1.2 기존 Python 코스와 차이

| 항목 | 기존 코스 (35 레슨) | 실무 코스 (14 레슨) |
|------|---------------------|---------------------|
| **목표** | 메모리 모델 이해 | 즉시 업무 적용 |
| **기초 비중** | 50% (변수, 함수, 클래스) | 20% (최소한만) |
| **라이브러리** | 표준 라이브러리만 | pandas, openpyxl, reportlab, python-pptx |
| **실습** | 알고리즘 문제 | 실무 시나리오 (Excel → PDF → PPT) |
| **학습 시간** | 15~20시간 | 7시간 |
| **시각화** | 메모리 상태 | 데이터 플로우 + 테이블 |

### 1.3 핵심 라이브러리

**Tier 1 (필수)**:
- `pandas` - Excel 읽기/쓰기, 데이터 분석
- `openpyxl` - Excel 서식/차트
- `PyPDF2` - PDF 병합/분할
- `python-pptx` - PPT 자동화
- `matplotlib` - 기본 그래프

**Tier 2 (추천)**:
- `seaborn` - 고급 시각화
- `reportlab` - PDF 보고서 생성

---

## 2. 커리큘럼 구조

### 2.1 전체 구조

| Part | 주제 | 챕터 수 | 레슨 수 | 시간 |
|------|------|----------|---------|------|
| **Part 1** | Python 기초 | 1 | 3 | 1.5h |
| **Part 2** | 문서 자동화 | 3 | 6 | 3h |
| **Part 3** | 데이터 분석 | 2 | 4 | 2h |
| **Part 4** | 종합 실습 | 1 | 1 | 0.5h |
| **총계** | | **7** | **14** | **7h** |

---

### 2.2 Part 1: Python 기초 (3 레슨)

#### Chapter 1: 빠르게 시작하기

##### Lesson 1-1: 변수와 데이터 타입 (30분)
- 변수 선언 (`name = "홍길동"`)
- 숫자, 문자열, 불린
- 리스트 `[1, 2, 3]`
- 딕셔너리 `{"name": "홍길동", "age": 30}`
- **실습**: 직원 정보를 딕셔너리로 만들기
- **퀴즈**: 리스트와 딕셔너리 차이

##### Lesson 1-2: 반복문과 조건문 (30분)
- `for` 반복문 (리스트 순회)
- `if-elif-else` 조건문
- **실습**: 직원 리스트에서 30세 이상만 필터링
- **퀴즈**: 반복문 실행 결과 예측

##### Lesson 1-3: 함수와 라이브러리 (30분)
- 함수 정의 `def calculate_bonus(salary):`
- 라이브러리 import (`import pandas as pd`)
- **실습**: 급여에서 보너스 계산 함수 만들기
- **퀴즈**: 함수의 반환값

---

### 2.3 Part 2: 문서 자동화 (6 레슨)

#### Chapter 2: 엑셀 자동화 (3 레슨)

##### Lesson 2-1: pandas로 Excel 읽고 쓰기 (30분)
- `pd.read_excel("data.xlsx")`
- DataFrame 구조 이해 (행/열)
- 데이터 확인 (`head()`, `info()`, `describe()`)
- `df.to_excel("output.xlsx")`
- **실습**: 급여 데이터 읽고 새 파일로 저장
- **퀴즈**: DataFrame의 열 이름 확인 방법

##### Lesson 2-2: 데이터 필터링과 집계 (30분)
- 조건 필터링 (`df[df["나이"] >= 30]`)
- 정렬 (`sort_values()`)
- 그룹화 집계 (`groupby().sum()`)
- **실습**: 부서별 평균 급여 계산
- **퀴즈**: groupby() 결과 예측

##### Lesson 2-3: openpyxl로 서식과 차트 추가 (30분)
- 셀 색상, 폰트 변경
- 셀 병합
- 차트 삽입 (막대, 선)
- **실습**: 부서별 급여 막대 차트 추가
- **퀴즈**: 차트 타입 선택 (데이터에 맞는 그래프)

---

#### Chapter 3: PDF 자동화 (2 레슨)

##### Lesson 3-1: PyPDF2로 PDF 조작하기 (30분)
- PDF 병합 (`PdfMerger()`)
- PDF 분할 (`PdfReader`, `PdfWriter`)
- 페이지 회전, 추출
- **실습**: 여러 PDF를 하나로 병합
- **퀴즈**: 페이지 순서 변경

##### Lesson 3-2: reportlab으로 보고서 생성 (30분)
- 텍스트, 표, 이미지 삽입
- 간단한 스타일 설정
- **실습**: 판매 보고서 PDF 자동 생성
- **퀴즈**: 표 데이터 삽입 순서

---

#### Chapter 4: PowerPoint 자동화 (1 레슨)

##### Lesson 4-1: python-pptx로 PPT 만들기 (30분)
- 슬라이드 추가 (`slides.add_slide()`)
- 텍스트, 이미지 삽입
- 차트 추가 (막대, 파이)
- **실습**: 주간 보고서 PPT 자동 생성
- **퀴즈**: 슬라이드 레이아웃 선택

---

### 2.4 Part 3: 데이터 분석 & 시각화 (4 레슨)

#### Chapter 5: 데이터 분석 기초 (2 레슨)

##### Lesson 5-1: 데이터 탐색 (EDA) (30분)
- 결측치 확인 (`isnull()`)
- 중복 제거 (`drop_duplicates()`)
- 기술 통계 (`mean()`, `median()`, `std()`)
- **실습**: 고객 데이터 결측치 처리
- **퀴즈**: 결측치 비율 계산

##### Lesson 5-2: 피봇 테이블과 교차 분석 (30분)
- 피봇 테이블 (`pivot_table()`)
- 교차 표 (`crosstab()`)
- **실습**: 지역별/월별 판매 집계
- **퀴즈**: pivot_table vs groupby 차이

---

#### Chapter 6: 데이터 시각화 (2 레슨)

##### Lesson 6-1: matplotlib 기초 (30분)
- 선 그래프 (`plt.plot()`)
- 막대 그래프 (`plt.bar()`)
- 산점도 (`plt.scatter()`)
- 그래프 저장 (`plt.savefig()`)
- **실습**: 월별 매출 추이 선 그래프
- **퀴즈**: 그래프 타입 선택 기준

##### Lesson 6-2: seaborn으로 고급 시각화 (30분)
- 박스 플롯 (`sns.boxplot()`)
- 히트맵 (`sns.heatmap()`)
- 페어 플롯 (`sns.pairplot()`)
- **실습**: 변수 간 상관관계 히트맵
- **퀴즈**: 히트맵 색상 해석

---

### 2.5 Part 4: 종합 실습 (1 레슨)

#### Chapter 7: 실전 프로젝트

##### Lesson 7-1: Excel → 분석 → PDF + PPT 자동 생성 (30분)
- **시나리오**: 월간 판매 데이터 자동 보고서
- **단계**:
  1. Excel 파일 읽기 (pandas)
  2. 부서별/지역별 집계 (groupby)
  3. 그래프 생성 (matplotlib)
  4. PDF 보고서 생성 (reportlab)
  5. PPT 슬라이드 생성 (python-pptx)
- **실습**: 전체 워크플로우 실행
- **퀴즈**: 워크플로우 순서 최적화

---

## 3. UI/UX 설계

### 3.1 데스크톱 레이아웃 (1024px 이상)

```
┌────────────────────────────────────────────────────────────┐
│  Lesson 2-2: 데이터 필터링과 집계                           │
├──────────────────────────┬─────────────────────────────────┤
│                          │                                 │
│  📝 코드 영역 (50%)       │  📋 실행 결과 (50%)             │
│                          │                                 │
│  1  import pandas as pd  │  Step 3 결과:                   │
│  2  df = pd.read_excel(  │                                 │
│      "sales.xlsx"        │  filtered:                      │
│  )                       │  ┌──────┬──────┬─────────┐     │
│▶ 3  filtered = df[       │  │ 이름 │ 부서 │  급여   │     │
│      df["부서"] == "개발" │  ├──────┼──────┼─────────┤     │
│  ]                       │  │홍길동│ 개발 │ 5000000 │     │
│  4  result = filtered    │  │이영희│ 개발 │ 5500000 │     │
│      .groupby("부서")    │  └──────┴──────┴─────────┘     │
│      .mean()             │                                 │
│  5  result.to_excel(     │  Shape: (2, 3)                  │
│      "output.xlsx"       │                                 │
│  )                       │  변경사항:                      │
│                          │  ✨ 필터링 완료                 │
│  ◀ Prev (3/5) ▶ Next    │  ❌ "영업" 부서 제거됨          │
│                          │                                 │
├──────────────────────────┴─────────────────────────────────┤
│  하단 45%: 플로우 + 설명                                     │
├─────────────────────────────────┬───────────────────────────┤
│  📊 데이터 플로우 (50%)          │  💡 현재 단계 설명 (50%)  │
│                                 │                           │
│  ┌─────────────────────────┐   │  Step 3: 조건 필터링      │
│  │ 📁 Excel 파일           │   │                           │
│  │ "sales.xlsx"            │   │  df[조건식]을 사용해      │
│  │ 3 rows × 3 cols         │   │  특정 조건에 맞는 행만    │
│  └─────────────────────────┘   │  선택합니다.              │
│          ↓ read_excel()        │                           │
│  ┌─────────────────────────┐   │  이 단계에서는:           │
│  │ 📊 DataFrame: df        │   │  • "부서" 열이 "개발"인   │
│  │ 전체 직원 데이터        │   │    행만 남깁니다          │
│  │ • 3 rows × 3 cols       │   │  • 3행 → 2행으로 줄어듭니다│
│  └─────────────────────────┘   │                           │
│          ↓ 조건 필터링 👈      │  💡 Tip:                  │
│  ┌─────────────────────────┐   │  조건을 &(and)나 |(or)로  │
│  │ 📊 DataFrame: filtered  │   │  결합할 수 있습니다       │
│  │ "개발" 부서만           │   │                           │
│  │ • 2 rows × 3 cols       │   │                           │
│  └─────────────────────────┘   │                           │
│          ↓ groupby()           │                           │
│  ┌─────────────────────────┐   │                           │
│  │ 📈 Series: result       │   │                           │
│  │ 부서별 평균 급여        │   │                           │
│  └─────────────────────────┘   │                           │
│          ↓ to_excel()          │                           │
│  ┌─────────────────────────┐   │                           │
│  │ 💾 Excel 파일 저장      │   │                           │
│  └─────────────────────────┘   │                           │
│                                 │                           │
└─────────────────────────────────┴───────────────────────────┘
```

#### 비율 정리
- **상단 (55%)**: 코드(50%) + 테이블(50%)
- **하단 (45%)**: 플로우(50%) + 설명(50%)

---

### 3.2 모바일 레이아웃 (768px 미만) - 2페이지 스와이프

#### 페이지 1 (학습 모드) - ● ○

```
┌─────────────────┐
│  Lesson 2-2     │
│  Step 3/5       │
│  ● ○  (인디케이터)│
├─────────────────┤
│  💡 설명 (30%)  │
│                 │
│  Step 3:        │
│  조건 필터링    │
│                 │
│  df[조건식]으로 │
│  특정 조건에... │
│                 │
├─────────────────┤
│  📝 코드 (40%)  │
│                 │
│  1 import pandas│
│  2 df = read_   │
│▶ 3 filtered =   │
│    df[df["부서"]│
│    == "개발"]   │
│  4 result = ... │
│                 │
├─────────────────┤
│  📋 결과 (30%)  │
│                 │
│  filtered:      │
│  ┌───┬───┬────┐│
│  │이름│부서│급여││
│  │홍길동│개발│50M││
│  │이영희│개발│55M││
│  └───┴───┴────┘│
│                 │
│  ✨ 필터링 완료 │
│                 │
│  ◀ Prev  Next ▶│
└─────────────────┘
    ← 스와이프
```

#### 페이지 2 (전체 맥락) - ○ ●

```
┌─────────────────┐
│  Lesson 2-2     │
│  Step 3/5       │
│  ○ ●  (인디케이터)│
├─────────────────┤
│  💡 설명 (30%)  │
│  (같은 내용)    │
│                 │
│  Step 3:        │
│  조건 필터링    │
│                 │
│  df[조건식]으로 │
│  특정 조건에... │
│                 │
├─────────────────┤
│  📊 플로우      │
│  (70%, 크게!)   │
│                 │
│  ┌───────────┐ │
│  │📁 Excel   │ │
│  │3 rows     │ │
│  └───────────┘ │
│       ↓        │
│  ┌───────────┐ │
│  │📊 DataFrame│ │
│  │3 rows     │ │
│  └───────────┘ │
│       ↓        │
│  ┌───────────┐ │
│  │🔍 필터링  │ │ 👈
│  │2 rows     │ │
│  └───────────┘ │
│       ↓        │
│  ┌───────────┐ │
│  │📈 집계    │ │
│  │(대기)     │ │
│  └───────────┘ │
│       ↓        │
│  ┌───────────┐ │
│  │💾 저장    │ │
│  │(대기)     │ │
│  └───────────┘ │
│                 │
│  ◀ Prev  Next ▶│
└─────────────────┘
```

#### 스와이프 인터랙션

```
     페이지 1           페이지 2
┌─────────────┐   ┌─────────────┐
│  설명       │   │  설명       │
│  코드       │ ← │  플로우     │
│  결과       │ → │  (크게)     │
└─────────────┘   └─────────────┘
     ● ○               ○ ●

왼쪽으로 스와이프 → 페이지 2 (플로우 보기)
오른쪽으로 스와이프 → 페이지 1 (학습 모드)
```

---

## 4. 구현 코드

### 4.1 데스크톱 레이아웃 컴포넌트

```typescript
// PythonPracticalLessonPage.tsx
import { useState } from 'react';
import { CodeViewer } from '@/features/courses/components/day/CodeViewer';
import { StepControls } from '@/features/courses/components/day/StepControls';
import { DataFrameTable } from './components/DataFrameTable';
import { DataFlowDiagram } from './components/DataFlowDiagram';
import { StepExplanation } from './components/StepExplanation';

interface PythonPracticalLessonPageProps {
  lesson: PythonLesson;
}

export function PythonPracticalLessonPage({ lesson }: PythonPracticalLessonPageProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = lesson.steps[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < lesson.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  return (
    <div className="lesson-container h-screen flex flex-col">
      {/* 헤더 */}
      <div className="header p-4 border-b">
        <h2 className="text-xl font-bold">{lesson.title}</h2>
        <p className="text-sm text-gray-600">{lesson.description}</p>
      </div>

      {/* 상단 55%: 코드 + 테이블 */}
      <div className="upper-section h-[55%] flex border-b">
        {/* 코드 영역 50% */}
        <div className="code-section w-1/2 border-r p-4 overflow-auto">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            📝 코드
          </h3>
          <CodeViewer
            code={lesson.code}
            currentLine={currentStep.line}
            language="python"
          />
          <div className="mt-4">
            <StepControls
              onPrev={handlePrev}
              onNext={handleNext}
              current={currentStepIndex}
              total={lesson.steps.length}
            />
          </div>
        </div>

        {/* 테이블 결과 50% */}
        <div className="result-section w-1/2 p-4 overflow-auto">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            📋 실행 결과
            <span className="text-xs text-gray-500">
              Step {currentStepIndex + 1}/{lesson.steps.length}
            </span>
          </h3>
          <DataFrameTable
            data={currentStep.dataframe?.data}
            columns={currentStep.dataframe?.columns}
            shape={currentStep.dataframe?.shape}
            changes={currentStep.changes}
          />
        </div>
      </div>

      {/* 하단 45%: 플로우 + 설명 */}
      <div className="lower-section h-[45%] flex">
        {/* 플로우 50% */}
        <div className="flow-section w-1/2 border-r p-4 overflow-auto">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            📊 데이터 플로우 (전체 과정)
          </h3>
          <DataFlowDiagram
            steps={lesson.steps}
            currentStep={currentStepIndex}
            mode="desktop"
          />
        </div>

        {/* 설명 50% */}
        <div className="explanation-section w-1/2 p-4 overflow-auto">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            💡 현재 단계 설명
          </h3>
          <StepExplanation
            title={currentStep.title}
            explanation={currentStep.explanation}
            tip={currentStep.tip}
            warning={currentStep.warning}
          />
        </div>
      </div>
    </div>
  );
}
```

---

### 4.2 모바일 레이아웃 컴포넌트

```typescript
// MobileLessonView.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileLessonViewProps {
  lesson: PythonLesson;
  currentStep: PythonStep;
  currentStepIndex: number;
}

export function MobileLessonView({
  lesson,
  currentStep,
  currentStepIndex
}: MobileLessonViewProps) {
  const [page, setPage] = useState(0); // 0: 페이지1, 1: 페이지2
  const [direction, setDirection] = useState(0);

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setPage((prev) => {
      const next = prev + newDirection;
      return Math.max(0, Math.min(1, next));
    });
  };

  return (
    <div className="mobile-lesson h-screen flex flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="header p-4 border-b">
        <h2 className="font-bold text-lg">{lesson.title}</h2>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-gray-600">
            Step {currentStepIndex + 1}/{lesson.steps.length}
          </span>
          {/* 페이지 인디케이터 */}
          <div className="flex gap-2">
            <span className={page === 0 ? "text-blue-500 text-xl" : "text-gray-300"}>●</span>
            <span className={page === 1 ? "text-blue-500 text-xl" : "text-gray-300"}>●</span>
          </div>
        </div>
      </div>

      {/* 스와이프 영역 */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            className="absolute inset-0 flex flex-col"
          >
            {page === 0 ? (
              <Page1 currentStep={currentStep} lesson={lesson} />
            ) : (
              <Page2 currentStep={currentStep} lesson={lesson} currentStepIndex={currentStepIndex} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 스텝 컨트롤 */}
      <div className="controls p-4 border-t">
        <StepControls
          onPrev={handlePrev}
          onNext={handleNext}
          current={currentStepIndex}
          total={lesson.steps.length}
        />
      </div>
    </div>
  );
}

// 애니메이션 variants
const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0
  })
};
```

---

### 4.3 모바일 페이지 컴포넌트

#### Page1 (학습 모드)

```typescript
// Page1.tsx
function Page1({ currentStep, lesson }: Page1Props) {
  return (
    <div className="page1 flex flex-col h-full">
      {/* 설명 30% */}
      <div className="explanation-section h-[30%] p-4 border-b overflow-auto">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          💡 설명
        </h3>
        <div className="prose prose-sm">
          <h4 className="font-semibold">{currentStep.title}</h4>
          <p className="text-sm text-gray-700">{currentStep.explanation}</p>
        </div>
      </div>

      {/* 코드 40% */}
      <div className="code-section h-[40%] p-4 border-b overflow-auto bg-gray-50">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          📝 코드
        </h3>
        <CodeViewer
          code={lesson.code}
          currentLine={currentStep.line}
          language="python"
          compact={true}
        />
      </div>

      {/* 결과 30% */}
      <div className="result-section h-[30%] p-4 overflow-auto">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          📋 실행 결과
        </h3>
        <DataFrameTable
          data={currentStep.dataframe?.data}
          columns={currentStep.dataframe?.columns}
          compact={true}
        />
        {currentStep.changes && (
          <div className="mt-2 space-y-1">
            {currentStep.changes.map((change, i) => (
              <div key={i} className="text-xs text-gray-600 flex items-start gap-1">
                <span>✨</span>
                <span>{change}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 스와이프 힌트 */}
      <div className="absolute bottom-16 right-4 text-xs text-gray-400 animate-pulse flex items-center gap-1">
        <span>← 전체 플로우 보기</span>
      </div>
    </div>
  );
}
```

#### Page2 (전체 맥락)

```typescript
// Page2.tsx
function Page2({ currentStep, lesson, currentStepIndex }: Page2Props) {
  return (
    <div className="page2 flex flex-col h-full">
      {/* 설명 30% (동일) */}
      <div className="explanation-section h-[30%] p-4 border-b overflow-auto">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          💡 설명
        </h3>
        <div className="prose prose-sm">
          <h4 className="font-semibold">{currentStep.title}</h4>
          <p className="text-sm text-gray-700">{currentStep.explanation}</p>
        </div>
      </div>

      {/* 플로우 70% (크게!) */}
      <div className="flow-section h-[70%] p-4 overflow-auto">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          📊 데이터 플로우 (전체 과정)
        </h3>
        <DataFlowDiagram
          steps={lesson.steps}
          currentStep={currentStepIndex}
          mode="mobile-large"
        />
      </div>

      {/* 스와이프 힌트 */}
      <div className="absolute bottom-16 left-4 text-xs text-gray-400 animate-pulse flex items-center gap-1">
        <span>코드/결과 보기 →</span>
      </div>
    </div>
  );
}
```

---

## 5. 컴포넌트 설계

### 5.1 DataFrameTable.tsx

```typescript
// DataFrameTable.tsx
interface DataFrameTableProps {
  data?: any[][];           // 2D 배열
  columns?: string[];       // 열 이름
  shape?: [number, number]; // (rows, cols)
  changes?: string[];       // 변경사항 설명
  compact?: boolean;        // 모바일용 컴팩트 모드
}

export function DataFrameTable({
  data,
  columns,
  shape,
  changes,
  compact = false
}: DataFrameTableProps) {
  if (!data || !columns) {
    return (
      <div className="text-sm text-gray-500">
        실행 결과 없음
      </div>
    );
  }

  return (
    <div className="dataframe-table">
      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className={cn(
          "min-w-full border-collapse",
          compact ? "text-xs" : "text-sm"
        )}>
          <thead>
            <tr className="bg-gray-100">
              {columns.map((col, i) => (
                <th key={i} className="border px-3 py-2 text-left font-semibold">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {row.map((cell, j) => (
                  <td key={j} className="border px-3 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Shape 정보 */}
      {shape && (
        <div className="mt-2 text-xs text-gray-500">
          Shape: ({shape[0]} rows, {shape[1]} columns)
        </div>
      )}

      {/* 변경사항 */}
      {changes && changes.length > 0 && (
        <div className="mt-3 space-y-1">
          <div className="text-xs font-semibold text-gray-700">변경사항:</div>
          {changes.map((change, i) => (
            <div key={i} className="text-xs text-gray-600 flex items-start gap-1">
              <span className="text-blue-500">✨</span>
              <span>{change}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### 5.2 DataFlowDiagram.tsx

```typescript
// DataFlowDiagram.tsx
interface DataFlowStep {
  icon: string;           // 📁, 📊, 🔍, 📈, 💾
  label: string;          // "Excel 읽기"
  detail?: string;        // "3 rows × 3 cols"
  status: 'done' | 'current' | 'pending';
}

interface DataFlowDiagramProps {
  steps: PythonStep[];
  currentStep: number;
  mode?: 'desktop' | 'mobile-large';
}

export function DataFlowDiagram({
  steps,
  currentStep,
  mode = 'desktop'
}: DataFlowDiagramProps) {
  // 스텝을 플로우 형식으로 변환
  const flowSteps = steps.map((step, i) => ({
    icon: step.flowIcon || '📊',
    label: step.flowLabel || step.title,
    detail: step.flowDetail,
    status: i < currentStep ? 'done' : i === currentStep ? 'current' : 'pending'
  }));

  if (mode === 'mobile-large') {
    return (
      <div className="flex flex-col gap-3">
        {flowSteps.map((step, i) => {
          const isDone = step.status === 'done';
          const isCurrent = step.status === 'current';
          const isPending = step.status === 'pending';

          return (
            <div key={i} className="relative">
              {/* 박스 */}
              <div className={cn(
                "border-2 rounded-lg p-4 transition-all",
                isCurrent && "border-blue-500 bg-blue-50 shadow-lg scale-105",
                isDone && "border-green-500 bg-green-50",
                isPending && "border-gray-300 bg-gray-50 opacity-50"
              )}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{step.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{step.label}</div>
                    {step.detail && (
                      <div className="text-xs text-gray-600 mt-1">{step.detail}</div>
                    )}
                  </div>
                  {isCurrent && <span className="text-xl">👈</span>}
                  {isDone && <span className="text-green-500 text-xl">✓</span>}
                </div>
              </div>

              {/* 화살표 */}
              {i < flowSteps.length - 1 && (
                <div className="flex justify-center my-1">
                  <span className="text-2xl text-gray-400">↓</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // 데스크톱 모드
  return (
    <div className="flex flex-col gap-2">
      {flowSteps.map((step, i) => {
        const isDone = step.status === 'done';
        const isCurrent = step.status === 'current';
        const isPending = step.status === 'pending';

        return (
          <div key={i} className="relative">
            {/* 박스 */}
            <div className={cn(
              "border rounded p-3 transition-all",
              isCurrent && "border-blue-500 bg-blue-50",
              isDone && "border-green-500 bg-green-50",
              isPending && "border-gray-300 bg-gray-50 opacity-60"
            )}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{step.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{step.label}</div>
                  {step.detail && (
                    <div className="text-xs text-gray-600">{step.detail}</div>
                  )}
                </div>
                {isCurrent && <span>👈</span>}
                {isDone && <span className="text-green-500">✓</span>}
              </div>
            </div>

            {/* 화살표 */}
            {i < flowSteps.length - 1 && (
              <div className="flex justify-center my-1">
                <span className="text-gray-400">↓</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

---

### 5.3 StepExplanation.tsx

```typescript
// StepExplanation.tsx
interface StepExplanationProps {
  title: string;          // "Step 3: 조건 필터링"
  explanation: string;    // 메인 설명
  tip?: string;           // 팁 (선택)
  warning?: string;       // 주의사항 (선택)
}

export function StepExplanation({
  title,
  explanation,
  tip,
  warning
}: StepExplanationProps) {
  return (
    <div className="step-explanation space-y-3">
      {/* 제목 */}
      <h4 className="font-semibold text-base">{title}</h4>

      {/* 메인 설명 */}
      <div className="prose prose-sm text-gray-700">
        {explanation}
      </div>

      {/* 팁 */}
      {tip && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
          <div className="flex items-start gap-2">
            <span className="text-blue-500 text-lg">💡</span>
            <div>
              <div className="text-xs font-semibold text-blue-700 mb-1">Tip</div>
              <div className="text-sm text-blue-900">{tip}</div>
            </div>
          </div>
        </div>
      )}

      {/* 주의사항 */}
      {warning && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
          <div className="flex items-start gap-2">
            <span className="text-yellow-500 text-lg">⚠️</span>
            <div>
              <div className="text-xs font-semibold text-yellow-700 mb-1">주의</div>
              <div className="text-sm text-yellow-900">{warning}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 6. JSON 스키마

### 6.1 PythonLesson 타입 정의

```typescript
// types/python-lesson.ts

export interface PythonLesson {
  id: string;                     // "py-practical-2-1"
  chapterId: string;              // "py-practical-2"
  title: string;                  // "pandas로 Excel 읽고 쓰기"
  description: string;            // 레슨 설명
  difficulty: 'basic' | 'intermediate' | 'advanced';
  estimatedTime: number;          // 분 단위 (30)
  code: string;                   // 전체 코드
  steps: PythonStep[];            // 단계별 실행
  quiz?: PythonQuiz;              // 퀴즈 (선택)
}

export interface PythonStep {
  line: number;                   // 현재 실행 줄
  title: string;                  // "Step 1: Excel 파일 읽기"
  explanation: string;            // 단계 설명
  tip?: string;                   // 팁
  warning?: string;               // 주의사항

  // 플로우 정보
  flowIcon?: string;              // "📁", "📊", "🔍"
  flowLabel?: string;             // "Excel 읽기"
  flowDetail?: string;            // "3 rows × 3 cols"

  // 실행 결과
  dataframe?: {
    data: any[][];                // 2D 배열
    columns: string[];            // 열 이름
    shape: [number, number];      // (rows, cols)
  };

  // 변경사항
  changes?: string[];             // ["필터링 완료", "영업 부서 제거됨"]
}

export interface PythonQuiz {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}
```

---

### 6.2 샘플 JSON (Lesson 2-1)

```json
{
  "id": "py-practical-2-1",
  "chapterId": "py-practical-2",
  "title": "pandas로 Excel 읽고 쓰기",
  "description": "pandas 라이브러리를 사용해 Excel 파일을 읽고, 데이터를 확인하고, 새 파일로 저장하는 방법을 배웁니다.",
  "difficulty": "basic",
  "estimatedTime": 30,
  "code": "import pandas as pd\n\ndf = pd.read_excel(\"sales.xlsx\")\nprint(df.head())\nprint(df.info())\ndf.to_excel(\"output.xlsx\", index=False)",
  "steps": [
    {
      "line": 1,
      "title": "Step 1: pandas 라이브러리 불러오기",
      "explanation": "pandas는 데이터 분석을 위한 파이썬 라이브러리입니다. 'pd'라는 짧은 이름으로 사용합니다.",
      "tip": "pandas는 Excel, CSV, JSON 등 다양한 형식의 데이터를 다룰 수 있습니다.",
      "flowIcon": "📦",
      "flowLabel": "라이브러리 import",
      "flowDetail": "pandas"
    },
    {
      "line": 3,
      "title": "Step 2: Excel 파일 읽기",
      "explanation": "pd.read_excel() 함수로 Excel 파일을 DataFrame 형태로 불러옵니다. DataFrame은 표 형태의 데이터 구조입니다.",
      "tip": "파일 경로는 절대 경로 또는 상대 경로를 사용할 수 있습니다.",
      "flowIcon": "📁",
      "flowLabel": "Excel 읽기",
      "flowDetail": "sales.xlsx",
      "dataframe": {
        "data": [
          ["홍길동", "개발", 5000000],
          ["김철수", "영업", 4500000],
          ["이영희", "개발", 5500000]
        ],
        "columns": ["이름", "부서", "급여"],
        "shape": [3, 3]
      },
      "changes": [
        "Excel 파일이 DataFrame으로 로드되었습니다",
        "3개의 행, 3개의 열"
      ]
    },
    {
      "line": 4,
      "title": "Step 3: 처음 5행 확인",
      "explanation": "df.head()는 DataFrame의 처음 5행을 보여줍니다. 데이터가 제대로 로드되었는지 확인할 때 사용합니다.",
      "tip": "df.head(10)처럼 괄호 안에 숫자를 넣으면 원하는 만큼 볼 수 있습니다.",
      "flowIcon": "👁️",
      "flowLabel": "데이터 미리보기",
      "flowDetail": "head()",
      "dataframe": {
        "data": [
          ["홍길동", "개발", 5000000],
          ["김철수", "영업", 4500000],
          ["이영희", "개발", 5500000]
        ],
        "columns": ["이름", "부서", "급여"],
        "shape": [3, 3]
      }
    },
    {
      "line": 5,
      "title": "Step 4: 데이터 정보 확인",
      "explanation": "df.info()는 데이터의 전체 구조를 보여줍니다. 행 개수, 열 이름, 데이터 타입, 결측치 여부 등을 확인할 수 있습니다.",
      "flowIcon": "ℹ️",
      "flowLabel": "데이터 정보",
      "flowDetail": "info()"
    },
    {
      "line": 6,
      "title": "Step 5: Excel 파일로 저장",
      "explanation": "df.to_excel() 함수로 DataFrame을 새로운 Excel 파일로 저장합니다. index=False는 행 번호를 저장하지 않는 옵션입니다.",
      "tip": "파일이 이미 존재하면 덮어쓰게 됩니다. 주의하세요!",
      "warning": "같은 이름의 파일이 있으면 기존 파일이 사라집니다.",
      "flowIcon": "💾",
      "flowLabel": "Excel 저장",
      "flowDetail": "output.xlsx",
      "changes": [
        "output.xlsx 파일이 생성되었습니다"
      ]
    }
  ],
  "quiz": {
    "question": "DataFrame의 처음 10행을 보려면 어떤 코드를 사용해야 할까요?",
    "options": [
      "df.head()",
      "df.head(10)",
      "df.show(10)",
      "df.first(10)"
    ],
    "correctIndex": 1,
    "explanation": "df.head()는 기본적으로 5행을 보여줍니다. 괄호 안에 숫자를 넣으면 원하는 행 수만큼 볼 수 있습니다."
  }
}
```

---

## 7. 다음 단계

### 7.1 즉시 시작 가능한 작업

1. **샘플 레슨 작성 (우선순위 1)**
   - Lesson 2-1 (pandas Excel 읽기) - 위 JSON 완성
   - Lesson 2-2 (데이터 필터링)
   - Lesson 1-1 (Python 기초)

2. **컴포넌트 구현 (우선순위 2)**
   - `DataFrameTable.tsx` - 테이블 렌더링
   - `DataFlowDiagram.tsx` - 플로우 다이어그램
   - `StepExplanation.tsx` - 설명 렌더링
   - `MobileLessonView.tsx` - 모바일 스와이프

3. **샘플 데이터셋 준비 (우선순위 3)**
   - `sales.xlsx` - 급여 데이터 (3행)
   - `customer.xlsx` - 고객 데이터 (10행)
   - `monthly_sales.csv` - 월간 판매 (12행)

4. **DB 스키마 확장 (우선순위 4)**
   - PythonLesson 테이블 추가?
   - 또는 기존 Lesson 테이블에 `type: 'practical'` 필드 추가?

---

### 7.2 구현 순서 제안

#### Phase 1: 프로토타입 (1-2일)
- [ ] Lesson 2-1 JSON 완성
- [ ] DataFrameTable 컴포넌트 구현
- [ ] 데스크톱 레이아웃 구현
- [ ] 1개 레슨 완성 + 테스트

#### Phase 2: 모바일 UX (1일)
- [ ] MobileLessonView 구현
- [ ] 스와이프 인터랙션
- [ ] 반응형 테스트

#### Phase 3: 콘텐츠 작성 (3-5일)
- [ ] Chapter 1 (3 레슨)
- [ ] Chapter 2 (3 레슨)
- [ ] Chapter 3 (2 레슨)
- [ ] Chapter 4 (1 레슨)

#### Phase 4: 데이터 분석 (2-3일)
- [ ] Chapter 5 (2 레슨)
- [ ] Chapter 6 (2 레슨)
- [ ] Chapter 7 (1 레슨)

#### Phase 5: 통합 & 테스트 (1-2일)
- [ ] DB 통합
- [ ] 진행 상태 저장
- [ ] 전체 테스트

**총 예상 기간**: 8~13일

---

### 7.3 미결정 사항

1. **Python 코드 실행?**
   - 옵션 A: 프론트엔드에서 시뮬레이션만 (JSON에 결과 하드코딩)
   - 옵션 B: 백엔드 Python 실행 환경 구축 (Docker)
   - **추천**: Phase 1은 옵션 A, Phase 2에서 옵션 B 검토

2. **메모리 시각화 vs 데이터 시각화**
   - 기존 C 코스: 메모리 (Stack/Heap)
   - Python 실무: 데이터 플로우 + 테이블
   - **결정**: 데이터 플로우 중심 (이미 확정)

3. **실습 데이터셋 크기**
   - 작게 (3~5행): 모바일에서 보기 좋음
   - 크게 (50~100행): 실무 느낌
   - **추천**: 작게 시작, "더 많은 데이터로 연습하기" 버튼 제공

---

## 8. 참고 자료

### 8.1 조사 문서
- `docs/plans/python-practical-course/RESEARCH.md` - 웹 검색 결과
- `docs/plans/python-practical-course/CURRICULUM.md` - 커리큘럼 구조

### 8.2 외부 참고
- [Automate the Boring Stuff](https://automatetheboringstuff.com/)
- [Real Python - pandas Tutorial](https://realpython.com/pandas-python-explore-dataset/)
- [DataCamp - openpyxl](https://www.datacamp.com/tutorial/openpyxl)
- [python-pptx Documentation](https://python-pptx.readthedocs.io/)

---

## 9. 기대 효과

### 9.1 사용자 관점
- ✅ **빠른 학습**: 7시간이면 업무 자동화 가능
- ✅ **즉시 적용**: 배운 당일 업무에 사용 가능
- ✅ **실무 중심**: Excel/PDF/PPT 자동화
- ✅ **시각적 학습**: 데이터 플로우 + 테이블로 이해 쉬움

### 9.2 프로젝트 관점
- ✅ **타겟 확장**: C 프로그래밍 외 실무자 유입
- ✅ **차별화**: 기존 Python 강의와 다른 접근
- ✅ **콘텐츠 다양화**: 언어별 특화 코스
- ✅ **재방문 유도**: 실무 문제 발생 시 참고용

---

**최종 수정**: 2026-01-15
**다음 리뷰**: Lesson 2-1 샘플 작성 완료 후
