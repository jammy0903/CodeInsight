/**
 * CoursesPage - 언어 선택 페이지 (정적 렌더링)
 *
 * 사용자가 학습할 언어를 선택하는 진입점.
 * 언어 선택 후 ChaptersPage로 이동.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronRight, BookOpen } from 'lucide-react';
import { useStore } from '@/stores/store';
import { CBrandIcon } from '@/components/ui/CBrandIcon';

export function CoursesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const setPageTitle = useStore((s) => s.setPageTitle);

  // 페이지 제목 설정
  useEffect(() => {
    setPageTitle(t('courses.title'), t('courses.select_language'));
  }, [setPageTitle, t]);

  // 언어 카드 클릭 → 챕터 페이지로 이동
  const handleLanguageClick = (langId: string) => {
    navigate(`/courses/${langId}`);
  };

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

      {/* 언어 카드 그리드: 모바일 2열 / 데스크톱 3열 고정 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto px-6 lg:px-20"
      >
        {STATIC_LANGUAGES.map((lang, index) => (
          <LanguageCard
            key={lang.id}
            language={lang}
            index={index}
            onClick={() => handleLanguageClick(lang.id)}
          />
        ))}
      </motion.div>

      {/* 빈 상태 */}
      {STATIC_LANGUAGES.length === 0 && (
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
  language: { id: string; icon: string };
  index: number;
  onClick: () => void;
}

const STATIC_LANGUAGES: Array<{ id: string; icon: string }> = [
  { id: 'c', icon: 'C' },
  { id: 'cpp', icon: 'C++' },
  { id: 'python', icon: '🐍' },
  { id: 'java', icon: '☕' },
  { id: 'javascript', icon: '⚡' },
  { id: 'python-practical', icon: '🤖' },
  { id: 'ai-literacy', icon: '🛡️' },
];

// 언어별 색상 매핑
const LANGUAGE_COLORS: Record<string, { bg: string; border: string; stitch: string; text: string }> = {
  c: {
    bg: 'linear-gradient(135deg, #EAF4FF 0%, #D6E9FF 100%)',
    border: '#60A5FA',
    stitch: 'rgba(96, 165, 250, 0.5)',
    text: '#2563EB',
  },
  cpp: {
    bg: 'linear-gradient(135deg, #E8EEFF 0%, #D5E1FF 100%)',
    border: '#3B82F6',
    stitch: 'rgba(59, 130, 246, 0.5)',
    text: '#1D4ED8',
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
  'ai-literacy': {
    bg: 'linear-gradient(135deg, #E0F2FE 0%, #D0E8FF 100%)',
    border: '#38BDF8',
    stitch: 'rgba(56, 189, 248, 0.5)',
    text: '#0369A1',
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
  const nameKey = language.id === 'python-practical' ? 'languages.python_practical' : `languages.${language.id}`;

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
        padding: '16px',
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

      <div className="flex flex-col items-center gap-1.5">
        {/* 아이콘 */}
        <div className="text-4xl -mb-2 translate-y-1">
          {language.id === 'c' && <CBrandIcon language="c" size={63} />}
          {language.id === 'cpp' && <CBrandIcon language="cpp" size={63} />}
          {language.id !== 'c' && language.id !== 'cpp' && (language.icon || '📚')}
        </div>

        {/* 언어 이름 */}
        <h3
          className="text-xl font-bold"
          style={{ color: colors.text }}
        >
          {t(nameKey)}
        </h3>

        {/* 화살표 (하단) */}
        <div
          className="mt-3 flex items-center gap-1 text-sm font-semibold opacity-60 group-hover:opacity-100 transition-opacity"
          style={{ color: colors.text }}
        >
          <span>{t('courses.start')}</span>
          <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.button>
  );
}
