# SPEC — <Project name>

> **Capstone.** Start from your capstone pitch. Keep this file up to date: your AI agent reads it before every task (see `AGENTS.md`).

> **One page.** Write this yourself. You may ask an AI to *critique* it ("What is ambiguous? What edge cases am I missing?"), but not to write it. 🟡
> A good spec lets a classmate, or an AI agent, build the right thing without asking you questions.

**Author:** <your name> · **Last updated:** <date>

## 1. Problem

Who has what problem, and why does it matter? (2–3 sentences)

## 2. User

Describe one real person who will use this. It can be you.

## 3. User stories

Use the form *As a …, I want to …, so that …*. Mark each one **MUST**, **SHOULD** or **COULD**.

- **MUST** — As a …, I want to …, so that …
- **MUST** — As a …, I want to …, so that …
- **SHOULD** — As a …, I want to …, so that …
- **COULD** — As a …, I want to …, so that …

## 4. Acceptance criteria

Each criterion must be something you can check by using the app. Format: **WHEN** *situation or action*, **THE APP SHALL** *observable result*.
Include at least two edge cases: empty input, very long input, duplicates, reloading the page, a small phone screen, no internet.

| ID | Criterion | Priority | Passes? |
|---|---|---|---|
| AC1 | WHEN I type a name and press Enter, THE APP SHALL add it to the list and clear the input box. | MUST | ☐ |
| AC2 | WHEN I press Enter with an empty box, THE APP SHALL add nothing and SHALL show "Please type a name". | MUST | ☐ |
| AC3 | WHEN I reload the page, THE APP SHALL show the same list as before. | MUST | ☐ |
| AC4 | | | ☐ |
| AC5 | | | ☐ |

## 5. Out of scope

Things you are deliberately **not** building this time. (This list stops you, and the AI, from wandering.)

-
-

## 6. Constraints

- **Technology:** plain HTML, CSS and JavaScript (ES modules) in `public/`; server routes in `api/`; no frameworks; no build step; deployed on Vercel
- **Data:** <e.g. saved in the browser with localStorage / in a Supabase table with row-level security>
- **Must work on:** <e.g. phone and laptop browsers>
- **Never:** real payments, real personal data about other people, secrets in front-end code

## 7. Wireframe

Sketch the main screen on paper, photograph it and add it to the repo as `docs/wireframe.jpg`, then link it here: `![Wireframe](docs/wireframe.jpg)`. A text sketch is fine too:

```
+--------------------------------+
|  Title                         |
|  [ input box       ] [ Add ]   |
|  • item one            [x]     |
|  • item two            [x]     |
+--------------------------------+
```

## 8. Capstone requirements

Your capstone must include **at least two** of these (pairs: at least three), and each one you choose needs at least one acceptance criterion above. Tick the ones you plan, and say where each one lives.

- [ ] (a) A server-side API call with a hidden key (for example an AI feature through `api/ask.js`) — where:
- [ ] (b) A database with access rules (row-level security) and/or sign-in (week 7) — where:
- [ ] (c) A data visualization (a chart, map or timeline) — where:
- [ ] (d) Data from an external public API — which API:

## 9. Open questions

- 
