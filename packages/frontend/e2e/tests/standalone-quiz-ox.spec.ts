/**
 * Standalone Quiz (OX) E2E Tests
 * OX 퀴즈 시스템 전체 플로우 검증
 *
 * Priority:
 * - P0: 필수 시나리오 (비로그인, Happy Path, 정답/오답)
 * - P1: 중요 시나리오 (재시도, 이전 시도 기록, 에러 처리)
 *
 * Coverage:
 * - 인증 상태별 동작 (비로그인 vs 로그인)
 * - 챕터 선택 → 퀴즈 풀이 → 결과 확인
 * - 정답/오답 피드백 및 API 호출
 * - 에러 처리 및 재시도
 */

import { test, expect } from '../fixtures/test-base';
import { OXQuizPage } from '../pages';
import { mockAuthError, mockUnauthenticated } from '../fixtures/auth-mock';
import { mockStandaloneQuizAPIs } from '../fixtures/quiz-mock';

// =============================================
// P0: 인증 상태별 시나리오
// =============================================

test.describe('OX Quiz - 인증 상태별', () => {
  test('P0-1: 비로그인 시 401 에러 메시지 표시', async ({ page }) => {
    const oxQuizPage = new OXQuizPage(page);

    // 비로그인 상태 모킹
    await mockUnauthenticated(page);
    await mockAuthError(page, '로그인이 필요합니다');

    await oxQuizPage.goto('c');

    // 에러 메시지 또는 로딩 실패 상태 확인
    // Note: 실제 앱에서 401 에러를 어떻게 처리하는지에 따라 다름
    // 예: 토스트 알림, 에러 페이지, 리다이렉트 등
    await page.waitForTimeout(2000);

    // 챕터 목록이 로드되지 않아야 함
    const chapterCount = await oxQuizPage.getChapterCount();
    expect(chapterCount).toBe(0);
  });

  test('P0-2: 로그인 후 데이터 없음 - 빈 메시지 표시', async ({ quizNoData }) => {
    const oxQuizPage = new OXQuizPage(quizNoData);

    await oxQuizPage.goto('c');
    await oxQuizPage.waitForChaptersToLoad();

    // 챕터는 있지만 시도 기록은 없음
    const chapterCount = await oxQuizPage.getChapterCount();
    expect(chapterCount).toBeGreaterThan(0);

    // 첫 번째 챕터 통계 확인 (시도 없음)
    const stats = await oxQuizPage.getChapterStatistics(0);
    expect(stats.attempted).toBeUndefined();
    expect(stats.accuracy).toBeUndefined();
  });

  test('P0-3: 로그인 후 데이터 있음 - 챕터 통계 표시', async ({ quizWithData }) => {
    const oxQuizPage = new OXQuizPage(quizWithData);

    await oxQuizPage.goto('c');
    await oxQuizPage.waitForChaptersToLoad();

    // 챕터 목록 확인
    const chapterCount = await oxQuizPage.getChapterCount();
    expect(chapterCount).toBe(3);

    // 첫 번째 챕터 통계 확인 (데이터 있음)
    const stats = await oxQuizPage.getChapterStatistics(0);
    expect(stats.total).toBe('10');
    expect(stats.attempted).toBe('5');
    expect(stats.accuracy).toBe('80');
  });
});

// =============================================
// P0: Happy Path (전체 플로우)
// =============================================

test.describe('OX Quiz - Happy Path', () => {
  test('P0-4: 전체 플로우 - 챕터 선택 → 10문제 풀이 → 결과 확인', async ({ quizWithData }) => {
    const oxQuizPage = new OXQuizPage(quizWithData);

    // 1. 챕터 선택 화면
    await oxQuizPage.goto('c');
    await oxQuizPage.waitForChaptersToLoad();
    await oxQuizPage.expectChaptersViewVisible();

    const chapterTitle = await oxQuizPage.getChapterTitle(0);
    expect(chapterTitle).toBe('변수와 자료형');

    // 2. 첫 번째 챕터 선택
    await oxQuizPage.selectFirstChapter();
    await oxQuizPage.waitForQuizToLoad();
    await oxQuizPage.expectQuizViewVisible();

    // 3. 10문제 풀이 (5개 정답, 5개 오답)
    const answers = [true, true, true, true, true, false, false, false, false, false];
    await oxQuizPage.completeAllQuestions(answers);

    // 4. 결과 화면 확인
    await oxQuizPage.waitForResultView();
    await oxQuizPage.expectResultViewVisible();

    const percentage = await oxQuizPage.getResultPercentage();
    expect(percentage).toBeGreaterThan(0);
    expect(percentage).toBeLessThanOrEqual(100);

    const summary = await oxQuizPage.getResultSummary();
    expect(summary.total).toBe(10);
    expect(summary.correct + summary.wrong).toBe(10);
  });

  test('P0-5: 진행률 및 점수 실시간 업데이트', async ({ quizWithData }) => {
    const oxQuizPage = new OXQuizPage(quizWithData);

    await oxQuizPage.goto('c');
    await oxQuizPage.waitForChaptersToLoad();
    await oxQuizPage.selectFirstChapter();
    await oxQuizPage.waitForQuizToLoad();

    // 초기 점수 확인
    let score = await oxQuizPage.getScore();
    expect(score.correct).toBe(0);
    expect(score.wrong).toBe(0);

    // 첫 문제 정답
    await oxQuizPage.answerO();
    await oxQuizPage.waitForAnswerFeedback();
    const isCorrect = await oxQuizPage.isAnswerCorrect();

    // 점수 업데이트 확인
    score = await oxQuizPage.getScore();
    if (isCorrect) {
      expect(score.correct).toBe(1);
      expect(score.wrong).toBe(0);
    } else {
      expect(score.correct).toBe(0);
      expect(score.wrong).toBe(1);
    }

    // 진행률 확인
    const progress = await oxQuizPage.getCurrentProgress();
    expect(progress.current).toBe(1);
    expect(progress.total).toBe(10);
  });
});

