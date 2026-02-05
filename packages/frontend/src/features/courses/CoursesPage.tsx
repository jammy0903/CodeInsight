/**
 * CoursesPage - 언어 선택 페이지 (API 기반)
 *
 * 사용자가 학습할 언어를 선택하는 진입점.
 * 언어 선택 후 ChaptersPage로 이동.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, ChevronRight, BookOpen, RefreshCw } from 'lucide-react';
import { getLanguages } from '@/services/courses';
import type { Language } from '@/types';
import { logger } from '@/utils/logger';
import { useStore } from '@/stores/store';

export function CoursesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const setPageTitle = useStore((s) => s.setPageTitle);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 페이지 제목 설정
  useEffect(() => {
    setPageTitle(t('courses.title'), t('courses.select_language'));
  }, [setPageTitle, t]);

  // API에서 언어 목록 로드
  useEffect(() => {
    async function loadLanguages() {
      try {
        setLoading(true);
        const data = await getLanguages();
        setLanguages(data);
      } catch (err) {
        setError(t('courses.load_error'));
        logger.error('Failed to load languages:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLanguages();
  }, []);

  // 언어 카드 클릭 → 챕터 페이지로 이동
  const handleLanguageClick = (langId: string) => {
    navigate(`/courses/${langId}`);
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-muted-foreground">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-secondary px-4 py-2 flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 space-y-8">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <h1 className="text-3xl md:text-4xl font-display font-bold text-text">
          🎓 {t('courses.select_title')}
        </h1>
        <p className="text-text-secondary">
          {t('courses.select_desc')}
        </p>
      </motion.div>

      {/* 언어 카드 그리드 (5열) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-7xl mx-auto px-4"
      >
        {languages.map((lang, index) => (
          <LanguageCard
            key={lang.id}
            language={lang}
            index={index}
            onClick={() => handleLanguageClick(lang.id)}
          />
        ))}
      </motion.div>

      {/* 빈 상태 */}
      {languages.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('courses.empty')}</p>
        </div>
      )}
    </div>
  );
}

/**
 * 언어 카드 컴포넌트 - 바느질 디자인 + 정사각형
 */
interface LanguageCardProps {
  language: Language;
  index: number;
  onClick: () => void;
}

// 언어별 색상 매핑
const LANGUAGE_COLORS: Record<string, { bg: string; border: string; stitch: string; text: string }> = {
  c: {
    bg: 'linear-gradient(135deg, #E8F4FA 0%, #D0EBF7 100%)',
    border: '#87CEEB',
    stitch: 'rgba(135, 206, 235, 0.5)',
    text: '#5BA3C0',
  },
  python: {
    bg: 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)',
    border: '#FFD54F',
    stitch: 'rgba(255, 193, 7, 0.5)',
    text: '#F57C00',
  },
  java: {
    bg: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
    border: '#F9A8D4',
    stitch: 'rgba(244, 114, 182, 0.4)',
    text: '#BE185D',
  },
  javascript: {
    bg: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
    border: '#A5D6A7',
    stitch: 'rgba(129, 199, 132, 0.5)',
    text: '#2E7D32',
  },
  'python-practical': {
    bg: 'linear-gradient(135deg, #F5F5F5 0%, #E0E0E0 100%)',
    border: '#9E9E9E',
    stitch: 'rgba(117, 117, 117, 0.5)',
    text: '#424242',
  },
};

const DEFAULT_COLOR = {
  bg: 'linear-gradient(135deg, #F5F5F5 0%, #EEEEEE 100%)',
  border: '#BDBDBD',
  stitch: 'rgba(158, 158, 158, 0.5)',
  text: '#616161',
};

function LanguageCard({ language, index, onClick }: LanguageCardProps) {
  const { t } = useTranslation();
  const colors = LANGUAGE_COLORS[language.id] || DEFAULT_COLOR;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative rounded-2xl text-center transition-all duration-300
                 hover:shadow-xl flex flex-col items-center justify-center aspect-square"
      style={{
        background: colors.bg,
        border: `3px solid ${colors.border}`,
        padding: '24px',
      }}
    >
      {/* 바느질 스티치 테두리 */}
      <div
        className="absolute rounded-xl pointer-events-none"
        style={{
          top: '12px',
          left: '12px',
          right: '12px',
          bottom: '12px',
          border: `2px dashed ${colors.stitch}`,
          borderRadius: '12px',
        }}
      />

      {/* 아이콘 */}
      <div className="text-5xl mb-4">{language.icon || '📚'}</div>

      {/* 언어 이름 */}
      <h3
        className="text-xl font-bold"
        style={{ color: colors.text }}
      >
        {language.name}
      </h3>

      {/* 화살표 (하단) */}
      <div
        className="mt-3 flex items-center gap-1 text-sm font-semibold opacity-60 group-hover:opacity-100 transition-opacity"
        style={{ color: colors.text }}
      >
        <span>{t('courses.start')}</span>
        <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.button>
  );
}
