// scripts/list-models.mjs: lists the model IDs your API key can use.
//
//   npm run models            list every model
//   npm run models -- flash   list only models whose ID contains "flash"
//   npm run models -- :free   (OpenRouter) list only the free models
//
// It reads LLM_BASE_URL and LLM_API_KEY from .env and calls GET {LLM_BASE_URL}/models.
// It never prints your key.

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const envFile = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

const clean = (value) => {
  const text = String(value ?? '').trim();
  return text.startsWith('paste-') ? '' : text;
};
const baseUrl = clean(process.env.LLM_BASE_URL).replace(/\/+$/, '');
const apiKey = clean(process.env.LLM_API_KEY);
const filter = (process.argv[2] || '').toLowerCase();

if (!baseUrl || !apiKey) {
  fail(
    'LLM_BASE_URL and LLM_API_KEY must both be set first.\n' +
      '  1. If you have no .env file yet, run:  cp .env.example .env\n' +
      '  2. Open .env and paste your key after LLM_API_KEY=  (only in .env, never in a chat)\n' +
      '  3. Run npm run models again.',
  );
}

let host = baseUrl;
try {
  host = new URL(baseUrl).host;
} catch {
  fail(`LLM_BASE_URL is not a valid web address: "${baseUrl}". Copy it exactly from .env.example or TOOLS.md.`);
}

let response;
try {
  response = await fetch(`${baseUrl}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(20_000),
  });
} catch (err) {
  fail(`Could not reach ${host} (${err.name === 'TimeoutError' ? 'it took too long' : err.message}).\nCheck LLM_BASE_URL and your internet connection.`);
}

if (!response.ok) {
  const detail = (await response.text().catch(() => '')).split(apiKey).join('[redacted]').slice(0, 300);
  if (response.status === 401 || response.status === 403 || /api[ _-]?key/i.test(detail)) {
    fail(`${host} rejected your API key (status ${response.status}).\nCheck that LLM_API_KEY in .env is complete and belongs to this provider. If in doubt, make a new key.`);
  }
  if (response.status === 404) {
    fail(`${host} has no model list at ${baseUrl}/models (status 404).\nCheck LLM_BASE_URL against .env.example or TOOLS.md.`);
  }
  if (response.status === 429) {
    fail(`${host} says you've hit a rate limit (status 429). Wait a minute and try again, or switch provider (see TOOLS.md).`);
  }
  fail(`${host} answered with status ${response.status}.\n${detail}`);
}

const data = await response.json().catch(() => null);
const list = Array.isArray(data?.data) ? data.data : Array.isArray(data?.models) ? data.models : [];
const ids = list
  .map((model) => String(model.id ?? model.name ?? ''))
  .map((id) => id.replace(/^models\//, '')) // Gemini may list "models/xyz"; the chat API wants "xyz"
  .filter((id) => id && id.toLowerCase().includes(filter))
  .sort();

if (ids.length === 0) {
  fail(filter ? `No model IDs contain "${filter}". Run npm run models with no filter to see them all.` : 'The provider returned an empty model list.');
}

console.log(`Models available from ${host}${filter ? ` containing "${filter}"` : ''}:\n`);
for (const id of ids) console.log(`  ${id}`);
console.log(`\n${ids.length} model(s). Copy one ID exactly into LLM_MODEL= in .env, then restart npm run dev.`);
console.log('Not sure which? Pick a small, fast one ("lite", "flash", "mini", "8b" or "20b" in the name). TOOLS.md lists the course\'s current suggestion.');

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}
