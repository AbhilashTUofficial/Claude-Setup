# credentials/

Real API keys and tokens, so neither of us has to re-generate them on every
new machine. This only works safely if a few rules are followed:

## Rules

- **This repo must stay private.** Everything here is a live secret in
  plaintext. If GitHub ever shows this repo (or a fork of it) as public,
  treat every token in this folder as compromised and rotate all of them
  immediately.
- Only add people to this repo who should have access to *all* of these
  tokens — there's no per-file access control.
- If a laptop/device with a clone of this repo is lost or stolen, rotate
  everything here.
- Don't screenshot, paste, or echo this folder's contents into any
  third-party tool, chat, or ticket.
- When a token is no longer needed (cancelled service, rotated key), delete
  it from here and commit that removal — don't leave stale live tokens
  lying around.

## Format

One file per token, or grouped by service — whatever's easiest to scan.
`tokens.env` is the default catch-all: standard `KEY=value` lines, one per
service, with a comment above each explaining what it's for and where to get
a new one.

## Loading these into a session/project

```bash
export $(grep -v '^#' ~/Claude-Setup/credentials/tokens.env | xargs)
```

Or reference the file path directly from a project's own env loading (e.g.
`.env` symlinked to a specific line, or a project's setup script sourcing
this file).

[`claude-setup.sh`](../claude-setup.sh) never copies or symlinks anything
from this folder — it only prints the `export` command above, so secrets
never leave this repo's working copy.
