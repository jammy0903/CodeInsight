/**
 * Standalone Quiz Report E2E Tests
 * 리포트 페이지의 퀴즈 취약 개념 섹션 검증
 *
 * Priority: P0 (필수)
 *
 * Coverage:
 * - 취약 개념 Top 5 표시
 * - 언어별 탭 전환
 * - "이 개념 다시 풀기" 버튼으로 퀴즈 페이지 이동
 * - 데이터 없을 때 메시지 표시
 */

import { test, expect } from '../fixtures/test-base';
import { ReportPage, OXQuizPage } from '../pages';

// =============================================
// P0: 리포트 페이지 - 취약 개념
// =============================================

test.describe('Report Page - 퀴즈 취약 개념', () => {
  test('P0-1: 리포트 페이지 접근 및 퀴즈 섹션 표시', async ({ quizWithData }) => {
    const reportPage = new ReportPage(quizWithData);

    await reportPage.goto();

    // 퀴즈 섹션까지 스크롤
    await reportPage.scrollToQuizSection();
    await reportPage.waitForWeakConceptsToLoad();

    // 퀴즈 섹션 타이틀 확인
    await reportPage.expectQuizSectionVisible();
  });

  test('P0-2: 데이터 있음 - 취약 개념 Top 5 표시', async ({ quizWithData }) => {
    const reportPage = new ReportPage(quizWithData);

    await reportPage.goto();
    await reportPage.scrollToQuizSection();
    await reportPage.waitForWeakConceptsToLoad();

    // C 언어 탭 선택 (기본값일 수도 있음)
    await reportPage.selectLanguageC();

    // 취약 개념 카드 개수 확인 (최대 5개, 모킹 데이터는 3개)
    const count = await reportPage.getWeakConceptsCount();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(5);

    // 첫 번째 개념 정보 확인
    const info = await reportPage.getWeakConceptInfo(0);
    expect(info.concept).toBe('포인터');
    expect(parseInt(info.errorRate)).toBeGreaterThan(0);
    expect(parseInt(info.attempts)).toBeGreaterThan(0);
  });

  test('P0-3: 데이터 없음 - 빈 메시지 표시', async ({ quizNoData }) => {
    const reportPage = new ReportPage(quizNoData);

    await reportPage.goto();
    await reportPage.scrollToQuizSection();
    await reportPage.waitForWeakConceptsToLoad();

    // C 언어 탭 선택
    await reportPage.selectLanguageC();

    // 빈 메시지 확인
    const hasNoData = await reportPage.hasNoData();
    expect(hasNoData).toBe(true);

    // 또는 카드가 0개
    const count = await reportPage.getWeakConceptsCount();
    expect(count).toBe(0);
  });

  test('P0-4: 취약 개념 카드에 오답률 및 시도 횟수 표시', async ({ quizWithData }) => {
    const reportPage = new ReportPage(quizWithData);

    await reportPage.goto();
    await reportPage.scrollToQuizSection();
    await reportPage.waitForWeakConceptsToLoad();

    await reportPage.selectLanguageC();

    const count = await reportPage.getWeakConceptsCount();
    expect(count).toBeGreaterThan(0);

    // 모든 카드의 정보 확인
    for (let i = 0; i < count; i++) {
      const info = await reportPage.getWeakConceptInfo(i);

      // 개념 이름이 있어야 함
      expect(info.concept.length).toBeGreaterThan(0);

      // 오답률이 0~100 사이여야 함
      const errorRate = parseInt(info.errorRate);
      expect(errorRate).toBeGreaterThanOrEqual(0);
      expect(errorRate).toBeLessThanOrEqual(100);

      // 시도 횟수가 0보다 커야 함
      const attempts = parseInt(info.attempts);
      expect(attempts).toBeGreaterThan(0);
    }
  });

  test('P0-5: 오답률 높은 순으로 정렬', async ({ quizWithData }) => {
    const reportPage = new ReportPage(quizWithData);

    await reportPage.goto();
    await reportPage.scrollToQuizSection();
    await reportPage.waitForWeakConceptsToLoad();

    await reportPage.selectLanguageC();

    const count = await reportPage.getWeakConceptsCount();
    if (count < 2) {
      // 카드가 1개 이하면 정렬 검증 불가
      return;
    }

    // 첫 번째와 두 번째 개념의 오답률 비교
    const info1 = await reportPage.getWeakConceptInfo(0);
    const info2 = await reportPage.getWeakConceptInfo(1);

    const errorRate1 = parseInt(info1.errorRate);
    const errorRate2 = parseInt(info2.errorRate);

    // 첫 번째가 두 번째보다 오답률이 높거나 같아야 함
    expect(errorRate1).toBeGreaterThanOrEqual(errorRate2);

    // 모킹 데이터: 포인터(67%) > 비트연산자(60%) > 논리연산자(42%)
    expect(info1.concept).toBe('포인터');
    expect(info2.concept).toBe('비트연산자');
  });
});

// =============================================
// P0: "이 개념 다시 풀기" 버튼
// =============================================

test.describe('Report Page - 이 개념 다시 풀기', () => {
  test('P0-6: "이 개념 다시 풀기" 버튼 클릭 시 퀴즈 페이지로 이동', async ({ quizWithData }) => {
    const reportPage = new ReportPage(quizWithData);

    await reportPage.goto();
    await reportPage.scrollToQuizSection();
    await reportPage.waitForWeakConceptsToLoad();

    await reportPage.selectLanguageC();

    // 첫 번째 취약 개념의 "다시 풀기" 버튼 클릭
    await reportPage.clickRetryConceptButton(0);

    // OX 퀴즈 페이지로 이동되어야 함
    await quizWithData.waitForURL('**/quiz/ox/c', { timeout: 5000 });

    // OX 퀴즈 페이지 확인
    const oxQuizPage = new OXQuizPage(quizWithData);
    await oxQuizPage.waitForChaptersToLoad();
    await oxQuizPage.expectChaptersViewVisible();

    // Note: 실제 앱에서는 특정 개념으로 필터링된 퀴즈를 로드할 수 있음
    // 현재 모킹에서는 챕터 선택 화면으로 이동만 확인
  });
});

// =============================================
// P1: 언어 탭 전환 (추후 구현 시)
// =============================================

test.describe('Report Page - 언어 탭 전환', () => {
  test.skip('P1-1: Java 탭 전환', async ({ quizWithData }) => {
    // TODO: Java 퀴즈 데이터 모킹 필요
    const reportPage = new ReportPage(quizWithData);

    await reportPage.goto();
    await reportPage.scrollToQuizSection();
    await reportPage.waitForWeakConceptsToLoad();

    // Java 탭 선택
    await reportPage.selectLanguage('Java');

    // Java 취약 개념 표시 확인
    const count = await reportPage.getWeakConceptsCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test.skip('P1-2: Python 탭 전환', async ({ quizWithData }) => {
    // TODO: Python 퀴즈 데이터 모킹 필요
  });

  test.skip('P1-3: JavaScript 탭 전환', async ({ quizWithData }) => {
    // TODO: JavaScript 퀴즈 데이터 모킹 필요
  });
});
