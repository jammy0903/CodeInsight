#!/usr/bin/env node
/**
 * setTimeout() 코드 계측 테스트
 * 콜백 함수에 __captureMacrotask__() 호출 삽입
 */

const acorn = require('acorn');
const walk = require('acorn-walk');

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
 * setTimeout() 콜백을 계측합니다
 */
function instrumentTimeout(code) {
  const ast = acorn.parse(code, {
    ecmaVersion: 2020,
    locations: true,
  });

  const insertions = [];

  walk.simple(ast, {
    CallExpression(node) {
      // setTimeout() 호출인지 확인
      if (
        node.callee?.type === 'Identifier' &&
        node.callee.name === 'setTimeout'
      ) {
        const callback = node.arguments[0];
        const delay = node.arguments[1];

        // delay 값 추출
        let delayValue = 0;
        if (delay && delay.type === 'Literal') {
          delayValue = delay.value;
        }

        if (callback && callback.type === 'ArrowFunctionExpression') {
          const callbackLine = callback.loc.start.line;

          if (callback.body.type === 'BlockStatement') {
            // { } 블록: 여는 { 다음에 삽입
            const insertPos = callback.body.start + 1;
            insertions.push({
              start: insertPos,
              end: insertPos,
              replacement: ` __captureMacrotask__(${callbackLine}, ${delayValue}); `
            });
          } else {
            // 한 줄 표현식: () => expr
            // 변환: () => { __captureMacrotask__(line, delay); return expr; }
            const arrowPos = code.indexOf('=>', callback.start);
            const exprStart = callback.body.start;
            const exprEnd = callback.body.end;

            insertions.push({
              start: arrowPos + 2,
              end: exprEnd,
              replacement: ` { __captureMacrotask__(${callbackLine}, ${delayValue}); return ${code.substring(exprStart, exprEnd)}; }`
            });
          }
        }
      }
    }
  });

  // 역순 정렬
  insertions.sort((a, b) => b.start - a.start);

  let instrumented = code;
  for (const { start, end, replacement } of insertions) {
    instrumented = instrumented.substring(0, start) + replacement + instrumented.substring(end);
  }

  return instrumented;
}

const instrumented = instrumentTimeout(testCode);

console.log('\n' + '='.repeat(60));
console.log('✨ 계측된 코드:');
console.log('='.repeat(60));
console.log(instrumented);

console.log('\n' + '='.repeat(60));
console.log('✅ 검증:');
console.log('='.repeat(60));

// 검증
const matches = instrumented.match(/__captureMacrotask__/g);
if (matches && matches.length === 1) {
  console.log('✅ setTimeout 콜백이 계측됨');
} else {
  console.log(`❌ 예상: 1개, 실제: ${matches ? matches.length : 0}개`);
}

if (instrumented.includes('__captureMacrotask__(4, 0)')) {
  console.log('✅ setTimeout 라인 번호 정확 (Line 4)');
  console.log('✅ delay 값 전달됨 (0ms)');
} else {
  console.log('❌ setTimeout 계측 오류');
}
