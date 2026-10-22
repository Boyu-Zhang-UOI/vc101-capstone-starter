// Tests for the safety checks in public/lib/db.js. They never connect to Supabase.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkSupabaseConfig } from '../public/lib/db.js';

// Fake keys are built from pieces so this file contains nothing that looks like a real key.
const jwt = (payload) => ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify(payload)).toString('base64url'), 'signature1234567890'].join('.');
const URL_OK = 'https://abcdefghijklmnop.supabase.co';
const PUBLISHABLE = 'sb_' + 'publishable_' + 'A1b2C3d4E5f6G7h8I9j0';

test('a project URL and a publishable key are accepted', () => {
  assert.equal(checkSupabaseConfig({ SUPABASE_URL: URL_OK, SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE }), '');
  assert.equal(checkSupabaseConfig({ SUPABASE_URL: URL_OK + '/', SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE }), '');
});

test('a legacy anon key still works (with a warning when used)', () => {
  assert.equal(checkSupabaseConfig({ SUPABASE_URL: URL_OK, SUPABASE_PUBLISHABLE_KEY: jwt({ role: 'anon' }) }), '');
});

test('secret keys are refused, including the legacy service_role key', () => {
  for (const key of ['sb_' + 'secret_' + 'A1b2C3d4E5f6G7h8I9j0', jwt({ role: 'service' + '_role' })]) {
    assert.match(checkSupabaseConfig({ SUPABASE_URL: URL_OK, SUPABASE_PUBLISHABLE_KEY: key }), /SECRET key/);
  }
});

test('missing or placeholder settings explain how to set up', () => {
  assert.match(checkSupabaseConfig(null), /Copy public\/config\.example\.js/);
  assert.match(checkSupabaseConfig({ SUPABASE_URL: 'https://your-project-ref.supabase.co', SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE }), /URL is missing/);
  assert.match(checkSupabaseConfig({ SUPABASE_URL: URL_OK, SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_paste-your-key-here' }), /key is missing/);
});

test('common copy mistakes get a specific hint', () => {
  assert.match(checkSupabaseConfig({ SUPABASE_URL: 'https://supabase.com/dashboard/project/abc', SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE }), /dashboard/);
  assert.match(checkSupabaseConfig({ SUPABASE_URL: URL_OK + '/rest/v1', SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE }), /no extra path/);
  assert.match(checkSupabaseConfig({ SUPABASE_URL: URL_OK, SUPABASE_PUBLISHABLE_KEY: 'hello' }), /sb_publishable_/);
});
