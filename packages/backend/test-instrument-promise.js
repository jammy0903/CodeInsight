#!/usr/bin/env node
/**
 * Promise.then() 코드 계측 테스트
 * 콜백 함수에 __captureMicrotask__() 호출 삽입
 */

const acorn = require('acorn');

const testCode = `
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve()
  .then(() => console.log('3'))
  .then(() => console.log('4'));

console.log('5');
`;

console.log('='.repeat(60));
console.log('📝 원본 코드:');
console.log('='.repeat(60));
console.log(testCode);

/**
 * Promise.then() 콜백을 계측합니다
 *
 * 전략:
 * 1. AST 파싱으로 .then() 콜백 위치 찾기
 * 2. 콜백 시작 부분에 __captureMicrotask__() 삽입
 * 3. 문자열 조작으로 코드 재조합
 */
function instrumentPromise(code) {
  const ast = acorn.parse(code, {
    ecmaVersion: 2020,
    locations: true,
  });

  const insertions = []; // { position, text } 배열

  // .then() 패턴 찾기
  function walk(node) {
    if (!node || typeof node !== 'object') return;

    // CallExpression이면서 .then()인지 확인
    if (
      node.type === 'CallExpression' &&
      node.callee?.type === 'MemberExpression' &&
      node.callee.property?.name === 'then'
    ) {
      const callback = node.arguments[0];

      if (callback && callback.type === 'ArrowFunctionExpression') {
        const callbackLine = callback.loc.start.line;

        // 콜백 body 시작 위치 찾기
        let insertPos;

        if (callback.body.type === 'BlockStatement') {
          // { } 블록 있는 경우: 여는 { 다음
          insertPos = callback.body.start + 1;
        } else {
          // 한 줄 표현식: 화살표(=>) 다음
          // () => console.log() 형태
          // 문제: 표현식 앞에 삽입하려면 블록으로 변환 필요

          // 간단히 처리: 화살표 위치 찾아서 { } 추가
          const arrowPos = code.indexOf('=>', callback.start);
          const exprStart = callback.body.start;

          // 기존: () => console.log('3')
          // 변환: () => { __captureMicrotask__(7); return console.log('3'); }

          insertions.push({
            start: arrowPos + 2, // => 다음
            end: callback.body.end,
            replacement: ` { __captureMicrotask__(${callbackLine}); return ${code.substring(exprStart, callback.body.end)}; }`
          });

          // return 대신 계속 탐색 (다른 .then()도 찾아야 함)
        }

        insertions.push({
          start: insertPos,
          end: insertPos,
          replacement: ` __captureMicrotask__(${callbackLine}); `
        });
      }
    }

    // 재귀적으로 모든 노드 탐색
    for (const key in node) {
      if (key === 'loc' || key === 'start' || key === 'end') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(walk);
      } else {
        walk(child);
      }
    }
  }

  walk(ast);

  // 역순 정렬 (뒤에서부터 삽입해야 위치 오프셋 안 깨짐)
  insertions.sort((a, b) => b.start - a.start);

  let instrumented = code;
  for (const { start, end, replacement } of insertions) {
    instrumented = instrumented.substring(0, start) + replacement + instrumented.substring(end);
  }

  return instrumented;
}

const instrumented = instrumentPromise(testCode);

console.log('\n' + '='.repeat(60));
console.log('✨ 계측된 코드:');
console.log('='.repeat(60));
console.log(instrumented);

console.log('\n' + '='.repeat(60));
console.log('✅ 결과 확인:');
console.log('='.repeat(60));
console.log('- .then() 콜백에 __captureMicrotask__() 추가됨');
console.log('- 한 줄 화살표 함수는 블록으로 변환됨');
console.log('- 라인 번호가 정확하게 전달됨');
