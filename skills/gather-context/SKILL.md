---
name: gather-context
description: "Deep, read-only codebase reconnaissance that builds durable understanding of a project before any implementation work — repo structure, tech stack, architecture, auth/data flow, testing gaps, and docs-vs-reality discrepancies. Invoke as \"/gather-context\" or \"/gather-context {project-name}\"."
---

# Gather Context

Understand first, modify second. This skill produces a grounded picture of a codebase — what it actually does, how it's actually built, and what's actually risky — so that subsequent feature work, bug fixes, refactors, reviews, or architecture changes are made with real information instead of assumptions. It does **not** write or modify any product code. Its two outputs are: a Final Context Summary shown to the user, and a small number of durable memory entries for facts that would otherwise have to be re-discovered every session.

`{project-name}` is optional. If given, it scopes or labels the analysis (e.g. one app in a monorepo, or a specific service). If omitted, analyze the current working directory / git repo root.

## Ground rules

- **Read-only.** No edits, no `git commit`, no `npm install`, nothing that changes repo state. If a command needs write access to run (e.g. a codegen step), skip it and note that you couldn't verify that path.
- **Evidence over convention.** Don't assume an architecture pattern, a framework's defaults, or what a folder name implies. Read the actual implementation. When a doc/comment and the code disagree, the code wins — say so explicitly.
- **No new files in the repo.** The summary goes in your chat response; only genuinely durable findings go to memory (see step 6). Don't create a `CONTEXT.md` or planning doc unless the user asks for one.
- **Stack-agnostic.** Everything below is written for "a manifest file" / "a migration" / "a route" in the abstract — substitute whatever the actual stack uses (`package.json`/`go.mod`/`Cargo.toml`/`pyproject.toml`, Django/Rails/Next.js/Spring routes, Alembic/Flyway/Drizzle migrations, etc.). Don't force a codebase into a pattern it doesn't use.

## Workflow

### 1. Orient

Check the working directory, git status, git log, and branch (`git status`, `git log --oneline -20`, `git branch -a`). This tells you whether you're looking at a clean checkout or one with significant in-flight work, which matters for how you frame findings later (don't report someone's half-finished refactor as "the architecture"). If `{project-name}` was given and the repo is a monorepo, find that project's subtree now.

If this account/environment uses the `set-author` skill's shared-identity convention (multiple people share one account and switch git/GitHub/Vercel identity between them), check it here, before anything else: look for `.git/claude-author` in the repo. If it's missing, or the person it names doesn't match the repo's current `git config user.email`, surface this immediately in your response — something like "No active author is set for this repo (or it doesn't match who's configured) — run `/set-author {name}` before anything gets committed, pushed, or opened as a PR here, so work doesn't end up under the wrong person's identity." This costs one file read and prevents a real, easy-to-make mistake on a shared account. It's a heads-up, not a blocker: keep going with the rest of the read-only analysis either way. If the environment has no such convention (single-user account, no `set-author` skill in play), skip this check entirely — don't invent the file or the concept.

### 2. Repo discovery

Read the root manifest(s), lockfile, README, CI config, env-var example file, and any build/test/lint/db config — these are cheap, high-signal, and tell you the real toolchain before you go read source. Then map the top-level structure: apps/services/packages, frontend, backend, database, infra, tests, scripts, docs. Don't assume every repo has the same shape as the last one you saw.

### 3. Stack & architecture

Identify the language(s), framework(s), and the *architecturally load-bearing* libraries (state management, data fetching, auth, validation, DB access, routing, testing) — not an exhaustive dependency dump; call out only the ones that matter for how the system is built. Then determine the actual architecture pattern from evidence (layered, feature/domain-sliced, MVC, modular monolith, microservices, event-driven, etc.). If the codebase has its own documented convention — a lint rule enforcing module boundaries, a "slice contract," a required folder shape — find it and follow it in everything you report; don't impose a generic pattern on top of it.

### 4. Core workflows & data flow

Trace 2-4 representative end-to-end flows: a real user action from UI/entrypoint through business logic to persistence and back, plus any async paths (webhooks, queues, cron/scheduled jobs) if present. The goal is a narrative you could hand to a new engineer — "a brand creates a campaign, which does X, calls Y, writes Z" — not a file listing.

### 5. Auth & other security-sensitive areas

