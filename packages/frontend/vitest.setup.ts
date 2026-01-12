/**
 * Vitest Setup
 * 테스트 환경 전역 설정
 */

// localStorage 목업 (Node.js 환경용)
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// sessionStorage도 필요할 경우
Object.defineProperty(globalThis, 'sessionStorage', {
  value: localStorageMock,
  writable: true,
});
