// lib/llm.js: calls an LLM provider from the SERVER. Never import this file from public/.
//
// It speaks the "OpenAI-compatible" chat completions format, which Gemini, Groq,
// OpenRouter, Cloudflare Workers AI and Ollama all accept. To switch provider you
// change three environment variables, not this code:
//   LLM_BASE_URL  where the provider's API lives
//   LLM_API_KEY   your secret key (a password with a bill attached)
//   LLM_MODEL     which model to use (run `npm run models` to list them)

const TIMEOUT_MS = 30_000; // give up if the provider takes longer than 30 seconds

/** An error with a friendly message for the browser and a detailed one for the server log. */
export class LLMError extends Error {
  constructor(userMessage, status, logMessage = userMessage) {
    super(userMessage);
    this.name = 'LLMError';
    this.userMessage = userMessage; // safe to show to anyone
    this.status = status; // the HTTP status code our route should send back
    this.logMessage = logMessage; // for the server log only (never contains the key)
  }
}

/** Read the three settings. Placeholder values copied from .env.example count as missing. */
export function readConfig(env = process.env) {
  const clean = (value) => {
    const text = String(value ?? '').trim();
    return text.startsWith('paste-') ? '' : text;
  };
  const baseUrl = clean(env.LLM_BASE_URL).replace(/\/+$/, ''); // drop any trailing "/"
  const apiKey = clean(env.LLM_API_KEY);
  const model = clean(env.LLM_MODEL);
  const missing = [];
  if (!baseUrl) missing.push('LLM_BASE_URL');
  if (!apiKey) missing.push('LLM_API_KEY');
  if (!model) missing.push('LLM_MODEL');
  return { baseUrl, apiKey, model, missing };
}

/**
 * Send chat messages to the model and return its reply as text.
 * Throws an LLMError with a friendly message if anything goes wrong.
 */
export async function askLLM(messages, { env = process.env, fetchFn = globalThis.fetch } = {}) {
  const { baseUrl, apiKey, model, missing } = readConfig(env);
  if (missing.length > 0) {
    throw new LLMError(
      `The server is not set up yet: ${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} missing. ` +
        'App owner: add ' +
        (missing.length === 1 ? 'it' : 'them') +
        ' to .env (on your computer or Codespace) or to your Vercel project\'s ' +
        'environment variables, then restart the dev server or redeploy.',
      500,
      `Missing settings: ${missing.join(', ')}`,
    );
  }

  let response;
  try {
    response = await fetchFn(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    if (err?.name === 'TimeoutError') {
      throw new LLMError('The AI took too long to answer. Please try again.', 504, 'Provider timed out');
    }
    throw new LLMError(
      'The server could not reach the AI provider. Please try again in a minute.',
      502,
      `Network error calling ${safeHost(baseUrl)}: ${redact(err?.message, apiKey)}`,
    );
  }

  if (!response.ok) {
    const detail = redact(await readErrorDetail(response), apiKey);
    throw errorForStatus(response.status, detail);
  }

  const data = await response.json().catch(() => null);
  const reply = data?.choices?.[0]?.message?.content;
  if (typeof reply !== 'string' || reply.trim() === '') {
    throw new LLMError(
      'The AI sent back an empty answer. Try again, or rephrase your question.',
      502,
      'Provider returned no message content',
    );
  }
  return reply.trim();
}

/** Turn the provider's error status into a friendly LLMError. */
export function errorForStatus(status, detail = '') {
  const log = `Provider answered ${status}: ${detail}`;
  const looksLikeKeyProblem = /api[ _-]?key|unauthori[sz]ed|authenticat/i.test(detail);

  if (status === 401 || status === 403 || (status === 400 && looksLikeKeyProblem)) {
    return new LLMError(
      'The AI provider rejected the server\'s API key. App owner: check LLM_API_KEY (and that it ' +
        'belongs to the provider in LLM_BASE_URL), then restart or redeploy.',
      500,
      log,
    );
  }
  if (status === 429 || status === 402) {
    return new LLMError(
      'The free AI quota is used up for now. Please try again later. App owner: wait for the limit ' +
        'to reset, or switch provider (see TOOLS.md).',
      429,
      log,
    );
  }
  if (status === 404 || (status === 400 && /model/i.test(detail))) {
    return new LLMError(
      'The AI provider could not find that model. App owner: run `npm run models` and copy an exact ' +
        'model ID into LLM_MODEL, and check LLM_BASE_URL.',
      502,
      log,
    );
  }
  if (status >= 500) {
    return new LLMError('The AI provider is having problems right now. Please try again in a minute.', 502, log);
  }
  return new LLMError('The AI provider could not answer that request. Please try again.', 502, log);
}

async function readErrorDetail(response) {
  const text = await response.text().catch(() => '');
  try {
    let data = JSON.parse(text);
    if (Array.isArray(data)) data = data[0]; // some providers wrap the error in a list
    const message = data?.error?.message ?? data?.message;
    if (message) return String(message).slice(0, 300);
  } catch {
    // not JSON: fall through and use the raw text
  }
  return text.slice(0, 300);
}

/** Remove the key from any text before it is logged, just in case a provider echoes it back. */
export function redact(text, secret) {
  const value = String(text ?? '');
  return secret ? value.split(secret).join('[redacted]') : value;
}

function safeHost(baseUrl) {
  try {
    return new URL(baseUrl).host;
  } catch {
    return 'the provider';
  }
}
