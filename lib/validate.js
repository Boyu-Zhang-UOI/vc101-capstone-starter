// lib/validate.js: checks the body of a request to /api/ask before we spend
// any of the AI quota on it. Runs on the server only.

import { checkInput } from '../public/lib/input.js';

/**
 * @param {unknown} body  the parsed JSON body of the request
 * @returns {{ ok: true, question: string } | { ok: false, error: string }}
 */
export function validateAskBody(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Send JSON like {"question": "Why is the sky blue?"}.' };
  }
  if (typeof body.question !== 'string') {
    return { ok: false, error: 'The "question" field must be text.' };
  }
  const problem = checkInput(body.question);
  if (problem) {
    return { ok: false, error: problem };
  }
  return { ok: true, question: body.question.trim() };
}
