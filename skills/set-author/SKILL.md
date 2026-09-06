---
name: set-author
description: "Switch which of the two shared-account users (Jinu or Abhilash) — and which GitHub account of theirs, personal or company — is currently active, so git commits, GitHub PRs, and Vercel deployments use the right identity and credentials. Use on /set-author {name} or /set-auther {name}."
---

# set-author

This account is shared by two people, Abhilash and Jinu, and each of them
has **two** GitHub accounts: a personal one and a company one. This skill
switches which person *and* which of their GitHub accounts is the "active
author" so that git commits, GitHub commits/PRs, and Vercel deployments are
attributed to and authenticated as the right identity. Treat `/set-author`
and the common typo `/set-auther` as the same command.

## Known accounts

| account | person | github kind | env var prefix |
|---|---|---|---|
| jinu-personal | jinu | personal | `JINU_PERSONAL` |
| jinu-company | jinu | company | `JINU_COMPANY` |
| abhilash-personal | abhilash | personal | `ABHILASH_PERSONAL` |
| abhilash-company | abhilash | company | `ABHILASH_COMPANY` |

To add a third person later, add two rows (personal + company) here and
nothing else changes. If a person ever gets a third GitHub account (e.g. a
second company), add one more row the same way — the rest of this skill is
written in terms of "account", not a hardcoded personal/company pair.

## Required environment variables

For each **account** `<PREFIX>` (e.g. `JINU_COMPANY`), these must already
exist in the session environment (the user sets these once outside of this
skill — they are NOT something this skill prompts for or writes):

- `<PREFIX>_GIT_NAME` — full name for commit authorship on this account
- `<PREFIX>_GIT_EMAIL` — email for commit authorship on this account
- `<PREFIX>_GITHUB_TOKEN` — this GitHub account's personal access token

Example for Jinu's company account: `JINU_COMPANY_GIT_NAME`,
`JINU_COMPANY_GIT_EMAIL`, `JINU_COMPANY_GITHUB_TOKEN`.

Vercel stays scoped to the **person**, not the GitHub account (one Vercel
identity per person, shared across their personal/company GitHub work), so
it uses the base person prefix instead:

- `<PERSON>_VERCEL_TOKEN` — that person's Vercel personal token (their own
  account, not shared). Example: `JINU_VERCEL_TOKEN`.

## Invocation: `/set-author {name}`

1. **Parse the argument into a person and a github kind.** Lowercase and
   strip braces/whitespace/possessives (`jinu's` → `jinu`). Recognize:
   - person: `jinu` / `abhilash` (and obvious aliases)
   - github kind: `personal` (aliases: `private`, `personal-github`) or
     `company` (aliases: `work`, `org`, `company-github`, a company/team
     name you recognize as theirs)

   Accept these forms: `jinu personal`, `jinu-personal`, `jinu company`,
   `abhilash work`, etc. — person and kind in either order, space or hyphen
   separated.

   - If person **and** kind are both given and match a row in Known
     accounts, that row is the target account.
   - If only a person is given with no kind (e.g. `/set-author jinu`), do
     **not** guess which of their two GitHub accounts is meant — ask which
     one (personal or company) and stop.
   - If the person doesn't match anyone known, list the known accounts and
     stop — do not guess.

2. **Validate credentials exist.** For the target account's prefix, check
   that `<PREFIX>_GIT_NAME`, `<PREFIX>_GIT_EMAIL`, and `<PREFIX>_GITHUB_TOKEN`
   are all set and non-empty, and that the person's `<PERSON>_VERCEL_TOKEN`
   is set too. If any are missing, report exactly which ones by name and
   stop without changing anything — don't partially switch. Tell the user
   these need to be set in the session/sandbox environment (not something
   you can fill in yourself).

3. **Set repo-local git identity** (never `--global`, since this account is
   shared and other repos or other people's work shouldn't be affected):
   ```
   git config user.name "$<PREFIX>_GIT_NAME"
   git config user.email "$<PREFIX>_GIT_EMAIL"
   ```
   Run this from the repo root. If the current directory isn't a git repo,
   ask the user which repo to apply it to, or skip this step and say so —
   don't run `git config` outside a repo.

