# skills/

Shared Claude Code skills. Each skill lives in its own subfolder:

```
skills/
  your-skill-name/
    SKILL.md          # required — frontmatter + instructions
    references/        # optional — extra docs the skill loads on demand
    scripts/            # optional — helper scripts the skill runs
    assets/              # optional — non-code files the skill uses (images, data fixtures, etc.)
    agents/              # optional — subagent config the skill relies on
```

`assets/` and `agents/` are valid, just less common — `last30days` is the
one skill here that currently uses both. Most skills only need
`SKILL.md` (+ `references/`/`scripts/` where useful).

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

## Learned technology knowledge (`knowledge-forge`)

Three skills work together to let Claude study a technology once and reuse
the result cheaply forever after, instead of re-researching it every
session:

- **`knowledge-forge`** — `/knowledge-forge <source>` studies a repo, docs
  site, local files, or video/transcript, and compiles the findings into a
  new `skills/learned-<slug>/` skill. `/knowledge-forge refresh <tech>`
  updates one incrementally; `/knowledge-forge inspect <tech>` reports its
  freshness/coverage without doing new research.
- **`developer-toolbox`** — cheap, routing-only awareness of which
  `learned-<slug>` skills exist and whether any are actually relevant to
  the current task. It never contains the technical knowledge itself.
- **`study`** — on-demand tutoring ("teach me X", "quiz me on Y") generated
  fresh from a `learned-<slug>` skill's own reference material — never a
  separate, duplicated curriculum.

Every `learned-<slug>` skill follows a fixed contract (`SKILL.md` +
`metadata.yaml` + `references/` + `research/` + `evals/`) defined in
`knowledge-forge/references/template/` — see
[`docs/planning/knowledge-system-architecture-2026-09-23.md`](../docs/planning/knowledge-system-architecture-2026-09-23.md)
for the full design rationale. `knowledge-forge` never auto-commits; it
produces files and a diff for you to review.

## Using these skills in another project

From inside a project that has this repo checked out separately, symlink the
ones you want:

```bash
ln -s /path/to/Claude-Setup/skills/your-skill-name .claude/skills/your-skill-name
```

Or copy the folder in if you'd rather not depend on the symlink. Running
[`claude-setup.sh`](../claude-setup.sh) from the target project does this
for every skill automatically.
