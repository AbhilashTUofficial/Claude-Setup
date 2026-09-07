# skills/

Shared Claude Code skills. Each skill lives in its own subfolder:

```
skills/
  your-skill-name/
    SKILL.md          # required — frontmatter + instructions
    references/        # optional — extra docs the skill loads on demand
    scripts/            # optional — helper scripts the skill runs
```

`SKILL.md` needs YAML frontmatter with at least:

```yaml
---
name: your-skill-name
description: One or two sentences covering what it does AND when it should trigger.
---
```

The `description` is what Claude uses to decide when to invoke the skill, so
be specific about triggers (keywords, situations), not just what the skill
produces.

## Adding a skill

Prefer using the `skill-creator` skill (`/skill-creator` in a Claude Code
session) rather than writing `SKILL.md` by hand — it also handles testing
and description tuning.

## Using these skills in another project

From inside a project that has this repo checked out separately, symlink the
ones you want:

```bash
ln -s /path/to/Claude-Setup/skills/your-skill-name .claude/skills/your-skill-name
```

Or copy the folder in if you'd rather not depend on the symlink. Running
[`claude-setup.sh`](../claude-setup.sh) from the target project does this
for every skill automatically.
