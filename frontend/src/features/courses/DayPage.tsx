/**
 * DayPage - Day 학습 페이지
 *
 * 코드 시뮬레이션 + 메모리 시각화 + 퀴즈 (모달)
 */

import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getDay, getTotalDays, type Language } from '@/data/courses';
import { useCourseProgress } from './hooks/useCourseProgress';
import { useDayNavigation } from './hooks/useDayNavigation';
import { useCourseMemory } from './hooks/useCourseMemory';
import { DayHeader } from './components/day/DayHeader';
import { CodeViewer } from './components/day/CodeViewer';
import { StepExplanation } from './components/day/StepExplanation';
import { StepControls } from './components/day/StepControls';
import { CourseMemoryView } from './components/memory/CourseMemoryView';
import { QuizCard } from './components/quiz/QuizCard';

/**
 * Day를 찾을 수 없을 때 표시
 */
function NotFoundView({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <AlertCircle className="w-16 h-16 text-muted-foreground" />
      <h2 className="text-xl font-semibold">Day를 찾을 수 없습니다</h2>
      <Button onClick={onBack}>코스 목록으로</Button>
    </div>
  );
}

/**
 * Day 완료 후 표시
 */
function CompletedView({
  dayNumber,
  totalDays,
  onNext,
  onBack,
}: {
  dayNumber: number;
  totalDays: number;
  onNext: () => void;
  onBack: () => void;
}) {
  const hasNext = dayNumber < totalDays;

  return (
    <Card className="max-w-md mx-auto mt-12">
      <CardContent className="pt-6 text-center space-y-4">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h2 className="text-2xl font-bold">Day {dayNumber} 완료!</h2>
        <p className="text-muted-foreground">
          {hasNext
            ? `다음 Day로 넘어가서 계속 학습하세요.`
            : `모든 Day를 완료했습니다! 수고하셨습니다.`}
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <Button variant="outline" onClick={onBack}>
            코스 목록
          </Button>
          {hasNext && (
            <Button onClick={onNext} className="gap-1">
              Day {dayNumber + 1}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function DayPage() {
  const { lang, day: dayParam } = useParams<{ lang: string; day: string }>();
  const navigate = useNavigate();

  // 파라미터 파싱
  const language = (lang ?? 'c') as Language;
  const dayNumber = parseInt(dayParam ?? '1', 10);

  // 데이터 로드
  const day = getDay(language, dayNumber);
  const totalDays = getTotalDays(language);
  const { markDayComplete } = useCourseProgress(language);

  // Day가 없으면 에러 표시
  if (!day) {
    return <NotFoundView onBack={() => navigate(`/courses/${language}`)} />;
  }

  // 네비게이션 상태
  const navigation = useDayNavigation(day, markDayComplete);
  const currentStep = day.steps[navigation.currentStepIndex];

  // 메모리 상태
  const { memoryState, changedBlocks } = useCourseMemory(
    day.steps,
    navigation.currentStepIndex
  );

  // 퀴즈 완료 핸들러
  const handleQuizComplete = (isCorrect: boolean) => {
    if (isCorrect) {
      navigation.completeDay();
    }
    // 오답이어도 해설 확인 후 계속 진행 가능 (QuizCard 내부에서 처리)
  };

  // 퀴즈 모달 닫기 (뒤로 가기)
  const handleQuizClose = () => {
    navigation.reset();
  };

  return (
    <div className="container mx-auto py-6 px-4 h-full flex flex-col">
      {/* 헤더 */}
      <DayHeader day={day} onBack={() => navigate(`/courses/${language}`)} />

      {/* Completed Phase */}
      {navigation.phase === 'completed' ? (
        <CompletedView
          dayNumber={dayNumber}
          totalDays={totalDays}
          onNext={() => navigate(`/courses/${language}/${dayNumber + 1}`)}
          onBack={() => navigate(`/courses/${language}`)}
        />
      ) : (
        <>
          {/* 코드 + 메모리 (항상 표시) */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 min-h-0 overflow-hidden">
            {/* 코드 뷰어 */}
            <CodeViewer code={day.code} highlightLine={currentStep.line} />

            {/* 메모리 시각화 */}
            <CourseMemoryView
              stack={memoryState.stack}
              heap={memoryState.heap}
              changedBlocks={changedBlocks}
            />
          </div>

          {/* 설명 */}
          <div className="mt-4">
            <StepExplanation
              explanation={currentStep.explanation}
              stepIndex={navigation.currentStepIndex}
            />
          </div>

          {/* 스텝 컨트롤 */}
          <div className="mt-4">
            <StepControls
              currentStep={navigation.currentStepIndex + 1}
              totalSteps={navigation.totalSteps}
              canGoPrev={navigation.canGoPrev}
              canGoNext={navigation.canGoNext}
              isLastStep={navigation.isLastStep}
              onPrev={navigation.goToPrevStep}
              onNext={navigation.goToNextStep}
              onGoToQuiz={navigation.goToQuiz}
            />
          </div>

          {/* Quiz Modal - 코드/메모리 위에 오버레이 */}
          <Dialog open={navigation.phase === 'quiz'} onOpenChange={(open) => !open && handleQuizClose()}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  🧠 퀴즈
                </DialogTitle>
              </DialogHeader>
              <QuizCard quiz={day.quiz} onComplete={handleQuizComplete} />
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
