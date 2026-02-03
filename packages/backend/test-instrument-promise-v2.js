#!/usr/bin/env node
/**
 * Promise.then() 코드 계측 테스트 V2
 * acorn-walk 사용하여 중복 방지
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
 * Promise.then() 콜백을 계측합니다
 */
function instrumentPromise(code) {
  const ast = acorn.parse(code, {
    ecmaVersion: 2020,
    locations: true,
  });

  const insertions = []; // { start, end, replacement } 배열

  // acorn-walk로 .then() 찾기
  walk.simple(ast, {
    CallExpression(node) {
      // .then() 호출인지 확인
      if (
        node.callee?.type === 'MemberExpression' &&
        node.callee.property?.name === 'then'
      ) {
        const callback = node.arguments[0];

        if (callback && callback.type === 'ArrowFunctionExpression') {
          const callbackLine = callback.loc.start.line;

          if (callback.body.type === 'BlockStatement') {
            // { } 블록: 여는 { 다음에 삽입
            const insertPos = callback.body.start + 1;
            insertions.push({
              start: insertPos,
              end: insertPos,
              replacement: ` __captureMicrotask__(${callbackLine}); `
            });
          } else {
            // 한 줄 표현식: () => expr
            // 변환: () => { __captureMicrotask__(line); return expr; }
            const arrowPos = code.indexOf('=>', callback.start);
            const exprStart = callback.body.start;
            const exprEnd = callback.body.end;

            insertions.push({
              start: arrowPos + 2,
              end: exprEnd,
              replacement: ` { __captureMicrotask__(${callbackLine}); return ${code.substring(exprStart, exprEnd)}; }`
            });
          }
        }
      }
    }
  });

  // 역순 정렬 (뒤에서부터 삽입)
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
console.log('✅ 검증:');
console.log('='.repeat(60));

// 검증: __captureMicrotask__ 호출이 정확히 2개 있는지 확인
const matches = instrumented.match(/__captureMicrotask__/g);
if (matches && matches.length === 2) {
  console.log('✅ 2개의 .then() 콜백이 모두 계측됨');
} else {
  console.log(`❌ 예상: 2개, 실제: ${matches ? matches.length : 0}개`);
}

// 라인 번호 확인
if (instrumented.includes('__captureMicrotask__(7)')) {
  console.log('✅ 첫 번째 .then()의 라인 번호 정확 (Line 7)');
} else {
  console.log('❌ 첫 번째 .then()의 라인 번호 오류');
}

if (instrumented.includes('__captureMicrotask__(8)')) {
  console.log('✅ 두 번째 .then()의 라인 번호 정확 (Line 8)');
} else {
  console.log('❌ 두 번째 .then()의 라인 번호 오류');
}
