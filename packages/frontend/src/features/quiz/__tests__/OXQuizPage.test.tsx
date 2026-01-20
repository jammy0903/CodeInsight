/**
 * OXQuizPage Integration Test
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { OXQuizPage } from '../OXQuizPage';

// Mock the useStore hook as it's used in a child component (QuizPage) which is not rendered here
// but good practice if it was a dependency. Let's assume it might be needed.
vi.mock('@/stores/store', () => ({
  useStore: vi.fn(() => ({
    setPageTitle: vi.fn(),
  })),
}));

describe('OXQuizPage with Timer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  const renderComponent = () => {
    render(
      <MemoryRouter initialEntries={['/quiz/ox/c']}>
        <Routes>
          <Route path="/quiz/ox/:lang" element={<OXQuizPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('should show results when timer runs out', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderComponent();

    // 1. 챕터 선택
    const chapterButton = await screen.findByText('변수와 자료형');
    await user.click(chapterButton);

    // 2. 퀴즈 화면으로 전환되었는지 확인
    const question = await screen.findByText('int 자료형은 정수를 저장한다.');
    expect(question).toBeInTheDocument();

    // 3. 타이머가 5초로 시작하는지 확인
    const timerText = await screen.findByText('5s');
    expect(timerText).toBeInTheDocument();

    // 4. 시간 초과 시뮬레이션
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    // 5. 타이머가 만료되면 퀴즈 결과 페이지 대신 현재 문제에 대한 '오답' 상태가 표시되는지 확인
    const incorrectText = await screen.findByText('오답!');
    expect(incorrectText).toBeInTheDocument();

    const explanation = await screen.findByText('int는 integer의 약자로 정수를 저장하는 자료형입니다.');
    expect(explanation).toBeInTheDocument();

    // 틀린 문제 개수가 증가했는지 확인 (초기 0에서 1로)
    const wrongCountText = await screen.findByText(/틀림\s+1/);
    expect(wrongCountText).toBeInTheDocument();

    // '다음 문제' 버튼이 나타났는지 확인
    const nextButton = await screen.findByText('다음 문제');
    expect(nextButton).toBeInTheDocument();

    // 퀴즈 결과 페이지가 나타나지 않았는지 확인
    expect(screen.queryByText('퀴즈 결과')).not.toBeInTheDocument();
  });
});
