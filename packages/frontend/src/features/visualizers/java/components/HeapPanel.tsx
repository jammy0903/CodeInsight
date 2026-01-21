/**
 * Heap Panel
 * Heap 객체들 시각화
 */

import React from 'react';
import { JavaObject, JavaValue } from '../memory-types';

export interface HeapPanelProps {
  objects: JavaObject[];
  theme: 'dark' | 'soft' | 'minimal';
}

export function HeapPanel({ objects, theme }: HeapPanelProps) {
  if (objects.length === 0) {
    return <div className="heap-empty">No objects</div>;
  }

  return (
    <div className="heap-panel">
      {objects.map((obj) => (
        <ObjectCard key={obj.id} obj={obj} theme={theme} />
      ))}

      <style jsx>{`
        .heap-panel {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .heap-empty {
          text-align: center;
          padding: 2rem;
          color: var(--text-secondary);
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}

interface ObjectCardProps {
  obj: JavaObject;
  theme: 'dark' | 'soft' | 'minimal';
}

function ObjectCard({ obj, theme }: ObjectCardProps) {
  return (
    <div className={`object-card theme-${theme}`} data-object-id={obj.id}>
      {/* 객체 헤더 */}
      <div className="object-header">
        <div className="object-title">
          <span className="class-name">{obj.className}</span>
          <span className="object-id">@{obj.id}</span>
        </div>
        <span className="shallow-size">{obj.shallowSize} bytes</span>
      </div>

      {/* 배열인 경우 */}
      {obj.isArray && obj.arrayElements && (
        <div className="array-content">
          <div className="array-info">
            <span className="array-type">{obj.arrayElementType}[]</span>
          <span className="array-length">length: {obj.arrayLength}</span>
          </div>
          <div className="array-elements">
            {obj.arrayElements.map((elem, index) => (
              <ArrayElement
                key={index}
                index={index}
                value={elem}
                theme={theme}
              />
            ))}
          </div>
        </div>
      )}

      {/* 일반 객체인 경우 */}
      {!obj.isArray && obj.fields.length > 0 && (
        <div className="fields">
          {obj.fields.map(([name, value]) => (
            <Field key={name} name={name} value={value} theme={theme} />
          ))}
        </div>
      )}

      {!obj.isArray && obj.fields.length === 0 && (
        <div className="no-fields">No fields</div>
      )}

      <style jsx>{`
        .object-card {
          background: var(--object-bg);
          border: 2px solid var(--object-border);
          border-radius: 0.5rem;
          padding: 0.75rem;
          transition: all 0.2s ease;
        }

        .object-card:hover {
          transform: translateX(2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .object-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--object-border);
        }

        .object-title {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .class-name {
          font-weight: 600;
          font-size: 1rem;
          color: var(--class-color);
        }

        .object-id {
          font-size: 0.75rem;
          font-family: 'Fira Code', monospace;
          color: var(--id-color);
        }

        .shallow-size {
          font-size: 0.7rem;
          color: var(--text-secondary);
          background: var(--size-bg);
          padding: 0.2rem 0.5rem;
          border-radius: 0.25rem;
        }

        .array-content,
        .fields {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .array-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          padding: 0.3rem 0.5rem;
          background: var(--array-info-bg);
          border-radius: 0.25rem;
        }

        .array-type {
          color: var(--type-color);
          font-weight: 500;
        }

        .array-length {
          color: var(--text-secondary);
        }

        .array-elements {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
          gap: 0.4rem;
        }

        .no-fields {
          text-align: center;
          padding: 1rem;
          color: var(--text-secondary);
          font-size: 0.85rem;
          opacity: 0.7;
        }

        /* Dark Theme */
        .theme-dark {
          --object-bg: #1e293b;
          --object-border: #334155;
          --class-color: #f472b6;
          --id-color: #a5b4fc;
          --size-bg: #0f172a;
          --type-color: #fbbf24;
          --array-info-bg: #0f172a;
        }

        /* Soft Theme */
        .theme-soft {
          --object-bg: #ede9fe;
          --object-border: #c4b5fd;
          --class-color: #c026d3;
          --id-color: #7c3aed;
          --size-bg: #ddd6fe;
          --type-color: #ea580c;
          --array-info-bg: #f5f3ff;
        }

        /* Minimal Theme */
        .theme-minimal {
          --object-bg: #fef3c7;
          --object-border: #fcd34d;
          --class-color: #ea580c;
          --id-color: #b45309;
          --size-bg: #fde68a;
          --type-color: #dc2626;
          --array-info-bg: #fed7aa;
        }
      `}</style>
    </div>
  );
}

interface FieldProps {
  name: string;
  value: JavaValue;
  theme: 'dark' | 'soft' | 'minimal';
}

function Field({ name, value, theme }: FieldProps) {
  const valueDisplay = value.isReference
    ? (value.objectId ? `@${value.objectId}` : 'null')
    : String(value.value);

  return (
    <div className={`field theme-${theme}`}>
      <span className="field-name">{name}:</span>
      <span className={`field-value ${value.isReference ? 'reference' : 'primitive'}`}>
        {valueDisplay}
      </span>

      <style jsx>{`
        .field {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.4rem 0.6rem;
          background: var(--field-bg);
          border-radius: 0.25rem;
          font-size: 0.85rem;
        }

        .field-name {
          color: var(--field-name-color);
          font-weight: 500;
        }

        .field-value {
          font-family: 'Fira Code', monospace;
          font-weight: 500;
        }

        .field-value.primitive {
          color: var(--primitive-color);
        }

        .field-value.reference {
          color: var(--reference-color);
          font-weight: 600;
        }

        /* Dark Theme */
        .theme-dark {
          --field-bg: #0f172a;
          --field-name-color: #cbd5e1;
          --primitive-color: #a5f3fc;
          --reference-color: #fbbf24;
        }

        /* Soft Theme */
        .theme-soft {
          --field-bg: #f5f3ff;
          --field-name-color: #4c1d95;
          --primitive-color: #7c3aed;
          --reference-color: #ea580c;
        }

        /* Minimal Theme */
        .theme-minimal {
          --field-bg: #fde68a;
          --field-name-color: #78350f;
          --primitive-color: #b45309;
          --reference-color: #dc2626;
        }
      `}</style>
    </div>
  );
}

interface ArrayElementProps {
  index: number;
  value: JavaValue;
  theme: 'dark' | 'soft' | 'minimal';
}

function ArrayElement({ index, value, theme }: ArrayElementProps) {
  const valueDisplay = value.isReference
    ? (value.objectId ? `@${value.objectId.substring(0, 6)}` : 'null')
    : String(value.value);

  return (
    <div className={`array-element theme-${theme}`}>
      <div className="element-index">[{index}]</div>
      <div className={`element-value ${value.isReference ? 'reference' : 'primitive'}`}>
        {valueDisplay}
      </div>

      <style jsx>{`
        .array-element {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.4rem;
          background: var(--element-bg);
          border: 1px solid var(--element-border);
          border-radius: 0.25rem;
          font-size: 0.8rem;
        }

        .element-index {
          color: var(--index-color);
          font-size: 0.7rem;
          font-weight: 500;
          margin-bottom: 0.2rem;
        }

        .element-value {
          font-family: 'Fira Code', monospace;
          font-weight: 600;
        }

        .element-value.primitive {
          color: var(--primitive-color);
        }

        .element-value.reference {
          color: var(--reference-color);
        }

        /* Dark Theme */
        .theme-dark {
          --element-bg: #1e293b;
          --element-border: #334155;
          --index-color: #94a3b8;
          --primitive-color: #a5f3fc;
          --reference-color: #fbbf24;
        }

        /* Soft Theme */
        .theme-soft {
          --element-bg: #ddd6fe;
          --element-border: #c4b5fd;
          --index-color: #6b7280;
          --primitive-color: #7c3aed;
          --reference-color: #ea580c;
        }

        /* Minimal Theme */
        .theme-minimal {
          --element-bg: #fed7aa;
          --element-border: #fdba74;
          --index-color: #92400e;
          --primitive-color: #b45309;
          --reference-color: #dc2626;
        }
      `}</style>
    </div>
  );
}
