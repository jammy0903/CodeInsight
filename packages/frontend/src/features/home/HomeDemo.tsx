/**
 * HomeDemo - 홈 첫 화면의 실행 시각화 데모
 *
 * WHY: 방문자가 아무것도 누르지 않아도 핵심(실행 엔진 + 시각화)을 바로 보게 한다.
 * - 데이터는 scripts/record-home-demo.mjs로 녹화한 실제 시뮬레이터/레슨 결과
 *   → 백엔드 콜드 스타트 없이 즉시 재생
 * - 재생은 Playground/레슨과 같은 변환 함수와 LessonFlowVisualizer를 그대로 사용
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { LessonFlowVisualizer } from '@/features/visualizers';
import { CodeMirrorEditor, useLessonTerminal } from '@/features/visualizers/shared';
import { toPythonLessonSteps } from '@/services/simulator/pythonSimulator';
import { resolveStepLines } from '@/features/courses/utils/resolveStepLines';
import { useThemeStore } from '@/stores/themeStore';
import type { LessonStep } from '@/types';
import type { SupportedLanguage } from '@/types/simulator';
import recordings from './demo/recordings.json';

type DemoId = 'python' | 'javascript';

interface DemoSample {
  id: DemoId;
  language: SupportedLanguage;
  code: string;
  steps: LessonStep[];
}

const AUTOPLAY_INTERVAL_MS = 2600;

const SAMPLES: DemoSample[] = [
  {
    id: 'python',
    language: 'python',
    code: recordings.python.code,
    steps: toPythonLessonSteps(recordings.python.steps as unknown as Parameters<typeof toPythonLessonSteps>[0]),
  },
  {
    id: 'javascript',
    language: 'javascript',
    code: recordings.javascript.code,
    steps: resolveStepLines(recordings.javascript.steps as LessonStep[], recordings.javascript.code),
  },
];

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function HomeDemo() {
  const { t } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const [sampleId, setSampleId] = useState<DemoId>('python');
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());

  const sample = useMemo(() => SAMPLES.find((s) => s.id === sampleId) ?? SAMPLES[0], [sampleId]);
  const total = sample.steps.length;
  const step = sample.steps[stepIndex];
  const captions = t(`home.demo.${sample.id}_steps`, { returnObjects: true }) as string[];
  const outputLines = useLessonTerminal({
    steps: sample.steps,
    currentStepIndex: stepIndex,
    languageId: sample.language,
    diffMode: false,
  });

  // 자동 재생: 마지막 단계 다음에는 처음으로 돌아간다
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setStepIndex((i) => (i + 1) % total);
    }, AUTOPLAY_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [playing, total]);

  const selectSample = useCallback((id: DemoId) => {
    setSampleId(id);
    setStepIndex(0);
  }, []);

  // 사용자가 직접 넘기면 자동 재생을 멈춘다
  const goPrev = useCallback(() => {
    setPlaying(false);
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);
  const goNext = useCallback(() => {
    setPlaying(false);
    setStepIndex((i) => Math.min(total - 1, i + 1));
  }, [total]);

  return (
    <section className="w-full max-w-6xl mx-auto px-4 relative z-10" aria-label={t('home.demo.title')}>
      <div className="text-center mb-5">
        <h2 className="text-2xl md:text-3xl font-bold home-title">{t('home.demo.title')}</h2>
        <p className="text-sm md:text-base mt-2 home-text-muted">{t('home.demo.subtitle')}</p>
      </div>

      <div className="rounded-2xl border overflow-hidden shadow-lg bg-[var(--theme-lesson-panel-bg)] border-[var(--theme-lesson-panel-border)]">
        {/* 예제 탭 */}
        <div role="tablist" className="flex gap-1 p-2 border-b border-[var(--theme-lesson-panel-border)]">
          {SAMPLES.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={s.id === sampleId}
              onClick={() => selectSample(s.id)}
              className={`px-3 py-1.5 text-xs md:text-sm font-semibold rounded-full transition-all ${
                s.id === sampleId ? 'bg-[var(--theme-dashboard-accent)] text-white' : 'opacity-60 hover:opacity-90'
              }`}
            >
              {t(`home.demo.tab_${s.id}`)}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {/* 코드 + 캡션 */}
          <div className="flex flex-col border-b md:border-b-0 md:border-r border-[var(--theme-lesson-panel-border)]">
            <CodeMirrorEditor
              code={sample.code}
              language={sample.language}
              highlightLine={step?.line || 1}
              className="text-left"
            />
            <p className="px-4 py-3 text-sm leading-relaxed text-left min-h-[4.5rem] border-t border-[var(--theme-lesson-panel-border)]" aria-live="polite">
              <span className="font-mono text-xs opacity-60 mr-2">{stepIndex + 1}/{total}</span>
              {captions[stepIndex] ?? ''}
            </p>
            <div className="px-4 py-2 font-mono text-xs text-left border-t border-[var(--theme-lesson-panel-border)] min-h-[2.25rem]">
              <span className="opacity-50 mr-2">{t('home.demo.output')}</span>
              {outputLines.map((line) => line.content).join('  ')}
            </div>
          </div>

          {/* 시각화 */}
          <div className="h-[360px] md:h-[420px] overflow-auto">
            <LessonFlowVisualizer
              step={step}
              prevStep={stepIndex > 0 ? sample.steps[stepIndex - 1] : null}
              language={sample.language}
              fullCode={sample.code}
              theme={theme === 'dark' ? 'dark' : 'light'}
              stdout={step?.stdout}
            />
          </div>
        </div>

        {/* 재생 컨트롤 */}
        <div className="flex items-center justify-between gap-3 px-3 py-2 border-t border-[var(--theme-lesson-panel-border)]">
          <div className="flex items-center gap-1">
            <button type="button" onClick={goPrev} disabled={stepIndex === 0} aria-label={t('home.demo.prev')} className="p-2 rounded-md disabled:opacity-30 hover:bg-black/5">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? t('home.demo.pause') : t('home.demo.play')} className="p-2 rounded-md hover:bg-black/5">
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button type="button" onClick={goNext} disabled={stepIndex === total - 1} aria-label={t('home.demo.next')} className="p-2 rounded-md disabled:opacity-30 hover:bg-black/5">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 진행 표시 */}
          <div className="flex-1 flex gap-1 max-w-xs">
            {sample.steps.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i + 1}/${total}`}
                onClick={() => { setPlaying(false); setStepIndex(i); }}
                className={`h-1.5 flex-1 rounded-full transition-colors ${i <= stepIndex ? 'bg-[var(--theme-dashboard-accent)]' : 'bg-black/10'}`}
              />
            ))}
          </div>

          <Link to="/playground" className="text-xs md:text-sm font-semibold inline-flex items-center gap-1 no-underline hover:underline whitespace-nowrap">
            {t('home.demo.try_it')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
