// public/lib/input.js: rules for what the user may type.
// This file is used in TWO places:
//   - in the browser (public/app.js), to give instant feedback while you type;
//   - on the server (lib/validate.js), to check every request again.
// The browser check is a convenience. The server check is the one that protects
// your quota, because anyone can call /api/ask directly and skip your page.

/** The longest question (in characters) the app accepts. Change it to suit your app. */
export const MAX_INPUT_LENGTH = 1000;

/**
 * Check a question. Returns '' if it is fine, or a friendly error message if not.
 * @param {string} text
 */
export function checkInput(text) {
  const trimmed = String(text ?? '').trim();
  if (trimmed.length === 0) {
    return 'Please type a question first.';
  }
  if (trimmed.length > MAX_INPUT_LENGTH) {
    return `That is too long: ${trimmed.length} characters. The limit is ${MAX_INPUT_LENGTH}.`;
  }
  return '';
}

/** The text for the character counter under the box, e.g. "12 / 1000". */
export function counterText(text) {
  return `${String(text ?? '').length} / ${MAX_INPUT_LENGTH}`;
}