4. **Switch GitHub auth** so commits pushed and PRs opened use that
   account's actual GitHub login (not just commit metadata):
   ```
   echo "$<PREFIX>_GITHUB_TOKEN" | gh auth login --hostname github.com --with-token
   gh auth setup-git
   ```
   `gh auth login --with-token` logs in as (or switches to, if already
   logged in previously) whichever GitHub account that token belongs to —
   the person's personal account or their company account, per the token
   used. `gh auth setup-git` wires git's push/pull credential helper to
   gh's currently active account, so plain `git push` and `gh pr create`
   both end up authenticated this way without needing the token passed
   around separately. Verify with `gh auth status` and report the
   logged-in username back to the user.

5. **Verify Vercel token** (see limitation note below). Vercel is
   person-scoped, so derive `<PERSON>` from the target account (e.g.
   `jinu-company` → `JINU`):
   ```
   vercel whoami --token "$<PERSON>_VERCEL_TOKEN"
   ```
   Report which Vercel account/team this resolves to. Do not run `vercel
   login` (that would persist one global CLI session and fight with the
   other person's token); every Vercel CLI command for the rest of this
   session should instead pass `--token "$<PERSON>_VERCEL_TOKEN"` explicitly
   — see step 7.

6. **Persist the active-author marker.** Write the account id (e.g.
   `jinu-company`) and a timestamp to `.git/claude-author` in the current
   repo:
   ```
   printf '%s\n%s\n' "<account>" "$(date -Is)" > .git/claude-author
   ```
   `.git/` is never tracked by git itself, so this never risks being
   committed. This file holds only the account id, never secrets — actual
   credentials always stay in env vars and are looked up by prefix when
   needed. If there's no git repo, fall back to `~/.claude-current-author`.

7. **Report back** a short confirmation: active account (person + github
   kind), git identity (`Name <email>`), GitHub account verified, Vercel
   account/team verified. Do not print token values.

## Invocation with no argument: `/set-author`

Read `.git/claude-author` (or the fallback path) and report which account is
currently active (person + github kind) and when it was set. If the file
doesn't exist, say no author is set yet and show the known accounts.

## Contract for all later git/GitHub/Vercel actions in this session

Once an author has been set, every subsequent action of these kinds must
respect it:

- **Before any `git commit`**: confirm `.git/claude-author` exists and its
  git config still matches (`git config user.email` equals the active
  account's `<PREFIX>_GIT_EMAIL`). If no author has been set at all, ask the
  user to run `/set-author {name}` first rather than committing under
  whatever default identity happens to be configured.
- **Before any `gh pr create` / `git push` to GitHub**: rely on step 4's
  `gh auth setup-git` wiring — don't re-pass tokens manually. If
  `.git/claude-author` says one account but `gh auth status` shows a
  different active login, re-run step 4 for the marker's account before
  proceeding, since something (e.g. another tool) changed gh's active
  account out from under this repo. This matters even more now that each
  person has two GitHub logins — a stale `gh auth status` might be the
  *right person's wrong account* (e.g. their personal login when the marker
  says company), not just the wrong person.
- **Before any Vercel CLI deployment**: read the active account from
  `.git/claude-author`, derive `<PERSON>` from it, look up
  `<PERSON>_VERCEL_TOKEN`, and pass it explicitly:
  `vercel deploy --token "$<PERSON>_VERCEL_TOKEN" --yes` (or the equivalent
  flag for whatever vercel subcommand is being run). Never assume a prior
  `vercel login` session is still the right account.

## Important limitation: the connected Vercel integration tool

This session may have `mcp__Vercel__*` tools available (deploy, list
projects, etc.) through a connected integration. That integration is tied to
whichever single Vercel account was used to connect it — it is **not**
switchable per-person by this skill. If the active author's Vercel work needs
to happen under their own separate Vercel account, use the `vercel` CLI with
their `<PERSON>_VERCEL_TOKEN` (per the contract above) instead of the
`mcp__Vercel__*` tools, and mention this to the user so they aren't surprised
when a deployment via the connected tool lands in the wrong account.