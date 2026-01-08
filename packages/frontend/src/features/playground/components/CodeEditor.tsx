/**
 * CodeEditor - Monaco 에디터 래퍼
 * 언어별 구문 강조 + 현재 줄 하이라이트
 */

import Editor from '@monaco-editor/react';
import { usePlaygroundStore, useCurrentCode } from '../stores/playgroundStore';
import type { SupportedLanguage } from '@/types';

/** 언어별 Monaco 언어 ID */
const MONACO_LANGUAGES: Record<SupportedLanguage, string> = {
  c: 'c',
  python: 'python',
  java: 'java',
};

export function CodeEditor() {
  const { language, setCode, steps, currentStepIndex } = usePlaygroundStore();
  const code = useCurrentCode();

  const currentLine = steps[currentStepIndex]?.line;

  return (
    <Editor
      height="100%"
      language={MONACO_LANGUAGES[language]}
      value={code}
      onChange={(value) => setCode(value || '')}
      theme="vs-light"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        wordWrap: 'on',
        // 현재 줄 하이라이트 (추후 구현)
        // glyphMargin: true,
      }}
      onMount={(editor, monaco) => {
        // 현재 실행 줄 데코레이션 (추후 구현)
        // 줄 번호 클릭 시 해당 스텝으로 이동 (추후 구현)
      }}
    />
  );
}
