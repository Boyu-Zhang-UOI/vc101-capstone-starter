// Tests for lib/llm.js. No network and no real key: we pass in a fake "fetch"
// function that returns whatever response each test needs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { askLLM, readConfig, LLMError } from '../lib/llm.js';

const FAKE_KEY = 'test-key-not-real-12345';
const ENV = {
  LLM_BASE_URL: 'https://llm.example.com/v1/',
  LLM_API_KEY: FAKE_KEY,
  LLM_MODEL: 'example-model',
};
const MESSAGES = [{ role: 'user', content: 'Hi' }];

function fakeFetch(status, body) {
  const calls = [];
  const fn = async (url, options) => {
    calls.push({ url, options });
    const text = typeof body === 'string' ? body : JSON.stringify(body);
    return new Response(text, { status, headers: { 'Content-Type': 'application/json' } });
  };
  fn.calls = calls;
  return fn;
}

const okBody = { choices: [{ message: { role: 'assistant', content: '  Hello there!  ' } }] };

test('returns the model reply and sends an OpenAI-compatible request', async () => {
  const fetchFn = fakeFetch(200, okBody);
  const reply = await askLLM(MESSAGES, { env: ENV, fetchFn });
  assert.equal(reply, 'Hello there!');

  const { url, options } = fetchFn.calls[0];
  assert.equal(url, 'https://llm.example.com/v1/chat/completions'); // trailing "/" handled
  assert.equal(options.method, 'POST');
  assert.equal(options.headers.Authorization, `Bearer ${FAKE_KEY}`);
  assert.deepEqual(JSON.parse(options.body), { model: 'example-model', messages: MESSAGES });
});

test('missing settings give a 500 with a friendly message and no network call', async () => {
  const fetchFn = fakeFetch(200, okBody);
  await assert.rejects(askLLM(MESSAGES, { env: { ...ENV, LLM_API_KEY: '' }, fetchFn }), (err) => {
    assert.ok(err instanceof LLMError);
    assert.equal(err.status, 500);
    assert.match(err.userMessage, /LLM_API_KEY/);
    return true;
  });
  assert.equal(fetchFn.calls.length, 0);
});

test('placeholder values from .env.example count as missing', () => {
  const config = readConfig({ ...ENV, LLM_API_KEY: 'paste-your-key-here', LLM_MODEL: 'paste-a-model-id-from-npm-run-models' });
  assert.deepEqual(config.missing, ['LLM_API_KEY', 'LLM_MODEL']);
});

test('a rejected key (401) explains the key is wrong, without revealing it', async () => {
  const fetchFn = fakeFetch(401, { error: { message: `Invalid API Key: ${FAKE_KEY}` } });
  await assert.rejects(askLLM(MESSAGES, { env: ENV, fetchFn }), (err) => {
    assert.equal(err.status, 500);
    assert.match(err.userMessage, /rejected the server's API key/);
    assert.ok(!err.userMessage.includes(FAKE_KEY), 'user message must not contain the key');
    assert.ok(!err.logMessage.includes(FAKE_KEY), 'log message must not contain the key');
    assert.match(err.logMessage, /\[redacted\]/);
    return true;
  });
});

test('Gemini-style "400 Please pass a valid API key" is treated as a key problem', async () => {
  const fetchFn = fakeFetch(400, [{ error: { code: 400, message: 'Please pass a valid API key', status: 'INVALID_ARGUMENT' } }]);
  await assert.rejects(askLLM(MESSAGES, { env: ENV, fetchFn }), /rejected the server's API key/);
});

test('a rate limit (429) becomes a friendly "quota used up" message', async () => {
  const fetchFn = fakeFetch(429, { error: { message: 'Rate limit reached' } });
  await assert.rejects(askLLM(MESSAGES, { env: ENV, fetchFn }), (err) => {
    assert.equal(err.status, 429);
    assert.match(err.userMessage, /quota is used up/);
    assert.match(err.userMessage, /TOOLS\.md/);
    return true;
  });
});

test('an unknown model (404) points to npm run models', async () => {
  const fetchFn = fakeFetch(404, { error: { message: 'model not found' } });
  await assert.rejects(askLLM(MESSAGES, { env: ENV, fetchFn }), (err) => {
    assert.equal(err.status, 502);
    assert.match(err.userMessage, /npm run models/);
    return true;
  });
});

test('other provider errors become a 502', async () => {
  const fetchFn = fakeFetch(503, 'Service Unavailable');
  await assert.rejects(askLLM(MESSAGES, { env: ENV, fetchFn }), (err) => err.status === 502);
});

test('a network failure becomes a 502', async () => {
  const fetchFn = async () => {
    throw new TypeError('fetch failed');
  };
  await assert.rejects(askLLM(MESSAGES, { env: ENV, fetchFn }), (err) => err.status === 502);
});

test('an empty reply becomes a 502 with a friendly message', async () => {
  const fetchFn = fakeFetch(200, { choices: [{ message: { content: '' } }] });
  await assert.rejects(askLLM(MESSAGES, { env: ENV, fetchFn }), /empty answer/);
});
