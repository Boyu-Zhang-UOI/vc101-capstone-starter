// Tests for lib/validate.js: the server-side check that runs before any AI call.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAskBody } from '../lib/validate.js';
import { MAX_INPUT_LENGTH } from '../public/lib/input.js';

test('a good body passes and the question is trimmed', () => {
  assert.deepEqual(validateAskBody({ question: '  What is JSON?  ' }), { ok: true, question: 'What is JSON?' });
});

test('bodies that are not objects are rejected', () => {
  for (const body of [null, 'hello', 42, ['What is JSON?']]) {
    const result = validateAskBody(body);
    assert.equal(result.ok, false, `expected ${JSON.stringify(body)} to be rejected`);
    assert.match(result.error, /Send JSON/);
  }
});

test('a missing or non-text question is rejected', () => {
  assert.equal(validateAskBody({}).ok, false);
  assert.equal(validateAskBody({ question: 123 }).ok, false);
  assert.match(validateAskBody({ question: 123 }).error, /must be text/);
});

test('an empty question is rejected', () => {
  assert.deepEqual(validateAskBody({ question: '   ' }), { ok: false, error: 'Please type a question first.' });
});

test('a question over the limit is rejected before any AI call', () => {
  const result = validateAskBody({ question: 'x'.repeat(MAX_INPUT_LENGTH + 1) });
  assert.equal(result.ok, false);
  assert.match(result.error, /too long/);
});
