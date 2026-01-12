/**
 * usePdfExport Hook
 * PDF export state management with ref
 */

import { useState, useRef, useCallback } from 'react';
import { exportToPdf, generatePdfFilename } from '@/utils/pdfExport';

export function usePdfExport() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    if (!reportRef.current || isExporting) return;

    setIsExporting(true);
    setError(null);

    try {
      await exportToPdf(reportRef.current, {
        filename: generatePdfFilename('analytics'),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'PDF export failed';
      setError(message);
      console.error('PDF export error:', err);
    } finally {
      setIsExporting(false);
    }
  }, [isExporting]);

  return {
    reportRef,
    isExporting,
    error,
    handleExport,
    clearError: () => setError(null),
  };
}
