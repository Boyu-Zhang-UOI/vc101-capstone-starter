# TESTS.md — how I checked that this works

> Manual tests are steps a person follows. Automated tests are code that checks code (`npm test`).
> Every acceptance criterion in `SPEC.md` should have at least one test here. Include edge cases.
> **Check first:** write each test before you ask for the code it checks, in a separate step. If an AI writes the test, ask for the test alone, in its own prompt, so it isn't shaped by the code it is meant to check.

## Manual tests

Run these in a fresh browser tab. For the "reload" tests, reload the page before checking.

| ID | Checks | Steps | Expected result | Result (date) |
|---|---|---|---|---|
| T1 | AC1 | 1. Type "Read" in the box. 2. Press Enter. | "Read" appears at the bottom of the list; the box is empty. | ☐ |
| T2 | AC2 (edge case) | 1. Leave the box empty. 2. Press Enter. | Nothing is added; the message "Please type a name" appears. | ☐ |
| T3 | AC3 (edge case) | 1. Add two items. 2. Reload the page. | Both items are still there, in the same order. | ☐ |
| T4 | | | | ☐ |

### Edge cases I considered

- [ ] Empty input
- [ ] Very long input (paste 500 characters)
- [ ] Duplicate entries
- [ ] Special characters and emoji (`<b>hi</b>`, `"quotes"`, 🎉)
- [ ] Reloading the page / closing and reopening the browser
- [ ] Small phone screen
- [ ] Slow or no internet (for apps that call an API)

## Automated tests

Run with:

```bash
npm test
```

| Test file | What it checks |
|---|---|
| `tests/items.test.js` | Example list logic: add, trim, empty, too long, duplicates, remove, summary. *Replace with tests for your own logic.* |
| `tests/input.test.js` | Input rules for the AI question: empty, at the limit, over the limit |
| `tests/validate.test.js` | The server rejects bad request bodies before calling the AI |
| `tests/llm.test.js` | The AI call with a fake provider: success, missing key, wrong key, rate limit, unknown model; the key never appears in messages |
| `tests/ask.test.js` | The whole `/api/ask` route: 405 for GET, 415 for a body that isn't JSON, 400 for bad input, friendly 429 and 500 errors |
| `tests/chart.test.js` | Chart data preparation: counting, sorting, skipping bad values, "Other", text description |
| `tests/db.test.js` | The Supabase settings check: refuses secret keys, explains missing settings |
| `tests/weather.test.js` | The public-API route with a fake weather service: good input, bad input, errors, timeouts |
| `tests/check-secrets.test.js` | The secret scan (`npm run check:secrets`) finds keys in files and in old commits |
| `tests/[your-feature].test.js` | |

> The capstone needs **at least 3 automated tests of your own features** (not only the starter's examples) and **at least 3 manual edge-case tests** above. GitHub runs `npm test` after every push: see the **Actions** tab. Delete the tests of any example pattern you remove.

## Bugs found by testing

| Date | Bug | How I found it | Fixed in commit |
|---|---|---|---|
| | | | |
