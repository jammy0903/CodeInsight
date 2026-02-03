/**
 * PlaygroundFooter - 하단 푸터 (모바일/데스크톱 공용)
 */

import { Github, Mail } from 'lucide-react';
import type { PlaygroundTheme } from '../styles/playgroundTheme';

interface PlaygroundFooterProps {
  colors: PlaygroundTheme;
  isMobile?: boolean;
}

export function PlaygroundFooter({ colors, isMobile }: PlaygroundFooterProps) {
  const iconSize = isMobile ? 12 : 14;
  const fontSize = isMobile ? '10px' : '11px';

  return (
    <footer
      style={{
        padding: isMobile ? '6px 12px' : '8px 24px',
        backgroundColor: colors.footerBg,
        borderTop: `1px solid ${colors.footerBorder}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
        paddingBottom: isMobile ? '20px' : undefined,
      }}
    >
      <span style={{ fontSize, color: colors.footerText }}>CodeInsight 2026</span>
      <div style={{ display: 'flex', gap: isMobile ? '6px' : '8px' }}>
        <a href="https://github.com/jammy0903" target="_blank" rel="noopener noreferrer" style={{ color: colors.footerText, display: 'flex' }}>
          <Github size={iconSize} />
        </a>
        <a href="mailto:l89192164@gmail.com" style={{ color: colors.footerText, display: 'flex' }}>
          <Mail size={iconSize} />
        </a>
      </div>
    </footer>
  );
}