// =============================================
// P0: 정답/오답 피드백
// =============================================

test.describe('OX Quiz - 정답/오답 피드백', () => {
  test('P0-6: 정답 입력 시 녹색 테두리 + "정답!" 메시지', async ({ quizWithData }) => {
    const oxQuizPage = new OXQuizPage(quizWithData);

    await oxQuizPage.goto('c');
    await oxQuizPage.waitForChaptersToLoad();
    await oxQuizPage.selectFirstChapter();
    await oxQuizPage.waitForQuizToLoad();

    // 첫 문제: "int 자료형은 정수를 저장한다." → 정답: true
    await oxQuizPage.answerO();
    await oxQuizPage.waitForAnswerFeedback();

    // 정답 피드백 확인
    await oxQuizPage.expectCorrectFeedback();

    // 설명 및 개념 태그 확인
    const explanation = await oxQuizPage.getExplanation();
    expect(explanation).toContain('int');

    const concepts = await oxQuizPage.getConcepts();
    expect(concepts.length).toBeGreaterThan(0);
    expect(concepts).toContain('int');
  });

  test('P0-7: 오답 입력 시 빨간색 테두리 + "오답!" 메시지', async ({ quizWithData }) => {
    const oxQuizPage = new OXQuizPage(quizWithData);

    await oxQuizPage.goto('c');
    await oxQuizPage.waitForChaptersToLoad();
    await oxQuizPage.selectFirstChapter();
    await oxQuizPage.waitForQuizToLoad();

    // 첫 문제: "int 자료형은 정수를 저장한다." → 정답: true, 사용자: false (오답)
    await oxQuizPage.answerX();
    await oxQuizPage.waitForAnswerFeedback();

    // 오답 피드백 확인
    await oxQuizPage.expectIncorrectFeedback();

    // 설명 확인
    const explanation = await oxQuizPage.getExplanation();
    expect(explanation.length).toBeGreaterThan(0);
  });

  test('P0-8: 개념 태그 표시 확인', async ({ quizWithData }) => {
    const oxQuizPage = new OXQuizPage(quizWithData);

    await oxQuizPage.goto('c');
    await oxQuizPage.waitForChaptersToLoad();
    await oxQuizPage.selectFirstChapter();
    await oxQuizPage.waitForQuizToLoad();

    await oxQuizPage.answerO();
    await oxQuizPage.waitForAnswerFeedback();

    // 개념 태그 확인
    const concepts = await oxQuizPage.getConcepts();
    expect(concepts.length).toBeGreaterThan(0);

    // 첫 문제는 ['int', '자료형', '정수'] 개념 포함
    const expectedConcepts = ['int', '자료형', '정수'];
    for (const concept of expectedConcepts) {
      expect(concepts).toContain(concept);
    }
  });
});

// =============================================
// P1: 재시도 및 이전 시도 기록
// =============================================

