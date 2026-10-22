#!/usr/bin/env node
// scripts/check-secrets.mjs: looks for API keys, tokens and private keys in this project.
// It checks the files you have now AND every old commit (git history). No packages needed.
//
//   npm run check:secrets                    check the files and the whole git history
//   npm run check:secrets -- --no-history    check only the files you have now
//   npm run check:secrets -- --help          show this help
//
// Why history? Deleting a key from a file does not remove it from git. Anyone who can see
// the repository can still open the old commit. A key that was EVER committed (and pushed)
// has leaked: revoke it on the provider's website and make a new one.
//
// What it skips: files that git ignores, such as .env (where your real key belongs).
// What it can't do: recognize every kind of key. A clean result is good evidence, not proof,
// so keep reading your diffs before every commit.
//
// The output never shows a whole key: only its first few characters and a "fingerprint"
// (a short code computed from the key, which can't be turned back into the key).

import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath, pathToFileURL } from 'node:url';

// ---------------------------------------------------------------- what counts as a secret

// "(?<![A-Za-z0-9_-])" means "not in the middle of a longer word", so "task-…" is not "sk-…".
const START = '(?<![A-Za-z0-9_-])';

/** Key formats this scanner knows. More specific formats come first. */
export const RULES = [
  { id: 'private-key', name: 'Private key (PEM block)', pattern: /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-----/g, showWhole: true },
  { id: 'google', name: 'Google / Gemini API key', pattern: new RegExp(START + 'AIza[0-9A-Za-z_-]{35}', 'g') },
  { id: 'groq', name: 'Groq API key', pattern: new RegExp(START + 'gsk_[A-Za-z0-9]{20,}', 'g') },
  { id: 'openrouter', name: 'OpenRouter API key', pattern: new RegExp(START + 'sk-or-(?:v\\d+-)?[A-Za-z0-9_-]{20,}', 'g') },
  { id: 'anthropic', name: 'Anthropic API key', pattern: new RegExp(START + 'sk-ant-[A-Za-z0-9_-]{20,}', 'g') },
  { id: 'openai', name: 'OpenAI API key', pattern: new RegExp(START + 'sk-(?:proj|svcacct|admin)-[A-Za-z0-9_-]{20,}', 'g') },
  { id: 'sk', name: 'API key starting with "sk-"', pattern: new RegExp(START + 'sk-[A-Za-z0-9_-]{20,}', 'g') },
  { id: 'supabase-secret', name: 'Supabase secret key', pattern: new RegExp(START + 'sb_secret_[A-Za-z0-9_-]{16,}', 'g') },
  { id: 'jwt', name: 'Supabase service_role key (legacy secret key)', pattern: new RegExp(START + 'eyJ[A-Za-z0-9_-]{8,}\\.eyJ[A-Za-z0-9_-]{8,}\\.[A-Za-z0-9_-]{10,}', 'g'), check: isServiceRoleJwt },
  { id: 'github', name: 'GitHub token', pattern: new RegExp(START + 'gh[pousr]_[A-Za-z0-9]{36,}', 'g') },
  { id: 'github-pat', name: 'GitHub fine-grained token', pattern: new RegExp(START + 'github_pat_[A-Za-z0-9_]{22,}', 'g') },
  { id: 'aws', name: 'AWS access key ID', pattern: new RegExp(START + '(?:AKIA|ASIA)[0-9A-Z]{16}(?![0-9A-Z])', 'g') },
  { id: 'stripe', name: 'Stripe live secret key', pattern: new RegExp(START + '(?:sk|rk)_live_[0-9A-Za-z]{24,}', 'g') },
  { id: 'huggingface', name: 'Hugging Face token', pattern: new RegExp(START + 'hf_[A-Za-z0-9]{30,}', 'g') },
  { id: 'slack', name: 'Slack token', pattern: new RegExp(START + 'xox[abposr]-[A-Za-z0-9-]{10,}', 'g') },
  {
    id: 'database-url',
    name: 'Database address with a password in it',
    pattern: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|rediss?|libsql):\/\/[^\s:/@'"`]+:([^\s@'"`]{6,})@/g,
    secretGroup: 1,
    check: (secret) => !looksLikePlaceholder(secret) && !/^(password|passw0rd|pass|secret)$/i.test(secret),
  },
  {
    id: 'assignment',
    name: 'Value given to a secret-looking setting',
    pattern: /\b((?:[A-Z][A-Z0-9_]*_)?(?:API_?KEY|SECRET|SECRET_KEY|TOKEN|PASSWORD|PRIVATE_KEY))\b["']?\s*[:=]\s*["']?([A-Za-z0-9_\-./+=]{16,})/g,
    secretGroup: 2,
    check: (secret) => !looksLikePlaceholder(secret),
  },
  {
    id: 'assignment',
    name: 'Value given to a secret-looking variable',
    pattern: /\b(apiKey|api_key|secretKey|secret_key|accessToken|access_token|authToken|password)\b["']?\s*[:=]\s*["'`]([^"'`\s]{16,})["'`]/g,
    secretGroup: 2,
    check: (secret) => !looksLikePlaceholder(secret),
  },
];

/** Words that mark an example or placeholder value, like "paste-your-key-here". */
const PLACEHOLDER_WORDS = ['paste', 'your', 'example', 'placeholder', 'changeme', 'change-me', 'fake', 'dummy', 'demo', 'test', 'not-real', 'notreal', 'not-a-real', 'sample', 'redacted', 'xxxxxx', '<', '[', '${', '{{', 'process.env'];
const EXAMPLE_WORDS = ['example', 'placeholder', 'fake', 'dummy', 'xxxxxx', 'redacted', 'not-real', 'notreal'];

export function looksLikePlaceholder(value) {
  const text = String(value).toLowerCase();
  if (PLACEHOLDER_WORDS.some((word) => text.includes(word))) return true;
  return /^(.)\1+$/.test(text); // "aaaaaaaa…" or "00000000…"
}

/** Decode the middle part of a JWT. Returns the payload object, or null. */
export function decodeJwtPayload(token) {
  const part = String(token).split('.')[1];
  if (!part) return null;
  try {
    return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function isServiceRoleJwt(token) {
  const role = decodeJwtPayload(token)?.role;
  return role === 'service_role' || role === 'supabase_admin';
}

/** Show only the start of a secret, e.g. "AIzaSy… (39 characters)". */
export function mask(secret) {
  const text = String(secret);
  const visible = Math.min(6, Math.floor(text.length / 4));
  return `${text.slice(0, visible)}… (${text.length} characters)`;
}

/** A short code that identifies a secret without revealing it. */
export function fingerprint(secret) {
  return createHash('sha256').update(String(secret)).digest('hex').slice(0, 12);
}

/**
 * Find possible secrets in one line of text.
 * @returns {{ rule: string, name: string, shown: string, fingerprint: string }[]}
 */
export function scanLine(line) {
  const found = [];
  const taken = publicKeySpans(line); // [start, end] spans already handled, so one key is reported once
  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    for (const match of line.matchAll(rule.pattern)) {
      const start = match.index;
      const end = start + match[0].length;
      if (taken.some(([a, b]) => start < b && end > a)) continue;
      const secret = rule.secretGroup ? match[rule.secretGroup] : match[0];
      if (rule.check && !rule.check(secret)) continue;
      if (!rule.check && !rule.showWhole && EXAMPLE_WORDS.some((w) => secret.toLowerCase().includes(w))) continue;
      taken.push([start, end]);
      let shown = rule.showWhole ? match[0] : mask(secret);
      if (rule.id === 'assignment') shown = `${match[1]}=${mask(secret)}`;
      found.push({ rule: rule.id, name: rule.name, shown, fingerprint: fingerprint(secret) });
    }
  }
  return found;
}

/**
 * Supabase publishable keys (and the legacy "anon" key) are public by design: every visitor's
 * browser downloads them. They are safe only with row-level security, but they are not secrets.
 * Returns their [start, end] positions in the line.
 */
function publicKeySpans(line) {
  const spans = [];
  for (const m of line.matchAll(/(?<![A-Za-z0-9_-])sb_publishable_[A-Za-z0-9_-]{16,}/g)) {
    if (!looksLikePlaceholder(m[0])) spans.push([m.index, m.index + m[0].length]);
  }
  for (const m of line.matchAll(/eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{10,}/g)) {
    if (decodeJwtPayload(m[0])?.role === 'anon') spans.push([m.index, m.index + m[0].length]);
  }
  return spans;
}

// ---------------------------------------------------------------- helpers for files and git

const SKIP_DIRS = new Set(['.git', 'node_modules', '.vercel', '.wrangler', 'dist']);
const isEnvFile = (name) => /^\.env($|\.)/.test(name) && !/^\.env\.(example|sample|template)$/.test(name);
const MAX_FILE_BYTES = 5_000_000;

function git(root, args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, windowsHide: true });
  if (result.error || result.status !== 0) return null;
  return result.stdout;
}

