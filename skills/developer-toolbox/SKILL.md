---
name: developer-toolbox
description: "Cheaply reports what technologies already have compiled learned-* knowledge in this repo (from knowledge-forge), and helps decide whether any of it is actually relevant to the current task — without forcing a known tool onto a problem it doesn't fit. Use on /developer-toolbox, or automatically when picking between libraries/approaches, or when the user asks what's already known about a technology."
argument-hint: "[topic or technology, optional]"
---

# developer-toolbox

This skill answers two cheap questions: **what's already known**, and **is any of it actually worth loading for this task**. It never contains the actual technical knowledge itself — that lives in each `learned-<slug>` skill, written and maintained by `knowledge-forge`. This skill only routes.

## What to do

1. Read `references/catalog.md`. It's one row per `learned-<slug>` skill: technology, purpose, primary use cases, an explicit anti-use-case, version studied, and freshness. If it says no technologies are learned yet, say so plainly and point at `/knowledge-forge <source>` rather than guessing at what might exist.

2. Shortlist zero, one, or a small handful of rows that are genuinely relevant to the current task — not everything that's tangentially related. Comparing multiple rows against each other (e.g. two libraries that solve overlapping problems) is exactly this skill's value; a single learned skill's own one-line description can't do that on its own.

3. **Default toward not invoking a learned skill.** Every `learned-<slug>` skill Claude attaches competes for the same 25,000-token combined re-attach budget shared across all currently-attached skills — being selective isn't just good judgment, it's protecting a shared, limited resource. Possessing knowledge about a technology is not a reason to use it; problem fit comes first. If the catalog's anti-use-case line for a row matches the current task, say so and don't invoke that skill.

4. If something looks relevant, tell the user which `learned-<slug>` skill to look at (or invoke it directly if the task clearly calls for it) rather than paraphrasing the catalog row as if it were the actual technical answer — the catalog is a pointer, not a substitute for the real reference material.

5. If a relevant row's `freshness` is `aging` or `stale`, say so and suggest `/knowledge-forge refresh <technology>` before leaning on it for anything version-sensitive.

## Relationship to `/skill-doctor`

Claude Code's built-in `/skill-doctor` reports skill usage and context cost across *all* installed skills, not just learned ones — use it (or suggest it) for "which skills are bloating context," since this skill is not a reimplementation of that. `developer-toolbox` is scoped specifically to routing among compiled technical knowledge.
