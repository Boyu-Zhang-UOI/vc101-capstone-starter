# SECURITY_CHECKLIST.md

> Start section 3 when you connect your database (week 13). Complete the rest in the week 14 security sweep, including the threat model at the end, and check it all again in week 15's final security pass, before the Project Fair.
> For each item, tick it **and** write one line of evidence: a command's output, a file name, a screenshot link (check first that the screenshot shows no keys).
> AI models write insecure code about 45% of the time in independent tests, and newer models have not improved. Passing tests is not a security check: checking is your job.
> Replace every [square-bracket placeholder].

**Project:** [Project name] · **Checked by:** [your name or GitHub username] · **Date:** [date]

## 1. Secrets and keys

- [ ] No API keys, passwords or tokens appear anywhere in the repository, **including old commits**. `npm run check:secrets` scans both the current files and the whole git history.
      Evidence (`npm run check:secrets` output):
- [ ] `.env` is listed in `.gitignore`, and `.env.example` contains only placeholder values.
      Evidence:
- [ ] Secret keys (AI API keys, the Supabase **secret** key) are used only in server code (`api/`, `lib/`) and set as environment variables, never in `public/`.
      Evidence (where does each key live?):
- [ ] The only key in `public/`, if any, is the Supabase **publishable** key, with the project URL, in `public/config.js`. That is acceptable **only** because row-level security protects every table (section 3).
      Evidence:
- [ ] Every key that can spend money has a hard spending cap, or its account has no payment method.
      Evidence:
- [ ] If a key was ever committed or pasted into a chat, I revoked it and made a new one.
      Evidence:

## 2. Browser vs server (what the public can see)

- [ ] I opened my live site, used DevTools → **Sources** and **Network**, and found no secrets.
      Evidence:
- [ ] My server routes check their input (type, length) before using it.
      Evidence:
- [ ] My server route that calls a paid or rate-limited API has a limit (e.g. maximum input length, friendly error on rate limit).
      Evidence:

## 3. Database and authorization (skip if no database)

- [ ] Row-level security (RLS) is **enabled on every table**.
      Evidence:
- [ ] Every table that grants access to `anon` or `authenticated` has RLS on and at least one policy.
      Evidence (the grants and policies in `supabase/policies.sql`):
- [ ] I never fixed a "permission denied" error with a bare grant to `anon`. Grants and RLS policies were added together.
      Evidence:
- [ ] I tried to read and change data I should not have access to, using only the publishable key, and it failed.
      Evidence:
- [ ] I can say, in one sentence, **where authorization is enforced** in my app:
      > "[one sentence]"
- [ ] The Supabase secret key is not used anywhere in front-end code, and I use the publishable and secret keys, not the legacy `anon` / `service_role` keys.
      Evidence:

## 4. User input on the page

- [ ] Anything a user types is displayed with `textContent` (or safely escaped), not `innerHTML`.
      Evidence (search results for `innerHTML`):
- [ ] I tested with `<img src=x onerror=alert(1)>` as input and no alert appeared.
      Evidence:

## 5. Dependencies

- [ ] Every package in `package.json` is one the plan named, pinned to an exact version. I checked each on npmjs.com: it exists, has real downloads and a real repository.
      Evidence:
- [ ] `npm audit` reports no high or critical issues (or I explained why they don't apply). It works because the starter commits a `package-lock.json`: keep that file in the repository.
      Evidence:

## 6. AI agents and tools

- [ ] My `AGENTS.md` has a **Scope** section and tells agents never to read `.env` or run destructive commands. (That file is advice, not enforcement; the items below are what actually protect the project.)
- [ ] Approvals stayed on in every agent session. I never used autopilot or skip-permissions modes.
- [ ] No agent created a public repository, gist, release, deployment or post without my approval.
- [ ] I read every rules file, skill, plugin, MCP server config and script I copied from the internet, and I cloned other people's projects from their URL instead of opening a folder they sent me.
- [ ] My agent setup does not combine all three of: access to private data, exposure to untrusted content, and a way to send data out (the "lethal trifecta").
      My setup has: ☐ private data ☐ untrusted content ☐ a way out
- [ ] I have a recent commit I could go back to if an agent damaged the project.

## 7. Privacy and honesty

- [ ] The app uses no real personal data about other people.
- [ ] The README says what data the app stores and where.
- [ ] PROMPTS.md honestly describes how AI was used, and AI-assisted commits carry an `Assisted-by:` line.

## What I found and fixed

| Issue | How I found it | Fix (commit) |
|---|---|---|
| | | |

## Threat model

<!-- One paragraph, written by you (🟡 AI limited: afterwards the AI may point out misuses you missed). Pick the feature most worth attacking: usually the one that saves data or calls a paid API. -->

**Feature:** [the feature]

[One paragraph. **Who** could misuse it (a curious visitor, a script using your publishable key, a classmate, a bot)? **How** (flood it, post a huge or harmful entry, read or change someone else's rows, run up your AI bill, inject a script)? **What stops them?** Point to the exact line, policy or setting. Then say what *doesn't* stop them yet: each of those is either fixed (listed in "What I found and fixed") or in your README's Known issues.]
