import { fetchAssistantText } from '../src/apiClient';

async function fakeOk() {
  return {
    choices: [{ message: { content: 'Hello from API' } }],
  };
}

(async () => {
  const result = await fetchAssistantText(fakeOk);
  if (result !== 'Hello from API') {
    throw new Error(`Expected Hello from API, got: ${String(result)}`);
  }
  console.log('PASS: fetchAssistantText returns mapped text');
})();
