#!/usr/bin/env bash
# claude-setup.sh — one command, sets up everything.
#
# Usage:
#   ./claude-setup.sh              # wires skills/config into ~/.claude (global, default)
#   ./claude-setup.sh /some/path   # wires into /some/path/.claude instead
#
# Safe to re-run — existing files/symlinks in the target are left alone.

set -euo pipefail

SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$(cd "${1:-$HOME}" && pwd)"
CLAUDE_DIR="$TARGET_DIR/.claude"

link_or_copy() {
  local src="$1" dest="$2"
  if [ -e "$dest" ] || [ -L "$dest" ]; then
    echo "  skip (already exists): $dest"
    return
  fi
  mkdir -p "$(dirname "$dest")"
  if ln -s "$src" "$dest" 2>/dev/null; then
    echo "  linked: $dest -> $src"
  else
    cp -r "$src" "$dest"
    echo "  copied (symlink unavailable here): $dest"
  fi
}

echo "Claude Setup -> $CLAUDE_DIR"

# --- skills: one symlink per skill subfolder -------------------------------
if [ -d "$SETUP_DIR/skills" ]; then
  echo "Skills:"
  mkdir -p "$CLAUDE_DIR/skills"
  found=0
  for skill in "$SETUP_DIR"/skills/*/; do
    [ -f "$skill/SKILL.md" ] || continue
    found=1
    link_or_copy "${skill%/}" "$CLAUDE_DIR/skills/$(basename "$skill")"
  done
  [ "$found" -eq 1 ] || echo "  (none yet)"
fi

# --- config: settings.json / mcp.json --------------------------------------
echo "Config:"
did_config=0
if [ -f "$SETUP_DIR/config/settings.json" ]; then
  link_or_copy "$SETUP_DIR/config/settings.json" "$CLAUDE_DIR/settings.json"
  did_config=1
fi
if [ -f "$SETUP_DIR/config/mcp.json" ]; then
  link_or_copy "$SETUP_DIR/config/mcp.json" "$CLAUDE_DIR/mcp.json"
  did_config=1
fi
[ "$did_config" -eq 1 ] || echo "  (none yet)"

# --- rules: referenced, never auto-copied -----------------------------------
if [ -f "$SETUP_DIR/rules/shared-rules.md" ]; then
  echo
  echo "Rules aren't linked automatically — add this to $TARGET_DIR/CLAUDE.md:"
  echo "  See also: $SETUP_DIR/rules/shared-rules.md for our general conventions."
fi

# --- credentials: never copied, just show how to load them -----------------
if [ -f "$SETUP_DIR/credentials/tokens.env" ]; then
  echo
  echo "Credentials aren't linked automatically. To load them into your shell:"
  echo "  export \$(grep -v '^#' '$SETUP_DIR/credentials/tokens.env' | xargs)"
fi

echo
echo "Done."
