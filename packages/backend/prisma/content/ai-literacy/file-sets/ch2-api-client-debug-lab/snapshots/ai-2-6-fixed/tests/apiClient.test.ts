import { fetchAssistantText } from '../src/apiClient';

async function fakeMessageContentOk() {
  return {
    choices: [{ message: { content: 'Hello from API' } }],
  };
}

async function fakeLegacyTextOk() {
  return {
    choices: [{ text: 'Legacy text' }],
  };
}

async function fakeBadRequest() {
  const err = new Error('Bad Request') as Error & { status?: number };
  err.status = 400;
  throw err;
}

(async () => {
  const a = await fetchAssistantText(fakeMessageContentOk);
  if (a !== 'Hello from API') throw new Error(`Expected Hello from API, got: ${String(a)}`);

  const b = await fetchAssistantText(fakeLegacyTextOk);
  if (b !== 'Legacy text') throw new Error(`Expected Legacy text, got: ${String(b)}`);

  let badRequestThrown = false;
  try {
    await fetchAssistantText(fakeBadRequest, { retries: 3 });
  } catch (error) {
    badRequestThrown = true;
  }
  if (!badRequestThrown) throw new Error('Expected 400 error to be thrown without retry chain');

  console.log('PASS: regression suite for apiClient');
})();
