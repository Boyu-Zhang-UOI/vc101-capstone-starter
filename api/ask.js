// api/ask.js: the server route behind POST /api/ask.
//
// On Vercel, every file in api/ becomes a serverless function: code that runs on
// Vercel's computers only when someone calls it. Locally, dev-server.mjs does the
// same job. The browser never sees this code or the API key it uses.

import { askLLM, LLMError } from '../lib/llm.js';
import { buildMessages } from '../lib/prompt.js';
import { validateAskBody } from '../lib/validate.js';

export default {
  async fetch(request) {
    // 1. Only accept POST requests.
    if (request.method !== 'POST') {
      return json({ error: 'Use POST to send a question to this route.' }, 405, { Allow: 'POST' });
    }

    // 2. Read and check the input BEFORE spending any AI quota on it.
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Send JSON like {"question": "Why is the sky blue?"}.' }, 400);
    }
    const check = validateAskBody(body);
    if (!check.ok) {
      return json({ error: check.error }, 400);
    }

    // 3. Ask the model and send back only its reply.
    try {
      const reply = await askLLM(buildMessages(check.question));
      return json({ reply });
    } catch (err) {
      if (err instanceof LLMError) {
        console.error(`[api/ask] ${err.logMessage}`);
        return json({ error: err.userMessage }, err.status);
      }
      console.error('[api/ask] Unexpected error:', err?.message);
      return json({ error: 'Something went wrong on the server. Please try again.' }, 500);
    }
  },
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}
