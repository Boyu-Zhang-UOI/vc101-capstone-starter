// Tests for scripts/check-secrets.mjs, the secret scanner behind `npm run check:secrets`.
//
// The fake keys below are built from pieces while the test runs, so this file itself
// contains nothing that looks like a key (otherwise the scanner would flag its own tests).
// The end-to-end tests make throwaway git repositories in your computer's temp folder.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanLine, fingerprint } from '../scripts/check-secrets.mjs';

const SCANNER = fileURLToPath(new URL('../scripts/check-secrets.mjs', import.meta.url));

// Random-looking but repeatable text, e.g. randomish(8) -> "q7RmX2pK".
function randomish(length, seed = 7) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let x = seed;
  let out = '';
  for (let i = 0; i < length; i++) {
    x = (x * 1103515245 + 12345) % 2147483648;
    out += alphabet[(x >> 8) % alphabet.length];
  }
  return out;
}
const hex = (length, seed) => [...randomish(length, seed)].map((c) => (c.charCodeAt(0) % 16).toString(16)).join('');
const b64url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const jwt = (payload) => [b64url({ alg: 'HS256', typ: 'JWT' }), b64url(payload), randomish(43, 3)].join('.');

const FAKE = {
  'Google / Gemini API key': 'AI' + 'za' + randomish(35, 1),
  'Groq API key': 'gs' + 'k_' + randomish(52, 2),
  'OpenRouter API key': 'sk-' + 'or-v1-' + hex(64, 4),
  'OpenAI API key': 'sk-' + 'proj-' + randomish(48, 5),
  'Anthropic API key': 'sk-' + 'ant-api03-' + randomish(40, 6),
  'Supabase secret key': 'sb_' + 'secret_' + randomish(32, 8),
  'Supabase service_role key (legacy secret key)': jwt({ iss: 'supabase', ref: randomish(20, 9), role: 'service' + '_role' }),
  'GitHub token': 'gh' + 'p_' + randomish(36, 10),
  'GitHub fine-grained token': 'github' + '_pat_' + randomish(82, 11),
  'Private key (PEM block)': '-----BEGIN ' + 'RSA PRIVATE KEY-----',
};

test('finds every key format the course uses, and never prints a whole key', () => {
  for (const [name, key] of Object.entries(FAKE)) {
    const hits = scanLine(`const value = "${key}";`);
    assert.equal(hits.length, 1, `${name} should be found once`);
    assert.equal(hits[0].name, name);
    if (!name.startsWith('Private key')) {
      assert.ok(!hits[0].shown.includes(key), `${name} must be masked`);
      assert.match(hits[0].shown, /…/);
    }
  }
});

test('finds a real-looking value in a KEY=value setting', () => {
  const hits = scanLine('LLM_API_KEY=' + randomish(40, 12));
  assert.equal(hits.length, 1);
  assert.match(hits[0].shown, /^LLM_API_KEY=/);
});

test('ignores placeholders, public keys and ordinary words', () => {
  const harmless = [
    'LLM_API_KEY=paste-your-key-here',
    '# LLM_API_KEY=ollama',
    'LLM_MODEL=paste-a-model-id-from-npm-run-models',
    "const FAKE_KEY = 'test-key-not-real-12345';",
    'SUPABASE_PUBLISHABLE_KEY: "sb_' + 'publishable_' + randomish(30, 13) + '"',
    'anonKey = "' + jwt({ iss: 'supabase', role: 'anon' }) + '"',
    'postgresql://postgres:[YOUR-PASSWORD]@db.example.supabase.co:5432/postgres',
    'The Gemini key starts with AIza and the Groq key with gsk_.',
    'Run the task-runner-for-the-whole-project now.',
  ];
  for (const line of harmless) assert.deepEqual(scanLine(line), [], line);
});

// ---------------------------------------------------------------- end to end, in a temp git repo

const hasGit = spawnSync('git', ['--version']).status === 0;

function makeRepo(t) {
  const dir = mkdtempSync(path.join(tmpdir(), 'check-secrets-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(path.join(dir, 'scripts'));
  copyFileSync(SCANNER, path.join(dir, 'scripts', 'check-secrets.mjs'));
  writeFileSync(path.join(dir, '.gitignore'), '.env\nnode_modules/\n');
  writeFileSync(path.join(dir, 'gitconfig'), '');
  const env = { ...process.env, GIT_CONFIG_GLOBAL: path.join(dir, 'gitconfig'), GIT_CONFIG_NOSYSTEM: '1' };
  const git = (...args) => {
    const r = spawnSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', '-c', 'commit.gpgsign=false', ...args], { cwd: dir, env, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
  };
  git('init', '-q');
  const scan = (...args) => spawnSync(process.execPath, ['scripts/check-secrets.mjs', ...args], { cwd: dir, env, encoding: 'utf8' });
  return { dir, git, scan };
}

test('a clean project passes; .env is skipped and .env.example placeholders are fine', { skip: !hasGit }, (t) => {
  const { dir, git, scan } = makeRepo(t);
  writeFileSync(path.join(dir, '.env.example'), 'LLM_API_KEY=paste-your-key-here\n');
  writeFileSync(path.join(dir, '.env'), `LLM_API_KEY=${FAKE['Google / Gemini API key']}\n`); // ignored by git
  writeFileSync(path.join(dir, 'app.js'), 'console.log("hello");\n');
  git('add', '-A');
  git('commit', '-q', '-m', 'Start');
  const result = scan();
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /no secrets found in \d+ files and 1 commit/);
});

test('a key that was committed and then deleted is still found in history', { skip: !hasGit }, (t) => {
  const { dir, git, scan } = makeRepo(t);
  const key = FAKE['Groq API key'];
  writeFileSync(path.join(dir, 'app.js'), `const key = "${key}";\n`);
  git('add', '-A');
  git('commit', '-q', '-m', 'Oops, add key');
  unlinkSync(path.join(dir, 'app.js'));
  writeFileSync(path.join(dir, 'app.js'), 'const key = process.env.LLM_API_KEY;\n');
  git('commit', '-q', '-am', 'Remove key');

  const result = scan();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Groq API key/);
  assert.match(result.stderr, /in git history: commit \w+ .*"Oops, add key", file app\.js/);
  assert.ok(!result.stderr.includes(key), 'the whole key must never be printed');

  // Working-tree-only mode doesn't see it, because the file no longer contains it.
  assert.equal(scan('--no-history').status, 0);

  // Once revoked, listing its fingerprint marks it as handled.
  writeFileSync(path.join(dir, 'revoked-keys.txt'), `${fingerprint(key)} Groq key, revoked\n`);
  const after = scan();
  assert.equal(after.status, 0, after.stderr);
  assert.match(after.stdout, /1 revoked key\(s\) remain in old commits/);
});

test('a key in the current files fails even before it is committed', { skip: !hasGit }, (t) => {
  const { dir, scan } = makeRepo(t);
  const key = FAKE['Supabase secret key'];
  mkdirSync(path.join(dir, 'public'));
  writeFileSync(path.join(dir, 'public', 'config.js'), `export const KEY = '${key}';\n`);
  const result = scan();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Supabase secret key/);
  assert.match(result.stderr, /in your files now: public\/config\.js line 1/);
  assert.ok(!result.stderr.includes(key));
});
