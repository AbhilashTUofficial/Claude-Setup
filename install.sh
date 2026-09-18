#!/usr/bin/env bash
# Installer for this repo — this is what the `update-setup` skill runs after
# pulling the latest version, and it's safe to run by hand too.
#
# 1. Symlinks every vendored skill in skills/ into ~/.claude/skills/.
# 2. Installs every external (non-vendored) skill listed in
#    skills/external.txt via its own upstream installer.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_SKILLS_DIR="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"

mkdir -p "$CLAUDE_SKILLS_DIR"

# --- Local skills (vendored in this repo) -----------------------------------
for skill_dir in "$REPO_DIR"/skills/*/; do
  name="$(basename "$skill_dir")"
  [ -f "$skill_dir/SKILL.md" ] || continue
  ln -sfn "$skill_dir" "$CLAUDE_SKILLS_DIR/$name"
  echo "linked   $name -> $CLAUDE_SKILLS_DIR/$name"
done

# --- External skills (installed fresh from their own upstream repo) --------
external_list="$REPO_DIR/skills/external.txt"
if [ -f "$external_list" ]; then
  while IFS= read -r repo || [ -n "$repo" ]; do
    repo="${repo%%#*}"                # strip trailing comments
    repo="$(echo "$repo" | xargs)"    # trim whitespace
    [ -z "$repo" ] && continue
    echo "installing external skill: $repo"
    npx --yes skills add "$repo" -g -a claude-code
  done < "$external_list"
fi

echo "done."
