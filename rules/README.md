# rules/

Shared house rules — conventions we want to hold across every project, not
just one repo. Project-specific rules still belong in that project's own
`CLAUDE.md`; put something here only if both of us want it everywhere.

- `shared-rules.md` — general working conventions (git, commits, style).

## Using these in another project

Either paste the relevant section into that project's `CLAUDE.md`, or
reference this file from it, e.g.:

```markdown
See also: ~/Claude-Setup/rules/shared-rules.md for our general conventions.
```

[`claude-setup.sh`](../claude-setup.sh) prints this reference line for you
instead of copying the file — rules are meant to be read and adapted per
project, not silently linked in.
