// lib/prompt.js: the system prompt for the example AI feature. It runs on the
// server, so visitors cannot read or change it.
//
// The system prompt is product design: it decides who the AI is in your app, what
// it does, how it answers and what it refuses. Rewrite it for YOUR capstone, or
// delete the AI feature if your capstone doesn't use one (see README.md).

export const SYSTEM_PROMPT = `You are a helpful assistant inside a small web app.
- Answer the user's question in plain English, in at most 100 words.
- If the question is unclear, ask one short clarifying question instead of guessing.
- Reply in plain text only: no Markdown.
- Never ask for personal information, and do not repeat any that the user shares.`;

/** Build the list of messages we send to the model. */
export function buildMessages(question) {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: question },
  ];
}
