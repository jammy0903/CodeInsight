// 테스트 2: Promise 체이닝
Promise.resolve()
  .then(() => { console.log('A'); return 1; })
  .then(val => { console.log('B', val); });

console.log('C');
