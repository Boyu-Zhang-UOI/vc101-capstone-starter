# <Project name>

> One sentence: what it does and who it is for.

**Live site:** <https://…> · **Demo video:** <link> · **Author:** <you (and your partner)>

<!-- When you have a screenshot, save it as docs/screenshot.png and remove the comment marks around the next line.
![Screenshot of the app](docs/screenshot.png)
-->

## What it does

- <feature 1>
- <feature 2>
- <feature 3>

## How to use it

1. …
2. …

## How it works

<!-- 3–6 sentences a classmate can follow. Which files matter? Where does data go? Where do secrets live? -->

| Part | File(s) | What it does |
|---|---|---|
| Page structure | `public/index.html` | |
| Behavior | `public/app.js` | |
| Pure logic (tested) | `public/lib/…` | |
| Server route | `api/…` | |
| Server-only code | `lib/…` | |
| Data | <localStorage / Supabase table …> | |

**Authorization is enforced in:** <e.g. "row-level security policies on the `notes` table (see `supabase/policies.sql`)" or "n/a — single-user app, data stays in your browser">

**Where the secrets live:** <e.g. "`LLM_API_KEY` is in `.env` in my Codespace (not committed) and in Vercel's environment variables. The browser only ever calls `/api/ask`.">

## Run it yourself

```bash
cp .env.example .env    # then fill in your own values
npm run dev
```

Open the forwarded port 3000 (in a Codespace) or <http://localhost:3000>. Run the tests with `npm test`.

## Status against the spec

| Criterion (from SPEC.md) | Status |
|---|---|
| AC1 … | ✅ passes |
| AC2 … | ⚠️ partly — … |

## How I built it

Built during Vibe Coding 101 using <tools>. See [PROMPTS.md](PROMPTS.md) for how I used AI, [TESTS.md](TESTS.md) for how I checked it, and [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md) for the security review.

## Known issues and next steps

-

## Credits

<!-- Code, images, fonts, APIs or tutorials you used, with links and licenses. -->

- Started from the [Vibe Coding 101 capstone starter](https://github.com/Boyu-Zhang-UOI/Vibe_Coding_101/tree/main/projects/capstone-starter) (MIT License).

---

## Getting started (delete this section when your README is done)

This starter is a small, working app shell: a page with two example features, a server route, tests, and deployment settings. You grow it into your capstone ([project brief](https://github.com/Boyu-Zhang-UOI/Vibe_Coding_101/blob/main/projects/capstone.md)).

### 1. Set up (week 6 studio)

1. Create your repository from this starter: [Start a project from a starter](https://github.com/Boyu-Zhang-UOI/Vibe_Coding_101/blob/main/setup/codespaces.md#start-a-project-from-a-starter), path `projects/capstone-starter`. Keep it in your **personal** account so Vercel can deploy it.
2. Open it in a Codespace and check it runs:

   ```bash
   npm test
   npm run dev
   ```

   The list works straight away. The "ask the AI" example needs a key: `cp .env.example .env`, add your key and a model ID (`npm run models`), then restart `npm run dev`. It's the same setup as week 5.
3. Fill in `SPEC.md` from your capstone pitch, and the **Project** line of `AGENTS.md`.
4. Commit: `Start capstone from starter; add SPEC and AGENTS`.

### 2. Deploy on day one

Deploy the unchanged shell to Vercel now, then keep it deployed as you build: every push to `main` redeploys.

1. Push your commits (Source Control → **Sync Changes**).
2. On [vercel.com](https://vercel.com): **Add New… → Project → Import** this repository. Leave the preset as **Other**.
3. If you use the AI feature, add `LLM_BASE_URL`, `LLM_API_KEY` and `LLM_MODEL` under **Environment Variables**.
4. **Deploy**, then put the URL at the top of this README.

After changing environment variables on Vercel, **redeploy** (Deployments → ⋯ → Redeploy).

### 3. What's in the box

| Path | What it is | Keep it? |
|---|---|---|
| `public/index.html`, `style.css`, `app.js` | The page, its look, and the code that connects it to the logic | Change freely |
| `public/lib/items.js` | Example pure logic (add, remove, summarize a list), tested in `tests/items.test.js` | Replace with your own logic and tests |
| `public/lib/input.js` | Input rules for the AI question (used by the browser and the server) | Keep if you use the AI route |
| `api/ask.js` | Example server route `POST /api/ask` that calls an LLM with a hidden key | Optional: keep, change, or delete |
| `lib/llm.js`, `lib/prompt.js`, `lib/validate.js` | Server-only code for the AI route. `prompt.js` holds the system prompt | Keep with `api/ask.js` |
| `dev-server.mjs` | Local server: serves `public/`, runs `api/*.js` | Keep |
| `vercel.json` | Tells Vercel to serve `public/` and run `api/` as functions | Keep |
| `.github/workflows/test.yml` | Runs `npm test` on GitHub after every push (see the **Actions** tab) | Keep |
| `tests/` | Automated tests (`npm test`). No network or keys needed | Add yours; you need at least 3 |
| `SPEC.md`, `AGENTS.md`, `PROMPTS.md`, `TESTS.md`, `SECURITY_CHECKLIST.md` | Your project documents | Fill them in |
| `docs/` | Your wireframe and screenshot | Add images |

**Not using an AI feature?** Delete `api/ask.js`, `lib/`, `public/lib/input.js`, `scripts/list-models.mjs`, the matching tests (`tests/ask`, `llm`, `validate`, `input`), the "ask the AI" section of `index.html` and `app.js`, and the `LLM_` lines of `.env.example`. Do it in one commit, and run `npm test` afterwards.

**Adding another server route?** Create `api/<name>.js` exporting `export default { async fetch(request) { … } }`, like `api/ask.js`. It is served at `/api/<name>` both locally and on Vercel. Server-only helpers go in `lib/`. Never put a secret in `public/`.
