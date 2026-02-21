# Python 레슨 남은 작업 계획서

## 현재 상태
- Python 레슨 JSON 파싱: 전체 통과(63개 파일)
- 금지 패턴 재스캔(`Core concept for`, `____|`, `%lu`, `Random!`): 미검출
- 구조 이슈 탐지:
  - `visualizationType: "pythonMemory"`인데 `pythonMemoryState` 누락 4건 → 수정 완료
- 설명 밀도 점검(초벌):
  - 전체 step 606개, 평균 길이 약 554자
  - 900자 이상 과밀 설명 0개 (최대 898자)

## 남은 할 일
1. 구조 이슈 우선 수정
- `pythonMemoryState` 누락 4건 보완 (완료)

2. 설명 과밀도 리라이팅
- 900자 이상 step 우선 압축 작업 완료(0건)
- 과도한 반복 패턴 축소 반영 완료:
  - 장문 비유 반복 축소
  - 과도한 내부 구현 디테일 축소
  - 동일 경고/주의 문구 중복 축소

3. 수동 QA 샘플 검수
- 챕터 1~15에서 각 챕터 1개씩(최소 15개) 읽기 흐름/톤/용어 일관성 확인 완료
- 특히 예외 처리, OOP, 비동기, 고급 함수형(컴프리헨션/reduce/lambda) 챕터 집중 점검 완료

4. 시각화 동작 회귀 확인
- 레슨 페이지에서 `previous/next/quiz` 네비게이션과 단계 코드/설명 매칭 확인 완료
- `pythonMemory` 스텝에서 이름/객체/출력 렌더링 누락 여부 확인 완료
- Playwright 회귀:
  - chromium: `lesson.spec.ts` 13/13 통과
  - mobile: 의존성 설치 후 단일 워커(`--workers=1`) 13/13 통과
  - mobile 병렬 실행은 버튼 클릭 타이밍 플래키 3건 관찰(기능 회귀로 분류하지 않음)
- 모바일/데스크톱 사이드바 `신고하기` 버튼:
  - 현재 검증 화면에서는 `신고하기` 노출 대신 `Contact` 노출 상태 확인
  - 겹침 이슈 재현 없음

5. 변경분 검토 및 커밋
- `packages/backend/prisma/content/python/lessons` 변경분 diff 리뷰 및 커밋 완료
- 커밋: `chore(content): tighten Python lesson explanations and memory states`
- 추가 E2E 보정 커밋: LessonPage POM 셀렉터/대기 로직 정합화

## 완료 기준(Definition of Done)
- `pythonMemoryState` 누락 4건 수정 완료
- Python 레슨 JSON 파싱/패턴 스캔 모두 통과
- QA 샘플 검수 완료 및 치명적 이슈 0건
- 레슨 페이지 UI/시각화 회귀 이슈 0건
- 변경분 커밋 완료
