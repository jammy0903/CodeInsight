import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';

interface Section {
  title: string;
  content: React.ReactNode;
  highlight?: boolean;
}

interface LegalPageProps {
  title: string;
  sections: Section[];
  effectiveDate: string;
  contactEmail: string;
  otherLink: { label: string; to: string };
}

export function LegalPage({ title, sections, effectiveDate, contactEmail, otherLink }: LegalPageProps) {
  const navigate = useNavigate();
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';

  const colors = {
    bg: isDark ? '#0f172a' : '#f8fafc',
    card: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#e2e8f0' : '#334155',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    heading: isDark ? '#818cf8' : '#5a4fcf',
    border: isDark ? '#334155' : '#e2e8f0',
    accent: isDark ? 'rgba(129,140,248,0.1)' : 'rgba(102,126,234,0.08)',
    highlight: isDark ? 'rgba(251,191,36,0.1)' : '#fff3cd',
    highlightBorder: isDark ? '#f59e0b' : '#ffc107',
    link: isDark ? '#818cf8' : '#667eea',
  };

  return (
    <div style={{ background: colors.bg, minHeight: '100vh', padding: '24px 16px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: colors.link,
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
            marginBottom: 16, padding: '4px 0',
          }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div style={{
          background: colors.card, borderRadius: 12,
          border: `1px solid ${colors.border}`, padding: '32px 28px',
        }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.heading, margin: 0 }}>{title}</h1>
          <p style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, margin: '4px 0 24px' }}>CodeInsight</p>

          {sections.map((section, i) => (
            <div key={i}>
              {section.title && (
                <h2 style={{ fontSize: 17, fontWeight: 600, color: colors.heading, margin: '28px 0 12px' }}>
                  {section.title}
                </h2>
              )}
              {section.highlight && (
                <div style={{
                  background: colors.highlight, borderLeft: `4px solid ${colors.highlightBorder}`,
                  padding: 14, margin: '12px 0', borderRadius: '0 8px 8px 0',
                  fontSize: 13, color: colors.text, lineHeight: 1.7,
                }}>
                  {section.content}
                </div>
              )}
              {!section.highlight && (
                <div style={{ fontSize: 14, color: colors.text, lineHeight: 1.8 }}>
                  {section.content}
                </div>
              )}
            </div>
          ))}

          <div style={{
            marginTop: 28, padding: 14, background: colors.accent,
            borderRadius: 8, fontSize: 13, color: colors.text,
          }}>
            <strong>Effective Date:</strong> {effectiveDate}
          </div>

          <div style={{
            marginTop: 20, padding: 16, background: colors.accent, borderRadius: 8,
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: colors.heading, margin: '0 0 8px' }}>Contact Us</h2>
            <p style={{ fontSize: 13, color: colors.text, margin: 0 }}>
              If you have any questions, please contact us at{' '}
              <a href={`mailto:${contactEmail}`} style={{ color: colors.link }}>{contactEmail}</a>.
            </p>
          </div>

          <div style={{
            marginTop: 24, paddingTop: 16, borderTop: `1px solid ${colors.border}`,
            textAlign: 'center', fontSize: 12, color: colors.textMuted,
          }}>
            <button
              onClick={() => navigate(otherLink.to)}
              style={{
                background: 'none', border: 'none', color: colors.link,
                fontSize: 13, cursor: 'pointer', fontWeight: 500,
              }}
            >
              {otherLink.label}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