Trace authentication and authorization end to end: how identity is established, how sessions/tokens work, how role or permission checks actually gate protected code paths, and how the database enforces authorization if it does (row-level security or equivalent). This is the one area where you should go beyond "does a mechanism exist" to "does it actually hold" — for any access-control claim (a policy, a comment saying something is guarded, a doc claiming a bug was fixed), open the current file and check it yourself. A comment saying something is safe is a claim, not evidence. If you find something that looks like a currently-live, currently-reachable gap, verify it as concretely as you can (the specific policy/check and why it doesn't hold) before reporting it — a confirmed, cited finding is far more useful than a vague worry, and an unconfirmed suspicion should be labeled as such, not stated as fact.

### 6. Testing & CI

Map what's tested and what isn't, and what CI actually gates (type-check, lint, unit tests, e2e, security scans — and which of those are advisory vs blocking). The interesting question isn't just coverage percentage, it's *correlation with risk*: does test coverage track the parts of the system where a bug would be expensive (money, auth, data integrity), or is it incidental — whoever touched a module last added a test for their change? State which one you observed, with evidence (which modules are tested, which aren't, and whether that split lines up with risk).

### 7. Reconcile docs against reality

Treat existing docs (READMEs beyond the root, audit reports, planning docs, architecture write-ups, code comments describing system-wide state) as *historical hypotheses*, not ground truth — codebases drift and docs don't always follow. Where a doc makes a specific, checkable claim ("this is deployed on X," "this bug was fixed," "this feature doesn't exist yet"), spot-check it against the current code/config/migrations before repeating it. Note dated/stale docs explicitly (a written date far from today, or content that clearly predates recent commits) and flag any discrepancy you find between what a doc says and what the code actually does — this is often one of the most valuable findings in the whole pass, and it protects the user from being told something confidently wrong.

### 8. Parallelize when the codebase is large

If mapping the system would take many sequential reads (a large app with several distinct areas — routing/UI, domain logic, auth, a high-risk subsystem, tests/CI), don't do it all serially. Launch independent research areas as background subagents in one batch, each with a **fully self-contained prompt** — a fresh subagent shares none of your context, so give it the project's purpose, the relevant background you already have, exactly what to map, and to report back dense/structured findings rather than prose (file:line citations, bullet lists, tables — not a narrative essay). While they run, keep doing the highest-value work yourself: read the most load-bearing files directly (schema, core config, root routing), and do the specific verification from step 5 and step 7 that benefits from your own eyes on the current file. Synthesize everything once the subagents report back; don't duplicate what you delegated.

If the codebase is small enough to map directly in a normal number of tool calls, just do that — parallel subagents are a scaling tool, not a default.

### 9. Memory discipline

Check whether this environment has a persistent memory system (a memory directory the system prompt describes, or an equivalent). If it does, write to it — but selectively. Save only what's durable, non-obvious, and would otherwise have to be rediscovered by re-reading the code: a verified live security gap, confirmation that certain docs are stale and by how much, a specific critical-but-untested subsystem, a missing index/migration, an important cross-cutting convention that isn't visible from a file listing. **Do not** save things trivially re-derivable from the code itself next time — full file/folder layout, the dependency list, the architecture pattern's name, anything a `Read` or `Glob` would immediately reproduce. If the memory system has typed categories (e.g. project/feedback/user/reference) or an index file, follow those conventions rather than inventing new ones, and update the index. If no memory system exists in this environment, skip this step — don't invent a local file for it.

### 10. Final Context Summary

Present this once, structured, in your chat response — not as a new repo file:

```
## Project Overview
## Technology Stack
## Architecture
## Core Workflows
## Data Flow
## Important Locations       (critical / important / supporting, with why)
## Testing
## Risks                     (only things you verified as currently live — not repeated stale claims)
## Technical Debt
## Development Conventions
## Unknowns
## Working Rules             (for whoever picks up work here next)
```

Throughout, distinguish **Confirmed** (you read the actual current file/config and it says so), **Inferred** (strong evidence from multiple sources but not directly read), and **Unknown** (you couldn't determine it — say what would resolve it). Never let an inference read as a confirmed fact. Skip a section entirely rather than padding it if the codebase genuinely has nothing notable there (e.g. a tiny script repo doesn't need an "Auth" risk section).

### 11. Close with targeted questions — not implementation

After the summary, look for genuine gaps: things only the user can resolve because they're not visible in code at all — what to prioritize next, whether the system is live/production or still pre-launch (this changes how urgently to frame risk findings), whether in-progress or uncommitted work is safe to build on or is being actively edited elsewhere, business/roadmap context that explains *why* something is built the way it is. Ask about those specifically, in a small number of well-chosen questions (2-4, not an interrogation) — don't ask anything answerable by reading more code yourself. Do not start implementing anything from this pass unless the user's answers direct you to; this skill's job ends at understanding, confirmed and shared.