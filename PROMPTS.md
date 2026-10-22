# PROMPTS.md — how I used AI on this project

> This log is required in every project. It is how you show your process, and it is part of your grade.
> Keep it honest and short. You do not need to log every message, only the ones that mattered.
> This file is public: no keys, no personal information, no classmates' names. Never paste API keys or your `.env` file into a prompt, or into this log.
> Replace every [square-bracket placeholder].

**Project:** [Project name] · **Tools used:** [for example: GitHub Copilot agent mode and CLI in a Codespace, Gemini API]

> Agent weeks: log every agent task. Commit **before** and **after** each one, and record both commits.

## Log

<!-- Copy this block for each significant prompt or session. Newest at the bottom. -->

### [date] — [what I was trying to do]

- **Tool:** [assistant or agent, and mode, for example: Copilot agent mode, plan first]
- **Prompt** (copy it in, or paste a share link to the chat if the tool makes one):

  ```text
  Goal:
  Context:
  Constraints:
  Done when:
  ```

- **The plan it proposed, and what I changed in it:** [one or two lines]
- **Check first:** [the test I wrote or asked for BEFORE the code, in its own prompt, and its failing (red) run]
- **What happened:** [Did it work? What did the AI get wrong? Did it claim success before the tests passed?]
- **Test evidence:** [the passing (green) run, for example "tests 12, pass 12"]
- **What I changed or checked myself:** [for example: read the diff, fixed a variable name by hand, tested with an empty input]
- **Teach-back** (🔴 AI off; written before you commit the code): [2–3 sentences in your own words: what changed, and why it works.]
- **Commits:** before [hash] · after [hash]

## Goldfish test

<!-- Week 6: paste only SPEC.md into a fresh chat. What would it build? What did it have to ask or guess? -->

- **Questions it asked or wrong guesses it made:** [at least two]
- **What I changed in SPEC.md because of them:** [the revision]

## AGENTS.md trial

<!-- Week 6 homework, 🔴 AI off for these notes. -->

| Task | Lines of AGENTS.md that applied | Followed? (yes / partly / no) | Evidence |
|---|---|---|---|
| 1. [the task] | [e.g. "plan first", "run npm test"] | [yes / partly / no] | [quote what the agent said or did] |
| 2. [the probe] | [the line you probed] | [yes / partly / no] | [quote] |

**One change I made to AGENTS.md:** [what you changed, and why]
**What actually stopped it, or would have:** [e.g. the approval prompt, the Codespace, my save point]

## Ownership statement: what I wrote or decided myself

<!-- Required for every submission, and graded. What did YOU write, decide or change? Be specific. -->

- **I wrote:** [code, tests or spec sections I wrote by hand]
- **I decided:** [design choices, what to build and what to leave out, AI suggestions I rejected and why]
- **I changed or fixed:** [bugs I found myself, AI-written code I rewrote]

## The `Assisted-by:` line

When AI helped with a commit, end the commit message with a blank line and an `Assisted-by:` line naming the tool (required from week 6):

```text
Add weekly summary chart

Assisted-by: GitHub Copilot (agent mode)
```

## What I'd prompt differently next time

-
