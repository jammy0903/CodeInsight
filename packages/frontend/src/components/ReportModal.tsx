/**
 * ReportModal - 신고/문의 모달
 *
 * 레슨 신고 (type='lesson') 또는 일반 문의 (type='general')를 위한 공용 모달.
 * 객관식 카테고리 선택 + 선택적 텍스트 메시지 입력.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { notify } from '@/components/common/Toast/notifications';
import { sendReport } from '@/services/reports';

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'lesson' | 'general';
  lessonId?: string;
}

export function ReportModal({ open, onOpenChange, type, lessonId }: ReportModalProps) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const lessonCategories = [
    { key: 'lesson_cat_wrong_code', label: t('report.lesson_cat_wrong_code') },
    { key: 'lesson_cat_wrong_explanation', label: t('report.lesson_cat_wrong_explanation') },
    { key: 'lesson_cat_no_visualization', label: t('report.lesson_cat_no_visualization') },
    { key: 'lesson_cat_other', label: t('report.lesson_cat_other') },
  ];

  const generalCategories = [
    { key: 'general_cat_bug', label: t('report.general_cat_bug') },
    { key: 'general_cat_feature', label: t('report.general_cat_feature') },
    { key: 'general_cat_other', label: t('report.general_cat_other') },
  ];

  const categories = type === 'lesson' ? lessonCategories : generalCategories;
  const isOther = selectedCategory?.endsWith('_other');

  const handleSubmit = async () => {
    if (!selectedCategory) return;

    const categoryLabel = categories.find(c => c.key === selectedCategory)?.label || selectedCategory;

    setSending(true);
    try {
      await sendReport({
        type,
        category: categoryLabel,
        message: message.trim() || undefined,
        lessonId: type === 'lesson' ? lessonId : undefined,
      });
      notify.success(t('report.success'));
      onOpenChange(false);
      setSelectedCategory(null);
      setMessage('');
    } catch {
      notify.error(t('report.error'));
    } finally {
      setSending(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedCategory(null);
      setMessage('');
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === 'lesson' ? t('report.lesson_title') : t('report.general_title')}
          </DialogTitle>
          <DialogDescription>
            {type === 'lesson' ? t('report.lesson_desc') : t('report.general_desc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* 카테고리 선택 */}
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('report.category')}</p>
            {categories.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`w-full p-3 text-left rounded-lg border-2 transition-colors text-sm ${
                  selectedCategory === key
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-[var(--theme-dashboard-card-border)] hover:border-[var(--theme-dashboard-progress-bg)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 메시지 입력 (기타 선택 시 필수 표시, 나머지는 선택) */}
          {selectedCategory && (
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('report.message_placeholder')}
              rows={3}
              maxLength={2000}
              className="w-full p-3 rounded-lg border text-sm resize-none"
              style={{
                borderColor: 'var(--theme-dashboard-card-border)',
                backgroundColor: 'var(--theme-lesson-editor-bg)',
                color: 'var(--theme-lesson-editor-text)',
              }}
            />
          )}

          {/* 전송 버튼 */}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => handleOpenChange(false)}
              className="btn-secondary px-4 py-2 text-sm"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedCategory || sending || (isOther && !message.trim())}
              className={`btn-primary px-4 py-2 text-sm ${
                !selectedCategory || sending || (isOther && !message.trim())
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              {sending ? t('report.sending') : t('report.send')}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
