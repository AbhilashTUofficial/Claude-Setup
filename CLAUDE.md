# Claude-Setup

This repo is a shared, private store of Claude Code configuration for two
people (Abhilash and Jinu). It is not an application — there is nothing to
build or run. Its only purpose is to be cloned/pulled onto whatever machine
someone is working on so their skills, house rules, and credentials are
immediately available.

## Structure

- `skills/` — Claude Code skills. One subfolder per skill, each containing a
  `SKILL.md` (see `skills/README.md` for the convention). Use the
  `skill-creator` skill to add or edit skills here. Large upstream skills we
  don't want to vendor go in `skills/external.txt` instead (one `owner/repo`
  per line) — `install.sh` installs those via `npx skills add`.
- `install.sh` — the installer `/update-setup` runs after pulling the latest
  version of this repo: symlinks everything in `skills/` into
  `~/.claude/skills/`, then installs everything listed in
  `skills/external.txt`.
- `rules/` — Shared house rules and conventions we want any Claude session to
  follow, regardless of which project it's working in.
- `credentials/` — Real API keys and tokens. Treat everything in this folder
  as a live secret.
- `config/` — Shared Claude Code settings (`settings.json`, `.mcp.json`
  templates) meant to be copied or symlinked into a project's `.claude/`.

## Working in this repo

- This repo holds real secrets in `credentials/`. Never print their contents
  into a public/shared context, never commit from here to a public repo, and
  never suggest making this repo public.
- When adding a new skill, follow the existing folder convention in
  `skills/` and prefer the `skill-creator` skill over writing `SKILL.md` by
  hand.
- When adding a new token/credential, add it to `credentials/` following the
  existing file's format, and note in `credentials/README.md` what service
  it's for and where to get a new one if it needs rotating.