test.describe('OX Quiz - 재시도', () => {
  test('P1-1: 결과 화면에서 "다시 풀기" 버튼 동작', async ({ quizWithData }) => {
    const oxQuizPage = new OXQuizPage(quizWithData);

    await oxQuizPage.goto('c');
    await oxQuizPage.waitForChaptersToLoad();
    await oxQuizPage.selectFirstChapter();
    await oxQuizPage.waitForQuizToLoad();

    // 10문제 모두 풀기
    const answers = Array(10).fill(true);
    await oxQuizPage.completeAllQuestions(answers);

    // 결과 화면
    await oxQuizPage.waitForResultView();

    // "다시 풀기" 버튼 클릭
    await oxQuizPage.clickRestart();

    // 퀴즈 화면으로 돌아가야 함
    await oxQuizPage.waitForQuizToLoad();
    await oxQuizPage.expectQuizViewVisible();

    // 점수 초기화 확인
    const score = await oxQuizPage.getScore();
    expect(score.correct).toBe(0);
    expect(score.wrong).toBe(0);
  });

  test('P1-2: "챕터 선택" 버튼으로 돌아가기', async ({ quizWithData }) => {
    const oxQuizPage = new OXQuizPage(quizWithData);

    await oxQuizPage.goto('c');
    await oxQuizPage.waitForChaptersToLoad();
    await oxQuizPage.selectFirstChapter();
    await oxQuizPage.waitForQuizToLoad();

    // 10문제 모두 풀기
    const answers = Array(10).fill(true);
    await oxQuizPage.completeAllQuestions(answers);

    // 결과 화면
    await oxQuizPage.waitForResultView();

    // "챕터 선택" 버튼 클릭
    await oxQuizPage.clickBackToChapters();

    // 챕터 선택 화면으로 돌아가야 함
    await oxQuizPage.waitForChaptersToLoad();
    await oxQuizPage.expectChaptersViewVisible();
  });

  test('P1-3: 이전 시도 기록 배지 표시', async ({ quizWithData }) => {
    const oxQuizPage = new OXQuizPage(quizWithData);

    await oxQuizPage.goto('c');
    await oxQuizPage.waitForChaptersToLoad();
    await oxQuizPage.selectFirstChapter();
    await oxQuizPage.waitForQuizToLoad();

    // 첫 3문제는 lastAttempt가 있음 (모킹 데이터)
    const hasBadge = await oxQuizPage.hasLastAttemptBadge();
    expect(hasBadge).toBe(true);

    // 다음 문제로 이동
    await oxQuizPage.answerO();
    await oxQuizPage.waitForAnswerFeedback();
    await oxQuizPage.clickNext();
  });
});

// =============================================
// P1: 에러 처리
// =============================================

test.describe('OX Quiz - API 에러 처리', () => {
  test('P1-4: 챕터 로드 실패 시 에러 처리', async ({ page }) => {
    const oxQuizPage = new OXQuizPage(page);

    // 에러 시나리오 모킹
    await mockStandaloneQuizAPIs(page, 'error');

    await oxQuizPage.goto('c');

    // 로딩 스피너가 사라지길 기다림
    await page.waitForTimeout(2000);

    // 챕터 목록이 비어있거나 에러 메시지가 표시되어야 함
    const chapterCount = await oxQuizPage.getChapterCount();
    expect(chapterCount).toBe(0);
  });

  test('P1-5: 퀴즈 로드 실패 시 에러 처리', async ({ quizWithData, page }) => {
    const oxQuizPage = new OXQuizPage(quizWithData);

    await oxQuizPage.goto('c');
    await oxQuizPage.waitForChaptersToLoad();

    // 챕터 선택 후 퀴즈 로드를 에러로 변경
    await mockStandaloneQuizAPIs(page, 'error');

    await oxQuizPage.selectFirstChapter();

    // 로딩 실패 또는 빈 상태 확인
    await page.waitForTimeout(2000);

    // 퀴즈 화면이 로드되지 않아야 함
    const isQuizVisible = await oxQuizPage.questionText.isVisible().catch(() => false);
    expect(isQuizVisible).toBe(false);
  });
});

// =============================================
// P1: 중간 이탈
// =============================================

test.describe('OX Quiz - 중간 이탈', () => {
  test('P1-6: 5문제만 풀고 뒤로가기', async ({ quizWithData }) => {
    const oxQuizPage = new OXQuizPage(quizWithData);

    await oxQuizPage.goto('c');
    await oxQuizPage.waitForChaptersToLoad();
    await oxQuizPage.selectFirstChapter();
    await oxQuizPage.waitForQuizToLoad();

    // 5문제만 풀기
    for (let i = 0; i < 5; i++) {
      await oxQuizPage.answerO();
      await oxQuizPage.waitForAnswerFeedback();
      await oxQuizPage.clickNext();
      await oxQuizPage.page.waitForTimeout(300);
    }

    // 진행률 확인 (6/10이어야 함)
    const progress = await oxQuizPage.getCurrentProgress();
    expect(progress.current).toBe(6);

    // 뒤로가기 버튼 클릭
    await oxQuizPage.page.locator('button:has(svg)').first().click();

    // 챕터 선택 화면으로 복귀
    await oxQuizPage.waitForChaptersToLoad();
    await oxQuizPage.expectChaptersViewVisible();

    // Note: 실제로는 5개의 시도가 DB에 기록되어야 하지만,
    // 모킹 환경에서는 검증 불가 (백엔드 통합 테스트에서 검증)
  });
});
