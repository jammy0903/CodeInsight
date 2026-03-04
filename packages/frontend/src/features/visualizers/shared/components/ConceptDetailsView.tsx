import { memo, type ReactNode } from 'react';

type ConceptType = 'preprocessor' | 'streams' | 'buffering' | 'fileio';
type UnknownRecord = Record<string, unknown>;

interface ConceptDetailsViewProps {
  conceptType?: string;
  conceptState?: UnknownRecord;
  explanation?: string;
  code?: string;
  className?: string;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => (typeof item === 'string' ? item : String(item)));
}

function asRecord(value: unknown): UnknownRecord | undefined {
  return typeof value === 'object' && value !== null ? value as UnknownRecord : undefined;
}

function pretty(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">{title}</div>
      {children}
    </div>
  );
}

export const ConceptDetailsView = memo(function ConceptDetailsView({
  conceptType,
  conceptState,
  explanation,
  code,
  className = '',
}: ConceptDetailsViewProps) {
  const type = (conceptType || 'preprocessor') as ConceptType;
  const state = conceptState || {};

  const before = asString(state.before) || asString(state.source) || asString(state.input);
  const after = asString(state.after) || asString(state.expanded) || asString(state.output);

  const streams = asRecord(state.streams) || {
    stdin: state.stdin,
    stdout: state.stdout,
    stderr: state.stderr,
  };

  const bufferItems = asStringArray(state.buffer) || asStringArray(state.queue);
  const flushedItems = asStringArray(state.flushed);
  const files = Array.isArray(state.files) ? state.files : [];

  return (
    <div className={`space-y-3 ${className}`}>
      <Section title="Concept">
        <div className="font-semibold text-slate-800">{type}</div>
        {explanation && (
          <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{explanation}</p>
        )}
      </Section>

      {type === 'preprocessor' && (
        <div className="grid gap-3 md:grid-cols-2">
          <Section title="Before">
            <pre className="text-xs whitespace-pre-wrap font-mono text-slate-700">{before || code || '(empty)'}</pre>
          </Section>
          <Section title="After">
            <pre className="text-xs whitespace-pre-wrap font-mono text-slate-700">{after || '(no expansion payload)'}</pre>
          </Section>
        </div>
      )}

      {type === 'streams' && (
        <div className="grid gap-3 md:grid-cols-3">
          {['stdin', 'stdout', 'stderr'].map((key) => (
            <Section key={key} title={key}>
              <pre className="text-xs whitespace-pre-wrap font-mono text-slate-700">
                {asString(streams[key]) || '(empty)'}
              </pre>
            </Section>
          ))}
        </div>
      )}

      {type === 'buffering' && (
        <div className="grid gap-3 md:grid-cols-2">
          <Section title="Buffer Queue">
            <div className="flex flex-wrap gap-2">
              {bufferItems.length === 0 && <span className="text-sm text-slate-500">(empty)</span>}
              {bufferItems.map((item, idx) => (
                <span key={`${item}-${idx}`} className="px-2 py-1 rounded-md border border-amber-300 bg-amber-50 text-amber-900 text-xs font-mono">
                  {item}
                </span>
              ))}
            </div>
          </Section>
          <Section title="Flushed">
            <div className="flex flex-wrap gap-2">
              {flushedItems.length === 0 && <span className="text-sm text-slate-500">(none)</span>}
              {flushedItems.map((item, idx) => (
                <span key={`${item}-${idx}`} className="px-2 py-1 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-900 text-xs font-mono">
                  {item}
                </span>
              ))}
            </div>
          </Section>
        </div>
      )}

      {type === 'fileio' && (
        <Section title="File Handles">
          <div className="space-y-2">
            {files.length === 0 && <span className="text-sm text-slate-500">(no file state)</span>}
            {files.map((entry, idx) => {
              const record = asRecord(entry) || {};
              const name = asString(record.name) || asString(record.path) || `file-${idx + 1}`;
              const mode = asString(record.mode) || '?';
              const status = asString(record.status) || asString(record.state) || 'unknown';
              const cursor = asString(record.cursor) || String(record.cursor ?? '-');
              return (
                <div key={`${name}-${idx}`} className="rounded-lg border border-slate-200 p-2 text-xs font-mono bg-slate-50 text-slate-700">
                  {name} | mode={mode} | state={status} | cursor={cursor}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      <Section title="Raw Payload">
        <pre className="text-xs whitespace-pre-wrap font-mono text-slate-600 max-h-56 overflow-auto">{pretty(state)}</pre>
      </Section>
    </div>
  );
});

export default ConceptDetailsView;

