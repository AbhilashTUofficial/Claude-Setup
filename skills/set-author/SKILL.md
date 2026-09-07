---
name: set-author
description: "Switch which of the two shared-account users (Jinu or Abhilash) is currently active, so git commits, GitHub PRs, and Vercel deployments use that person's identity and credentials. Use on /set-author {name} or /set-auther {name}."
---

# set-author

This account is shared by two people, Abhilash and Jinu. This skill switches
which of them is the "active author" so that git commits, GitHub
commits/PRs, and Vercel deployments are attributed to and authenticated as
the right person. Treat `/set-author` and the common typo `/set-auther` as
the same command.

## Known people

| person | env var prefix |
|---|---|
| jinu | `JINU` |
| abhilash | `ABHILASH` |

To add a third person later, add a row here and nothing else changes.

## Required environment variables

For each person `<PREFIX>`, these must already exist in the session
environment (the user sets these once outside of this skill — they are NOT
something this skill prompts for or writes):

- `<PREFIX>_GIT_NAME` — full name for commit authorship
- `<PREFIX>_GIT_EMAIL` — email for commit authorship
- `<PREFIX>_GITHUB_TOKEN` — that person's GitHub personal access token (their own account, not shared)
- `<PREFIX>_VERCEL_TOKEN` — that person's Vercel personal token (their own account, not shared)

Example for Jinu: `JINU_GIT_NAME`, `JINU_GIT_EMAIL`, `JINU_GITHUB_TOKEN`, `JINU_VERCEL_TOKEN`.

## Invocation: `/set-author {name}`

1. **Parse the argument.** Strip braces/whitespace, lowercase it (`jinu`,
   `abhilash`, or aliases like `jinu's` → `jinu`). If it doesn't match a known
   person, list the known people and stop — do not guess.

2. **Validate credentials exist.** Check that all four env vars for that
   person's prefix are set and non-empty (`echo "${PREFIX}_GIT_NAME:+set}"`
   style check, or just read them and see if empty). If any are missing,
   report exactly which ones by name and stop without changing anything —
   don't partially switch. Tell the user these need to be set in the
   session/sandbox environment (not something you can fill in yourself).

3. **Set repo-local git identity** (never `--global`, since this account is
   shared and other repos or other people's work shouldn't be affected):
   ```
   git config user.name "$<PREFIX>_GIT_NAME"
   git config user.email "$<PREFIX>_GIT_EMAIL"
   ```
   Run this from the repo root. If the current directory isn't a git repo,
   ask the user which repo to apply it to, or skip this step and say so —
   don't run `git config` outside a repo.

4. **Switch GitHub auth** so commits pushed and PRs opened use that person's
   actual GitHub account (not just commit metadata):
   ```
   echo "$<PREFIX>_GITHUB_TOKEN" | gh auth login --hostname github.com --with-token
   gh auth setup-git
   ```
   `gh auth login --with-token` logs in as (or switches to, if already
   logged in previously) the account that token belongs to. `gh auth
   setup-git` wires git's push/pull credential helper to gh's currently
   active account, so plain `git push` and `gh pr create` both end up
   authenticated as this person without needing the token passed around
   separately. Verify with `gh auth status` and report the logged-in
   username back to the user.

5. **Verify Vercel token** (see limitation note below):
   ```
   vercel whoami --token "$<PREFIX>_VERCEL_TOKEN"
   ```
   Report which Vercel account/team this resolves to. Do not run `vercel
   login` (that would persist one global CLI session and fight with the
   other person's token); every Vercel CLI command for the rest of this
   session should instead pass `--token "$<PREFIX>_VERCEL_TOKEN"` explicitly
   — see step 7.

6. **Persist the active-author marker.** Write the lowercase person name (and
   a timestamp) to `.git/claude-author` in the current repo:
   ```
   printf '%s\n%s\n' "<person>" "$(date -Is)" > .git/claude-author
   ```
   `.git/` is never tracked by git itself, so this never risks being
   committed. This file holds only a name, never secrets — actual
   credentials always stay in env vars and are looked up by prefix when
   needed. If there's no git repo, fall back to `~/.claude-current-author`.

7. **Report back** a short confirmation: active person, git identity
   (`Name <email>`), GitHub account verified, Vercel account/team verified.
   Do not print token values.

## Invocation with no argument: `/set-author`

Read `.git/claude-author` (or the fallback path) and report who's currently
active and when it was set. If the file doesn't exist, say no author is set
yet and show the two valid options.

## Contract for all later git/GitHub/Vercel actions in this session

Once an author has been set, every subsequent action of these kinds must
respect it:

- **Before any `git commit`**: confirm `.git/claude-author` exists and its
  git config still matches (`git config user.email` equals the active
  person's `<PREFIX>_GIT_EMAIL`). If no author has been set at all, ask the
  user to run `/set-author {name}` first rather than committing under
  whatever default identity happens to be configured.
- **Before any `gh pr create` / `git push` to GitHub**: rely on step 4's
  `gh auth setup-git` wiring — don't re-pass tokens manually. If
  `.git/claude-author` says one person but `gh auth status` shows a
  different active account, re-run step 4 for the marker's person before
  proceeding, since something (e.g. another tool) changed gh's active
  account out from under this repo.
- **Before any Vercel CLI deployment**: read the active person from
  `.git/claude-author`, look up `<PREFIX>_VERCEL_TOKEN`, and pass it
  explicitly: `vercel deploy --token "$<PREFIX>_VERCEL_TOKEN" --yes` (or
  the equivalent flag for whatever vercel subcommand is being run). Never
  assume a prior `vercel login` session is still the right account.

## Important limitation: the connected Vercel integration tool

This session may have `mcp__Vercel__*` tools available (deploy, list
projects, etc.) through a connected integration. That integration is tied to
whichever single Vercel account was used to connect it — it is **not**
switchable per-person by this skill. If the active author's Vercel work needs
to happen under their own separate Vercel account, use the `vercel` CLI with
their `<PREFIX>_VERCEL_TOKEN` (per the contract above) instead of the
`mcp__Vercel__*` tools, and mention this to the user so they aren't surprised
when a deployment via the connected tool lands in the wrong account.