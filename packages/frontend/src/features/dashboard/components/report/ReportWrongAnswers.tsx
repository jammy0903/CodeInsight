/**
 * ReportWrongAnswers - PDF report recent wrong answers table
 */

import { XCircle } from 'lucide-react';

interface WrongAnswer {
  quizId: string;
  question?: string;
  userAnswer: string;
  createdAt: string;
}

interface ReportWrongAnswersProps {
  answers: WrongAnswer[];
}

export function ReportWrongAnswers({ answers }: ReportWrongAnswersProps) {
  if (!answers || answers.length === 0) {
    return null;
  }

  // Take latest 10
  const recentAnswers = answers.slice(0, 10);

  return (
    <div className="keep-together mb-8">
      <div className="flex items-center gap-2 mb-4">
        <XCircle className="w-5 h-5 text-red-500" />
        <h2 className="text-lg font-semibold text-gray-800">최근 오답 기록</h2>
        <span className="text-sm text-gray-500">({recentAnswers.length}개)</span>
      </div>

      <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="text-left px-4 py-2 font-medium text-gray-700">문제</th>
              <th className="text-left px-4 py-2 font-medium text-gray-700">내 답변</th>
              <th className="text-left px-4 py-2 font-medium text-gray-700">일시</th>
            </tr>
          </thead>
          <tbody>
            {recentAnswers.map((answer, index) => {
              const date = new Date(answer.createdAt);
              const dateStr = date.toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
              });
              const timeStr = date.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <tr
                  key={`${answer.quizId}-${index}`}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  <td className="px-4 py-2 text-gray-800">
                    {answer.question || `Quiz #${answer.quizId.slice(-6)}`}
                  </td>
                  <td className="px-4 py-2 text-red-600">{answer.userAnswer}</td>
                  <td className="px-4 py-2 text-gray-500">
                    {dateStr} {timeStr}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        * 오답 문제를 다시 풀어보세요. 같은 실수를 반복하지 않는 것이 중요합니다.
      </p>
    </div>
  );
}
