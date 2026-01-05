/**
 * CoursesPage - 언어 선택 페이지 (API 기반)
 *
 * 사용자가 학습할 언어를 선택하는 진입점.
 * 언어 선택 후 ChaptersPage로 이동.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getLanguages } from '@/services/courses';
import type { Language } from '@/types';

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
        console.error(err);
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
        <Button onClick={() => window.location.reload()}>다시 시도</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-6 md:px-10 lg:px-16 space-y-8 max-w-7xl">
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

      {/* 언어 카드 그리드 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative bg-bg-elevated border-2 border-border rounded-2xl p-6 text-left
                 hover:border-primary hover:shadow-lg transition-all duration-300"
    >
      {/* 아이콘 */}
      <div className="text-5xl mb-4">{language.icon || '📚'}</div>

      {/* 언어명 */}
      <h3 className="text-xl font-bold text-text mb-2 flex items-center gap-2">
        {language.name}
        <ChevronRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100
                                 transform translate-x-0 group-hover:translate-x-1 transition-all" />
      </h3>

      {/* 설명 */}
      <p className="text-sm text-text-secondary mb-4 line-clamp-2">
        {language.description || '코스를 탐색해보세요'}
      </p>

      {/* Hover 효과 */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.button>
  );
}
