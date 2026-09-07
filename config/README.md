# config/

Shared Claude Code configuration meant to be copied or symlinked into a
project's `.claude/` folder (or `~/.claude/` for machine-wide defaults).

- `settings.json` — shared permission/hook defaults.
- `mcp.json` — shared MCP server definitions. Reference tokens from
  `../credentials/tokens.env` rather than hardcoding them here (e.g. via
  `${ANTHROPIC_API_KEY}`-style env expansion, if the MCP client you're using
  supports it) so a token rotation only has to happen in one place.

## Using these

```bash
# machine-wide
ln -s ~/Claude-Setup/config/settings.json ~/.claude/settings.json

# or per-project
ln -s ~/Claude-Setup/config/settings.json ./.claude/settings.json
```

Only symlink what you actually want applied everywhere — a project with its
own `.claude/settings.json` should usually keep that instead.

[`claude-setup.sh`](../claude-setup.sh) does the per-project symlink for
you, but skips it if the target project already has its own
`.claude/settings.json` or `.claude/mcp.json`.
