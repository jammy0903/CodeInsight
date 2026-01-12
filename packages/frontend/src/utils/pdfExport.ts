/**
 * PDF Export Utility
 * html2pdf.js를 사용한 클라이언트 사이드 PDF 생성
 *
 * WHY: 서버 부하 없이 브라우저에서 직접 PDF 생성
 * NOTE: html2pdf.js는 html2canvas + jsPDF 조합
 */

import html2pdf from 'html2pdf.js';

export interface PdfExportOptions {
  filename?: string;
  margin?: number | [number, number, number, number];
  pageSize?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  scale?: number;
}

/**
 * HTML 요소를 PDF로 내보내기
 *
 * @param element - PDF로 변환할 HTML 요소
 * @param options - PDF 생성 옵션
 */
export async function exportToPdf(
  element: HTMLElement,
  options: PdfExportOptions = {}
): Promise<void> {
  const {
    filename = `codeinsight-report-${new Date().toISOString().split('T')[0]}.pdf`,
    margin = [10, 10, 10, 10],
    pageSize = 'a4',
    orientation = 'portrait',
    scale = 2,
  } = options;

  const opt = {
    margin,
    filename,
    image: {
      type: 'jpeg',
      quality: 0.98,
    },
    html2canvas: {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      // 스크롤 영역 전체 캡처
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    },
    jsPDF: {
      unit: 'mm',
      format: pageSize,
      orientation,
    },
    pagebreak: {
      // CSS 클래스 기반 페이지 나눔
      mode: ['css', 'legacy'],
      before: '.page-break-before',
      after: '.page-break-after',
      avoid: ['.keep-together', '.report-card', 'tr', 'thead'],
    },
  };

  try {
    await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('PDF 생성에 실패했습니다. 다시 시도해주세요.');
  }
}

/**
 * PDF 파일명 생성 헬퍼
 */
export function generatePdfFilename(prefix: string = 'report'): string {
  const date = new Date().toISOString().split('T')[0];
  return `codeinsight-${prefix}-${date}.pdf`;
}
