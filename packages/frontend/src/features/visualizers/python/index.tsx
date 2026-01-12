/**
 * PyVisualizerView - STUB
 * TODO: 다른 서버(58.227.56.154)에서 실제 파일 가져온 후 교체
 */

import type { PyName, PyObject } from '@/types/py-simulator';

interface PyVisualizerViewProps {
  names: PyName[];
  objects: PyObject[];
  animate?: boolean;
}

export function PyVisualizerView({ names, objects }: PyVisualizerViewProps) {
  return (
    <div
      style={{
        padding: '16px',
        background: 'rgba(139, 92, 246, 0.05)',
        border: '1px dashed rgba(139, 92, 246, 0.3)',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#8b5cf6',
      }}
    >
      <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
        Python Visualizer (준비 중)
      </div>
      <div style={{ fontSize: '12px', opacity: 0.7 }}>
        Names: {names.length} | Objects: {objects.length}
      </div>
    </div>
  );
}
