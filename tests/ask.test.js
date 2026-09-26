// Tests for the whole route in api/ask.js, with a fake fetch so no real AI is called.
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import route from '../api/ask.js';
import { MAX_INPUT_LENGTH } from '../public/lib/input.js';

const FAKE_KEY = 'test-key-not-real-67890';
const SETTINGS = ['LLM_BASE_URL', 'LLM_API_KEY', 'LLM_MODEL'];
let saved;

beforeEach(() => {
  saved = Object.fromEntries(SETTINGS.map((name) => [name, process.env[name]]));
  process.env.LLM_BASE_URL = 'https://llm.example.com/v1';
  process.env.LLM_API_KEY = FAKE_KEY;
  process.env.LLM_MODEL = 'example-model';
});

afterEach(() => {
  for (const name of SETTINGS) {
    if (saved[name] === undefined) delete process.env[name];
    else process.env[name] = saved[name];
  }
});

function post(body) {
  return new Request('http://localhost/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function stubFetch(t, status, body) {
  return t.mock.method(globalThis, 'fetch', async () =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
  );
}

test('POST with a good question returns the reply', async (t) => {
  const fetchMock = stubFetch(t, 200, { choices: [{ message: { content: 'An API is a menu for programs.' } }] });
  const response = await route.fetch(post({ question: 'What is an API?' }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { reply: 'An API is a menu for programs.' });
  assert.equal(fetchMock.mock.callCount(), 1);
});

test('GET is not allowed (405)', async () => {
  const response = await route.fetch(new Request('http://localhost/api/ask'));
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('Allow'), 'POST');
});

test('broken JSON gets a 400', async () => {
  const response = await route.fetch(post('{not json'));
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /Send JSON/);
});

test('empty and too-long questions get a 400 and never reach the AI', async (t) => {
  const fetchMock = stubFetch(t, 200, {});
  for (const question of ['', 'x'.repeat(MAX_INPUT_LENGTH + 1)]) {
    const response = await route.fetch(post({ question }));
    assert.equal(response.status, 400);
    assert.ok((await response.json()).error);
  }
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('a missing key gives a friendly 500 JSON error', async (t) => {
  delete process.env.LLM_API_KEY;
  t.mock.method(console, 'error', () => {});
  const response = await route.fetch(post({ question: 'Hi?' }));
  assert.equal(response.status, 500);
  assert.match((await response.json()).error, /LLM_API_KEY/);
});

test('a provider rate limit reaches the browser as a friendly 429', async (t) => {
  stubFetch(t, 429, { error: { message: 'Too many requests' } });
  t.mock.method(console, 'error', () => {});
  const response = await route.fetch(post({ question: 'Hi?' }));
  assert.equal(response.status, 429);
  assert.match((await response.json()).error, /try again later/);
});

test('the key never appears in the response or the server log', async (t) => {
  stubFetch(t, 401, { error: { message: `Incorrect API key provided: ${FAKE_KEY}` } });
  const logged = [];
  t.mock.method(console, 'error', (...args) => logged.push(args.join(' ')));
  const response = await route.fetch(post({ question: 'Hi?' }));
  const text = await response.text();
  assert.equal(response.status, 500);
  assert.ok(!text.includes(FAKE_KEY));
  assert.ok(logged.length > 0);
  assert.ok(logged.every((line) => !line.includes(FAKE_KEY)));
});
