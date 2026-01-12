/**
 * usePdfExport Hook
 * PDF export state management with ref
 *
 * Uses requestAnimationFrame + setTimeout to ensure loading UI
 * renders smoothly before heavy PDF generation starts
 */

import { useState, useRef, useCallback } from 'react';
import { exportToPdf, generatePdfFilename } from '@/utils/pdfExport';

/**
 * Waits for next animation frame + small delay
 * This ensures React has time to render the loading state
 * before html2pdf.js blocks the main thread
 */
function waitForRender(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 100);
    });
  });
}

export function usePdfExport() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    if (!reportRef.current || isExporting) return;

    setIsExporting(true);
    setError(null);

    // Wait for loading UI to render before starting heavy PDF work
    await waitForRender();

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
