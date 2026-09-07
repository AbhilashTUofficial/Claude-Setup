```bash
#!/usr/bin/env bash
# claude-setup.sh — one command, sets up everything.
#
# Usage:
#   ./claude-setup.sh                  # wires skills/config into ~/.claude
#   ./claude-setup.sh /some/path       # wires into /some/path/.claude
#
# Safe to re-run — existing files/symlinks in the target are left alone.
#
# Skills are discovered automatically from:
#   ./skills/<skill-name>/SKILL.md
#
# This means adding a new skill such as:
#   ./skills/project-boundary/SKILL.md
#
# requires no changes to this script.

set -euo pipefail

SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---------------------------------------------------------------------------
# Target
# ---------------------------------------------------------------------------

TARGET_INPUT="${1:-$HOME}"

if [ ! -d "$TARGET_INPUT" ]; then
  echo "Error: target directory does not exist:"
  echo "  $TARGET_INPUT"
  exit 1
fi

TARGET_DIR="$(cd "$TARGET_INPUT" && pwd)"
CLAUDE_DIR="$TARGET_DIR/.claude"

echo "Claude Setup"
echo "  source: $SETUP_DIR"
echo "  target: $CLAUDE_DIR"
echo

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

link_or_copy() {
  local src="$1"
  local dest="$2"

  if [ -e "$dest" ] || [ -L "$dest" ]; then
    echo "  skip (already exists): $dest"
    return
  fi

  mkdir -p "$(dirname "$dest")"

  if ln -s "$src" "$dest" 2>/dev/null; then
    echo "  linked: $dest -> $src"
  else
    cp -r "$src" "$dest"
    echo "  copied (symlink unavailable): $dest"
  fi
}

# ---------------------------------------------------------------------------
# Claude directory
# ---------------------------------------------------------------------------

mkdir -p "$CLAUDE_DIR"

# ---------------------------------------------------------------------------
# Skills
#
# Every directory under ./skills containing SKILL.md is installed.
#
# Example:
#
#   skills/
#   ├── gather-context/
#   │   └── SKILL.md
#   └── project-boundary/
#       └── SKILL.md
#
# becomes:
#
#   ~/.claude/skills/
#   ├── gather-context -> <setup>/skills/gather-context
#   └── project-boundary -> <setup>/skills/project-boundary
# ---------------------------------------------------------------------------

echo "Skills:"
mkdir -p "$CLAUDE_DIR/skills"

found=0

for skill in "$SETUP_DIR"/skills/*/; do
  [ -f "$skill/SKILL.md" ] || continue

  found=1

  skill_name="$(basename "${skill%/}")"

  link_or_copy \
    "${skill%/}" \
    "$CLAUDE_DIR/skills/$skill_name"
done

if [ "$found" -eq 0 ]; then
  echo "  (none yet)"
fi

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

echo
echo "Config:"

did_config=0

if [ -f "$SETUP_DIR/config/settings.json" ]; then
  link_or_copy \
    "$SETUP_DIR/config/settings.json" \
    "$CLAUDE_DIR/settings.json"

  did_config=1
fi

if [ -f "$SETUP_DIR/config/mcp.json" ]; then
  link_or_copy \
    "$SETUP_DIR/config/mcp.json" \
    "$CLAUDE_DIR/mcp.json"

  did_config=1
fi

if [ "$did_config" -eq 0 ]; then
  echo "  (none yet)"
fi

# ---------------------------------------------------------------------------
# Rules
#
# Rules are intentionally NOT copied or linked automatically.
# ---------------------------------------------------------------------------

if [ -f "$SETUP_DIR/rules/shared-rules.md" ]; then
  echo
  echo "Rules aren't linked automatically."
  echo "Add this to $TARGET_DIR/CLAUDE.md:"
  echo
  echo "  See also: $SETUP_DIR/rules/shared-rules.md for our general conventions."
fi

# ---------------------------------------------------------------------------
# Credentials
#
# Credentials are NEVER copied or linked.
# ---------------------------------------------------------------------------

if [ -f "$SETUP_DIR/credentials/tokens.env" ]; then
  echo
  echo "Credentials aren't linked automatically."
  echo "To load them into your shell:"
  echo
  echo "  export \$(grep -v '^#' '$SETUP_DIR/credentials/tokens.env' | xargs)"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

echo
echo "Done."
echo "Claude configuration is available at:"
echo "  $CLAUDE_DIR"
```
