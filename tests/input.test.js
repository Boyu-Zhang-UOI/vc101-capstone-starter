// Tests for public/lib/input.js. Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_INPUT_LENGTH, checkInput, counterText } from '../public/lib/input.js';

test('a normal question is accepted', () => {
  assert.equal(checkInput('Why is the sky blue?'), '');
});

test('an empty or blank question is rejected with a friendly message', () => {
  assert.equal(checkInput(''), 'Please type a question first.');
  assert.equal(checkInput('   \n  '), 'Please type a question first.');
});

test('a question exactly at the limit is accepted', () => {
  assert.equal(checkInput('a'.repeat(MAX_INPUT_LENGTH)), '');
});

test('a question one character over the limit is rejected', () => {
  const message = checkInput('a'.repeat(MAX_INPUT_LENGTH + 1));
  assert.match(message, /too long/);
  assert.match(message, new RegExp(String(MAX_INPUT_LENGTH)));
});

test('spaces around a question do not count toward the limit', () => {
  assert.equal(checkInput(`  ${'a'.repeat(MAX_INPUT_LENGTH)}  `), '');
});

test('the counter shows characters used and the limit', () => {
  assert.equal(counterText('hello'), `5 / ${MAX_INPUT_LENGTH}`);
  assert.equal(counterText(''), `0 / ${MAX_INPUT_LENGTH}`);
});
