/**
 * HomePage - Linear 스타일 미니멀 랜딩
 *
 * 구조:
 * 1. Hero (매트릭스 초록비 배경)
 *    - CodeInsight 제목
 *    - 부제
 *    - CTA 버튼
 *    - 실행 시각화 데모 (HomeDemo)
 * 2. CTA 버튼
 */

import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/stores/themeStore';
import { useStore } from '@/stores/store';
import { useMemo, useEffect } from 'react';
import { MatrixRain } from './MatrixRain';
import { HomeDemo } from './HomeDemo';

export default function HomePage() {
  const { t } = useTranslation();
  const currentTheme = useThemeStore((s) => s.theme);
  const setPageTitle = useStore((s) => s.setPageTitle);

  // 페이지 제목 초기화 (홈페이지는 빈 문자열 = 로고만 표시)
  useEffect(() => {
    setPageTitle('');
  }, [setPageTitle]);

  // CSS 변수에서 매트릭스 색상 가져오기
  const matrixColor = useMemo(() => {
    void currentTheme;
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--theme-home-matrix-color')
      .trim();
  }, [currentTheme]);

  return (
    <main className="min-h-screen w-full home-hero">
      {/* Hero + Value Proposition - 매트릭스 비가 내리는 영역 */}
      <div className="relative overflow-hidden home-hero">
        {/* 매트릭스 배경 애니메이션 - 전체 영역 커버 */}
        <MatrixRain color={matrixColor} fontSize={14} speed={40} />

        {/* Hero Section */}
        <section className="w-full flex flex-col items-center relative py-12">
          <div className="text-center relative z-10" style={{ marginTop: '30px' }}>
            {/* 큰 제목 */}
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight home-title">
              CodeInsight
            </h1>

            {/* 부제 */}
            <p className="text-lg md:text-xl home-subtitle" style={{ marginTop: '12px' }}>
              {t('home.hero_subtitle')}
            </p>

            {/* CTA 버튼 */}
            <div className="flex items-center justify-center gap-4" style={{ marginTop: '32px' }}>
              <Link to="/courses">
                <button className="btn-primary px-8 py-4 rounded-lg inline-flex items-center gap-2 text-base">
                  {t('home.browse_courses')}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <Link to="/playground">
                <button className="btn-secondary px-8 py-4 rounded-lg inline-flex items-center gap-2 text-base">
                  <Play className="w-5 h-5" />
                  {t('nav.playground')}
                </button>
              </Link>
            </div>
          </div>

          {/* 실행 시각화 데모 - 녹화된 실제 엔진 결과를 자동 재생 */}
          <div className="w-full" style={{ marginTop: '56px' }}>
            <HomeDemo />
          </div>

          {/* 스크롤 표시 */}
          <div className="flex flex-col items-center gap-2 animate-bounce mt-16 mb-8 home-text-muted">
            <span className="text-sm">scroll</span>
            <ChevronDown className="w-5 h-5" />
          </div>
        </section>

      </div>

      {/* 마지막 CTA */}
      <section
        className="w-full grid place-items-center px-6 home-section"
        style={{ paddingTop: '60px', paddingBottom: '80px' }}
      >
        <div className="text-center">
          <Link to="/courses">
            <button className="btn-primary px-8 py-4 rounded-lg inline-flex items-center gap-2 text-base">
              {t('home.start_learning')}
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </section>
    </main>
  );
}
