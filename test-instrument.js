// 계측 테스트 스크립트
const fs = require('fs');

// debugger_agent.js에서 instrumentCode 함수만 추출
const MAX_STEPS = 1000;

class DebuggerAgent {
  shouldSkipLine(trimmed) {
    if (!trimmed) return true;
    if (trimmed.startsWith('//')) return true;
    if (trimmed.startsWith('/*') || trimmed.endsWith('*/')) return true;
    if (trimmed === '}' || trimmed === '{' || trimmed === ');') return true;
    return false;
  }

  instrumentCode(code) {
    const lines = code.split('\n');
    const instrumentedLines = [];
    let inMultilineComment = false;
    let braceDepth = 0;
    let bracketDepth = 0;
    let inObjectLiteral = false;
    let objectStartDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      const trimmed = line.trim();

      if (inMultilineComment) {
        if (trimmed.includes('*/')) {
          inMultilineComment = false;
        }
        instrumentedLines.push(line);
        continue;
      }
      if (trimmed.startsWith('/*')) {
        inMultilineComment = true;
        instrumentedLines.push(line);
        continue;
      }

      const lineWithoutStrings = trimmed
        .replace(/'[^']*'/g, '')
        .replace(/"[^"]*"/g, '')
        .replace(/`[^`]*`/g, '');

      for (const char of lineWithoutStrings) {
        if (char === '{') {
          braceDepth++;
          if (!inObjectLiteral && braceDepth === 1 &&
              (trimmed.includes('=') || trimmed.includes(':'))) {
            inObjectLiteral = true;
            objectStartDepth = braceDepth;
          }
        } else if (char === '}') {
          braceDepth--;
          if (inObjectLiteral && braceDepth < objectStartDepth) {
            inObjectLiteral = false;
          }
        } else if (char === '[') {
          bracketDepth++;
        } else if (char === ']') {
          bracketDepth--;
        }
      }

      if (braceDepth === 0 && !trimmed.includes('{')) {
        inObjectLiteral = false;
      }

      if (this.shouldSkipLine(trimmed)) {
        instrumentedLines.push(line);
        continue;
      }

      if (/^(let|const)\s+/.test(trimmed)) {
        const varLine = line.replace(/^(\s*)(let|const)\s+/, '$1var ');
        if (varLine !== line) {
          instrumentedLines.push(varLine);
        } else {
          instrumentedLines.push(line);
        }
      } else {
        instrumentedLines.push(line);
      }

      if (inObjectLiteral || bracketDepth > 0) {
        continue;
      }

      if (/^\w+\s*:/.test(trimmed) && !trimmed.includes('?') && !trimmed.includes('=>')) {
        continue;
      }

      let nextLineIndex = i + 1;
      let nextLine = lines[nextLineIndex];
      while (nextLineIndex < lines.length && (!nextLine || !nextLine.trim() || nextLine.trim().startsWith('//'))) {
        nextLineIndex++;
        nextLine = lines[nextLineIndex];
      }

      if (nextLine && nextLine.trim().startsWith('.')) {
        continue;
      }

      instrumentedLines.push(`__capture__(${lineNum});`);
    }

    return instrumentedLines.join('\n');
  }
}

// 테스트 실행
const code = fs.readFileSync('packages/backend/lesson_code.js', 'utf-8');
const agent = new DebuggerAgent();
const instrumented = agent.instrumentCode(code);

console.log('=== 원본 코드 ===');
console.log(code);
console.log('\n=== 계측된 코드 ===');
console.log(instrumented);
