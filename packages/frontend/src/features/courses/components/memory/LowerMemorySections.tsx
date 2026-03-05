/**
 * LowerMemorySections - BSS / Data / Text 하위 메모리 영역
 *
 * BSS: 항상 비어있음 (커리큘럼에서 미사용)
 * Data: 문자열 리터럴, 초기화된 전역변수
 * Text: 실행 코드 (함수)
 * 빈 경우 한 줄로 축소
 */

import type { DataItem, TextItem } from './types';
import { useTranslation } from 'react-i18next';

interface LowerMemorySectionsProps {
  dataSection?: DataItem[];
  textSection?: TextItem[];
}

const SECTION_COLORS = {
  bss: { color: 'var(--theme-memory-card-muted)', bg: 'var(--theme-memory-stack-bg)', border: 'var(--theme-memory-card-muted)' },
  data: { color: 'var(--theme-memory-data-label)', bg: 'var(--theme-memory-data-bg)', border: 'var(--theme-memory-data-label)' },
  text: { color: 'var(--theme-memory-text-label)', bg: 'var(--theme-memory-text-bg)', border: 'var(--theme-memory-text-label)' },
};

export function LowerMemorySections({
  dataSection = [],
  textSection = [],
}: LowerMemorySectionsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-1">
      {/* BSS - 항상 한 줄 (이 커리큘럼에서는 사용 안 함) */}
      <div
        className="rounded-md px-2 py-1.5 flex items-center justify-between"
        style={{
          backgroundColor: SECTION_COLORS.bss.bg,
          border: `1px solid ${SECTION_COLORS.bss.color}20`,
        }}
      >
        <span className="text-[10px] font-bold uppercase" style={{ color: SECTION_COLORS.bss.color }}>
          📭 BSS
        </span>
        <span className="text-[9px] italic" style={{ color: SECTION_COLORS.bss.color }}>
          {t('visualizer.empty')}
        </span>
      </div>

      {/* Data 영역 */}
      {dataSection.length === 0 ? (
        <div
          className="rounded-md px-2 py-1.5 flex items-center justify-between"
          style={{
            backgroundColor: SECTION_COLORS.data.bg,
            border: `1px solid ${SECTION_COLORS.data.border}25`,
          }}
        >
          <span className="text-[10px] font-bold uppercase" style={{ color: SECTION_COLORS.data.color }}>
            📝 Data
          </span>
          <span className="text-[9px] italic" style={{ color: 'var(--theme-memory-card-muted)' }}>
            {t('visualizer.empty')}
          </span>
        </div>
      ) : (
        <div
          className="rounded-lg p-2"
          style={{
            backgroundColor: SECTION_COLORS.data.bg,
            border: `1px solid ${SECTION_COLORS.data.border}25`,
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase" style={{ color: SECTION_COLORS.data.color }}>
              📝 Data
            </span>
            <span className="text-[9px]" style={{ color: SECTION_COLORS.data.color }}>
              {t('visualizer.string_literals')}
            </span>
          </div>
          <div className="space-y-1">
            {dataSection.map((item, idx) => (
              <div
                key={idx}
                className="rounded px-2 py-1 flex items-center gap-2"
                style={{ backgroundColor: `${'var(--theme-memory-card-bg)'}B3` }}
              >
                <span className="text-[10px] font-mono" style={{ color: 'var(--theme-memory-card-muted)' }}>{item.address}</span>
                <span style={{ color: 'var(--theme-memory-card-muted)' }}>|</span>
                <span className="text-[11px] font-mono truncate flex-1" style={{ color: 'var(--theme-memory-data-label)' }}>
                  "{item.value}"
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Text 영역 */}
      {textSection.length === 0 ? (
        <div
          className="rounded-md px-2 py-1.5 flex items-center justify-between"
          style={{
            backgroundColor: SECTION_COLORS.text.bg,
            border: `1px solid ${SECTION_COLORS.text.border}25`,
          }}
        >
          <span className="text-[10px] font-bold uppercase" style={{ color: SECTION_COLORS.text.color }}>
            ⚙️ Text
          </span>
          <span className="text-[9px] italic" style={{ color: 'var(--theme-memory-card-muted)' }}>
            {t('visualizer.empty')}
          </span>
        </div>
      ) : (
        <div
          className="rounded-lg p-2"
          style={{
            backgroundColor: SECTION_COLORS.text.bg,
            border: `1px solid ${SECTION_COLORS.text.border}25`,
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase" style={{ color: SECTION_COLORS.text.color }}>
              ⚙️ Text
            </span>
            <span className="text-[9px]" style={{ color: SECTION_COLORS.text.color }}>
              {t('visualizer.executable_code')}
            </span>
          </div>
          <div className="space-y-1">
            {textSection.map((item, idx) => (
              <div
                key={idx}
                className="rounded px-2 py-1 flex items-center gap-2"
                style={{ backgroundColor: `${'var(--theme-memory-card-bg)'}B3` }}
              >
                <span className="text-[10px] font-mono" style={{ color: 'var(--theme-memory-card-muted)' }}>{item.address}</span>
                <span style={{ color: 'var(--theme-memory-card-muted)' }}>|</span>
                <span className="text-[11px] font-mono" style={{ color: 'var(--theme-memory-text-label)' }}>
                  {item.name}()
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center text-[9px] pt-0.5" style={{ color: 'var(--theme-memory-card-muted)' }}>
        {`↓ 0x0000 (${t('visualizer.low_address')})`}
      </div>
    </div>
  );
}