/** The files to check: what git would commit (tracked or new, but not ignored). */
function listFiles(root, useGit) {
  if (useGit) {
    const out = git(root, ['ls-files', '-z', '--cached', '--others', '--exclude-standard']);
    if (out !== null) return [...new Set(out.split('\0').filter(Boolean))];
  }
  // No git: walk the folder, skipping the usual tool folders and .env files.
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(path.join(root, dir))) {
      const rel = dir ? `${dir}/${name}` : name;
      const info = statSync(path.join(root, rel));
      if (info.isDirectory()) {
        if (!SKIP_DIRS.has(name)) walk(rel);
      } else if (!isEnvFile(name) && name !== '.dev.vars') {
        files.push(rel);
      }
    }
  };
  walk('');
  return files;
}

function readText(file) {
  const info = statSync(file, { throwIfNoEntry: false });
  if (!info?.isFile() || info.size > MAX_FILE_BYTES) return null;
  const buffer = readFileSync(file);
  if (buffer.subarray(0, 8000).includes(0)) return null; // a binary file (image, font…)
  return buffer.toString('utf8');
}

/** Read the added lines of every commit on every branch, one at a time. */
async function scanHistory(root, onLine) {
  const args = [
    '-c', 'core.quotepath=off', 'log', '--all', '-p', '-m', '--no-color', '--no-ext-diff', '--no-renames',
    '--unified=0', '--format=%x01%h%x02%as%x02%s', '--', '.',
  ];
  const child = spawn('git', args, { cwd: root, windowsHide: true });
  const lines = createInterface({ input: child.stdout, crlfDelay: Infinity });
  let commit = null;
  let file = null;
  let previous = '';
  const commits = new Set();
  for await (const line of lines) {
    const afterHeader = previous.startsWith('--- ');
    previous = line;
    if (line.startsWith('\x01')) {
      const [hash, date, subject] = line.slice(1).split('\x02');
      commit = { hash, date, subject };
      commits.add(hash);
      file = null;
    } else if (afterHeader && line.startsWith('+++ ')) {
      const target = line.slice(4).replace(/^"|"$/g, '');
      file = target === '/dev/null' ? null : target.replace(/^b\//, '');
    } else if (line.startsWith('+') && commit && file) {
      onLine(line.slice(1), commit, file);
    }
  }
  const code = await new Promise((resolve) => child.on('close', resolve));
  if (code !== 0) throw new Error('git log failed');
  return commits.size;
}

function readRevoked(root) {
  const file = path.join(root, 'revoked-keys.txt');
  if (!existsSync(file)) return new Set();
  const codes = readFileSync(file, 'utf8').match(/\b[0-9a-f]{12}\b/g) || [];
  return new Set(codes);
}

// ---------------------------------------------------------------- the scan

/**
 * Scan a project folder. Returns a report object; prints nothing.
 * @param {string} root  the project folder
 * @param {{ history?: boolean }} options
 */
export async function scanProject(root, { history = true } = {}) {
  const gitRoot = git(root, ['rev-parse', '--show-toplevel']);
  const useGit = gitRoot !== null;
  const findings = new Map(); // fingerprint -> { name, shown, now: [], past: [] }
  const notes = [];
  const add = (hit, where, key) => {
    if (!findings.has(hit.fingerprint)) findings.set(hit.fingerprint, { ...hit, now: [], past: [] });
    const entry = findings.get(hit.fingerprint);
    if (!entry[key].includes(where)) entry[key].push(where);
  };

  // 1. The files you have now.
  const files = listFiles(root, useGit);
  let publishable = 0;
  for (const rel of files) {
    const text = readText(path.join(root, rel));
    if (text === null) continue;
    text.split(/\r?\n/).forEach((line, i) => {
      for (const hit of scanLine(line)) add(hit, `${rel} line ${i + 1}`, 'now');
      publishable += publicKeySpans(line).length;
    });
  }
  if (publishable > 0) {
    notes.push(`${publishable} Supabase publishable key(s) found. That is expected: they are public by design, and safe only when row-level security is on for every table.`);
  }

  // 2. Is .env protected?
  if (useGit && existsSync(path.join(root, '.env'))) {
    const ignored = spawnSync('git', ['check-ignore', '-q', '.env'], { cwd: root, windowsHide: true }).status === 0;
    if (!ignored) notes.push('WARNING: .env is NOT ignored by git, so it could be committed. Add a line ".env" to .gitignore.');
  }

  // 3. Every old commit.
  let commits = 0;
  let historyChecked = false;
  if (history && useGit && git(root, ['rev-parse', '--verify', '--quiet', 'HEAD']) !== null) {
    const envCommits = new Set();
    commits = await scanHistory(root, (line, commit, file) => {
      if (isEnvFile(path.posix.basename(file))) envCommits.add(`${commit.hash} (${file})`);
      for (const hit of scanLine(line)) add(hit, `commit ${commit.hash} (${commit.date}) "${commit.subject}", file ${file}`, 'past');
    });
    historyChecked = true;
    if (envCommits.size > 0) {
      notes.push(`WARNING: a .env file was committed in: ${[...envCommits].join(', ')}. Treat every key that was in it as leaked: revoke it and make a new one.`);
    }
    if (git(root, ['rev-parse', '--is-shallow-repository'])?.trim() === 'true') {
      notes.push('This is a shallow clone, so only recent history was checked. Run it in a full clone (for example your Codespace) to check every commit.');
    }
  } else if (history && useGit) {
    historyChecked = true; // a new repository with no commits yet
  } else if (history) {
    notes.push('This folder is not a git repository (or git is not installed), so old commits were not checked.');
  }

  const revoked = readRevoked(root);
  const problems = [];
  const handled = [];
  for (const entry of findings.values()) {
    if (entry.now.length === 0 && revoked.has(entry.fingerprint)) handled.push(entry);
    else problems.push(entry);
  }
  return { files: files.length, commits, historyChecked, problems, handled, notes };
}

// ---------------------------------------------------------------- printing the report

export function formatReport(report) {
  const out = [];
  const scope = report.historyChecked
    ? `${report.files} files and ${report.commits} commit(s) on every branch`
    : `${report.files} files (old commits not checked)`;
  if (report.problems.length === 0) {
    out.push(`✔ Secret scan: no secrets found in ${scope}.`);
  } else {
    out.push(`✘ Secret scan: ${report.problems.length} possible secret(s) found in ${scope}.`, '');
    report.problems.forEach((p, i) => {
      out.push(`${i + 1}. ${p.name}: ${p.shown}   fingerprint ${p.fingerprint}`);
      for (const where of p.now) out.push(`   - in your files now: ${where}`);
      for (const where of p.past.slice(0, 5)) out.push(`   - in git history: ${where}`);
      if (p.past.length > 5) out.push(`   - …and ${p.past.length - 5} more place(s) in git history`);
    });
    out.push(
      '',
      'What to do now:',
      "  1. Revoke (delete) each real key on the provider's website, and make a new one. Removing it from",
      '     the file is not enough: old commits still contain it, and bots search GitHub for keys.',
      '  2. Put the new key only in .env (in your Codespace) and in your host\'s environment variables (Vercel).',
      '  3. Remove the key from every file listed under "in your files now", then commit.',
      '  4. For a key that is only in old commits: once it is revoked, add its fingerprint and a note to',
      '     revoked-keys.txt (for example "1a2b3c4d5e6f Gemini key, revoked 21 Oct"), so the scan records it as handled.',
      '  Not a real key (an example or a test value)? Make it obviously fake, for example start it with "paste-".',
    );
  }
  if (report.handled.length > 0) {
    out.push('', `${report.handled.length} revoked key(s) remain in old commits and are listed in revoked-keys.txt: OK.`);
  }
  for (const note of report.notes) out.push('', note);
  out.push('', 'This scan knows common key formats (Gemini, Groq, OpenRouter, OpenAI, Anthropic, Supabase, GitHub, AWS,');
  out.push('private keys, passwords in database addresses). It cannot recognize every key, so keep reading your diffs.');
  return out.join('\n');
}

// ---------------------------------------------------------------- command line

async function main(argv) {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log('Usage: npm run check:secrets [-- --no-history] [--root <folder>]\n' +
      'Checks the project files and every git commit for API keys, tokens and private keys.');
    return 0;
  }
  const rootIndex = argv.indexOf('--root');
  const root = rootIndex !== -1 ? path.resolve(argv[rootIndex + 1] || '.') : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const report = await scanProject(root, { history: !argv.includes('--no-history') });
  const text = formatReport(report);
  if (report.problems.length > 0) {
    console.error(text);
    return 1;
  }
  console.log(text);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).then(
    (code) => { process.exitCode = code; },
    (err) => { console.error(`Secret scan could not finish: ${err.message}`); process.exitCode = 2; },
  );
}
