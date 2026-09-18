# Claude Setup

Shared Claude Code configuration for Abhilash and Jinu — skills, house rules, and
credentials, kept in one **private** repo so either of us can pick up work on
any machine.

## The idea

1. Sit down at any machine.
2. Log in to Claude / Claude Code.
3. Clone (or pull) this repo.
4. Point Claude Code at it — skills, rules, and tokens are all there. No
   per-machine setup.

```bash
git clone git@github.com:AbhilashTUofficial/Claude-Setup.git
cd Claude-Setup
```

If you're using this repo's contents from *inside* another project, either
symlink the pieces you need into that project's `.claude/` directory, or copy
them in — see each folder's own README for the exact convention.

## Layout

| Folder | What lives there |
|---|---|
| [`skills/`](skills/) | Claude Code skills (each in its own subfolder with a `SKILL.md`); `external.txt` lists ones we install rather than vendor |
| [`rules/`](rules/) | Shared house rules / coding standards / `CLAUDE.md` conventions |
| [`credentials/`](credentials/) | API keys and tokens (Anthropic, GitHub, MCP servers, etc.) |
| [`config/`](config/) | Shared Claude Code settings (`settings.json`, MCP server configs) |
| [`install.sh`](install.sh) | Installer run by `/update-setup` — links `skills/` into `~/.claude/skills/` and installs everything in `skills/external.txt` |

## Ground rules

- **Keep this repo private.** It contains real credentials. Never fork it to
  a public account, never make it public, never paste its contents into a
  public place (issue, gist, chat with a third party, etc.).
- Only Abhilash and Jinu should have access. If that ever changes (lost
  device, offboarding, suspected leak), rotate everything in
  [`credentials/`](credentials/) immediately.
- Pull before you start working, push when you're done, so the other person
  always has the latest skills/tokens.
- Don't commit machine-specific secrets that only one of you needs (personal
  logins, etc.) — this repo is for what we *both* use.
