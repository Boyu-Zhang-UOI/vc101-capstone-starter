# SECURITY_CHECKLIST.md

> Complete this before you ship (week 7) and again before the Project Fair (week 8).
> For each item, tick it **and** write one line of evidence: a command's output, a file name, a screenshot link.
> AI models write insecure code about 45% of the time in independent tests, and newer models have not improved. Checking is your job.

**Project:** <name> · **Checked by:** <you> · **Date:** <date>

## 1. Secrets

- [ ] No API keys, passwords or tokens appear anywhere in the repository, **including old commits**.
      Evidence (`npm run check:secrets` output):
- [ ] `.env` is listed in `.gitignore`, and `.env.example` contains only placeholder values.
      Evidence:
- [ ] Secret keys are used only in server code (`api/` and `lib/`), never in `public/`.
      Evidence (where does each key live?):
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
- [ ] I tried to read and change data I should not have access to, using only the public (publishable) key, and it failed.
      Evidence:
- [ ] I can say, in one sentence, **where authorization is enforced** in my app:
      > "…"
- [ ] The secret / service-role key is not used anywhere in front-end code.
      Evidence:

## 4. User input on the page

- [ ] Anything a user types is displayed with `textContent` (or safely escaped), not `innerHTML`.
      Evidence (search results for `innerHTML`):
- [ ] I tested with `<img src=x onerror=alert(1)>` as input and no alert appeared.
      Evidence:

## 5. Dependencies

- [ ] Every package in `package.json` is one I meant to install. I checked each on npmjs.com: it exists, has real downloads and a real repository.
      Evidence:
- [ ] `npm audit` reports no high or critical issues (or I explained why they don't apply).
      Evidence:

## 6. AI agents and tools

- [ ] My `AGENTS.md` tells agents never to read `.env` or run destructive commands.
- [ ] I read every rules file, MCP server config and script I copied from the internet.
- [ ] My agent setup does not combine all three of: access to private data, exposure to untrusted content, and a way to send data out (the "lethal trifecta").
      My setup has: ☐ private data ☐ untrusted content ☐ a way out
- [ ] I have a recent commit I could go back to if an agent damaged the project.

## 7. Privacy and honesty

- [ ] The app uses no real personal data about other people.
- [ ] The README says what data the app stores and where.
- [ ] PROMPTS.md honestly describes how AI was used.

## What I found and fixed

| Issue | How I found it | Fix (commit) |
|---|---|---|
| | | |
