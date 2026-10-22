# [Project name]

> One sentence: what it does and who it is for.

**Live site (production URL):** [https://…] · **Demo video:** [link] · **Author:** [your GitHub username, and your partner's; your real name is optional]

<!-- Required: a screenshot of the live site. Save it as docs/screenshot.png, describe what it shows
in the alt text, then delete these comment markers.
Link your production URL above, not a preview URL: Vercel deletes old preview deployments.
![Screenshot of the app's main screen](docs/screenshot.png)
-->

## What it does

- [feature 1]
- [feature 2]
- [feature 3]

## How to use it

1. …
2. …

## How it works

<!-- 3–6 sentences a classmate can follow. Which files matter? Where does data go? Where do keys live? -->

| Part | File(s) | What it does |
|---|---|---|
| Page structure | `public/index.html` | |
| Behavior | `public/app.js` | |
| Pure logic (tested) | `public/lib/…` | |
| Server route | `api/…` | |
| Server-only code | `lib/…` | |
| Data | [localStorage / Supabase table …] | |
| Keys | [for example: `LLM_API_KEY` in `.env` and Vercel's environment variables; the Supabase publishable key in `public/config.js`] | |

**Authorization is enforced in:** [for example: "row-level security policies on the `notes` table (see `supabase/policies.sql`)", or "n/a — single-user app, data stays in your browser"]

**Where each key lives:** [for example: "`LLM_API_KEY` is in `.env` in my Codespace (not committed) and in Vercel's environment variables; the browser only calls `/api/ask`. The Supabase publishable key is in `public/config.js`: it is public by design, and RLS protects the data."]

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

## Known issues

<!-- Be honest and specific. Saying clearly what doesn't work earns credit; hoping nobody notices doesn't. -->

| Issue | When it happens | Workaround or plan |
|---|---|---|
| [for example: Long names overflow the card] | [names over 40 characters on small phones] | [wrap the text; not fixed yet] |

## Next steps

- [What you'd build or fix next]

## How I built it

Built [during Vibe Coding 101, if you choose to say so] using [tools]. See [PROMPTS.md](PROMPTS.md) for how I used AI, [TESTS.md](TESTS.md) for how I checked it, and [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md) for the security review.

## Credits

<!-- Code, images, fonts, APIs or tutorials you used, with links and licenses. -->

- Started from the [Vibe Coding 101 capstone starter](https://github.com/Boyu-Zhang-UOI/Vibe_Coding_101/tree/main/projects/capstone-starter) (MIT License).
- [If you use the weather example: "Weather data by [Open-Meteo.com](https://open-meteo.com/) (CC BY 4.0)".]

---

## Getting started (delete this section when your README is done)

This starter is a small, working app shell: a page with two example features, a server route, tests, deployment settings, and tested patterns for the four capstone feature types. You grow it into your capstone ([project brief](https://github.com/Boyu-Zhang-UOI/Vibe_Coding_101/blob/main/projects/capstone.md)).

### 1. Set up (before week 6 Studio A)

1. Create your repository from this starter: [Start a project from a starter](https://github.com/Boyu-Zhang-UOI/Vibe_Coding_101/blob/main/setup/codespaces.md#start-a-project-from-a-starter), path `projects/capstone-starter`. Keep it in your **personal** GitHub account: Vercel's free plan can't deploy a private repository owned by an organization.
2. Open it in a Codespace and check it runs. A Codespace already has Node.js; the course uses Node.js 22 LTS (minimum 20.12).

   ```bash
   npm test
   npm run dev
   ```

   The list works straight away. The "ask the AI" example needs a key: `cp .env.example .env`, add your key and a model ID (`npm run models`), then restart `npm run dev`. It's the same setup as week 5.
3. Fill in `SPEC.md` from your capstone pitch, and the **Project** and **Scope** sections of `AGENTS.md`.
4. Commit: `Start capstone from starter; add SPEC and AGENTS`.

The dev server only accepts connections from the computer it runs on; a Codespace forwards the port to you. To try the app from your phone on the same Wi-Fi when you work on your own laptop, run `HOST=0.0.0.0 npm run dev`, and stop it when you're done.

### 2. Deploy on day one

Deploy the unchanged shell to Vercel now, then keep it deployed as you build: every push to `main` redeploys.

1. Push your commits (Source Control → **Sync Changes**).
2. On [vercel.com](https://vercel.com): **Add New… → Project → Import** this repository. Leave the preset as **Other**.
3. If you use the AI feature, add `LLM_BASE_URL`, `LLM_API_KEY` and `LLM_MODEL` under **Environment Variables**.
4. **Deploy**, then put the **production URL** (your project's main address, under **Domains**) at the top of this README.

After changing environment variables on Vercel, **redeploy** (Deployments → ⋯ → Redeploy).

### 3. What's in the box

| Path | What it is | Keep it? |
|---|---|---|
| `public/index.html`, `style.css`, `app.js` | The page, its look, and the code that connects it to the logic | Change freely |
| `public/lib/items.js` | Example pure logic (add, remove, summarize a list), tested in `tests/items.test.js` | Replace with your own logic and tests |
| `public/lib/input.js` | Input rules for the AI question (used by the browser and the server) | Keep if you use the AI route |
| `api/ask.js` | Example server route `POST /api/ask` that calls an LLM with a hidden key | Optional: keep, change, or delete |
| `lib/llm.js`, `lib/prompt.js`, `lib/validate.js` | Server-only code for the AI route. `prompt.js` holds the system prompt | Keep with `api/ask.js` |
| `public/config.example.js`, `public/lib/db.js`, `supabase/policies.sql` | Pattern: a Supabase database with row-level security ([below](#database-supabase-with-row-level-security)) | Use if you store shared data |
| `public/lib/chart.js` | Pattern: a bar chart with no libraries ([below](#a-chart-with-no-libraries)) | Use if you show a chart |
| `api/weather.js`, `lib/weather.js` | Pattern: a route that calls a public API ([below](#data-from-a-public-api)) | Use if you need outside data |
| `dev-server.mjs` | Local server: serves `public/`, runs `api/*.js` | Keep |
| `vercel.json` | Tells Vercel to serve `public/` and run `api/` as functions | Keep |
| `.github/workflows/test.yml` | Runs `npm test` and the secret scan on GitHub after every push (see the **Actions** tab) | Keep |
| `tests/` | Automated tests (`npm test`). No network or keys needed | Add yours; you need at least 3 |
| `scripts/list-models.mjs`, `scripts/check-secrets.mjs` | `npm run models` lists AI models; `npm run check:secrets` looks for keys in your files and in every old commit | Keep |
| `package.json`, `package-lock.json` | The project's commands. The lock file lists installed packages (none yet), so `npm audit` works | Keep both |
| `SPEC.md`, `AGENTS.md`, `PROMPTS.md`, `TESTS.md`, `SECURITY_CHECKLIST.md` | Your project documents | Fill them in |
| `docs/` | Your wireframe and screenshot | Add images |

**Not using a pattern?** Delete its files and its tests in one commit, then run `npm test`:

- AI feature: `api/ask.js`, `lib/llm.js`, `lib/prompt.js`, `lib/validate.js`, `public/lib/input.js`, `scripts/list-models.mjs`, `tests/ask`, `llm`, `validate` and `input`, the "ask the AI" parts of `index.html` and `app.js`, and the `LLM_` lines of `.env.example`.
- Database: `public/config.example.js`, `public/lib/db.js`, `supabase/`, `tests/db.test.js`.
- Chart: `public/lib/chart.js`, `tests/chart.test.js`, and the chart rules at the end of `style.css`.
- Public API: `api/weather.js`, `lib/weather.js`, `tests/weather.test.js`.

**Adding another server route?** Create `api/[name].js` exporting `export default { async fetch(request) { … } }`, like `api/ask.js`. It is served at `/api/[name]` both locally and on Vercel. Server-only helpers go in `lib/`. Never put a secret in `public/`.

---

## Feature patterns

Your capstone needs at least two of the four feature types ([capstone brief](https://github.com/Boyu-Zhang-UOI/Vibe_Coding_101/blob/main/projects/capstone.md#feature-types-include-at-least-two)). Each one has a small, tested pattern here that you can read, copy and adapt. Delete this section with "Getting started" when you no longer need it; the original stays in the course repository.

| Feature type | Pattern | Files |
|---|---|---|
| (a) A server-side API call with a hidden key | The AI route from week 5 | `api/ask.js`, `lib/llm.js`, `lib/prompt.js`, `lib/validate.js` |
| (b) A database with access rules | [Supabase with row-level security](#database-supabase-with-row-level-security) | `public/config.example.js`, `public/lib/db.js`, `supabase/policies.sql` |
| (c) A data visualization | [A chart with no libraries](#a-chart-with-no-libraries) | `public/lib/chart.js` |
| (d) Data from an external public API | [Data from a public API](#data-from-a-public-api) | `api/weather.js`, `lib/weather.js` |

### Database: Supabase with row-level security

**Not every key is a secret.** Your Supabase **publishable** key and Project URL are public by design: they go in `public/config.js`, every visitor's browser downloads them, and you commit the file (there is no build step, so the live site needs it). They are safe **only** because row-level security (RLS) protects every table. Secret keys (your AI key, the Supabase `sb_secret_…` key) only ever go in `.env` and Vercel's environment variables.

1. **Decide who may do what** before writing any SQL: for each table, who may read, add, change and delete which rows.
2. **Create the table, its grants and its policies** with `supabase/policies.sql`. It has two patterns to adapt: a public table (anyone reads, anyone adds a short row) and private rows (each signed-in user sees only their own). Paste the whole file into Supabase → **SQL Editor** → **New query** and **Run**. The last query lists every table with `rls_enabled`, its `api_grants` and its number of `policies`.

   > [!WARNING]
   > From 30 October 2026, Supabase no longer lets the API reach new tables automatically: you'll see `permission denied for table …` until you add a **grant**. Always add the grant, RLS and the policies together, in `supabase/policies.sql`. A grant on its own, with RLS off, makes the table readable by anyone, which is how thousands of Supabase databases were exposed in 2025–26. If an AI agent suggests a bare `grant … to anon`, reject it.

3. **Add your keys:** `cp public/config.example.js public/config.js`, then paste the Project URL and the publishable key (`sb_publishable_…`) from Supabase (**Connect**, or **Settings → API Keys**). If your project only shows the legacy `anon` key (a long string starting `eyJ`), it works for now, but Supabase is retiring legacy keys by the end of 2026: create a publishable key instead.
4. **Use the database from `public/app.js`** with the client in `public/lib/db.js`, which loads the official Supabase library (supabase-js) from the jsDelivr CDN and refuses to start with a secret key:

   ```js
   import { getDb } from './lib/db.js';

   async function loadMessages() {
     const db = await getDb();
     const { data, error } = await db
       .from('messages')
       .select('id, name, message, created_at')
       .order('created_at', { ascending: false })
       .limit(50);
     if (error) throw error;
     return data; // show each row with textContent, never innerHTML
   }

   async function addMessage(name, message) {
     const db = await getDb();
     const { error } = await db.from('messages').insert({ name, message });
     if (error) throw error; // for example: "new row violates row-level security policy"
   }
   ```

   Wrap calls in `try { … } catch (err) { … }` and show a friendly message, with a loading state while you wait.
5. **Attack your own table** with the course's [RLS attack page](https://boyu-zhang-uoi.github.io/Vibe_Coding_101/tools/rls-attack.html): connect with your Project URL and publishable key, type your table name, and try to read, add, change and delete rows. Everything your "who may do what" table says "no" to must fail. Record the result in `SECURITY_CHECKLIST.md`.
6. **Commit** `public/config.js` and `supabase/policies.sql`. Re-run the whole SQL file whenever you change it.

**Private rows need sign-in.** The private-rows pattern uses `(select auth.uid()) = user_id`, so each person must sign in first (Supabase Auth: for example an email "magic link", or an anonymous sign-in that you switch on in the dashboard). See Supabase's [Auth](https://supabase.com/docs/guides/auth) and [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) guides. A visitor who isn't signed in gets nothing from that table.

### A chart with no libraries

`public/lib/chart.js` draws a horizontal bar chart as SVG. It shortens long labels, combines extra rows into "Other", adds a text description for screen readers, and shows each value on hover. Add an empty element to `index.html`, for example `<div id="chart"></div>`, then in `public/app.js`:

```js
import { countBy, renderBarChart } from './lib/chart.js';

// Rows are { label, value }. Write them yourself...
renderBarChart(document.querySelector('#chart'), [
  { label: 'Biology', value: 95 },
  { label: 'Spanish', value: 40 },
], { title: 'Minutes studied this week', unit: 'min' });

// ...or count things in your data, e.g. how many sessions per subject:
renderBarChart(document.querySelector('#chart'), countBy(sessions, (s) => s.subject), { title: 'Sessions per subject' });
```

Call `renderBarChart` again whenever the data changes. Values must be numbers of 0 or more; anything else is left out. The data preparation (`countBy`, `prepareBars`, `describeBars`) is tested in `tests/chart.test.js`: write your own tests the same way for the numbers your app computes, because most chart bugs are data bugs. If the numbers matter, also show them as text (a list or a table) next to the chart.

### Data from a public API

`api/weather.js` is a server route that asks [Open-Meteo](https://open-meteo.com/), a free weather API that needs no key, for the current weather and a 7-day forecast. With `npm run dev` running, open:

```text
http://localhost:3000/api/weather?lat=46.73&lon=-117.00&units=imperial
```

From `public/app.js`:

```js
// index.html needs an element for the result, for example <p id="weather" role="status"></p>
const output = document.querySelector('#weather');
try {
  const response = await fetch('/api/weather?lat=46.73&lon=-117.00&units=imperial');
  const weather = await response.json();
  output.textContent = response.ok
    ? `${weather.temperature} ${weather.units.temperature}, ${weather.description}`
    : weather.error; // a friendly message from the route
} catch {
  output.textContent = 'Could not reach the server. Check your connection and try again.';
}
```

The route shows the pattern for any public API: **check the input first** (`parseLocation` refuses bad coordinates before calling anyone), **set a time limit** (10 seconds), **turn every failure into a friendly message** (slow, down, busy, unexpected reply), and **send the page only what it needs**. The tests in `tests/weather.test.js` replace `fetch` with a fake, so they run offline and never depend on the real service. To use a different API, copy `lib/weather.js` and change the address and the `simplify` step. Before you pitch an API, read its terms: whether it needs a key, how many requests it allows, and whether you must credit it (Open-Meteo's free API is for non-commercial use and asks for credit; see **Credits** above).
