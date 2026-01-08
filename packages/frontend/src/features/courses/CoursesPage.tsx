/**
 * CoursesPage - 언어 선택 페이지 (API 기반)
 *
 * 사용자가 학습할 언어를 선택하는 진입점.
 * 언어 선택 후 ChaptersPage로 이동.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, ChevronRight, BookOpen, RefreshCw } from 'lucide-react';
import { getLanguages } from '@/services/courses';
import type { Language } from '@/types';
import { logger } from '@/utils/logger';

export function CoursesPage() {
  const navigate = useNavigate();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API에서 언어 목록 로드
  useEffect(() => {
    async function loadLanguages() {
      try {
        setLoading(true);
        const data = await getLanguages();
        setLanguages(data);
      } catch (err) {
        setError('언어 목록을 불러오지 못했습니다.');
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
          다시 시도
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
          🎓 코스 선택
        </h1>
        <p className="text-text-secondary">
          학습하고 싶은 프로그래밍 언어를 선택하세요
        </p>
      </motion.div>

      {/* 언어 카드 리스트 (수직 배열) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col gap-4 max-w-2xl mx-auto"
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
          <p className="text-muted-foreground">아직 등록된 코스가 없습니다.</p>
        </div>
      )}
    </div>
  );
}

/**
 * 언어 카드 컴포넌트
 */
interface LanguageCardProps {
  language: Language;
  index: number;
  onClick: () => void;
}

function LanguageCard({ language, index, onClick }: LanguageCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative bg-bg-elevated border-2 border-border rounded-xl p-4
                 hover:border-primary hover:shadow-lg transition-all duration-300
                 flex items-center gap-4"
    >
      {/* 아이콘 */}
      <div className="text-4xl shrink-0">{language.icon || '📚'}</div>

      {/* 텍스트 영역 */}
      <div className="flex-1 text-left">
        <h3 className="text-lg font-bold text-text">
          {language.name}
        </h3>
        <p className="text-sm text-text-secondary line-clamp-1">
          {language.description || '코스를 탐색해보세요'}
        </p>
      </div>

      {/* 화살표 */}
      <ChevronRight className="w-5 h-5 text-primary opacity-50 group-hover:opacity-100
                               transform translate-x-0 group-hover:translate-x-1 transition-all shrink-0" />

      {/* Hover 효과 */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.button>
  );
}
