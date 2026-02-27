import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-[var(--theme-dashboard-accent,#3b82f6)] opacity-20 mb-4">
          404
        </div>
        <h1 className="text-2xl font-bold text-[var(--theme-dashboard-title,#111)] mb-3">
          {t('errors.not_found')}
        </h1>
        <p className="text-[var(--theme-dashboard-text-muted,#666)] mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--theme-dashboard-card-border,#e5e7eb)] text-[var(--theme-dashboard-text-muted,#666)] font-medium hover:bg-[var(--theme-dashboard-section-header-bg,#f3f4f6)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--theme-dashboard-accent,#3b82f6)] text-white font-medium hover:opacity-90 transition-opacity"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
